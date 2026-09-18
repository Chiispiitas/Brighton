import { corsOptions } from "./core.js";

import {
  getSession,
  saveSession,
  getJudges,
  saveJudge,
  getCommand,
  saveCommand
} from "./spelling-bee.js";

export function options_spellingBeeSession() {
  return corsOptions("GET, POST");
}

export function options_spellingBeeJudge() {
  return corsOptions("GET, POST");
}

export function options_spellingBeeCommand() {
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
