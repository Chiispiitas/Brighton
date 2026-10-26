"""Find unit-level show coverage; this structural gate is not an audio review."""
from pathlib import Path
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
    for unit, episodes in sorted(units.items()):
        detail = ", ".join(f"{lesson}, Track {track}" for lesson, track in sorted(episodes))
        print(f"Unit {unit}: {detail or 'MISSING Horizons on Air episode'}")
    missing = sorted(unit for unit, episodes in units.items() if not episodes)
    print("Structural coverage only: verify episode title, actual show audio and purposeful listening tasks separately.")
    if missing:
        print("Unit-completion gate unmet: " + ", ".join(map(str, missing)))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
