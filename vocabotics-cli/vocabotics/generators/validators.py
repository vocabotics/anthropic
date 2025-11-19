"""
Validators for PRD and Architecture documents
Ensures traceability and requirement coverage
"""

from typing import Dict, Any, List, Set


class PRDValidator:
    """Validate PRD traceability"""

    @staticmethod
    def validate_traceability(prd: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate requirement traceability in PRD

        Returns:
            Dictionary with validation results
        """
        errors = []
        warnings = []

        # Collect all requirement IDs
        all_req_ids = set()
        for req in prd['functionalRequirements'] + prd['nonFunctionalRequirements']:
            all_req_ids.add(req['id'])

        # Check user stories reference valid requirements
        for story in prd['userStories']:
            for req_id in story.get('requirementIds', []):
                if req_id not in all_req_ids:
                    errors.append(
                        f"User story {story['id']} references non-existent requirement {req_id}"
                    )

            if not story.get('requirementIds'):
                warnings.append(
                    f"User story {story['id']} has no linked requirements"
                )

        # Check for orphaned requirements (not linked to any user story)
        linked_reqs = set()
        for story in prd['userStories']:
            linked_reqs.update(story.get('requirementIds', []))

        for req_id in all_req_ids:
            if req_id not in linked_reqs:
                warnings.append(
                    f"Requirement {req_id} is not linked to any user story"
                )

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }


class ArchitectureValidator:
    """Validate architecture completeness and requirement coverage"""

    @staticmethod
    def validate_requirement_coverage(prd: Dict[str, Any],
                                     architecture: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate that architecture covers all PRD requirements

        Returns:
            Dictionary with coverage analysis
        """
        errors = []

        # Get all requirement IDs from PRD
        all_req_ids = set()
        for req in prd['functionalRequirements'] + prd['nonFunctionalRequirements']:
            all_req_ids.add(req['id'])

        # Get all requirement IDs covered by architecture
        covered_req_ids = set()

        # From components
        for comp in architecture.get('components', []):
            if 'apis' in comp:
                for api in comp['apis']:
                    covered_req_ids.update(api.get('requirementIds', []))

        # From data models
        for model in architecture.get('dataModels', []):
            covered_req_ids.update(model.get('requirementIds', []))

        # From API endpoints
        api_contracts = architecture.get('apiContracts', {})
        for endpoint in api_contracts.get('endpoints', []):
            covered_req_ids.update(endpoint.get('requirementIds', []))

        # From compliance mapping
        for mapping in architecture.get('complianceMapping', []):
            covered_req_ids.add(mapping.get('requirementId'))

        # Find uncovered requirements
        uncovered_requirements = list(all_req_ids - covered_req_ids)

        coverage = (len(covered_req_ids) / len(all_req_ids) * 100) if all_req_ids else 0

        if coverage < 100:
            errors.append(
                f"Only {coverage:.1f}% of requirements are covered by the architecture"
            )

        return {
            "valid": len(uncovered_requirements) == 0,
            "coverage": coverage,
            "uncovered_requirements": uncovered_requirements,
            "errors": errors,
            "total_requirements": len(all_req_ids),
            "covered_requirements": len(covered_req_ids)
        }

    @staticmethod
    def validate_component_dependencies(architecture: Dict[str, Any]) -> Dict[str, Any]:
        """Validate component dependencies are valid"""
        errors = []
        warnings = []

        # Collect all component IDs
        component_ids = set(comp['id'] for comp in architecture.get('components', []))

        # Check dependencies
        for comp in architecture.get('components', []):
            for dep_id in comp.get('dependencies', []):
                if dep_id not in component_ids:
                    errors.append(
                        f"Component {comp['id']} has invalid dependency: {dep_id}"
                    )

            # Warn about components with no dependencies (might be isolated)
            if not comp.get('dependencies') and comp['type'] != 'database':
                warnings.append(
                    f"Component {comp['id']} has no dependencies (might be isolated)"
                )

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
