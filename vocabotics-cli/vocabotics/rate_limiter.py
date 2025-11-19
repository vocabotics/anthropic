"""
Rate Limiting
Prevents API abuse and manages concurrent requests
"""

import time
from typing import Dict, Optional
from collections import defaultdict, deque
from datetime import datetime


class RateLimiter:
    """Token bucket rate limiter"""

    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        """
        Initialize rate limiter

        Args:
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, deque] = defaultdict(deque)

    def is_allowed(self, identifier: str) -> bool:
        """
        Check if request is allowed

        Args:
            identifier: Unique identifier (user_id, IP, etc.)

        Returns:
            True if request is allowed
        """
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old requests
        while self.requests[identifier] and self.requests[identifier][0] < window_start:
            self.requests[identifier].popleft()

        # Check limit
        if len(self.requests[identifier]) >= self.max_requests:
            return False

        # Record request
        self.requests[identifier].append(now)
        return True

    def get_remaining(self, identifier: str) -> int:
        """Get remaining requests for identifier"""
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old requests
        while self.requests[identifier] and self.requests[identifier][0] < window_start:
            self.requests[identifier].popleft()

        return max(0, self.max_requests - len(self.requests[identifier]))

    def get_reset_time(self, identifier: str) -> float:
        """Get time until rate limit resets"""
        if not self.requests[identifier]:
            return 0

        oldest_request = self.requests[identifier][0]
        reset_time = oldest_request + self.window_seconds
        return max(0, reset_time - time.time())


class AdaptiveRateLimiter:
    """Adaptive rate limiter that adjusts based on system load"""

    def __init__(self, base_max_requests: int = 100, window_seconds: int = 60):
        self.base_max_requests = base_max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.system_load = 0.5  # 0.0 to 1.0

    def set_system_load(self, load: float) -> None:
        """
        Set current system load

        Args:
            load: System load from 0.0 (idle) to 1.0 (overloaded)
        """
        self.system_load = max(0.0, min(1.0, load))

    def get_current_limit(self) -> int:
        """Get current request limit based on system load"""
        # Reduce limit when system is under load
        multiplier = 1.0 - (self.system_load * 0.5)  # Reduce up to 50% at full load
        return int(self.base_max_requests * multiplier)

    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed with adaptive limiting"""
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old requests
        while self.requests[identifier] and self.requests[identifier][0] < window_start:
            self.requests[identifier].popleft()

        # Check current limit
        current_limit = self.get_current_limit()
        if len(self.requests[identifier]) >= current_limit:
            return False

        # Record request
        self.requests[identifier].append(now)
        return True


class ConcurrencyLimiter:
    """Limit concurrent operations"""

    def __init__(self, max_concurrent: int = 10):
        """
        Initialize concurrency limiter

        Args:
            max_concurrent: Maximum concurrent operations
        """
        self.max_concurrent = max_concurrent
        self.current_count: Dict[str, int] = defaultdict(int)

    def acquire(self, identifier: str) -> bool:
        """
        Try to acquire a slot

        Args:
            identifier: Resource identifier

        Returns:
            True if slot acquired
        """
        if self.current_count[identifier] >= self.max_concurrent:
            return False

        self.current_count[identifier] += 1
        return True

    def release(self, identifier: str) -> None:
        """Release a slot"""
        if self.current_count[identifier] > 0:
            self.current_count[identifier] -= 1

    def get_current(self, identifier: str) -> int:
        """Get current concurrent operations"""
        return self.current_count[identifier]

    def get_available(self, identifier: str) -> int:
        """Get available slots"""
        return max(0, self.max_concurrent - self.current_count[identifier])


# Global instances
_rate_limiter = None
_concurrency_limiter = None


def get_rate_limiter(max_requests: int = 100, window_seconds: int = 60) -> RateLimiter:
    """Get global rate limiter"""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter(max_requests, window_seconds)
    return _rate_limiter


def get_concurrency_limiter(max_concurrent: int = 10) -> ConcurrencyLimiter:
    """Get global concurrency limiter"""
    global _concurrency_limiter
    if _concurrency_limiter is None:
        _concurrency_limiter = ConcurrencyLimiter(max_concurrent)
    return _concurrency_limiter
