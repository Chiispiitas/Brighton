/* ==============================================
     PDF
     Made by: David S.
============================================== */
/* Alias */
const { PDFDocument, rgb, degrees } = PDFLib;

/* Query */
const queryString = window.location.search;

/* Strings */
var passString1 = "";
var passString2 = "";
var dateString = "";

/* Text fields */
var student = document.getElementById("student");
var date = document.getElementById("date");
var program = document.getElementById("program");
var level = document.getElementById("level");

/* Buttons */
const certificateBtn = document.getElementById("certificate-btn");

/* ==============================================
    Pass strings
============================================== */
function getPassStrings() {
  passString1 = "has successfully PASSED the " + level.value + " level of the"
  passString2 = program.value + " program";

  if (final.value == "Distinction") {
    passString2 += " WITH DISTINCTION.";
  } else if (final.value == "Merit") {
    passString2 += " WITH MERIT.";
  } else {
    passString2 += ".";
  }
};

/* ==============================================
    Date string
============================================== */
function getDateString() {
  dateString = "Manta, " + date.value;
};

 /* ==============================================
     Add button click listeners.
 ============================================== */
certificateBtn.addEventListener("click", () => {
  let name = student.value;
  if (name.trim() !== "" && student.checkValidity()) {
    generatePDF();
  } else {
    student.reportValidity();
  }
});

 /* ==============================================
     Generate PDF
 ============================================== */
const generatePDF = async() => {
  /* Get PDF bytes */
  const existingPdfBytes = await fetch("Certificate.pdf").then((res) =>
    res.arrayBuffer()
  );

  /* Get PDF document from PDF bytes */
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);

  /* Get font bytes */
  const brittanyFontBytes = await fetch("assets/fonts/BrittanySignature.ttf").then((res) =>
    res.arrayBuffer()
  );
  const poppinsFontBytes = await fetch("assets/fonts/Poppins-Regular.ttf").then((res) =>
    res.arrayBuffer()
  );
  const bostonAngelFontBytes = await fetch("assets/fonts/BostonAngelBold.otf").then((res) =>
    res.arrayBuffer()
  );

  /* Embed font bytes in the document */
  const brittanyFont  = await pdfDoc.embedFont(brittanyFontBytes);
  const poppinsFont  = await pdfDoc.embedFont(poppinsFontBytes);
  const bostonAngelFont  = await pdfDoc.embedFont(bostonAngelFontBytes);

  /* Get document pages */
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  /* Get page size */
  const pageSize = firstPage.getSize();
 
  /* Draw student name */
  const studentTextWidth = brittanyFont.widthOfTextAtSize(student.value, 56);
  firstPage.drawText(student.value, {
    x: (pageSize.width - studentTextWidth) / 2 + 15,
    y: 310,
    size: 56,
    font: brittanyFont,
    color: rgb(0, 0, 0),
  });

  /* Draw pass text */
  getPassStrings();
  const passString1Width = poppinsFont.widthOfTextAtSize(passString1, 16);
  const passString2Width = poppinsFont.widthOfTextAtSize(passString2, 16);

    /* Line 1 */
    firstPage.drawText(passString1, {
      x: (pageSize.width - passString1Width) / 2 + 15,
      y: 257,
      size: 16,
      font: poppinsFont,
      color: rgb(0.35, 0.35, 0.35),
    });

    /* Line 2 */
    firstPage.drawText(passString2, {
      x: (pageSize.width - passString2Width) / 2 + 15,
      y: 234,
      size: 16,
      font: poppinsFont,
      color: rgb(0.35, 0.35, 0.35),
    });

  /* Draw date */
  getDateString();
  const dateTextWidth = bostonAngelFont.widthOfTextAtSize(dateString, 16);
  firstPage.drawText(dateString, {
    x: (pageSize.width - dateTextWidth) / 2 + 15,
    y: 208,
    size: 16,
    font: bostonAngelFont,
    color: rgb(0.5, 0.5, 0.5),
  });
 
  /* Save PDF */
  const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
  saveAs(pdfDataUri,"newcertificate.pdf")
};

