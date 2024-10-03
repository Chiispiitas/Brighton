"use strict";
/* ==============================================
     Sound
     Made by: David Santana
============================================== */

/* ==============================================
     Title Music
============================================== */
const musicTitle = new Howl({
     src: ["ogg/music-title.ogg"],
     autoplay: true,
     loop: true,
     preload: true,
     volume: 0.3,
});
/* ==============================================
     Game Music
============================================== */
const musicGame = new Howl({
     src: ["ogg/music-game-normal.ogg"],
     loop: true,
     preload: true,
     volume: 0.3,
     rate: 1.0
});
/* ==============================================
     Bell
============================================== */
const soundBell = new Howl({
     src: ["ogg/bell.ogg"],
     preload: true,
     volume: 0.4
});
/* ==============================================
     Buzzer
============================================== */
const soundBuzzer = new Howl({
     src: ["ogg/buzzer.ogg"],
     preload: true,
     volume: 0.35
});
/* ==============================================
     Explosion
============================================== */
const soundExplosion = new Howl({
     src: ["ogg/explosion.ogg"],
     preload: true,
     volume: 0.35
});
/* ==============================================
     Keys
============================================== */
for (let i = 1; i <= 20; i++) {
     window[`soundKey${i}`] = new Howl({
          src: [`ogg/keys/key${i}.ogg`],
          preload: true,
          volume: 0.3
     });
}