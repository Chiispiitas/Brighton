/* ==============================================
     PDF
     Made by: David S.
============================================== */
/* Alias */
const { PDFDocument, rgb, degrees } = PDFLib;

// Function to get parameter value from query string
function getQueryParam(param) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get(param);
}

/* Strings */
var passString1 = "";
var passString2 = "";
var dateString = "";
var certificateName = "";
var reportOverviewString1 = "";
var reportOverviewString2 = "";
var reportOverviewString3 = "";
var reportOverviewString4 = "";

/* Text fields */
var student = document.getElementById("student");
var date = document.getElementById("date");
var program = document.getElementById("program");
var level = document.getElementById("level");
var shortLevel = document.getElementById("short-level");
var assignments = document.getElementById("assignments");
var exam = document.getElementById("exam");
var readingAndWriting = document.getElementById("reading-and-writing");
var listeningYLE = document.getElementById("listening-yle");
var speakingYLE = document.getElementById("speaking-yle");
var reading = document.getElementById("reading");
var listening = document.getElementById("listening");
var writing = document.getElementById("writing");
var speaking = document.getElementById("speaking");
var assignmentsStatus = document.getElementById("assignments-status");
var readingAndWritingStatus = document.getElementById("reading-and-writing-status");
var listeningYLEStatus = document.getElementById("listening-yle-status");
var speakingYLEStatus = document.getElementById("speaking-yle-status");
var readingStatus = document.getElementById("reading-status");
var listeningStatus = document.getElementById("listening-status");
var writingStatus = document.getElementById("writing-status");
var speakingStatus = document.getElementById("speaking-status");
var assignmentsTotal = document.getElementById("assignments-total");
var yleTotal = document.getElementById("yle-total");
var generalExamsTotal = document.getElementById("general-exams-total");
var gpa = document.getElementById("gpa");
var final = document.getElementById("final");

student.value = getQueryParam("student") || student.value;
date.value = getQueryParam("date") || date.value;
program.value = getQueryParam("program") || program.value;
level.value = getQueryParam("level") || level.value;
shortLevel.value = getQueryParam("short-level") || shortLevel.value;
assignments.value = getQueryParam("assignments") || assignments.value;
exam.value = getQueryParam("exam") || exam.value;
readingAndWriting.value = getQueryParam("reading-and-writing") || readingAndWriting.value;
listeningYLE.value = getQueryParam("listening-yle") || listeningYLE.value;
speakingYLE.value = getQueryParam("speaking-yle") || speakingYLE.value;
reading.value = getQueryParam("reading") || reading.value;
listening.value = getQueryParam("listening") || listening.value;
writing.value = getQueryParam("writing") || writing.value;
speaking.value = getQueryParam("speaking") || speaking.value;
assignmentsStatus.value = getQueryParam("assignments-status") || assignmentsStatus.value;
readingAndWritingStatus.value = getQueryParam("reading-and-writing-status") || readingAndWritingStatus.value;
listeningYLEStatus.value = getQueryParam("listening-yle-status") || listeningYLEStatus.value;
speakingYLEStatus.value = getQueryParam("speaking-yle-status") || speakingYLEStatus.value;
readingStatus.value = getQueryParam("reading-status") || readingStatus.value;
listeningStatus.value = getQueryParam("listening-status") || listeningStatus.value;
writingStatus.value = getQueryParam("writing-status") || writingStatus.value;
speakingStatus.value = getQueryParam("speaking-status") || speakingStatus.value;
assignmentsTotal.value = getQueryParam("assignments-total") || assignmentsTotal.value;
yleTotal.value = getQueryParam("yle-total") || yleTotal.value;
generalExamsTotal.value = getQueryParam("general-exams-total") || generalExamsTotal.value;
gpa.value = getQueryParam("gpa") || gpa.value;
final.value = getQueryParam("final") || final.value;

/* Exams */
var yle = document.getElementById("yle");
var generalExams = document.getElementById("general-exams");

/* Buttons */
const certificateBtn = document.getElementById("certificate-btn");
const reportBtn = document.getElementById("report-btn");

/* ==============================================
    Change exams
============================================== */
function changeExams(exams) {
  if (exams == "STARTERS" || exams == "MOVERS" || exams == "FLYERS") {
    generalExams.classList.add('hidden');
    yle.classList.remove('hidden');
  } else {
    generalExams.classList.remove('hidden');
    yle.classList.add('hidden');
  }
};

/* ==============================================
    Certificate name string
============================================== */
function getCertificateNameString(fullName) {
  const names = fullName.split(' ');

  if (names.length >= 4) {
    names[1] = names[1].charAt(0) + '.';
    names[3] = names[3].charAt(0) + '.';
  } else if (names.length == 3) {
    names[1] = names[1].charAt(0) + '.';
  }

  certificateName = names.join(' ');
};

/* ==============================================
    Pass strings
============================================== */
function getPassStrings() {
  passString1 = `has successfully PASSED the ${level.value.toUpperCase()} level of the`;
  passString2 = `${program.value.toUpperCase()} program`;

  if (final.value == "Distinction") {
    passString2 += " WITH DISTINCTION.";
  } else if (final.value == "Merit") {
    passString2 += " WITH MERIT.";
  } else {
    passString2 += ".";
  }
};

/* ==============================================
    Report overview strings
============================================== */
function getReportOverviewStrings() {
  fullName = student.value.toUpperCase();
  const names = fullName.split(' ');
  reportOverviewString1 = `The undersigned coordinator of Brighton English School hereby certifies that ${names[0]} ${names[1]}`;
  names.shift();
  names.shift();

  reportOverviewString2 = `${names.join(' ')} has successfully passed the ${level.value.toUpperCase()} level of the ${program.value.toUpperCase()}`;
  reportOverviewString3 = "program";

  if (final.value == "Distinction") {
    reportOverviewString3 += " WITH DISTINCTION.";
  } else if (final.value == "Merit") {
    reportOverviewString3 += " WITH MERIT.";
  } else {
    reportOverviewString3 += ".";
  }

  reportOverviewString3 += " The student's academic performance has been evaluated, and the"
  reportOverviewString4 = "attained grades are as follows:"
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
    generateCertificate();
  } else {
    student.reportValidity();
  }
});

reportBtn.addEventListener("click", () => {
  let name = student.value;
  if (name.trim() !== "" && student.checkValidity()) {
    generateReport();
  } else {
    student.reportValidity();
  }
});

/* ==============================================
    Generate certificate
============================================== */
const generateCertificate = async() => {

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
  getCertificateNameString(student.value);
  const studentTextWidth = brittanyFont.widthOfTextAtSize(certificateName, 56);
  firstPage.drawText(certificateName, {
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

/* ==============================================
    Generate report
============================================== */
const generateReport = async() => {

  /* Get PDF bytes */
  const existingReportPdfBytes = await fetch("Report.pdf").then((res) =>
    res.arrayBuffer()
  );

  /* Get PDF document from PDF bytes */
  const pdfDocReport = await PDFDocument.load(existingReportPdfBytes);
  pdfDocReport.registerFontkit(fontkit);

  /* Get font bytes */
  const poppinsFontBytes = await fetch("assets/fonts/Poppins-Regular.ttf").then((res) =>
    res.arrayBuffer()
  );

  /* Embed font bytes in the document */
  const poppinsFont  = await pdfDocReport.embedFont(poppinsFontBytes);

  /* Get document pages */
  const pagesReport = pdfDocReport.getPages();
  const firstPageReport = pagesReport[0];

  /* Get page size */
  const pageSizeReport = firstPageReport.getSize();

  /* Draw date */
  getDateString();
  const dateTextWidth = poppinsFont.widthOfTextAtSize(dateString, 11);
  firstPageReport.drawText(dateString, {
    x: (pageSizeReport.width - dateTextWidth - 41),
    y: 690,
    size: 11,
    font: poppinsFont,
    color: rgb(0, 0, 0),
  });
 
  /* Draw overview */
  getReportOverviewStrings();

  const leftMargin = 41; /* from left */
  const rightMargin = 41; /* from right */

    /* Line 1 */
    let words = reportOverviewString1.split(' ');
    let totalTextWidth = words.reduce((totalWidth, word) => totalWidth + poppinsFont.widthOfTextAtSize(word, 11), 0);
    let spaceWidth = (pageSizeReport.width - leftMargin - rightMargin - totalTextWidth) / (words.length - 1);

    let currentX = leftMargin;
    for (let word of words) {
      firstPageReport.drawText(word, { 
        x: currentX, 
        y: 626 - (17*0),
        size: 11,
        font: poppinsFont,
        color: rgb(0, 0, 0),
      });
  
      currentX += poppinsFont.widthOfTextAtSize(word, 11) + spaceWidth;
    };

    /* Line 2 */
    words = reportOverviewString2.split(' ');
    totalTextWidth = words.reduce((totalWidth, word) => totalWidth + poppinsFont.widthOfTextAtSize(word, 11), 0);
    spaceWidth = (pageSizeReport.width - leftMargin - rightMargin - totalTextWidth) / (words.length - 1);

    currentX = leftMargin;
    for (let word of words) {
      firstPageReport.drawText(word, { 
        x: currentX, 
        y: 626 - (17*1),
        size: 11,
        font: poppinsFont,
        color: rgb(0, 0, 0),
      });
  
      currentX += poppinsFont.widthOfTextAtSize(word, 11) + spaceWidth;
    };

    /* Line 3 */
    words = reportOverviewString3.split(' ');
    totalTextWidth = words.reduce((totalWidth, word) => totalWidth + poppinsFont.widthOfTextAtSize(word, 11), 0);
    spaceWidth = (pageSizeReport.width - leftMargin - rightMargin - totalTextWidth) / (words.length - 1);

    currentX = leftMargin;
    for (let word of words) {
      firstPageReport.drawText(word, { 
        x: currentX, 
        y: 626 - (17*2),
        size: 11,
        font: poppinsFont,
        color: rgb(0, 0, 0),
      });
  
      currentX += poppinsFont.widthOfTextAtSize(word, 11) + spaceWidth;
    };

    /* Line 4 */
    firstPageReport.drawText(reportOverviewString4, {
      x: 41,
      y: 626 - (17*3),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

  /* Draw assignments */
  firstPageReport.drawText("1", {
    x: 107,
    y: 525,
    size: 11,
    font: poppinsFont,
    color: rgb(0, 0, 0),
  });

  firstPageReport.drawText("ASSIGNMENTS AND TESTS", {
    x: 128,
    y: 525,
    size: 11,
    font: poppinsFont,
    color: rgb(0, 0, 0),
  });

  firstPageReport.drawText(shortLevel.value, {
    x: 314,
    y: 525,
    size: 11,
    font: poppinsFont,
    color: rgb(0, 0, 0),
  });

  firstPageReport.drawText(assignments.value, {
    x: 356,
    y: 525,
    size: 11,
    font: poppinsFont,
    color: rgb(0, 0, 0),
  });

  firstPageReport.drawText(assignmentsStatus.value, {
    x: 406,
    y: 525,
    size: 11,
    font: poppinsFont,
    color: rgb(0, 0, 0),
  });

  firstPageReport.drawText(assignmentsTotal.value, {
    x: 406,
    y: 525 - (18 * 1),
    size: 11,
    font: poppinsFont,
    color: rgb(0, 0, 0),
  });

  if (exam.value == "STARTERS" || exam.value == "MOVERS" || exam.value == "FLYERS") {
    /* Draw reading and writing */
    firstPageReport.drawText("1", {
      x: 107,
      y: 525 - 52,
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText("READING & WRITING", {
      x: 128,
      y: 525 - 53,
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(exam.value, {
      x: 297,
      y: 525 - 51,
      size: 10,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(readingAndWriting.value, {
      x: 356,
      y: 525 - 53,
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(readingAndWritingStatus.value, {
      x: 406,
      y: 525 - 53,
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    /* Draw listening */
    firstPageReport.drawText("2", {
      x: 105,
      y: 525 - 52 - (18 * 1),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText("LISTENING", {
      x: 128,
      y: 525 - 52 - (18 * 1),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(exam.value, {
      x: 297,
      y: 525 - 52 - (18 * 1),
      size: 10,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(listeningYLE.value, {
      x: 356,
      y: 525 - 52 - (18 * 1),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(listeningYLEStatus.value, {
      x: 406,
      y: 525 - 52 - (18 * 1),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    /* Draw speaking */
    firstPageReport.drawText("3", {
      x: 105,
      y: 525 - 52 - (18 * 2),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText("SPEAKING", {
      x: 128,
      y: 525 - 52 - (18 * 2),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(exam.value, {
      x: 297,
      y: 525 - 52 - (18 * 2),
      size: 10,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(speakingYLE.value, {
      x: 356,
      y: 525 - 52 - (18 * 2),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(speakingYLEStatus.value, {
      x: 406,
      y: 525 - 52 - (18 * 2),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    /* Draw GPA */
    firstPageReport.drawText(yleTotal.value, {
      x: 406,
      y: 525 - 52 - (18 * 4) + 2,
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });
  } else {

    /* Draw reading */
    firstPageReport.drawText("1", {
      x: 107,
      y: 525 - 52,
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText("READING", {
      x: 128,
      y: 525 - 53,
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(exam.value, {
      x: 297,
      y: 525 - 51,
      size: 10,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(reading.value, {
      x: 356,
      y: 525 - 53,
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(readingStatus.value, {
      x: 406,
      y: 525 - 53,
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    /* Draw listening */
    firstPageReport.drawText("2", {
      x: 105,
      y: 525 - 52 - (18 * 1),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText("LISTENING", {
      x: 128,
      y: 525 - 52 - (18 * 1),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(exam.value, {
      x: 297,
      y: 525 - 52 - (18 * 1),
      size: 10,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(listening.value, {
      x: 356,
      y: 525 - 52 - (18 * 1),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(listeningStatus.value, {
      x: 406,
      y: 525 - 52 - (18 * 1),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    /* Draw writing */
    firstPageReport.drawText("3", {
      x: 105,
      y: 525 - 52 - (18 * 2),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText("WRITING", {
      x: 128,
      y: 525 - 52 - (18 * 2),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(exam.value, {
      x: 297,
      y: 525 - 52 - (18 * 2),
      size: 10,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(writing.value, {
      x: 356,
      y: 525 - 52 - (18 * 2),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(writingStatus.value, {
      x: 406,
      y: 525 - 52 - (18 * 2),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    /* Draw speaking */
    firstPageReport.drawText("4", {
      x: 105,
      y: 525 - 52 - (18 * 3),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText("SPEAKING", {
      x: 128,
      y: 525 - 52 - (18 * 3),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(exam.value, {
      x: 297,
      y: 525 - 52 - (18 * 3),
      size: 10,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(speaking.value, {
      x: 356,
      y: 525 - 52 - (18 * 3),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    firstPageReport.drawText(speakingStatus.value, {
      x: 406,
      y: 525 - 52 - (18 * 3),
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });

    /* Draw total */
    firstPageReport.drawText(generalExamsTotal.value, {
      x: 406,
      y: 525 - 52 - (18 * 4) + 2,
      size: 11,
      font: poppinsFont,
      color: rgb(0, 0, 0),
    });
  };

  /* Draw GPA */
  firstPageReport.drawText(gpa.value, {
    x: 197,
    y: 369,
    size: 11,
    font: poppinsFont,
    color: rgb(0, 0, 0),
  });
 
  /* Save PDF */
  const pdfDataUri = await pdfDocReport.saveAsBase64({ dataUri: true });
  saveAs(pdfDataUri,`Report ${student.value.toUpperCase()}.pdf`)
};