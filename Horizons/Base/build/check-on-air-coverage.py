"""Check planned B skills and show cadence; structural evidence is not an audio review."""
from pathlib import Path
import json
import re
import sys
from bs4 import BeautifulSoup


def coverage(book):
    units = {}
    for path in sorted((book / "Lessons").glob("*.html")):
        match = re.fullmatch(r"(\d+)[A-D]", path.stem)
        if not match:
            continue
        unit = int(match[1])
        episodes = units.setdefault(unit, set())
        doc = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
        for brand in doc.select('[class*="show-brand"]'):
            if " ".join(brand.stripped_strings).upper() != "HORIZONS ON AIR":
                continue
            task = brand.find_parent("section", class_="hz-exercise")
            if task is None:
                continue
            for badge in task.select(".hz-audio-badge"):
                track = re.search(r"\b\d+\.\d+\b", badge.get_text())
                if track and (book / "Audios" / f"Track {track[0]}.mp3").is_file():
                    episodes.add((path.stem, track[0]))
    return units


def main():
    book = Path(sys.argv[1] if len(sys.argv) > 1 else "Horizons/A1").resolve()
    units = coverage(book)
    if not units:
        print("No lesson masters found; coverage cannot be verified.")
        return 1
    audit = json.loads((book / "book-audit.json").read_text(encoding="utf-8"))
    plans = {p["unit"]: p for p in audit.get("receptive_skill_plan", {}).get("units", [])}
    problems = []
    active = {u: e for u, e in units.items() if (book / "Lessons" / f"{u}B.html").exists()}
    for unit, episodes in sorted(active.items()):
        detail = ", ".join(f"{lesson}, Track {track}" for lesson, track in sorted(episodes))
        plan = plans.get(unit, {})
        skill = plan.get("primary_skill", "UNPLANNED")
        print(f"Unit {unit}: {skill}; {detail or 'no episode (valid for a reading-led unit)'}")
        if skill not in ["reading", "listening"]:
            problems.append(f"Unit {unit}: declare B's primary skill before completion")
        if skill == "listening" and not any(lesson == f"{unit}B" for lesson, _ in episodes):
            problems.append(f"Unit {unit}: listening-led B has no linked show feature")
        if unit + 1 in active and not episodes and not active[unit + 1]:
            problems.append(f"Units {unit}-{unit + 1}: two-unit gap without Horizons on Air")
    if len(active) >= 3 and len({plans.get(u, {}).get("primary_skill") for u in active}) < 2:
        problems.append("B programme lacks a planned reading/listening mix")
    print("Structural coverage only: verify episode title, actual show audio and purposeful listening tasks separately.")
    if problems:
        print("Receptive-skill gate unmet: " + "; ".join(problems))
        return 1
    print("Planned reading/listening mix and Horizons on Air cadence verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
