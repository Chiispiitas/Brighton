import wixData from "wix-data";

const read = { suppressAuth: true, consistentRead: true };
const write = { suppressAuth: true };
const claimLifetime = 2 * 60 * 1000;
const maxRetention = 7 * 24 * 60 * 60 * 1000;

async function storageId(parts) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(parts))));
  return Array.from(digest.slice(0, 16), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function receiveSpeaking(session, payload, collection, chunks) {
  const now = new Date();
  let receipt = {
    audioUploadId: payload.audioUploadId,
    audioChunkCount: Number(payload.audioChunkCount),
    audioMimeType: String(payload.audioMimeType || "").slice(0, 100),
    durationSeconds: Number(payload.durationSeconds) || 0,
    maximumSeconds: Number(payload.maximumSeconds) || 0,
    autoStoppedByTimeLimit: payload.autoStoppedByTimeLimit === true,
    moduleId: session.moduleId,
    promptId: payload.promptId,
    receivedAt: now.getTime(),
    nextAttempt: now.getTime(),
    attempts: 0
  };
  // Only the winner may publish the receipt. A delayed duplicate must never
  // turn a graded session back into a provisional result.
  const generation = JSON.parse(session.progressJson || "{}").speakingAttempt || 0;
  const _id = await storageId(["receipt", session._id, generation]);
  try {
    await wixData.insert(chunks, { _id, sessionId: session._id, chunkBase64: JSON.stringify(receipt) }, write);
  } catch (error) {
    const current = await wixData.get(collection, session._id, read);
    if (current.status === "completed") return current;
    const marker = await wixData.get(chunks, _id, read);
    if (!marker) throw error;
    receipt = JSON.parse(marker.chunkBase64);
    if (now.getTime() - receipt.receivedAt < claimLifetime ||
        !await claimAttempt(session, receipt, chunks, now.getTime())) {
      throw new Error("Speaking submission is being confirmed. Retry shortly.");
    }
  }
  const current = await wixData.get(collection, session._id, read);
  if (current.status === "completed") return current;
  if (current.status !== "active" || current.moduleId !== receipt.moduleId ||
      (JSON.parse(current.progressJson || "{}").speakingAttempt || 0) !== generation) {
    throw new Error("Speaking attempt changed.");
  }
  const received = {
    ...current, status: "completed", phase: "speaking-assessment",
    finalLevel: current.provisionalLevel, confidence: 0, completedAt: new Date(receipt.receivedAt), updatedAt: now,
    progressJson: JSON.stringify({ stage: 4, totalStages: 4, completed: true, speakingReceipt: receipt })
  };
  await wixData.update(collection, received, write);
  return received;
}

// A stable insert gives simultaneous browser/worker deliveries one grading
// attempt. A crashed worker's claim automatically expires in the next window.
async function claimAttempt(session, receipt, chunks, now) {
  const window = Math.floor((now - receipt.nextAttempt) / claimLifetime);
  const _id = await storageId(["grade", session._id, receipt.audioUploadId, receipt.nextAttempt, window]);
  try {
    await wixData.insert(chunks, { _id, sessionId: session._id, uploadId: "assessment-claim" }, write);
    return true;
  } catch (error) {
    if (await wixData.get(chunks, _id, read)) return false;
    throw error;
  }
}

export async function assessReceivedSpeaking(session, receipt, services) {
  const { sessions, chunks, resolveAudio, gradeAudio, saveGrade, removeChunks } = services;
  const now = Date.now();
  if (receipt.nextAttempt > now || !await claimAttempt(session, receipt, chunks, now)) return session;
  const latest = await wixData.get(sessions, session._id, read);
  const latestReceipt = JSON.parse(latest.progressJson || "{}").speakingReceipt;
  if (!latestReceipt || latestReceipt.audioUploadId !== receipt.audioUploadId || latestReceipt.nextAttempt !== receipt.nextAttempt) return latest;

  // Persist the next retry before contacting the provider; a killed HTTP
  // request can then be picked up without the student or their device.
  const attempts = receipt.attempts + 1;
  const backoff = Math.min(6 * 3600000, claimLifetime * Math.pow(2, Math.min(attempts - 1, 8)));
  const progress = { stage: 4, totalStages: 4, completed: true };
  const working = { ...latest, updatedAt: new Date(now),
    progressJson: JSON.stringify({ ...progress, speakingReceipt: { ...receipt, attempts, nextAttempt: now + backoff } }) };
  await wixData.update(sessions, working, write);
  let retryReason = "assessment-expired";
  if (now - receipt.receivedAt < maxRetention) {
    const audioBase64 = await resolveAudio(receipt, working);
    if (!audioBase64) throw new Error("Received speaking audio could not be read.");
    const grade = await gradeAudio({ ...receipt, audioBase64 });
    if (!grade.inputError) return saveGrade(working, grade);
    if (String(grade.retryReason).startsWith("provider-")) return working;
    retryReason = grade.retryReason || "insufficient-evidence";
  }
  const finished = { ...working, phase: "result",
    progressJson: JSON.stringify({ ...progress, speakingRetakeReason: retryReason, speakingSkipped: true }) };
  await wixData.update(sessions, finished, write);
  await removeChunks(working._id);
  return finished;
}

export async function runNextSpeakingAssessment(sessions, chunks, assess) {
  // Also erase abandoned transports and recover cleanup after interrupted writes.
  const policyStart = new Date("2026-11-24T22:00:00Z");
  const cutoff = new Date(Date.now() - maxRetention);
  if (cutoff > policyStart) {
    const expired = await wixData.query(chunks).ge("_createdDate", policyStart).lt("_createdDate", cutoff)
      .fields("_id").limit(40).find(read);
    if (expired.items.length) await wixData.bulkRemove(chunks, expired.items.map(item => item._id), write);
  }

  // Oldest updates first. An attempt moves to the back of the queue when
  // claimed, even when the examiner is temporarily unavailable.
  let offset = 0;
  for (;;) {
    const page = await wixData.query(sessions).eq("phase", "speaking-assessment")
      .ascending("updatedAt", "_id").skip(offset).limit(50).find(read);
    for (const session of page.items) {
      const receipt = JSON.parse(session.progressJson || "{}").speakingReceipt;
      if (receipt && receipt.nextAttempt <= Date.now()) {
        await assess(session, receipt);
        return true;
      }
    }
    if (page.items.length < 50) return false;
    offset += page.items.length;
  }
}
