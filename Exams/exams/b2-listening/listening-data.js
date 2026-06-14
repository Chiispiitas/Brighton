"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.listeningExam = {
  examId: "brighton-b2-listening-final",
  title: "Brighton B2 Listening Final Exam",
  level: "B2",
  skill: "Listening",
  maxScore: 30,
  parts: [
    {
      id: "part1",
      label: "Part 1",
      title: "Multiple choice",
      range: "Questions 1-8",
      instruction: "You will hear people talking in eight different situations. For each question, choose the best answer (A, B or C).",
      type: "multiple",
      items: [
        {
          q: 1,
          context: "You hear part of a radio programme about people who can't hear musical beats.",
          stem: "What does the man say about being 'beat deaf'?",
          options: {
            A: "Many who believe they are beat deaf probably aren't.",
            B: "Beat deafness is connected with the speed of the music.",
            C: "Beat deaf people don't understand the idea of rhythm."
          }
        },
        {
          q: 2,
          context: "You hear two students talking about making a map of their local area.",
          stem: "What do they agree about?",
          options: {
            A: "how difficult it might be to use an online tool",
            B: "how helpful their geography teacher has been",
            C: "how important it is to do careful planning"
          }
        },
        {
          q: 3,
          context: "You hear two friends talking about a TV programme they have seen.",
          stem: "What does the woman say about the new salt product?",
          options: {
            A: "It is not likely to be successful.",
            B: "It will not offer value for money.",
            C: "It may not taste as good as normal salt."
          }
        },
        {
          q: 4,
          context: "You hear a teacher telling her students about a historical novel.",
          stem: "What is she doing?",
          options: {
            A: "describing its relevance to her students",
            B: "providing detailed information about the plot",
            C: "explaining why she bought the book"
          }
        },
        {
          q: 5,
          context: "You hear a man who is blind talking about experiencing travel through his sense of smell.",
          stem: "Why is he talking about this?",
          options: {
            A: "to persuade us to try out his technique",
            B: "to describe particular journeys he's made",
            C: "to explain how his skill makes him feel"
          }
        },
        {
          q: 6,
          context: "You hear a sports coach talking to a cyclist.",
          stem: "What is the coach doing?",
          options: {
            A: "praising the cyclist for her progress",
            B: "explaining why the cyclist feels a certain way",
            C: "encouraging the cyclist to eat better foods"
          }
        },
        {
          q: 7,
          context: "You hear an author talking to a friend about launching her new book.",
          stem: "How does the author feel now?",
          options: {
            A: "surprised by her publisher's behaviour",
            B: "worried about certain arrangements",
            C: "eager to carry out her plans"
          }
        },
        {
          q: 8,
          context: "You hear a sea captain talking to trainees about finding the way at sea.",
          stem: "What does he say sailors must do?",
          options: {
            A: "learn from the mistakes of older sailors",
            B: "study relevant charts while sailing",
            C: "be aware of their location at all times"
          }
        }
      ]
    },
    {
      id: "part2",
      label: "Part 2",
      title: "Sentence completion",
      range: "Questions 9-18",
      instruction: "You will hear a man called James Perry talking about growing olives, a kind of fruit used to make oil for food. For each question, complete the sentences with a word or short phrase.",
      type: "gap",
      heading: "Olive farming",
      items: [
        { q: 9, before: "As James' olives were growing, some trees were affected by an unexpected", after: "." },
        { q: 10, before: "James says that a kind of", after: "was one creature found on his olive trees." },
        { q: 11, before: "James decided to pick his olives by", after: "when they were ready." },
        { q: 12, before: "James collected his olives using a", after: "rather than a traditional container." },
        { q: 13, before: "James says he found cleaning", after: "out of the olives extremely boring." },
        { q: 14, before: "After sorting them, James said that the olives had left", after: "over his kitchen." },
        { q: 15, before: "At the olive press, James hadn't expected to wait in a", after: "." },
        { q: 16, before: "James' wife joked they could use his first oil in", after: "as well as for cooking." },
        { q: 17, before: "James says that the olives need to be", after: "when you pick them." },
        { q: 18, before: "James hopes next year's oil will have the flavour of", after: ", which he likes." }
      ]
    },
    {
      id: "part3",
      label: "Part 3",
      title: "Multiple matching",
      range: "Questions 19-23",
      instruction: "You will hear five short extracts in which people are talking about why they studied astronomy, the scientific study of stars and planets. For each question, choose from the list (A-H) the reason each speaker gives for choosing to study the subject. Use the letters only once. There are three extra letters which you do not need to use.",
      type: "matching",
      options: [
        { id: "A", text: "to gain access to the latest equipment" },
        { id: "B", text: "to follow a family tradition" },
        { id: "C", text: "to earn a good salary" },
        { id: "D", text: "to improve career opportunities" },
        { id: "E", text: "to prove something to other people" },
        { id: "F", text: "to apply knowledge of another subject" },
        { id: "G", text: "to increase the opportunity to travel" },
        { id: "H", text: "to satisfy a childhood ambition" }
      ],
      items: [
        { q: 19, speaker: "Speaker 1" },
        { q: 20, speaker: "Speaker 2" },
        { q: 21, speaker: "Speaker 3" },
        { q: 22, speaker: "Speaker 4" },
        { q: 23, speaker: "Speaker 5" }
      ]
    },
    {
      id: "part4",
      label: "Part 4",
      title: "Multiple choice",
      range: "Questions 24-30",
      instruction: "You will hear an interview with a life coach called Mel Candy, who helps people to achieve a work-life balance. For each question, choose the best answer (A, B or C).",
      type: "multiple",
      items: [
        {
          q: 24,
          stem: "Mel says that people who complain to her about being too busy",
          options: {
            A: "usually work in management positions.",
            B: "want her to tell them precisely what to do.",
            C: "enjoy the fact that it makes them seem important."
          }
        },
        {
          q: 25,
          stem: "Mel thinks that people who live and work alone",
          options: {
            A: "tend to lose track of time.",
            B: "worry about being isolated.",
            C: "can lose their social skills."
          }
        },
        {
          q: 26,
          stem: "What does Mel think about trying to do more than one task at a time?",
          options: {
            A: "She believes it's possible to learn to do it well.",
            B: "She sees why people think it's a good technique.",
            C: "She thinks it's important to research the idea."
          }
        },
        {
          q: 27,
          stem: "According to Mel, the expert answer to gaining work-life balance is to",
          options: {
            A: "change your work routine.",
            B: "achieve goals more quickly.",
            C: "look ahead at forthcoming events."
          }
        },
        {
          q: 28,
          stem: "Mel says it's difficult to achieve a work-life balance when people feel",
          options: {
            A: "concerned that others may judge them.",
            B: "worried they'll miss something important.",
            C: "scared of trying out new activities."
          }
        },
        {
          q: 29,
          stem: "What does Mel say about the advice a client gave her?",
          options: {
            A: "It made a difference to her own life.",
            B: "It confirmed why she likes to help people.",
            C: "It's something she shares with other clients."
          }
        },
        {
          q: 30,
          stem: "What does achieving a work-life balance mean for Mel?",
          options: {
            A: "feeling in control of her workload",
            B: "having more time for social activities",
            C: "achieving a state of physical relaxation"
          }
        }
      ]
    }
  ]
};
