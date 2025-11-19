"""
End-to-End Test Generator
Generates Playwright tests for user workflows
"""

from typing import Dict, Any, List
from ..ai_client import AnthropicClient, AICallMetadata


class E2ETestGenerator:
    """Generate end-to-end tests using Playwright"""

    def __init__(self, client: AnthropicClient):
        self.client = client

    def generate_e2e_tests(self, prd: Dict[str, Any],
                           architecture: Dict[str, Any],
                           project_id: str) -> Dict[str, Any]:
        """
        Generate E2E tests from PRD user stories

        Args:
            prd: PRD document with user stories
            architecture: Architecture document
            project_id: Project identifier

        Returns:
            E2E test files
        """
        system_prompt = """You are an expert in end-to-end testing with Playwright.

Generate comprehensive E2E tests that:
1. Test complete user workflows from PRD user stories
2. Use Page Object Model pattern
3. Include proper setup and teardown
4. Test happy paths and error scenarios
5. Include accessibility checks
6. Use realistic test data
7. Have descriptive test names

Each test should:
- Start from a clean state
- Test one complete user workflow
- Verify expected outcomes
- Clean up after itself"""

        # Extract user stories
        user_stories = prd.get('userStories', [])
        api_endpoints = architecture.get('apiContracts', {}).get('endpoints', [])

        user_prompt = f"""Generate Playwright E2E tests for these user stories:

**User Stories:**
{self._format_user_stories(user_stories)}

**API Endpoints:**
{self._format_api_endpoints(api_endpoints)}

Generate test files with:
1. Page Object Models for each major page
2. Test specs for each user story
3. Helper functions for common actions
4. Fixtures for test data
5. Authentication setup

Output as JSON:
{{
  "testFiles": [
    {{
      "path": "tests/e2e/login.spec.ts",
      "content": "// Complete Playwright test...",
      "userStories": ["US-001"],
      "description": "Tests user login workflow"
    }}
  ],
  "pageObjects": [
    {{
      "path": "tests/e2e/pages/LoginPage.ts",
      "content": "// Page Object Model..."
    }}
  ],
  "fixtures": [
    {{
      "path": "tests/e2e/fixtures/users.ts",
      "content": "// Test data fixtures..."
    }}
  ],
  "config": {{
    "path": "playwright.config.ts",
    "content": "// Playwright configuration..."
  }}
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        metadata = AICallMetadata(
            project_id=project_id,
            task_type="e2e_test_generation",
            phase="test_generation"
        )

        result = self.client.complete(
            model=self.client.MODELS["SONNET_4_5"],
            messages=messages,
            temperature=0.3,
            max_tokens=12000,
            metadata=metadata
        )

        tests = self.client.parse_json_response(result.content)

        return {
            "tests": tests,
            "metadata": result.to_dict()
        }

    def _format_user_stories(self, stories: List[Dict[str, Any]]) -> str:
        """Format user stories for prompt"""
        output = []
        for story in stories:
            output.append(f"\n{story['id']}: As a {story['asA']}, I want {story['iWant']}, so that {story['soThat']}")
            if story.get('acceptanceCriteria'):
                output.append("  Acceptance Criteria:")
                for criterion in story['acceptanceCriteria']:
                    output.append(f"    - {criterion}")
        return "\n".join(output)

    def _format_api_endpoints(self, endpoints: List[Dict[str, Any]]) -> str:
        """Format API endpoints for prompt"""
        output = []
        for endpoint in endpoints:
            output.append(f"\n{endpoint.get('method', 'GET')} {endpoint.get('path', '')}")
            output.append(f"  {endpoint.get('summary', '')}")
        return "\n".join(output)
