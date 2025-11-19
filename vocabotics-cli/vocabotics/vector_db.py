"""
Vector Database Service for RAG and Semantic Search
Implements Qdrant for context management and project similarity
"""

from typing import List, Dict, Any, Optional
import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from qdrant_client.http import models
import anthropic


class VectorDBService:
    """Vector database service using Qdrant for embeddings and semantic search"""

    def __init__(self):
        """Initialize Qdrant client"""
        qdrant_url = os.environ.get("QDRANT_URL", "http://localhost:6333")
        qdrant_api_key = os.environ.get("QDRANT_API_KEY")

        self.client = QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key if qdrant_api_key else None
        )

        # Initialize Anthropic for embeddings (using Claude's embedding capabilities)
        anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
        self.anthropic_client = anthropic.Anthropic(api_key=anthropic_key) if anthropic_key else None

        self.collection_name = "vocabotics_projects"
        self._ensure_collection()

    def _ensure_collection(self):
        """Create collection if it doesn't exist"""
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)

            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
                )
        except Exception as e:
            print(f"Error ensuring collection: {e}")

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text
        Note: Using placeholder - in production would use Claude embeddings or OpenAI
        """
        # Placeholder: In production, use actual embedding model
        # For now, return random embedding
        import random
        return [random.random() for _ in range(1536)]

    def index_project(self, project_id: str, prd: Dict[str, Any],
                     architecture: Dict[str, Any]) -> None:
        """
        Index project for semantic search

        Args:
            project_id: Project identifier
            prd: PRD document
            architecture: Architecture document
        """
        # Create searchable text from PRD and Architecture
        searchable_text = self._create_searchable_text(prd, architecture)

        # Generate embedding
        embedding = self.generate_embedding(searchable_text)

        # Create point
        point = PointStruct(
            id=hash(project_id),  # Simple hash for demo
            vector=embedding,
            payload={
                "project_id": project_id,
                "title": prd.get("title", ""),
                "vision": prd.get("vision", ""),
                "requirements_count": len(prd.get("functionalRequirements", [])),
                "tech_stack": architecture.get("technologyStack", {}),
                "search_text": searchable_text[:1000]  # First 1000 chars for display
            }
        )

        # Upsert to Qdrant
        self.client.upsert(
            collection_name=self.collection_name,
            points=[point]
        )

    def find_similar_projects(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Find similar projects using semantic search

        Args:
            query: Search query
            limit: Maximum number of results

        Returns:
            List of similar projects with scores
        """
        # Generate query embedding
        query_embedding = self.generate_embedding(query)

        # Search
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=limit
        )

        # Format results
        similar_projects = []
        for result in results:
            similar_projects.append({
                "project_id": result.payload["project_id"],
                "title": result.payload["title"],
                "vision": result.payload["vision"],
                "similarity_score": result.score,
                "tech_stack": result.payload["tech_stack"]
            })

        return similar_projects

    def _create_searchable_text(self, prd: Dict[str, Any],
                                architecture: Dict[str, Any]) -> str:
        """Create combined searchable text from PRD and architecture"""
        parts = [
            prd.get("title", ""),
            prd.get("vision", ""),
            prd.get("executiveSummary", ""),
        ]

        # Add requirements
        for req in prd.get("functionalRequirements", []):
            parts.append(req.get("description", ""))

        # Add user stories
        for story in prd.get("userStories", []):
            parts.append(f"{story.get('iWant', '')} {story.get('soThat', '')}")

        # Add architecture overview
        overview = architecture.get("overview", {})
        parts.append(overview.get("summary", ""))

        # Add tech stack
        tech_stack = architecture.get("technologyStack", {})
        for key, values in tech_stack.items():
            if isinstance(values, list):
                parts.extend(values)

        return " ".join(filter(None, parts))


# Example usage functions for CLI integration
def index_project_to_vector_db(project_name: str, storage):
    """Helper function to index a project"""
    from .file_storage import FileStorage

    vector_service = VectorDBService()

    try:
        prd = storage.load_artifact(project_name, 'prd')
        architecture = storage.load_artifact(project_name, 'architecture')

        vector_service.index_project(project_name, prd, architecture)
        print(f"✓ Indexed {project_name} to vector database")
    except Exception as e:
        print(f"✗ Failed to index {project_name}: {e}")


def search_similar_projects(query: str, limit: int = 5):
    """Helper function to search for similar projects"""
    vector_service = VectorDBService()

    results = vector_service.find_similar_projects(query, limit)

    print(f"\nFound {len(results)} similar projects:\n")
    for i, project in enumerate(results, 1):
        print(f"{i}. {project['title']} (similarity: {project['similarity_score']:.2f})")
        print(f"   Vision: {project['vision'][:100]}...")
        print()

    return results
