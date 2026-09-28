"""Rate limiting configuration using slowapi with fallback."""
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])
except ImportError:
    class DummyLimiter:
        def limit(self, *args, **kwargs):
            def decorator(f):
                return f
            return decorator

    limiter = DummyLimiter()
