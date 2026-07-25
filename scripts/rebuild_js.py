"""Regenerate JS bundles and copy audio files to app/docs dirs."""
import sys, shutil, yaml, re, json
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "core"))

from languages.surface_form import SurfaceFormRegistry, Pronunciation, AudioRef
from languages.voice_package import VoicePackageRegistry

EXPERIENCE_DIRS = ["river_world", "wife_world"]
APP_DIRS = [ROOT / "apps" / "river-world", ROOT / "docs"]
PKG_DIR = ROOT / "docs" / "packages" / "language-data"

VOICE_PACKAGE_MAP = {
    "af_v1": "af",
    "mi_teaka_v1": "mi",
}

# Map language directory names to voice packages
LANG_DIR_TO_PKG = {
    "afrikaans": "af_v1",
}

# --- Load voice contributions from languages/<lang>/VC_*.yaml ---
# These are the "database" — recordings linked to surface forms via ref_id.
def load_contributions():
    """Load VC_*.yaml contributions from all language directories."""
    contribs = []
    for lang_dir in sorted(ROOT.glob("languages/*")):
        if not lang_dir.is_dir():
            continue
        for vc_file in sorted(lang_dir.glob("VC_*.yaml")):
            raw = vc_file.read_text(encoding="utf-8")
            c = {"source_file": vc_file.name}
            for pat, key in [
                (r'^\s+id:\s*(\S+)', 'id'),
                (r'^\s+ref_id:\s*(\S+)', 'ref_id'),
                (r'^\s+language:\s*(\S+)', 'language'),
                (r'^\s+filename:\s*(\S+)', 'filename'),
                # speaker name must be after 'speaker:' line, not inside 'filename:'
                (r'^\s+name:\s*(.*?)$', 'speaker'),
                (r'^\s+license:\s*(\S+)', 'license'),
                (r'^\s+format:\s*(\S+)', 'format'),
            ]:
                m = re.search(pat, raw, re.MULTILINE)
                if m:
                    c[key] = m.group(1).strip()
            # text: can span multiple lines; grab until next known key
            m = re.search(r'^\s+text:\s*(.*?)(?=^\s+\w+:|\Z)', raw, re.MULTILINE | re.DOTALL)
            if m:
                txt = m.group(1).strip()
                txt = re.sub(r"^'(.*)'$", r'\1', txt)
                txt = re.sub(r'^"(.*)"$', r'\1', txt)
                c['text'] = txt
            if c.get('id'):
                contribs.append(c)
    return contribs

CONTRIBUTIONS = load_contributions()
if CONTRIBUTIONS:
    print(f"Loaded {len(CONTRIBUTIONS)} voice contributions")

# --- surface_forms.js — merge from all experience dirs, enriched with VC contributions ---
all_surface_forms = {}
for exp_dir in EXPERIENCE_DIRS:
    sf_path = ROOT / "experiences" / exp_dir / "surface_forms.yaml"
    if not sf_path.exists():
        print(f"Skipping {exp_dir}: no surface_forms.yaml")
        continue
    sf_reg = SurfaceFormRegistry.from_yaml(sf_path)
    for sf in sf_reg._by_id.values():
        # Avoid duplicates by text+lang+entity_id
        key = (sf.text, sf.lang, sf.entity_id)
        if key not in all_surface_forms:
            all_surface_forms[key] = sf

# Enrich with audio_refs from VC contributions
for key, sf in all_surface_forms.items():
    matching = [c for c in CONTRIBUTIONS if c.get('ref_id') == sf.id]
    if not matching:
        continue
    existing_refs = {r.ref for r in sf.pronunciation.audio_refs}
    for c in matching:
        filename = c.get('filename', '')
        if not filename or filename in existing_refs:
            continue
        lang = c.get('language', '')
        pkg_id = None
        for pid, plang in VOICE_PACKAGE_MAP.items():
            if plang == lang:
                pkg_id = pid
                break
        if pkg_id is None:
            continue
        new_ref = AudioRef(
            ref=filename,
            package=pkg_id,
            speaker=c.get('speaker', 'anonymous'),
            dialect='South African',
            speed='normal',
            quality='field',
            source_license=c.get('license', 'CC-BY-4.0'),
        )
        sf.pronunciation.audio_refs.append(new_ref)
        existing_refs.add(filename)

# Rebuild as a merged SurfaceFormRegistry
merged_reg = SurfaceFormRegistry()
for sf in all_surface_forms.values():
    merged_reg.register(sf)
sf_js = merged_reg.to_js_bundle()

for dest in APP_DIRS:
    (dest / "surface_forms.js").write_text(sf_js, encoding="utf-8")
    print(f"Wrote surface_forms.js to {dest}")
(PKG_DIR / "surface_forms.js").write_text(sf_js, encoding="utf-8")
print(f"Wrote surface_forms.js to {PKG_DIR}")

# --- voice_packages.js — use curated version from packages/language-data/ ---
# This includes af_v1 (Hannes recordings) which is not in the experience dirs.
# The experience dirs only have placeholder/TTS packages.
vp_src = PKG_DIR / "voice_packages.js"
if vp_src.exists():
    vp_js = vp_src.read_text(encoding="utf-8")
    for dest in APP_DIRS:
        (dest / "voice_packages.js").write_text(vp_js, encoding="utf-8")
        print(f"Wrote voice_packages.js to {dest}")
else:
    print("WARN: no curated voice_packages.js found at {vp_src}")

# --- maori-phrases.js — sentence-level recording registry from all YAMLs ---
# Populated from RIVER and WIFE YAML files so structure is ready for recordings
mi_phrases = []
for exp_dir in EXPERIENCE_DIRS:
    dir_path = ROOT / "experiences" / exp_dir
    for yf in sorted(dir_path.glob("*.yaml")):
        if yf.name == "surface_forms.yaml":
            continue  # skip surface_forms
        with open(yf, encoding="utf-8") as f:
            data = yaml.safe_load(f)
        exp_id = data.get("experience_id", yf.stem)
        mi_content = data.get("content", {}).get("mi", "")
        if not mi_content:
            continue
        # Split into individual sentences
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', mi_content) if s.strip()]
        for idx, sentence in enumerate(sentences):
            phrase_id = f"{exp_id}_S{idx+1:02d}"
            mi_phrases.append({
                "id": phrase_id,
                "lang": "mi",
                "text": sentence,
                "intent": exp_id,
                "situation": f"Sentence {idx+1} of {exp_id}",
                "audio_refs": [],
            })
        # Also add a full-passage entry (no audio_refs yet)
        mi_phrases.append({
            "id": exp_id,
            "lang": "mi",
            "text": mi_content.strip(),
            "intent": exp_id,
            "type": "passage",
            "situation": f"Full passage recording for {exp_id}",
            "audio_refs": [],
        })

mi_json = json.dumps(mi_phrases, ensure_ascii=False, indent=2)
lines = [
    "/**",
    " * Māori Phrase Registry — sentence & passage-level recordings (extensible).",
    " * Auto-generated by rebuild_js.py from RIVER and WIFE YAML files.",
    " * Add audio_refs to entries when sentence or passage recordings are acquired.",
    " * The runtime automatically prefers these over word-by-word composition.",
    " */",
    "var MI_PHRASES = " + mi_json + ";",
    "",
    "/**",
    " * Look up Māori phrase/sentence recordings by intent and optional type.",
    " * @param {string} intent — passage ID like 'RIVER_002' or 'WIFE_001'",
    " * @param {string} [type] — 'passage' for full passage, 'sentence' for individual",
    " * @returns {Array} matching phrase entries",
    " */",
    "function lookupMiPhrases(intent, type) {",
    "  if (!intent || typeof MI_PHRASES === 'undefined') return [];",
    "  return MI_PHRASES.filter(function(p) {",
    "    if (p.intent !== intent) return false;",
    "    if (type && p.type !== type) return false;",
    "    return true;",
    "  });",
    "}",
]

lines.insert(1, " *")
lines.insert(1, " * Auto-generated — do not edit directly. Edit the RIVER/WIFE YAML files and rebuild.")

for dest in APP_DIRS:
    (dest / "maori-phrases.js").write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote maori-phrases.js to {dest}")
(PKG_DIR / "maori-phrases.js").write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote maori-phrases.js to {PKG_DIR}")

# --- Copy audio files from experience dirs AND language contribution dirs ---
for dest in [d / "voices" for d in APP_DIRS]:
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True, exist_ok=True)

# Copy from experience dirs
for exp_dir in EXPERIENCE_DIRS:
    src_voices = ROOT / "experiences" / exp_dir / "voices"
    if not src_voices.exists():
        continue
    for item in src_voices.rglob("*"):
        if item.is_file():
            rel_path = item.relative_to(src_voices)
            for dest in [d / "voices" for d in APP_DIRS]:
                target = dest / rel_path
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, target)
    print(f"Copied voice packages from {exp_dir}")

# Copy audio files from language contribution directories
for lang_dir in sorted(ROOT.glob("languages/*")):
    if not lang_dir.is_dir():
        continue
    audio_files = list(lang_dir.glob("*.webm")) + list(lang_dir.glob("*.mp3")) + list(lang_dir.glob("*.ogg"))
    if not audio_files:
        continue
    lang_name = lang_dir.name
    pkg_id = LANG_DIR_TO_PKG.get(lang_name)
    if pkg_id is None:
        continue
    for dest in [d / "voices" / pkg_id / "audio" for d in APP_DIRS]:
        dest.mkdir(parents=True, exist_ok=True)
        for f in audio_files:
            shutil.copy2(f, dest / f.name)
    print(f"Copied {len(audio_files)} audio files from languages/{lang_name}/")

print("Done")
