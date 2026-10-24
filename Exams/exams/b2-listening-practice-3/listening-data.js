"use strict";

window.listeningExam = {
  examId: "brighton-b2-listening-practice-3",
  title: "Brighton B2 Listening Practice Test 3",
  storageKey: "brighton-b2-listening-practice-3-state-v1",
  level: "B2",
  skill: "Listening",
  maxScore: 30,
  parts: [
    {
      id: "part1", label: "Part 1", title: "Multiple choice", range: "Questions 1-8",
      instruction: "You will hear people talking in eight different situations. For each question, choose the best answer (A, B or C).",
      type: "multiple",
      items: [
        { q: 1, context: "You hear a man talking about planting flower seeds in his garden.", stem: "When does he expect them to grow?", options: { A: "June", B: "May", C: "April" } },
        { q: 2, context: "You hear two friends talking about when they last met.", stem: "What was the occasion?", options: { A: "a birthday party", B: "a wedding", C: "a Christmas party" } },
        { q: 3, context: "You hear a woman talking about the kind of book she currently enjoys reading.", stem: "What kind of book is it?", options: { A: "romance", B: "detective novel", C: "fairytale" } },
        { q: 4, context: "You hear two friends discussing the sports they play.", stem: "Which sport do they most enjoy playing?", options: { A: "basketball", B: "tennis", C: "volleyball" } },
        { q: 5, context: "You hear a shop assistant talking to a customer.", stem: "What is the customer looking for?", options: { A: "a shirt", B: "a suit", C: "a sweater" } },
        { q: 6, context: "You hear a man talking about his job as a lighting technician in a theatre.", stem: "How does he feel about tonight's performance?", options: { A: "concerned about making mistakes", B: "surprised to be so nervous about the experience", C: "excited about working in live theatre" } },
        { q: 7, context: "You hear a boy talking about school.", stem: "Which subject does he like best?", options: { A: "maths", B: "art", C: "history" } },
        { q: 8, context: "You hear a travel agent talking about a journey.", stem: "What is the customer's final destination?", options: { A: "Houston", B: "New York", C: "Los Angeles" } }
      ]
    },
    {
      id: "part2", label: "Part 2", title: "Sentence completion", range: "Questions 9-18",
      instruction: "You will hear a man called Tom Botham giving a talk about newspaper journalism. For each question, complete the sentences with a word or short phrase.",
      type: "gap", heading: "Journalism",
      items: [
        { q: 9, before: "Tom mentions business, news, sport and", after: "as examples of what journalists write about." },
        { q: 10, before: "Many journalists have a degree in journalism, though Tom took his in", after: "." },
        { q: 11, before: "Tom says it's important to gain a certificate in reporting, carrying out", after: "and editing." },
        { q: 12, before: "When applying for a job, Tom says you need to show a selection of", after: "you've written." },
        { q: 13, before: "Tom got experience of writing by working as a", after: "on a student magazine." },
        { q: 14, before: "Tom says journalists must have good communication and", after: "skills, in addition to personal characteristics such as motivation." },
        { q: 15, before: "Tom was able to demonstrate to employers his experience of", after: "." },
        { q: 16, before: "As a junior reporter, Tom was pleased to attend", after: "as well as other local events." },
        { q: 17, before: "In Tom's present job, he has a range of responsibilities and most enjoys doing", after: "." },
        { q: 18, before: "Tom is currently exploring the idea of working as a", after: "on the paper." }
      ]
    },
    {
      id: "part3", label: "Part 3", title: "Multiple matching", range: "Questions 19-23",
      instruction: "You will hear five short extracts in which people are talking about their favourite films. Choose the reason each speaker gives for his or her preference. Use the letters only once. There are three extra letters which you do not need to use.",
      type: "matching",
      options: [
        { id: "A", text: "It has a complex storyline." },
        { id: "B", text: "You want to know what happens next." },
        { id: "C", text: "It is highly amusing." },
        { id: "D", text: "It has an unexpected ending." },
        { id: "E", text: "It is very true to life." },
        { id: "F", text: "The special effects are interesting." },
        { id: "G", text: "The acting is outstanding." },
        { id: "H", text: "It has an unusual theme." }
      ],
      items: [
        { q: 19, speaker: "Speaker 1" }, { q: 20, speaker: "Speaker 2" },
        { q: 21, speaker: "Speaker 3" }, { q: 22, speaker: "Speaker 4" },
        { q: 23, speaker: "Speaker 5" }
      ]
    },
    {
      id: "part4", label: "Part 4", title: "Multiple choice", range: "Questions 24-30",
      instruction: "You will hear part of a radio interview with a woman called Alice Barker, who has a rare condition called synaesthesia. For each question, choose the best answer (A, B or C).",
      type: "multiple",
      items: [
        { q: 24, stem: "Alice describes her ability as", options: { A: "connecting emotions and words.", B: "linking colours and emotions.", C: "connecting colours with words." } },
        { q: 25, stem: "We are told that Alice developed this condition", options: { A: "because it is in her family.", B: "when she was a child.", C: "when she had children." } },
        { q: 26, stem: "When she was younger, Alice and her brother", options: { A: "used to think they were going mad.", B: "would argue about the colours connected with words.", C: "saw the same colours for certain words." } },
        { q: 27, stem: "Alice says that this ability", options: { A: "is directly associated with her moods.", B: "can make her feel depressed.", C: "makes her feelings more intense." } },
        { q: 28, stem: "What is the effect of Alice's condition on her reading?", options: { A: "It makes her read more descriptions of colours.", B: "It can encourage her to reread a sentence.", C: "It makes her avoid sentences with bright descriptions." } },
        { q: 29, stem: "Alice feels that having this condition", options: { A: "is very unpleasant at times.", B: "is generally not a problem.", C: "is not pleasant at all, on the whole." } },
        { q: 30, stem: "Doctors used to believe that this condition", options: { A: "made people insane.", B: "only affected the insane.", C: "indicated the person was going mad." } }
      ]
    }
  ]
};
