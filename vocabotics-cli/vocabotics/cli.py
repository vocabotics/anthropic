#!/usr/bin/env python3
"""
Vocabotics CLI
Lightweight Python command-line interface for AI-powered software development
"""

import os
import sys
import json
import argparse
from typing import Optional
from datetime import datetime

from .ai_client import AnthropicClient
from .storage.file_storage import FileStorage
from .state_machine import (
    ProjectStateMachine, StateMachineContext, ProjectState, TransitionTrigger
)
from .generators.prd_generator import PRDGenerator
from .generators.architecture_generator import ArchitectureGenerator
from .generators.validators import PRDValidator, ArchitectureValidator


class VocaboticsCLI:
    """Main CLI application"""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize CLI"""
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self.storage = FileStorage()
        self.state_machine = ProjectStateMachine()
        self._client = None
        self._prd_generator = None
        self._arch_generator = None

    def _ensure_client(self):
        """Ensure AI client is initialized (lazy loading)"""
        if not self._client:
            if not self.api_key:
                print("Error: ANTHROPIC_API_KEY environment variable not set")
                print("Set it with: export ANTHROPIC_API_KEY='your-key-here'")
                sys.exit(1)
            self._client = AnthropicClient(self.api_key)
            self._prd_generator = PRDGenerator(self._client)
            self._arch_generator = ArchitectureGenerator(self._client)

    def create_project(self, name: str) -> None:
        """Create a new project"""
        try:
            project_dir = self.storage.create_project(name)
            print(f"✓ Created project: {name}")
            print(f"  Location: {project_dir}")
            print(f"\nNext steps:")
            print(f"  1. vocabotics generate-prd {name} \"Your product vision here\"")
        except ValueError as e:
            print(f"Error: {e}")
            sys.exit(1)

    def list_projects(self) -> None:
        """List all projects"""
        projects = self.storage.list_projects()

        if not projects:
            print("No projects found.")
            print("\nCreate a project with: vocabotics create <project-name>")
            return

        print(f"Found {len(projects)} project(s):\n")

        for project_name in projects:
            try:
                summary = self.storage.get_project_summary(project_name)
                state_machine = ProjectStateMachine()
                state = ProjectState(summary['current_state'])
                phase = state_machine.get_phase(state)
                progress = state_machine.get_progress(state)

                print(f"  {project_name}")
                print(f"    State: {summary['current_state']}")
                print(f"    Phase: {phase} ({progress}%)")
                print(f"    AI Calls: {summary['total_ai_calls']}")
                print(f"    Cost: ${summary['total_cost_usd']:.4f}")
                print()
            except Exception as e:
                print(f"  {project_name} (error reading summary: {e})")
                print()

    def generate_prd(self, project_name: str, vision: str,
                    target_audience: Optional[str] = None,
                    key_features: Optional[str] = None,
                    constraints: Optional[str] = None) -> None:
        """Generate PRD from vision"""
        self._ensure_client()  # Ensure AI client is initialized

        print(f"Generating PRD for project: {project_name}")
        print(f"Vision: {vision}\n")

        # Load project state
        state_data = self.storage.load_state(project_name)
        context = StateMachineContext.from_dict(state_data)

        # Check state
        if context.current_state != ProjectState.VISION_INPUT:
            print(f"Warning: Project is in state {context.current_state.value}")
            print("Expected state: vision_input")
            response = input("Continue anyway? (y/n): ")
            if response.lower() != 'y':
                return

        # Transition to PRD generation
        try:
            self.state_machine.transition(context, TransitionTrigger.USER_SUBMIT, "cli")
            self.storage.save_state(project_name, context.to_dict())
        except Exception as e:
            print(f"State transition error: {e}")

        # Parse features and constraints
        features_list = [f.strip() for f in key_features.split(',')] if key_features else None
        constraints_list = [c.strip() for c in constraints.split(',')] if constraints else None

        # Generate PRD
        print("🤖 Calling AI to generate PRD... (this may take 30-60 seconds)")
        try:
            result = self._prd_generator.generate(
                vision=vision,
                project_id=project_name,
                target_audience=target_audience,
                key_features=features_list,
                constraints=constraints_list
            )

            prd = result['prd']
            metadata = result['metadata']

            # Save PRD artifact
            self.storage.save_artifact(project_name, 'prd', prd)

            # Log AI call
            ai_call = {
                **metadata,
                "timestamp": datetime.now().isoformat(),
                "task_type": "prd_generation"
            }
            self.storage.append_ai_call(project_name, ai_call)

            # Transition to PRD review
            self.state_machine.transition(context, TransitionTrigger.AI_COMPLETE, "ai")
            self.storage.save_state(project_name, context.to_dict())

            # Validate traceability
            validation = PRDValidator.validate_traceability(prd)

            # Display results
            print("\n✓ PRD generated successfully!")
            print(f"\n  Title: {prd['title']}")
            print(f"  Version: {prd['version']}")
            print(f"  Functional Requirements: {len(prd['functionalRequirements'])}")
            print(f"  Non-Functional Requirements: {len(prd['nonFunctionalRequirements'])}")
            print(f"  User Stories: {len(prd['userStories'])}")
            print(f"  Personas: {len(prd['targetAudience']['personas'])}")
            print(f"\n  Tokens: {metadata['usage']['total_tokens']:,}")
            print(f"  Cost: ${metadata['cost_usd']:.4f}")
            print(f"  Duration: {metadata['duration_ms'] / 1000:.1f}s")

            # Show validation results
            if validation['warnings']:
                print(f"\n⚠ Warnings ({len(validation['warnings'])}):")
                for warning in validation['warnings'][:5]:
                    print(f"  - {warning}")
                if len(validation['warnings']) > 5:
                    print(f"  ... and {len(validation['warnings']) - 5} more")

            if validation['errors']:
                print(f"\n❌ Errors ({len(validation['errors'])}):")
                for error in validation['errors']:
                    print(f"  - {error}")

            # Show saved location
            print(f"\n📁 Saved to: projects/{project_name}/artifacts/prd.json")
            print(f"\nNext steps:")
            print(f"  1. Review the PRD: cat projects/{project_name}/artifacts/prd.json | jq")
            print(f"  2. Generate architecture: vocabotics generate-arch {project_name}")

        except Exception as e:
            print(f"\n❌ Error generating PRD: {e}")
            # Transition to error state
            try:
                self.state_machine.transition(context, TransitionTrigger.AI_ERROR, "ai")
                self.storage.save_state(project_name, context.to_dict())
            except:
                pass
            sys.exit(1)

    def generate_architecture(self, project_name: str,
                            frontend: Optional[str] = None,
                            backend: Optional[str] = None,
                            database: Optional[str] = None) -> None:
        """Generate architecture from PRD"""
        self._ensure_client()  # Ensure AI client is initialized

        print(f"Generating Architecture for project: {project_name}\n")

        # Load PRD
        try:
            prd = self.storage.load_artifact(project_name, 'prd')
        except Exception as e:
            print(f"Error: Could not load PRD. {e}")
            print(f"Generate PRD first with: vocabotics generate-prd {project_name} \"vision\"")
            sys.exit(1)

        # Load project state
        state_data = self.storage.load_state(project_name)
        context = StateMachineContext.from_dict(state_data)

        # Check state
        if context.current_state != ProjectState.PRD_REVIEW:
            print(f"Warning: Project is in state {context.current_state.value}")
            print("Expected state: prd_review")
            response = input("Continue anyway? (y/n): ")
            if response.lower() != 'y':
                return

        # Build tech stack
        tech_stack = {
            "frontend": [f.strip() for f in frontend.split(',')] if frontend else ["React", "TypeScript", "TailwindCSS"],
            "backend": [b.strip() for b in backend.split(',')] if backend else ["Node.js", "Express", "TypeScript"],
            "database": [d.strip() for d in database.split(',')] if database else ["PostgreSQL", "Prisma"],
            "infrastructure": ["Docker", "GitHub Actions"],
            "thirdParty": []
        }

        print("Technology Stack:")
        for key, values in tech_stack.items():
            print(f"  {key}: {', '.join(values)}")
        print()

        # Transition to architecture design
        try:
            self.state_machine.transition(context, TransitionTrigger.USER_APPROVE, "cli")
            self.storage.save_state(project_name, context.to_dict())
        except Exception as e:
            print(f"State transition error: {e}")

        # Generate Architecture
        print("🤖 Calling AI to generate Architecture... (this may take 60-90 seconds)")
        try:
            result = self._arch_generator.generate(
                prd=prd,
                tech_stack=tech_stack,
                project_id=project_name
            )

            architecture = result['architecture']
            metadata = result['metadata']

            # Save architecture artifact
            self.storage.save_artifact(project_name, 'architecture', architecture)

            # Log AI call
            ai_call = {
                **metadata,
                "timestamp": datetime.now().isoformat(),
                "task_type": "architecture_generation"
            }
            self.storage.append_ai_call(project_name, ai_call)

            # Transition to architecture review
            self.state_machine.transition(context, TransitionTrigger.AI_COMPLETE, "ai")
            self.storage.save_state(project_name, context.to_dict())

            # Validate coverage
            coverage = ArchitectureValidator.validate_requirement_coverage(prd, architecture)

            # Display results
            print("\n✓ Architecture generated successfully!")
            print(f"\n  Title: {architecture['title']}")
            print(f"  Style: {architecture['overview']['architectureStyle']}")
            print(f"  Components: {len(architecture['components'])}")
            print(f"  Data Models: {len(architecture['dataModels'])}")
            print(f"  API Endpoints: {len(architecture['apiContracts'].get('endpoints', []))}")
            print(f"\n  Requirement Coverage: {coverage['coverage']:.1f}%")
            print(f"  Covered: {coverage['covered_requirements']}/{coverage['total_requirements']}")
            print(f"\n  Tokens: {metadata['usage']['total_tokens']:,}")
            print(f"  Cost: ${metadata['cost_usd']:.4f}")
            print(f"  Duration: {metadata['duration_ms'] / 1000:.1f}s")

            # Show uncovered requirements
            if coverage['uncovered_requirements']:
                print(f"\n⚠ Uncovered Requirements ({len(coverage['uncovered_requirements'])}):")
                for req_id in coverage['uncovered_requirements'][:5]:
                    print(f"  - {req_id}")
                if len(coverage['uncovered_requirements']) > 5:
                    print(f"  ... and {len(coverage['uncovered_requirements']) - 5} more")

            # Show saved location
            print(f"\n📁 Saved to: projects/{project_name}/artifacts/architecture.json")
            print(f"\nArchitecture complete! Review the generated document.")

        except Exception as e:
            print(f"\n❌ Error generating architecture: {e}")
            try:
                self.state_machine.transition(context, TransitionTrigger.AI_ERROR, "ai")
                self.storage.save_state(project_name, context.to_dict())
            except:
                pass
            sys.exit(1)

    def show_status(self, project_name: str) -> None:
        """Show project status"""
        try:
            summary = self.storage.get_project_summary(project_name)
            state = ProjectState(summary['current_state'])
            phase = self.state_machine.get_phase(state)
            progress = self.state_machine.get_progress(state)

            print(f"Project: {project_name}")
            print(f"Created: {summary['created_at']}")
            print(f"\nState: {summary['current_state']}")
            print(f"Phase: {phase}")
            print(f"Progress: {progress}%")
            print(f"\nAI Calls: {summary['total_ai_calls']}")
            print(f"Total Cost: ${summary['total_cost_usd']:.4f}")

            # Check for artifacts
            print(f"\nArtifacts:")
            try:
                self.storage.load_artifact(project_name, 'prd')
                print("  ✓ PRD")
            except:
                print("  ✗ PRD")

            try:
                self.storage.load_artifact(project_name, 'architecture')
                print("  ✓ Architecture")
            except:
                print("  ✗ Architecture")

        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Vocabotics CLI - AI-powered software development"
    )
    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # Create project
    create_parser = subparsers.add_parser('create', help='Create a new project')
    create_parser.add_argument('name', help='Project name')

    # List projects
    subparsers.add_parser('list', help='List all projects')

    # Generate PRD
    prd_parser = subparsers.add_parser('generate-prd', help='Generate PRD from vision')
    prd_parser.add_argument('project', help='Project name')
    prd_parser.add_argument('vision', help='Product vision statement')
    prd_parser.add_argument('--audience', help='Target audience')
    prd_parser.add_argument('--features', help='Key features (comma-separated)')
    prd_parser.add_argument('--constraints', help='Constraints (comma-separated)')

    # Generate Architecture
    arch_parser = subparsers.add_parser('generate-arch', help='Generate architecture from PRD')
    arch_parser.add_argument('project', help='Project name')
    arch_parser.add_argument('--frontend', help='Frontend stack (comma-separated)')
    arch_parser.add_argument('--backend', help='Backend stack (comma-separated)')
    arch_parser.add_argument('--database', help='Database stack (comma-separated)')

    # Show status
    status_parser = subparsers.add_parser('status', help='Show project status')
    status_parser.add_argument('project', help='Project name')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Initialize CLI
    cli = VocaboticsCLI()

    # Execute command
    if args.command == 'create':
        cli.create_project(args.name)
    elif args.command == 'list':
        cli.list_projects()
    elif args.command == 'generate-prd':
        cli.generate_prd(
            args.project,
            args.vision,
            target_audience=args.audience,
            key_features=args.features,
            constraints=args.constraints
        )
    elif args.command == 'generate-arch':
        cli.generate_architecture(
            args.project,
            frontend=args.frontend,
            backend=args.backend,
            database=args.database
        )
    elif args.command == 'status':
        cli.show_status(args.project)


if __name__ == '__main__':
    main()
