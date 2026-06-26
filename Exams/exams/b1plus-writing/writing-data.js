"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.writingExam = {
  examId: "brighton-b1plus-writing-final",
  title: "Brighton B1+ Writing Final Exam",
  level: "B1+",
  skill: "Writing",
  maxScore: 30,
  rubricProfile: "b1plus-writing",
  rubric: {
    level: "B1+",
    pictureDescriptionSubscales: ["Content", "Organization"],
    extendedWritingSubscales: ["Content", "Communicative Achievement", "Organization", "Language"],
    note: "Picture descriptions use only Content and Organization. Email and story tasks use the four writing subscales."
  },
  timeLimitMinutes: 40,
  wordRange: "100 words",
  parts: [
    {
      id: "part1",
      label: "Part 1",
      title: "Picture description",
      range: "Questions 1–2",
      instruction: "For each question, describe each picture. Write more than two sentences. Include as many details as you can.",
      type: "picture-description",
      items: [
        {
          q: 1,
          taskType: "Picture description",
          title: "Picture description 1",
          promptIntro: "Look at the picture and describe what you can see.",
          task: "Write more than two sentences. Include as many details as you can.",
          finalInstruction: "Describe the picture.",
          imageSrc: "assets/part1-picture-1.png",
          imageAlt: "Photo for Picture description 1",
          wordRange: "More than two sentences",
          minWords: 20,
          maxWords: 160,
          sourceTopic: "Brighton Intermediate English Test: Picture description"
        },
        {
          q: 2,
          taskType: "Picture description",
          title: "Picture description 2",
          promptIntro: "Look at the picture and describe what you can see.",
          task: "Write more than two sentences. Include as many details as you can.",
          finalInstruction: "Describe the picture.",
          imageSrc: "assets/part1-picture-2.png",
          imageAlt: "Photo for Picture description 2",
          wordRange: "More than two sentences",
          minWords: 20,
          maxWords: 160,
          sourceTopic: "Brighton Intermediate English Test: Picture description"
        }
      ]
    },
    {
      id: "part2",
      label: "Part 2",
      title: "Writing an email",
      range: "Question 3",
      instruction: "Write an email in about 100 words.",
      type: "email",
      items: [
        {
          q: 3,
          taskType: "Email",
          title: "Email: replying to Tania",
          promptIntro: "Read this email from your English-speaking friend Tania.",
          emailFrom: "Tania",
          emailSubject: "Your party",
          message: `Hi,

I’m so pleased you’ve invited me to your birthday party.

I’m really looking forward to seeing you.

Of course I want to buy you a present. I don’t know what you’d prefer – something to wear perhaps, or would you like the money to buy something yourself?

What time would you like me to arrive?

And would you like me to bring some food?

See you soon!

Tania`,
          task: "Write your email replying to Tania.",
          finalInstruction: "Write your email.",
          wordRange: "About 100 words",
          minWords: 80,
          maxWords: 120,
          sourceTopic: "Brighton Intermediate English Test: Email reply"
        }
      ]
    },
    {
      id: "part3",
      label: "Part 3",
      title: "Writing a story",
      range: "Question 4",
      instruction: "Write a story in about 100 words. Your story must begin with the sentence given.",
      type: "story",
      items: [
        {
          q: 4,
          taskType: "Story",
          title: "Story: surprise at the door",
          promptIntro: "Your English teacher has asked you to write a story.",
          storyStarter: "When I opened the door, I couldn’t believe my eyes.",
          task: "Write your story.",
          finalInstruction: "Your story must begin with this sentence.",
          wordRange: "About 100 words",
          minWords: 80,
          maxWords: 120,
          sourceTopic: "Brighton Intermediate English Test: Story writing"
        }
      ]
    }
  ]
};
