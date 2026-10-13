// Brighton Assessment Backend — public HTTP router
// Keep this file tiny. Business logic lives in exams.js, tests.js, and placement.js.

import { corsOptions, jsonOK, ANSWER_KEY_VERSION } from "backend/core.js";

import {
  getExams,
  submitExam,
  getResults,
  updateProgress,
  getProgress
} from "backend/exams.js";

import {
  submitTest,
  getTestResults
} from "backend/tests.js";

import {
  pingPlacement,
  startPlacement,
  resumePlacement,
  placementStep,
  uploadSpeakingChunk,
  submitSpeaking,
  skipSpeaking,
  placementResult,
  touchPlacementActivity,
  expirePlacementSession,
  getPlacementResults,
  getPlacementDashboardResult
} from "backend/placement.js";

/* =========================================================
   HEALTH
========================================================= */

export function use_brightonBackendHealth() { return corsOptions("GET"); }
export function get_brightonBackendHealth() {
  return jsonOK({
    success: true,
    service: "brighton-assessment-backend",
    answerKeyVersion: ANSWER_KEY_VERSION,
    placementContract: "2026-09-20.1"
  });
}

/* =========================================================
   CORS / OPTIONS FALLBACKS
   Wix supports get/post/put/delete/use. use_<name> catches
   browser OPTIONS preflight when no method-specific handler exists.
========================================================= */

export function use_getExams() { return corsOptions("GET"); }
export function use_submitExam() { return corsOptions("POST"); }
export function use_getResults() { return corsOptions("GET"); }
export function use_updateProgress() { return corsOptions("POST"); }
export function use_getProgress() { return corsOptions("GET"); }
export function use_submitTest() { return corsOptions("POST"); }
export function use_getTestResults() { return corsOptions("GET"); }

export function use_brightonPlacementPing() { return corsOptions("GET"); }
export function use_brightonPlacementStart() { return corsOptions("POST"); }
export function use_brightonPlacementResume() { return corsOptions("POST"); }
export function use_brightonPlacementStep() { return corsOptions("POST"); }
export function use_brightonPlacementSpeakingChunk() { return corsOptions("POST"); }
export function use_brightonPlacementSubmitSpeaking() { return corsOptions("POST"); }
export function use_brightonPlacementSkipSpeaking() { return corsOptions("POST"); }
export function use_brightonPlacementResult() { return corsOptions("POST"); }
export function use_brightonPlacementActivity() { return corsOptions("POST"); }
export function use_brightonPlacementExpire() { return corsOptions("POST"); }
export function use_brightonPlacementResults() { return corsOptions("GET"); }
export function use_brightonPlacementDashboardResult() { return corsOptions("GET"); }

/* =========================================================
   EXAMS
========================================================= */

export async function get_getExams(request) { return getExams(); }
export async function post_submitExam(request) { return submitExam(request); }
export async function get_getResults(request) { return getResults(request); }
export async function post_updateProgress(request) { return updateProgress(request); }
export async function get_getProgress(request) { return getProgress(request); }

/* =========================================================
   TESTS
========================================================= */

export async function post_submitTest(request) { return submitTest(request); }
export async function get_getTestResults(request) { return getTestResults(request); }

/* =========================================================
   PLACEMENT
========================================================= */

export function get_brightonPlacementPing() { return pingPlacement(); }

export async function post_brightonPlacementStart(request) { return startPlacement(request); }
export async function post_brightonPlacementResume(request) { return resumePlacement(request); }
export async function post_brightonPlacementStep(request) { return placementStep(request); }
export async function post_brightonPlacementSpeakingChunk(request) { return uploadSpeakingChunk(request); }
export async function post_brightonPlacementSubmitSpeaking(request) { return submitSpeaking(request); }
export async function post_brightonPlacementSkipSpeaking(request) { return skipSpeaking(request); }
export async function post_brightonPlacementResult(request) { return placementResult(request); }
export async function post_brightonPlacementActivity(request) { return touchPlacementActivity(request); }
export async function post_brightonPlacementExpire(request) { return expirePlacementSession(request); }

export async function get_brightonPlacementResults(request) { return getPlacementResults(request); }
export async function get_brightonPlacementDashboardResult(request) { return getPlacementDashboardResult(request); }

// Compatibility transport for browsers/sites where the published GET route is stale.
// Frontend sends text/plain, so these POST calls do not require a CORS preflight.
export async function post_brightonPlacementResults(request) { return getPlacementResults(request); }
export async function post_brightonPlacementDashboardResult(request) { return getPlacementDashboardResult(request); }

// Young Learners: append to the existing router; preserve Exams/Tests/Placement.
import * as young from "backend/young-placement.js";
export function use_brightonYoungPlacementPing() { return corsOptions("GET"); }
export function get_brightonYoungPlacementPing(request) { return young.pingPlacement(request); }
export function use_brightonYoungPlacementStart() { return corsOptions("POST"); }
export function post_brightonYoungPlacementStart(request) { return young.startPlacement(request); }
export function use_brightonYoungPlacementResume() { return corsOptions("POST"); }
export function post_brightonYoungPlacementResume(request) { return young.resumePlacement(request); }
export function use_brightonYoungPlacementStep() { return corsOptions("POST"); }
export function post_brightonYoungPlacementStep(request) { return young.placementStep(request); }
export function use_brightonYoungPlacementSpeakingChunk() { return corsOptions("POST"); }
export function post_brightonYoungPlacementSpeakingChunk(request) { return young.uploadSpeakingChunk(request); }
export function use_brightonYoungPlacementSubmitSpeaking() { return corsOptions("POST"); }
export function post_brightonYoungPlacementSubmitSpeaking(request) { return young.submitSpeaking(request); }
export function use_brightonYoungPlacementSkipSpeaking() { return corsOptions("POST"); }
export function post_brightonYoungPlacementSkipSpeaking(request) { return young.skipSpeaking(request); }
export function use_brightonYoungPlacementResult() { return corsOptions("POST"); }
export function post_brightonYoungPlacementResult(request) { return young.placementResult(request); }
export function use_brightonYoungPlacementActivity() { return corsOptions("POST"); }
export function post_brightonYoungPlacementActivity(request) { return young.touchPlacementActivity(request); }
export function use_brightonYoungPlacementExpire() { return corsOptions("POST"); }
export function post_brightonYoungPlacementExpire(request) { return young.expirePlacementSession(request); }
