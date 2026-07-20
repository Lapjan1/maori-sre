"""
Runtime Graph Builder

Transforms validated canonical source documents into a compiled runtime graph.

The graph consists of:
  - Nodes: entities, their representations, language mappings
  - Edges: relationships, affordances, interaction participants
  - Properties: labels, definitions, pronunciations, provenance

Output:
  A RuntimeGraph object that can be serialized to JSON or SQLite.

Hashing:
  - canonical_hash:  unambiguous summary of authored source (pre-inference)
  - runtime_hash:    fully compiled graph including inferred edges and semantic
                     provenance. Changes when authoring, inference, or compiler
                     semantics change.
  Both hashes are deterministic: same input + same compiler → same hash.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
import json
import hashlib

from compiler.loader import detect_document_type
from compiler.provenance import make_provenance, Provenance


INFERENCE_RULESET_VERSION = "1.0"


def _canonicalize(value: Any) -> Any:
    """
    Normalize a value for deterministic serialization.
    
    - Sort dict keys
    - Sort lists where order is not semantically meaningful
    - Round floats to 6 decimal places
    - Normalize booleans (Python True → true)
    - Normalize None → null
    """
    if isinstance(value, dict):
        return {k: _canonicalize(v) for k, v in sorted(value.items())}
    elif isinstance(value, list):
        # Only sort if all elements are simple comparable types
        # and order is not semantically meaningful
        if value and all(isinstance(x, (str, int, float, bool)) for x in value):
            return sorted(_canonicalize(x) for x in value)
        return [_canonicalize(x) for x in value]
    elif isinstance(value, float):
        return round(value, 6)
    elif isinstance(value, bool):
        return value
    elif isinstance(value, int):
        return value
    elif value is None:
        return None
    return value


def _deterministic_json(data: dict) -> bytes:
    """Serialize a dict to deterministic JSON bytes for hashing."""
    return json.dumps(
        data,
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
        default=str,
    ).encode("utf-8")


@dataclass
class GraphNode:
    """A node in the runtime graph."""
    id: str
    category: str
    label: str
    node_type: str = "entity"  # entity, representation, language_mapping
    properties: Dict[str, Any] = field(default_factory=dict)
    provenance: Optional[Provenance] = None


@dataclass
class GraphEdge:
    """A directed, typed edge in the runtime graph."""
    source: str
    type: str
    target: str
    strength: float = 1.0
    properties: Dict[str, Any] = field(default_factory=dict)
    provenance: Optional[Provenance] = None


@dataclass
class RuntimeGraph:
    """The compiled runtime graph. Immutable after write."""
    nodes: Dict[str, GraphNode] = field(default_factory=dict)
    edges: List[GraphEdge] = field(default_factory=list)
    compiler_version: str = "0.1"
    canonical_version: str = "1.0"
    build_timestamp: str = ""
    inference_ruleset_version: str = INFERENCE_RULESET_VERSION

    def add_node(self, node: GraphNode):
        self.nodes[node.id] = node

    def add_edge(self, edge: GraphEdge):
        self.edges.append(edge)

    def get_node(self, entity_id: str) -> Optional[GraphNode]:
        return self.nodes.get(entity_id)

    def get_edges(self, source_id: str = None, type: str = None) -> List[GraphEdge]:
        results = self.edges
        if source_id:
            results = [e for e in results if e.source == source_id]
        if type:
            results = [e for e in results if e.type == type]
        return results

    def compute_canonical_hash(self) -> str:
        """
        Hash of the authored graph before inference.
        
        Includes all nodes, explicit edges, and their semantic content.
        Excludes all inference-derived data, volatile metadata,
        timestamps, and build paths.
        
        This is the "source identity" — it changes only when the
        canonical YAML/JSON changes.
        """
        nodes_data = {}
        for nid in sorted(self.nodes.keys()):
            node = self.nodes[nid]
            nd: dict = {
                "id": node.id,
                "category": node.category,
                "label": node.label,
                "node_type": node.node_type,
            }
            props = dict(node.properties)

            if "affordances" in props:
                nd["affordances"] = [
                    _canonicalize(a) for a in props["affordances"]
                    if not a.get("_inferred")
                ]

            if "language_mappings" in props:
                nd["language_mappings"] = {
                    lang: _canonicalize(m)
                    for lang, m in sorted(props["language_mappings"].items())
                }

            if "representations" in props:
                nd["representations"] = [
                    _canonicalize(r) for r in props.get("representations", [])
                ]

            if "definition" in props:
                nd["definition"] = props["definition"]

            nodes_data[nid] = _canonicalize(nd)

        # Only explicit (non-inferred) edges, sorted for determinism
        explicit_edges = [
            e for e in self.edges
            if not e.properties.get("inferred", False)
        ]
        edges_data = []
        for e in sorted(explicit_edges, key=lambda e: (e.source, e.type, e.target)):
            ed: dict = {
                "source": e.source,
                "type": e.type,
                "target": e.target,
                "strength": round(e.strength, 6),
            }
            edges_data.append(_canonicalize(ed))

        data = _canonicalize({
            "canonical_version": self.canonical_version,
            "compiler_version": self.compiler_version,
            "nodes": nodes_data,
            "edges": edges_data,
        })

        return hashlib.sha256(_deterministic_json(data)).hexdigest()

    def compute_runtime_hash(self) -> str:
        """
        Hash of the fully compiled graph including inference.
        
        Includes everything in the canonical hash, plus:
          - Inferred edges (with rule_id, confidence)
          - Semantic provenance (inferred flag, inference_rule, confidence)
        
        Excludes volatile provenance metadata (timestamp, source path, build machine).
        
        This is the "artifact identity" — it changes when source, inference
        rules, or compiler semantics change. Identical runtime hashes mean
        identical runtime behavior.
        """
        nodes_data = {}
        for nid in sorted(self.nodes.keys()):
            node = self.nodes[nid]
            nd: dict = {
                "id": node.id,
                "category": node.category,
                "label": node.label,
                "node_type": node.node_type,
            }
            props = dict(node.properties)

            if "affordances" in props:
                nd["affordances"] = [
                    _canonicalize(a) for a in props["affordances"]
                ]

            if "language_mappings" in props:
                nd["language_mappings"] = {
                    lang: _canonicalize(m)
                    for lang, m in sorted(props["language_mappings"].items())
                }

            if "representations" in props:
                nd["representations"] = [
                    _canonicalize(r) for r in props.get("representations", [])
                ]

            if "definition" in props:
                nd["definition"] = props["definition"]

            nodes_data[nid] = _canonicalize(nd)

        edges_data = []
        for e in sorted(self.edges, key=lambda e: (e.source, e.type, e.target)):
            ed: dict = {
                "source": e.source,
                "type": e.type,
                "target": e.target,
                "strength": round(e.strength, 6),
            }

            # Include semantic edge properties
            if e.properties:
                sem_props = {}
                if "inferred" in e.properties:
                    sem_props["inferred"] = e.properties["inferred"]
                if "rule_id" in e.properties:
                    sem_props["rule_id"] = e.properties["rule_id"]
                if sem_props:
                    ed["properties"] = _canonicalize(sem_props)

            # Include semantic provenance (exclude volatile fields)
            if e.provenance and e.provenance.inferred:
                ed["provenance"] = _canonicalize({
                    "inferred": True,
                    "inference_rule": e.provenance.inference_rule,
                    "confidence": e.provenance.confidence,
                })

            edges_data.append(_canonicalize(ed))

        data = _canonicalize({
            "canonical_version": self.canonical_version,
            "compiler_version": self.compiler_version,
            "inference_ruleset_version": self.inference_ruleset_version,
            "nodes": nodes_data,
            "edges": edges_data,
        })

        return hashlib.sha256(_deterministic_json(data)).hexdigest()

    def compute_hash(self) -> str:
        """
        Default hash: returns the runtime hash (full compiled graph).
        
        Prefer compute_canonical_hash() or compute_runtime_hash() for
        explicit intent. This method exists for backward compatibility.
        """
        return self.compute_runtime_hash()

    def to_dict(self) -> dict:
        return {
            "compiler_version": self.compiler_version,
            "canonical_version": self.canonical_version,
            "inference_ruleset_version": self.inference_ruleset_version,
            "build_timestamp": self.build_timestamp,
            "canonical_hash": self.compute_canonical_hash(),
            "runtime_hash": self.compute_runtime_hash(),
            "node_count": len(self.nodes),
            "edge_count": len(self.edges),
            "nodes": [
                {
                    "id": n.id,
                    "category": n.category,
                    "label": n.label,
                    "node_type": n.node_type,
                    "properties": n.properties,
                    "provenance": n.provenance.to_dict() if n.provenance else None,
                }
                for n in sorted(self.nodes.values(), key=lambda x: x.id)
            ],
            "edges": [
                {
                    "source": e.source,
                    "type": e.type,
                    "target": e.target,
                    "strength": e.strength,
                    "properties": e.properties,
                    "provenance": e.provenance.to_dict() if e.provenance else None,
                }
                for e in self.edges
            ],
        }


def build_graph(documents: List[Dict]) -> RuntimeGraph:
    """
    Build a RuntimeGraph from validated canonical source documents.
    
    Args:
        documents: List of parsed canonical document dicts
    
    Returns:
        A populated RuntimeGraph ready for writing.
    """
    graph = RuntimeGraph()
    graph.build_timestamp = datetime.now(timezone.utc).isoformat()

    # Pass 1: Create nodes from entity documents
    for doc in documents:
        doc_type = detect_document_type(doc)
        file = doc.get("_file", "unknown")
        line = doc.get("_line", 1)

        if doc_type == "entity":
            eid = doc["entity_id"]
            provenance = make_provenance(file, line, doc.get("metadata", {}).get("confidence", 1.0))
            node = GraphNode(
                id=eid,
                category=doc["category"],
                label=doc.get("label", {}).get("default", eid),
                node_type="entity",
                properties={
                    "definition": doc.get("definition", ""),
                    "properties": doc.get("properties", {}),
                },
                provenance=provenance,
            )
            graph.add_node(node)

    # Pass 2: Create edges from relationships
    for doc in documents:
        doc_type = detect_document_type(doc)
        file = doc.get("_file", "unknown")
        line = doc.get("_line", 1)

        if doc_type == "relationship":
            provenance = make_provenance(file, line)
            edge = GraphEdge(
                source=doc["source"],
                type=doc["type"],
                target=doc["target"],
                strength=doc.get("strength", 1.0),
                provenance=provenance,
            )
            graph.add_edge(edge)

    # Pass 3: Attach affordances as properties on entity nodes
    for doc in documents:
        doc_type = detect_document_type(doc)
        if doc_type == "affordance":
            eid = doc["entity_id"]
            node = graph.get_node(eid)
            if node:
                if "affordances" not in node.properties:
                    node.properties["affordances"] = []
                node.properties["affordances"].append({
                    "action": doc["action"],
                    "description": doc.get("description", ""),
                    "typical_outcome": doc.get("typical_outcome", []),
                    "cultural": doc.get("cultural", False),
                    "cultural_notes": doc.get("cultural_notes", ""),
                })

    # Pass 4: Attach language mappings as properties on entity nodes
    for doc in documents:
        doc_type = detect_document_type(doc)
        if doc_type == "lexical_realization":
            eid = doc["entity_id"]
            node = graph.get_node(eid)
            if node:
                if "language_mappings" not in node.properties:
                    node.properties["language_mappings"] = {}
                lang = doc["language"]
                node.properties["language_mappings"][lang] = {
                    "surface": doc["surface"],
                    "pronunciation": doc.get("pronunciation", {}),
                    "grammar": doc.get("grammar", {}),
                    "usage": doc.get("usage", {}),
                    "disambiguation": doc.get("disambiguation"),
                }

    # Pass 5: Attach representations as properties on entity nodes
    for doc in documents:
        doc_type = detect_document_type(doc)
        if doc_type == "representation":
            eid = doc["entity_id"]
            node = graph.get_node(eid)
            if node:
                if "representations" not in node.properties:
                    node.properties["representations"] = []
                node.properties["representations"].append({
                    "modality": doc["modality"],
                    "primary": doc.get("primary", ""),
                    "media": doc.get("media", []),
                    "distinguishing": doc.get("distinguishing", []),
                })

    return graph
