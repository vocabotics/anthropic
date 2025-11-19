"""
Feature Flag System
Enables/disables features dynamically without code deployment
"""

import json
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime


class FeatureFlags:
    """Feature flag management system"""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize feature flags"""
        if config_path:
            self.config_path = Path(config_path)
        else:
            self.config_path = Path.home() / ".vocabotics" / "feature_flags.json"

        self.flags = self._load_flags()

    def _load_flags(self) -> Dict[str, Any]:
        """Load feature flags from config file"""
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                return json.load(f)
        else:
            # Default flags
            default_flags = {
                "vector_search": {
                    "enabled": False,
                    "description": "Enable semantic search for similar projects",
                    "rollout_percentage": 0
                },
                "advanced_analytics": {
                    "enabled": True,
                    "description": "Show advanced analytics in reports",
                    "rollout_percentage": 100
                },
                "code_optimization": {
                    "enabled": True,
                    "description": "AI-powered code optimization suggestions",
                    "rollout_percentage": 100
                },
                "visual_testing": {
                    "enabled": True,
                    "description": "Screenshot-based visual regression testing",
                    "rollout_percentage": 100
                },
                "auto_deploy": {
                    "enabled": False,
                    "description": "Automatic deployment to preview environments",
                    "rollout_percentage": 0
                },
                "collaboration": {
                    "enabled": False,
                    "description": "Multi-user collaboration features",
                    "rollout_percentage": 0
                },
                "ai_code_review": {
                    "enabled": True,
                    "description": "Automated AI code review",
                    "rollout_percentage": 100
                },
                "cost_optimization": {
                    "enabled": True,
                    "description": "AI call cost optimization",
                    "rollout_percentage": 100
                },
                "export_to_github": {
                    "enabled": True,
                    "description": "Export generated code to GitHub",
                    "rollout_percentage": 100
                }
            }

            self._save_flags(default_flags)
            return default_flags

    def _save_flags(self, flags: Dict[str, Any]) -> None:
        """Save feature flags to config file"""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, 'w') as f:
            json.dump(flags, f, indent=2)

    def is_enabled(self, flag_name: str, user_id: Optional[str] = None) -> bool:
        """
        Check if a feature flag is enabled

        Args:
            flag_name: Name of the feature flag
            user_id: Optional user ID for gradual rollout

        Returns:
            True if feature is enabled
        """
        if flag_name not in self.flags:
            return False

        flag = self.flags[flag_name]

        if not flag.get("enabled", False):
            return False

        # Check rollout percentage
        rollout = flag.get("rollout_percentage", 100)
        if rollout >= 100:
            return True

        if user_id and rollout > 0:
            # Simple hash-based rollout
            hash_val = hash(user_id) % 100
            return hash_val < rollout

        return False

    def enable(self, flag_name: str, rollout_percentage: int = 100) -> None:
        """Enable a feature flag"""
        if flag_name in self.flags:
            self.flags[flag_name]["enabled"] = True
            self.flags[flag_name]["rollout_percentage"] = rollout_percentage
            self._save_flags(self.flags)

    def disable(self, flag_name: str) -> None:
        """Disable a feature flag"""
        if flag_name in self.flags:
            self.flags[flag_name]["enabled"] = False
            self._save_flags(self.flags)

    def set_rollout(self, flag_name: str, percentage: int) -> None:
        """Set rollout percentage for gradual feature release"""
        if flag_name in self.flags:
            self.flags[flag_name]["rollout_percentage"] = min(100, max(0, percentage))
            self._save_flags(self.flags)

    def list_flags(self) -> Dict[str, Any]:
        """List all feature flags"""
        return self.flags

    def get_flag(self, flag_name: str) -> Optional[Dict[str, Any]]:
        """Get specific flag details"""
        return self.flags.get(flag_name)


# Global instance
_feature_flags = None


def get_feature_flags() -> FeatureFlags:
    """Get global feature flags instance"""
    global _feature_flags
    if _feature_flags is None:
        _feature_flags = FeatureFlags()
    return _feature_flags


def is_feature_enabled(flag_name: str, user_id: Optional[str] = None) -> bool:
    """Quick check if feature is enabled"""
    return get_feature_flags().is_enabled(flag_name, user_id)
