# Placement Listening Audio

Audio assets for the Brighton Adaptive Placement Listening stage belong in this folder.

## Player rules

Every listening question has its **own player**.

Required behaviour:
- maximum 3 plays per question;
- show the remaining count clearly, e.g. `Play · 3 left`;
- every press starts the clip from the beginning;
- no pause button;
- no seek bar;
- no playback-speed control;
- fixed playback rate: `1.0`;
- allow normal device volume control;
- selecting an answer does not automatically replay audio;
- changing question immediately stops the previous clip;
- an audio loading/error failure must not consume a play;
- after the third successful start, the Play button is permanently disabled for that question;
- play counts must be saved with local attempt state so reloading the page does not reset the allowance.

The Listening stage should use only the three clips from the adaptive module selected by the Wix backend.

## Audio files

Generate the 21 source clips from:

`../LISTENING_AUDIO_SCRIPTS.md`

Expected structure:

```text
Placement/
  audio/
    listening/
      prea1-01.mp3
      prea1-02.mp3
      prea1-03.mp3
      a1-01.mp3
      ...
      c1-03.mp3
```

Do not create a continuous Listening track.
