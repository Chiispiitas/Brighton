"use strict";
/* ==============================================
     Scene Participants
     Made by: David Santana
============================================== */

var listParticipants = document.getElementById("list-participants");
var inputParticipant = document.getElementById("input-participants");

/* ==============================================
     Add Button Listeners
============================================== */
document.getElementById("btn-participants-back").addEventListener( "click", function(){ 
     sceneLoad("scene-title");
});
document.getElementById("btn-participants-next").addEventListener( "click", function(){ 
     if (Object.keys(participantsHash).length >= 2) {
          participantHashToArray();
          sceneLoad("scene-countdown");
          startCountdown();
     } 
});
/* ==============================================
     Add Input Listener
============================================== */
inputParticipant.addEventListener("keydown", function(event) {
     if (event.code === "Enter") {
          if (participantsCounter < 1000) { addParticipant(inputParticipant.value.trim()); }
     }
});
/* ==============================================
     Add Participant
============================================== */
function addParticipant(name) {
     inputParticipant.value = "";
     if (name == "") { return; }
     listParticipants.innerHTML += generateParticipantAnchor(name);
     participantsCounter += 1;
     // if (participantsCounter == 10) { inputParticipant.disabled = true; }
}
/* ==============================================
     Generate Participant Anchor
============================================== */
function generateParticipantAnchor(name) {
     let id = `${name}-${participantsCounter}-${Math.floor(Math.random() * 999999) + 1}`;
     participantsHash[id] = name;
     return `<a id="${id}" onClick="removeParticipant('${id}');">${name}</a>`;
}
/* ==============================================
     Remove Participant
============================================== */
function removeParticipant(id) {
     participantsCounter -= 1;
     delete participantsHash[id];
     inputParticipant.disabled = false;
     document.getElementById(id).outerHTML = "";
}
/* ==============================================
     Update Participants
============================================== */
var updateParticipants = setInterval(function() {
     if (sceneCurrent == "scene-participants") { inputParticipant.focus(); }
}, 1);