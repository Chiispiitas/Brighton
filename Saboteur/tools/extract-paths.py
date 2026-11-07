"""Package the owner's printed path/goal artwork without redrawing it.

Usage: python Saboteur/tools/extract-paths.py "C:/.../CARTAS SABOTEUR"
Only crops, exact 180-degree rotations and WebP encoding are applied. Sheet
coordinates are one-based and were visually checked at all four edge centres.
The canonical orientation matches CARD_DEFS in server/cards.mjs.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

CARDS = {
    # defId: sheet, row, column, rotation from supplied artwork
    "cross": (1, 1, 2, 0),
    "tee-east": (1, 2, 1, 180),
    "tee-north": (1, 1, 1, 0),
    "corner-ne": (2, 2, 3, 0),
    "corner-nw": (2, 1, 1, 0),
    "straight-ns": (2, 3, 1, 0),
    "straight-ew": (2, 2, 1, 0),
    "dead-n": (1, 2, 3, 180),
    "dead-e": (4, 3, 1, 180),
    "dead-ne": (3, 3, 3, 180),
    "dead-nw": (5, 3, 2, 180),
    "dead-ns": (2, 1, 2, 0),
    "dead-ew": (5, 3, 3, 0),
    "dead-nes": (1, 3, 3, 180),
    "dead-new": (5, 2, 3, 0),
    "dead-cross": (4, 2, 1, 0),
    "start": (5, 2, 2, 0),
    "goal-gold": (5, 1, 2, 0),
    "goal-stone-ne": (5, 1, 1, 180),
    "goal-stone-nw": (5, 2, 1, 180),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "assets" / "cards")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    sheets = {i: next(args.source.rglob(f"cartas de camino{i}.jpg")) for i in range(1, 6)}
    manifest = {"origin": "Owner-supplied CARTAS SABOTEUR sheets", "operations": "Crop, optional 180-degree rotation, resize to 330×514, WebP quality 94", "cards": {}}
    contact = Image.new("RGB", (1000, 4 * 352), "#ece7da")
    draw = ImageDraw.Draw(contact)
    for i, (name, (sheet, row, column, rotation)) in enumerate(CARDS.items()):
        image = Image.open(sheets[sheet]).convert("RGB")
        width, height = image.size
        bounds = (round((column - 1) * width / 3), round((row - 1) * height / 3), round(column * width / 3), round(row * height / 3))
        card = image.crop(bounds)
        if rotation:
            card = card.transpose(Image.Transpose.ROTATE_180)
        card = card.resize((330, 514), Image.Resampling.LANCZOS)
        card.save(args.output / f"{name}.webp", quality=94, method=6)
        manifest["cards"][name] = {"file": f"{name}.webp", "source": str(sheets[sheet].relative_to(args.source)).replace("\\", "/"), "row": row, "column": column, "rotation": rotation, "bounds": list(bounds), "width": 330, "height": 514}
        thumbnail = card.resize((190, 296), Image.Resampling.LANCZOS)
        x, y = i % 5 * 200, i // 5 * 352
        draw.text((x + 5, y + 4), name, fill="#252a2d")
        contact.paste(thumbnail, (x + 5, y + 24))
    (args.output / "paths-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    evidence = Path(__file__).resolve().parents[1] / 'docs'
    evidence.mkdir(exist_ok=True)
    contact.save(evidence / "path-art-contact.jpg", quality=90)
    print(f"Saved {len(CARDS)} path/goal cards and their source manifest to {args.output}")


if __name__ == "__main__":
    main()
