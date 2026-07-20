"""
Canonical Source Validator

Validates source documents against JSON Schema and domain contracts.

Pipeline:
  1. Load source documents (delegates to loader.py)
  2. Validate each document against its JSON Schema
  3. Validate cross-document contracts (reference resolution, cycles)
  4. Produce structured diagnostics

Usage:
  from compiler.validator import validate_source
  bag, documents = validate_source("path/to/source/")
  if bag.has_errors():
      bag.print_all()
"""

import json
from pathlib import Path
from typing import List, Dict, Tuple, Set
from compiler.loader import load_source_directory, detect_document_type
from compiler.diagnostics import DiagnosticBag


def _load_schema(name: str) -> dict:
    """Load a canonical JSON Schema file."""
    schema_path = Path(__file__).parent.parent / "canonical" / name
    with open(schema_path) as f:
        return json.load(f)


def _validate_value(value, schema_node, path: str, bag: DiagnosticBag, file: str, line: int):
    """
    Recursively validate a value against a JSON Schema node.
    
    Args:
        value: The value to validate
        schema_node: The JSON Schema node to validate against
        path: Dot-separated path for error messages
        bag: Diagnostic bag for collecting errors
        file: Source file name
        line: Source line number
    """
    if schema_node is None:
        return
    
    if "required" in schema_node and isinstance(value, dict):
        for field in schema_node["required"]:
            if field not in value:
                bag.error("E001", file, line,
                          f"Missing required field '{field}' at {path}",
                          suggestion=f"Add '{field}' to the document")
    
    if "type" in schema_node:
        expected = schema_node["type"]
        if expected == "object" and not isinstance(value, dict):
            bag.error("E001", file, line,
                      f"Expected object at {path}, got {type(value).__name__}")
            return
        if expected == "array" and not isinstance(value, list):
            bag.error("E001", file, line,
                      f"Expected array at {path}, got {type(value).__name__}")
            return
        if expected == "string" and not isinstance(value, str):
            bag.error("E001", file, line,
                      f"Expected string at {path}, got {type(value).__name__}")
            return
        if expected == "number" and not isinstance(value, (int, float)):
            bag.error("E001", file, line,
                      f"Expected number at {path}, got {type(value).__name__}")
            return
    
    if "pattern" in schema_node and isinstance(value, str):
        import re
        if not re.match(schema_node["pattern"], value):
            bag.error("E001", file, line,
                      f"Field '{path}' value '{value}' does not match pattern "
                      f"'{schema_node['pattern']}'")
    
    if "enum" in schema_node and value not in schema_node["enum"]:
        bag.error("E001", file, line,
                  f"Field '{path}' value '{value}' is not valid. "
                  f"Allowed: {schema_node['enum']}",
                  suggestion=f"Use one of: {', '.join(schema_node['enum'])}")
    
    if "minimum" in schema_node and isinstance(value, (int, float)):
        if value < schema_node["minimum"]:
            bag.error("E001", file, line,
                      f"Field '{path}' value {value} is below minimum {schema_node['minimum']}")
    
    if "maximum" in schema_node and isinstance(value, (int, float)):
        if value > schema_node["maximum"]:
            bag.error("E001", file, line,
                      f"Field '{path}' value {value} is above maximum {schema_node['maximum']}")
    
    if "minItems" in schema_node and isinstance(value, list):
        if len(value) < schema_node["minItems"]:
            bag.error("E001", file, line,
                      f"Field '{path}' has {len(value)} items, minimum is {schema_node['minItems']}")
    
    # Recursively validate properties
    if "properties" in schema_node and isinstance(value, dict):
        for key, prop_schema in schema_node["properties"].items():
            if key in value:
                _validate_value(value[key], prop_schema, f"{path}.{key}", bag, file, line)
    
    # Validate additionalProperties
    if schema_node.get("additionalProperties") is False and isinstance(value, dict):
        known_props = set()
        if "properties" in schema_node:
            known_props = set(schema_node["properties"].keys())
        extra = set(value.keys()) - known_props - {"_file", "_line"}
        if extra:
            bag.warn("W001", file, line,
                     f"Unexpected field(s) at {path}: {', '.join(sorted(extra))}")
    
    # Validate items in arrays
    if "items" in schema_node and isinstance(value, list):
        for i, item in enumerate(value):
            _validate_value(item, schema_node["items"], f"{path}[{i}]", bag, file, line)
    
    # Handle oneOf — use temporary bags to avoid false errors
    if "oneOf" in schema_node:
        matched = 0
        for option_index, option in enumerate(schema_node["oneOf"]):
            test_bag = DiagnosticBag()
            _validate_value(value, option, path, test_bag, file, line)
            if not test_bag.has_errors():
                matched += 1
        if matched == 0:
            bag.error("E001", file, line,
                      f"Field '{path}' did not match any schema variant. "
                      f"Checked {len(schema_node['oneOf'])} variant(s)")
        elif matched > 1:
            bag.error("E001", file, line,
                      f"Field '{path}' matched {matched} schema variants (must match exactly 1)")
    
    # Handle $ref
    if "$ref" in schema_node and isinstance(value, dict):
        ref_path = schema_node["$ref"]
        parts = ref_path.lstrip("#/").split("/")
        ref_schema = schema_node
        for part in parts:
            if isinstance(ref_schema, dict) and part in ref_schema:
                ref_schema = ref_schema[part]
            else:
                break
        if ref_schema != schema_node:
            _validate_value(value, ref_schema, path, bag, file, line)


def _validate_schema(doc: dict, schema: dict, bag: DiagnosticBag):
    """
    Validate a single document against its JSON Schema.
    """
    file = doc.get("_file", "unknown")
    line = doc.get("_line", 1)
    _validate_value(doc, schema, "", bag, file, line)


def _get_all_entity_ids(documents: List[Dict]) -> Set[str]:
    """Collect all entity IDs from entity documents."""
    ids = set()
    for doc in documents:
        if detect_document_type(doc) == "entity":
            eid = doc.get("entity_id")
            if eid:
                ids.add(eid)
    return ids


def _validate_references(documents: List[Dict], entity_ids: Set[str],
                          bag: DiagnosticBag):
    """Validate that all entity references resolve to existing entities."""
    for doc in documents:
        doc_type = detect_document_type(doc)
        file = doc.get("_file", "unknown")
        line = doc.get("_line", 1)
        
        # Validate entity_id field in non-entity documents
        if "entity_id" in doc and doc_type != "entity":
            eid = doc["entity_id"]
            if isinstance(eid, str) and eid not in entity_ids:
                bag.error("E003", file, line,
                          f"Entity reference '{eid}' not found",
                          suggestion=f"Define entity '{eid}' or fix the reference")
        
        # Validate action field in affordances
        if doc_type == "affordance" and "action" in doc:
            action_id = doc["action"]
            if action_id not in entity_ids:
                bag.error("E003", file, line,
                          f"Action reference '{action_id}' not found",
                          suggestion=f"Define ACTION entity '{action_id}' or fix the reference")
        
        # Validate relationship source and target
        if doc_type == "relationship":
            for field in ("source", "target"):
                ref = doc.get(field)
                if ref and ref not in entity_ids:
                    bag.error("E003", file, line,
                              f"Relationship {field} '{ref}' not found")
            # Check self-loops
            if doc.get("source") and doc.get("target") and doc["source"] == doc["target"]:
                bag.error("E005", file, line,
                          f"Self-loop relationship: {doc['source']} references itself",
                          suggestion="Remove the self-referencing relationship")
        
        # Validate typical actor and outcome references
        for field in ("typical_actors", "typical_outcome"):
            if field in doc and isinstance(doc[field], list):
                for ref in doc[field]:
                    if ref not in entity_ids:
                        bag.warn("W002", file, line,
                                 f"Reference '{ref}' in {field} not found")


def _detect_cycles(documents: List[Dict], bag: DiagnosticBag):
    """Detect cycles in is_a and part_of relationship chains."""
    adj = {}  # entity_id -> list of (target, type)
    
    for doc in documents:
        if detect_document_type(doc) == "relationship":
            rtype = doc.get("type")
            if rtype in ("is_a", "part_of"):
                src = doc.get("source")
                tgt = doc.get("target")
                if src and tgt:
                    adj.setdefault(src, []).append((tgt, rtype))
    
    visited = set()
    path = []
    
    def dfs(node: str, rtype: str):
        if node in path:
            cycle_start = path.index(node)
            cycle = path[cycle_start:] + [node]
            bag.error("E004", "relationships", 0,
                      f"Cycle detected in {rtype} chain: {' → '.join(cycle)}",
                      suggestion="Remove or rewire one of the relationships in the cycle")
            return
        if node in visited:
            return
        visited.add(node)
        path.append(node)
        for neighbor, nt in adj.get(node, []):
            if nt == rtype:
                dfs(neighbor, nt)
        path.pop()
    
    for node in adj:
        dfs(node, "is_a")
        dfs(node, "part_of")


def validate_source(source_dir: str) -> Tuple[DiagnosticBag, List[Dict]]:
    """
    Validate all source documents in a directory.
    
    Returns:
        (bag, documents) — bag contains diagnostics, documents are the parsed docs
    """
    bag = DiagnosticBag()
    
    # Stage 1: Load
    documents, load_errors = load_source_directory(source_dir)
    for err in load_errors:
        bag.error("E000", source_dir, 1, err)
    
    if load_errors:
        return bag, documents
    
    # Stage 2: Schema validation per document
    schema_map = {
        "entity": "entity.schema.json",
        "representation": "representation.schema.json",
        "affordance": "affordance.schema.json",
        "interaction": "interaction.schema.json",
        "relationship": "relationship.schema.json",
    }
    
    for doc in documents:
        doc_type = detect_document_type(doc)
        schema_name = schema_map.get(doc_type)
        if schema_name:
            schema = _load_schema(schema_name)
            _validate_schema(doc, schema, bag)
    
    # Stage 3: Cross-document contract validation
    entity_ids = _get_all_entity_ids(documents)
    _validate_references(documents, entity_ids, bag)
    _detect_cycles(documents, bag)
    
    return bag, documents
