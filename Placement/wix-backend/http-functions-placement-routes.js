// Merge this block into the EXISTING modular Backend/http-functions.js.
// This version matches Brighton-Assessment-Wix-Modular-Backend-FIXED.
// Keep the existing Exams and Tests imports/routes.

import { corsOptions } from "backend/core.js";

import {
  startPlacement,
  resumePlacement,
  placementStep,
  submitSpeaking,
  skipSpeaking,
  placementResult,
  listPlacementResults,
  placementDashboardResult
} from "backend/placement.js";

/* Placement CORS / catch-all */
export function use_brightonPlacementStart() { return corsOptions("POST"); }
export function use_brightonPlacementResume() { return corsOptions("POST"); }
export function use_brightonPlacementStep() { return corsOptions("POST"); }
export function use_brightonPlacementSubmitSpeaking() { return corsOptions("POST"); }
export function use_brightonPlacementSkipSpeaking() { return corsOptions("POST"); }
export function use_brightonPlacementResult() { return corsOptions("POST"); }
export function use_brightonPlacementResults() { return corsOptions("GET"); }
export function use_brightonPlacementDashboardResult() { return corsOptions("GET"); }

/* Student Placement routes */
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
