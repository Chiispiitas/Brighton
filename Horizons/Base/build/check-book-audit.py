"""Check whether a saved audit still describes the current book files.

Usage: python Horizons/Base/build/check-book-audit.py Horizons/A1
This verifies evidence freshness, not layout, pedagogy or release readiness.
"""

import hashlib
import json
from pathlib import Path
import sys


def fingerprint(root, paths, exclude_markdown=False, normalize_text_line_endings=False):
    files = set()
    for relative in paths:
        target = root / relative
        if not target.exists():
            raise FileNotFoundError(target)
        files.update(p for p in (target.rglob("*") if target.is_dir() else [target])
                     if p.is_file() and "__pycache__" not in p.parts
                     and not (exclude_markdown and p.suffix.lower() == ".md"))
    digest = hashlib.sha256()
    total = 0
    for file in sorted(files, key=lambda p: p.relative_to(root).as_posix()):
        data = file.read_bytes()
        if normalize_text_line_endings and file.suffix.lower() in {".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".csv", ".py", ".svg", ".yml", ".yaml"}:
            data = data.replace(b"\r\n", b"\n")
        total += len(data)
        record = [file.relative_to(root).as_posix(), hashlib.sha256(data).hexdigest()]
        digest.update((json.dumps(record, ensure_ascii=True) + "\n").encode("utf-8"))
    return {"files": len(files), "bytes": total, "sha256": digest.hexdigest()}


def main():
    book = Path(sys.argv[1] if len(sys.argv) > 1 else "Horizons/A1").resolve()
    audit = json.loads((book / "book-audit.json").read_text(encoding="utf-8"))
    stale = []
    for name, group in audit["snapshot"].items():
        try:
            actual = fingerprint(book, group["paths"], group.get("exclude_markdown", False), group.get("normalize_text_line_endings", False))
            if actual != group["fingerprint"]:
                stale.append(name)
        except FileNotFoundError:
            stale.append(name)
    if stale:
        print("STALE audit evidence: " + ", ".join(stale))
        print("Recheck affected content and the reopened PDF before updating the snapshot.")
        return 1
    print("Audit snapshot matches current files. Status: " + audit["status"])
    print("Freshness only; pending checks remain in BOOK-AUDIT.md.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
