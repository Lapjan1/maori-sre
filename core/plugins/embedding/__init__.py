"""
Embedding Plugin Interface

Embeddings are OPTIONAL. The compiler works without any embedding plugin.

If configured, the embedding plugin receives the compiled runtime graph
and produces a vector index for semantic similarity search.

Usage:
  # Config (sre build --with-embeddings --embedding-plugin=openai)
  plugin = load_plugin("embedding", "openai")
  index = plugin.build(graph, output_dir, config)
  index.search(query_vector, top_k=10)
"""

from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class EmbeddingConfig:
    """Configuration for an embedding plugin."""
    model_name: str = "all-MiniLM-L6-v2"
    batch_size: int = 32
    device: str = "cpu"
    api_key: Optional[str] = None
    api_base: Optional[str] = None


@dataclass
class SearchResult:
    entity_id: str
    score: float


class EmbeddingPlugin:
    """Base interface for embedding plugins."""

    @property
    def name(self) -> str:
        raise NotImplementedError

    def build(self, graph, output_dir: str, config: EmbeddingConfig):
        """
        Generate embeddings for all entities in the graph.
        
        Args:
            graph: RuntimeGraph instance
            output_dir: Path to write index files
            config: Plugin-specific configuration
        """
        raise NotImplementedError

    def search(self, query: str, top_k: int = 10) -> List[SearchResult]:
        """Search the index by text query."""
        raise NotImplementedError

    def search_by_vector(self, vector: List[float], top_k: int = 10) -> List[SearchResult]:
        """Search the index by vector."""
        raise NotImplementedError
