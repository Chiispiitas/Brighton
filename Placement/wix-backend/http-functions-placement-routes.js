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
  touchPlacementActivity,
  expirePlacementSession,
  listPlacementResults,
  placementDashboardResult
} from "backend/placement.js";

/* Placement CORS / catch-all */
export function options_brightonPlacementStart() { return corsOptions("POST"); }
export function options_brightonPlacementResume() { return corsOptions("POST"); }
export function options_brightonPlacementStep() { return corsOptions("POST"); }
export function options_brightonPlacementSubmitSpeaking() { return corsOptions("POST"); }
export function options_brightonPlacementSkipSpeaking() { return corsOptions("POST"); }
export function options_brightonPlacementResult() { return corsOptions("POST"); }
export function options_brightonPlacementActivity() { return corsOptions("POST"); }
export function options_brightonPlacementExpire() { return corsOptions("POST"); }
export function options_brightonPlacementResults() { return corsOptions("GET, POST"); }
export function options_brightonPlacementDashboardResult() { return corsOptions("GET, POST"); }

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

export async function post_brightonPlacementActivity(request) {
  return touchPlacementActivity(request);
}

export async function post_brightonPlacementExpire(request) {
  return expirePlacementSession(request);
}

/* Teacher Placement results dashboard
   POST is the preferred transport from GitHub Pages because text/plain JSON
   avoids browser preflight edge cases. GET remains for compatibility. */
export async function post_brightonPlacementResults(request) {
  return listPlacementResults(request);
}

export async function post_brightonPlacementDashboardResult(request) {
  return placementDashboardResult(request);
}

export async function get_brightonPlacementResults(request) {
  return listPlacementResults(request);
}

export async function get_brightonPlacementDashboardResult(request) {
  return placementDashboardResult(request);
}
