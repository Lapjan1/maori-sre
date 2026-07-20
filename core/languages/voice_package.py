"""
Voice Package — a named set of audio recordings from one speaker.

Every audio_ref in a surface form references a voice package.
Switching packages changes which recordings play without touching the semantic layer.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
import yaml
from pathlib import Path


@dataclass
class VoicePackage:
    id: str
    name: str
    speaker: str
    language: str
    dialect: str = "Standard"
    style: str = "calm"
    speed: str = "normal"
    quality: str = "studio"
    version: str = "1.0"
    recorded_at: Optional[str] = None
    license: str = "proprietary"

    @property
    def base_path(self) -> str:
        """Relative path for audio file lookups: voices/{id}/audio/"""
        return f"voices/{self.id}/audio/"


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
        return pkgs[0] if pkgs else None

    @classmethod
    def from_directory(cls, root: str | Path) -> VoicePackageRegistry:
        reg = cls()
        root = Path(root)
        for pkg_dir in root.iterdir():
            pkg_file = pkg_dir / "package.yaml"
            if pkg_file.exists():
                with open(pkg_file, encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                pkg_data = data.get("voice_package", data)
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
        return json.dumps({
            "id": pkg.id,
            "name": pkg.name,
            "speaker": pkg.speaker,
            "language": pkg.language,
            "dialect": pkg.dialect,
            "style": pkg.style,
            "speed": pkg.speed,
            "quality": pkg.quality,
            "version": pkg.version,
            "base_path": pkg.base_path,
        }, ensure_ascii=False)
