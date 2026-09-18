import { corsOptions } from "backend/core.js";

import {
  getSession,
  saveSession,
  getJudges,
  saveJudge,
  getCommand,
  saveCommand
} from "backend/spelling-bee.js";

/*
  Wix routes GET/POST to the method-specific exports below.
  use_<name> acts as the catch-all and handles browser OPTIONS preflight
  requests for the cross-origin Brighton frontend.
*/
export function use_spellingBeeSession() {
  return corsOptions("GET, POST");
}

export function use_spellingBeeJudge() {
  return corsOptions("GET, POST");
}

export function use_spellingBeeCommand() {
  return corsOptions("GET, POST");
}

export async function get_spellingBeeSession(request) {
  return getSession(request);
}

export async function post_spellingBeeSession(request) {
  return saveSession(request);
}

export async function get_spellingBeeJudge(request) {
  return getJudges(request);
}

export async function post_spellingBeeJudge(request) {
  return saveJudge(request);
}

export async function get_spellingBeeCommand(request) {
  return getCommand(request);
}

export async function post_spellingBeeCommand(request) {
  return saveCommand(request);
}
