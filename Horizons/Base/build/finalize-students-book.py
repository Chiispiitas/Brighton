"""Restore PDF metadata, bookmarks and public resource links after optimization.

Usage:
  python Horizons/Base/build/finalize-students-book.py Horizons/A1
  python Horizons/Base/build/finalize-students-book.py Horizons/A1 \
      --input proof.pdf --output finalized.pdf --report finalization.json

The default input is the book's saved PDF; output defaults to that input. A
validated temporary file is atomically moved into place, so failed PDF validation
never overwrites the input.
Books without Frontmatter/manifest.json metadata are left unchanged. Requires
beautifulsoup4 and PyMuPDF; no scratch files or machine-specific paths are used.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
import tempfile
from urllib.parse import quote, unquote, urlsplit

from bs4 import BeautifulSoup
import fitz


METADATA_KEYS = {
    "title", "author", "subject", "keywords", "creator", "producer",
    "creationDate", "modDate", "trapped",
}
BANK_TITLES = {
    "grammar": "Grammar practice",
    "vocabulary": "Vocabulary practice",
    "communication": "Practical English",
}


def text(node) -> str:
    return node.get_text(" ", strip=True) if node is not None else ""


def read_pages(book: Path):
    html = book / "Student's Book.html"
    soup = BeautifulSoup(html.read_text(encoding="utf-8"), "html.parser")
    pages = soup.select(".hz-page")
    if not pages:
        raise ValueError(f"No .hz-page elements in {html}")
    labels = [a.get("data-page") or a.get("id") or str(i + 1)
              for i, a in enumerate(pages)]
    if len(labels) != len(set(labels)):
        raise ValueError("Compiled HTML contains duplicate page labels")
    return pages, {label: i + 1 for i, label in enumerate(labels)}


def build_outline(pages, metadata: dict) -> list:
    unit_titles = metadata.get("unit_titles", {})
    if not isinstance(unit_titles, dict):
        raise ValueError("metadata.unit_titles must be an object keyed by unit number")
    unit_numbers = sorted({
        int(text(n)[:-1]) for a in pages
        for n in a.select(".hz-lesson-header .hz-lesson-tab__id")
        if re.fullmatch(r"\d+[A-D]", text(n))
    })
    if len(unit_numbers) == 1:
        units_label = f"Unit {unit_numbers[0]}"
    elif unit_numbers and unit_numbers == list(range(unit_numbers[0], unit_numbers[-1] + 1)):
        units_label = f"Units {unit_numbers[0]}–{unit_numbers[-1]}"
    else:
        units_label = "Units " + ", ".join(map(str, unit_numbers))
    outline, units_started, last_bank, credits_started = [], False, None, False
    current_unit = None
    for physical_page, article in enumerate(pages, 1):
        if article.get("data-book-start") == "true":
            title = article.get("data-book-title") or text(article.select_one("h1"))
            if not title:
                raise ValueError(f"Untitled book section on physical page {physical_page}")
            outline.append([1, title, physical_page])
            continue
        classes = article.get("class", [])
        if "hz-credits-page" in classes:
            if not credits_started:
                outline.append([1, "Image credits", physical_page])
                credits_started = True
            continue
        if "hz-practice-page" in classes:
            bank = article.get("data-practice-bank", "communication")
            if bank != last_bank:
                outline.append([1, BANK_TITLES.get(bank, bank.title()), physical_page])
                last_bank = bank
            sections = article.select('.lp-section[data-practice-start="true"]')
            if sections:
                for section in sections:
                    outline.append([2, section.get("data-practice-title", "Practice"), physical_page])
            elif article.get("data-practice-start") == "true":
                outline.append([2, article.get("data-practice-title", "Practical English"), physical_page])
            continue
        header = article.select_one(".hz-lesson-header")
        if header is None:
            continue
        code = text(header.select_one(".hz-lesson-tab__id"))
        title = text(header.select_one(".hz-lesson-title"))
        if not code or not title:
            raise ValueError(f"Incomplete lesson header on physical page {physical_page}")
        if not units_started:
            outline.append([1, units_label, physical_page])
            units_started = True
        if not re.fullmatch(r"\d+[A-D]", code):
            outline.append([2, f"{code} · {title}", physical_page])
            continue
        unit = int(code[:-1])
        if unit != current_unit:
            unit_title = unit_titles.get(str(unit), unit_titles.get(unit))
            label = f"Unit {unit}" + (f" · {unit_title}" if unit_title else "")
            outline.append([2, label, physical_page])
            current_unit = unit
        outline.append([3, f"{code} · {title}", physical_page])
    return outline


def is_local_resource(value: str) -> bool:
    normalized = value.replace("\\", "/")
    parsed = urlsplit(normalized)
    return parsed.scheme.lower() == "file" or not parsed.scheme or bool(re.match(r"^/?[A-Za-z]:/", normalized))


def public_resource_url(value: str, book: Path, public_url: str | None) -> str | None:
    """Map a Windows/Linux book-local file link to its declared public location."""
    if not public_url or not is_local_resource(value):
        return None
    public = urlsplit(public_url)
    if public.scheme != "https" or not public.netloc or public.query or public.fragment:
        raise ValueError("metadata.public_url must be a plain HTTPS book directory URL")
    normalized = value.replace("\\", "/")
    parsed = urlsplit(normalized)
    source_path = unquote(parsed.path)
    markers = ["/" + public.path.strip("/") + "/",
               f"/{book.parent.name}/{book.name}/"]
    relative = None
    for marker in markers:
        offset = source_path.casefold().find(marker.casefold())
        if marker != "//" and offset >= 0:
            relative = source_path[offset + len(marker):]
            break
    if relative is None and not parsed.scheme and not source_path.startswith("/"):
        relative = source_path
    if not relative or "\x00" in relative:
        return None
    parts = PurePosixPath(relative).parts
    if ".." in parts or PurePosixPath(relative).is_absolute():
        return None
    relative = PurePosixPath(relative).as_posix()
    target = (book / relative).resolve()
    if not target.is_relative_to(book) or not target.is_file():
        return None
    result = public_url.rstrip("/") + "/" + quote(relative, safe="/")
    if parsed.query:
        result += "?" + parsed.query
    if parsed.fragment:
        result += "#" + parsed.fragment
    return result


def disk_links(doc):
    return [
        {"physical_page": number, "target": value}
        for number, page in enumerate(doc, 1)
        for link in page.get_links()
        for value in [link.get("file") or link.get("uri", "")]
        if value and is_local_resource(value)
    ]


def finalize(book: Path, source: Path, output: Path) -> dict:
    if not book.is_dir():
        raise ValueError(f"Book directory does not exist: {book}")
    manifest_path = book / "Frontmatter/manifest.json"
    if not manifest_path.is_file():
        return {"status": "skipped", "reason": "No frontmatter manifest; PDF unchanged"}
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    metadata = manifest.get("metadata")
    if not isinstance(metadata, dict) or not metadata:
        return {"status": "skipped", "reason": "No declared book metadata; PDF unchanged"}
    if source.suffix.lower() != ".pdf" or output.suffix.lower() != ".pdf":
        raise ValueError("Input and output must be PDF paths")
    if not output.parent.is_dir():
        raise ValueError(f"Output directory does not exist: {output.parent}")
    language = metadata.get("language")
    if language and not re.fullmatch(r"[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*", language):
        raise ValueError("metadata.language must be a language tag such as en-US")
    pages, page_map = read_pages(book)
    outline = build_outline(pages, metadata)
    repaired, temporary = [], None
    try:
        with fitz.open(source) as doc:
            if not doc.is_pdf or doc.needs_pass:
                raise ValueError("Input must be an unencrypted PDF")
            if len(doc) != len(pages):
                raise ValueError(f"PDF/HTML page mismatch: {len(doc)} PDF pages, {len(pages)} HTML pages")
            original_links = sum(len(page.get_links()) for page in doc)
            for number, page in enumerate(doc, 1):
                for link in page.get_links():
                    old = link.get("file") or link.get("uri", "")
                    if not old or not is_local_resource(old):
                        continue
                    public = public_resource_url(old, book, metadata.get("public_url"))
                    if public is None:
                        raise ValueError(f"Cannot publish local file link on page {number}: {old}")
                    page.update_link({"kind": fitz.LINK_URI, "xref": link["xref"],
                                      "from": link["from"], "uri": public})
                    repaired.append({"physical_page": number, "url": public})
            doc.set_toc(outline)
            pdf_metadata = {k: v for k, v in doc.metadata.items() if k in METADATA_KEYS}
            for key in METADATA_KEYS:
                if key in metadata:
                    if not isinstance(metadata[key], str):
                        raise ValueError(f"metadata.{key} must be a string")
                    pdf_metadata[key] = metadata[key]
            doc.set_metadata(pdf_metadata)
            if language:
                doc.xref_set_key(doc.pdf_catalog(), "Lang", fitz.get_pdf_str(language))
            fd, name = tempfile.mkstemp(prefix=f".{output.stem}.finalizing-", suffix=".pdf", dir=output.parent)
            os.close(fd)
            temporary = Path(name)
            doc.save(temporary, garbage=4, deflate=True, encryption=fitz.PDF_ENCRYPT_KEEP)
        with fitz.open(temporary) as checked:
            if len(checked) != len(pages) or checked.get_toc() != outline:
                raise ValueError("Saved PDF page order or outline failed readback")
            remaining = disk_links(checked)
            if remaining:
                raise ValueError(f"Saved PDF still has {len(remaining)} local file links")
            if sum(len(page.get_links()) for page in checked) != original_links:
                raise ValueError("Saved PDF lost link annotations")
            for key in METADATA_KEYS.intersection(metadata):
                if checked.metadata.get(key) != metadata[key]:
                    raise ValueError(f"Saved PDF metadata failed readback: {key}")
            if language and checked.xref_get_key(checked.pdf_catalog(), "Lang")[1] != language:
                raise ValueError("Saved PDF language failed readback")
        os.replace(temporary, output)
        temporary = None
        return {
            "status": "finalized", "physical_pages": len(pages), "page_map": page_map,
            "outline_entries": len(outline), "outline": outline,
            "local_resource_annotations_replaced": len(repaired),
            "public_resource_links": repaired, "remaining_local_file_links": 0,
            "link_annotations_preserved": original_links,
            "title": pdf_metadata.get("title", ""), "author": pdf_metadata.get("author", ""),
            "language": language, "bytes": output.stat().st_size,
        }
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("book", nargs="?", default="Horizons/A1", type=Path)
    parser.add_argument("--input", type=Path, help="Source PDF; defaults to the book's saved PDF")
    parser.add_argument("--output", type=Path, help="Target PDF; defaults to the input PDF")
    parser.add_argument("--report", type=Path, help="Optional detailed JSON evidence report")
    args = parser.parse_args()
    book = args.book.resolve()
    source = (args.input or book / "Student's Book.pdf").resolve()
    output = (args.output or source).resolve()
    try:
        if args.report and (args.report.suffix.lower() != ".json" or args.report.resolve() in {source, output, book / "Frontmatter/manifest.json"}):
            raise ValueError("The report must be a separate JSON file")
        if args.report and (not args.report.parent.is_dir() or (args.report.exists() and not args.report.is_file())):
            raise ValueError("The report must be a file in an existing directory")
        result = finalize(book, source, output)
        if args.report:
            args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({k: v for k, v in result.items() if k not in {"page_map", "outline", "public_resource_links"}}, ensure_ascii=False))
        return 0
    except (OSError, ValueError, RuntimeError) as error:
        print(f"PDF finalization failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
