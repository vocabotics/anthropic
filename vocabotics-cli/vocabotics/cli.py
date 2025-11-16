#!/usr/bin/env python3
"""
Vocabotics CLI
Lightweight Python command-line interface for AI-powered software development
"""

import os
import sys
import json
import argparse
from typing import Optional, Dict
from datetime import datetime

from .ai_client import AnthropicClient
from .storage.file_storage import FileStorage
from .state_machine import (
    ProjectStateMachine, StateMachineContext, ProjectState, TransitionTrigger
)
from .generators.prd_generator import PRDGenerator
from .generators.architecture_generator import ArchitectureGenerator
from .generators.schema_generator import SchemaGenerator
from .generators.code_generator import CodeGenerator
from .generators.test_generator import TestGenerator
from .generators.quality_analyzer import QualityAnalyzer
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
        self._schema_generator = None
        self._code_generator = None
        self._test_generator = None
        self._quality_analyzer = QualityAnalyzer()

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
            self._schema_generator = SchemaGenerator(self._client)
            self._code_generator = CodeGenerator(self._client)
            self._test_generator = TestGenerator(self._client)

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

    def generate_schema(self, project_name: str) -> None:
        """Generate Prisma schema from architecture"""
        self._ensure_client()

        print(f"Generating Schema for project: {project_name}\n")

        # Load architecture
        try:
            architecture = self.storage.load_artifact(project_name, 'architecture')
        except Exception as e:
            print(f"Error: Could not load architecture. {e}")
            sys.exit(1)

        # Generate Schema
        print("🤖 Calling AI to generate Prisma schema... (this may take 30-45 seconds)")
        try:
            result = self._schema_generator.generate(
                architecture=architecture,
                project_id=project_name
            )

            schema = result['schema']
            metadata = result['metadata']

            # Save schema artifact
            self.storage.save_artifact(project_name, 'schema', schema)

            # Log AI call
            ai_call = {
                **metadata,
                "timestamp": datetime.now().isoformat(),
                "task_type": "schema_generation"
            }
            self.storage.append_ai_call(project_name, ai_call)

            print("\n✓ Schema generated successfully!")
            print(f"\n  Database: {schema.get('database', 'postgresql')}")
            print(f"  Models: {len(schema.get('models', []))}")
            print(f"\n  Tokens: {metadata['usage']['total_tokens']:,}")
            print(f"  Cost: ${metadata['cost_usd']:.4f}")
            print(f"\n📁 Saved to: projects/{project_name}/artifacts/schema.json")

        except Exception as e:
            print(f"\n❌ Error generating schema: {e}")
            sys.exit(1)

    def generate_code(self, project_name: str, component_type: str = "all") -> None:
        """Generate code (frontend/backend/all)"""
        self._ensure_client()

        print(f"Generating Code for project: {project_name}")
        print(f"Type: {component_type}\n")

        # Load architecture
        try:
            architecture = self.storage.load_artifact(project_name, 'architecture')
        except Exception as e:
            print(f"Error: Could not load architecture. {e}")
            sys.exit(1)

        generated_files = []

        # Generate frontend
        if component_type in ["frontend", "all"]:
            frontend_comps = [c['id'] for c in architecture.get('components', [])
                            if c['type'] == 'frontend'][:3]  # Limit to 3 for demo

            if frontend_comps:
                print(f"🤖 Generating frontend components... ({len(frontend_comps)} components)")
                try:
                    result = self._code_generator.generate_frontend(
                        architecture=architecture,
                        components=frontend_comps,
                        project_id=project_name
                    )
                    generated_files.extend(result['code'].get('files', []))

                    # Log AI call
                    ai_call = {
                        **result['metadata'],
                        "timestamp": datetime.now().isoformat(),
                        "task_type": "frontend_code_generation"
                    }
                    self.storage.append_ai_call(project_name, ai_call)

                    print(f"  ✓ Generated {len(result['code'].get('files', []))} frontend files")
                except Exception as e:
                    print(f"  ❌ Frontend generation failed: {e}")

        # Generate backend
        if component_type in ["backend", "all"]:
            backend_comps = [c['id'] for c in architecture.get('components', [])
                           if c['type'] == 'backend'][:3]  # Limit to 3 for demo

            if backend_comps:
                print(f"🤖 Generating backend components... ({len(backend_comps)} components)")
                try:
                    result = self._code_generator.generate_backend(
                        architecture=architecture,
                        components=backend_comps,
                        project_id=project_name
                    )
                    generated_files.extend(result['code'].get('files', []))

                    # Log AI call
                    ai_call = {
                        **result['metadata'],
                        "timestamp": datetime.now().isoformat(),
                        "task_type": "backend_code_generation"
                    }
                    self.storage.append_ai_call(project_name, ai_call)

                    print(f"  ✓ Generated {len(result['code'].get('files', []))} backend files")
                except Exception as e:
                    print(f"  ❌ Backend generation failed: {e}")

        # Save all generated code
        if generated_files:
            code_artifact = {"files": generated_files}
            self.storage.save_artifact(project_name, 'code', code_artifact)

            print(f"\n✓ Code generation complete!")
            print(f"  Total files: {len(generated_files)}")
            print(f"\n📁 Saved to: projects/{project_name}/artifacts/code.json")

            # Write actual files to src/
            project_dir = self.storage.get_project_dir(project_name)
            for file_info in generated_files:
                file_path = project_dir / file_info['path'].lstrip('/')
                file_path.parent.mkdir(parents=True, exist_ok=True)
                with open(file_path, 'w') as f:
                    f.write(file_info['content'])

            print(f"  Files written to: {project_dir}/src/")

    def generate_tests(self, project_name: str) -> None:
        """Generate tests for generated code"""
        self._ensure_client()

        print(f"Generating Tests for project: {project_name}\n")

        # Load code
        try:
            code = self.storage.load_artifact(project_name, 'code')
        except Exception as e:
            print(f"Error: Could not load code. {e}")
            print(f"Generate code first with: vocabotics generate-code {project_name}")
            sys.exit(1)

        # Determine test type from code files
        has_frontend = any('.tsx' in f['path'] or '.jsx' in f['path']
                          for f in code.get('files', []))
        has_backend = any('.ts' in f['path'] and 'route' in f['path'].lower()
                         for f in code.get('files', []))

        all_test_files = []

        # Generate frontend tests
        if has_frontend:
            print("🤖 Generating frontend tests...")
            try:
                result = self._test_generator.generate_tests(
                    code_files=code,
                    test_type='frontend',
                    project_id=project_name
                )
                all_test_files.extend(result['tests'].get('testFiles', []))

                # Log AI call
                ai_call = {
                    **result['metadata'],
                    "timestamp": datetime.now().isoformat(),
                    "task_type": "frontend_test_generation"
                }
                self.storage.append_ai_call(project_name, ai_call)

                print(f"  ✓ Generated {len(result['tests'].get('testFiles', []))} test files")
            except Exception as e:
                print(f"  ❌ Frontend test generation failed: {e}")

        # Generate backend tests
        if has_backend:
            print("🤖 Generating backend tests...")
            try:
                result = self._test_generator.generate_tests(
                    code_files=code,
                    test_type='backend',
                    project_id=project_name
                )
                all_test_files.extend(result['tests'].get('testFiles', []))

                # Log AI call
                ai_call = {
                    **result['metadata'],
                    "timestamp": datetime.now().isoformat(),
                    "task_type": "backend_test_generation"
                }
                self.storage.append_ai_call(project_name, ai_call)

                print(f"  ✓ Generated {len(result['tests'].get('testFiles', []))} test files")
            except Exception as e:
                print(f"  ❌ Backend test generation failed: {e}")

        # Save tests
        if all_test_files:
            tests_artifact = {"testFiles": all_test_files}
            self.storage.save_artifact(project_name, 'tests', tests_artifact)

            print(f"\n✓ Test generation complete!")
            print(f"  Total test files: {len(all_test_files)}")
            print(f"\n📁 Saved to: projects/{project_name}/artifacts/tests.json")

    def generate_quality_report(self, project_name: str) -> None:
        """Generate quality and compliance report"""
        print(f"Generating Quality Report for project: {project_name}\n")

        # Analyze project
        report = self._quality_analyzer.analyze_project(project_name, self.storage)

        # Save report
        self.storage.save_report(project_name, 'quality', report)

        # Display results
        print("✓ Quality Report Generated\n")
        print(f"Overall Score: {report['overallScore']:.1f}/100")
        print(f"\n📊 Section Scores:")

        for section, data in report.get('sections', {}).items():
            if isinstance(data, dict) and 'score' in data:
                print(f"  {section.upper()}: {data['score']:.1f}/100")
                if data.get('issues'):
                    for issue in data['issues'][:2]:
                        print(f"    ⚠ {issue}")

        # ISO Compliance
        if 'isoCompliance' in report:
            print(f"\n🏅 ISO Compliance:")
            for std, data in report['isoCompliance'].items():
                print(f"  {std}: {data['score']:.1f}%")

        print(f"\n📁 Full report saved to: projects/{project_name}/reports/quality.latest.json")

    def run_workflow(self, project_name: str, vision: str,
                    tech_stack: Optional[Dict[str, str]] = None) -> None:
        """Run complete workflow from vision to code generation"""
        print(f"🚀 Running Complete Workflow for: {project_name}")
        print(f"Vision: {vision}\n")
        print("This will execute all steps: PRD → Architecture → Schema → Code → Tests\n")

        steps_completed = []

        try:
            # Step 1: Create project (if needed)
            try:
                self.storage.get_project_dir(project_name)
                print("✓ Project exists, continuing...\n")
            except:
                print("Step 1: Creating project...")
                self.create_project(project_name)
                steps_completed.append("create")
                print()

            # Step 2: Generate PRD
            print("Step 2: Generating PRD...")
            self.generate_prd(project_name, vision)
            steps_completed.append("prd")
            print()

            # Step 3: Generate Architecture
            print("Step 3: Generating Architecture...")
            frontend = tech_stack.get('frontend') if tech_stack else None
            backend = tech_stack.get('backend') if tech_stack else None
            database = tech_stack.get('database') if tech_stack else None
            self.generate_architecture(project_name, frontend, backend, database)
            steps_completed.append("architecture")
            print()

            # Step 4: Generate Schema
            print("Step 4: Generating Schema...")
            self.generate_schema(project_name)
            steps_completed.append("schema")
            print()

            # Step 5: Generate Code
            print("Step 5: Generating Code...")
            self.generate_code(project_name, "all")
            steps_completed.append("code")
            print()

            # Step 6: Generate Tests
            print("Step 6: Generating Tests...")
            self.generate_tests(project_name)
            steps_completed.append("tests")
            print()

            # Step 7: Quality Report
            print("Step 7: Generating Quality Report...")
            self.generate_quality_report(project_name)
            steps_completed.append("quality")
            print()

            # Summary
            print("\n" + "="*60)
            print("🎉 WORKFLOW COMPLETE!")
            print("="*60)
            print(f"\nCompleted steps: {', '.join(steps_completed)}")

            # Show final status
            print("\nFinal Status:")
            self.show_status(project_name)

        except Exception as e:
            print(f"\n❌ Workflow failed at step: {steps_completed[-1] if steps_completed else 'start'}")
            print(f"Error: {e}")
            print(f"\nCompleted steps: {', '.join(steps_completed)}")
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

    # Generate Schema
    schema_parser = subparsers.add_parser('generate-schema', help='Generate Prisma schema from architecture')
    schema_parser.add_argument('project', help='Project name')

    # Generate Code
    code_parser = subparsers.add_parser('generate-code', help='Generate code (frontend/backend)')
    code_parser.add_argument('project', help='Project name')
    code_parser.add_argument('--type', default='all', choices=['frontend', 'backend', 'all'],
                            help='Type of code to generate')

    # Generate Tests
    tests_parser = subparsers.add_parser('generate-tests', help='Generate tests for code')
    tests_parser.add_argument('project', help='Project name')

    # Quality Report
    quality_parser = subparsers.add_parser('quality-report', help='Generate quality and compliance report')
    quality_parser.add_argument('project', help='Project name')

    # Run Complete Workflow
    workflow_parser = subparsers.add_parser('run-workflow', help='Run complete workflow (all steps)')
    workflow_parser.add_argument('project', help='Project name')
    workflow_parser.add_argument('vision', help='Product vision statement')
    workflow_parser.add_argument('--frontend', help='Frontend stack (comma-separated)')
    workflow_parser.add_argument('--backend', help='Backend stack (comma-separated)')
    workflow_parser.add_argument('--database', help='Database stack (comma-separated)')

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
    elif args.command == 'generate-schema':
        cli.generate_schema(args.project)
    elif args.command == 'generate-code':
        cli.generate_code(args.project, args.type)
    elif args.command == 'generate-tests':
        cli.generate_tests(args.project)
    elif args.command == 'quality-report':
        cli.generate_quality_report(args.project)
    elif args.command == 'run-workflow':
        tech_stack = None
        if args.frontend or args.backend or args.database:
            tech_stack = {}
            if args.frontend:
                tech_stack['frontend'] = args.frontend
            if args.backend:
                tech_stack['backend'] = args.backend
            if args.database:
                tech_stack['database'] = args.database
        cli.run_workflow(args.project, args.vision, tech_stack)
    elif args.command == 'status':
        cli.show_status(args.project)


if __name__ == '__main__':
    main()
