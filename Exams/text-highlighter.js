"use strict";
/* ==============================================
     Brighton Text Highlighter
     Made by: David Santana
============================================== */

var textHighlightToolbar = null;
var textHighlightRange = null;

/* ---------------------------------------------- 
BOOT TEXT HIGHLIGHTER 
---------------------------------------------- */
function bootTextHighlighter() {
  createTextHighlightToolbar();
  bindTextHighlightEvents();
}

/* ---------------------------------------------- 
CREATE TEXT HIGHLIGHT TOOLBAR 
---------------------------------------------- */
function createTextHighlightToolbar() {
  textHighlightToolbar = document.createElement("div");
  textHighlightToolbar.id = "textHighlightToolbar";
  textHighlightToolbar.className = "text-highlight-toolbar";
  textHighlightToolbar.setAttribute("aria-hidden", "true");

  let highlightBtn = document.createElement("button");
  highlightBtn.type = "button";
  highlightBtn.className = "highlight-action";
  highlightBtn.setAttribute("aria-label", "Highlight text");
  highlightBtn.title = "Highlight text";
  highlightBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.7 17.9 3 21l3.1-1.7L17.5 7.9l-1.4-1.4L4.7 17.9Zm14-13.2-1.4-1.4c-.5-.5-1.3-.5-1.8 0l-1 1 3.2 3.2 1-1c.5-.5.5-1.3 0-1.8ZM13.7 5.1 5.9 12.9l5.2 5.2 7.8-7.8-5.2-5.2Zm-2.1 14.8H21v-2.1h-7.3l-2.1 2.1Z"></path></svg>`;

  let clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "highlight-clear";
  clearBtn.setAttribute("aria-label", "Clear highlight");
  clearBtn.title = "Clear highlight";
  clearBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 5 5 6.2l4.4 4.4L3 17v4h4l6.4-6.4 4.4 4.4 1.2-1.2L6.2 5Zm-.6 14H5v-.6l5.6-5.6 1.2 1.2L5.6 19ZM19.5 4.5l-2-2c-.4-.4-1.1-.4-1.5 0l-4.8 4.8 3.2 3.2 5.1-5.1c.2-.2.2-.6 0-.9ZM20.5 20.5 3.5 3.5 2.2 4.8l17 17 1.3-1.3Z"></path></svg>`;

  highlightBtn.addEventListener("mousedown", keepTextSelection);
  clearBtn.addEventListener("mousedown", keepTextSelection);
  highlightBtn.addEventListener("click", highlightSelectedText);
  clearBtn.addEventListener("click", clearSelectedHighlight);

  textHighlightToolbar.appendChild(highlightBtn);
  textHighlightToolbar.appendChild(clearBtn);
  document.body.appendChild(textHighlightToolbar);
}

/* ---------------------------------------------- 
BIND TEXT HIGHLIGHT EVENTS 
---------------------------------------------- */
function bindTextHighlightEvents() {
  document.addEventListener("mouseup", checkTextSelectionSoon);
  document.addEventListener("touchend", checkTextSelectionSoon);
  document.addEventListener("keyup", checkTextSelectionSoon);
  document.addEventListener("scroll", hideTextHighlightToolbar, true);
  window.addEventListener("resize", hideTextHighlightToolbar);

  document.addEventListener("mousedown", function(event) {
    if (!textHighlightToolbar || textHighlightToolbar.contains(event.target)) return;
    hideTextHighlightToolbar();
  });
}

/* ---------------------------------------------- 
CHECK TEXT SELECTION SOON 
---------------------------------------------- */
function checkTextSelectionSoon() {
  window.setTimeout(checkTextSelection, 35);
}

/* ---------------------------------------------- 
CHECK TEXT SELECTION 
---------------------------------------------- */
function checkTextSelection() {
  let selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    hideTextHighlightToolbar();
    return;
  }

  let range = selection.getRangeAt(0);
  if (!canUseTextSelection(range, selection.toString())) {
    hideTextHighlightToolbar();
    return;
  }

  textHighlightRange = range.cloneRange();
  showTextHighlightToolbar(textHighlightRange);
}

/* ---------------------------------------------- 
CAN USE TEXT SELECTION 
---------------------------------------------- */
function canUseTextSelection(range, text) {
  let root = getTextHighlightRoot();
  if (!root || !text || !text.trim()) return false;
  if (!nodeIsInside(range.commonAncestorContainer, root)) return false;
  if (selectionUsesEditableControl(range)) return false;
  return true;
}

/* ---------------------------------------------- 
GET TEXT HIGHLIGHT ROOT 
---------------------------------------------- */
function getTextHighlightRoot() {
  return document.getElementById("mainContent") || document.body;
}

/* ---------------------------------------------- 
NODE IS INSIDE 
---------------------------------------------- */
function nodeIsInside(node, parent) {
  let element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return Boolean(element && parent.contains(element));
}

/* ---------------------------------------------- 
SELECTION USES EDITABLE CONTROL 
---------------------------------------------- */
function selectionUsesEditableControl(range) {
  let node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
  return Boolean(node && node.closest("input, textarea, select, [contenteditable='true'], .text-highlight-toolbar"));
}

/* ---------------------------------------------- 
SHOW TEXT HIGHLIGHT TOOLBAR 
---------------------------------------------- */
function showTextHighlightToolbar(range) {
  if (!textHighlightToolbar) return;

  textHighlightToolbar.classList.add("visible");
  textHighlightToolbar.setAttribute("aria-hidden", "false");

  let rect = range.getBoundingClientRect();
  let width = textHighlightToolbar.offsetWidth || 160;
  let height = textHighlightToolbar.offsetHeight || 42;
  let left = rect.left + (rect.width / 2) - (width / 2);
  let top = rect.top - height - 10;

  if (top < 12) top = rect.bottom + 10;
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));

  textHighlightToolbar.style.left = left + "px";
  textHighlightToolbar.style.top = top + "px";
}

/* ---------------------------------------------- 
HIDE TEXT HIGHLIGHT TOOLBAR 
---------------------------------------------- */
function hideTextHighlightToolbar() {
  if (!textHighlightToolbar) return;
  textHighlightToolbar.classList.remove("visible");
  textHighlightToolbar.setAttribute("aria-hidden", "true");
}

/* ---------------------------------------------- 
KEEP TEXT SELECTION 
---------------------------------------------- */
function keepTextSelection(event) {
  event.preventDefault();
}

/* ---------------------------------------------- 
HIGHLIGHT SELECTED TEXT 
---------------------------------------------- */
function highlightSelectedText() {
  if (!textHighlightRange) return;

  let range = textHighlightRange.cloneRange();
  if (!canUseTextSelection(range, range.toString())) return;

  let highlight = document.createElement("span");
  highlight.className = "student-highlight";
  highlight.setAttribute("data-highlight", "orange");

  try {
    let selectedContent = range.extractContents();
    highlight.appendChild(selectedContent);
    range.insertNode(highlight);
    cleanTextHighlightNesting();
    clearBrowserSelection();
    hideTextHighlightToolbar();
  } catch (error) {
    hideTextHighlightToolbar();
  }
}

/* ---------------------------------------------- 
CLEAR SELECTED HIGHLIGHT 
---------------------------------------------- */
function clearSelectedHighlight() {
  let root = getTextHighlightRoot();
  if (!root) return;

  let range = textHighlightRange ? textHighlightRange.cloneRange() : null;
  let highlights = Array.from(root.querySelectorAll(".student-highlight"));
  let changed = false;

  highlights.forEach(function(highlight) {
    if (range && rangeIntersectsNode(range, highlight)) {
      unwrapTextHighlight(highlight);
      changed = true;
    }
  });

  if (!changed && range) {
    let node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    let closest = node ? node.closest(".student-highlight") : null;
    if (closest) unwrapTextHighlight(closest);
  }

  clearBrowserSelection();
  hideTextHighlightToolbar();
}

/* ---------------------------------------------- 
RANGE INTERSECTS NODE 
---------------------------------------------- */
function rangeIntersectsNode(range, node) {
  if (typeof range.intersectsNode === "function") {
    return range.intersectsNode(node);
  }
  return false;
}

/* ---------------------------------------------- 
UNWRAP TEXT HIGHLIGHT 
---------------------------------------------- */
function unwrapTextHighlight(highlight) {
  let parent = highlight.parentNode;
  if (!parent) return;

  while (highlight.firstChild) {
    parent.insertBefore(highlight.firstChild, highlight);
  }

  parent.removeChild(highlight);
  parent.normalize();
}

/* ---------------------------------------------- 
CLEAN TEXT HIGHLIGHT NESTING 
---------------------------------------------- */
function cleanTextHighlightNesting() {
  let root = getTextHighlightRoot();
  if (!root) return;

  Array.from(root.querySelectorAll(".student-highlight .student-highlight")).forEach(function(highlight) {
    unwrapTextHighlight(highlight);
  });
}

/* ---------------------------------------------- 
CLEAR BROWSER SELECTION 
---------------------------------------------- */
function clearBrowserSelection() {
  let selection = window.getSelection();
  if (selection) selection.removeAllRanges();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootTextHighlighter);
} else {
  bootTextHighlighter();
}
