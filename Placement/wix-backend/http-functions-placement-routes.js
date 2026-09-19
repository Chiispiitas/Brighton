// Merge this block into the EXISTING Backend/http-functions.js.
// Keep all existing Tests/Exams imports and routes.
// IMPORTANT: do not add a second core.js import here.

import {
  placementCors,
  pingPlacement,
  startPlacement,
  resumePlacement,
  placementStep,
  submitSpeaking,
  skipSpeaking,
  placementResult,
  listPlacementResults,
  placementDashboardResult
} from "backend/placement.js";

/* CORS / catch-all */
export function use_brightonPlacementPing() { return placementCors("GET"); }
export function use_brightonPlacementStart() { return placementCors(); }
export function use_brightonPlacementResume() { return placementCors(); }
export function use_brightonPlacementStep() { return placementCors(); }
export function use_brightonPlacementSubmitSpeaking() { return placementCors(); }
export function use_brightonPlacementSkipSpeaking() { return placementCors(); }
export function use_brightonPlacementResult() { return placementCors(); }
export function use_brightonPlacementResults() { return placementCors("GET"); }
export function use_brightonPlacementDashboardResult() { return placementCors("GET"); }

/* Diagnostic route: open /_functions/brightonPlacementPing in a browser. */
export function get_brightonPlacementPing() {
  return pingPlacement();
}

/* POST routes */
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


/* Teacher Placement results dashboard */
export async function get_brightonPlacementResults(request) {
  return listPlacementResults(request);
}

export async function get_brightonPlacementDashboardResult(request) {
  return placementDashboardResult(request);
}
