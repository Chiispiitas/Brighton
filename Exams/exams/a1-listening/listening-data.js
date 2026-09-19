"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

/*
  Brighton A1 Listening Final
  Task architecture adapted from the five-part A1 Movers Listening format.
  Language scope is aligned to Personal Best A1 vocabulary and everyday situations.
  Visual assets are placeholders until final artwork is approved.
*/

window.listeningExam = {
  examId: "brighton-a1-listening-final",
  title: "Brighton A1 Listening Final Exam",
  level: "A1",
  skill: "Listening",
  maxScore: 25,
  parts: [
    {
      id: "part1",
      label: "Part 1",
      title: "People in a scene",
      range: "Questions 1-5",
      instruction: "Listen and match each name to the correct person in the picture.",
      type: "matching",
      lead: "Look at the city-square picture. The people will be labelled A-H in the final artwork.",
      taskQuestion: "Which person is each name?",
      optionsTitle: "People in the picture",
      imageDescription: "IMAGE PLACEHOLDER - a busy Saturday city square with a market stall, outdoor cafe, bus stop, museum entrance, taxi, tree and bicycle. Show eight clearly separated young-adult or adult people labelled A-H. Clothing, objects, actions and positions must be easy to identify at A1 level.",
      example: { person: "Mia", answer: "H", text: "Person H" },
      options: {
        A: "Person A",
        B: "Person B",
        C: "Person C",
        D: "Person D",
        E: "Person E",
        F: "Person F",
        G: "Person G",
        H: "Person H"
      },
      items: [
        { q: 1, person: "Leo" },
        { q: 2, person: "Ana" },
        { q: 3, person: "Diego" },
        { q: 4, person: "Sofia" },
        { q: 5, person: "Carlos" }
      ]
    },
    {
      id: "part2",
      label: "Part 2",
      title: "Note completion",
      range: "Questions 6-10",
      instruction: "Listen and write one word or a number in each gap.",
      type: "gap",
      lead: "You will hear two people talking about a weekend trip.",
      heading: "Weekend trip to Manta",
      subheading: "Example - Travel there by: bus",
      items: [
        { q: 6, before: "Hotel:", after: "Hotel" },
        { q: 7, before: "Room number:", after: "" },
        { q: 8, before: "Saturday morning: visit the", after: "" },
        { q: 9, before: "Lunch at: a", after: "near the park" },
        { q: 10, before: "Sunday activity: go", after: "" }
      ]
    },
    {
      id: "part3",
      label: "Part 3",
      title: "Family activities",
      range: "Questions 11-15",
      instruction: "Listen and match each person to their favourite weekend activity.",
      type: "matching",
      lead: "Nina is telling Marco about her family and their favourite weekend activities.",
      taskQuestion: "Which activity does each person prefer?",
      optionsTitle: "Activities",
      example: { person: "Her parents", answer: "H", text: "have a barbecue" },
      options: {
        A: "go hiking",
        B: "watch a movie",
        C: "play soccer",
        D: "go swimming",
        E: "visit a museum",
        F: "play chess",
        G: "go bike riding",
        H: "have a barbecue"
      },
      items: [
        { q: 11, person: "Her uncle" },
        { q: 12, person: "Her brother" },
        { q: 13, person: "Her sister" },
        { q: 14, person: "Her cousin" },
        { q: 15, person: "Her grandmother" }
      ]
    },
    {
      id: "part4",
      label: "Part 4",
      title: "Picture multiple choice",
      range: "Questions 16-20",
      instruction: "Listen and choose the correct picture: A, B or C.",
      type: "visualMultiple",
      items: [
        {
          q: 16,
          stem: "What is Laura wearing to the concert?",
          options: {
            A: { label: "Dress", placeholder: "IMAGE A - a young woman wearing a dress" },
            B: { label: "T-shirt and jeans", placeholder: "IMAGE B - a young woman wearing a T-shirt and jeans" },
            C: { label: "Jacket and skirt", placeholder: "IMAGE C - a young woman wearing a jacket and skirt" }
          }
        },
        {
          q: 17,
          stem: "How is Marco going to the train station?",
          options: {
            A: { label: "Bus", placeholder: "IMAGE A - city bus" },
            B: { label: "Taxi", placeholder: "IMAGE B - city taxi" },
            C: { label: "On foot", placeholder: "IMAGE C - person walking" }
          }
        },
        {
          q: 18,
          stem: "What was the weather like at the beach yesterday?",
          options: {
            A: { label: "Sunny", placeholder: "IMAGE A - sunny beach" },
            B: { label: "Windy", placeholder: "IMAGE B - very windy beach" },
            C: { label: "Rainy", placeholder: "IMAGE C - rainy beach" }
          }
        },
        {
          q: 19,
          stem: "What did Mia buy at the market?",
          options: {
            A: { label: "Hat", placeholder: "IMAGE A - red hat" },
            B: { label: "Boots", placeholder: "IMAGE B - pair of boots" },
            C: { label: "Sweater", placeholder: "IMAGE C - sweater" }
          }
        },
        {
          q: 20,
          stem: "What are they doing this evening?",
          options: {
            A: { label: "Watch a movie", placeholder: "IMAGE A - friends watching a movie at a movie theater" },
            B: { label: "Play videogames", placeholder: "IMAGE B - friends playing videogames" },
            C: { label: "Visit a museum", placeholder: "IMAGE C - friends visiting a museum" }
          }
        }
      ]
    },
    {
      id: "part5",
      label: "Part 5",
      title: "Picture colours and writing",
      range: "Questions 21-25",
      instruction: "Look at the picture. Listen and choose the colour you hear, or write the word for Question 24.",
      type: "pictureAction",
      imageDescription: "IMAGE PLACEHOLDER - a clear city park and cafe scene. Include a woman near a market stall with a shopping bag and jacket, a backpack next to a bench, a bicycle next to a tree, a small cafe building with an empty sign, an open umbrella near a bus stop, and a woman near the cafe wearing a hat for the example.",
      example: { target: "Hat on the woman near the cafe", answer: "yellow" },
      items: [
        { q: 21, action: "color", target: "Woman's jacket", options: ["red", "blue", "green", "brown", "purple", "yellow", "orange", "pink"] },
        { q: 22, action: "color", target: "Backpack next to the bench", options: ["red", "blue", "green", "brown", "purple", "yellow", "orange", "pink"] },
        { q: 23, action: "color", target: "Bicycle next to the tree", options: ["red", "blue", "green", "brown", "purple", "yellow", "orange", "pink"] },
        { q: 24, action: "write", target: "Word on the small building sign", placeholder: "Write one word" },
        { q: 25, action: "color", target: "Umbrella near the bus stop", options: ["red", "blue", "green", "brown", "purple", "yellow", "orange", "pink"] }
      ]
    }
  ]
};
