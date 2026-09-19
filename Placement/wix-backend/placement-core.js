import wixData from "wix-data";
import { ok, badRequest, serverError, response } from "wix-http-functions";

export const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
};

export function jsonOK(data = {}) {
  return ok({ headers: CORS_HEADERS, body: JSON.stringify({ success: true, ...data }) });
}

export function jsonBadRequest(message) {
  return badRequest({ headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: message }) });
}

export function jsonServerError(error) {
  return serverError({
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: error && error.message ? error.message : String(error)
    })
  });
}

export function corsOptions(methods = "GET, POST") {
  return response({
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": `${methods}, OPTIONS`,
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export function cleanText(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

export function cleanNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function cleanDate(value, fallback = null) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function parseJson(value, fallback = null) {
  if (value && typeof value === "object") return value;
  try { return JSON.parse(String(value || "")); } catch { return fallback; }
}

export async function readJsonBody(request) {
  try {
    return await request.body.json();
  } catch {
    try {
      const text = await request.body.text();
      return JSON.parse(text || "{}");
    } catch {
      return {};
    }
  }
}

export async function findOne(collectionId, field, value) {
  const result = await wixData
    .query(collectionId)
    .eq(field, value)
    .limit(1)
    .find({ suppressAuth: true });

  return result.items[0] || null;
}

export async function upsertOne(collectionId, keyField, keyValue, nextItem) {
  const existing = await findOne(collectionId, keyField, keyValue);

  if (existing) {
    return wixData.update(
      collectionId,
      { ...existing, ...nextItem },
      { suppressAuth: true }
    );
  }

  return wixData.insert(collectionId, nextItem, { suppressAuth: true });
}
