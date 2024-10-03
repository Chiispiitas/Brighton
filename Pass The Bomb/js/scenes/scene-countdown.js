"use strict";
/* ==============================================
     Scene Countdown
     Made by: David Santana
============================================== */

const textCountdown = document.getElementById("text-countdown");
var countdownActive = false;
var countdownValue = 3;

/* ==============================================
     Start Countdown
============================================== */
function startCountdown() {
     countdownActive = true;
     countdownValue = 3;
}
/* ==============================================
     Update Countdown
============================================== */
var updateCountdown = setInterval(function() { 
     if (!countdownActive) { return; }

     textCountdown.textContent = countdownValue;
     if (countdownValue == 0) { 
          countdownActive = false; 
          textCountdown.textContent = "GO!";
          setTimeout(function() { 
               musicTitle.stop();
               sceneLoad("scene-game"); 
               startGame(); 
          }, 500);
          return;
     }

     countdownValue -= 1;
}, 1000);