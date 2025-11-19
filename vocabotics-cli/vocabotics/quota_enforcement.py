"""
Quota Enforcement System
Tracks and enforces usage limits for projects, AI calls, and storage
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
import json


class QuotaManager:
    """Manage and enforce usage quotas"""

    # Default quota limits
    DEFAULT_QUOTAS = {
        "free": {
            "projects_per_month": 3,
            "ai_calls_per_month": 50,
            "storage_mb": 100,
            "code_files_per_project": 20,
            "max_concurrent_projects": 1
        },
        "starter": {
            "projects_per_month": 10,
            "ai_calls_per_month": 200,
            "storage_mb": 500,
            "code_files_per_project": 50,
            "max_concurrent_projects": 3
        },
        "pro": {
            "projects_per_month": 50,
            "ai_calls_per_month": 1000,
            "storage_mb": 2000,
            "code_files_per_project": 100,
            "max_concurrent_projects": 10
        },
        "enterprise": {
            "projects_per_month": -1,  # Unlimited
            "ai_calls_per_month": -1,
            "storage_mb": -1,
            "code_files_per_project": -1,
            "max_concurrent_projects": -1
        }
    }

    def __init__(self, storage_path: Optional[str] = None):
        """Initialize quota manager"""
        if storage_path:
            self.usage_file = Path(storage_path) / "usage.json"
        else:
            self.usage_file = Path.home() / ".vocabotics" / "usage.json"

        self.usage_file.parent.mkdir(parents=True, exist_ok=True)
        self.usage = self._load_usage()

    def _load_usage(self) -> Dict[str, Any]:
        """Load usage data"""
        if self.usage_file.exists():
            with open(self.usage_file, 'r') as f:
                return json.load(f)
        else:
            return {
                "plan": "free",
                "period_start": datetime.now().isoformat(),
                "projects_created": 0,
                "ai_calls_made": 0,
                "storage_used_mb": 0,
                "projects": {}
            }

    def _save_usage(self) -> None:
        """Save usage data"""
        with open(self.usage_file, 'w') as f:
            json.dump(self.usage, f, indent=2)

    def _reset_if_new_period(self) -> None:
        """Reset counters if new billing period"""
        period_start = datetime.fromisoformat(self.usage["period_start"])
        now = datetime.now()

        # Check if month has changed
        if (now.year, now.month) != (period_start.year, period_start.month):
            self.usage["period_start"] = now.isoformat()
            self.usage["projects_created"] = 0
            self.usage["ai_calls_made"] = 0
            self._save_usage()

    def get_quotas(self) -> Dict[str, int]:
        """Get quota limits for current plan"""
        plan = self.usage.get("plan", "free")
        return self.DEFAULT_QUOTAS.get(plan, self.DEFAULT_QUOTAS["free"])

    def get_usage(self) -> Dict[str, Any]:
        """Get current usage statistics"""
        self._reset_if_new_period()
        return {
            "plan": self.usage["plan"],
            "period_start": self.usage["period_start"],
            "projects_created": self.usage["projects_created"],
            "ai_calls_made": self.usage["ai_calls_made"],
            "storage_used_mb": self.usage["storage_used_mb"],
            "quotas": self.get_quotas()
        }

    def can_create_project(self) -> tuple[bool, Optional[str]]:
        """Check if user can create a new project"""
        self._reset_if_new_period()
        quotas = self.get_quotas()

        projects_limit = quotas["projects_per_month"]
        if projects_limit == -1:
            return True, None

        if self.usage["projects_created"] >= projects_limit:
            return False, f"Monthly project limit reached ({projects_limit})"

        concurrent_limit = quotas["max_concurrent_projects"]
        if concurrent_limit != -1:
            active_projects = sum(1 for p in self.usage.get("projects", {}).values()
                                if not p.get("completed", False))
            if active_projects >= concurrent_limit:
                return False, f"Maximum concurrent projects limit reached ({concurrent_limit})"

        return True, None

    def can_make_ai_call(self) -> tuple[bool, Optional[str]]:
        """Check if user can make an AI call"""
        self._reset_if_new_period()
        quotas = self.get_quotas()

        ai_limit = quotas["ai_calls_per_month"]
        if ai_limit == -1:
            return True, None

        if self.usage["ai_calls_made"] >= ai_limit:
            return False, f"Monthly AI call limit reached ({ai_limit})"

        return True, None

    def record_project_creation(self, project_id: str) -> None:
        """Record a project creation"""
        self.usage["projects_created"] += 1
        if "projects" not in self.usage:
            self.usage["projects"] = {}
        self.usage["projects"][project_id] = {
            "created_at": datetime.now().isoformat(),
            "completed": False,
            "ai_calls": 0
        }
        self._save_usage()

    def record_ai_call(self, project_id: Optional[str] = None) -> None:
        """Record an AI call"""
        self.usage["ai_calls_made"] += 1
        if project_id and "projects" in self.usage and project_id in self.usage["projects"]:
            self.usage["projects"][project_id]["ai_calls"] += 1
        self._save_usage()

    def update_storage(self, size_mb: float) -> None:
        """Update storage usage"""
        self.usage["storage_used_mb"] = size_mb
        self._save_usage()

    def set_plan(self, plan_name: str) -> None:
        """Change subscription plan"""
        if plan_name in self.DEFAULT_QUOTAS:
            self.usage["plan"] = plan_name
            self._save_usage()

    def get_overage(self) -> Dict[str, Any]:
        """Calculate usage overage"""
        self._reset_if_new_period()
        quotas = self.get_quotas()

        overage = {}

        if quotas["projects_per_month"] != -1:
            over = max(0, self.usage["projects_created"] - quotas["projects_per_month"])
            if over > 0:
                overage["projects"] = over

        if quotas["ai_calls_per_month"] != -1:
            over = max(0, self.usage["ai_calls_made"] - quotas["ai_calls_per_month"])
            if over > 0:
                overage["ai_calls"] = over

        if quotas["storage_mb"] != -1:
            over = max(0, self.usage["storage_used_mb"] - quotas["storage_mb"])
            if over > 0:
                overage["storage_mb"] = over

        return overage


# Global instance
_quota_manager = None


def get_quota_manager() -> QuotaManager:
    """Get global quota manager instance"""
    global _quota_manager
    if _quota_manager is None:
        _quota_manager = QuotaManager()
    return _quota_manager
