from pathlib import Path
import fitz

SOURCE = Path("Certificate Generator/B2 Backside.pdf")
OUTPUT = Path("Certificate Generator/C1 Backside.pdf")

TITLE_COLOR = (0.349, 0.349, 0.349)
BODY_COLOR = TITLE_COLOR
PAGE_W = 595.32
PAGE_H = 841.92


def y_from_pdf(pdf_y: float) -> float:
    return PAGE_H - pdf_y


def get_font_buffer(doc, page, resource_name: str):
    for font in page.get_fonts(full=True):
        # tuple: xref, ext, type, basefont, resource name, encoding, referencer
        if len(font) >= 5 and font[4] == resource_name:
            xref = font[0]
            name, ext, ftype, buffer = doc.extract_font(xref)
            return buffer
    raise RuntimeError(f"Could not find embedded font resource {resource_name}")


def patch_chart(content: bytes) -> bytes:
    # Shift the B2-specific PASS / MERIT / DIST. bars and their white labels
    # 65.20 pt to the right so they align with the C1 Advanced score region.
    replacements = {
        b"316.8 397.18 44 17.15 re": b"382 397.18 44 17.15 re",
        b"360.8 397.18 22.2 17.15 re": b"426 397.18 22.2 17.15 re",
        b"383 397.23 33.9 17.15 re": b"448.2 397.23 33.9 17.15 re",

        b"323.93 400.85 30.984 10.92 re": b"389.13 400.85 30.984 10.92 re",
        b"331.39 403.97 Tm": b"396.59 403.97 Tm",
        b"347.47 403.97 Tm": b"412.67 403.97 Tm",

        b"352.27 402.05 40.56 9.84 re": b"417.47 402.05 40.56 9.84 re",
        b"362.83 404.57 Tm": b"428.03 404.57 Tm",
        b"382.27 404.57 Tm": b"447.47 404.57 Tm",

        b"383.71 401.21 35.4 11.04 re": b"448.91 401.21 35.4 11.04 re",
        b"392.71 404.45 Tm": b"457.91 404.45 Tm",
        b"410.11 404.45 Tm": b"475.31 404.45 Tm",
    }
    for old, new in replacements.items():
        if old not in content:
            raise RuntimeError(f"Expected chart token not found: {old!r}")
        content = content.replace(old, new)
    return content


def insert_line(page, x, pdf_y, text, fontname, fontsize, color=BODY_COLOR):
    page.insert_text(
        fitz.Point(x, y_from_pdf(pdf_y)),
        text,
        fontname=fontname,
        fontsize=fontsize,
        color=color,
        overlay=True,
    )


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)

    doc = fitz.open(SOURCE)
    page = doc[0]
    if abs(page.rect.width - PAGE_W) > 0.1 or abs(page.rect.height - PAGE_H) > 0.1:
        raise RuntimeError(f"Unexpected B2 backside size: {page.rect}")

    # Preserve the original B2 design exactly while moving its grade bars
    # into the C1 Advanced region of the Cambridge scale.
    for xref in page.get_contents():
        original = doc.xref_stream(xref)
        if b"331.39 403.97 Tm" in original:
            doc.update_stream(xref, patch_chart(original), compress=True)
            break
    else:
        raise RuntimeError("Could not locate the grade-chart content stream")

    # Capture the exact embedded fonts from the B2 master before redaction.
    # They are re-registered afterward because redaction can rebuild resources.
    title_buffer = get_font_buffer(doc, page, "F2")
    body_buffer = get_font_buffer(doc, page, "F3")
    bold_buffer = get_font_buffer(doc, page, "F5")

    # Remove only the B2-specific text. Graphics, rules, images and the CEFR
    # alignment design remain untouched.
    redact_rects = [
        fitz.Rect(30, 32, 292, 62),      # B2 UPPER-INTERMEDIATE title
        fitz.Rect(30, 94, 294, 266),     # left explanatory/assessment column
        fitz.Rect(300, 94, 565, 266),    # right results/grade column
        fitz.Rect(300, 582, 565, 662),   # bottom-right program/level paragraph
    ]
    for rect in redact_rects:
        page.add_redact_annot(rect, fill=(1, 1, 1))

    try:
        page.apply_redactions(
            images=fitz.PDF_REDACT_IMAGE_NONE,
            graphics=fitz.PDF_REDACT_LINE_ART_NONE,
            text=fitz.PDF_REDACT_TEXT_REMOVE,
        )
    except AttributeError:
        # Compatibility fallback for older PyMuPDF versions.
        page.apply_redactions(images=0, graphics=0)

    # Re-register the original B2 fonts after redaction so inserted C1 copy
    # uses the same typography as the master PDF.
    page.insert_font(fontname="C1Title", fontbuffer=title_buffer)
    page.insert_font(fontname="C1Body", fontbuffer=body_buffer)
    page.insert_font(fontname="C1Bold", fontbuffer=bold_buffer)

    # The B2 title font is a subset that lacks some glyphs required by
    # "C1 ADVANCED". Use the master's body Calibri subset for the title at
    # the exact same B2 size, baseline and color so every glyph renders.
    insert_line(page, 36, 790.32, "C1 ADVANCED", "C1Body", 15.96, TITLE_COLOR)

    # Left column - C1 / CEFR descriptor and adapted C1 Advanced assessment.
    left_lines = [
        (736.30, "C1 Advanced is a level on the Common European"),
        (721.30, "Framework of Reference for Languages (CEFR)."),
        (676.30, "At the end of the course, students take an adapted"),
        (661.30, "diagnostic version of the Cambridge English"),
        (646.30, "Qualifications C1 Advanced exam, which tests Reading"),
        (631.30, "and Use of English, Writing, and Listening. Speaking is"),
        (616.30, "assessed through an oral presentation."),
    ]
    for pdf_y, text in left_lines:
        insert_line(page, 36, pdf_y, text, "C1Body", 9.96)

    # Right column - same Brighton grading logic, advanced one CEFR band.
    right_regular = [
        (736.30, "Results are reported using scores on the"),
        (721.30, "Cambridge English Scale and certificates are"),
        (706.30, "awarded to candidates who achieve the following"),
        (691.30, "grades:"),
    ]
    for pdf_y, text in right_regular:
        insert_line(page, 304.85, pdf_y, text, "C1Body", 9.96)

    grade_lines = [
        (661.30, "Distinction   CEFR Level C2 (80%-100%)"),
        (646.30, "Merit        CEFR Level C1 (75%-79%)"),
        (631.30, "Pass         CEFR Level C1 (60%-74%)"),
    ]
    for pdf_y, text in grade_lines:
        insert_line(page, 304.85, pdf_y, text, "C1Bold", 9.96)

    insert_line(page, 304.85, 601.30, "Further information about C1 Advanced can be found at", "C1Body", 9.96)
    insert_line(page, 304.85, 586.27, "www.cambridgeenglish.org", "C1Bold", 9.96)

    # Bottom-right General English program copy, updated for C1.
    bottom_lines = [
        (250.73, "The program is composed of six levels: A1, A2, B1,"),
        (235.70, "B1+, B2, and C1; each consisting of 82 hours of"),
        (220.70, "duration."),
        (190.70, "This certificate corresponds to the C1 level."),
    ]
    for pdf_y, text in bottom_lines:
        insert_line(page, 304.85, pdf_y, text, "C1Body", 9.96)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT, garbage=4, deflate=True, clean=True)
    doc.close()

    # Verification: reopen the actual artifact that will be committed.
    check = fitz.open(OUTPUT)
    check_page = check[0]
    extracted = check_page.get_text()
    required = [
        "C1 ADVANCED",
        "C1 Advanced is a level",
        "Qualifications C1 Advanced exam",
        "CEFR Level C2 (80%-100%)",
        "CEFR Level C1 (75%-79%)",
        "CEFR Level C1 (60%-74%)",
        "six levels",
        "corresponds to the C1 level",
    ]
    missing = [item for item in required if item not in extracted]
    if missing:
        raise RuntimeError(f"C1 backside verification failed; missing: {missing}")

    forbidden = [
        "B2 UPPER-INTERMEDIATE",
        "B2 Upper-intermediate is a level",
        "Qualifications B2 First exam",
        "composed of five levels",
        "corresponds to the B2 level",
    ]
    leftovers = [item for item in forbidden if item in extracted]
    if leftovers:
        raise RuntimeError(f"B2-specific text remains: {leftovers}")

    if len(check) != 1:
        raise RuntimeError("C1 backside must remain a one-page PDF")
    if abs(check_page.rect.width - PAGE_W) > 0.1 or abs(check_page.rect.height - PAGE_H) > 0.1:
        raise RuntimeError("C1 backside page dimensions changed")

    pix = check_page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    print(f"Verified C1 backside: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
    print(f"Page: {check_page.rect.width:.2f} x {check_page.rect.height:.2f} pt; render: {pix.width} x {pix.height}px")
    print("Text verification passed.")
    check.close()


if __name__ == "__main__":
    main()
