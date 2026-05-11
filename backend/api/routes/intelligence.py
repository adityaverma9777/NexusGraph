import json
from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel, Field
from config import get_settings
from db.supabase_client import get_supabase

router = APIRouter()

class BriefingRequest(BaseModel):
    entity_id: str = Field(alias="entityId")
    context_node_ids: list[str] = Field(default_factory=list, alias="contextNodes")
    as_of: str | None = Field(default=None, alias="date")

    model_config = {"populate_by_name": True}

SYSTEM_PROMPT = """You are an intelligence analyst for a multi-domain risk platform called NexusGraph.
You produce structured, evidence-based intelligence briefings in the style of professional geopolitical
and epidemiological analysis. Speak with precision. Acknowledge uncertainty. Use confidence levels.
Never speculate beyond the data provided. Output ONLY valid JSON following the schema exactly."""

def build_prompt(entity_id: str, node: dict, related: list[tuple[dict, dict]], metrics: list[dict], context_nodes: list[dict]) -> str:
    related_lines = "\n".join(
        f"  [{edge.get('relationship', 'RELATES_TO')}] -> {peer.get('entity_type', '')} "
        f"in {peer.get('properties', {}).get('country', peer.get('properties', {}).get('origin_country', 'Unknown'))} "
        f"(confidence: {edge.get('confidence', 0.5)})"
        for peer, edge in related
    )
    context_lines = "\n".join(
        f"  - {item.get('label', item.get('id', 'Unknown'))} | {item.get('entity_type', 'Unknown')} | {item.get('domain', 'Unknown')}"
        for item in context_nodes
    )
    metrics_blob = json.dumps(metrics[-12:], indent=2)
    return f"""Produce an intelligence briefing for the following observed system state.

PRIMARY ENTITY:
- ID: {entity_id}
- Type: {node.get('entity_type', 'Unknown')}
- Domain: {node.get('domain', 'Unknown')}
- Label: {node.get('label', entity_id)}
- Severity: {node.get('severity', 5.0)} / 10
- Valid From: {node.get('valid_from', 'Unknown')}
- Properties: {json.dumps(node.get('properties', {}), indent=2)}

RECENT METRICS:
{metrics_blob}

CONNECTED ENTITIES ({len(related)} nodes within 2 hops):
{related_lines or "  None found"}

SELECTION CONTEXT:
{context_lines or "  None provided"}

INSTRUCTION:
If selection context is present, explain the selected relationship's downstream impact across economy, education, defense, medicine, people, infrastructure, and any other directly affected domains. Prefer explicit causal chains and identify the most likely second-order effects.
For each downstream risk, include a numeric confidence_score from 0 to 100, an impact_score from 0 to 100, and a short pathway array with 3 to 5 ordered steps that make the causal chain explicit.
Whenever possible, cite the strongest numeric values from the metrics snapshot directly in the narrative so the output reads like a quantified assessment rather than a generic summary.

OUTPUT JSON FORMAT:
{{
    "headline": "One-line intelligence headline (max 100 chars)",
    "classification": "UNCLASSIFIED // FOR DEMONSTRATION",
    "situation_summary": "2-3 sentence current situation assessment",
    "contributing_factors": ["factor 1", "factor 2", "factor 3"],
    "downstream_risks": [
        {{"risk": "...", "domain": "...", "probability": "HIGH|MEDIUM|LOW", "confidence_score": 0, "impact_score": 0, "timeframe": "weeks|months|years", "pathway": ["step 1", "step 2", "step 3"]}}
    ],
    "confidence_assessment": "HIGH|MEDIUM|LOW - brief reason",
    "data_gaps": ["gap 1", "gap 2"],
    "recommended_monitoring": ["monitor 1", "monitor 2"]
}}"""

def _build_metrics_context(node: dict) -> list[dict]:
    client = get_supabase()
    props = node.get("properties", {}) or {}
    country_code = props.get("country_code") or props.get("origin_country") or props.get("country")
    if not isinstance(country_code, str) or len(country_code.strip()) != 3:
        entity_type = node.get("entity_type", "")
        if node.get("domain") == "meta" and entity_type in {"Country", "CountryProfile"}:
            node_id = node.get("id", "")
            label = node.get("label", "")
            if isinstance(node_id, str) and node_id.startswith("country:"):
                country_code = node_id.split(":", 1)[1]
            elif isinstance(label, str) and len(label.strip()) == 3:
                country_code = label.strip()

    query = (
        client.table("metrics")
        .select("valid_from,metric_value,entity_type,country_code,source_dataset")
        .order("valid_from", desc=False)
        .limit(24)
    )
    if isinstance(country_code, str) and len(country_code.strip()) == 3:
        query = query.eq("country_code", country_code.strip().upper())
    else:
        query = query.eq("entity_type", node.get("entity_type", ""))
    rows = query.execute().data or []
    return [
        {
            "date": row.get("valid_from"),
            "value": row.get("metric_value"),
            "entity_type": row.get("entity_type"),
            "country_code": row.get("country_code"),
            "source_dataset": row.get("source_dataset"),
        }
        for row in rows
    ]

async def _call_hf(prompt: str, settings) -> str:
    import httpx
    full_prompt = f"<s>[INST] {SYSTEM_PROMPT}\n\n{prompt} [/INST]"
    url = f"https://api-inference.huggingface.co/models/{settings.hf_model}"
    headers = {"Authorization": f"Bearer {settings.hf_token}"}
    payload = {
        "inputs": full_prompt,
        "parameters": {
            "max_new_tokens": 1024,
            "temperature": 0.3,
            "return_full_text": False,
        },
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
    if isinstance(data, list):
        text = data[0].get("generated_text", "")
    else:
        text = data.get("generated_text", "")
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON object found in HF response")
    return text[start:end]

async def _call_groq(prompt: str, settings) -> str:
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.groq_api_key)
    completion = await client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=1024,
        response_format={"type": "json_object"},
    )
    return completion.choices[0].message.content

@router.post("/briefing")
async def api_generate_briefing(req: BriefingRequest):
    settings = get_settings()
    entity_id = req.entity_id
    if not settings.hf_token and not settings.groq_api_key:
        raise HTTPException(status_code=503, detail="No AI provider configured (HF_TOKEN or GROQ_API_KEY required)")
    try:
        from graph.traversal import expand_node
        payload = await expand_node(entity_id, hops=2, min_confidence=0.3, as_of=req.as_of)
        if not payload.nodes:
            raise HTTPException(status_code=404, detail="Node not found")
        node = next((item.model_dump(by_alias=False) for item in payload.nodes if item.id == entity_id), payload.nodes[0].model_dump(by_alias=False))
        related_nodes = [item.model_dump(by_alias=False) for item in payload.nodes if item.id != node["id"]]
        related_edges = [item.model_dump(by_alias=False) for item in payload.edges]
        context_nodes = [item.model_dump(by_alias=False) for item in payload.nodes if item.id in req.context_node_ids]
        related_pairs: list[tuple[dict, dict]] = []
        for edge in related_edges[:10]:
            peer_id = edge["target"] if edge["source"] == node["id"] else edge["source"]
            peer = next((item for item in related_nodes if item["id"] == peer_id), None)
            if peer:
                related_pairs.append((peer, edge))
        metrics = _build_metrics_context(node)
        prompt = build_prompt(entity_id, node, related_pairs, metrics, context_nodes)
        content = None
        if settings.hf_token:
            try:
                content = await _call_hf(prompt, settings)
                logger.info("Briefing generated via HuggingFace")
            except Exception as hf_exc:
                logger.warning(f"HF briefing failed, falling back to Groq: {hf_exc}")
        if content is None and settings.groq_api_key:
            content = await _call_groq(prompt, settings)
            logger.info("Briefing generated via Groq fallback")
        if content is None:
            raise HTTPException(status_code=502, detail="All AI providers failed or unavailable")
        return json.loads(content)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Briefing generation failed: {exc}")
        raise HTTPException(status_code=502, detail="Briefing generation failed")
