"use strict";
// Brighton English School · Original B1 Units 1–8 assessment.
window.writingExam = {
  "examId": "brighton-b1-writing-final",
  "title": "Brighton B1 Writing Final Exam",
  "level": "B1",
  "skill": "Writing",
  "maxScore": 30,
  "rubricProfile": "b1-writing",
  "rubric": {
    "level": "B1",
    "pictureDescriptionSubscales": [
      "Content",
      "Organization"
    ],
    "extendedWritingSubscales": [
      "Content",
      "Communicative Achievement",
      "Organization",
      "Language"
    ],
    "note": "Picture descriptions use only Content and Organization. Email and story tasks use the four writing subscales."
  },
  "timeLimitMinutes": 40,
  "wordRange": "100 words",
  "parts": [
    {
      "id": "part1",
      "label": "Part 1",
      "title": "Picture description",
      "range": "Questions 1–2",
      "instruction": "For each question, describe each picture. Write more than two sentences. Include as many details as you can.",
      "type": "picture-description",
      "items": [
        {
          "q": 1,
          "taskType": "Picture description",
          "title": "Picture description 1",
          "promptIntro": "Look at the picture and describe what you can see.",
          "task": "Write more than two sentences. Include as many details as you can.",
          "finalInstruction": "Describe the picture.",
          "imageSrc": "assets/picture-1.webp",
          "imageAlt": "Friends preparing a meal together in a kitchen",
          "wordRange": "More than two sentences",
          "minWords": 20,
          "maxWords": 160,
          "sourceTopic": "Personal Best B1 Units 1–8: food and socializing"
        },
        {
          "q": 2,
          "taskType": "Picture description",
          "title": "Picture description 2",
          "promptIntro": "Look at the picture and describe what you can see.",
          "task": "Write more than two sentences. Include as many details as you can.",
          "finalInstruction": "Describe the picture.",
          "imageSrc": "assets/picture-2.webp",
          "imageAlt": "People collecting trash beside a mountain lake",
          "wordRange": "More than two sentences",
          "minWords": 20,
          "maxWords": 160,
          "sourceTopic": "Personal Best B1 Units 1–8: nature and experiences"
        }
      ]
    },
    {
      "id": "part2",
      "label": "Part 2",
      "title": "Writing an email",
      "range": "Question 3",
      "instruction": "Write an email in about 100 words.",
      "type": "email",
      "items": [
        {
          "q": 3,
          "taskType": "Email",
          "title": "Email: a day in your town",
          "promptIntro": "Read this email from your English-speaking friend Alex.",
          "emailFrom": "Alex",
          "emailSubject": "Saturday in your town",
          "message": "Hi,\n\nI am coming to your town next Saturday and would love to spend the day with you.\n\nWhat time and where should we meet?\n\nI would like to try something new. What activity could we do together, and why do you think I would enjoy it?\n\nIs there a good place to have lunch? I do not eat meat.\n\nSee you soon!\nAlex",
          "task": "Write your email replying to Alex. Answer all the questions.",
          "finalInstruction": "Write your email.",
          "wordRange": "About 100 words",
          "minWords": 80,
          "maxWords": 120,
          "sourceTopic": "Personal Best B1 Units 1, 3, 7 and 8: activities, city travel and food"
        }
      ]
    },
    {
      "id": "part3",
      "label": "Part 3",
      "title": "Writing a story",
      "range": "Question 4",
      "instruction": "Write a story in about 100 words. Your story must begin with the sentence given.",
      "type": "story",
      "items": [
        {
          "q": 4,
          "taskType": "Story",
          "title": "Story: the sound beside the river",
          "promptIntro": "Your English teacher has asked you to write a story.",
          "storyStarter": "We were walking beside the river when we heard someone call for help.",
          "task": "Write your story.",
          "finalInstruction": "Your story must begin with this sentence.",
          "wordRange": "About 100 words",
          "minWords": 80,
          "maxWords": 120,
          "sourceTopic": "Personal Best B1 Units 2 and 6: stories, experiences and the natural world"
        }
      ]
    }
  ]
};
