"""Measure exposed accepted Pico arm material, not PNG bounding boxes.

Reference is the accepted static atlas. This does not approve the articulated
body silhouette: that still requires actual-renderer inspection at all extremes.
"""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

APP = Path(__file__).resolve().parents[1]
OUT = Path(r"C:/Users/David/Documents/Codex/2026-11-06/streak-v2-review")
ATLAS = APP / "assets/art/cast-static-pico-v2.png"
manifest = json.loads((APP / "assets/art/manifest.json").read_text(encoding="utf-8-sig"))
atlas = Image.open(ATLAS).convert("RGBA")


def crop_pose(name):
    frame = manifest["postures"]["pico"][name]["frame"]
    x, y, w, h = (frame[k] for k in ("x", "y", "w", "h"))
    return atlas.crop((x, y, x + w, y + h))


def skin(pixel):
    r, g, b, a = map(int, pixel)
    return a >= 220 and r > 180 and 110 < g < 240 and 70 < b < 230 and r - g > 15 and g - b > 10


def measure(image, start, end):
    pixels = np.array(image)
    dx, dy = end[0] - start[0], end[1] - start[1]
    length = math.hypot(dx, dy)
    nx, ny = -dy / length, dx / length
    samples = []
    for fraction in (.25, .5, .75):
        center = (start[0] + dx * fraction, start[1] + dy * fraction)
        hit = []
        for offset in np.arange(-80, 80.01, .25):
            x, y = round(center[0] + nx * offset), round(center[1] + ny * offset)
            hit.append(0 <= x < image.width and 0 <= y < image.height and skin(pixels[y, x]))
        left = right = 320
        while left > 0 and hit[left - 1]:
            left -= 1
        while right < len(hit) - 1 and hit[right + 1]:
            right += 1
        lo, hi = -80 + left * .25, -80 + right * .25
        samples.append({"fraction": fraction, "sourceWidth": round(hi - lo + .25, 2),
                        "line": [[center[0] + nx * lo, center[1] + ny * lo],
                                 [center[0] + nx * hi, center[1] + ny * hi]]})
    return samples


paths = {
    "greet-upper": ("greet", (69, 282), (35, 333)),
    "greet-fore": ("greet", (35, 333), (65, 373)),
    "jump-left": ("jump", (94, 295), (43, 250)),
    "jump-right": ("jump", (201, 295), (251, 255)),
}
data = {key: {"pose": name, "axis": [start, end], "samples": measure(crop_pose(name), start, end)}
        for key, (name, start, end) in paths.items()}
scale = 121 / 141  # Lower cheek width in the accepted still vs current active head.
for entry in data.values():
    for sample in entry["samples"]:
        sample["sameFaceSizeWidth"] = round(sample["sourceWidth"] * scale, 2)

board = Image.new("RGB", (1000, 650), "white")
draw = ImageDraw.Draw(board)
draw.text((20, 12), "Accepted Pico: exposed limb material, matched to the current face size", fill="#173c54")
for index, pose in enumerate(("greet", "jump")):
    original = crop_pose(pose)
    image = original.resize((round(original.width * scale * 2), round(original.height * scale * 2)), Image.Resampling.LANCZOS)
    annotated = Image.new("RGB", image.size, "white")
    annotated.paste(image, mask=image.getchannel("A"))
    ad = ImageDraw.Draw(annotated)
    for entry in data.values():
        if entry["pose"] != pose:
            continue
        for sample in entry["samples"]:
            line = [(x * scale * 2, y * scale * 2) for x, y in sample["line"]]
            ad.line(line, fill="#207d85", width=3)
    # Show the face/upper body, where the requested dimensions can be compared.
    annotated = annotated.crop((0, 295, annotated.width, 680))
    board.paste(annotated, (20 + index * 480, 55))
    draw.text((20 + index * 480, 445), pose + " - source section markers", fill="#173c54")
draw.text((20, 490), "Accepted exposed sections: 34.25-38.5 source pixels; same-face-size range: 29.4-33.0 scene pixels.", fill="#173c54")
draw.text((20, 520), "Registration target: upper shaft 31 +/- 1; forearm shaft 30-31; palm about 40 scene pixels.", fill="#173c54")
draw.text((20, 550), "These are visible material widths, not transparent image bounds or joint-to-joint bone lengths.", fill="#173c54")
draw.text((20, 580), "Face/ear proportions differ slightly between accepted static poses. This is a thickness guide, not exact body reconstruction.", fill="#173c54")
board_file = OUT / "accepted-pico-measured-arm-reference.png"
board.save(board_file)
report = {
    "scope": "Reference-only material measurement; no final articulated silhouette approval.",
    "acceptedReference": "assets/art/cast-static-pico-v2.png",
    "sourceSha256": hashlib.sha256(ATLAS.read_bytes()).hexdigest(),
    "sameFaceSizeScale": scale,
    "scaleBasis": "Accepted lower cheek approximately141 source pixels; current active head approximately121. Nearby rows and accepted poses differ slightly, so 0.85-0.88 is a useful range.",
    "samples": data,
    "registrationRecommendation": {"upperShaft": [30, 32], "forearmShaft": [30, 31], "palm": [39, 41]},
    "rejectedComparison": {"thin": "Earlier 20-26px shafts were below the accepted reference.", "chunky": "48px upper/42px fore shafts were substantially above the accepted reference."},
    "limitations": "Cross sections intentionally avoid joints, tangent corners and atlas antialiasing. Screen poses and complete overlapping joint geometry still need manual actual-renderer review.",
    "board": str(board_file),
}
(APP / "reports/streak-v2-reference-proportions.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"board": str(board_file), "recommendation": report["registrationRecommendation"]}))
