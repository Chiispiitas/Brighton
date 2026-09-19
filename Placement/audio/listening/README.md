# Placement Listening Audio

Status: **READY**

All 21 production MP3 files required by the adaptive Placement Listening stage are present and their filenames match `Placement/item-bank.js`.

Validated set:

```text
prea1-01.mp3
prea1-02.mp3
prea1-03.mp3

a1-01.mp3
a1-02.mp3
a1-03.mp3

a2-01.mp3
a2-02.mp3
a2-03.mp3

b1-01.mp3
b1-02.mp3
b1-03.mp3

b1plus-01.mp3
b1plus-02.mp3
b1plus-03.mp3

b2-01.mp3
b2-02.mp3
b2-03.mp3

c1-01.mp3
c1-02.mp3
c1-03.mp3
```

Each question uses its own MP3 and its own player.

Player rules:
- maximum 3 successful starts per question;
- no pause button;
- no seeking;
- no playback-speed control;
- playback fixed at 1.0×;
- audio failure does not consume a play;
- play count persists across reloads;
- changing question stops the previous clip.

Source transcripts are in:

`Placement/LISTENING_AUDIO_SCRIPTS.md`
