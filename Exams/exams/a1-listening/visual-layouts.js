"use strict";
/* ==============================================
     Brighton English School
     A1 Listening visual layout data
============================================== */

window.A1ListeningVisualLayouts = {
  version: 2,

  part1: {
    schema: "brighton-a1-listening-layout",
    version: 2,
    mode: "part1-cutouts",
    canvas: {
      width: 1600,
      height: 1200,
      aspect: "4:3",
      background: "assets/part1_scene_matching_main---b632be08-ab3e-4b43-a183-b5a3d68ef8c4.png"
    },
    elements: [
      {
        id: "leo",
        kind: "person-cutout",
        x: 27.35,
        y: 32.6,
        w: 16,
        h: 28,
        label: "Leo",
        role: "answer",
        answer: "C",
        asset: "part1_leo.png"
      },
      {
        id: "ana",
        kind: "person-cutout",
        x: 8.37,
        y: 32.78,
        w: 24.23,
        h: 41,
        label: "Ana",
        role: "answer",
        answer: "D",
        asset: "part1_ana.png"
      },
      {
        id: "diego",
        kind: "person-cutout",
        x: 47.72,
        y: 34.34,
        w: 22.93,
        h: 33.58,
        label: "Diego",
        role: "answer",
        answer: "E",
        asset: "part1_diego.png"
      },
      {
        id: "sofia",
        kind: "person-cutout",
        x: 70.94,
        y: 32.47,
        w: 13.39,
        h: 22.6,
        label: "Sofia",
        role: "answer",
        answer: "F",
        asset: "part1_sofia.png"
      },
      {
        id: "carlos",
        kind: "person-cutout",
        x: 77.55,
        y: 38.05,
        w: 22.45,
        h: 48.22,
        label: "Carlos",
        role: "answer",
        answer: "G",
        asset: "part1_carlos.png"
      }
    ]
  },

  part2Image: null,

  part5: {
    schema: "brighton-a1-listening-layout",
    version: 2,
    mode: "part5-color",
    canvas: {
      width: 1600,
      height: 1200,
      aspect: "4:3",
      background: "assets/part5_colour_write_main---ef4753e4-8fd1-4c04-8251-50c8b6ada09e.png"
    },
    palette: {
      red: "#d24a43",
      blue: "#3f70b7",
      green: "#4f8a52",
      brown: "#8a5d3b",
      purple: "#76559e",
      yellow: "#e7bb35",
      orange: "#dc7c36",
      pink: "#d9809c"
    },
    elements: [
      {
        id: "q25-umbrella",
        kind: "cutout",
        x: 83.99,
        y: 28.49,
        w: 9.58,
        h: 14.45,
        label: "Umbrella near the bus stop",
        role: "answer",
        q: 25,
        asset: "",
        variants: {
          blue: "part5_umbrella-blue.png",
          brown: "part5_umbrella-brown.png",
          green: "part5_umbrella-green.png",
          orange: "part5_umbrella-orange.png",
          pink: "part5_umbrella-pink.png",
          purple: "part5_umbrella-purple.png",
          red: "part5_umbrella-red.png",
          yellow: "part5_umbrella-yellow.png"
        }
      },
      {
        id: "q21-jacket",
        kind: "cutout",
        x: 8.14,
        y: 38.09,
        w: 14.25,
        h: 14.54,
        label: "Woman's jacket",
        role: "answer",
        q: 21,
        asset: "",
        variants: {
          blue: "part5_jacket-blue.png",
          brown: "part5_jacket-brown.png",
          green: "part5_jacket-green.png",
          orange: "part5_jacket-orange.png",
          pink: "part5_jacket-pink.png",
          purple: "part5_jacket-purple.png",
          red: "part5_jacket-red.png",
          yellow: "part5_jacket-yellow.png"
        }
      },
      {
        id: "q23-bicycle",
        kind: "cutout",
        x: 58.11,
        y: 47.43,
        w: 22.76,
        h: 22.23,
        label: "Bicycle next to the tree",
        role: "answer",
        q: 23,
        asset: "",
        variants: {
          blue: "part5_bike-blue.png",
          brown: "part5_bike-brown.png",
          green: "part5_bike-green.png",
          orange: "part5_bike-orange.png",
          pink: "part5_bike-pink.png",
          purple: "part5_bike-purple.png",
          red: "part5_bike-red.png",
          yellow: "part5_bike-yellow.png"
        }
      },
      {
        id: "q22-backpack",
        kind: "cutout",
        x: 23.24,
        y: 74.51,
        w: 15,
        h: 15,
        label: "Backpack next to the bench",
        role: "answer",
        q: 22,
        asset: "",
        variants: {
          blue: "part5_backpack-blue.png",
          brown: "part5_backpack-brown.png",
          green: "part5_backpack-green.png",
          orange: "part5_backpack-orange.png",
          pink: "part5_backpack-pink.png",
          purple: "part5_backpack-purple.png",
          red: "part5_backpack-red.png",
          yellow: "part5_backpack-yellow.png"
        }
      },
      {
        id: "q24-text",
        kind: "text",
        x: 35.55,
        y: 13.14,
        w: 20.88,
        h: 5.72,
        label: "Q24 text field",
        role: "answer",
        q: 24,
        placeholder: "Type one word"
      }
    ]
  }
};
