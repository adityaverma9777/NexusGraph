import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger
from config import get_settings

router = APIRouter()

class BriefingRequest(BaseModel):
    entity_id: str
    context_node_ids: list[str] = []

SYSTEM_PROMPT = """You are an intelligence analyst for a multi-domain risk platform called NexusGraph.
You produce structured, evidence-based intelligence briefings in the style of professional geopolitical
and epidemiological analysis. Speak with precision. Acknowledge uncertainty. Use confidence levels.
Never speculate beyond the data provided. Output ONLY valid JSON following the schema exactly."""

def build_prompt(entity_id: str, node: dict, related: list[dict]) -> str:
    related_lines = "\n".join(
        f"  [{e.get('relationship', 'RELATES_TO')}] → {n.get('entity_type', '')} "
        f"in {n.get('properties', {}).get('country', 'Unknown')} "
        f"(confidence: {e.get('confidence', 0.5)})"
        for n, e in related
    )
    return f"""Produce an intelligence briefing for the following observed system state.

PRIMARY ENTITY:
- ID: {entity_id}
- Type: {node.get('entity_type', 'Unknown')}
- Domain: {node.get('domain', 'Unknown')}
- Label: {node.get('label', entity_id)}
- Severity: {node.get('severity', 5.0)} / 10
- Valid From: {node.get('valid_from', 'Unknown')}
- Properties: {json.dumps(node.get('properties', {}), indent=2)}

CONNECTED ENTITIES ({len(related)} nodes within 2 hops):
{related_lines or "  None found"}

OUTPUT JSON FORMAT:
{{
    "headline": "One-line intelligence headline (max 100 chars)",
    "classification": "UNCLASSIFIED // FOR DEMONSTRATION",
    "situation_summary": "2-3 sentence current situation assessment",
    "contributing_factors": ["factor 1", "factor 2", "factor 3"],
    "downstream_risks": [
        {{"risk": "...", "domain": "...", "probability": "HIGH|MEDIUM|LOW", "timeframe": "weeks|months|years"}}
    ],
    "confidence_assessment": "HIGH|MEDIUM|LOW — brief reason",
    "data_gaps": ["gap 1", "gap 2"],
    "recommended_monitoring": ["monitor 1", "monitor 2"]
}}"""

@router.post("/briefing")
async def api_generate_briefing(req: BriefingRequest):
    settings = get_settings()
    if not settings.groq_api_key:
        return _fallback_briefing(req.entity_id)
    try:
        from groq import AsyncGroq
        from graph.traversal import get_node
        payload = await get_node(req.entity_id)
        if not payload or not payload.nodes:
            raise HTTPException(status_code=404, detail="Node not found")
        node = payload.nodes[0].model_dump()
        related = [(n.model_dump(), e.model_dump()) for n, e in zip(payload.nodes[1:], payload.edges[:10])]
        prompt = build_prompt(req.entity_id, node, related)
        client = AsyncGroq(api_key=settings.groq_api_key)
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content
        return json.loads(content)
    except Exception as exc:
        logger.error(f"Briefing generation failed: {exc}")
        return _fallback_briefing(req.entity_id)

def _fallback_briefing(entity_id: str) -> dict:
    return {
        "headline": f"Intelligence briefing unavailable — configure GROQ_API_KEY",
        "classification": "UNCLASSIFIED // FOR DEMONSTRATION",
        "situation_summary": "Connect the Groq API key to generate real AI-powered intelligence briefings using LLaMA 3.3 70B. The system is configured and ready.",
        "contributing_factors": [
            "Groq API key not configured",
            "Backend is running and connected",
            "Set GROQ_API_KEY in .env to activate",
        ],
        "downstream_risks": [],
        "confidence_assessment": "N/A — API not configured",
        "data_gaps": ["Groq API key"],
        "recommended_monitoring": ["Configure GROQ_API_KEY in backend/.env"],
    }
