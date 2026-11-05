"""Preflight the exact local image inputs before calling built-in ImageGen."""
from pathlib import Path
import argparse, hashlib, json, sys

APP = Path(__file__).resolve().parents[1]
PACK_DIR = APP / "docs/image-references"
REQUIRED = {
    "cast": ["R01", "R02", "R07"],
    "avatar": ["R01", "R03", "R04", "R05", "R06"],
    "hair": ["R01", "R03", "R04", "R06"],
    "clothing": ["R01", "R03", "R05", "R06"],
    "accessory": ["R01", "R03", "R04", "R06"],
    "vocabulary": ["R01", "R02", "R07"],
    "scene": ["R01", "R02", "R07"],
    "ui": ["R01", "R06", "R07"],
}
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def check(brief):
    pack = json.loads((PACK_DIR / "reference-pack.json").read_text(encoding="utf-8"))
    indexed = {r["id"]: r for r in pack["references"]}
    if len(indexed) != 7:
        raise ValueError("The approved reference pack must contain exactly seven distinct references.")
    kind = brief.get("kind")
    if kind not in REQUIRED:
        raise ValueError("Choose a supported brief kind.")
    if not str(brief.get("asset_id", "")).strip() or not str(brief.get("prompt", "")).strip():
        raise ValueError("The brief needs an asset ID and a concrete prompt.")
    refs = brief.get("reference_ids", [])
    targets = brief.get("target_paths", [])
    if not isinstance(refs, list) or not all(isinstance(r, str) for r in refs):
        raise ValueError("reference_ids must be a list of IDs.")
    if not isinstance(targets, list) or not all(isinstance(p, str) for p in targets):
        raise ValueError("target_paths must be a list of paths.")
    if brief.get("intent") not in ("generate", "edit"):
        raise ValueError("Choose generate or edit.")
    if brief["intent"] == "edit" and not targets:
        raise ValueError("An edit must attach its exact target.")
    if brief["intent"] == "generate" and targets:
        raise ValueError("Use edit intent when targets are supplied.")
    if len(refs) != len(set(refs)) or any(r not in indexed for r in refs):
        raise ValueError("Unknown or duplicated reference ID.")
    missing = set(REQUIRED[kind]) - set(refs)
    if missing:
        raise ValueError("Missing mandatory references: " + ", ".join(sorted(missing)))
    if len(refs) + len(targets) > 7:
        raise ValueError("Maximum seven image inputs TOTAL, including edit targets.")
    inputs = []
    for item in pack["sources"]:
        path = APP / item["file"]
        if not path.is_file() or digest(path) != item["sha256"]:
            raise ValueError("Reference pack is stale; rebuild and visually review: " + item["file"])
    for ref_id in refs:
        item = indexed[ref_id]
        path = (PACK_DIR / item["file"]).resolve()
        if not path.is_file() or digest(path) != item["sha256"]:
            raise ValueError("Missing or changed reference file: " + ref_id)
        inputs.append({"role": "reference", "id": ref_id, "path": str(path), "sha256": digest(path)})
    for target in targets:
        path = Path(target)
        path = (APP / path).resolve() if not path.is_absolute() else path.resolve()
        if not path.is_file() or path.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
            raise ValueError("Edit target must be an existing local image: " + str(path))
        inputs.append({"role": "edit target", "path": str(path), "sha256": digest(path)})
    # Lossless reference bundles preserve every mandatory sheet when a tool has a tighter input cap.
    for bundle in brief.get("reference_bundles", []):
        from PIL import Image
        ids = bundle["ids"]
        if len(ids) < 2 or len(set(ids)) != len(ids) or any(r not in refs for r in ids):
            raise ValueError("Bundle needs distinct selected reference IDs.")
        sheets = [Image.open(PACK_DIR / indexed[r]["file"]).convert("RGBA") for r in ids]
        expected = Image.new("RGBA", (max(im.width for im in sheets), sum(im.height for im in sheets)))
        y = 0
        for im in sheets:
            expected.paste(im, (0, y)); y += im.height
        path = (APP / bundle["path"]).resolve()
        actual = Image.open(path).convert("RGBA")
        if actual.size != expected.size or actual.tobytes() != expected.tobytes():
            raise ValueError("Reference bundle must preserve exact full-sheet pixels, in listed vertical order.")
        positions = [j for j,item in enumerate(inputs) if item.get("id") in ids]
        if len(positions) != len(ids):
            raise ValueError("Reference bundles must not overlap.")
        position = min(positions)
        inputs = [item for j,item in enumerate(inputs) if j not in positions]
        inputs.insert(position, {"role":"reference bundle", "ids":ids, "path":str(path), "sha256":digest(path)})
    if len({i["path"] for i in inputs}) != len(inputs):
        raise ValueError("Do not supply duplicate images as separate input roles.")
    return {"pass": True, "asset_id": brief["asset_id"], "input_count": len(inputs),
            "input_paths": [i["path"] for i in inputs], "inputs": inputs,
            "next_step": "Attach these exact paths to built-in ImageGen referenced_image_paths."}
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("brief", type=Path)
    args = parser.parse_args()
    try:
        result = check(json.loads(args.brief.read_text(encoding="utf-8")))
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(json.dumps({"pass": False, "error": str(error)}))
        return 1
    print(json.dumps(result, indent=2))
    return 0
if __name__ == "__main__":
    sys.exit(main())
