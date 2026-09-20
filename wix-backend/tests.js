// Brighton Tests backend module
// Stores raw unit-test submissions; grading remains in the Tests Results frontend.

import wixData from "wix-data";
import {
  DATA_OPTIONS,
  ANSWER_KEY_VERSION,
  jsonOK,
  jsonBadRequest,
  jsonCollectionError,
  normalizeClassCode,
  cleanText,
  nonNegativeNumber,
  validDate,
  safeStringify,
  answersObjectToList,
  getStoredAnswerKeyVersion,
  stampServerVersion
} from "backend/core.js";

const TEST_RESULTS = "TestResults";

export async function submitTest(
  request
) {

  let payload;


  try {

    payload =
      await request.body.json();

  } catch {

    return jsonBadRequest(
      "Invalid JSON body."
    );

  }


  payload.classId =
    normalizeClassCode(
      payload.classId
    );


  const validationError =
    validateTestPayload(
      payload
    );


  if (validationError) {

    return jsonBadRequest(
      validationError
    );

  }


  const clientSubmissionId =
    cleanText(
      payload.clientSubmissionId
    );


  const testId =
    cleanText(
      payload.testId
    );


  /*
    Retry / duplicate protection.

    A duplicate keeps the version that was already
    stored. Never turn an old unversioned submission
    into a versioned one merely because it was retried.
  */
  try {

    const duplicate =
      await wixData
        .query(
          TEST_RESULTS
        )
        .eq(
          "clientSubmissionId",
          clientSubmissionId
        )
        .limit(1)
        .find(DATA_OPTIONS);


    if (
      duplicate.items.length
    ) {

      const duplicateItem =
        duplicate.items[0];


      const duplicateVersion =
        getStoredAnswerKeyVersion(
          duplicateItem
        );


      return jsonOK({

        success: true,

        submissionId:
          duplicateItem._id,

        duplicate:
          true,

        answerKeyVersion:
          duplicateVersion,

        testVersion:
          duplicateVersion,

        legacy:
          !duplicateVersion

      });

    }

  } catch (error) {

    return jsonCollectionError(
      "testResults",
      error
    );

  }


  /*
    This is a new row. Wix, not the browser,
    chooses the release that will identify it.
  */
  payload =
    stampServerVersion(
      payload
    );


  const submittedAnswers =
    payload.answers &&
    typeof payload.answers ===
      "object" &&
    !Array.isArray(
      payload.answers
    )
      ? payload.answers
      : {};


  const submittedAnswerList =
    Array.isArray(
      payload.answerList
    )
      ? payload.answerList
      : answersObjectToList(
          submittedAnswers
        );


  const pageProgress =
    Array.isArray(
      payload.pageProgress
    )
      ? payload.pageProgress
      : [];


  const submittedAt =
    validDate(
      payload.submittedAt
    ) ||
    new Date();


  const item = {

    clientSubmissionId,

    testId,

    testTitle:
      cleanText(
        payload.testTitle ||
        testId
      ),

    level:
      cleanText(
        payload.level
      ),

    unitRange:
      cleanText(
        payload.unitRange
      ),

    studentName:
      cleanText(
        payload.studentName
      ),

    classId:
      normalizeClassCode(
        payload.classId
      ),

    answerKeyVersion:
      ANSWER_KEY_VERSION,

    testVersion:
      ANSWER_KEY_VERSION,

    answersJson:
      safeStringify(
        submittedAnswers
      ),

    answerListJson:
      safeStringify(
        submittedAnswerList
      ),

    /*
      This retains the field already used
      in your TestResults collection.

      For raw Wix submissions, it represents
      page progress rather than authoritative
      graded page scores.
    */
    pageScoresJson:
      safeStringify(
        pageProgress
      ),

    startedAt:
      validDate(
        payload.startedAt
      ),

    submittedAt,

    timeSpentSeconds:
      nonNegativeNumber(
        payload.timeSpentSeconds
      ),

    answeredCount:
      nonNegativeNumber(
        payload.answeredCount
      ),

    totalQuestions:
      nonNegativeNumber(
        payload.totalQuestions
      )

  };


  try {

    const saved =
      await wixData.insert(
        TEST_RESULTS,
        item,
        DATA_OPTIONS
      );


    return jsonOK({

      success: true,

      submissionId:
        saved._id,

      answerKeyVersion:
        ANSWER_KEY_VERSION,

      testVersion:
        ANSWER_KEY_VERSION

    });


  } catch (error) {

    return jsonCollectionError(
      "testResults",
      error
    );

  }

}

export async function getTestResults(
  request
) {

  const classId =
    normalizeClassCode(
      request.query?.classId
    );


  const testId =
    cleanText(
      request.query?.testId
    );


  if (!classId) {

    return jsonBadRequest(
      "classId is required."
    );

  }


  try {

    let query =
      wixData
        .query(
          TEST_RESULTS
        )
        .eq(
          "classId",
          classId
        );


    if (testId) {

      query =
        query.eq(
          "testId",
          testId
        );

    }


    const result =
      await query
        .descending(
          "submittedAt"
        )
        .limit(250)
        .find(DATA_OPTIONS);


    return jsonOK({

      success: true,

      items:
        result.items

    });


  } catch (error) {

    return jsonCollectionError(
      "testResults",
      error
    );

  }

}

function validateTestPayload(
  payload
) {

  if (
    !payload ||
    typeof payload !==
      "object"
  ) {

    return "Missing payload.";

  }


  if (
    !cleanText(
      payload.clientSubmissionId
    )
  ) {

    return "Missing client submission ID.";

  }


  const testId =
    cleanText(
      payload.testId
    );


  if (!testId) {

    return "Missing test ID.";

  }


  if (
    !/^[a-z0-9][a-z0-9_-]{2,100}$/i
      .test(
        testId
      )
  ) {

    return "Invalid test ID.";

  }


  if (
    !cleanText(
      payload.studentName
    )
  ) {

    return "Missing studentName.";

  }


  if (
    !normalizeClassCode(
      payload.classId
    )
  ) {

    return "Missing classId.";

  }


  if (
    !payload.answers &&
    !Array.isArray(
      payload.answerList
    )
  ) {

    return "Missing answers.";

  }


  return "";

}
