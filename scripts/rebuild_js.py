"""Regenerate JS bundles and copy audio files to app/docs dirs."""
import sys, shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "core"))

from languages.surface_form import SurfaceFormRegistry
from languages.voice_package import VoicePackageRegistry

# --- surface_forms.js ---
sf_reg = SurfaceFormRegistry.from_yaml(
    ROOT / "experiences" / "river_world" / "surface_forms.yaml"
)
sf_js = sf_reg.to_js_bundle()

for dest in [ROOT / "apps" / "river-world", ROOT / "docs"]:
    (dest / "surface_forms.js").write_text(sf_js, encoding="utf-8")
    print(f"Wrote surface_forms.js to {dest}")

# --- voice_packages.js ---
vp_reg = VoicePackageRegistry.from_directory(
    ROOT / "experiences" / "river_world" / "voices"
)
vp_js = vp_reg.to_js_bundle()

for dest in [ROOT / "apps" / "river-world", ROOT / "docs"]:
    (dest / "voice_packages.js").write_text(vp_js, encoding="utf-8")
    print(f"Wrote voice_packages.js to {dest}")

# --- Copy audio files to docs/voices/ ---
src_voices = ROOT / "experiences" / "river_world" / "voices"
for dest in [ROOT / "apps" / "river-world" / "voices", ROOT / "docs" / "voices"]:
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src_voices, dest)
    print(f"Copied audio files to {dest}")

print("Done")
