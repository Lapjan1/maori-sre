"""
Surface Form layer — the bridge between semantic entities and their written forms.

Entity (semantic)
    |
Language Mapping
    |
Surface Form  <-- this module
    id: SF_MI_THING_001
    text: "wai"
    |
Pronunciation
    ipa: /wai/
    syllables: ["wai"]
    audio_refs: [...]
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
import yaml
from pathlib import Path


@dataclass
class AudioRef:
    ref: str
    speaker: Optional[str] = None
    dialect: Optional[str] = None
    speed: str = "normal"        # normal, slow
    quality: str = "studio"      # studio, field, tts


@dataclass
class Pronunciation:
    ipa: Optional[str] = None
    syllables: list[str] = field(default_factory=list)
    stress: Optional[int] = None          # which syllable is stressed (1-indexed)
    audio_refs: list[AudioRef] = field(default_factory=list)


@dataclass
class SurfaceForm:
    id: str
    entity_id: str
    lang: str
    text: str
    pronunciation: Pronunciation = field(default_factory=Pronunciation)

    @property
    def has_native_audio(self) -> bool:
        return any(
            r.quality != "tts"
            for r in self.pronunciation.audio_refs
        )

    @property
    def best_audio_ref(self) -> Optional[AudioRef]:
        """Highest quality native recording, or None."""
        ranked = sorted(
            [r for r in self.pronunciation.audio_refs if r.quality != "tts"],
            key=lambda r: {"studio": 0, "field": 1}.get(r.quality, 2),
        )
        return ranked[0] if ranked else None


class SurfaceFormRegistry:
    """Indexes SurfaceForms by surface_form_id and by (entity_id, lang)."""

    def __init__(self):
        self._by_id: dict[str, SurfaceForm] = {}
        self._by_entity: dict[str, dict[str, SurfaceForm]] = {}  # entity_id -> {lang -> SurfaceForm}

    def register(self, sf: SurfaceForm):
        self._by_id[sf.id] = sf
        self._by_entity.setdefault(sf.entity_id, {})[sf.lang] = sf

    def get(self, sf_id: str) -> Optional[SurfaceForm]:
        return self._by_id.get(sf_id)

    def lookup(self, entity_id: str, lang: str) -> Optional[SurfaceForm]:
        return self._by_entity.get(entity_id, {}).get(lang)

    def all_for_entity(self, entity_id: str) -> list[SurfaceForm]:
        return list(self._by_entity.get(entity_id, {}).values())

    def all_for_lang(self, lang: str) -> list[SurfaceForm]:
        return [sf for sf in self._by_id.values() if sf.lang == lang]

    @classmethod
    def from_yaml(cls, path: str | Path) -> SurfaceFormRegistry:
        reg = cls()
        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f)
        for entry in data.get("surface_forms", []):
            pron = entry.get("pronunciation", {}) or {}
            audio_refs = [
                AudioRef(**r) for r in pron.get("audio_refs", [])
            ] if pron.get("audio_refs") else []
            pronunciation = Pronunciation(
                ipa=pron.get("ipa"),
                syllables=pron.get("syllables", []),
                stress=pron.get("stress"),
                audio_refs=audio_refs,
            )
            sf = SurfaceForm(
                id=entry["id"],
                entity_id=entry["entity_id"],
                lang=entry["lang"],
                text=entry["text"],
                pronunciation=pronunciation,
            )
            reg.register(sf)
        return reg

    def to_js_bundle(self) -> str:
        """Generate a JavaScript file that defines SURFACE_FORMS and SURFACE_FORM_INDEX."""
        lines = ["var SURFACE_FORMS = {"]
        for sf in self._by_id.values():
            entry = self._sf_to_js(sf)
            lines.append(f"  {sf.id}: {entry},")
        lines.append("};")

        # Build entity -> lang -> surface_form_id index
        lines.append("var SURFACE_FORM_INDEX = {")
        for entity_id, lang_map in self._by_entity.items():
            lines.append(f'  "{entity_id}": {{')
            for lang, sf in lang_map.items():
                lines.append(f'    "{lang}": "{sf.id}",')
            lines.append("  },")
        lines.append("};")

        return "\n".join(lines)

    def _sf_to_js(self, sf: SurfaceForm) -> str:
        d = {
            "id": sf.id,
            "entity_id": sf.entity_id,
            "lang": sf.lang,
            "text": sf.text,
        }
        if sf.pronunciation.ipa or sf.pronunciation.syllables or sf.pronunciation.audio_refs:
            pron = {}
            if sf.pronunciation.ipa:
                pron["ipa"] = sf.pronunciation.ipa
            if sf.pronunciation.syllables:
                pron["syllables"] = sf.pronunciation.syllables
            if sf.pronunciation.stress is not None:
                pron["stress"] = sf.pronunciation.stress
            if sf.pronunciation.audio_refs:
                pron["audio_refs"] = [
                    {
                        "ref": r.ref,
                        "speaker": r.speaker,
                        "dialect": r.dialect,
                        "speed": r.speed,
                        "quality": r.quality,
                    }
                    for r in sf.pronunciation.audio_refs
                ]
            d["pronunciation"] = pron

        import json
        return json.dumps(d, ensure_ascii=False)
