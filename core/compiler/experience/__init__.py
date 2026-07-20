"""
SRE Experience Compiler

Transforms experiences (stories, dialogues, observations, procedures, etc.)
into canonical source documents.

An experience is the smallest complete learning unit. Every experience
contains semantic structure embedded in human context.

Usage:
  from compiler.experience import compile_experience
  result = compile_experience("path/to/experience.yaml")
"""

from .compiler import compile_experience, compile_all_experiences, ExperienceResult
from .reader import read_experience, discover_experiences, ExperienceDocument, EXPERIENCE_TYPES

__all__ = [
    "compile_experience", "compile_all_experiences", "ExperienceResult",
    "read_experience", "discover_experiences", "ExperienceDocument",
    "EXPERIENCE_TYPES",
]
