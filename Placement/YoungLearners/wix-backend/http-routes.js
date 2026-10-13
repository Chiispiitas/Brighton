
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
