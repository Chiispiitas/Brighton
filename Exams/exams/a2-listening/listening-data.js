"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.listeningExam = {
  examId: "brighton-a2-listening-final",
  title: "Brighton A2 Listening Final Exam",
  level: "A2",
  skill: "Listening",
  maxScore: 25,
  parts: [
    {
      id: "part1",
      label: "Part 1",
      title: "Picture multiple choice",
      range: "Questions 1-5",
      instruction: "For each question, choose the correct answer.",
      type: "visualMultiple",
      items: [
        {
          q: 1,
          stem: "Where will Claire meet Alex?",
          options: {
            A: { label: "Museum", placeholder: "Museum\nart exhibition", alt: "Museum art exhibition" },
            B: { label: "Hairdresser's", placeholder: "Hairdresser's\nchairs and mirrors", alt: "Hairdresser's" },
            C: { label: "Cafe", placeholder: "Cafe\ntables and sandwiches", alt: "Cafe" }
          }
        },
        {
          q: 2,
          stem: "What time should the man telephone again?",
          options: {
            A: { label: "10:15", placeholder: "Clock\n10:15", alt: "Clock showing ten fifteen" },
            B: { label: "12:00", placeholder: "Clock\n12:00", alt: "Clock showing twelve o'clock" },
            C: { label: "12:30", placeholder: "Clock\n12:30", alt: "Clock showing half past twelve" }
          }
        },
        {
          q: 3,
          stem: "When are they going to have the party?",
          options: {
            A: { label: "July 11", placeholder: "July 11", alt: "July 11" },
            B: { label: "July 18", placeholder: "July 18", alt: "July 18" },
            C: { label: "July 25", placeholder: "July 25", alt: "July 25" }
          }
        },
        {
          q: 4,
          stem: "What was the weather like on the picnic?",
          options: {
            A: { label: "Sunny", placeholder: "Sunny\nweather", alt: "Sunny weather" },
            B: { label: "Rainy", placeholder: "Rainy\nweather", alt: "Rainy weather" },
            C: { label: "Windy", placeholder: "Windy\nweather", alt: "Windy weather" }
          }
        },
        {
          q: 5,
          stem: "How much are the shorts?",
          options: {
            A: { label: "£5", placeholder: "£5", alt: "Five pounds" },
            B: { label: "£15", placeholder: "£15", alt: "Fifteen pounds" },
            C: { label: "£20", placeholder: "£20", alt: "Twenty pounds" }
          }
        }
      ]
    },
    {
      id: "part2",
      label: "Part 2",
      title: "Note completion",
      range: "Questions 6-10",
      instruction: "For each question, write the correct answer in the gap. Write one word or a number or a date or a time.",
      type: "gap",
      lead: "You will hear a teacher talking to a group of students about summer jobs.",
      heading: "Jobs for students with Sunshine Holidays",
      subheading: "Work in: Children's summer camps",
      items: [
        { q: 6, before: "Dates of jobs: 15th June - 20th", after: "" },
        { q: 7, before: "Staff must be:", after: "years old" },
        { q: 8, before: "Staff must be able to:", after: "" },
        { q: 9, before: "Staff will earn: £", after: "" },
        { q: 10, before: "Send a letter and:", after: "" }
      ]
    },
    {
      id: "part3",
      label: "Part 3",
      title: "Multiple choice",
      range: "Questions 11-15",
      instruction: "You will hear Robert talking to his friend, Laura, about a trip to Dublin. For each question, choose the correct answer.",
      type: "multiple",
      lead: "You will hear Robert talking to his friend, Laura, about a trip to Dublin.",
      items: [
        {
          q: 11,
          stem: "Who has already decided to go with Robert?",
          options: {
            A: "family members",
            B: "colleagues",
            C: "tennis partners"
          }
        },
        {
          q: 12,
          stem: "They'll stay in",
          options: {
            A: "a university.",
            B: "a guest house.",
            C: "a hotel."
          }
        },
        {
          q: 13,
          stem: "Laura must remember to take",
          options: {
            A: "a map.",
            B: "a camera.",
            C: "a coat."
          }
        },
        {
          q: 14,
          stem: "Why does Laura like Dublin?",
          options: {
            A: "The people are friendly.",
            B: "The buildings are interesting.",
            C: "The shops are beautiful."
          }
        },
        {
          q: 15,
          stem: "Robert's excited about the trip to Dublin because",
          options: {
            A: "he can't wait to go to the music festival.",
            B: "he loves the food there.",
            C: "he wants to go to a new art exhibition."
          }
        }
      ]
    },
    {
      id: "part4",
      label: "Part 4",
      title: "Short conversations",
      range: "Questions 16-20",
      instruction: "For each question, choose the correct answer.",
      type: "multiple",
      items: [
        {
          q: 16,
          context: "You will hear a woman talking to her friend about why she's bought a motorbike.",
          stem: "Why did she buy it?",
          options: {
            A: "It's fast.",
            B: "It was cheap.",
            C: "It'll be easy to repair."
          }
        },
        {
          q: 17,
          context: "You will hear two friends talking about going to university.",
          stem: "What subject is the man going to study?",
          options: {
            A: "history",
            B: "geography",
            C: "chemistry"
          }
        },
        {
          q: 18,
          context: "You will hear two friends talking about a photograph.",
          stem: "What's the photograph of?",
          options: {
            A: "a sports stadium",
            B: "a zoo",
            C: "a school playground"
          }
        },
        {
          q: 19,
          context: "You will hear a woman talking to a friend on the phone.",
          stem: "Why's she upset?",
          options: {
            A: "Her train was delayed.",
            B: "She's lost her wallet.",
            C: "She's broken her glasses."
          }
        },
        {
          q: 20,
          context: "You will hear a woman talking to her friend, David, about something she's bought.",
          stem: "What has she bought?",
          options: {
            A: "some clothes",
            B: "some food",
            C: "some games"
          }
        }
      ]
    },
    {
      id: "part5",
      label: "Part 5",
      title: "Matching",
      range: "Questions 21-25",
      instruction: "You will hear Simon talking to Maria about a party. What will each person bring to the party? For each question, choose the correct answer.",
      type: "matching",
      lead: "You will hear Simon talking to Maria about a party.",
      taskQuestion: "What will each person bring to the party?",
      example: { person: "Maria", answer: "B", text: "cake" },
      options: {
        A: "bread",
        B: "cake",
        C: "cheese",
        D: "chicken",
        E: "fish",
        F: "fruit",
        G: "ice cream",
        H: "salad"
      },
      items: [
        { q: 21, person: "Barbara" },
        { q: 22, person: "Simon" },
        { q: 23, person: "Anita" },
        { q: 24, person: "Peter" },
        { q: 25, person: "Michael" }
      ]
    }
  ]
};
