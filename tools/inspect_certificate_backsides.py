from pathlib import Path
import fitz

C1 = Path('Certificate Generator/C1 Backside.pdf')
B1PLUS = Path('Certificate Generator/B1+ Backside.pdf')
FONT_REGULAR = Path('Certificate Generator/assets/fonts/Poppins-Regular.ttf')
FONT_BOLD = Path('Certificate Generator/assets/fonts/Poppins-Bold.ttf')
OUT = Path('Certificate Generator/C1 Backside.fixed.pdf')
PAGE_H = 841.92
LEFT_X = 36.0
RIGHT_X = 304.85
COLOR = (0.349, 0.349, 0.349)
BODY_SIZE = 9.2


def pdf_y(y):
    return PAGE_H - y


def draw(page, x, y, text, fontname, size=BODY_SIZE):
    page.insert_text(
        fitz.Point(x, pdf_y(y)),
        text,
        fontname=fontname,
        fontsize=size,
        color=COLOR,
        overlay=True,
    )


def main():
    if not FONT_REGULAR.exists() or not FONT_BOLD.exists():
        raise FileNotFoundError('Certificate Generator Poppins fonts are missing')

    c1 = fitz.open(C1)
    page = c1[0]

    for rect in [
        fitz.Rect(30, 150, 294, 232),   # left assessment paragraph
        fitz.Rect(300, 225, 570, 262),  # further-information lines
        fitz.Rect(300, 580, 570, 662),  # program-level paragraph containing B1+
    ]:
        page.add_redact_annot(rect, fill=(1, 1, 1))

    try:
        page.apply_redactions(
            images=fitz.PDF_REDACT_IMAGE_NONE,
            graphics=fitz.PDF_REDACT_LINE_ART_NONE,
            text=fitz.PDF_REDACT_TEXT_REMOVE,
        )
    except AttributeError:
        page.apply_redactions(images=0, graphics=0)

    page.insert_font(fontname='C1Poppins', fontfile=str(FONT_REGULAR))
    page.insert_font(fontname='C1PoppinsBold', fontfile=str(FONT_BOLD))

    # Re-wrap the C1 assessment copy so the first column never crosses x=294.
    left_lines = [
        (676.30, 'At the end of the course, students take an adapted'),
        (661.30, 'diagnostic version of the Cambridge English'),
        (646.30, 'Qualifications C1 Advanced exam, which tests'),
        (631.30, 'Reading and Use of English, Writing, and Listening.'),
        (616.30, 'Speaking is assessed through an oral presentation.'),
    ]
    for y, text in left_lines:
        draw(page, LEFT_X, y, text, 'C1Poppins')

    # Keep the further-information note inside the right column too.
    draw(page, RIGHT_X, 601.30, 'Further information about C1 Advanced can be', 'C1Poppins')
    draw(page, RIGHT_X, 586.27, 'found at www.cambridgeenglish.org', 'C1PoppinsBold')

    # Rebuild the program paragraph with a full font so B1+ renders correctly.
    bottom_lines = [
        (250.73, 'The program is composed of six levels: A1, A2, B1,'),
        (235.70, 'B1+, B2, and C1; each consisting of 82 hours of'),
        (220.70, 'duration.'),
        (190.70, 'This certificate corresponds to the C1 level.'),
    ]
    for y, text in bottom_lines:
        draw(page, RIGHT_X, y, text, 'C1Poppins')

    c1.save(OUT, garbage=4, deflate=True, clean=True)
    c1.close()
    OUT.replace(C1)

    # Verify the final PDF that will be committed.
    check = fitz.open(C1)
    p = check[0]
    text = p.get_text()
    required = [
        'Qualifications C1 Advanced exam, which tests',
        'Reading and Use of English, Writing, and Listening.',
        'B1+, B2, and C1',
        'found at www.cambridgeenglish.org',
    ]
    missing = [s for s in required if s not in text]
    if missing:
        raise RuntimeError(f'Missing corrected text: {missing}')
    if '\x00' in text:
        raise RuntimeError('Missing-glyph NUL still present in extracted C1 text')

    left_overflow = []
    right_overflow = []
    bottom_overflow = []
    for x0, y0, x1, y1, block_text, *_ in p.get_text('blocks'):
        if 150 <= y0 <= 232 and x0 < 300 and x1 > 294:
            left_overflow.append((x0, y0, x1, y1, block_text.strip()))
        if 225 <= y0 <= 262 and x0 >= 300 and x1 > 570:
            right_overflow.append((x0, y0, x1, y1, block_text.strip()))
        if 580 <= y0 <= 662 and x0 >= 300 and x1 > 570:
            bottom_overflow.append((x0, y0, x1, y1, block_text.strip()))
    if left_overflow:
        raise RuntimeError(f'Left-column overflow remains: {left_overflow}')
    if right_overflow:
        raise RuntimeError(f'Right-column overflow remains: {right_overflow}')
    if bottom_overflow:
        raise RuntimeError(f'Bottom-right overflow remains: {bottom_overflow}')

    # The original B1+ backside already encodes '+' correctly; verify we did not alter it.
    donor_check = fitz.open(B1PLUS)
    donor_text = donor_check[0].get_text()
    donor_check.close()
    if 'B1+ INTERMEDIATE' not in donor_text or 'B1+ level' not in donor_text:
        raise RuntimeError('B1+ backside plus-sign verification failed')

    pix = p.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    print(f'Verified corrected C1 backside: {C1} ({C1.stat().st_size} bytes)')
    print(f'Render: {pix.width} x {pix.height}px')
    print('Corrected C1 text stays inside all intended columns.')
    print('B1+ renders with an actual plus character in the C1 program text.')
    check.close()


if __name__ == '__main__':
    main()
