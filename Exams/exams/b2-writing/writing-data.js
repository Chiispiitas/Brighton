"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.writingExam = {
  examId: "brighton-b2-writing-final",
  title: "Brighton B2 Writing Final Exam",
  level: "B2",
  skill: "Writing",
  maxScore: 40,
  wordRange: "140–190 words",
  parts: [
    {
      id: "part1",
      label: "Part 1",
      title: "Compulsory essay",
      range: "Question 1",
      instruction: "You must answer this question. Write 140–190 words in an appropriate style.",
      type: "essay",
      items: [
        {
          q: 1,
          taskType: "Essay",
          title: "Essay: environment and everyday action",
          promptIntro: "In your English class you have been talking about the environment. Now your English teacher has asked you to write an essay.",
          task: "Write an essay using all the notes and giving reasons for your point of view.",
          question: "Some people say that schools and companies should do much more to reduce waste and pollution. Do you agree?",
          notes: ["transport", "daily habits", "your own idea"],
          targetReader: "Your English teacher",
          sourceTopic: "Personal Best B2: Our planet / opinion essay"
        }
      ]
    },
    {
      id: "part2",
      label: "Part 2",
      title: "Choose one task",
      range: "Questions 2–4",
      instruction: "Answer one of these questions. Write 140–190 words in an appropriate style.",
      type: "choice-writing",
      items: [
        {
          q: 2,
          taskType: "Article",
          title: "Article: design that improves everyday life",
          promptIntro: "You see this announcement in your college English-language magazine.",
          announcementTitle: "Articles wanted: Better design, better lives",
          task: "Write an article about a product, building or public place that you think is well designed. Explain what makes the design useful and say how it could be improved even more.",
          closingLine: "The best articles will be published in next month’s magazine.",
          finalInstruction: "Write your article.",
          targetReader: "Readers of a college English-language magazine",
          sourceTopic: "Personal Best B2: The power of design / magazine article"
        },
        {
          q: 3,
          taskType: "Email",
          title: "Email: advice about learning and work",
          promptIntro: "Your English-speaking friend Sam has written to you for advice.",
          message: "I’m thinking of taking an online course while doing a part-time job. I’m worried I won’t have enough time, but I also don’t want to miss a good opportunity. What do you think I should do?",
          task: "Write an email to Sam giving your opinion. Suggest how Sam could organise the week and explain what problems to avoid.",
          finalInstruction: "Write your email.",
          targetReader: "An English-speaking friend",
          sourceTopic: "Personal Best B2: Lifelong learning / The business world"
        },
        {
          q: 4,
          taskType: "Review",
          title: "Review: a story that made you think",
          promptIntro: "You see this announcement on an English-language website for students.",
          announcementTitle: "Reviews wanted",
          task: "Have you read a book, watched a film or seen a series which made you think about facts, fake news or real life? Write a review describing it and explaining why it made an impression on you. Say whether you would recommend it to other students.",
          closingLine: "The best reviews will be posted on the website.",
          finalInstruction: "Write your review.",
          targetReader: "Readers of an English-language student website",
          sourceTopic: "Personal Best B2: Fact and fiction / personal recommendation"
        }
      ]
    }
  ]
};
