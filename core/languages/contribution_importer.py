"""
Contribution Importer — reads VC_*.yaml contribution metadata files
and injects audio_refs into surface_forms.yaml source files.

This is the bridge between:
  Recording app -> languages/<lang>/VC_*.yaml  (contributions)
  -> surface_forms.yaml (source-of-truth updated with audio_refs)
  -> rebuild_js.py (compiles to JS bundles)

Usage:
    python -m core.languages.contribution_importer [--lang-dir afrikaans] [--dry-run]
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import yaml
import re
import sys
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent

VOICE_PACKAGES = {
    "af_v1": {"lang": "af", "audio_dir": ROOT / "docs" / "voices" / "af_v1" / "audio"},
    "mi_teaka_v1": {"lang": "mi", "audio_dir": ROOT / "docs" / "voices" / "mi_teaka_v1" / "audio"},
}

EXPERIENCE_DIRS = [
    ROOT / "experiences" / "river_world",
    ROOT / "experiences" / "wife_world",
]


def _extract_contrib_from_text(text: str):
    """Extract contribution fields from raw text using simple patterns.

    This avoids full YAML parsing for files with 'n quoting issues
    or multi-line text without proper quoting.
    """
    c = {}
    m = re.search(r'^\s+id:\s*(\S+)', text, re.MULTILINE)
    if m: c['id'] = m.group(1)
    # type can appear multiple times; prefer 'word' or 'phrase' or 'passage'
    types = re.findall(r'^\s+type:\s*(\S+)', text, re.MULTILINE)
    if types: c['type'] = types[0]
    m = re.search(r'^\s+ref_id:\s*(\S+)', text, re.MULTILINE)
    if m: c['ref_id'] = m.group(1)
    m = re.search(r'^\s+language:\s*(\S+)', text, re.MULTILINE)
    if m: c['language'] = m.group(1)
    # text: can span multiple lines before next known key
    # We capture from 'text:' line up to the next key at same indent
    m = re.search(r'^\s+text:\s*(.*?)(?=^\s+\w+:|\Z)', text, re.MULTILINE | re.DOTALL)
    if m:
        val = m.group(1).strip()
        # Remove leading/trailing quotes if they exist
        val = re.sub(r"^'(.*)'$", r'\1', val)
        val = re.sub(r'^"(.*)"$', r'\1', val)
        c['text'] = val
    m = re.search(r'^\s+translation_en:\s*(.*?)(?=^\s+\w+:|\Z)', text, re.MULTILINE | re.DOTALL)
    if m:
        val = m.group(1).strip()
        val = re.sub(r"^'(.*)'$", r'\1', val)
        c['translation_en'] = val
    m = re.search(r'filename:\s*(\S+)', text)
    if m: c['filename'] = m.group(1)
    m = re.search(r'format:\s*(\S+)', text)
    if m: c['format'] = m.group(1)
    m = re.search(r'license:\s*(\S+)', text)
    if m: c['license'] = m.group(1)
    m = re.search(r'name:\s*(.*?)(?:\n|$)', text)
    if m: c['speaker_name'] = m.group(1).strip()
    return c


def load_contributions(lang_dir: Path) -> list[dict]:
    """Load all VC_*.yaml files from a language directory using text extraction."""
    contributions = []
    if not lang_dir.exists():
        return contributions
    for f in sorted(lang_dir.glob("VC_*.yaml")):
        raw = f.read_text(encoding="utf-8")
        c = _extract_contrib_from_text(raw)
        if not c.get('id'):
            print(f"  WARN: could not parse {f.name}", file=sys.stderr)
            continue
        contributions.append(c)
    return contributions


def inject_audio_refs(contributions: list[dict], dry_run: bool = False):
    """Inject audio_refs from contributions into surface_forms.yaml files."""
    for exp_dir in EXPERIENCE_DIRS:
        sf_path = exp_dir / "surface_forms.yaml"
        if not sf_path.exists():
            continue
        with open(sf_path, encoding="utf-8") as f:
            data = yaml.safe_load(f)
        sf_list = data.get("surface_forms", [])
        modified = False

        for sf in sf_list:
            sf_id = sf.get("id", "")
            matching = [c for c in contributions if c.get("ref_id") == sf_id]
            if not matching:
                continue

            pron = sf.setdefault("pronunciation", {})
            existing_refs = pron.setdefault("audio_refs", [])
            existing_filenames = {r.get("ref") for r in existing_refs if isinstance(r, dict)}

            for c in matching:
                filename = c.get("filename", "")
                if not filename or filename in existing_filenames:
                    continue
                lang = c.get("language", "")
                pkg_id = None
                for pid, info in VOICE_PACKAGES.items():
                    if info["lang"] == lang:
                        pkg_id = pid
                        break
                if pkg_id is None:
                    continue

                new_ref = {
                    "ref": filename,
                    "package": pkg_id,
                    "speaker": c.get("speaker_name", "anonymous"),
                    "dialect": "South African",
                    "speed": "normal",
                    "quality": "field",
                    "source_license": c.get("license", "CC-BY-4.0"),
                }
                existing_refs.append(new_ref)
                modified = True
                print(f"  + {filename} -> {sf_id}")

        if modified:
            if dry_run:
                print(f"  [dry-run] Would update {sf_path.name}")
            else:
                with open(sf_path, "w", encoding="utf-8") as f:
                    yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False, width=120)
                print(f"  Updated {sf_path.name}")


def copy_audio_files(contributions: list[dict], lang_dir: Path, dry_run: bool = False):
    """Copy audio files to the voice package audio directory."""
    for c in contributions:
        filename = c.get("filename", "")
        lang = c.get("language", "")
        src = lang_dir / filename
        if not src.exists():
            continue
        for pid, info in VOICE_PACKAGES.items():
            if info["lang"] == lang:
                dest = info["audio_dir"] / filename
                if dry_run:
                    print(f"  [dry-run] Would copy {src.name}")
                else:
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, dest)
                    print(f"  Copied {src.name}")
                break


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Import voice contributions into surface forms")
    parser.add_argument("--lang-dir", type=str, help="Specific language dir under languages/")
    parser.add_argument("--dry-run", action="store_true", help="Don't modify files")
    parser.add_argument("--no-copy", action="store_true", help="Skip copying audio files")
    args = parser.parse_args()

    if args.lang_dir:
        lang_dirs = [ROOT / "languages" / args.lang_dir]
    else:
        lang_dirs = sorted(ROOT.glob("languages/*"))

    for lang_dir in lang_dirs:
        if not lang_dir.is_dir() or not list(lang_dir.glob("VC_*.yaml")):
            continue
        lang_name = lang_dir.name
        contribs = load_contributions(lang_dir)
        if not contribs:
            continue
        print(f"\n=== {lang_name}: {len(contribs)} contributions ===")
        inject_audio_refs(contribs, dry_run=args.dry_run)
        if not args.no_copy:
            copy_audio_files(contribs, lang_dir, dry_run=args.dry_run)

    print("\nDone.")


if __name__ == "__main__":
    main()
