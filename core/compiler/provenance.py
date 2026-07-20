"""
Provenance Tracking

Every compiled artifact in the runtime graph carries a provenance record
tracing it to specific source documents.

Model:
  Provenance(source_file, source_line, compiler_version, timestamp, content_hash, confidence)

Invariant:
  Every node and edge in the runtime graph must have a provenance record.
"""

import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class Provenance:
    """Origin record for a compiled artifact."""
    source_file: str          # Path relative to source root
    source_line: int          # Line number in source file
    compiler_version: str     # SRE compiler version
    timestamp: str            # ISO 8601
    content_hash: str         # SHA-256 of source fragment
    confidence: float         # 0.0 to 1.0
    inferred: bool = False    # True if this fact was derived by inference
    inference_rule: str = ""  # e.g. "INF001" if inferred
    supporting_facts: tuple = ()  # tuple of dicts (frozen, so tuple)

    def to_dict(self) -> dict:
        d = {
            "source_file": self.source_file,
            "source_line": self.source_line,
            "compiler_version": self.compiler_version,
            "timestamp": self.timestamp,
            "content_hash": self.content_hash,
            "confidence": self.confidence,
        }
        if self.inferred:
            d["inferred"] = True
            d["inference_rule"] = self.inference_rule
            d["supporting_facts"] = list(self.supporting_facts)
        return d


COMPILER_VERSION = "0.1"


def hash_content(content: str) -> str:
    """SHA-256 hash of content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def make_provenance(source_file: str, source_line: int,
                    confidence: float = 1.0,
                    content: Optional[str] = None) -> Provenance:
    """Create a provenance record for a compiled artifact."""
    return Provenance(
        source_file=source_file,
        source_line=source_line,
        compiler_version=COMPILER_VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        content_hash=hash_content(content or ""),
        confidence=confidence,
    )
