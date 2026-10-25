import wixData from 'wix-data';
import { fetch } from 'wix-fetch';
import { DATA_OPTIONS, readJsonBody, normalizeClassCode, getStoredAnswerKeyVersion, jsonOK, jsonBadRequest, jsonServerError } from 'backend/core.js';
import { gradeSubmission } from 'backend/exams.js';
import { profileFor, tasksFor, parse, validateScores, apply } from 'backend/writing-rubric.js';
import { gradeWriting } from 'backend/writing-ai.js';

const COLLECTION='ExamSubmissions';
const pending=new Map();

async function findSubmission(payload) {
  const classId=normalizeClassCode(payload.classId);
  const submissionId=String(payload.submissionId || '').trim();
  if (!classId || !submissionId) throw new Error('classId and submissionId are required.');
  const result=await wixData.query(COLLECTION).eq('classId',classId).eq('submissionId',submissionId).limit(2).find({...DATA_OPTIONS,consistentRead:true});
  if (result.items.length!==1) throw new Error('The submission was not found in this class, or its ID is ambiguous.');
  if (!profileFor(result.items[0])) throw new Error('This exam does not have a writing assessment.');
  return result.items[0];
}

function publicAssessment(item) {
  const updated=apply(item);
  return {submissionId:item.submissionId,writingAiJson:item.writingAiJson,writingTeacherJson:item.writingTeacherJson || '',
    writingRevision:Number(item.writingRevision)||0,score:updated.score,maxScore:updated.maxScore,percentage:updated.percentage,
    partScoresJson:updated.partScoresJson,gradingDetailsJson:updated.gradingDetailsJson,status:item.status};
}

async function objectiveGrade(item) {
  const profile=profileFor(item);
  if (!['a1rw','a2rw'].includes(profile.id)) return {score:0,maxScore:0,partScores:{},details:[]};
  const version=getStoredAnswerKeyVersion(item);
  const directory=version ? `versions/${encodeURIComponent(version)}/` : '';
  const response=await fetch(`https://exams.bebrighton.net/Exams/answer-keys/${directory}${profile.examId}.json`);
  if (!response.ok) throw new Error('The stored answer-key release could not be loaded.');
  const key=await response.json();
  if (key.examId!==profile.examId) throw new Error('The answer key does not match the exam.');
  const payload=parse(item.rawPayloadJson);
  return gradeSubmission({...payload,answers:parse(item.answersJson,payload.answers || {}),answerList:parse(item.answerListJson,payload.answerList)},key);
}

async function ensureAssessment(item) {
  if (parse(item.writingAiJson,null)) return item;
  if (pending.has(item._id)) return pending.get(item._id);
  const operation=(async()=>{
    const objective=await objectiveGrade(item);
    const ai=await gradeWriting(tasksFor(item));
    // Re-read after the provider call so another request's saved assessment wins.
    const latest=await wixData.get(COLLECTION,item._id,{...DATA_OPTIONS,consistentRead:true});
    if (parse(latest.writingAiJson,null)) return latest;
    const assessed=apply({...latest,writingAiJson:JSON.stringify({...ai,objective}),writingTeacherJson:'',writingRevision:1,status:'writing_suggested'});
    return wixData.update(COLLECTION,assessed,DATA_OPTIONS);
  })();
  pending.set(item._id,operation);
  try { return await operation; } finally { pending.delete(item._id); }
}

export async function getWritingAssessment(request) {
  try {
    const payload=await readJsonBody(request);
    const item=await ensureAssessment(await findSubmission(payload));
    return jsonOK({success:true,assessment:publicAssessment(item)});
  } catch(error) { return jsonServerError(error); }
}

export async function saveWritingAssessment(request) {
  const payload=await readJsonBody(request);
  let item;
  try {
    item=await findSubmission(payload);
    if (!parse(item.writingAiJson,null)) throw new Error('Load the original AI assessment before saving a review.');
    if (!['save','revert'].includes(payload.action)) throw new Error('Choose save or revert.');
    if (payload.expectedRevision!==(Number(item.writingRevision)||0)) throw new Error('This assessment changed since you loaded it. Reload results before saving.');
    const teacher=payload.action==='revert' ? '' : JSON.stringify({scores:validateScores(tasksFor(item),payload.scores),savedAt:new Date().toISOString()});
    const updated=apply({...item,writingTeacherJson:teacher,writingRevision:(Number(item.writingRevision)||0)+1,status:teacher?'writing_saved':'writing_suggested'});
    const saved=await wixData.update(COLLECTION,updated,DATA_OPTIONS);
    return jsonOK({success:true,assessment:publicAssessment(saved)});
  } catch(error) {
    return item ? jsonBadRequest(error.message || String(error)) : jsonServerError(error);
  }
}
