"""
Schema Generator Service
Generates Prisma schema from architecture data models
"""

from typing import Dict, Any, List
from ..ai_client import AnthropicClient, AICallMetadata


class SchemaGenerator:
    """Generate Prisma database schema from architecture"""

    def __init__(self, client: AnthropicClient):
        self.client = client

    def generate(self, architecture: Dict[str, Any], project_id: str) -> Dict[str, Any]:
        """
        Generate Prisma schema from architecture data models

        Args:
            architecture: Architecture document dictionary
            project_id: Project identifier

        Returns:
            Schema document with Prisma schema string
        """
        system_prompt = """You are an expert database architect and Prisma specialist.

Generate a complete Prisma schema that:
1. Implements all data models from the architecture
2. Defines proper field types and constraints
3. Establishes all relationships (one-to-one, one-to-many, many-to-many)
4. Includes indexes for performance
5. Adds proper validation and defaults
6. Follows Prisma best practices

Output MUST be valid JSON with the Prisma schema as a string."""

        data_models = architecture.get('dataModels', [])

        user_prompt = f"""Generate a Prisma schema based on these data models:

**Data Models:**
{self._format_data_models(data_models)}

**Technology Stack:**
Database: {', '.join(architecture.get('technologyStack', {}).get('database', ['PostgreSQL']))}

Generate a complete schema.prisma file content including:
1. datasource db configuration for PostgreSQL
2. generator client configuration
3. All model definitions with proper types
4. All relationships with @relation directives
5. Indexes with @@index for frequently queried fields
6. Unique constraints with @@unique where needed

Output as JSON:
{{
  "schemaVersion": "1.0.0",
  "database": "postgresql",
  "prismaSchema": "// Complete schema.prisma content here...",
  "models": [
    {{
      "name": "User",
      "fields": ["id", "email", "name", "createdAt"],
      "relationships": ["posts", "profile"]
    }}
  ],
  "migrations": [
    {{
      "name": "init",
      "description": "Initial schema setup"
    }}
  ]
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        metadata = AICallMetadata(
            project_id=project_id,
            task_type="schema_generation",
            phase="schema_generation"
        )

        # Make AI call
        result = self.client.complete(
            model=self.client.MODELS["SONNET_4_5"],
            messages=messages,
            temperature=0.3,  # Lower temperature for precise schema
            max_tokens=8000,
            metadata=metadata
        )

        # Parse JSON response
        schema = self.client.parse_json_response(result.content)

        return {
            "schema": schema,
            "metadata": result.to_dict()
        }

    def _format_data_models(self, data_models: List[Dict[str, Any]]) -> str:
        """Format data models for prompt"""
        output = []
        for model in data_models:
            output.append(f"\n**{model['name']}**")
            output.append(f"Description: {model.get('description', '')}")
            output.append("Fields:")
            for field in model.get('fields', []):
                required = "required" if field.get('required') else "optional"
                unique = ", unique" if field.get('unique') else ""
                indexed = ", indexed" if field.get('indexed') else ""
                output.append(f"  - {field['name']}: {field['type']} ({required}{unique}{indexed})")

            if model.get('relationships'):
                output.append("Relationships:")
                for rel in model['relationships']:
                    output.append(f"  - {rel['type']} with {rel['model']}: {rel.get('description', '')}")
            output.append("")

        return "\n".join(output)
