const APP_VERSION = 7;
const STORAGE_KEY = 'powerGymApp.v7';
const LEGACY_STORAGE_KEYS = ['powerGymApp.v6', 'powerGymApp.v5', 'powerGymApp.v4', 'powerGymApp.v3', 'powerGymApp.v2'];
const COOKIE_KEY = 'powerGymApp.cookie';
const COOKIE_CHUNK_SIZE = 3000;
const COOKIE_CHUNK_LIMIT = 12;
const IS_HOSTED_APP = ['http:', 'https:'].includes(window.location.protocol);
const IS_FILE_APP = window.location.protocol === 'file:';
const todayISO = () => new Date().toISOString().slice(0, 10);
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

const EXERCISES = {
  jointPrep: {
    id: 'jointPrep', name: 'Joint Prep Flow', category: 'mobility', level: 'beginner', icon: '🌀', time: 60,
    summary: 'Gentle wrists, shoulders, hips, knees and ankles preparation.',
    cues: ['Move slowly through each joint', 'Keep breathing calm', 'Do not force end range', 'Use this before every session'],
    safety: 'If a joint feels sharp pain, reduce range immediately.', easier: 'Make smaller circles.', harder: 'Add deeper squat and lunge positions.'
  },
  bearCrawl: {
    id: 'bearCrawl', name: 'Bear Crawl', category: 'strength', level: 'beginner', icon: '🐻', time: 40,
    summary: 'Full-body crawl for shoulders, core and coordination.',
    cues: ['Hands under shoulders', 'Knees hover low', 'Move opposite hand and foot', 'Quiet, controlled steps'],
    safety: 'Keep wrists stacked and rest if shoulders collapse.', easier: 'Static bear hold.', harder: 'Forward-backward bear crawl.'
  },
  hollowHold: {
    id: 'hollowHold', name: 'Hollow Hold', category: 'core', level: 'beginner', icon: '🌙', time: 30,
    summary: 'Gymnastics bodyline drill for kip-ups, levers and handstands.',
    cues: ['Lower back presses down', 'Ribs tucked', 'Arms long', 'Scale legs higher if needed'],
    safety: 'Do not let the lower back arch aggressively.', easier: 'Tuck hollow hold.', harder: 'Rocks or extended arms overhead.'
  },
  archHold: {
    id: 'archHold', name: 'Arch Hold', category: 'core', level: 'beginner', icon: '🏹', time: 30,
    summary: 'Posterior-chain bodyline drill for kip-up whip and back control.',
    cues: ['Glutes tight', 'Lift chest and thighs gently', 'Neck neutral', 'Hold smooth tension'],
    safety: 'Avoid pinching the lower back.', easier: 'Lift arms only or legs only.', harder: 'Arch rocks.'
  },
  airSquat: {
    id: 'airSquat', name: 'Air Squat', category: 'strength', level: 'beginner', icon: '🦵', reps: '10–15',
    summary: 'Foundational leg strength for jumping, landings and floor skills.',
    cues: ['Feet rooted', 'Knees follow toes', 'Chest tall', 'Stand with strong hips'],
    safety: 'Keep pain-free depth and land softly when progressing to jumps.', easier: 'Chair squat.', harder: 'Tempo squat or jump squat.'
  },
  gluteBridge: {
    id: 'gluteBridge', name: 'Glute Bridge', category: 'strength', level: 'beginner', icon: '🌉', reps: '12–15',
    summary: 'Hip extension strength for kip-up drive and lower-body power.',
    cues: ['Feet under knees', 'Squeeze glutes', 'Ribs down', 'Pause at top'],
    safety: 'Avoid over-arching the low back.', easier: 'Shorter range.', harder: 'Single-leg glute bridge.'
  },
  inclinePushup: {
    id: 'inclinePushup', name: 'Incline Push-Up', category: 'strength', level: 'beginner', icon: '💪', reps: '6–12',
    summary: 'Scaled pushing strength for handstands, planche and kip-up support.',
    cues: ['Body straight', 'Elbows 30–45°', 'Chest to surface', 'Push the floor away'],
    safety: 'Use a stable surface only.', easier: 'Wall push-up.', harder: 'Full push-up.'
  },
  pushup: {
    id: 'pushup', name: 'Push-Up', category: 'strength', level: 'intermediate', icon: '💪', reps: '8–15',
    summary: 'Upper-body pushing strength for power moves and gymnastics positions.',
    cues: ['Straight bodyline', 'Brace abs', 'Control down', 'Strong lockout'],
    safety: 'Stop if shoulder pain appears.', easier: 'Incline or knee push-up.', harder: 'Decline or explosive push-up.'
  },
  pikePushup: {
    id: 'pikePushup', name: 'Pike Push-Up', category: 'strength', level: 'intermediate', icon: '🔺', reps: '5–10',
    summary: 'Vertical pushing strength for handstand push-up preparation.',
    cues: ['Hips high', 'Head travels forward', 'Elbows track', 'Push tall at top'],
    safety: 'Do not crash onto the head.', easier: 'Hands elevated.', harder: 'Feet elevated pike push-up.'
  },
  tableRow: {
    id: 'tableRow', name: 'Table / Towel Row', category: 'strength', level: 'beginner', icon: '🪢', reps: '6–12',
    summary: 'Pulling strength without gym equipment. Use a safe table or towel setup.',
    cues: ['Secure the setup first', 'Chest pulls to hands', 'Shoulders down', 'Body straight'],
    safety: 'Only use stable furniture or skip this movement.', easier: 'More upright angle.', harder: 'Feet farther away or single-leg row.'
  },
  reverseSnowAngel: {
    id: 'reverseSnowAngel', name: 'Reverse Snow Angel', category: 'mobility', level: 'beginner', icon: '👼', reps: '8–12',
    summary: 'Shoulder mobility and upper-back activation for handstands and bridges.',
    cues: ['Face down', 'Move arms slowly', 'Keep thumbs up', 'Do not shrug'],
    safety: 'Use a small range if shoulders are tight.', easier: 'Bent elbows.', harder: 'Add a pause overhead.'
  },
  plank: {
    id: 'plank', name: 'Plank', category: 'core', level: 'beginner', icon: '🧱', time: 30,
    summary: 'Trunk stiffness for safe landings, holds and power transfer.',
    cues: ['Elbows under shoulders', 'Squeeze glutes', 'Ribs down', 'Push floor away'],
    safety: 'Rest before the lower back sags.', easier: 'Knee plank.', harder: 'Long-lever plank.'
  },
  deadBug: {
    id: 'deadBug', name: 'Dead Bug', category: 'core', level: 'beginner', icon: '🐞', reps: '8 each side',
    summary: 'Core control for hollow body positions.',
    cues: ['Back flat', 'Move opposite arm and leg', 'Exhale slowly', 'Keep range honest'],
    safety: 'Do not arch the lower back.', easier: 'Only move arms.', harder: 'Hold light object overhead.'
  },
  squatJump: {
    id: 'squatJump', name: 'Squat Jump', category: 'power', level: 'intermediate', icon: '🚀', reps: '6–10',
    summary: 'Explosive leg power for kip-ups, round-offs and jumps.',
    cues: ['Dip quickly', 'Jump tall', 'Land quietly', 'Reset each rep'],
    safety: 'Avoid high volume. Land softly with knees tracking toes.', easier: 'Squat to calf raise.', harder: 'Tuck jump.'
  },
  tuckJump: {
    id: 'tuckJump', name: 'Tuck Jump', category: 'power', level: 'advanced', icon: '💥', reps: '5–8',
    summary: 'High power jump drill for acrobatic explosiveness.',
    cues: ['Jump before tucking', 'Knees up fast', 'Land quietly', 'Rest fully'],
    safety: 'Use only after basic jump mechanics are solid.', easier: 'Squat jump.', harder: 'Repeated tuck jumps with long rest.'
  },
  plyoPushup: {
    id: 'plyoPushup', name: 'Explosive Push-Up', category: 'power', level: 'advanced', icon: '⚡', reps: '3–8',
    summary: 'Upper-body power for dynamic pushing and hand support.',
    cues: ['Brace hard', 'Explode from bottom', 'Land with soft elbows', 'Quality over reps'],
    safety: 'Skip if wrists, elbows or shoulders hurt.', easier: 'Incline explosive push-up.', harder: 'Clap push-up.'
  },
  wallHandstand: {
    id: 'wallHandstand', name: 'Wall Handstand Hold', category: 'skill', level: 'intermediate', icon: '🤸', time: 25,
    summary: 'Vertical balance and shoulder strength for gymnastics skill work.',
    cues: ['Hands shoulder-width', 'Push tall', 'Ribs tucked', 'Look between hands'],
    safety: 'Learn to come down safely before long holds.', easier: 'Pike hold on couch.', harder: 'Wall-facing hold or shoulder taps.'
  },
  crowHold: {
    id: 'crowHold', name: 'Crow Hold', category: 'skill', level: 'beginner', icon: '🐦', time: 20,
    summary: 'Beginner balance drill before handstand work.',
    cues: ['Hands flat', 'Knees on arms', 'Look forward', 'Shift slowly'],
    safety: 'Place a pillow in front of the head.', easier: 'One foot hovering.', harder: 'Both feet lifted longer.'
  },
  scapPushup: {
    id: 'scapPushup', name: 'Scapular Push-Up', category: 'strength', level: 'beginner', icon: '🪽', reps: '10–15',
    summary: 'Shoulder blade control for handstands, planche and push-ups.',
    cues: ['Arms straight', 'Chest moves down/up', 'Push tall', 'No elbow bend'],
    safety: 'Keep movement pain-free.', easier: 'Incline scap push-up.', harder: 'Planche lean scap push-up.'
  },
  plancheLean: {
    id: 'plancheLean', name: 'Planche Lean', category: 'skill', level: 'advanced', icon: '🧲', time: 15,
    summary: 'Straight-arm strength progression toward tuck planche.',
    cues: ['Lock elbows', 'Protract shoulders', 'Lean gradually', 'Posterior pelvic tilt'],
    safety: 'Warm wrists thoroughly and avoid elbow pain.', easier: 'Short lean.', harder: 'Feet elevated lean.'
  },
  lSit: {
    id: 'lSit', name: 'Tuck / L-Sit', category: 'core', level: 'intermediate', icon: '📐', time: 15,
    summary: 'Compression and straight-arm strength for gymnastics core control.',
    cues: ['Hands push down', 'Shoulders depressed', 'Knees high', 'Straighten as able'],
    safety: 'Use stable chairs or blocks if elevating hands.', easier: 'Tuck sit.', harder: 'One-leg then full L-sit.'
  },
  kipPlow: {
    id: 'kipPlow', name: 'Kip-Up Plow Drill', category: 'skill', level: 'beginner', icon: '🌊', reps: '6–10',
    summary: 'Learn the rollback and hip loading position of a kip-up.',
    cues: ['Roll to shoulders, not neck', 'Knees near ears', 'Hands by ears', 'Rock smoothly'],
    safety: 'Use a mat and avoid pressure on the neck.', easier: 'Small rock backs.', harder: 'Rock to feet with assistance.'
  },
  lowBridge: {
    id: 'lowBridge', name: 'Low Bridge Hold', category: 'mobility', level: 'beginner', icon: '🌉', time: 15,
    summary: 'Bridge shape for kip-up, shoulders, wrists and spine.',
    cues: ['Hands by ears', 'Push evenly', 'Breathe', 'Only go pain-free'],
    safety: 'Skip deep bridge if wrists or back feel sharp pain.', easier: 'Glute bridge.', harder: 'Full bridge rocks.'
  },
  kipBail: {
    id: 'kipBail', name: 'Kip-Up Bail Practice', category: 'skill', level: 'intermediate', icon: '🛡️', reps: '5',
    summary: 'Practice safe failure before full kip-up attempts.',
    cues: ['Tuck chin', 'Roll to side/back', 'Do not force landing', 'Reset calmly'],
    safety: 'Practice on a soft mat with space.', easier: 'Slow roll practice.', harder: 'Bail from a stronger kick attempt.'
  },
  assistedKip: {
    id: 'assistedKip', name: 'Assisted Kip-Up', category: 'skill', level: 'intermediate', icon: '🦘', reps: '4–8',
    summary: 'Bridge the gap between kip drills and full attempts.',
    cues: ['Kick up and forward', 'Push hard with hands', 'Feet under hips', 'Use mat or incline'],
    safety: 'Never throw the head back into the floor.', easier: 'Higher surface assist.', harder: 'Lower assist.'
  },
  fullKip: {
    id: 'fullKip', name: 'Full Kip-Up Attempt', category: 'skill', level: 'advanced', icon: '🥷', reps: '3–8',
    summary: 'Advanced power skill combining mobility, timing and explosive drive.',
    cues: ['Load in plow', 'Kick explosively', 'Push through hands', 'Land over feet'],
    safety: 'Only attempt with warm body, mat, clear space and solid prerequisites.', easier: 'Assisted kip-up.', harder: 'Kip-up to stance with no hand push.'
  },
  cartwheelLine: {
    id: 'cartwheelLine', name: 'Cartwheel Line Drill', category: 'skill', level: 'beginner', icon: '🛞', reps: '5 each side',
    summary: 'Hand-foot placement for cartwheels and round-offs.',
    cues: ['Follow a straight line', 'Hand-hand-foot-foot', 'Kick tall', 'Finish balanced'],
    safety: 'Use clear floor space.', easier: 'Low donkey kick.', harder: 'Faster cartwheel or round-off snap-down.'
  },
  donkeyKick: {
    id: 'donkeyKick', name: 'Donkey Kick', category: 'skill', level: 'beginner', icon: '🐴', reps: '8–10',
    summary: 'Inversion confidence for cartwheels and handstands.',
    cues: ['Hands planted', 'Small kick first', 'Hips over shoulders', 'Land softly'],
    safety: 'Do not kick beyond control.', easier: 'Mountain climber step.', harder: 'Kick to wall handstand.'
  },
  frontLeverTuck: {
    id: 'frontLeverTuck', name: 'Tuck Front Lever Row / Hold', category: 'skill', level: 'advanced', icon: '🧊', time: 10,
    summary: 'Horizontal pulling and core compression for lever progressions.',
    cues: ['Pull shoulders down', 'Tuck knees', 'Hips high', 'Short quality holds'],
    safety: 'Requires a secure bar/table setup. Skip if unavailable.', easier: 'Hollow body row.', harder: 'One-leg front lever tuck.'
  },
  mountainClimber: {
    id: 'mountainClimber', name: 'Mountain Climber', category: 'core', level: 'beginner', icon: '⛰️', time: 30,
    summary: 'Conditioning and trunk control without equipment.',
    cues: ['Hands stacked', 'Drive knees', 'Keep hips level', 'Steady rhythm'],
    safety: 'Slow down if wrists fatigue.', easier: 'Step slowly.', harder: 'Cross-body mountain climber.'
  },
  cossackSquat: {
    id: 'cossackSquat', name: 'Cossack Squat', category: 'mobility', level: 'intermediate', icon: '↔️', reps: '5 each side',
    summary: 'Hip and adductor mobility for landings and acrobatic positions.',
    cues: ['Shift side to side', 'Heel stays down if possible', 'Chest proud', 'Use hands as support'],
    safety: 'Keep knee comfortable and control depth.', easier: 'Shallow side lunge.', harder: 'Deeper Cossack with pause.'
  },
  pancakeReach: {
    id: 'pancakeReach', name: 'Pancake Reach', category: 'mobility', level: 'beginner', icon: '🥞', time: 30,
    summary: 'Hamstring and hip mobility for compression, kip-up landing and straddle skills.',
    cues: ['Sit tall', 'Hinge from hips', 'Reach forward', 'Breathe into stretch'],
    safety: 'No bouncing. Mild stretch only.', easier: 'Bend knees.', harder: 'Wider straddle with flat back.'
  },
  wristRocks: {
    id: 'wristRocks', name: 'Wrist Rocks', category: 'mobility', level: 'beginner', icon: '✋', reps: '10 each way',
    summary: 'Essential wrist preparation for hand support skills.',
    cues: ['Palm flat', 'Gentle forward/back rocks', 'Turn fingers carefully', 'No sharp pain'],
    safety: 'Stop if tingling or sharp pain occurs.', easier: 'Do on wall.', harder: 'Quadruped with more lean.'
  },
  splitSquat: {
    id: 'splitSquat', name: 'Split Squat', category: 'strength', level: 'intermediate', icon: '🦿', reps: '8 each side',
    summary: 'Single-leg strength for jumping and controlled landings.',
    cues: ['Tall posture', 'Front foot rooted', 'Back knee down', 'Drive through front leg'],
    safety: 'Use a comfortable stride length.', easier: 'Hold wall support.', harder: 'Bulgarian split squat.'
  },
  shrimpSquat: {
    id: 'shrimpSquat', name: 'Shrimp Squat Progression', category: 'strength', level: 'advanced', icon: '🦐', reps: '3–6 each side',
    summary: 'Advanced single-leg strength without weights.',
    cues: ['Slow descent', 'Knee tracks toes', 'Light back knee touch', 'Stand controlled'],
    safety: 'Avoid knee collapse or pain.', easier: 'Supported split squat.', harder: 'Full shrimp squat.'
  },
  supermanRocks: {
    id: 'supermanRocks', name: 'Superman Rocks', category: 'core', level: 'intermediate', icon: '🦸', time: 20,
    summary: 'Dynamic arch-body drill for kip-up and tumbling tension.',
    cues: ['Keep glutes active', 'Small rocks', 'Long arms and legs', 'Smooth breathing'],
    safety: 'Reduce range if low back pinches.', easier: 'Arch hold.', harder: 'Longer sets.'
  },
  bridgeRocks: {
    id: 'bridgeRocks', name: 'Bridge Rocks', category: 'mobility', level: 'advanced', icon: '🌁', reps: '6–10',
    summary: 'Advanced shoulder and spine mobility for kip-up mechanics.',
    cues: ['Press through hands', 'Move shoulders gently', 'Breathe', 'Keep elbows controlled'],
    safety: 'Skip if back/wrist pain appears.', easier: 'Low bridge hold.', harder: 'Bridge walkouts.'
  },
  coolDown: {
    id: 'coolDown', name: 'Static Cool-Down', category: 'mobility', level: 'beginner', icon: '🧘', time: 120,
    summary: 'Post-workout hamstrings, hip flexors, chest, shoulders and wrists.',
    cues: ['Hold 15–30 seconds', 'Breathe slowly', 'No bouncing', 'Relax gradually'],
    safety: 'Stretch should be mild to moderate, not painful.', easier: 'Shorter holds.', harder: 'Longer relaxed holds.'
  }
};

// Extra skill-specific drills and richer coaching notes. These extend the base app without requiring equipment.
Object.assign(EXERCISES, {
  reverseTabletop: {
    id: 'reverseTabletop', name: 'Reverse Tabletop Hold', category: 'strength', level: 'beginner', icon: '🪑', time: 20,
    summary: 'Shoulder extension, glute drive and support position used before swipes.',
    purpose: 'Builds the start shape for swipes: hands behind the body, chest open, hips lifted and feet pushing the floor.',
    setup: 'Sit with hands behind you, fingers angled slightly out, feet flat and knees bent. Press the palms into the floor and lift the hips.',
    steps: ['Push through the whole hand and keep elbows straight.', 'Lift the chest without shrugging the shoulders.', 'Squeeze glutes until the body makes a strong table shape.', 'Hold, breathe, then lower with control.'],
    feel: 'You should feel triceps, rear shoulders, glutes and upper back working together.',
    mistakes: ['Letting hips drop', 'Shrugging shoulders into the ears', 'Turning wrists into a painful angle'],
    readiness: 'Progress when you can hold 3 sets of 25 seconds with calm breathing and no wrist pain.',
    cues: ['Hands behind hips', 'Chest open', 'Hips high', 'Elbows straight'],
    safety: 'Keep range pain-free. Skip if shoulder extension pinches.', easier: 'Bend knees and keep hips lower.', harder: 'Straight-leg reverse plank.'
  },
  tabletopHipDrive: {
    id: 'tabletopHipDrive', name: 'Tabletop Hip Drive', category: 'power', level: 'beginner', icon: '🌋', reps: '6–10',
    summary: 'Explosive hip extension for swipes and kip-up mechanics.',
    purpose: 'Teaches the body to pop the hips upward from a supported floor position instead of dragging through the movement.',
    setup: 'Start in reverse tabletop with feet grounded and palms behind you.',
    steps: ['Drop the hips slightly without collapsing shoulders.', 'Drive hips up quickly as if trying to make the body light.', 'Pause briefly at the top.', 'Lower softly and reset before the next rep.'],
    feel: 'Glutes should create most of the lift while shoulders stay stable.',
    mistakes: ['Using only the lower back', 'Bending elbows', 'Rushing reps without reaching full hip height'],
    readiness: 'Progress when hip drive is snappy and symmetrical for 3 clean sets.',
    cues: ['Dip small', 'Pop hips', 'Keep palms heavy', 'Reset each rep'],
    safety: 'Use moderate effort at first. No sharp wrist or shoulder pain.', easier: 'Slow tabletop bridges.', harder: 'Add a small foot switch at the top.'
  },
  swipeHalfTurn: {
    id: 'swipeHalfTurn', name: 'Half Swipe Turn', category: 'skill', level: 'intermediate', icon: '🌀', reps: '4 each side',
    summary: 'A controlled 180° swipe pattern before full 360° rotation.',
    purpose: 'Builds the rotational timing of swipes without demanding a full airborne turn.',
    setup: 'Begin in reverse tabletop. Choose a turning direction and clear the space around you.',
    steps: ['Lift the hips and look toward the turning side.', 'Push strongly through the support hand and foot.', 'Let the opposite leg guide the turn.', 'Land in a stable side/tabletop position rather than forcing a full rotation.'],
    feel: 'The movement should feel like hips and legs lead the turn while the arm pushes the floor away.',
    mistakes: ['Dropping hips before turning', 'Throwing the head first', 'Trying to spin faster than control allows'],
    readiness: 'Progress when you can land both sides cleanly with hips still lifted.',
    cues: ['Hips stay high', 'Push floor away', 'Leg leads', 'Land balanced'],
    safety: 'Use a mat and stop if wrists or shoulders feel unstable.', easier: 'Tabletop hip drive.', harder: 'Full swipe entry.'
  },
  swipeEntryDrill: {
    id: 'swipeEntryDrill', name: 'Swipe Entry Drill', category: 'skill', level: 'intermediate', icon: '💫', reps: '3–6 each side',
    summary: 'Entry pattern for connecting table support, push, leg swing and rotation.',
    purpose: 'Links the first half turn to a stronger power-move entry.',
    setup: 'Start from a high reverse tabletop with enough space to rotate.',
    steps: ['Reach the active arm across the body line.', 'Kick the leading leg around in a wide path.', 'Push tall through the grounded arm.', 'Catch the landing softly and reset.'],
    feel: 'You should feel a diagonal whip from shoulder through hip to leg.',
    mistakes: ['Tiny leg path', 'Bent support arm', 'Landing with hips collapsed'],
    readiness: 'Progress when the entry has height, rhythm and consistent direction.',
    cues: ['Reach across', 'Wide kick', 'Straight arm', 'Soft catch'],
    safety: 'Do not attempt when fatigued. Clear furniture and hard objects.', easier: 'Half swipe turn.', harder: 'Full swipe attempt.'
  },
  fullSwipe: {
    id: 'fullSwipe', name: 'Full Swipe Attempt', category: 'skill', level: 'advanced', icon: '🌪️', reps: '2–5',
    summary: 'Advanced breaking power move attempt using a full rotational push.',
    purpose: 'Practices the complete swipe after the athlete has built tabletop strength, hip drive and half-turn control.',
    setup: 'Use a mat or smooth floor, shoes that do not stick, and a clear radius around the body.',
    steps: ['Start high in the hips.', 'Push hard through the support arm and feet.', 'Swing the legs around in a large circular path.', 'Land under control and stop before form breaks.'],
    feel: 'The movement should feel springy and circular, not like a forced twist through the lower back.',
    mistakes: ['Going for many reps too early', 'Letting the hand slip', 'Twisting the knee on landing'],
    readiness: 'Train single quality reps before trying combinations.',
    cues: ['High hips', 'Big circle', 'Push then turn', 'One clean rep'],
    safety: 'Advanced drill. Use mats, stop when dizzy, and avoid if wrist/shoulder pain appears.', easier: 'Swipe entry drill.', harder: 'Consecutive swipes.'
  },
  tripodHeadstand: {
    id: 'tripodHeadstand', name: 'Tripod Headstand Prep', category: 'skill', level: 'intermediate', icon: '🔺', time: 15,
    summary: 'Controlled inverted base used before windmill shoulder and head awareness.',
    purpose: 'Improves comfort upside down while teaching a stable triangle of head and hands.',
    setup: 'Place hands shoulder-width and head lightly on a padded surface, forming a triangle.',
    steps: ['Press palms firmly into the floor.', 'Walk feet closer until hips stack.', 'Lift one knee at a time only if control is present.', 'Come down slowly before fatigue.'],
    feel: 'Most weight should stay in the hands, not crushed into the neck.',
    mistakes: ['Dumping weight into the head', 'Kicking up wildly', 'Holding after neck discomfort'],
    readiness: 'Progress when you can hold a light, controlled tripod for 15–20 seconds.',
    cues: ['Hands heavy', 'Neck long', 'Small lift', 'Slow exit'],
    safety: 'Use thick padding and avoid if you have neck issues. Keep weight through the hands.', easier: 'Crow hold.', harder: 'Tripod knee taps.'
  },
  shoulderRoll: {
    id: 'shoulderRoll', name: 'Shoulder Roll Path', category: 'skill', level: 'beginner', icon: '🎱', reps: '5 each side',
    summary: 'Rolling pattern for windmill entry and safe floor contact.',
    purpose: 'Teaches how to roll diagonally over the shoulder instead of crashing on the spine or neck.',
    setup: 'Kneel on a mat. Tuck one arm slightly and look toward the opposite hip.',
    steps: ['Round the upper back gently.', 'Roll over the back of the shoulder, not the neck.', 'Let the hips follow smoothly.', 'Finish seated or kneeling and repeat both sides.'],
    feel: 'The roll should feel smooth across the shoulder blade area.',
    mistakes: ['Rolling directly over the head', 'Holding breath', 'Slapping the floor with the hip'],
    readiness: 'Progress when rolls are smooth, quiet and pain-free on both sides.',
    cues: ['Shoulder, not neck', 'Round back', 'Smooth path', 'Both sides'],
    safety: 'Use a mat. Stop if neck or collarbone feels pressure.', easier: 'Seated rock backs.', harder: 'Shoulder roll to freeze.'
  },
  babyWindmill: {
    id: 'babyWindmill', name: 'Baby Windmill', category: 'skill', level: 'intermediate', icon: '🌬️', reps: '3 each way',
    summary: 'Low-speed windmill pattern with bent legs before full windmills.',
    purpose: 'Connects shoulder rolling, hip lift and leg timing in a safer partial windmill.',
    setup: 'Use a padded floor. Start from a low freeze or seated side position with legs bent.',
    steps: ['Kick the top leg across the body.', 'Roll through the upper back and shoulder path.', 'Keep hips lifted enough to avoid dragging.', 'Use hands to guide the next position.'],
    feel: 'You should feel momentum from the leg swing, not from forcing the neck.',
    mistakes: ['Legs too narrow', 'Head taking too much pressure', 'Stopping the kick halfway'],
    readiness: 'Progress when you can complete both directions without crashing or neck pressure.',
    cues: ['Wide kick', 'Light head', 'Lift hips', 'Use hands'],
    safety: 'Protect neck and shoulders. Use padding and stop when dizzy.', easier: 'Shoulder roll path.', harder: 'Windmill kick pattern.'
  },
  windmillKickPattern: {
    id: 'windmillKickPattern', name: 'Windmill Kick Pattern', category: 'skill', level: 'advanced', icon: '🦵', reps: '3–5',
    summary: 'Leg swing timing and straddle shape for continuous windmill attempts.',
    purpose: 'Develops the wide-leg whip that keeps a windmill rotating.',
    setup: 'Begin from a supported freeze or upper-back position on a mat.',
    steps: ['Keep legs wide like a V.', 'Kick one leg across as the other follows late.', 'Use the hands briefly to redirect the body.', 'Reset before the head or neck takes pressure.'],
    feel: 'Momentum should come from alternating leg swing and hip height.',
    mistakes: ['Closing the legs', 'Letting hips stay flat', 'Trying to spin without shoulder path'],
    readiness: 'Progress when you can repeat the kick rhythm without losing the V shape.',
    cues: ['Wide V', 'Kick across', 'Hips up', 'Hands redirect'],
    safety: 'Advanced floor power drill. Use mats and avoid neck compression.', easier: 'Baby windmill.', harder: 'Full windmill attempt.'
  },
  fullWindmill: {
    id: 'fullWindmill', name: 'Full Windmill Attempt', category: 'skill', level: 'advanced', icon: '🌪️', reps: '1–3 rotations',
    summary: 'Advanced breaking windmill attempt with continuous circular body motion.',
    purpose: 'Practices linking leg swing, upper-back roll, hand redirection and hip lift.',
    setup: 'Use padded space and stop after low-quality attempts. Film yourself only if the area remains safe.',
    steps: ['Enter with a strong kick and wide legs.', 'Roll across upper back and shoulder path.', 'Keep the head light and hips elevated.', 'Exit safely if speed or shape collapses.'],
    feel: 'The body should circle around the shoulders with the legs creating momentum.',
    mistakes: ['Neck pressure', 'Collapsed straddle', 'Trying too many rotations while tired'],
    readiness: 'Quality single rotations come before continuous windmills.',
    cues: ['Wide legs', 'Light head', 'Keep circling', 'Exit early'],
    safety: 'Advanced. Practice with an experienced coach or breaker when possible.', easier: 'Windmill kick pattern.', harder: 'Linked windmills.'
  },
  bridgeKickover: {
    id: 'bridgeKickover', name: 'Bridge Kickover Prep', category: 'skill', level: 'intermediate', icon: '🌉', reps: '3–6 each leg',
    summary: 'Bridge-to-leg-kick drill for back walkover and back handspring prerequisites.',
    purpose: 'Builds shoulder opening, back-body line and leg drive used before back walkovers.',
    setup: 'Start in a bridge on a mat. Use a raised surface for the feet if needed.',
    steps: ['Push shoulders open over the hands.', 'Shift weight gently toward the hands.', 'Kick one leg upward while the other follows only as control allows.', 'Come down safely or return to bridge.'],
    feel: 'You should feel shoulders opening and legs driving without lower-back pinching.',
    mistakes: ['Bent elbows', 'Trying to kick over without shoulder range', 'Holding breath'],
    readiness: 'Progress when bridge shape is pain-free and kickovers are controlled with assistance.',
    cues: ['Push shoulders', 'Straight arms', 'Kick tall', 'Control exit'],
    safety: 'Use a spotter or raised surface. Avoid if back or wrist pain appears.', easier: 'Low bridge hold.', harder: 'Back walkover snap-down.'
  },
  backWalkoverSnapdown: {
    id: 'backWalkoverSnapdown', name: 'Back Walkover Snap-Down', category: 'skill', level: 'advanced', icon: '↩️', reps: '3–6',
    summary: 'Back walkover finish drill for back handspring snap-down timing.',
    purpose: 'Connects the prerequisite back walkover with a faster leg snap toward landing mechanics.',
    setup: 'Use a mat and qualified supervision. Start only if you already own a safe back walkover path.',
    steps: ['Move through the back walkover slowly into the inverted point.', 'Bring the legs together near vertical.', 'Snap the legs down with a tight core.', 'Land with knees soft and chest controlled.'],
    feel: 'The finish should feel quick from core and hips, not like collapsing out of the bridge.',
    mistakes: ['Throwing head back', 'Landing with locked knees', 'Arching without core tension'],
    readiness: 'Progress when snap-downs are consistent, quiet and supervised.',
    cues: ['Legs together', 'Snap down', 'Ribs in', 'Soft land'],
    safety: 'Advanced tumbling prep. Use a coach/spotter and mats.', easier: 'Bridge kickover prep.', harder: '3-step back handspring drill.'
  },
  bhsThreeStep: {
    id: 'bhsThreeStep', name: 'Back Handspring 3-Step Drill', category: 'skill', level: 'advanced', icon: '3️⃣', reps: '5–10',
    summary: 'Sit, fall and jump timing pattern for back handspring takeoff.',
    purpose: 'Teaches the rhythm of sitting back, allowing controlled backward fall, then driving through the legs and arms.',
    setup: 'Practice on a soft mat or into a safe block setup under supervision.',
    steps: ['Sit the hips back as arms swing.', 'Keep chest controlled instead of throwing the head.', 'Drive through legs and arms together.', 'Stop at the drill version; do not force an unspotted flip.'],
    feel: 'The power should come from legs and arm swing timed together.',
    mistakes: ['Jumping straight up', 'Throwing head back', 'Bending arms before support'],
    readiness: 'Progress only with a qualified spotter and strong prerequisite shapes.',
    cues: ['Sit', 'Fall', 'Jump', 'Arms fast'],
    safety: 'Do not use this to self-teach an unspotted back handspring.', easier: 'Back walkover snap-down.', harder: 'Spotted falling BHS.'
  },
  armSwingSitBack: {
    id: 'armSwingSitBack', name: 'Arm Swing Sit-Back', category: 'power', level: 'intermediate', icon: '🙆', reps: '8–15',
    summary: 'Arm swing rhythm and backward sit mechanics for back handspring preparation.',
    purpose: 'Builds coordination between a fast arm swing and a safe backward sit pattern.',
    setup: 'Stand tall with feet hip-width, clear space behind you, and optionally a wall target behind the hips.',
    steps: ['Swing arms back as hips sit.', 'Keep knees tracking over toes.', 'Swing arms aggressively overhead.', 'Finish tall without jumping backward.'],
    feel: 'Legs load like a jump while arms create timing and confidence.',
    mistakes: ['Knees caving in', 'Arching the lower back', 'Looking back too early'],
    readiness: 'Progress when rhythm is fast and repeatable without fear.',
    cues: ['Sit back', 'Arms whip', 'Chest controlled', 'Finish tall'],
    safety: 'This is a prep drill, not a flip. Keep it grounded.', easier: 'Air squat.', harder: 'BHS 3-step drill with coach.'
  },
  hipDriveBridge: {
    id: 'hipDriveBridge', name: 'Hip-Drive Bridge', category: 'skill', level: 'advanced', icon: '🌁', reps: '4–8',
    summary: 'Bridge entry emphasizing leg drive and shoulder opening for tumbling.',
    purpose: 'Connects bridge mobility to explosive hip and shoulder action.',
    setup: 'Use a mat and supervision. Start with a strong bridge and shoulder mobility.',
    steps: ['Prepare with arms by ears.', 'Drive hips forward/up as hands reach back.', 'Find bridge support with straight arms.', 'Exit safely with control.'],
    feel: 'The drill should feel like hips are rising before hands reach the floor.',
    mistakes: ['Collapsing into the low back', 'Bent arms on contact', 'Going too deep without shoulder range'],
    readiness: 'Progress when bridge entries are controlled and pain-free.',
    cues: ['Hips drive', 'Arms by ears', 'Straight arms', 'Safe exit'],
    safety: 'Advanced mobility/power drill. Use a coach and mat.', easier: 'Bridge kickover prep.', harder: 'Spotted falling BHS.'
  },
  fallingBackHandspring: {
    id: 'fallingBackHandspring', name: 'Spotted Falling BHS', category: 'skill', level: 'advanced', icon: '🛡️', reps: '2–5',
    summary: 'Coach-spotted bridge between drills and a complete back handspring.',
    purpose: 'Introduces flight and hand contact only after prerequisites are consistent.',
    setup: 'Requires qualified spotting, tumbling mats, and a safe training area.',
    steps: ['Review sit-back and arm swing.', 'Spotter supports the hips/back and thigh path.', 'Athlete jumps back with arms by ears.', 'Spotter guides the rotation and landing.'],
    feel: 'The athlete should feel guided, not thrown or forced.',
    mistakes: ['Self-attempting without a spotter', 'Bent arms on the floor', 'Head thrown back'],
    readiness: 'Progression depends on coach approval, not self-rating alone.',
    cues: ['Coach present', 'Arms locked', 'Snap down', 'Land soft'],
    safety: 'Never attempt alone. This app can track prep, but a coach should teach and spot the skill.', easier: 'BHS 3-step drill.', harder: 'Coach-approved full BHS.'
  },
  roundOffSnapdown: {
    id: 'roundOffSnapdown', name: 'Round-Off Snap-Down', category: 'skill', level: 'intermediate', icon: '↪️', reps: '3–6',
    summary: 'Rebound and snap-down pattern often used before round-off back handspring.',
    purpose: 'Builds the fast hand-to-feet snap and rebound used in tumbling connections.',
    setup: 'Use a clear line and mat. Begin from cartwheel or low round-off progressions.',
    steps: ['Place hands in a strong line.', 'Bring legs together at the top.', 'Snap feet down under the body.', 'Rebound lightly with arms by ears.'],
    feel: 'The finish should be quick and springy, not heavy.',
    mistakes: ['Feet landing too far apart', 'No rebound', 'Bent arms on hand contact'],
    readiness: 'Progress when landings are straight, light and consistent.',
    cues: ['Hand line', 'Legs together', 'Snap down', 'Rebound'],
    safety: 'Use mats and avoid high repetitions when wrists fatigue.', easier: 'Cartwheel line drill.', harder: 'Round-off to spotted BHS prep.'
  }
});

const EXERCISE_EXPLANATION_FALLBACK = {
  purpose: 'Develops one of the base qualities needed for gymnastics-style bodyweight skills: strength, control, mobility, power or safe body awareness.',
  setup: 'Choose a clear space, warm up the target joints, and use a mat when the drill involves rolling, inversion or impact.',
  feel: 'The movement should feel controlled and repeatable. Stop before technique turns messy.',
  mistakes: ['Rushing reps', 'Ignoring pain signals', 'Progressing before the easier version is clean'],
  readiness: 'Move to the harder version when all prescribed sets are smooth, pain-free and repeatable across two sessions.'
};

Object.values(EXERCISES).forEach(exercise => {
  exercise.purpose ||= EXERCISE_EXPLANATION_FALLBACK.purpose;
  exercise.setup ||= EXERCISE_EXPLANATION_FALLBACK.setup;
  exercise.steps ||= exercise.cues.map(cue => `${cue}.`);
  exercise.feel ||= EXERCISE_EXPLANATION_FALLBACK.feel;
  exercise.mistakes ||= EXERCISE_EXPLANATION_FALLBACK.mistakes;
  exercise.readiness ||= EXERCISE_EXPLANATION_FALLBACK.readiness;
});

const SKILLS = {
  kipup: {
    title: 'Kip-up', icon: '🥷', level: 'Beginner → Advanced',
    prerequisites: 'Hollow hold 30s, low bridge 15s, pain-free wrists, safe bail practice.',
    steps: [
      { id: 'kipPlow', title: 'Plow position', note: 'Understand the rollback and hip loading.' },
      { id: 'lowBridge', title: 'Low bridge', note: 'Build shoulder, wrist and spine range.' },
      { id: 'kipBail', title: 'Bail practice', note: 'Learn to abandon failed attempts safely.' },
      { id: 'assistedKip', title: 'Assisted kip-up', note: 'Use incline or hand assistance.' },
      { id: 'fullKip', title: 'Full kip-up', note: 'Attempt only when prerequisites are consistent.' }
    ]
  },
  handstand: {
    title: 'Handstand', icon: '🤸', level: 'Beginner → Advanced',
    prerequisites: 'Wrist prep, plank 45s, scapular control, safe wall exit.',
    steps: [
      { id: 'wristRocks', title: 'Wrist conditioning', note: 'Prepare hands and forearms.' },
      { id: 'crowHold', title: 'Crow hold', note: 'Build balance confidence.' },
      { id: 'donkeyKick', title: 'Donkey kick', note: 'Learn controlled inversion.' },
      { id: 'wallHandstand', title: 'Wall handstand', note: 'Develop vertical line and shoulder strength.' },
      { id: 'pikePushup', title: 'Pike push-up', note: 'Build strength for handstand push-up.' }
    ]
  },
  planche: {
    title: 'Planche', icon: '🧲', level: 'Intermediate → Advanced',
    prerequisites: 'Strong push-ups, straight-arm tolerance, pain-free wrists.',
    steps: [
      { id: 'wristRocks', title: 'Wrist prep', note: 'Mandatory before every session.' },
      { id: 'scapPushup', title: 'Scapular push-up', note: 'Learn protraction.' },
      { id: 'hollowHold', title: 'Hollow body', note: 'Posterior pelvic tilt.' },
      { id: 'plancheLean', title: 'Planche lean', note: 'Gradually increase lean.' },
      { id: 'lSit', title: 'Compression hold', note: 'Develop straight-arm and core support.' }
    ]
  },
  frontlever: {
    title: 'Front lever', icon: '🧊', level: 'Intermediate → Advanced',
    prerequisites: 'Secure pulling setup, hollow hold, strong rows.',
    steps: [
      { id: 'hollowHold', title: 'Hollow body', note: 'Line and core compression.' },
      { id: 'tableRow', title: 'Rows', note: 'Build base pulling strength.' },
      { id: 'archHold', title: 'Arch hold', note: 'Balance anterior and posterior chain.' },
      { id: 'frontLeverTuck', title: 'Tuck lever', note: 'Short quality holds only.' },
      { id: 'lSit', title: 'Compression', note: 'Support lever transitions.' }
    ]
  },
  muscleup: {
    title: 'Muscle-up prep', icon: '🪜', level: 'Intermediate → Advanced',
    prerequisites: 'Pulling setup, clean rows/pull-ups, strong dips/push-ups.',
    steps: [
      { id: 'tableRow', title: 'Pulling base', note: 'Rows before explosive pulls.' },
      { id: 'pushup', title: 'Push-up strength', note: 'Build pressing base.' },
      { id: 'hollowHold', title: 'Hollow tension', note: 'Keep body connected.' },
      { id: 'plyoPushup', title: 'Explosive push', note: 'Power phase once ready.' },
      { id: 'lSit', title: 'Transition control', note: 'Core and support position.' }
    ]
  },
  cartwheel: {
    title: 'Cartwheel / round-off', icon: '🛞', level: 'Beginner → Advanced',
    prerequisites: 'Clear space, wrist prep, inversion confidence.',
    steps: [
      { id: 'wristRocks', title: 'Wrist prep', note: 'Hands support body weight.' },
      { id: 'donkeyKick', title: 'Donkey kick', note: 'Beginner inversion drill.' },
      { id: 'cartwheelLine', title: 'Line drill', note: 'Hand-hand-foot-foot pattern.' },
      { id: 'wallHandstand', title: 'Handstand line', note: 'Improve body alignment.' },
      { id: 'squatJump', title: 'Snap power', note: 'Prepare round-off rebound.' }
    ]
  },
  mobility: {
    title: 'Mobility base', icon: '🧘', level: 'All levels',
    prerequisites: 'Consistency and pain-free range.',
    steps: [
      { id: 'jointPrep', title: 'Daily joint flow', note: 'Keep joints prepared.' },
      { id: 'wristRocks', title: 'Wrist rocks', note: 'Support hand skills.' },
      { id: 'pancakeReach', title: 'Pancake reach', note: 'Hips and hamstrings.' },
      { id: 'cossackSquat', title: 'Cossack squat', note: 'Side-to-side hip strength.' },
      { id: 'lowBridge', title: 'Bridge range', note: 'Spine and shoulders.' }
    ]
  }
};

Object.assign(SKILLS, {
  swipes: {
    title: 'Swipes', icon: '🌀', level: 'Intermediate → Advanced', tier: 4,
    requires: ['mobility', 'handstand', 'cartwheel'],
    prerequisites: 'Reverse tabletop 25s, wrist prep, hip drive, cartwheel confidence, no shoulder pain.',
    steps: [
      { id: 'reverseTabletop', title: 'Reverse tabletop base', note: 'Hold the support shape used for swipe entries.' },
      { id: 'tabletopHipDrive', title: 'Hip-drive pop', note: 'Create height before rotation.' },
      { id: 'swipeHalfTurn', title: 'Half swipe turn', note: 'Learn the 180° direction and landing.' },
      { id: 'swipeEntryDrill', title: 'Swipe entry', note: 'Connect hand push, leg swing and turn.' },
      { id: 'fullSwipe', title: 'Full swipe', note: 'Single clean reps before combinations.' }
    ]
  },
  windmill: {
    title: 'Windmill', icon: '🌬️', level: 'Intermediate → Advanced', tier: 4,
    requires: ['mobility', 'handstand', 'cartwheel'],
    prerequisites: 'Shoulder roll path, light tripod/headstand control, wide hip mobility and safe mat space.',
    steps: [
      { id: 'shoulderRoll', title: 'Shoulder roll path', note: 'Roll over the shoulder instead of the neck.' },
      { id: 'tripodHeadstand', title: 'Tripod/headstand prep', note: 'Build upside-down awareness with light head pressure.' },
      { id: 'babyWindmill', title: 'Baby windmill', note: 'Low-speed bent-leg rotation.' },
      { id: 'windmillKickPattern', title: 'Kick pattern', note: 'Maintain a wide V and hip lift.' },
      { id: 'fullWindmill', title: 'Full windmill', note: 'Quality single rotations before continuous windmills.' }
    ]
  },
  backhandspring: {
    title: 'Back Handspring Prep', icon: '↩️', level: 'Advanced / coached', tier: 5,
    requires: ['mobility', 'handstand', 'cartwheel'],
    prerequisites: 'Wall handstand, bridge range, back walkover path, round-off snap-down, mats and qualified spotting.',
    steps: [
      { id: 'bridgeKickover', title: 'Bridge kickover prep', note: 'Build shoulder opening and leg drive.' },
      { id: 'backWalkoverSnapdown', title: 'Back walkover snap-down', note: 'Prerequisite finish and snap timing.' },
      { id: 'armSwingSitBack', title: 'Arm swing sit-back', note: 'Practice the takeoff rhythm without flipping.' },
      { id: 'bhsThreeStep', title: '3-step BHS drill', note: 'Sit, fall and jump pattern under supervision.' },
      { id: 'roundOffSnapdown', title: 'Round-off snap-down', note: 'Prepare rebound and connection mechanics.' },
      { id: 'fallingBackHandspring', title: 'Spotted falling BHS', note: 'Only with coach, spotter and mats.' }
    ]
  }
});

const PLAN_TEMPLATES = {
  beginner: [
    { day: 'Day 1', title: 'Foundation Strength A', focus: ['strength', 'core'], minutes: 24, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 60 }, { id: 'wristRocks', sets: 1, reps: '10 each way' }] },
      { phase: 'Main', items: [{ id: 'airSquat', sets: 3, reps: '10–12', rest: 45 }, { id: 'inclinePushup', sets: 3, reps: '6–10', rest: 60 }, { id: 'tableRow', sets: 3, reps: '6–10', rest: 60 }] },
      { phase: 'Core', items: [{ id: 'hollowHold', sets: 2, time: 20, rest: 30 }, { id: 'plank', sets: 2, time: 30, rest: 30 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 120 }] }
    ]},
    { day: 'Day 2', title: 'Kip-Up Base + Mobility', focus: ['mobility', 'skill'], minutes: 22, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 60 }, { id: 'reverseSnowAngel', sets: 2, reps: '8' }] },
      { phase: 'Skill', items: [{ id: 'kipPlow', sets: 3, reps: '6', rest: 45 }, { id: 'lowBridge', sets: 3, time: 10, rest: 45 }, { id: 'gluteBridge', sets: 2, reps: '12', rest: 45 }] },
      { phase: 'Conditioning', items: [{ id: 'deadBug', sets: 2, reps: '8 each side', rest: 30 }, { id: 'mountainClimber', sets: 2, time: 25, rest: 30 }] },
      { phase: 'Cool-down', items: [{ id: 'pancakeReach', sets: 2, time: 25 }, { id: 'coolDown', sets: 1, time: 90 }] }
    ]},
    { day: 'Day 3', title: 'Foundation Strength B', focus: ['strength', 'power'], minutes: 25, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 60 }, { id: 'bearCrawl', sets: 1, time: 30 }] },
      { phase: 'Main', items: [{ id: 'gluteBridge', sets: 3, reps: '12–15', rest: 45 }, { id: 'airSquat', sets: 3, reps: '12', rest: 45 }, { id: 'scapPushup', sets: 3, reps: '10', rest: 45 }] },
      { phase: 'Power intro', items: [{ id: 'squatJump', sets: 2, reps: '5', rest: 75 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 120 }] }
    ]}
  ],
  intermediate: [
    { day: 'Day 1', title: 'Push + Handstand Line', focus: ['strength', 'skill'], minutes: 32, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 75 }, { id: 'wristRocks', sets: 1, reps: '12 each way' }] },
      { phase: 'Main', items: [{ id: 'pushup', sets: 4, reps: '8–12', rest: 60 }, { id: 'pikePushup', sets: 3, reps: '5–8', rest: 75 }, { id: 'scapPushup', sets: 3, reps: '12', rest: 45 }] },
      { phase: 'Skill', items: [{ id: 'wallHandstand', sets: 3, time: 20, rest: 60 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 150 }] }
    ]},
    { day: 'Day 2', title: 'Leg Power + Kip-Up Drill', focus: ['power', 'skill'], minutes: 31, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 75 }, { id: 'cossackSquat', sets: 1, reps: '5 each side' }] },
      { phase: 'Power', items: [{ id: 'squatJump', sets: 4, reps: '6–8', rest: 90 }, { id: 'splitSquat', sets: 3, reps: '8 each side', rest: 60 }] },
      { phase: 'Skill', items: [{ id: 'kipPlow', sets: 3, reps: '8', rest: 45 }, { id: 'kipBail', sets: 3, reps: '5', rest: 45 }, { id: 'assistedKip', sets: 3, reps: '4', rest: 90 }] },
      { phase: 'Cool-down', items: [{ id: 'pancakeReach', sets: 2, time: 30 }, { id: 'coolDown', sets: 1, time: 90 }] }
    ]},
    { day: 'Day 3', title: 'Pull + Core Control', focus: ['strength', 'core'], minutes: 29, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 60 }, { id: 'bearCrawl', sets: 2, time: 25, rest: 30 }] },
      { phase: 'Main', items: [{ id: 'tableRow', sets: 4, reps: '8–12', rest: 60 }, { id: 'hollowHold', sets: 3, time: 30, rest: 45 }, { id: 'archHold', sets: 3, time: 25, rest: 45 }] },
      { phase: 'Core', items: [{ id: 'lSit', sets: 3, time: 10, rest: 45 }, { id: 'mountainClimber', sets: 2, time: 30, rest: 30 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 120 }] }
    ]},
    { day: 'Day 4', title: 'Skill Flow + Mobility', focus: ['skill', 'mobility'], minutes: 28, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 75 }, { id: 'wristRocks', sets: 1, reps: '10 each way' }] },
      { phase: 'Skill', items: [{ id: 'crowHold', sets: 3, time: 15, rest: 45 }, { id: 'donkeyKick', sets: 3, reps: '8', rest: 45 }, { id: 'cartwheelLine', sets: 3, reps: '5 each side', rest: 60 }] },
      { phase: 'Mobility', items: [{ id: 'lowBridge', sets: 3, time: 15, rest: 45 }, { id: 'cossackSquat', sets: 2, reps: '5 each side', rest: 30 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 120 }] }
    ]}
  ],
  advanced: [
    { day: 'Day 1', title: 'Advanced Push Power', focus: ['strength', 'power'], minutes: 40, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 90 }, { id: 'wristRocks', sets: 1, reps: '12 each way' }] },
      { phase: 'Strength', items: [{ id: 'pikePushup', sets: 4, reps: '6–10', rest: 90 }, { id: 'plancheLean', sets: 4, time: 12, rest: 75 }, { id: 'pushup', sets: 3, reps: '12–15', rest: 60 }] },
      { phase: 'Power', items: [{ id: 'plyoPushup', sets: 4, reps: '3–6', rest: 120 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 150 }] }
    ]},
    { day: 'Day 2', title: 'Leg Power + Kip-Up Attempts', focus: ['power', 'skill'], minutes: 42, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 90 }, { id: 'cossackSquat', sets: 2, reps: '5 each side' }] },
      { phase: 'Power', items: [{ id: 'squatJump', sets: 3, reps: '8', rest: 90 }, { id: 'tuckJump', sets: 4, reps: '5', rest: 120 }, { id: 'shrimpSquat', sets: 3, reps: '4 each side', rest: 90 }] },
      { phase: 'Skill', items: [{ id: 'kipBail', sets: 2, reps: '5', rest: 45 }, { id: 'assistedKip', sets: 3, reps: '5', rest: 90 }, { id: 'fullKip', sets: 4, reps: '3', rest: 120 }] },
      { phase: 'Cool-down', items: [{ id: 'pancakeReach', sets: 2, time: 30 }, { id: 'coolDown', sets: 1, time: 120 }] }
    ]},
    { day: 'Day 3', title: 'Pull + Lever Base', focus: ['strength', 'core'], minutes: 38, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 75 }, { id: 'bearCrawl', sets: 2, time: 30, rest: 30 }] },
      { phase: 'Strength', items: [{ id: 'tableRow', sets: 5, reps: '8–12', rest: 75 }, { id: 'frontLeverTuck', sets: 5, time: 8, rest: 90 }, { id: 'lSit', sets: 4, time: 15, rest: 60 }] },
      { phase: 'Bodyline', items: [{ id: 'hollowHold', sets: 3, time: 35, rest: 45 }, { id: 'supermanRocks', sets: 3, time: 20, rest: 45 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 120 }] }
    ]},
    { day: 'Day 4', title: 'Handstand + Acro Flow', focus: ['skill', 'mobility'], minutes: 36, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 75 }, { id: 'wristRocks', sets: 1, reps: '12 each way' }] },
      { phase: 'Skill', items: [{ id: 'wallHandstand', sets: 5, time: 25, rest: 75 }, { id: 'cartwheelLine', sets: 4, reps: '5 each side', rest: 60 }, { id: 'donkeyKick', sets: 3, reps: '10', rest: 45 }] },
      { phase: 'Mobility', items: [{ id: 'bridgeRocks', sets: 3, reps: '6', rest: 60 }, { id: 'pancakeReach', sets: 2, time: 35 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 120 }] }
    ]},
    { day: 'Day 5', title: 'Power Density + Deload Option', focus: ['power', 'conditioning'], minutes: 34, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 75 }, { id: 'bearCrawl', sets: 1, time: 35 }] },
      { phase: 'Main', items: [{ id: 'plyoPushup', sets: 3, reps: '4', rest: 120 }, { id: 'tuckJump', sets: 3, reps: '5', rest: 120 }, { id: 'mountainClimber', sets: 3, time: 35, rest: 45 }] },
      { phase: 'Core', items: [{ id: 'hollowHold', sets: 3, time: 30, rest: 45 }, { id: 'archHold', sets: 3, time: 30, rest: 45 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 150 }] }
    ]}
  ]
};

const SUPPLEMENTAL_WORKOUTS = {
  beginner: [
    { day: 'Day 4', title: 'Beginner Skill Flow', focus: ['skill', 'mobility'], minutes: 23, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 60 }, { id: 'wristRocks', sets: 1, reps: '10 each way' }] },
      { phase: 'Skill', items: [{ id: 'crowHold', sets: 2, time: 10, rest: 45 }, { id: 'donkeyKick', sets: 3, reps: '5', rest: 45 }, { id: 'cartwheelLine', sets: 2, reps: '4 each side', rest: 60 }] },
      { phase: 'Mobility', items: [{ id: 'lowBridge', sets: 2, time: 12, rest: 45 }, { id: 'pancakeReach', sets: 2, time: 25 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 90 }] }
    ]},
    { day: 'Day 5', title: 'Beginner Power + Core', focus: ['power', 'core'], minutes: 24, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 60 }, { id: 'bearCrawl', sets: 1, time: 25 }] },
      { phase: 'Power', items: [{ id: 'squatJump', sets: 2, reps: '4–6', rest: 75 }, { id: 'hipDriveBridge', sets: 2, reps: '8', rest: 45 }] },
      { phase: 'Core', items: [{ id: 'hollowHold', sets: 2, time: 20, rest: 30 }, { id: 'archHold', sets: 2, time: 20, rest: 30 }, { id: 'deadBug', sets: 2, reps: '8 each side', rest: 30 }] },
      { phase: 'Cool-down', items: [{ id: 'coolDown', sets: 1, time: 120 }] }
    ]}
  ],
  intermediate: [
    { day: 'Day 5', title: 'Power Move Accessory Day', focus: ['power', 'skill', 'mobility'], minutes: 30, blocks: [
      { phase: 'Warm-up', items: [{ id: 'jointPrep', sets: 1, time: 75 }, { id: 'wristRocks', sets: 1, reps: '12 each way' }] },
      { phase: 'Skill', items: [{ id: 'reverseTabletop', sets: 3, time: 20, rest: 45 }, { id: 'shoulderRoll', sets: 3, reps: '4 each side', rest: 45 }, { id: 'roundOffSnapdown', sets: 2, reps: '3', rest: 75 }] },
      { phase: 'Power', items: [{ id: 'tuckJump', sets: 3, reps: '4–5', rest: 90 }, { id: 'plyoPushup', sets: 2, reps: '3–5', rest: 120 }] },
      { phase: 'Cool-down', items: [{ id: 'pancakeReach', sets: 2, time: 30 }, { id: 'coolDown', sets: 1, time: 120 }] }
    ]}
  ],
  advanced: []
};

const GOAL_PROGRESSIONS = {
  swipes: {
    titles: ['Swipe Base: Table + Hips', 'Swipe Rotation: Half Turns', 'Swipe Power: Entry + Full Reps'],
    stages: [
      [{ id: 'reverseTabletop', sets: 3, time: 20, rest: 45 }, { id: 'tabletopHipDrive', sets: 3, reps: '6–8', rest: 60 }, { id: 'wristRocks', sets: 1, reps: '10 each way' }],
      [{ id: 'reverseTabletop', sets: 2, time: 25, rest: 45 }, { id: 'swipeHalfTurn', sets: 3, reps: '4 each side', rest: 75 }, { id: 'tabletopHipDrive', sets: 3, reps: '8', rest: 60 }],
      [{ id: 'swipeEntryDrill', sets: 4, reps: '3 each side', rest: 90 }, { id: 'fullSwipe', sets: 3, reps: '2–3', rest: 120 }, { id: 'pancakeReach', sets: 2, time: 30 }]
    ]
  },
  windmill: {
    titles: ['Windmill Base: Rolls + Head Control', 'Windmill Build: Baby Windmills', 'Windmill Power: Kick Pattern'],
    stages: [
      [{ id: 'shoulderRoll', sets: 3, reps: '5 each side', rest: 45 }, { id: 'tripodHeadstand', sets: 3, time: 10, rest: 60 }, { id: 'pancakeReach', sets: 2, time: 30 }],
      [{ id: 'babyWindmill', sets: 4, reps: '3 each way', rest: 90 }, { id: 'shoulderRoll', sets: 2, reps: '4 each side', rest: 45 }, { id: 'cossackSquat', sets: 2, reps: '5 each side' }],
      [{ id: 'windmillKickPattern', sets: 4, reps: '3–5', rest: 120 }, { id: 'babyWindmill', sets: 3, reps: '3 each way', rest: 90 }, { id: 'fullWindmill', sets: 2, reps: '1–2 rotations', rest: 150 }]
    ]
  },
  backhandspring: {
    titles: ['BHS Base: Bridge + Snap', 'BHS Build: Sit-Back Rhythm', 'BHS Coached: Spotted Entries'],
    stages: [
      [{ id: 'bridgeKickover', sets: 3, reps: '3–5 each leg', rest: 75 }, { id: 'wallHandstand', sets: 3, time: 20, rest: 60 }, { id: 'roundOffSnapdown', sets: 2, reps: '3', rest: 75 }],
      [{ id: 'backWalkoverSnapdown', sets: 3, reps: '3–5', rest: 90 }, { id: 'armSwingSitBack', sets: 3, reps: '10', rest: 60 }, { id: 'bhsThreeStep', sets: 3, reps: '5', rest: 90 }],
      [{ id: 'armSwingSitBack', sets: 3, reps: '12', rest: 60 }, { id: 'bhsThreeStep', sets: 4, reps: '5', rest: 90 }, { id: 'fallingBackHandspring', sets: 2, reps: '2–4', rest: 150 }]
    ],
    warning: 'Back handspring drills beyond preparation require a qualified coach/spotter and mats.'
  }
};

function getPlanStage() {
  if (state.profile.level === 'beginner') return 0;
  if (state.profile.level === 'advanced') return Math.min(2, Math.floor((state.currentWeek - 1) / 4) + 1);
  return Math.min(2, Math.floor((state.currentWeek - 1) / 4));
}

const BADGES = [
  { id: 'firstWorkout', title: 'First Session', icon: '✅', rule: s => s.logs.length >= 1, desc: 'Complete one workout.' },
  { id: 'threeSessions', title: 'Training Habit', icon: '🔥', rule: s => s.logs.length >= 3, desc: 'Complete three workouts.' },
  { id: 'tenSessions', title: 'Base Built', icon: '🏗️', rule: s => s.logs.length >= 10, desc: 'Complete ten workouts.' },
  { id: 'kipStudent', title: 'Kip-Up Student', icon: '🌊', rule: s => getCompletedSkillSteps(s, 'kipup') >= 2, desc: 'Complete two kip-up steps.' },
  { id: 'handBalance', title: 'Hand Balance', icon: '🤸', rule: s => getCompletedSkillSteps(s, 'handstand') >= 3, desc: 'Complete three handstand steps.' },
  { id: 'mobilityBase', title: 'Mobile Base', icon: '🧘', rule: s => countLogsByFocus(s, 'mobility') >= 3, desc: 'Complete three mobility sessions.' },
  { id: 'powerBuilder', title: 'Power Builder', icon: '⚡', rule: s => countLogsByFocus(s, 'power') >= 3, desc: 'Complete three power sessions.' },
  { id: 'weekTwo', title: 'Week Two', icon: '📆', rule: s => s.currentWeek >= 2, desc: 'Advance beyond week one.' },
  { id: 'swipePath', title: 'Swipe Path', icon: '🌀', rule: s => getCompletedSkillSteps(s, 'swipes') >= 2, desc: 'Complete two swipe steps.' },
  { id: 'windmillPath', title: 'Windmill Path', icon: '🌬️', rule: s => getCompletedSkillSteps(s, 'windmill') >= 2, desc: 'Complete two windmill steps.' },
  { id: 'bhsPrep', title: 'BHS Prep', icon: '↩️', rule: s => getCompletedSkillSteps(s, 'backhandspring') >= 2, desc: 'Complete two back handspring prep steps.' }
];

const defaultState = {
  version: APP_VERSION,
  planSeed: 0,
  profile: { name: 'Athlete', level: 'beginner', goal: 'kipup', days: 3, session: 30, volume: 'normal' },
  currentWeek: 1,
  plan: [],
  logs: [],
  completedSkills: {},
  settings: { sound: false, reducedMotion: false, safety: true, autoAdvance: true },
  activeWorkoutId: null
};

let state = loadState();
let player = { workout: null, flat: [], index: 0, set: 1, timer: null, timerLeft: 0, mode: 'idle', pendingAdvance: false };
let deferredInstallPrompt = null;

function loadState() {
  try {
    const saved = readSavedState();
    if (!saved) return structuredClone(defaultState);
    return {
      ...structuredClone(defaultState),
      ...saved,
      version: APP_VERSION,
      profile: { ...defaultState.profile, ...(saved.profile || {}) },
      completedSkills: { ...defaultState.completedSkills, ...(saved.completedSkills || {}) },
      settings: { ...defaultState.settings, ...(saved.settings || {}) }
    };
  } catch (error) {
    console.warn('Could not load saved state', error);
    return structuredClone(defaultState);
  }
}

function readSavedState() {
  const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of keys) {
    const raw = safeLocalStorageGet(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (error) {
      console.warn(`Could not parse saved data from ${key}`, error);
    }
  }
  return readCookieState();
}

function safeLocalStorageGet(key) {
  try { return localStorage.getItem(key); }
  catch (error) { console.warn('Local storage read failed', error); return null; }
}

function safeLocalStorageSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (error) { console.warn('Local storage save failed; cookie fallback will be used if available.', error); return false; }
}

function saveState() {
  const payload = JSON.stringify(state);
  safeLocalStorageSet(STORAGE_KEY, payload);
  writeCookieState(payload);
}

function getCookie(name) {
  try {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')
      .slice(1)
      .join('=') || '';
  } catch (error) {
    return '';
  }
}

function setCookie(name, value, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (error) {
    // file:// cookies are inconsistent across browsers; localStorage remains the primary local mode.
  }
}

function clearCookie(name) {
  try { document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`; }
  catch (error) {}
}

function writeCookieState(payload) {
  try {
    const encoded = encodeURIComponent(payload);
    const chunks = encoded.match(new RegExp(`.{1,${COOKIE_CHUNK_SIZE}}`, 'g')) || [];
    if (!chunks.length || chunks.length > COOKIE_CHUNK_LIMIT) return;
    for (let i = 0; i < COOKIE_CHUNK_LIMIT; i += 1) clearCookie(`${COOKIE_KEY}.${i}`);
    chunks.forEach((chunk, index) => setCookie(`${COOKIE_KEY}.${index}`, chunk));
    setCookie(`${COOKIE_KEY}.chunks`, String(chunks.length));
  } catch (error) {
    console.warn('Cookie backup skipped', error);
  }
}

function readCookieState() {
  try {
    const count = Number(decodeURIComponent(getCookie(`${COOKIE_KEY}.chunks`) || '0'));
    if (!count) return null;
    let encoded = '';
    for (let i = 0; i < count; i += 1) encoded += getCookie(`${COOKIE_KEY}.${i}`);
    if (!encoded) return null;
    const parsed = JSON.parse(decodeURIComponent(encoded));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.warn('Could not parse cookie backup', error);
    return null;
  }
}

function structuredClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

function readProfileFromForm() {
  const form = $('#profileForm');
  if (!form) return state.profile;
  return {
    name: $('#athleteName').value.trim() || 'Athlete',
    level: $('#levelSelect').value,
    goal: $('#goalSelect').value,
    days: Number($('#daysSelect').value),
    session: Number($('#sessionSelect').value),
    volume: $('#volumeSelect').value
  };
}

function buildPlan(options = {}) {
  if (options.useCurrentForm) state.profile = readProfileFromForm();
  if (options.forceFresh) state.planSeed = (state.planSeed || 0) + 1;
  state.version = APP_VERSION;
  const base = PLAN_TEMPLATES[state.profile.level] || PLAN_TEMPLATES.beginner;
  const targetDays = clamp(Number(state.profile.days) || base.length, 1, 5);
  state.profile.days = targetDays;
  let pool = rotateWorkouts(buildWorkoutPool(base, state.profile.level, targetDays), state.planSeed || 0);
  let workouts = pool.slice(0, targetDays).map((workout, index) => enrichWorkout(workout, index));
  const goal = state.profile.goal;
  workouts = applyGoalProgression(workouts, goal);
  workouts = prioritizeGoal(workouts, goal);
  workouts = fitSessionLength(workouts, Number(state.profile.session) || 30);
  if (state.profile.volume === 'low') workouts = scalePlan(workouts, 0.75);
  if (state.profile.volume === 'high') workouts = scalePlan(workouts, 1.15);
  if (state.currentWeek % 4 === 0) workouts = scalePlan(workouts, 0.7, true);
  state.plan = workouts;
  state.activeWorkoutId = workouts[0]?.id || null;
  saveState();
}


function buildWorkoutPool(base, level, targetDays) {
  const pool = structuredClone(base);
  const extras = structuredClone(SUPPLEMENTAL_WORKOUTS[level] || []);
  for (const workout of extras) {
    if (pool.length >= targetDays) break;
    pool.push(workout);
  }
  let fallbackIndex = 0;
  while (pool.length < targetDays && base.length) {
    const clone = structuredClone(base[fallbackIndex % base.length]);
    clone.title = `${clone.title} · Variation ${Math.floor(fallbackIndex / base.length) + 2}`;
    clone.focus = Array.from(new Set([...(clone.focus || []), 'accessory']));
    clone.blocks = clone.blocks.map(block => ({
      ...block,
      items: block.items.slice().reverse()
    }));
    pool.push(clone);
    fallbackIndex += 1;
  }
  return pool;
}

function rotateWorkouts(workouts, seed) {
  const copy = structuredClone(workouts);
  if (copy.length <= 1) return copy;
  const offset = seed % copy.length;
  return [...copy.slice(offset), ...copy.slice(0, offset)];
}

function enrichWorkout(workout, index) {
  const copy = structuredClone(workout);
  copy.day = `Day ${index + 1}`;
  copy.id = `${state.profile.level}-${state.currentWeek}-${state.planSeed || 0}-${index + 1}-${copy.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  copy.week = state.currentWeek;
  copy.completed = isWorkoutDone(copy.title, state.currentWeek);
  return copy;
}

function applyGoalProgression(workouts, goal) {
  const progression = GOAL_PROGRESSIONS[goal];
  if (!progression || !workouts.length) return workouts;
  const stage = getPlanStage();
  const target = workouts.find(w => w.focus.includes('skill')) || workouts[Math.min(1, workouts.length - 1)] || workouts[0];
  let skillBlock = target.blocks.find(block => block.phase.toLowerCase().includes('skill'));
  if (!skillBlock) {
    skillBlock = { phase: 'Skill progression', items: [] };
    target.blocks.splice(Math.min(2, target.blocks.length), 0, skillBlock);
  }
  const stagedItems = structuredClone(progression.stages[stage] || progression.stages[0]);
  const existingIds = new Set(skillBlock.items.map(item => item.id));
  stagedItems.forEach(item => {
    if (!existingIds.has(item.id)) skillBlock.items.unshift(item);
  });
  target.title = progression.titles[stage] || target.title;
  target.focus = Array.from(new Set([...(target.focus || []), 'skill']));
  target.goalWarning = progression.warning || '';
  target.minutes = Math.max(target.minutes, Math.min(Number(state.profile.session) || target.minutes, target.minutes + 8));
  return workouts;
}

function prioritizeGoal(workouts, goal) {
  const skill = SKILLS[goal];
  if (!skill || goal === 'mobility') return workouts;
  const skillDrills = skill.steps.slice(0, state.profile.level === 'advanced' ? 5 : 3).map(step => step.id);
  const target = workouts.find(w => w.focus.includes('skill')) || workouts[1] || workouts[0];
  if (!target) return workouts;
  const skillBlock = target.blocks.find(b => b.phase.toLowerCase().includes('skill')) || target.blocks[1];
  const existingIds = new Set(skillBlock.items.map(item => item.id));
  skillDrills.forEach(id => {
    if (!existingIds.has(id)) skillBlock.items.push({ id, sets: state.profile.level === 'advanced' ? 3 : 2, reps: EXERCISES[id]?.reps || undefined, time: EXERCISES[id]?.time ? Math.min(EXERCISES[id].time, 30) : undefined, rest: 60 });
  });
  target.title = target.title.includes(skill.title) ? target.title : `${target.title} + ${skill.title}`;
  if (!target.focus.includes('skill')) target.focus.push('skill');
  return workouts;
}

function fitSessionLength(workouts, minutes) {
  if (!minutes) return workouts;
  return workouts.map(workout => {
    const copy = structuredClone(workout);
    copy.minutes = Math.min(copy.minutes, minutes + 6);
    if (minutes <= 20) {
      copy.blocks.forEach(block => {
        block.items = block.items.slice(0, block.phase.toLowerCase().includes('cool') ? 1 : 2);
      });
    }
    if (minutes >= 45 && copy.blocks[0]) {
      copy.blocks[0].items.push({ id: 'jointPrep', sets: 1, time: 45 });
    }
    return copy;
  });
}

function scalePlan(workouts, factor, deload = false) {
  return workouts.map(workout => {
    const copy = structuredClone(workout);
    copy.blocks.forEach(block => {
      block.items.forEach(item => {
        if (item.sets) item.sets = Math.max(1, Math.round(item.sets * factor));
        if (item.time && factor < 1) item.time = Math.max(10, Math.round(item.time * factor));
      });
    });
    if (deload) copy.title = `${copy.title} · Deload`;
    return copy;
  });
}

function isWorkoutDone(title, week) {
  return state.logs.some(log => log.week === week && log.title.replace(' · Deload', '') === title.replace(' · Deload', ''));
}

function init() {
  if (!state.plan.length || state.plan.length !== Number(state.profile.days || 0)) {
    buildPlan({ forceFresh: true });
  }
  bindEvents();
  fillProfileForm();
  applySettings();
  renderAll();
  enableManifestWhenHosted();
  registerServiceWorker();
}

function bindEvents() {
  $$('#navList .nav-item').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  $$('[data-go]').forEach(button => button.addEventListener('click', () => showView(button.dataset.go)));
  $('#menuToggle').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
  $('#quickWorkoutBtn').addEventListener('click', startTodayWorkout);
  $('#regeneratePlanBtn').addEventListener('click', () => { buildPlan({ useCurrentForm: true, forceFresh: true }); fillProfileForm(); renderAll(); toast('Fresh plan generated.'); });
  $('#advanceWeekBtn').addEventListener('click', () => { state.currentWeek += 1; buildPlan({ useCurrentForm: true, forceFresh: true }); fillProfileForm(); renderAll(); toast(`Week ${state.currentWeek} generated.`); });
  $('#profileForm').addEventListener('submit', onProfileSubmit);
  $('#workoutSelect').addEventListener('change', e => startWorkout(e.target.value));
  $('#librarySearch').addEventListener('input', renderLibrary);
  $('#libraryFilter').addEventListener('change', renderLibrary);
  $('#exportDataBtn').addEventListener('click', exportData);
  $('#resetDataBtn').addEventListener('click', resetData);
  $('#soundToggle').addEventListener('change', e => { state.settings.sound = e.target.checked; saveState(); });
  $('#motionToggle').addEventListener('change', e => { state.settings.reducedMotion = e.target.checked; applySettings(); saveState(); });
  $('#safetyToggle').addEventListener('change', e => { state.settings.safety = e.target.checked; saveState(); });
  $('#autoAdvanceToggle')?.addEventListener('change', e => { state.settings.autoAdvance = e.target.checked; saveState(); });
  $('#installBtn').addEventListener('click', installApp);
  if (IS_HOSTED_APP) {
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      $('#installBtn').hidden = false;
    });
  }
}

function showView(viewId) {
  $$('.view').forEach(view => view.classList.toggle('active', view.id === viewId));
  $$('#navList .nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === viewId));
  $('#viewTitle').textContent = viewId.charAt(0).toUpperCase() + viewId.slice(1);
  $('.sidebar').classList.remove('open');
  if (viewId === 'workout' && !player.workout) renderWorkoutPlayer();
}

function fillProfileForm() {
  $('#athleteName').value = state.profile.name;
  $('#levelSelect').value = state.profile.level;
  $('#goalSelect').value = state.profile.goal;
  $('#daysSelect').value = String(state.profile.days);
  $('#sessionSelect').value = String(state.profile.session);
  $('#volumeSelect').value = state.profile.volume;
  $('#soundToggle').checked = state.settings.sound;
  $('#motionToggle').checked = state.settings.reducedMotion;
  $('#safetyToggle').checked = state.settings.safety;
  if ($('#autoAdvanceToggle')) $('#autoAdvanceToggle').checked = state.settings.autoAdvance !== false;
}

function onProfileSubmit(event) {
  event.preventDefault();
  buildPlan({ useCurrentForm: true, forceFresh: true });
  fillProfileForm();
  renderAll();
  showView('dashboard');
  toast('New plan generated from your current choices.');
}

function applySettings() {
  document.body.classList.toggle('reduce-motion', !!state.settings.reducedMotion);
}

function renderAll() {
  renderStats();
  renderTodayWorkout();
  renderWeekPlan();
  renderPlanSchedule();
  renderWorkoutSelect();
  renderSkills();
  renderLibrary();
  renderProgress();
  $('#weekPill').textContent = `Week ${state.currentWeek}`;
}

function renderStats() {
  const logs = state.logs;
  const completedThisWeek = logs.filter(log => log.week === state.currentWeek).length;
  const streak = calculateStreak(logs);
  const totalMinutes = logs.reduce((sum, log) => sum + Number(log.minutes || 0), 0);
  const unlocked = BADGES.filter(badge => badge.rule(state)).length;
  $('#statsGrid').innerHTML = [
    { label: 'sessions done', value: logs.length },
    { label: 'this week', value: `${completedThisWeek}/${state.plan.length}` },
    { label: 'day streak', value: streak },
    { label: 'badges', value: `${unlocked}/${BADGES.length}` }
  ].map(stat => `<article class="stat-card"><strong>${stat.value}</strong><span>${stat.label}</span></article>`).join('') +
  `<article class="stat-card"><strong>${totalMinutes}</strong><span>minutes trained</span></article>`;
}

function renderTodayWorkout() {
  const next = getNextWorkout();
  if (!next) {
    $('#todayWorkout').innerHTML = `<div class="workout-card"><h4>All workouts completed</h4><p class="exercise-details">Advance to the next week or refresh your plan.</p><button class="primary-btn" onclick="advanceWeekFromButton()">Generate next week</button></div>`;
    return;
  }
  $('#todayWorkout').innerHTML = workoutCardHTML(next, true);
}

function renderWeekPlan() {
  $('#weekPlan').innerHTML = state.plan.map((workout, index) => dayCardHTML(workout, index)).join('');
}

function renderPlanSchedule() {
  $('#planSchedule').innerHTML = state.plan.map((workout, index) => dayCardHTML(workout, index, true)).join('');
}

function workoutCardHTML(workout, includeStart) {
  const exercises = workout.blocks.flatMap(block => block.items).length;
  return `<article class="workout-card">
    <div>
      <h4>${workout.title}</h4>
      <div class="meta-row">
        <span class="tag">${workout.minutes} min</span>
        <span class="tag">${exercises} drills</span>
        ${workout.focus.map(f => `<span class="tag">${f}</span>`).join('')}
      </div>
    </div>
    <p class="exercise-details">${describeWorkout(workout)}</p>${workout.goalWarning ? `<p class="warning-note">⚠️ ${workout.goalWarning}</p>` : ''}
    ${includeStart ? `<button class="primary-btn" onclick="startWorkout('${workout.id}')">Start workout</button>` : ''}
  </article>`;
}

function dayCardHTML(workout, index, verbose = false) {
  return `<article class="day-card ${workout.completed ? 'completed' : ''}">
    <div class="day-dot">${index + 1}</div>
    <div>
      <h4>${workout.day}: ${workout.title}</h4>
      <small>${workout.minutes} min • ${workout.focus.join(' / ')}${verbose ? ` • ${workout.blocks.length} blocks` : ''}</small>
    </div>
    <button class="${workout.completed ? 'secondary-btn' : 'ghost-btn'}" onclick="startWorkout('${workout.id}')">${workout.completed ? 'Repeat' : 'Start'}</button>
  </article>`;
}

function describeWorkout(workout) {
  const phases = workout.blocks.map(block => block.phase).join(', ');
  const keyExercises = workout.blocks.flatMap(block => block.items).slice(0, 4).map(item => EXERCISES[item.id]?.name).filter(Boolean).join(', ');
  return `${phases}. Includes ${keyExercises}${keyExercises ? '.' : ''}`;
}

function getNextWorkout() {
  return state.plan.find(workout => !workout.completed) || state.plan[0];
}

function renderWorkoutSelect() {
  $('#workoutSelect').innerHTML = state.plan.map(workout => `<option value="${workout.id}" ${state.activeWorkoutId === workout.id ? 'selected' : ''}>${workout.day}: ${workout.title}</option>`).join('');
}

function startTodayWorkout() {
  const next = getNextWorkout();
  if (next) startWorkout(next.id);
}

function startWorkout(workoutId) {
  const workout = state.plan.find(item => item.id === workoutId) || getNextWorkout();
  if (!workout) return;
  state.activeWorkoutId = workout.id;
  player = { workout, flat: flattenWorkout(workout), index: 0, set: 1, timer: null, timerLeft: 0, mode: 'idle', pendingAdvance: false };
  clearPlayerTimer();
  saveState();
  renderWorkoutSelect();
  renderWorkoutPlayer();
  showView('workout');
}

function flattenWorkout(workout) {
  return workout.blocks.flatMap(block => block.items.map(item => ({ ...item, phase: block.phase, exercise: EXERCISES[item.id] })).filter(item => item.exercise));
}

function getDetailedSteps(exercise) {
  const baseSteps = Array.isArray(exercise.steps) ? exercise.steps : [];
  const keyCue = Array.isArray(exercise.cues) && exercise.cues.length ? exercise.cues[0] : 'Keep clean alignment';
  const prescription = exercise.time ? `Hold or move for the prescribed time (${exercise.time}s when used as the default).` : `Complete the prescribed repetitions (${exercise.reps || 'use the workout target'}).`;
  const categoryTip = {
    mobility: 'Move slowly and stay inside a comfortable range. Mobility work should open the area, not irritate it.',
    strength: 'Use controlled tempo. Do not bounce, twist, or shorten the range just to finish the set.',
    power: 'Reset between reps. Power drills should feel explosive and crisp, not like tired cardio.',
    skill: 'Treat this as practice. Stop the set when coordination becomes messy, even if reps remain.',
    core: 'Keep the trunk position honest. The set ends when the lower back or ribs lose control.'
  }[exercise.category] || 'Keep the movement controlled and repeatable.';
  const scaffold = [
    `Read the target first: ${prescription}`,
    `Prepare the space and body: ${exercise.setup}`,
    `Start position: set your hands, feet, hips and shoulders before moving. Your first checkpoint is: ${keyCue}.`,
    `Begin slowly for the first repetition or first 5 seconds so you can confirm balance and joint comfort.`,
    ...baseSteps,
    `During the working part, focus on these cues in order: ${(exercise.cues || []).join(' → ')}.`,
    categoryTip,
    `Finish each repetition or hold by returning to a stable position before starting the next one.`,
    `Scale immediately if form breaks: easier option is ${exercise.easier}; harder option is ${exercise.harder}.`,
    `Progress only when the readiness check is met: ${exercise.readiness}`
  ];
  const cleaned = [];
  const seen = new Set();
  for (const step of scaffold) {
    const text = String(step || '').trim().replace(/\s+/g, ' ');
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(text.endsWith('.') || text.endsWith('?') || text.endsWith('!') ? text : `${text}.`);
  }
  return cleaned;
}

function renderInstructionCard(exercise, item) {
  const steps = getDetailedSteps(exercise);
  return `<aside class="instruction-card" aria-label="Step-by-step instructions for ${escapeAttr(exercise.name)}">
    <div class="instruction-icon">${exercise.icon}</div>
    <div>
      <p class="eyebrow">No video mode</p>
      <h4>Step-by-step guide</h4>
      <p>Use these written checkpoints while you train. The app no longer loads videos or embedded media.</p>
    </div>
    <ol class="instruction-steps compact">${steps.slice(0, 6).map((step, index) => `<li><span>${index + 1}</span>${escapeHTML(step)}</li>`).join('')}</ol>
  </aside>`;
}

function renderWorkoutDetails(exercise) {

  const steps = getDetailedSteps(exercise);
  return `<details class="workout-detail" open>
    <summary>How to do this exercise</summary>
    <div class="workout-detail-grid">
      <section><strong>1. Purpose</strong><p>${escapeHTML(exercise.purpose)}</p></section>
      <section><strong>2. Setup before starting</strong><p>${escapeHTML(exercise.setup)}</p></section>
      <section><strong>3. Step-by-step execution</strong><ol>${steps.map(step => `<li>${escapeHTML(step)}</li>`).join('')}</ol></section>
      <section><strong>4. Body feeling</strong><p>${escapeHTML(exercise.feel)}</p></section>
      <section><strong>5. Common mistakes to avoid</strong><ul>${exercise.mistakes.map(mistake => `<li>${escapeHTML(mistake)}</li>`).join('')}</ul></section>
      <section><strong>6. Readiness check</strong><p>${escapeHTML(exercise.readiness)}</p></section>
    </div>
  </details>`;
}

function escapeAttr(value) {
  return String(value || '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function escapeHTML(value) {
  return String(value || '').replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
}

function renderWorkoutPlayer() {
  const container = $('#workoutPlayer');
  if (!player.workout) {
    const next = getNextWorkout();
    container.innerHTML = `<div class="player-empty"><div><h3>No workout selected</h3><p>Choose a workout or start today's plan.</p>${next ? `<button class="primary-btn" onclick="startWorkout('${next.id}')">Start ${next.title}</button>` : ''}</div></div>`;
    return;
  }
  const item = player.flat[player.index];
  if (!item) {
    container.innerHTML = `<div class="player-empty"><div><h3>Workout finished</h3><p>Log this session to save your progress.</p><button class="primary-btn" onclick="finishWorkout()">Save workout</button></div></div>`;
    return;
  }
  const exercise = item.exercise;
  const totalItems = player.flat.length;
  const progress = Math.round(((player.index + 1) / totalItems) * 100);
  const phases = [...new Set(player.flat.map(x => x.phase))];
  const prescription = getPrescription(item);
  const safetyHTML = state.settings.safety && ['power', 'skill'].includes(exercise.category)
    ? `<div class="info-card"><strong>Safety</strong><span>${exercise.safety}</span></div>` : '';

  container.innerHTML = `<div class="player-card">
    <div class="phase-tabs">${phases.map(phase => `<span class="phase-chip ${phase === item.phase ? 'active' : ''}">${phase}</span>`).join('')}</div>
    <div class="progress-track" aria-label="Workout progress"><div class="progress-bar" style="width:${progress}%"></div></div>
    <div class="current-exercise">
      ${renderInstructionCard(exercise, item)}
      <div class="exercise-main">
        <p class="eyebrow">${item.phase} • Step ${player.index + 1} of ${totalItems}</p>
        <h3>${exercise.name}</h3>
        <div class="meta-row">
          <span class="tag">${exercise.category}</span>
          <span class="tag">${exercise.level}</span>
          <span class="tag">Set ${player.set}/${item.sets || 1}</span>
          <span class="tag">${prescription}</span>
        </div>
        <p class="exercise-details">${exercise.summary}</p>
        <ul class="cue-list">${exercise.cues.map(cue => `<li>${cue}</li>`).join('')}</ul>
        ${renderWorkoutDetails(exercise)}
      </div>
    </div>
    ${renderTimerCard(item)}
    <div class="grid-two">${safetyHTML}<div class="info-card"><strong>Scale it</strong><span><b>Easier:</b> ${exercise.easier}<br><b>Harder:</b> ${exercise.harder}</span></div></div>
    <div class="player-controls">
      <button class="ghost-btn" onclick="previousExercise()">Previous</button>
      ${item.time ? `<button class="secondary-btn" onclick="startExerciseTimer(${item.time})">Start ${item.time}s timer</button>` : ''}
      <button class="primary-btn" onclick="completeSet()">Done set</button>
      <button class="ghost-btn" onclick="skipExercise()">Skip exercise</button>
      <button class="danger-btn" onclick="finishWorkout()">Finish workout</button>
    </div>
  </div>`;
}

function getPrescription(item) {
  if (item.time) return `${item.time}s`;
  if (item.reps) return item.reps;
  return item.exercise.reps || `${item.exercise.time || 30}s`;
}

function renderTimerCard(item) {
  if (player.mode === 'exercise' || player.mode === 'rest') {
    return `<div class="timer-card ${player.mode === 'rest' ? 'rest-mode' : ''}">
      <div>
        <p class="eyebrow">${player.mode === 'rest' ? 'Rest' : 'Exercise timer'}</p>
        <div class="timer-number">${formatSeconds(player.timerLeft)}</div>
      </div>
      <div class="player-controls">
        <button class="ghost-btn" onclick="pauseTimer()">Pause</button>
        <button class="secondary-btn" onclick="cancelPlayerTimer()">Cancel</button>
      </div>
    </div>`;
  }
  if (player.mode === 'advance') {
    return `<div class="timer-card rest-mode">
      <div>
        <p class="eyebrow">Rest complete</p>
        <div class="timer-number">Ready</div>
      </div>
      <button class="primary-btn" onclick="continueAfterRest()">Continue</button>
    </div>`;
  }
  return `<div class="timer-card">
    <div>
      <p class="eyebrow">Prescription</p>
      <div class="timer-number">${getPrescription(item)}</div>
    </div>
    <p class="exercise-details">Rest after set: ${item.rest || 30}s. Keep quality higher than speed.</p>
  </div>`;
}

function startExerciseTimer(seconds) {
  startTimer(seconds, 'exercise', () => {
    beep();
    completeSet();
  });
}

function startRestTimer(seconds) {
  startTimer(seconds, 'rest', () => {
    beep();
    player.mode = 'idle';
    if (player.pendingAdvance && state.settings.autoAdvance === false) {
      player.mode = 'advance';
      renderWorkoutPlayer();
      return;
    }
    continueAfterRest();
  });
}

function continueAfterRest() {
  const shouldAdvance = !!player.pendingAdvance;
  player.pendingAdvance = false;
  player.mode = 'idle';
  if (shouldAdvance) nextSetOrExercise(true);
  else renderWorkoutPlayer();
  maybeAutoStartCurrentTimer();
}

function maybeAutoStartCurrentTimer() {
  if (state.settings.autoAdvance === false) return;
  const item = player.flat[player.index];
  if (!item || !item.time || player.mode !== 'idle') return;
  window.setTimeout(() => {
    const current = player.flat[player.index];
    if (current && current.id === item.id && player.mode === 'idle' && player.workout) startExerciseTimer(current.time);
  }, 650);
}

function startTimer(seconds, mode, callback) {
  clearPlayerTimer();
  player.timerLeft = seconds;
  player.mode = mode;
  renderWorkoutPlayer();
  player.timer = setInterval(() => {
    player.timerLeft -= 1;
    if (player.timerLeft <= 0) {
      clearPlayerTimer(false);
      callback();
    } else {
      const number = document.querySelector('.timer-number');
      if (number) number.textContent = formatSeconds(player.timerLeft);
    }
  }, 1000);
}

function pauseTimer() {
  clearPlayerTimer(false);
  player.mode = 'idle';
  renderWorkoutPlayer();
}

function cancelPlayerTimer() {
  clearPlayerTimer();
  player.pendingAdvance = false;
  renderWorkoutPlayer();
}

function clearPlayerTimer(resetMode = true) {
  if (player.timer) clearInterval(player.timer);
  player.timer = null;
  if (resetMode) player.mode = 'idle';
}

function completeSet() {
  const item = player.flat[player.index];
  if (!item) return;
  clearPlayerTimer();
  const totalSets = item.sets || 1;
  if (player.set >= totalSets) markSkillFromExercise(item.id);
  player.pendingAdvance = true;
  startRestTimer(item.rest || (player.set >= totalSets ? 20 : 30));
}

function nextSetOrExercise(render = true) {
  const item = player.flat[player.index];
  const totalSets = item?.sets || 1;
  if (player.set < totalSets) {
    player.set += 1;
  } else {
    player.index += 1;
    player.set = 1;
  }
  if (render) renderWorkoutPlayer();
}

function skipExercise() {
  clearPlayerTimer();
  player.pendingAdvance = false;
  player.index += 1;
  player.set = 1;
  renderWorkoutPlayer();
}

function previousExercise() {
  clearPlayerTimer();
  player.pendingAdvance = false;
  player.index = Math.max(0, player.index - 1);
  player.set = 1;
  renderWorkoutPlayer();
}

function finishWorkout() {
  if (!player.workout) return;
  clearPlayerTimer();
  const workout = player.workout;
  if (!isWorkoutDone(workout.title, workout.week)) {
    state.logs.unshift({
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      date: todayISO(),
      title: workout.title,
      week: workout.week,
      minutes: workout.minutes,
      focus: workout.focus,
      level: state.profile.level,
      goal: state.profile.goal
    });
  }
  state.plan = state.plan.map(item => item.id === workout.id ? { ...item, completed: true } : item);
  updateBadges();
  saveState();
  renderAll();
  toast('Workout saved.');
  player = { workout: null, flat: [], index: 0, set: 1, timer: null, timerLeft: 0, mode: 'idle', pendingAdvance: false };
  renderWorkoutPlayer();
  showView('progress');
}

function markSkillFromExercise(exerciseId) {
  Object.entries(SKILLS).forEach(([skillId, skill]) => {
    if (skill.steps.some(step => step.id === exerciseId)) {
      state.completedSkills[skillId] = Array.from(new Set([...(state.completedSkills[skillId] || []), exerciseId]));
    }
  });
}

function renderSkills() {
  const entries = Object.entries(SKILLS);
  const byTier = entries.reduce((acc, [skillId, skill]) => {
    const tier = skill.tier || inferSkillTier(skillId);
    acc[tier] ||= [];
    acc[tier].push([skillId, skill]);
    return acc;
  }, {});
  const mapHTML = Object.keys(byTier).sort((a,b) => Number(a) - Number(b)).map(tier => `
    <div class="skill-tier">
      <div class="tier-label">Tier ${tier}</div>
      <div class="tier-nodes">
        ${byTier[tier].map(([skillId, skill]) => skillNodeHTML(skillId, skill)).join('')}
      </div>
    </div>`).join('');

  const cardsHTML = entries.map(([skillId, skill]) => {
    const done = new Set(state.completedSkills[skillId] || []);
    const percent = Math.round((done.size / skill.steps.length) * 100);
    const status = getSkillStatus(skillId, skill);
    return `<article class="skill-card ${status}" id="skill-card-${skillId}">
      <header>
        <div><h4>${skill.icon} ${skill.title}</h4><small class="exercise-details">${skill.level}</small></div>
        <span class="pill">${percent}%</span>
      </header>
      <p class="exercise-details"><strong>Prerequisites:</strong> ${skill.prerequisites}</p>
      ${skill.requires?.length ? `<p class="exercise-details"><strong>Tree gate:</strong> Complete ${skill.requires.map(id => SKILLS[id]?.title || id).join(', ')} first.</p>` : ''}
      <div class="progress-track"><div class="progress-bar" style="width:${percent}%"></div></div>
      <div class="step-list">
        ${skill.steps.map(step => `<div class="step-row ${done.has(step.id) ? 'done' : ''}">
          <button class="step-check" onclick="toggleSkillStep('${skillId}', '${step.id}')" aria-label="Toggle ${step.title}">${done.has(step.id) ? '✓' : ''}</button>
          <div><strong>${step.title}</strong><small>${step.note}</small></div>
          <button class="ghost-btn" onclick="openExercise('${step.id}')">View</button>
        </div>`).join('')}
      </div>
    </article>`;
  }).join('');

  $('#skillTree').innerHTML = `<div class="skill-tree-map">${mapHTML}</div><div class="skill-card-grid">${cardsHTML}</div>`;
}

function inferSkillTier(skillId) {
  if (skillId === 'mobility') return 1;
  if (['handstand', 'cartwheel'].includes(skillId)) return 2;
  if (['kipup', 'planche', 'frontlever', 'muscleup'].includes(skillId)) return 3;
  if (['swipes', 'windmill'].includes(skillId)) return 4;
  if (skillId === 'backhandspring') return 5;
  return 3;
}

function getSkillStatus(skillId, skill) {
  const done = (state.completedSkills[skillId] || []).length;
  if (done >= skill.steps.length) return 'completed';
  const requires = skill.requires || [];
  const unlocked = requires.every(req => (state.completedSkills[req] || []).length >= Math.min(2, SKILLS[req]?.steps?.length || 1));
  return unlocked ? 'unlocked' : 'locked';
}

function skillNodeHTML(skillId, skill) {
  const status = getSkillStatus(skillId, skill);
  const done = (state.completedSkills[skillId] || []).length;
  const total = skill.steps.length;
  const requires = skill.requires?.length ? `<small>Requires: ${skill.requires.map(id => SKILLS[id]?.title || id).join(' + ')}</small>` : '<small>Foundation node</small>';
  return `<button class="skill-node ${status}" onclick="document.getElementById('skill-card-${skillId}')?.scrollIntoView({behavior:'smooth', block:'center'})" title="${skill.title}">
    <span>${skill.icon}</span>
    <strong>${skill.title}</strong>
    ${requires}
    <em>${done}/${total}</em>
  </button>`;
}

function toggleSkillStep(skillId, stepId) {
  const current = new Set(state.completedSkills[skillId] || []);
  if (current.has(stepId)) current.delete(stepId);
  else current.add(stepId);
  state.completedSkills[skillId] = Array.from(current);
  updateBadges();
  saveState();
  renderSkills();
  renderProgress();
}

function openExercise(exerciseId) {
  showView('library');
  $('#librarySearch').value = EXERCISES[exerciseId]?.name || '';
  $('#libraryFilter').value = 'all';
  renderLibrary();
}

function renderLibrary() {
  const query = ($('#librarySearch').value || '').toLowerCase().trim();
  const filter = $('#libraryFilter').value || 'all';
  const list = Object.values(EXERCISES).filter(ex => {
    const searchable = [ex.name, ex.category, ex.level, ex.summary, ex.purpose, ex.setup, ...(ex.cues || [])].join(' ').toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const matchesFilter = filter === 'all' || ex.category === filter;
    return matchesQuery && matchesFilter;
  });
  $('#exerciseLibrary').innerHTML = list.map(ex => `<article class="exercise-card">
    <div class="icon">${ex.icon}</div>
    <div class="meta-row"><span class="tag">${ex.category}</span><span class="tag">${ex.level}</span>${ex.time ? `<span class="tag">${ex.time}s</span>` : ''}${ex.reps ? `<span class="tag">${ex.reps}</span>` : ''}</div>
    <h4>${ex.name}</h4>
    <p>${ex.summary}</p>
    <details open>
      <summary>Detailed step-by-step coaching notes</summary>
      <div class="detail-grid">
        <section><strong>Purpose</strong><p>${escapeHTML(ex.purpose)}</p></section>
        <section><strong>Setup</strong><p>${escapeHTML(ex.setup)}</p></section>
        <section><strong>Step-by-step</strong><ol>${getDetailedSteps(ex).map(step => `<li>${escapeHTML(step)}</li>`).join('')}</ol></section>
        <section><strong>What it should feel like</strong><p>${escapeHTML(ex.feel)}</p></section>
        <section><strong>Cues</strong><ul>${ex.cues.map(cue => `<li>${escapeHTML(cue)}</li>`).join('')}</ul></section>
        <section><strong>Common mistakes</strong><ul>${ex.mistakes.map(mistake => `<li>${escapeHTML(mistake)}</li>`).join('')}</ul></section>
        <section><strong>Regression / progression</strong><p><b>Easier:</b> ${escapeHTML(ex.easier)}<br><b>Harder:</b> ${escapeHTML(ex.harder)}</p></section>
        <section><strong>Readiness</strong><p>${escapeHTML(ex.readiness)}</p></section>
        <section><strong>Safety</strong><p>${escapeHTML(ex.safety)}</p></section>
      </div>
    </details>
  </article>`).join('') || `<div class="player-empty"><p>No exercises found.</p></div>`;
}

function renderProgress() {
  const total = state.logs.length;
  const minutes = state.logs.reduce((sum, log) => sum + Number(log.minutes || 0), 0);
  const streak = calculateStreak(state.logs);
  const focusCounts = ['strength', 'power', 'mobility', 'skill', 'core'].map(focus => ({ focus, count: countLogsByFocus(state, focus) }));
  const maxFocus = Math.max(1, ...focusCounts.map(item => item.count));
  const unlockedIds = new Set(BADGES.filter(badge => badge.rule(state)).map(badge => badge.id));
  $('#progressView').innerHTML = `<div class="progress-grid">
    <article class="stat-card"><strong>${total}</strong><span>total workouts</span></article>
    <article class="stat-card"><strong>${minutes}</strong><span>total minutes</span></article>
    <article class="stat-card"><strong>${streak}</strong><span>current streak</span></article>
  </div>
  <div class="grid-two">
    <section class="info-card"><strong>Training balance</strong><div class="chart-bars">${focusCounts.map(item => `<div class="chart-row"><span>${item.focus}</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.round((item.count / maxFocus) * 100)}%"></div></div><span>${item.count}</span></div>`).join('')}</div></section>
    <section class="info-card"><strong>Recent sessions</strong><div class="log-list">${state.logs.slice(0, 6).map(log => `<div class="log-card"><div><strong>${log.title}</strong><small>${log.date} • Week ${log.week}</small></div><span class="pill">${log.minutes}m</span></div>`).join('') || '<p class="exercise-details">No workouts saved yet.</p>'}</div></section>
  </div>
  <section class="info-card"><strong>Badges</strong><div class="badge-list">${BADGES.map(badge => `<article class="badge-card ${unlockedIds.has(badge.id) ? 'unlocked' : ''}"><strong>${badge.icon} ${badge.title}</strong><span>${badge.desc}</span></article>`).join('')}</div></section>`;
}

function calculateStreak(logs) {
  if (!logs.length) return 0;
  const days = new Set(logs.map(log => log.date));
  let streak = 0;
  const date = new Date();
  for (let i = 0; i < 365; i++) {
    const iso = date.toISOString().slice(0, 10);
    if (days.has(iso)) {
      streak += 1;
      date.setDate(date.getDate() - 1);
    } else if (i === 0) {
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function countLogsByFocus(s, focus) {
  return s.logs.filter(log => (log.focus || []).includes(focus)).length;
}

function getCompletedSkillSteps(s, skillId) {
  return (s.completedSkills[skillId] || []).length;
}

function updateBadges() {
  const unlocked = BADGES.filter(badge => badge.rule(state)).map(badge => badge.id);
  state.badges = unlocked;
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `power-gym-progress-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Progress exported.');
}

function resetData() {
  if (!confirm('Reset all app data in this browser?')) return;
  [STORAGE_KEY, ...LEGACY_STORAGE_KEYS].forEach(key => { try { localStorage.removeItem(key); } catch (error) {} });
  clearCookie(`${COOKIE_KEY}.chunks`);
  for (let i = 0; i < COOKIE_CHUNK_LIMIT; i += 1) clearCookie(`${COOKIE_KEY}.${i}`);
  state = structuredClone(defaultState);
  buildPlan();
  fillProfileForm();
  renderAll();
  showView('dashboard');
  toast('App data reset.');
}

function formatSeconds(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function beep() {
  if (!state.settings.sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 720;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.24);
  } catch (error) {
    console.warn('Audio cue unavailable', error);
  }
}

function advanceWeekFromButton() {
  state.currentWeek += 1;
  buildPlan({ useCurrentForm: true, forceFresh: true });
  fillProfileForm();
  renderAll();
  toast(`Week ${state.currentWeek} ready.`);
}

function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.finally(() => {
    deferredInstallPrompt = null;
    $('#installBtn').hidden = true;
  });
}

function enableManifestWhenHosted() {
  if (!IS_HOSTED_APP || document.querySelector('link[rel="manifest"]')) return;
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = 'manifest.json';
  document.head.appendChild(manifestLink);
}

function registerServiceWorker() {
  if (!IS_HOSTED_APP || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('Service worker not registered', error));
}

window.startWorkout = startWorkout;
window.completeSet = completeSet;
window.skipExercise = skipExercise;
window.previousExercise = previousExercise;
window.finishWorkout = finishWorkout;
window.startExerciseTimer = startExerciseTimer;
window.pauseTimer = pauseTimer;
window.clearPlayerTimer = clearPlayerTimer;
window.toggleSkillStep = toggleSkillStep;
window.openExercise = openExercise;
window.advanceWeekFromButton = advanceWeekFromButton;

init();
