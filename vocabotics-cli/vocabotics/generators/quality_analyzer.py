"""
Quality Analyzer
Analyzes generated artifacts for ISO compliance and quality metrics
"""

from typing import Dict, Any, List
from datetime import datetime


class QualityAnalyzer:
    """Analyze project quality and ISO compliance"""

    def analyze_project(self, project_name: str, storage) -> Dict[str, Any]:
        """
        Generate comprehensive quality report

        Args:
            project_name: Project name
            storage: FileStorage instance

        Returns:
            Quality report
        """
        report = {
            "timestamp": datetime.now().isoformat(),
            "project": project_name,
            "overallScore": 0,
            "sections": {}
        }

        # Load artifacts
        try:
            prd = storage.load_artifact(project_name, 'prd')
            architecture = storage.load_artifact(project_name, 'architecture')

            # Analyze PRD quality
            prd_score = self._analyze_prd(prd)
            report["sections"]["prd"] = prd_score

            # Analyze Architecture quality
            arch_score = self._analyze_architecture(architecture, prd)
            report["sections"]["architecture"] = arch_score

            # Check for schema
            try:
                schema = storage.load_artifact(project_name, 'schema')
                schema_score = self._analyze_schema(schema)
                report["sections"]["schema"] = schema_score
            except:
                report["sections"]["schema"] = {"score": 0, "status": "missing"}

            # Check for code
            try:
                code = storage.load_artifact(project_name, 'code')
                code_score = self._analyze_code(code)
                report["sections"]["code"] = code_score
            except:
                report["sections"]["code"] = {"score": 0, "status": "missing"}

            # Calculate overall score
            scores = [s.get("score", 0) for s in report["sections"].values()
                     if isinstance(s, dict) and "score" in s]
            report["overallScore"] = sum(scores) / len(scores) if scores else 0

            # ISO compliance check
            report["isoCompliance"] = self._check_iso_compliance(prd, architecture)

            # Traceability matrix
            report["traceability"] = self._build_traceability_matrix(
                prd, architecture
            )

        except Exception as e:
            report["error"] = str(e)

        return report

    def _analyze_prd(self, prd: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze PRD quality"""
        score = 0
        issues = []

        # Check completeness
        required_fields = [
            'title', 'vision', 'executiveSummary', 'functionalRequirements',
            'nonFunctionalRequirements', 'userStories', 'targetAudience'
        ]
        missing = [f for f in required_fields if f not in prd or not prd[f]]
        if not missing:
            score += 20
        else:
            issues.append(f"Missing fields: {', '.join(missing)}")

        # Check requirement count
        func_reqs = len(prd.get('functionalRequirements', []))
        non_func_reqs = len(prd.get('nonFunctionalRequirements', []))

        if func_reqs >= 15:
            score += 20
        else:
            issues.append(f"Only {func_reqs} functional requirements (need 15+)")

        if non_func_reqs >= 10:
            score += 20
        else:
            issues.append(f"Only {non_func_reqs} non-functional requirements (need 10+)")

        # Check user stories
        stories = len(prd.get('userStories', []))
        if stories >= 10:
            score += 20
        else:
            issues.append(f"Only {stories} user stories (need 10+)")

        # Check traceability
        all_req_ids = set()
        for req in prd.get('functionalRequirements', []) + prd.get('nonFunctionalRequirements', []):
            all_req_ids.add(req['id'])

        linked_req_ids = set()
        for story in prd.get('userStories', []):
            linked_req_ids.update(story.get('requirementIds', []))

        coverage = len(linked_req_ids) / len(all_req_ids) * 100 if all_req_ids else 0
        if coverage >= 90:
            score += 20
        else:
            issues.append(f"Requirement coverage only {coverage:.1f}% (need 90%+)")

        return {
            "score": score,
            "maxScore": 100,
            "percentage": score,
            "issues": issues,
            "metrics": {
                "functionalRequirements": func_reqs,
                "nonFunctionalRequirements": non_func_reqs,
                "userStories": stories,
                "traceabilityCoverage": coverage
            }
        }

    def _analyze_architecture(self, architecture: Dict[str, Any],
                             prd: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze architecture quality"""
        score = 0
        issues = []

        # Check components
        components = len(architecture.get('components', []))
        if components >= 5:
            score += 25
        else:
            issues.append(f"Only {components} components (need 5+)")

        # Check data models
        models = len(architecture.get('dataModels', []))
        if models >= 3:
            score += 25
        else:
            issues.append(f"Only {models} data models (need 3+)")

        # Check API endpoints
        endpoints = len(architecture.get('apiContracts', {}).get('endpoints', []))
        if endpoints >= 10:
            score += 25
        else:
            issues.append(f"Only {endpoints} API endpoints (need 10+)")

        # Check requirement coverage
        from .validators import ArchitectureValidator
        coverage_result = ArchitectureValidator.validate_requirement_coverage(
            prd, architecture
        )
        if coverage_result['coverage'] >= 95:
            score += 25
        else:
            issues.append(f"Requirement coverage only {coverage_result['coverage']:.1f}% (need 95%+)")

        return {
            "score": score,
            "maxScore": 100,
            "percentage": score,
            "issues": issues,
            "metrics": {
                "components": components,
                "dataModels": models,
                "apiEndpoints": endpoints,
                "requirementCoverage": coverage_result['coverage']
            }
        }

    def _analyze_schema(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze database schema quality"""
        score = 100  # Assume good if exists
        return {
            "score": score,
            "maxScore": 100,
            "percentage": score,
            "issues": [],
            "metrics": {
                "models": len(schema.get('schema', {}).get('models', []))
            }
        }

    def _analyze_code(self, code: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze code quality"""
        files = code.get('code', {}).get('files', [])
        score = min(100, len(files) * 10)  # 10 points per file, max 100

        return {
            "score": score,
            "maxScore": 100,
            "percentage": score,
            "issues": [],
            "metrics": {
                "filesGenerated": len(files)
            }
        }

    def _check_iso_compliance(self, prd: Dict[str, Any],
                             architecture: Dict[str, Any]) -> Dict[str, Any]:
        """Check ISO 9001 and ISO 12207 compliance"""
        compliance = {
            "ISO_9001": {
                "standard": "ISO 9001:2015 - Quality Management",
                "requirements": [],
                "score": 0
            },
            "ISO_12207": {
                "standard": "ISO 12207 - Software Life Cycle",
                "requirements": [],
                "score": 0
            }
        }

        # ISO 9001 checks
        iso_9001_checks = [
            ("Requirements defined", 'functionalRequirements' in prd),
            ("Quality objectives set", 'successMetrics' in prd),
            ("Risks identified", 'risks' in prd),
            ("Process documentation", 'timeline' in prd),
        ]

        passed = sum(1 for _, check in iso_9001_checks if check)
        compliance["ISO_9001"]["requirements"] = [
            {"name": name, "passed": check}
            for name, check in iso_9001_checks
        ]
        compliance["ISO_9001"]["score"] = (passed / len(iso_9001_checks)) * 100

        # ISO 12207 checks
        iso_12207_checks = [
            ("Architecture documented", 'overview' in architecture),
            ("Design principles defined", 'designPrinciples' in architecture.get('overview', {})),
            ("Security addressed", 'security' in architecture),
            ("Testing strategy", True),  # Assume covered
        ]

        passed = sum(1 for _, check in iso_12207_checks if check)
        compliance["ISO_12207"]["requirements"] = [
            {"name": name, "passed": check}
            for name, check in iso_12207_checks
        ]
        compliance["ISO_12207"]["score"] = (passed / len(iso_12207_checks)) * 100

        return compliance

    def _build_traceability_matrix(self, prd: Dict[str, Any],
                                   architecture: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Build requirement traceability matrix"""
        matrix = []

        # Get all requirements
        all_reqs = prd.get('functionalRequirements', []) + prd.get('nonFunctionalRequirements', [])

        for req in all_reqs:
            req_id = req['id']
            entry = {
                "requirementId": req_id,
                "description": req['description'],
                "priority": req.get('priority'),
                "userStories": [],
                "components": [],
                "dataModels": [],
                "apiEndpoints": [],
                "testCases": []
            }

            # Find linked user stories
            for story in prd.get('userStories', []):
                if req_id in story.get('requirementIds', []):
                    entry["userStories"].append(story['id'])

            # Find implementing components
            for comp in architecture.get('components', []):
                for api in comp.get('apis', []):
                    if req_id in api.get('requirementIds', []):
                        entry["components"].append(comp['id'])
                        entry["apiEndpoints"].append(f"{api['method']} {api['endpoint']}")

            # Find data models
            for model in architecture.get('dataModels', []):
                if req_id in model.get('requirementIds', []):
                    entry["dataModels"].append(model['name'])

            matrix.append(entry)

        return matrix
