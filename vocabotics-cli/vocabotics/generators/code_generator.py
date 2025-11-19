"""
Code Generator Service
Generates React components and Express APIs with Vocabotics tags
"""

import json
from typing import Dict, Any, List
from ..ai_client import AnthropicClient, AICallMetadata


class CodeGenerator:
    """Generate production-ready code with Vocabotics traceability tags"""

    def __init__(self, client: AnthropicClient):
        self.client = client

    def generate_frontend(self, architecture: Dict[str, Any],
                         components: List[str], project_id: str) -> Dict[str, Any]:
        """
        Generate React components

        Args:
            architecture: Architecture document
            components: List of component IDs to generate
            project_id: Project identifier

        Returns:
            Generated code files
        """
        system_prompt = """You are an expert React and TypeScript developer.

Generate production-ready React components with:
1. TypeScript for type safety
2. Functional components with hooks
3. Proper error handling
4. Accessibility (ARIA labels)
5. Responsive design with Tailwind CSS
6. **Vocabotics traceability tags** in comments

CRITICAL: Add Vocabotics tags to every component:
{/* vocabotics-id: "COMP-001-LOGIN-FORM" */}
{/* vocabotics-type: "component" */}
{/* vocabotics-requirements: "REQ-F-001,REQ-F-002" */}

Output as JSON with file paths and code content."""

        # Get component details from architecture
        comp_details = [c for c in architecture.get('components', [])
                       if c['id'] in components and c['type'] == 'frontend']

        user_prompt = f"""Generate React components for:

**Architecture:**
{json.dumps(comp_details, indent=2)}

**Tech Stack:**
{', '.join(architecture.get('technologyStack', {}).get('frontend', []))}

Generate complete, production-ready components with:
1. Component files (.tsx)
2. Type definitions
3. Hooks for state management
4. API integration
5. Error boundaries
6. Vocabotics traceability tags

Output as JSON:
{{
  "files": [
    {{
      "path": "src/components/LoginForm.tsx",
      "content": "// Complete component code...",
      "vocaboticsId": "COMP-001-LOGIN-FORM",
      "requirements": ["REQ-F-001"]
    }}
  ]
}}"""

        return self._generate_code("frontend", system_prompt, user_prompt, project_id)

    def generate_backend(self, architecture: Dict[str, Any],
                        components: List[str], project_id: str) -> Dict[str, Any]:
        """
        Generate Express API code

        Args:
            architecture: Architecture document
            components: List of component IDs to generate
            project_id: Project identifier

        Returns:
            Generated code files
        """
        system_prompt = """You are an expert Node.js and Express developer.

Generate production-ready Express APIs with:
1. TypeScript for type safety
2. Proper routing and middleware
3. Input validation (Zod)
4. Error handling
5. Authentication/authorization
6. **Vocabotics traceability tags** in comments

CRITICAL: Add Vocabotics tags to every route and controller:
// vocabotics-id: "API-AUTH-LOGIN-001"
// vocabotics-type: "route"
// vocabotics-requirements: "REQ-F-001,REQ-F-002"

Output as JSON with file paths and code content."""

        comp_details = [c for c in architecture.get('components', [])
                       if c['id'] in components and c['type'] == 'backend']

        api_contracts = architecture.get('apiContracts', {})

        user_prompt = f"""Generate Express API code for:

**Components:**
{json.dumps(comp_details, indent=2)}

**API Contracts:**
{json.dumps(api_contracts, indent=2)}

**Tech Stack:**
{', '.join(architecture.get('technologyStack', {}).get('backend', []))}

Generate complete, production-ready code with:
1. Route handlers
2. Controllers
3. Services
4. Middleware
5. Input validation
6. Vocabotics traceability tags

Output as JSON:
{{
  "files": [
    {{
      "path": "src/routes/auth.routes.ts",
      "content": "// Complete route code...",
      "vocaboticsId": "API-AUTH-LOGIN-001",
      "requirements": ["REQ-F-001"]
    }},
    {{
      "path": "src/controllers/auth.controller.ts",
      "content": "// Complete controller code...",
      "vocaboticsId": "CTRL-AUTH-001",
      "requirements": ["REQ-F-001"]
    }}
  ]
}}"""

        return self._generate_code("backend", system_prompt, user_prompt, project_id)

    def _generate_code(self, code_type: str, system_prompt: str,
                      user_prompt: str, project_id: str) -> Dict[str, Any]:
        """Internal method to generate code"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        metadata = AICallMetadata(
            project_id=project_id,
            task_type=f"{code_type}_code_generation",
            phase="code_generation"
        )

        result = self.client.complete(
            model=self.client.MODELS["SONNET_4_5"],
            messages=messages,
            temperature=0.3,
            max_tokens=16000,
            metadata=metadata
        )

        code_output = self.client.parse_json_response(result.content)

        return {
            "code": code_output,
            "metadata": result.to_dict()
        }
