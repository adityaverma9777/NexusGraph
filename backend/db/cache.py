from functools import wraps
from typing import Any, Callable
import json
from loguru import logger
from config import get_settings

_redis_client = None

def _get_client():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    settings = get_settings()
    if not settings.upstash_redis_url:
        return None
    try:
        import redis
        _redis_client = redis.from_url(
            settings.upstash_redis_url,
            password=settings.upstash_redis_token or None,
            decode_responses=True,
            socket_timeout=2,
        )
        _redis_client.ping()
        logger.info("Redis cache connected")
        return _redis_client
    except Exception as exc:
        logger.warning(f"Redis unavailable, caching disabled: {exc}")
        return None

def cache_get(key: str) -> Any | None:
    client = _get_client()
    if not client:
        return None
    try:
        raw = client.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None

def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    client = _get_client()
    if not client:
        return
    try:
        client.set(key, json.dumps(value, default=str), ex=ttl)
    except Exception:
        pass

def cache_delete(pattern: str) -> None:
    client = _get_client()
    if not client:
        return
    try:
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
    except Exception:
        pass

def cached(ttl: int = 300, key_prefix: str = "ng"):
    def decorator(fn: Callable):
        @wraps(fn)
        async def wrapper(*args, **kwargs):
            key_parts = [key_prefix, fn.__name__] + [str(a) for a in args] + [f"{k}={v}" for k, v in sorted(kwargs.items())]
            cache_key = ":".join(key_parts)
            hit = cache_get(cache_key)
            if hit is not None:
                return hit
            result = await fn(*args, **kwargs)
            if result is not None:
                cache_set(cache_key, result, ttl=ttl)
            return result
        return wrapper
    return decorator
