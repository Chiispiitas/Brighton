# Wix Velo integration

This static exam is ready to be inserted in Wix as an iframe or HTML component.

When the student finishes the test, the iframe sends this message to the Wix page:

```js
{
  type: "BRIGHTON_B2_RUE_SUBMIT",
  source: "brighton-b2-rue-exam",
  version: 1,
  sentAt: "ISO timestamp",
  payload: {
    studentName: "Student full name",
    classId: "Class ID",
    student: { name, classId, startedAt },
    submitted: true,
    submittedAt: "ISO timestamp",
    answers: { part1: { "1": "..." }, part2: {}, ... },
    answerList: [
      { partId, partLabel, partTitle, question, itemIndex, answer, answerText, flagged }
    ],
    flagged: [1, 8, 25],
    notes: "..."
  }
}
```

Example Wix page code:

```js
import wixData from 'wix-data';

$w.onReady(function () {
  $w('#htmlExam').onMessage(async (event) => {
    const message = event.data;

    if (!message || message.type !== 'BRIGHTON_B2_RUE_SUBMIT') {
      return;
    }

    const result = message.payload;

    console.log('Student:', result.studentName);
    console.log('Class ID:', result.classId);
    console.log('Answers:', result.answers);
    console.log('Answer list:', result.answerList);

    // Optional database insert. Create a collection first, for example: B2RueResults
    await wixData.insert('B2RueResults', {
      title: `${result.classId} - ${result.studentName}`,
      studentName: result.studentName,
      classId: result.classId,
      startedAt: result.student.startedAt,
      submittedAt: result.submittedAt,
      answersJson: JSON.stringify(result.answers),
      answerListJson: JSON.stringify(result.answerList),
      flaggedJson: JSON.stringify(result.flagged),
      notes: result.notes,
      rawJson: JSON.stringify(message)
    });
  });
});
```

The HTML component ID in the example is `#htmlExam`. Change it to match the actual ID in Wix.
