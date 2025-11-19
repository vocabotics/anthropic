"""
Test Generator Service
Generates comprehensive tests for frontend and backend code
"""

from typing import Dict, Any
from ..ai_client import AnthropicClient, AICallMetadata


class TestGenerator:
    """Generate comprehensive test suites"""

    def __init__(self, client: AnthropicClient):
        self.client = client

    def generate_tests(self, code_files: Dict[str, Any],
                      test_type: str, project_id: str) -> Dict[str, Any]:
        """
        Generate tests for code files

        Args:
            code_files: Generated code files
            test_type: 'frontend' or 'backend'
            project_id: Project identifier

        Returns:
            Test files
        """
        test_frameworks = {
            "frontend": "Vitest and React Testing Library",
            "backend": "Jest and Supertest"
        }

        system_prompt = f"""You are an expert in test-driven development using {test_frameworks[test_type]}.

Generate comprehensive test suites with:
1. Unit tests for all functions/methods
2. Integration tests for components/APIs
3. Edge cases and error scenarios
4. Mock data and fixtures
5. Proper setup and teardown
6. 95%+ code coverage target

Follow testing best practices:
- AAA pattern (Arrange, Act, Assert)
- Descriptive test names
- One assertion per test when possible
- Test isolation
- Fast execution"""

        files_content = "\n\n".join([
            f"File: {f['path']}\n```\n{f['content']}\n```"
            for f in code_files.get('files', [])
        ])

        user_prompt = f"""Generate comprehensive tests for this code:

{files_content}

Generate test files with:
1. Unit tests for all exported functions
2. Integration tests for user flows
3. Edge cases (empty inputs, errors, etc.)
4. Mock external dependencies
5. Coverage for all code paths

Output as JSON:
{{
  "testFiles": [
    {{
      "path": "src/components/__tests__/LoginForm.test.tsx",
      "content": "// Complete test code...",
      "testedFile": "src/components/LoginForm.tsx",
      "testCount": 12,
      "coverage": 95
    }}
  ],
  "summary": {{
    "totalTests": 25,
    "estimatedCoverage": 95,
    "frameworks": ["vitest", "react-testing-library"]
  }}
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        metadata = AICallMetadata(
            project_id=project_id,
            task_type="test_generation",
            phase="test_generation"
        )

        result = self.client.complete(
            model=self.client.MODELS["HAIKU_3_5"],  # Use Haiku for tests (cheaper)
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
