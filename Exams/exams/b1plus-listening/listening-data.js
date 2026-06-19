"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.listeningExam = {
  examId: "brighton-b1plus-listening-final",
  title: "Brighton B1+ Listening Final Exam",
  level: "B1+",
  skill: "Listening",
  maxScore: 25,
  parts: [
    {
      id: "part1",
      label: "Part 1",
      title: "Picture multiple choice",
      range: "Questions 1-7",
      instruction: "For each question, choose the correct answer. Pictures will be added later; temporary placeholders are shown for now.",
      type: "visualMultiple",
      items: [
        {
          q: 1,
          stem: "Which activity wasn't available?",
          options: {
            A: { label: "Museum", placeholder: "Picture A\nMuseum" },
            B: { label: "Gym", placeholder: "Picture B\nGym" },
            C: { label: "Swimming pool", placeholder: "Picture C\nSwimming pool" }
          }
        },
        {
          q: 2,
          stem: "How does the man travel if there's a problem?",
          options: {
            A: { label: "Train", placeholder: "Picture A\nTrain" },
            B: { label: "Car", placeholder: "Picture B\nCar" },
            C: { label: "Bus", placeholder: "Picture C\nBus" }
          }
        },
        {
          q: 3,
          stem: "What is the building going to be used for?",
          options: {
            A: { label: "Apartment building", placeholder: "Picture A\nBuilding" },
            B: { label: "Library", placeholder: "Picture B\nLibrary" },
            C: { label: "Art gallery", placeholder: "Picture C\nArt gallery" }
          }
        },
        {
          q: 4,
          stem: "Which membership allows a person to attend a presentation?",
          options: {
            A: { label: "Membership A", placeholder: "Picture A\nMembership calendar" },
            B: { label: "Membership B", placeholder: "Picture B\nMembership calendar" },
            C: { label: "Membership C", placeholder: "Picture C\nMembership calendar" }
          }
        },
        {
          q: 5,
          stem: "When does the woman want to book a library computer?",
          options: {
            A: { label: "Monday 19", placeholder: "Picture A\nMonday 19" },
            B: { label: "Tuesday 20", placeholder: "Picture B\nTuesday 20" },
            C: { label: "Wednesday 21", placeholder: "Picture C\nWednesday 21" }
          }
        },
        {
          q: 6,
          stem: "What is the man doing on Saturday?",
          options: {
            A: { label: "Meeting someone", placeholder: "Picture A\nMeeting" },
            B: { label: "Giving a present", placeholder: "Picture B\nPresent" },
            C: { label: "Helping someone", placeholder: "Picture C\nWheelchair" }
          }
        },
        {
          q: 7,
          stem: "Which item of food has the man's mother tried before?",
          options: {
            A: { label: "Biscuits", placeholder: "Picture A\nBiscuits" },
            B: { label: "Cheese", placeholder: "Picture B\nCheese" },
            C: { label: "Chocolate", placeholder: "Picture C\nChocolate" }
          }
        }
      ]
    },
    {
      id: "part2",
      label: "Part 2",
      title: "Multiple choice",
      range: "Questions 8-13",
      instruction: "For each question, choose the correct answer.",
      type: "multiple",
      items: [
        {
          q: 8,
          context: "You will hear two friends talking about a trip to the theatre.",
          stem: "What does the woman say about it?",
          options: {
            A: "The theatre offers cheaper entry to some students.",
            B: "It's not always necessary to show student ID.",
            C: "She is a part-time student."
          }
        },
        {
          q: 9,
          context: "You will hear two friends talking about the man's job.",
          stem: "The man",
          options: {
            A: "is looking for work as an accountant.",
            B: "is prepared to earn less money.",
            C: "knows what qualifications he needs."
          }
        },
        {
          q: 10,
          context: "You will hear a husband and wife talking about breakfast.",
          stem: "What does the wife say?",
          options: {
            A: "There isn't any cereal left.",
            B: "They need to buy bread.",
            C: "She would like to have the same drink as usual."
          }
        },
        {
          q: 11,
          context: "You will hear two friends talking about buying a bed.",
          stem: "The woman thinks the ones online",
          options: {
            A: "are better quality.",
            B: "might be cheaper.",
            C: "cost less in the furniture store."
          }
        },
        {
          q: 12,
          context: "You will hear two friends talking about going for a walk.",
          stem: "What do they both agree about?",
          options: {
            A: "The need to take an umbrella.",
            B: "The walk will be a healthy thing to do.",
            C: "They need to check the weather forecast."
          }
        },
        {
          q: 13,
          context: "You will hear two friends talking about a passport photograph.",
          stem: "What does the man say?",
          options: {
            A: "The shop assistants are really helpful.",
            B: "The post office is open in the evening.",
            C: "The nearest machine doesn't work."
          }
        }
      ]
    },
    {
      id: "part3",
      label: "Part 3",
      title: "Gap fill",
      range: "Questions 14-19",
      instruction: "For each question, write the correct answer in the gap. Write one or two words or a number or a date or a time.",
      type: "gap",
      lead: "You will hear a man called Russell talking about a new club in the community centre.",
      heading: "The Speakers' Club",
      items: [
        { q: 14, before: "For business presentations to colleagues or to get ready for an", after: "." },
        { q: 15, before: "Workshop leaders have a background in business or", after: "." },
        { q: 16, before: "Sessions start at", after: "." },
        { q: 17, before: "Members are invited to try one of our", after: "once a year." },
        { q: 18, before: "The first meeting is", after: ", but remember to reserve a place." },
        { q: 19, before: "Membership costs", after: "per year or payment can be made each month." }
      ]
    },
    {
      id: "part4",
      label: "Part 4",
      title: "Multiple choice",
      range: "Questions 20-25",
      instruction: "You will hear an interview with a student called Emily, who walks people's dogs. For each question, choose the correct answer.",
      type: "multiple",
      items: [
        {
          q: 20,
          stem: "What does Emily say about walking dogs?",
          options: {
            A: "It's a good business idea.",
            B: "It pays for some of her living expenses.",
            C: "It helps people get out of their house."
          }
        },
        {
          q: 21,
          stem: "Emily says her first customer",
          options: {
            A: "was her neighbour.",
            B: "was in hospital at the time.",
            C: "made her accept some money."
          }
        },
        {
          q: 22,
          stem: "What does Emily say about becoming a dog walker?",
          options: {
            A: "She enjoyed what she was doing.",
            B: "She had trouble arranging the walks around her studies.",
            C: "She spoke to people in the local shops."
          }
        },
        {
          q: 23,
          stem: "Emily explains that",
          options: {
            A: "she didn't get any work straightaway.",
            B: "she went to a customer's house.",
            C: "she met her first customer at the weekend."
          }
        },
        {
          q: 24,
          stem: "Emily says that her customers",
          options: {
            A: "are very busy.",
            B: "expect her to help them whenever they need it.",
            C: "have well-behaved dogs."
          }
        },
        {
          q: 25,
          stem: "What does Emily say about payment?",
          options: {
            A: "She charges people per hour.",
            B: "She discusses it with the customer.",
            C: "She charges what her friends recommended."
          }
        }
      ]
    }
  ]
};
