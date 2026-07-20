"""
Bundle compiled experiences into a JS file for the River World app.
"""
import json
from pathlib import Path


def bundle():
    exp_dir = Path("../output/experiences")
    out_dir = Path("../apps/river-world")
    out_dir.mkdir(parents=True, exist_ok=True)

    experiences = []
    for f in sorted(exp_dir.glob("*.json")):
        data = json.load(open(f, "r", encoding="utf-8"))
        exp = {
            "id": data["experience_id"],
            "type": data["type"],
            "level": data["level"],
            "title": data["title"],
            "content": data["content"],
            "entities": [
                {
                    "id": e["entity_id"],
                    "category": e["category"],
                    "label": e.get("label", {}),
                }
                for e in data.get("entities", [])
            ],
            "interactions": [
                {
                    "id": i.get("interaction_id", f"INT_{n}"),
                    "sentences": i.get("sentences", {}),
                    "action": i.get("action", ""),
                }
                for n, i in enumerate(data.get("interactions", []))
            ],
        }
        experiences.append(exp)

    js = "const EXPERIENCES = " + json.dumps(experiences, indent=2, ensure_ascii=False) + ";"
    with open(out_dir / "experiences.js", "w", encoding="utf-8") as f:
        f.write(js)

    manifest = [e["id"] for e in experiences]
    print(f"Bundled {len(experiences)} experiences into {out_dir / 'experiences.js'}")

    # Also copy the runtime graph for reference
    return experiences


if __name__ == "__main__":
    bundle()
