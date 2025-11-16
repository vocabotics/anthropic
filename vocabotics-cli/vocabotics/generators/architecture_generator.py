"""
Architecture Generator Service
Generates comprehensive software architecture documents
Uses exact prompts from TypeScript version
"""

import json
from typing import Dict, Any, List
from ..ai_client import AnthropicClient, AICallMetadata


class ArchitectureGenerator:
    """Generate comprehensive software architecture documents"""

    def __init__(self, client: AnthropicClient):
        self.client = client

    def generate(self, prd: Dict[str, Any], tech_stack: Dict[str, List[str]],
                project_id: str) -> Dict[str, Any]:
        """
        Generate architecture from PRD

        Args:
            prd: PRD document dictionary
            tech_stack: Technology stack dict with frontend, backend, database lists
            project_id: Project identifier

        Returns:
            Architecture document as dictionary
        """
        system_prompt = """You are an expert software architect with deep knowledge of:
- Microservices and monolithic architectures
- RESTful API design and GraphQL
- Database design (SQL and NoSQL)
- Cloud infrastructure (AWS, GCP, Azure)
- Security best practices (OWASP Top 10)
- Scalability patterns
- ISO 12207 software architecture standards

Generate a comprehensive Software Architecture Document that:
1. Maps every requirement from the PRD to specific components
2. Defines clear component boundaries and responsibilities
3. Specifies complete data models with relationships
4. Documents all API endpoints with OpenAPI-style contracts
5. Addresses security, scalability, and deployment
6. Maintains full traceability to requirements

Output MUST be valid JSON matching the exact schema provided."""

        user_prompt = f"""Generate a comprehensive software architecture document based on this PRD:

**PRD:**
{json.dumps(prd, indent=2)}

**Technology Stack:**
{json.dumps(tech_stack, indent=2)}

Requirements:
1. Create components for ALL functional requirements
2. Design data models that support all user stories
3. Define API endpoints for every user-facing feature
4. Include security measures for all data protection requirements
5. Address scalability for performance requirements
6. Map every requirement ID to its implementing components

The architecture MUST use the specified technology stack. For example:
- Frontend: {', '.join(tech_stack.get('frontend', []))}
- Backend: {', '.join(tech_stack.get('backend', []))}
- Database: {', '.join(tech_stack.get('database', []))}

Output as JSON matching this exact structure:
{{
  "title": "Architecture Document Title",
  "version": "1.0.0",
  "lastUpdated": "YYYY-MM-DD",
  "overview": {{
    "summary": "...",
    "architectureStyle": "layered|microservices|event-driven",
    "designPrinciples": ["...", "..."],
    "qualityAttributes": ["performance", "security", "scalability"]
  }},
  "technologyStack": {{ /* as provided */ }},
  "components": [
    {{
      "id": "COMP-001",
      "name": "User Authentication Service",
      "type": "backend",
      "description": "...",
      "responsibilities": ["...", "..."],
      "technologies": ["express", "jsonwebtoken"],
      "dependencies": ["COMP-002"],
      "apis": [
        {{
          "endpoint": "/api/auth/login",
          "method": "POST",
          "description": "...",
          "requirementIds": ["REQ-F-001"]
        }}
      ]
    }}
  ],
  "dataModels": [
    {{
      "name": "User",
      "description": "...",
      "fields": [
        {{
          "name": "id",
          "type": "uuid",
          "required": true,
          "unique": true,
          "indexed": true,
          "description": "Primary key"
        }}
      ],
      "relationships": [
        {{
          "type": "oneToMany",
          "model": "Project",
          "description": "A user can have multiple projects"
        }}
      ],
      "requirementIds": ["REQ-F-001", "REQ-F-002"]
    }}
  ],
  "apiContracts": {{
    "basePath": "/api",
    "version": "v1",
    "authentication": "JWT Bearer Token",
    "endpoints": [...]
  }},
  "integrations": [...],
  "security": {{...}},
  "scalability": {{...}},
  "deployment": {{...}},
  "complianceMapping": [
    {{
      "requirementId": "REQ-F-001",
      "components": ["COMP-001"],
      "dataModels": ["User"],
      "apis": ["/api/auth/login"]
    }}
  ]
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        metadata = AICallMetadata(
            project_id=project_id,
            task_type="architecture_generation",
            phase="architecture_design"
        )

        # Make AI call
        result = self.client.complete(
            model=self.client.MODELS["SONNET_4_5"],
            messages=messages,
            temperature=0.7,
            max_tokens=16000,
            metadata=metadata
        )

        # Parse JSON response
        architecture = self.client.parse_json_response(result.content)

        # Validate
        self._validate_architecture(architecture)

        return {
            "architecture": architecture,
            "metadata": result.to_dict()
        }

    def _validate_architecture(self, arch: Dict[str, Any]) -> None:
        """Validate architecture structure"""
        required_fields = [
            'title',
            'version',
            'overview',
            'technologyStack',
            'components',
            'dataModels',
            'apiContracts',
            'security',
            'scalability',
            'deployment',
        ]

        for field in required_fields:
            if field not in arch:
                raise ValueError(f"Missing required field: {field}")

        # Validate component IDs are unique
        component_ids = set()
        for comp in arch['components']:
            if comp['id'] in component_ids:
                raise ValueError(f"Duplicate component ID: {comp['id']}")
            component_ids.add(comp['id'])
