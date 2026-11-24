import { createRemoteJWKSet, jwtVerify } from "jose";
import { processNextSpeakingReceipt as processAdult } from "../../generated/placement.js";
import { processNextSpeakingReceipt as processYoung } from "../../generated/young-placement.js";

export const prerender = false;
const issuer = "https://token.actions.githubusercontent.com";
const keys = createRemoteJWKSet(new URL(issuer + "/.well-known/jwks"));
const workflow = "chiispiitas/brighton/.github/workflows/placement-speaking.yml@refs/heads/main";

export async function POST({ request }) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer /i, "");
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer, audience: "brighton-placement-speaking", algorithms: ["RS256"]
    });
    if (payload.repository_id !== "729330066" || String(payload.workflow_ref).toLowerCase() !== workflow ||
        !["schedule", "workflow_dispatch"].includes(String(payload.event_name))) {
      return new Response(null, { status: 403 });
    }
  } catch {
    return new Response(null, { status: 401 });
  }
  const attempts = await Promise.allSettled([processAdult(), processYoung()]);
  if (attempts.some(attempt => attempt.status === "rejected")) {
    console.error("Speaking queue could not process a placement track.");
    return new Response(null, { status: 503 });
  }
  const processed = attempts.filter(attempt => attempt.status === "fulfilled" && attempt.value).length;
  return Response.json({ processed }, { headers: { "Cache-Control": "no-store" } });
}

