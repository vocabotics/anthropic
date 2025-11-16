"""
PRD Generator Service
Generates ISO-compliant Product Requirements Documents
Uses exact prompts from TypeScript version
"""

from typing import Dict, Any, List, Optional
from ..ai_client import AnthropicClient, AICallMetadata


class PRDGenerator:
    """Generate comprehensive PRD following ISO standards"""

    def __init__(self, client: AnthropicClient):
        self.client = client

    def generate(self, vision: str, project_id: str,
                target_audience: Optional[str] = None,
                key_features: Optional[List[str]] = None,
                constraints: Optional[List[str]] = None,
                industry_standards: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Generate comprehensive PRD following ISO 9001 and ISO 12207

        Args:
            vision: Product vision statement
            project_id: Project identifier
            target_audience: Optional target audience description
            key_features: Optional list of key features
            constraints: Optional list of constraints
            industry_standards: Optional list of industry standards

        Returns:
            PRD document as dictionary
        """
        system_prompt = """You are an expert product manager and technical architect specializing in ISO-compliant documentation.

Generate a comprehensive Product Requirements Document (PRD) following:
- ISO 9001:2015 (Quality Management Systems)
- ISO 12207 (Software Life Cycle Processes)
- ISO/IEC 25010 (Systems and software Quality Requirements and Evaluation)

The PRD must be:
1. **Complete**: All aspects of the product fully documented
2. **Consistent**: No contradictions between requirements
3. **Traceable**: Every requirement has a unique ID and clear relationships
4. **Testable**: Acceptance criteria for all requirements
5. **Prioritized**: Critical/High/Medium/Low priority classification

Output MUST be valid JSON matching the exact schema provided."""

        # Build user prompt
        user_prompt_parts = [
            "Generate a PRD for the following product:",
            "",
            "**Vision:**",
            vision,
            ""
        ]

        if target_audience:
            user_prompt_parts.extend([
                "**Target Audience:**",
                target_audience,
                ""
            ])

        if key_features:
            user_prompt_parts.extend([
                "**Key Features:**",
                *[f"- {f}" for f in key_features],
                ""
            ])

        if constraints:
            user_prompt_parts.extend([
                "**Constraints:**",
                *[f"- {c}" for c in constraints],
                ""
            ])

        if industry_standards:
            user_prompt_parts.extend([
                "**Industry Standards:**",
                *[f"- {s}" for s in industry_standards],
                ""
            ])

        user_prompt_parts.extend([
            "Generate a comprehensive PRD with:",
            "- At least 15-20 functional requirements (REQ-F-001, REQ-F-002, ...)",
            "- At least 10-15 non-functional requirements (REQ-NF-001, REQ-NF-002, ...)",
            "- At least 10-15 user stories (US-001, US-002, ...)",
            "- Complete persona profiles",
            "- Success metrics with measurable targets",
            "- Risk assessment with mitigation strategies",
            "- Timeline breakdown by phase",
            "",
            "Output as JSON matching this exact structure:",
            """{
  "title": "Product Title",
  "version": "1.0.0",
  "lastUpdated": "YYYY-MM-DD",
  "vision": "...",
  "executiveSummary": "...",
  "targetAudience": {
    "primary": ["..."],
    "secondary": ["..."],
    "personas": [{"name": "...", "role": "...", "goals": ["..."], "painPoints": ["..."]}]
  },
  "functionalRequirements": [
    {
      "id": "REQ-F-001",
      "type": "functional",
      "priority": "critical",
      "description": "...",
      "acceptanceCriteria": ["..."],
      "dependencies": []
    }
  ],
  "nonFunctionalRequirements": [
    {
      "id": "REQ-NF-001",
      "type": "non-functional",
      "category": "performance",
      "priority": "high",
      "description": "...",
      "acceptanceCriteria": ["..."]
    }
  ],
  "userStories": [
    {
      "id": "US-001",
      "asA": "...",
      "iWant": "...",
      "soThat": "...",
      "requirementIds": ["REQ-F-001"],
      "acceptanceCriteria": ["..."],
      "estimatedEffort": "2-3 days"
    }
  ],
  "successMetrics": [
    {"metric": "...", "target": "...", "measurement": "..."}
  ],
  "constraints": {
    "technical": ["..."],
    "business": ["..."],
    "regulatory": ["..."]
  },
  "dependencies": {
    "internal": ["..."],
    "external": ["..."],
    "thirdParty": ["..."]
  },
  "risks": [
    {"risk": "...", "severity": "high", "mitigation": "..."}
  ],
  "timeline": [
    {"phase": "...", "duration": "...", "deliverables": ["..."]}
  ],
  "complianceStandards": ["ISO 9001:2015", "ISO 12207", "GDPR", ...]
}"""
        ])

        user_prompt = "\n".join(user_prompt_parts)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        metadata = AICallMetadata(
            project_id=project_id,
            task_type="prd_generation",
            phase="prd_generation"
        )

        # Make AI call
        result = self.client.complete(
            model=self.client.MODELS["SONNET_4_5"],
            messages=messages,
            temperature=0.7,
            max_tokens=12000,
            metadata=metadata
        )

        # Parse JSON response
        prd = self.client.parse_json_response(result.content)

        # Validate
        self._validate_prd(prd)

        return {
            "prd": prd,
            "metadata": result.to_dict()
        }

    def _validate_prd(self, prd: Dict[str, Any]) -> None:
        """Validate PRD structure and content"""
        required_fields = [
            'title',
            'version',
            'vision',
            'executiveSummary',
            'targetAudience',
            'functionalRequirements',
            'nonFunctionalRequirements',
            'userStories',
            'successMetrics',
            'constraints',
            'dependencies',
            'risks',
        ]

        for field in required_fields:
            if field not in prd:
                raise ValueError(f"Missing required field: {field}")

        # Validate requirement IDs are unique
        req_ids = set()
        for req in prd['functionalRequirements'] + prd['nonFunctionalRequirements']:
            if req['id'] in req_ids:
                raise ValueError(f"Duplicate requirement ID: {req['id']}")
            req_ids.add(req['id'])

        # Validate user story IDs are unique
        story_ids = set()
        for story in prd['userStories']:
            if story['id'] in story_ids:
                raise ValueError(f"Duplicate user story ID: {story['id']}")
            story_ids.add(story['id'])
