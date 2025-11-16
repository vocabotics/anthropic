"""
AI Client for Anthropic API
Wrapper for Claude API calls with usage tracking
"""

import os
import json
import time
from typing import Dict, List, Optional, Any
from anthropic import Anthropic


class AICallMetadata:
    """Metadata for AI call tracking"""
    def __init__(self, project_id: str, task_type: str, phase: str):
        self.project_id = project_id
        self.task_type = task_type
        self.phase = phase


class AICallResult:
    """Result of an AI API call"""
    def __init__(self, content: str, model: str, usage: Dict[str, int],
                 duration_ms: int, cost_usd: float):
        self.content = content
        self.model = model
        self.usage = usage
        self.duration_ms = duration_ms
        self.cost_usd = cost_usd

    def to_dict(self) -> Dict:
        """Serialize to dictionary"""
        return {
            "content": self.content,
            "model": self.model,
            "usage": self.usage,
            "duration_ms": self.duration_ms,
            "cost_usd": self.cost_usd
        }


class AnthropicClient:
    """Client for Anthropic Claude API"""

    # Model pricing (per million tokens)
    PRICING = {
        "claude-sonnet-4-5-20250929": {
            "input": 3.00,
            "output": 15.00
        },
        "claude-3-5-sonnet-20241022": {
            "input": 3.00,
            "output": 15.00
        },
        "claude-3-5-haiku-20241022": {
            "input": 1.00,
            "output": 5.00
        }
    }

    MODELS = {
        "SONNET_4_5": "claude-sonnet-4-5-20250929",
        "SONNET_3_5": "claude-3-5-sonnet-20241022",
        "HAIKU_3_5": "claude-3-5-haiku-20241022"
    }

    def __init__(self, api_key: Optional[str] = None):
        """Initialize client with API key"""
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        self.client = Anthropic(api_key=self.api_key)

    def complete(self, model: str, messages: List[Dict[str, str]],
                temperature: float = 0.7, max_tokens: int = 8000,
                metadata: Optional[AICallMetadata] = None) -> AICallResult:
        """
        Make a completion request to Claude API

        Args:
            model: Model identifier (e.g., SONNET_4_5)
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            metadata: Optional metadata for tracking

        Returns:
            AICallResult with response and usage info
        """
        start_time = time.time()

        # Convert messages to Anthropic format
        system_message = None
        user_messages = []

        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                user_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        # Make API call
        try:
            response = self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_message if system_message else None,
                messages=user_messages
            )

            duration_ms = int((time.time() - start_time) * 1000)

            # Extract usage
            usage = {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens
            }

            # Calculate cost
            cost_usd = self._calculate_cost(model, usage)

            # Extract content
            content = response.content[0].text

            return AICallResult(
                content=content,
                model=model,
                usage=usage,
                duration_ms=duration_ms,
                cost_usd=cost_usd
            )

        except Exception as e:
            raise RuntimeError(f"AI API call failed: {str(e)}")

    def _calculate_cost(self, model: str, usage: Dict[str, int]) -> float:
        """Calculate cost in USD for API call"""
        if model not in self.PRICING:
            return 0.0

        pricing = self.PRICING[model]
        input_cost = (usage["input_tokens"] / 1_000_000) * pricing["input"]
        output_cost = (usage["output_tokens"] / 1_000_000) * pricing["output"]

        return input_cost + output_cost

    def parse_json_response(self, content: str) -> Any:
        """Parse JSON from AI response, handling markdown code blocks"""
        json_content = content.strip()

        # Remove markdown code blocks if present
        if json_content.startswith("```json"):
            json_content = json_content.replace("```json\n", "", 1)
            json_content = json_content.rsplit("```", 1)[0]
        elif json_content.startswith("```"):
            json_content = json_content.replace("```\n", "", 1)
            json_content = json_content.rsplit("```", 1)[0]

        return json.loads(json_content)
