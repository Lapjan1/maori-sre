"""
Canonical Source Loader

Discovers and parses source documents from a directory.
Supports YAML and JSON formats. Multi-document YAML files are split.

Document type detection:
  - If a document has an 'entity_id' key → entity document
  - If it has 'modality' and 'entity_id' → representation
  - If it has 'action' and 'entity_id' → affordance
  - If it has 'interaction_id' → interaction
  - If it has 'source' and 'type' and 'target' → relationship
  - If it has 'language_id' → language registration
  - If it has 'surface' and 'language' → lexical realization
"""

from pathlib import Path
from typing import List, Dict, Any, Tuple
import json
import yaml


def load_source_directory(source_dir: str) -> Tuple[List[Dict], List[str]]:
    """
    Load all source documents from a directory.
    
    Returns:
        (documents, errors) where documents is a list of parsed document dicts,
        and errors is a list of error messages.
    """
    documents = []
    errors = []
    source_path = Path(source_dir)
    
    if not source_path.exists():
        return [], [f"Source directory not found: {source_dir}"]
    
    for file_path in sorted(source_path.rglob("*")):
        if not file_path.is_file():
            continue
        ext = file_path.suffix.lower()
        if ext not in (".yaml", ".yml", ".json"):
            continue
        
        try:
            content = file_path.read_text(encoding="utf-8")
            if ext in (".yaml", ".yml"):
                docs = list(yaml.safe_load_all(content))
            else:
                docs = [json.loads(content)]
            
            for doc in docs:
                if doc is None:
                    continue
                # Flatten YAML lists (from "---\n- item1\n- item2" syntax)
                items = doc if isinstance(doc, list) else [doc]
                for item in items:
                    if item is None:
                        continue
                    item["_file"] = str(file_path.relative_to(source_path.parent))
                    item["_line"] = _find_document_line(content, item)
                    documents.append(item)
        except Exception as e:
            errors.append(f"Failed to load {file_path}: {e}")
    
    return documents, errors


def _find_document_line(content: str, doc: dict) -> int:
    """Estimate the line number of a document in the source file."""
    # For YAML, look for the document start marker
    lines = content.split("\n")
    for i, line in enumerate(lines, 1):
        if line.strip().startswith("---"):
            return i
    return 1


def detect_document_type(doc: dict) -> str:
    """Identify the type of a parsed canonical document."""
    if "entity_id" in doc and "category" in doc:
        return "entity"
    if "entity_id" in doc and "modality" in doc:
        return "representation"
    if "entity_id" in doc and "action" in doc:
        return "affordance"
    if "interaction_id" in doc:
        return "interaction"
    if "source" in doc and "type" in doc and "target" in doc:
        return "relationship"
    if "language_id" in doc and "name" in doc:
        return "language_registration"
    if "entity_id" in doc and "language" in doc and "surface" in doc:
        return "lexical_realization"
    if "template_id" in doc and "roles" in doc:
        return "template"
    if "grammar_projection" in doc or ("template_id" in doc and "word_order" in doc):
        return "grammar_projection"
    return "unknown"
