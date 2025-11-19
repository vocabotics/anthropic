"""
File-based storage for project data
Stores all data as JSON files in project directory
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime


class FileStorage:
    """File-based storage manager"""

    def __init__(self, base_dir: str = "projects"):
        """Initialize storage with base directory"""
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)

    def create_project(self, project_name: str) -> str:
        """Create a new project directory structure"""
        project_dir = self.base_dir / project_name
        if project_dir.exists():
            raise ValueError(f"Project '{project_name}' already exists")

        # Create directory structure
        project_dir.mkdir()
        (project_dir / ".vocabotics").mkdir()
        (project_dir / "artifacts").mkdir()
        (project_dir / "src").mkdir()
        (project_dir / "reports").mkdir()

        # Initialize project config
        config = {
            "name": project_name,
            "created_at": datetime.now().isoformat(),
            "version": "1.0.0"
        }
        self.save_config(project_name, config)

        # Initialize state
        state = {
            "project_id": project_name,
            "current_state": "vision_input",
            "metadata": {},
            "history": []
        }
        self.save_state(project_name, state)

        # Initialize AI calls log
        self.save_ai_calls(project_name, [])

        return str(project_dir)

    def get_project_dir(self, project_name: str) -> Path:
        """Get project directory path"""
        project_dir = self.base_dir / project_name
        if not project_dir.exists():
            raise ValueError(f"Project '{project_name}' not found")
        return project_dir

    def save_config(self, project_name: str, config: Dict[str, Any]) -> None:
        """Save project configuration"""
        project_dir = self.get_project_dir(project_name)
        config_path = project_dir / ".vocabotics" / "config.json"
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)

    def load_config(self, project_name: str) -> Dict[str, Any]:
        """Load project configuration"""
        project_dir = self.get_project_dir(project_name)
        config_path = project_dir / ".vocabotics" / "config.json"
        with open(config_path, "r") as f:
            return json.load(f)

    def save_state(self, project_name: str, state: Dict[str, Any]) -> None:
        """Save project state"""
        project_dir = self.get_project_dir(project_name)
        state_path = project_dir / ".vocabotics" / "state.json"
        with open(state_path, "w") as f:
            json.dump(state, f, indent=2)

    def load_state(self, project_name: str) -> Dict[str, Any]:
        """Load project state"""
        project_dir = self.get_project_dir(project_name)
        state_path = project_dir / ".vocabotics" / "state.json"
        with open(state_path, "r") as f:
            return json.load(f)

    def save_artifact(self, project_name: str, artifact_type: str,
                     content: Dict[str, Any], version: Optional[int] = None) -> None:
        """
        Save artifact (PRD, Architecture, etc.)

        Args:
            project_name: Project name
            artifact_type: Type of artifact (prd, architecture, schema, etc.)
            content: Artifact content as dict
            version: Optional version number for versioning
        """
        project_dir = self.get_project_dir(project_name)
        artifacts_dir = project_dir / "artifacts"

        # Determine filename
        if version:
            filename = f"{artifact_type}.v{version}.json"
        else:
            filename = f"{artifact_type}.json"

        artifact_path = artifacts_dir / filename

        # Save artifact
        with open(artifact_path, "w") as f:
            json.dump(content, f, indent=2)

        # Update latest symlink or copy
        latest_path = artifacts_dir / f"{artifact_type}.latest.json"
        with open(latest_path, "w") as f:
            json.dump(content, f, indent=2)

    def load_artifact(self, project_name: str, artifact_type: str,
                     version: Optional[int] = None) -> Dict[str, Any]:
        """Load artifact"""
        project_dir = self.get_project_dir(project_name)
        artifacts_dir = project_dir / "artifacts"

        # Determine filename
        if version:
            filename = f"{artifact_type}.v{version}.json"
        else:
            filename = f"{artifact_type}.json"

        artifact_path = artifacts_dir / filename

        if not artifact_path.exists():
            raise ValueError(f"Artifact '{artifact_type}' not found")

        with open(artifact_path, "r") as f:
            return json.load(f)

    def save_ai_calls(self, project_name: str, calls: list) -> None:
        """Save AI calls log"""
        project_dir = self.get_project_dir(project_name)
        calls_path = project_dir / ".vocabotics" / "ai_calls.jsonl"
        with open(calls_path, "w") as f:
            for call in calls:
                f.write(json.dumps(call) + "\n")

    def append_ai_call(self, project_name: str, call: Dict[str, Any]) -> None:
        """Append AI call to log"""
        project_dir = self.get_project_dir(project_name)
        calls_path = project_dir / ".vocabotics" / "ai_calls.jsonl"
        with open(calls_path, "a") as f:
            f.write(json.dumps(call) + "\n")

    def load_ai_calls(self, project_name: str) -> list:
        """Load AI calls log"""
        project_dir = self.get_project_dir(project_name)
        calls_path = project_dir / ".vocabotics" / "ai_calls.jsonl"

        if not calls_path.exists():
            return []

        calls = []
        with open(calls_path, "r") as f:
            for line in f:
                if line.strip():
                    calls.append(json.loads(line))
        return calls

    def save_report(self, project_name: str, report_type: str,
                   content: Dict[str, Any]) -> None:
        """Save quality/compliance report"""
        project_dir = self.get_project_dir(project_name)
        reports_dir = project_dir / "reports"

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{report_type}_{timestamp}.json"
        report_path = reports_dir / filename

        with open(report_path, "w") as f:
            json.dump(content, f, indent=2)

        # Also save as latest
        latest_path = reports_dir / f"{report_type}.latest.json"
        with open(latest_path, "w") as f:
            json.dump(content, f, indent=2)

    def list_projects(self) -> list:
        """List all projects"""
        projects = []
        for item in self.base_dir.iterdir():
            if item.is_dir() and (item / ".vocabotics").exists():
                projects.append(item.name)
        return sorted(projects)

    def get_project_summary(self, project_name: str) -> Dict[str, Any]:
        """Get project summary"""
        config = self.load_config(project_name)
        state = self.load_state(project_name)
        ai_calls = self.load_ai_calls(project_name)

        # Calculate total cost
        total_cost = sum(call.get("cost_usd", 0) for call in ai_calls)

        return {
            "name": config["name"],
            "created_at": config["created_at"],
            "current_state": state["current_state"],
            "total_ai_calls": len(ai_calls),
            "total_cost_usd": total_cost
        }
