import time
from typing import Any, Optional, Dict, Tuple

_CACHE: Dict[str, Tuple[float, Any]] = {}

def get_cache(key: str, max_age_seconds: float = 3.0) -> Optional[Any]:
    """Retrieve item from in-memory cache if not expired."""
    if key in _CACHE:
        timestamp, value = _CACHE[key]
        if time.time() - timestamp < max_age_seconds:
            return value
        else:
            del _CACHE[key]
    return None

def set_cache(key: str, value: Any) -> None:
    """Store item in in-memory cache with current timestamp."""
    _CACHE[key] = (time.time(), value)

def invalidate_cache(prefix: Optional[str] = None) -> None:
    """Invalidate all or matching cache keys."""
    global _CACHE
    if prefix:
        _CACHE = {k: v for k, v in _CACHE.items() if not k.startswith(prefix)}
    else:
        _CACHE.clear()
