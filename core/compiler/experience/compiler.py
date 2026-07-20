"""
Experience Compiler — Transforms experiences into canonical source documents.

An experience is compiled by:
  1. Reading the experience YAML file
  2. Extracting all canonical source documents
  3. Validating internal consistency
  4. Computing metrics (semantic density, reuse ratio)
  5. Outputting compiled experience JSON
"""

from pathlib import Path
from typing import List, Dict, Optional, Set
from dataclasses import dataclass, field
import json

from .reader import read_experience, discover_experiences, ExperienceDocument
from compiler.diagnostics import DiagnosticBag


@dataclass
class ExperienceResult:
    """Result of compiling one or more experiences."""
    experience_id: str = ""
    experience_type: str = ""
    success: bool = False
    documents: Dict[str, List[Dict]] = field(default_factory=dict)
    diagnostics: Optional[DiagnosticBag] = None
    entity_count: int = 0
    affordance_count: int = 0
    interaction_count: int = 0
    relationship_count: int = 0
    language_mapping_count: int = 0
    word_count: int = 0
    semantic_density: float = 0.0
    new_entity_count: int = 0
    existing_entity_count: int = 0
    reuse_ratio: float = 0.0


def compile_experience(
    experience_path: str,
    output_dir: Optional[str] = None,
    existing_entity_ids: Optional[Set[str]] = None
) -> ExperienceResult:
    """
    Compile a single experience into canonical source documents.
    
    Args:
        experience_path: Path to experience YAML file
        output_dir: If provided, write compiled JSON here
        existing_entity_ids: Set of already-known entity IDs for reuse ratio
    
    Returns:
        ExperienceResult with extracted documents and metrics
    """
    result = ExperienceResult()
    bag = DiagnosticBag()
    result.diagnostics = bag
    
    try:
        experience = read_experience(experience_path)
    except Exception as e:
        bag.error("E001", experience_path, 1, f"Failed to read experience: {e}")
        result.success = False
        return result
    
    result.experience_id = experience.experience_id
    result.experience_type = experience.type
    result.word_count = experience.word_count
    
    # Extract all canonical documents
    source_file = str(Path(experience_path).name)
    docs = experience.to_canonical_docs(source_file)
    result.documents = docs
    result.entity_count = len(docs["entities"])
    result.affordance_count = len(docs["affordances"])
    result.interaction_count = len(docs["interactions"])
    result.relationship_count = len(docs["relationships"])
    result.language_mapping_count = len(docs["language_mappings"])
    
    # Compute semantic density
    semantic_units = (result.entity_count + result.affordance_count +
                      result.interaction_count + result.relationship_count)
    result.semantic_density = round(semantic_units / max(1, result.word_count), 2)
    
    # Compute reuse ratio
    if existing_entity_ids:
        new_ids = {e["entity_id"] for e in docs["entities"]} - existing_entity_ids
        result.new_entity_count = len(new_ids)
        result.existing_entity_count = result.entity_count - result.new_entity_count
        result.reuse_ratio = round(result.existing_entity_count / max(1, result.entity_count), 2)
    
    # Validate internal consistency
    entity_ids = {e["entity_id"] for e in docs["entities"]}
    all_refs: Set[str] = set()
    
    for aff in docs["affordances"]:
        all_refs.add(aff["entity_id"])
        all_refs.add(aff["action"])
        for o in aff.get("typical_outcome", []):
            all_refs.add(o)
    
    for rel in docs["relationships"]:
        all_refs.add(rel["source"])
        all_refs.add(rel["target"])
    
    for inter in docs["interactions"]:
        for p in inter.get("participants", []):
            all_refs.add(p["entity_id"])
        all_refs.add(inter.get("action", ""))
    
    for lang in docs["language_mappings"]:
        all_refs.add(lang["entity_id"])
    
    missing = all_refs - entity_ids - {""}
    for ref in sorted(missing):
        bag.warn("E002", experience_path, 1,
                 f"Reference '{ref}' in experience '{experience.experience_id}' "
                 f"does not resolve within this experience.")
    
    # Write output files if requested
    if output_dir:
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        
        output = {
            "experience_id": experience.experience_id,
            "type": experience.type,
            "level": experience.level,
            "title": experience.title,
            "content": experience.content,
            "word_count": result.word_count,
            "semantic_density": result.semantic_density,
            "reuse_ratio": result.reuse_ratio,
            "entities": docs["entities"],
            "affordances": docs["affordances"],
            "interactions": docs["interactions"],
            "relationships": docs["relationships"],
            "language_mappings": docs["language_mappings"],
            "metadata": experience.metadata,
        }
        
        filepath = out_path / f"{experience.experience_id}.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
    
    result.success = not bag.has_errors()
    return result


def compile_all_experiences(
    experiences_dir: str,
    output_dir: Optional[str] = None
) -> List[ExperienceResult]:
    """
    Compile all experiences in a directory tree.
    
    Tracks reuse ratio across all experiences by accumulating entity IDs.
    
    Args:
        experiences_dir: Directory containing experience YAML files
        output_dir: Optional output directory for compiled JSON
    
    Returns:
        List of ExperienceResult for each experience
    """
    exp_paths = discover_experiences(experiences_dir)
    results = []
    all_entity_ids: Set[str] = set()
    
    for path in exp_paths:
        result = compile_experience(
            str(path), output_dir, existing_entity_ids=all_entity_ids
        )
        # Accumulate entity IDs for reuse tracking
        for doc in result.documents.get("entities", []):
            all_entity_ids.add(doc["entity_id"])
        results.append(result)
        
        status = "OK" if result.success else "FAIL"
        reuse_str = f", reuse={result.reuse_ratio}" if result.reuse_ratio else ""
        print(f"  {status}: {result.experience_id} "
              f"[{result.experience_type}] "
              f"({result.entity_count} entities, "
              f"{result.semantic_density} density{reuse_str})")
    
    return results
