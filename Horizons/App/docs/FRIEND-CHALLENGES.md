# Friend challenge API
Authenticated POST /api/horizons actions:
- listChallenges: private participant summaries, newest30.
- createChallenge: targetId (public friend ID), requestId (client UUID); returns challenge.
- openChallenge: challengeId; verifies friendship/access, returns snapshot questions/options only before submission.
- submitChallenge: challengeId, answers [{questionId,submitted}]; eight unique snapshot questions, graded server-side, immutable/idempotent score.
- declineChallenge: challengeId; invited participant only, before their submission.
Responses never expose raw participant IDs. No access to others' challenge records. Errors use CHALLENGE_REQUEST and relevant400/403/404/429 status. No XP writes or real learner QA.
