// Paste/merge this block into the EXISTING Backend/http-functions.js.
// Do not remove the existing Tests/Exams imports or routes.

import { corsOptions } from "backend/core.js";

import {
  startPlacement,
  resumePlacement,
  placementStep,
  submitSpeaking,
  skipSpeaking,
  placementResult
} from "backend/placement.js";

/* =========================================================
   BRIGHTON PLACEMENT — CORS / FALLBACK VERB
========================================================= */

export function use_brightonPlacementStart() {
  return corsOptions("POST");
}

export function use_brightonPlacementResume() {
  return corsOptions("POST");
}

export function use_brightonPlacementStep() {
  return corsOptions("POST");
}

export function use_brightonPlacementSubmitSpeaking() {
  return corsOptions("POST");
}

export function use_brightonPlacementSkipSpeaking() {
  return corsOptions("POST");
}

export function use_brightonPlacementResult() {
  return corsOptions("POST");
}

/* =========================================================
   BRIGHTON PLACEMENT — POST ROUTES
========================================================= */

export async function post_brightonPlacementStart(request) {
  return startPlacement(request);
}

export async function post_brightonPlacementResume(request) {
  return resumePlacement(request);
}

export async function post_brightonPlacementStep(request) {
  return placementStep(request);
}

export async function post_brightonPlacementSubmitSpeaking(request) {
  return submitSpeaking(request);
}

export async function post_brightonPlacementSkipSpeaking(request) {
  return skipSpeaking(request);
}

export async function post_brightonPlacementResult(request) {
  return placementResult(request);
}
