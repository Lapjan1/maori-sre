"""
Voice Package — a named set of audio recordings from one speaker.

Every audio_ref in a surface form references a voice package.
Switching packages changes which recordings play without touching the semantic layer.

Packages are independently versioned, reviewed, and published.
"""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Optional
import yaml
from pathlib import Path


@dataclass
class SpeakerInfo:
    name: str
    native: bool = False


@dataclass
class ReviewStatus:
    native: bool = False
    reviewed: bool = False
    pronunciation: str = "unreviewed"   # unreviewed, verified, approved
    grammar: str = "unreviewed"


@dataclass
class Coverage:
    corpus: str = ""
    experience_count: int = 0
    surface_form_count: int = 0
    percentage: float = 0.0


@dataclass
class VoicePackage:
    id: str
    language: str
    speaker: SpeakerInfo
    dialect: str = "Standard"
    register: str = "neutral"
    license: str = "proprietary"
    recorded: Optional[str] = None
    sample_rate: int = 48000
    format: str = "ogg"
    coverage: Coverage = field(default_factory=Coverage)
    version: str = "1.0"
    review: ReviewStatus = field(default_factory=ReviewStatus)
    # Legacy flat fields - kept for backward compat with to_js_bundle
    name: str = ""
    style: str = "neutral"
    speed: str = "normal"

    def __post_init__(self):
        if not self.name:
            self.name = f"{self.language} ({self.dialect})"

    @property
    def base_path(self) -> str:
        return f"voices/{self.id}/audio/"

    @property
    def is_verified(self) -> bool:
        return self.review.reviewed and self.review.pronunciation == "verified"


class VoicePackageRegistry:
    """Indexes VoicePackages by id and by language."""

    def __init__(self):
        self._by_id: dict[str, VoicePackage] = {}
        self._by_lang: dict[str, list[VoicePackage]] = {}

    def register(self, pkg: VoicePackage):
        self._by_id[pkg.id] = pkg
        self._by_lang.setdefault(pkg.language, []).append(pkg)

    def get(self, pkg_id: str) -> Optional[VoicePackage]:
        return self._by_id.get(pkg_id)

    def for_language(self, lang: str) -> list[VoicePackage]:
        return self._by_lang.get(lang, [])

    def default_for(self, lang: str) -> Optional[VoicePackage]:
        pkgs = self.for_language(lang)
        if not pkgs:
            return None
        # Prefer verified, then native speaker, then first
        verified = [p for p in pkgs if p.is_verified]
        if verified:
            return verified[0]
        native = [p for p in pkgs if p.speaker.native]
        if native:
            return native[0]
        return pkgs[0]

    @classmethod
    def from_directory(cls, root: str | Path) -> VoicePackageRegistry:
        reg = cls()
        root = Path(root)
        for pkg_dir in sorted(root.iterdir()):
            pkg_file = pkg_dir / "package.yaml"
            if pkg_file.exists():
                with open(pkg_file, encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                pkg_data = data.get("voice_package", data)
                # Expand nested speaker/coverage/review if present as dicts
                if isinstance(pkg_data.get("speaker"), dict):
                    pkg_data["speaker"] = SpeakerInfo(**pkg_data["speaker"])
                else:
                    pkg_data["speaker"] = SpeakerInfo(name=str(pkg_data.get("speaker", "")))
                if isinstance(pkg_data.get("coverage"), dict):
                    pkg_data["coverage"] = Coverage(**pkg_data["coverage"])
                if isinstance(pkg_data.get("review"), dict):
                    pkg_data["review"] = ReviewStatus(**pkg_data["review"])
                reg.register(VoicePackage(**pkg_data))
        return reg

    def to_js_bundle(self) -> str:
        lines = ["var VOICE_PACKAGES = {"]
        for pkg in self._by_id.values():
            lines.append(f'  "{pkg.id}": {self._pkg_to_js(pkg)},')
        lines.append("};")

        lines.append("var DEFAULT_VOICE_PACKAGES = {")
        for lang in sorted(self._by_lang.keys()):
            default = self.default_for(lang)
            if default:
                lines.append(f'  "{lang}": "{default.id}",')
        lines.append("};")

        return "\n".join(lines)

    def _pkg_to_js(self, pkg: VoicePackage) -> str:
        import json
        d = {
            "id": pkg.id,
            "name": pkg.name,
            "language": pkg.language,
            "dialect": pkg.dialect,
            "register": pkg.register,
            "license": pkg.license,
            "version": pkg.version,
            "base_path": pkg.base_path,
            "format": pkg.format,
            "sample_rate": pkg.sample_rate,
            "speaker": {"name": pkg.speaker.name, "native": pkg.speaker.native},
            "coverage": {
                "corpus": pkg.coverage.corpus,
                "experience_count": pkg.coverage.experience_count,
                "surface_form_count": pkg.coverage.surface_form_count,
                "percentage": pkg.coverage.percentage,
            },
            "review": {
                "native": pkg.review.native,
                "reviewed": pkg.review.reviewed,
                "pronunciation": pkg.review.pronunciation,
                "grammar": pkg.review.grammar,
            },
        }
        if pkg.recorded:
            d["recorded"] = pkg.recorded
        return json.dumps(d, ensure_ascii=False)
