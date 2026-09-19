"use strict";

(() => {
  const STORAGE_KEY = "brighton-placement-local-api-v1";
  const PLACEMENT_VERSION = "2026-09-19.8";
  const LEVELS = ["PRE-A1", "A1", "A2", "B1", "B1+", "B2", "C1"];

  const LEVEL_DESCRIPTIONS = {
    "PRE-A1": "Starter",
    "A1": "Beginner",
    "A2": "Elementary",
    "B1": "Intermediate",
    "B1+": "Intermediate Plus",
    "B2": "Upper Intermediate",
    "C1": "Advanced"
  };

  const KEYS = {
    "cal-01":"cal-01-b","cal-02":"cal-02-c","cal-03":"cal-03-b","cal-04":"cal-04-b","cal-05":"cal-05-d",
    "a1-01":"a1-01-b","a1-02":"a1-02-a","a1-03":"a1-03-c","a1-04":"a1-04-b","a1-05":"a1-05-a",
    "a2-01":"a2-01-b","a2-02":"a2-02-b","a2-03":"a2-03-c","a2-04":"a2-04-c","a2-05":"a2-05-b",
    "b1-01":"b1-01-b","b1-02":"b1-02-c","b1-03":"b1-03-c","b1-04":"b1-04-b","b1-05":"b1-05-c",
    "b2-01":"b2-01-b","b2-02":"b2-02-b","b2-03":"b2-03-c","b2-04":"b2-04-c","b2-05":"b2-05-b",
    "rpa-01":"rpa-01-b","rpa-02":"rpa-02-a","rpa-03":"rpa-03-c","rpa-04":"rpa-04-a",
    "ra1-01":"ra1-01-b","ra1-02":"ra1-02-a","ra1-03":"ra1-03-c","ra1-04":"ra1-04-c",
    "ra2-01":"ra2-01-b","ra2-02":"ra2-02-a","ra2-03":"ra2-03-c","ra2-04":"ra2-04-b",
    "rb1-01":"rb1-01-b","rb1-02":"rb1-02-c","rb1-03":"rb1-03-a","rb1-04":"rb1-04-c",
    "rbp-01":"rbp-01-b","rbp-02":"rbp-02-a","rbp-03":"rbp-03-c","rbp-04":"rbp-04-a",
    "rb2-01":"rb2-01-b","rb2-02":"rb2-02-c","rb2-03":"rb2-03-a","rb2-04":"rb2-04-c",
    "rc1-01":"rc1-01-b","rc1-02":"rc1-02-b","rc1-03":"rc1-03-c","rc1-04":"rc1-04-b",
    "lpa-01":"lpa-01-a","lpa-02":"lpa-02-c","lpa-03":"lpa-03-c",
    "la1-01":"la1-01-b","la1-02":"la1-02-c","la1-03":"la1-03-c",
    "la2-01":"la2-01-b","la2-02":"la2-02-c","la2-03":"la2-03-b",
    "lb1-01":"lb1-01-a","lb1-02":"lb1-02-b","lb1-03":"lb1-03-a",
    "lbp-01":"lbp-01-b","lbp-02":"lbp-02-c","lbp-03":"lbp-03-b",
    "lb2-01":"lb2-01-c","lb2-02":"lb2-02-c","lb2-03":"lb2-03-b",
    "lc1-01":"lc1-01-b","lc1-02":"lc1-02-b","lc1-03":"lc1-03-c"
  };

  const SPEAKING_LEVEL_BY_MODULE = {
    "speaking-prea1": "PRE-A1",
    "speaking-a1": "A1",
    "speaking-a2": "A2",
    "speaking-b1": "B1",
    "speaking-b1plus": "B1+",
    "speaking-b2": "B2",
    "speaking-c1": "C1"
  };

  const SPEAKING_PROFILES = {
    "PRE-A1": { minSeconds: 12, targetSeconds: 20, targetWords: 12, wpmLow: 25, wpmHigh: 100, uniqueTarget: .72, longWordTarget: .02, connectorTarget: 0, complexTarget: 0, segmentTarget: 1 },
    "A1":     { minSeconds: 15, targetSeconds: 25, targetWords: 20, wpmLow: 35, wpmHigh: 110, uniqueTarget: .68, longWordTarget: .03, connectorTarget: 1, complexTarget: 0, segmentTarget: 2 },
    "A2":     { minSeconds: 20, targetSeconds: 35, targetWords: 32, wpmLow: 45, wpmHigh: 125, uniqueTarget: .63, longWordTarget: .05, connectorTarget: 2, complexTarget: 1, segmentTarget: 2 },
    "B1":     { minSeconds: 25, targetSeconds: 40, targetWords: 45, wpmLow: 55, wpmHigh: 145, uniqueTarget: .60, longWordTarget: .07, connectorTarget: 3, complexTarget: 2, segmentTarget: 3 },
    "B1+":    { minSeconds: 30, targetSeconds: 45, targetWords: 55, wpmLow: 60, wpmHigh: 155, uniqueTarget: .58, longWordTarget: .08, connectorTarget: 4, complexTarget: 3, segmentTarget: 3 },
    "B2":     { minSeconds: 35, targetSeconds: 50, targetWords: 65, wpmLow: 65, wpmHigh: 165, uniqueTarget: .56, longWordTarget: .10, connectorTarget: 5, complexTarget: 4, segmentTarget: 4 },
    "C1":     { minSeconds: 40, targetSeconds: 55, targetWords: 75, wpmLow: 70, wpmHigh: 175, uniqueTarget: .54, longWordTarget: .12, connectorTarget: 6, complexTarget: 5, segmentTarget: 4 }
  };

  const CONNECTOR_WORDS = new Set([
    "and","but","because","so","although","however","therefore","while","whereas","instead","also",
    "first","second","finally","unless","despite","though","since","then","besides","moreover",
    "furthermore","otherwise"
  ]);

  const COMPLEX_MARKERS = new Set([
    "although","however","therefore","whereas","unless","despite","though","because","while",
    "which","who","whose","whether","if","since","rather"
  ]);

  function loadStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object"
        ? { sessions: parsed.sessions || {}, responses: parsed.responses || [], speaking: parsed.speaking || {} }
        : { sessions: {}, responses: [], speaking: {} };
    } catch {
      return { sessions: {}, responses: [], speaking: {} };
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function makeSessionId() {
    if (crypto?.randomUUID) return `local-${crypto.randomUUID()}`;
    return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function levelSlug(level) {
    return String(level || "A2").toLowerCase().replace("+", "plus").replace(/[^a-z0-9]+/g, "");
  }

  function levelFromModule(moduleId) {
    const slug = String(moduleId || "").replace(/^[^-]+-/, "");
    return ({ prea1:"PRE-A1", a1:"A1", a2:"A2", b1:"B1", b1plus:"B1+", b2:"B2", c1:"C1" })[slug] || "A2";
  }

  function routeAfterCalibration(correct) {
    if (correct <= 1) return "lang-a1";
    if (correct === 2) return "lang-a2";
    if (correct === 3) return "lang-b1";
    return "lang-b2";
  }

  function estimateAfterLanguage(moduleId, correct) {
    if (moduleId === "lang-a1") {
      if (correct <= 1) return "PRE-A1";
      if (correct <= 3) return "A1";
      return "A2";
    }
    if (moduleId === "lang-a2") {
      if (correct <= 1) return "A1";
      if (correct <= 3) return "A2";
      return "B1";
    }
    if (moduleId === "lang-b1") {
      if (correct <= 1) return "A2";
      if (correct <= 3) return "B1";
      if (correct === 4) return "B1+";
      return "B2";
    }
    if (moduleId === "lang-b2") {
      if (correct <= 1) return "B1";
      if (correct === 2) return "B1+";
      if (correct <= 4) return "B2";
      return "C1";
    }
    return "A2";
  }

  function adjustAfterReading(level, correct) {
    const index = Math.max(0, LEVELS.indexOf(level));
    if (correct <= 1) return LEVELS[Math.max(0, index - 1)];
    if (correct === 4) return LEVELS[Math.min(LEVELS.length - 1, index + 1)];
    return LEVELS[index];
  }

  function adjustAfterListening(level, correct) {
    const index = Math.max(0, LEVELS.indexOf(level));
    if (correct === 0) return LEVELS[Math.max(0, index - 1)];
    if (correct === 3) return LEVELS[Math.min(LEVELS.length - 1, index + 1)];
    return LEVELS[index];
  }

  function expectedCount(moduleId) {
    if (/^listening-/.test(moduleId)) return 3;
    if (/^reading-/.test(moduleId)) return 4;
    return 5;
  }

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function round1(value) {
    return Math.round((Number(value) || 0) * 10) / 10;
  }

  function tokenise(transcript) {
    return String(transcript || "").toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
  }

  function countPhrase(text, phrase) {
    const source = String(text || "").toLowerCase();
    return Math.max(0, source.split(String(phrase || "").toLowerCase()).length - 1);
  }

  function paceScore(wpm, low, high) {
    if (!wpm) return 0;
    if (wpm < low) return clamp(wpm / low);
    if (wpm > high) return clamp(high / wpm);
    return 1;
  }

  function gradeSpeaking(payload, level) {
    const profile = SPEAKING_PROFILES[level] || SPEAKING_PROFILES.A2;
    const transcript = String(payload.transcript || "").replace(/\s+/g, " ").trim().slice(0, 5000);
    const tokens = tokenise(transcript);
    const wordCount = tokens.length;
    const uniqueWords = new Set(tokens).size;
    const uniqueRatio = wordCount ? uniqueWords / wordCount : 0;
    const longWordRatio = wordCount ? tokens.filter(word => word.length >= 7).length / wordCount : 0;
    const connectorCount = tokens.filter(word => CONNECTOR_WORDS.has(word)).length;
    const complexCount = tokens.filter(word => COMPLEX_MARKERS.has(word)).length;
    const fillerCount =
      tokens.filter(word => ["um","uh","erm","hmm"].includes(word)).length +
      countPhrase(transcript, "you know") +
      countPhrase(transcript, "i mean");

    const durationSeconds = clamp(payload.durationSeconds, 0, 180);
    const speechSeconds = clamp(payload.speechSeconds, 0, 180);
    const speechRatio = clamp(payload.speechRatio, 0, 1);
    const recognitionConfidence = clamp(payload.recognitionConfidence, 0, 1);
    const segmentCount = Math.max(0, Math.min(100, Number(payload.segmentCount) || 0));
    const recordedBytes = Math.max(0, Number(payload.recordedBytes) || 0);
    const transcriptAvailable = Boolean(payload.transcriptAvailable && transcript);
    const wpm = durationSeconds > 0 ? wordCount / (durationSeconds / 60) : 0;

    const durationScore = clamp(durationSeconds / profile.targetSeconds);
    const minimumDurationScore = clamp(durationSeconds / profile.minSeconds);
    const speechActivityScore = clamp((speechRatio - .16) / .62);
    const speedScore = paceScore(wpm, profile.wpmLow, profile.wpmHigh);
    const wordScore = clamp(wordCount / profile.targetWords);
    const lexicalScore = clamp(uniqueRatio / profile.uniqueTarget);
    const longWordScore = profile.longWordTarget ? clamp(longWordRatio / profile.longWordTarget) : 1;
    const connectorScore = profile.connectorTarget ? clamp(connectorCount / profile.connectorTarget) : 1;
    const complexScore = profile.complexTarget ? clamp(complexCount / profile.complexTarget) : 1;
    const segmentScore = clamp(segmentCount / profile.segmentTarget);
    const fillerRate = wordCount ? fillerCount / wordCount : 1;

    const fluency = clamp(10 * (.34 * durationScore + .36 * speechActivityScore + .30 * speedScore) - Math.min(2, fillerRate * 28), 0, 10);
    const grammar = clamp(10 * (.42 * wordScore + .38 * complexScore + .20 * segmentScore), 0, 10);
    const vocabulary = clamp(10 * (.40 * wordScore + .38 * lexicalScore + .22 * longWordScore), 0, 10);
    const recognitionSignal = recognitionConfidence > 0 ? recognitionConfidence : (transcriptAvailable ? .72 : .20);
    const pronunciation = clamp(10 * (.48 * recognitionSignal + .30 * speechActivityScore + .22 * speedScore), 0, 10);
    const communication = clamp(10 * (.46 * wordScore + .34 * connectorScore + .20 * segmentScore), 0, 10);
    const composite = round1(fluency * .25 + grammar * .20 + vocabulary * .20 + pronunciation * .15 + communication * .20);

    const inputError =
      !transcriptAvailable ||
      wordCount < 5 ||
      durationSeconds < profile.minSeconds * .72 ||
      speechRatio < .25 ||
      recordedBytes < 4000;

    const currentIndex = Math.max(0, LEVELS.indexOf(level));
    let speakingLevel = level;
    if (!inputError && composite >= 7.6 && wordCount >= profile.targetWords * .78) {
      speakingLevel = LEVELS[Math.min(LEVELS.length - 1, currentIndex + 1)];
    } else if (!inputError && composite < 4.4) {
      speakingLevel = LEVELS[Math.max(0, currentIndex - 1)];
    }

    return {
      inputError,
      transcript,
      composite,
      speakingLevel,
      finalLevel: inputError ? level : speakingLevel,
      confidence: round1(clamp(.60 + .16 * minimumDurationScore + .14 * speechActivityScore + .10 * (transcriptAvailable ? 1 : 0), .35, .92)),
      fluency: round1(fluency),
      grammar: round1(grammar),
      vocabulary: round1(vocabulary),
      pronunciation: round1(pronunciation),
      communication: round1(communication),
      durationSeconds: round1(durationSeconds),
      speechSeconds: round1(speechSeconds),
      wordCount,
      wpm: round1(wpm),
      recognitionConfidence: round1(recognitionConfidence),
      segmentCount
    };
  }

  function correctCount(rows) {
    return rows.reduce((sum, row) => sum + (row.correct ? 1 : 0), 0);
  }

  function ratioSkill(label, rows, level) {
    const total = rows.length;
    const correct = correctCount(rows);
    return {
      label,
      level,
      description: LEVEL_DESCRIPTIONS[level] || "",
      score: total ? Math.round((correct / total) * 100) : null,
      displayScore: total ? `${correct}/${total}` : "—",
      correct,
      total,
      skipped: false
    };
  }

  function buildResult(store, session) {
    const rows = store.responses.filter(row => row.sessionId === session.sessionId);
    const languageRows = rows.filter(row => /^lang-/.test(row.moduleId));
    const readingRows = rows.filter(row => /^reading-/.test(row.moduleId));
    const listeningRows = rows.filter(row => /^listening-/.test(row.moduleId));

    const languageModule = languageRows[0]?.moduleId || "";
    const readingModule = readingRows[0]?.moduleId || "";
    const listeningModule = listeningRows[0]?.moduleId || "";

    const languageLevel = languageRows.length
      ? estimateAfterLanguage(languageModule, correctCount(languageRows))
      : (session.finalLevel || session.provisionalLevel || "A2");
    const readingLevel = readingRows.length
      ? adjustAfterReading(levelFromModule(readingModule), correctCount(readingRows))
      : languageLevel;
    const listeningLevel = listeningRows.length
      ? adjustAfterListening(levelFromModule(listeningModule), correctCount(listeningRows))
      : readingLevel;

    const speaking = store.speaking[session.sessionId];
    const speakingSkill = speaking
      ? {
          label: "Speaking",
          level: speaking.speakingLevel,
          description: LEVEL_DESCRIPTIONS[speaking.speakingLevel] || "",
          score: Math.round(speaking.composite * 10),
          displayScore: `${speaking.composite.toFixed(1)}/10`,
          skipped: false
        }
      : {
          label: "Speaking",
          level: null,
          description: "",
          score: null,
          displayScore: "—",
          skipped: true
        };

    const finalLevel = session.finalLevel || session.provisionalLevel || listeningLevel || "A2";
    return {
      studentName: session.studentName,
      finalLevel,
      finalDescription: LEVEL_DESCRIPTIONS[finalLevel] || "",
      completedAt: session.completedAt || new Date().toISOString(),
      resultId: `BR-${String(session.sessionId).replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase()}`,
      placementVersion: PLACEMENT_VERSION,
      skills: {
        language: ratioSkill("Language Use", languageRows, languageLevel),
        reading: ratioSkill("Reading", readingRows, readingLevel),
        listening: ratioSkill("Listening", listeningRows, listeningLevel),
        speaking: speakingSkill
      }
    };
  }

  function requireSession(store, body) {
    const session = store.sessions[body.sessionId];
    if (!session || session.clientSessionId !== body.clientSessionId) {
      throw new Error("Placement session not found.");
    }
    return session;
  }

  async function start(body) {
    const store = loadStore();
    const existing = Object.values(store.sessions).find(session => session.clientSessionId === body.clientSessionId);
    if (existing) return { success:true, ...existing, duplicate:true };

    const sessionId = makeSessionId();
    const now = new Date().toISOString();
    const session = {
      sessionId,
      clientSessionId: body.clientSessionId,
      studentName: String(body.studentName || "").trim(),
      placementVersion: PLACEMENT_VERSION,
      status: "active",
      phase: "calibration",
      moduleId: "calibration-01",
      provisionalLevel: "",
      finalLevel: "",
      startedAt: now,
      completedAt: ""
    };
    store.sessions[sessionId] = session;
    saveStore(store);
    return { success:true, ...session };
  }

  async function resume(body) {
    const store = loadStore();
    const session = requireSession(store, body);
    return {
      success:true,
      ...session,
      result: session.status === "completed" ? buildResult(store, session) : null
    };
  }

  async function step(body) {
    const store = loadStore();
    const session = requireSession(store, body);
    if (session.status !== "active") throw new Error("Placement session is complete.");

    if (session.moduleId !== body.moduleId) {
      if (session.lastCompletedModule === body.moduleId) {
        return {
          success:true,
          completedModuleId:body.moduleId,
          nextPhase:session.phase,
          nextModuleId:session.moduleId,
          provisionalLevel:session.provisionalLevel,
          replayed:true
        };
      }
      throw new Error("This placement module is no longer active.");
    }

    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (answers.length !== expectedCount(body.moduleId)) throw new Error("Incomplete placement module.");

    const rows = answers.map(answer => ({
      sessionId: session.sessionId,
      moduleId: body.moduleId,
      itemId: answer.itemId,
      optionId: answer.optionId,
      correct: KEYS[answer.itemId] === answer.optionId,
      responseTimeMs: Number(answer.responseTimeMs) || 0
    }));

    store.responses = store.responses.filter(row => !(row.sessionId === session.sessionId && row.moduleId === body.moduleId));
    store.responses.push(...rows);

    const correct = correctCount(rows);
    let nextPhase = "";
    let nextModuleId = "";
    let provisionalLevel = session.provisionalLevel || "";

    if (body.moduleId === "calibration-01") {
      nextPhase = "language";
      nextModuleId = routeAfterCalibration(correct);
    } else if (/^lang-/.test(body.moduleId)) {
      nextPhase = "reading";
      provisionalLevel = estimateAfterLanguage(body.moduleId, correct);
      nextModuleId = `reading-${levelSlug(provisionalLevel)}`;
    } else if (/^reading-/.test(body.moduleId)) {
      nextPhase = "listening";
      provisionalLevel = adjustAfterReading(provisionalLevel || "A2", correct);
      nextModuleId = `listening-${levelSlug(provisionalLevel)}`;
    } else if (/^listening-/.test(body.moduleId)) {
      nextPhase = "speaking";
      provisionalLevel = adjustAfterListening(provisionalLevel || "A2", correct);
      nextModuleId = `speaking-${levelSlug(provisionalLevel)}`;
    } else {
      throw new Error("Unsupported placement module.");
    }

    Object.assign(session, {
      phase: nextPhase,
      moduleId: nextModuleId,
      provisionalLevel,
      lastCompletedModule: body.moduleId
    });
    store.sessions[session.sessionId] = session;
    saveStore(store);

    return { success:true, completedModuleId:body.moduleId, nextPhase, nextModuleId, provisionalLevel };
  }

  async function submitSpeaking(body) {
    const store = loadStore();
    const session = requireSession(store, body);
    const level = SPEAKING_LEVEL_BY_MODULE[body.moduleId] || session.provisionalLevel || "A2";
    const grade = gradeSpeaking(body, level);

    if (grade.inputError) return { success:true, speakingError:true };

    store.speaking[session.sessionId] = {
      ...grade,
      speakingLevel: grade.speakingLevel
    };

    session.status = "completed";
    session.phase = "result";
    session.finalLevel = grade.finalLevel;
    session.confidence = grade.confidence;
    session.completedAt = new Date().toISOString();
    store.sessions[session.sessionId] = session;
    saveStore(store);

    return {
      success:true,
      finalLevel:grade.finalLevel,
      speakingLevel:grade.speakingLevel,
      confidence:grade.confidence,
      result:buildResult(store, session),
      rubric:{
        fluency:grade.fluency,
        grammar:grade.grammar,
        vocabulary:grade.vocabulary,
        pronunciation:grade.pronunciation,
        communication:grade.communication,
        composite:grade.composite
      }
    };
  }

  async function skipSpeaking(body) {
    const store = loadStore();
    const session = requireSession(store, body);
    session.status = "completed";
    session.phase = "result";
    session.finalLevel = session.provisionalLevel || SPEAKING_LEVEL_BY_MODULE[body.moduleId] || "A2";
    session.completedAt = new Date().toISOString();
    store.sessions[session.sessionId] = session;
    saveStore(store);
    return { success:true, finalLevel:session.finalLevel, result:buildResult(store, session) };
  }

  async function placementResult(body) {
    const store = loadStore();
    const session = requireSession(store, body);
    return { success:true, result:buildResult(store, session) };
  }

  async function post(path, body) {
    switch (path) {
      case "brightonPlacementStart": return start(body);
      case "brightonPlacementResume": return resume(body);
      case "brightonPlacementStep": return step(body);
      case "brightonPlacementSubmitSpeaking": return submitSpeaking(body);
      case "brightonPlacementSkipSpeaking": return skipSpeaking(body);
      case "brightonPlacementResult": return placementResult(body);
      default: throw new Error("Unknown local placement operation.");
    }
  }

  window.BRIGHTON_PLACEMENT_LOCAL_API = { post };
})();
