"""
Compiler Diagnostics

Structured, actionable error reporting for the SRE compiler.
Every diagnostic includes:
  - Error code (E001–E010)
  - Severity (error | warning)
  - File and line number
  - Human-readable message
  - Suggested fix (when available)

Inspired by compiler diagnostics (rustc, clang). The goal is that
every error message tells the author exactly what to fix and how.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Diagnostic:
    """A single compiler diagnostic."""
    code: str                 # e.g., "E003"
    severity: str             # "error" | "warning"
    file: str                 # Source file path
    line: int                 # Line number
    message: str              # Human-readable description
    suggestion: Optional[str] = None  # Suggested fix
    detail: Optional[str] = None      # Additional context

    def format(self) -> str:
        """Format diagnostic for console output."""
        prefix = "error" if self.severity == "error" else "warning"
        lines = [
            f"{prefix}[{self.code}]: {self.message}",
            f"  --> {self.file}:{self.line}",
        ]
        if self.suggestion:
            lines.append(f"  help: {self.suggestion}")
        if self.detail:
            lines.append(f"  note: {self.detail}")
        return "\n".join(lines)


class DiagnosticBag:
    """Collects diagnostics during compilation."""

    def __init__(self):
        self.diagnostics: List[Diagnostic] = []
        self._halt_on_error = True

    def error(self, code: str, file: str, line: int, message: str,
              suggestion: str = None, detail: str = None):
        self.diagnostics.append(Diagnostic(
            code=code, severity="error", file=file, line=line,
            message=message, suggestion=suggestion, detail=detail
        ))

    def warn(self, code: str, file: str, line: int, message: str,
             suggestion: str = None, detail: str = None):
        self.diagnostics.append(Diagnostic(
            code=code, severity="warning", file=file, line=line,
            message=message, suggestion=suggestion, detail=detail
        ))

    def has_errors(self) -> bool:
        return any(d.severity == "error" for d in self.diagnostics)

    def print_all(self):
        for d in self.diagnostics:
            print(d.format())

    def summary(self) -> str:
        errors = sum(1 for d in self.diagnostics if d.severity == "error")
        warnings = sum(1 for d in self.diagnostics if d.severity == "warning")
        parts = []
        if errors:
            parts.append(f"{errors} error(s)")
        if warnings:
            parts.append(f"{warnings} warning(s)")
        return ", ".join(parts) if parts else "No issues found"
