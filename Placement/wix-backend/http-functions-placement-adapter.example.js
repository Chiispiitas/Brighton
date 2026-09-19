// Brighton Placement adapter for the EXISTING Backend/http-functions.js
// Contract: 2026-09-19.8
//
// IMPORTANT:
// 1. Do not replace or delete any existing Tests/Exams imports or handlers.
// 2. Add this import beside the existing imports.
// 3. Add the exported functions below at the end of the existing file.
// 4. All endpoint names are Brighton-Placement-specific to avoid collisions.

import {
  placementCors,
  startPlacement,
  resumePlacement,
  placementStep,
  submitSpeaking,
  skipSpeaking,
  placementResult
} from "backend/placement-api";

// CORS preflight
export function options_brightonPlacementStart() { return placementCors(); }
export function options_brightonPlacementResume() { return placementCors(); }
export function options_brightonPlacementStep() { return placementCors(); }
export function options_brightonPlacementSubmitSpeaking() { return placementCors(); }
export function options_brightonPlacementSkipSpeaking() { return placementCors(); }
export function options_brightonPlacementResult() { return placementCors(); }

// Placement-only HTTP endpoints
export function post_brightonPlacementStart(request) {
  return startPlacement(request);
}

export function post_brightonPlacementResume(request) {
  return resumePlacement(request);
}

export function post_brightonPlacementStep(request) {
  return placementStep(request);
}

export function post_brightonPlacementSubmitSpeaking(request) {
  return submitSpeaking(request);
}

export function post_brightonPlacementSkipSpeaking(request) {
  return skipSpeaking(request);
}

export function post_brightonPlacementResult(request) {
  return placementResult(request);
}
