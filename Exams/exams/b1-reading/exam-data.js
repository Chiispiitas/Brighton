"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.examParts = [
  {
    id: "part1",
    label: "Part 1",
    title: "Short texts",
    range: "Questions 1–5",
    instruction: "For each question, choose the correct answer.",
    items: [
      {
        q: 1,
        context: "A notice at a school club board",
        image: "assets/part1-hobby-club.svg",
        title: "Weekend Hobby Club",
        text: "New members welcome! Come to Room 12 on Friday at 3:30 p.m. to choose an activity: chess, music, photography or running. Sign up before Friday morning so we can make the groups.",
        stem: "What should students do before Friday morning?",
        options: {
          A: "Write their names for the club.",
          B: "Choose a room for the meeting.",
          C: "Bring photos of their hobbies."
        }
      },
      {
        q: 2,
        context: "A message from a friend",
        image: "assets/part1-photo-exhibition.svg",
        title: "Photo exhibition",
        text: "Hi Leo, the city photo exhibition is still today, but it now starts at 5:00, not 4:00. I’m going after my English class, so meet me outside the library at 4:45. Maya",
        stem: "What has changed?",
        options: {
          A: "The place where they will meet.",
          B: "The time the exhibition starts.",
          C: "The person who is going with Leo."
        }
      },
      {
        q: 3,
        context: "A notice at a health centre",
        image: "assets/part1-health-centre.svg",
        title: "Health Centre Information",
        text: "If you have a cold or a high temperature, please do not wait in the main room. Call reception when you arrive and a nurse will tell you where to go.",
        stem: "What should patients with a cold do?",
        options: {
          A: "Wait with the other patients.",
          B: "Go home and make a new appointment.",
          C: "Phone reception when they arrive."
        }
      },
      {
        q: 4,
        context: "A transport poster",
        image: "assets/part1-city-card.svg",
        title: "City Travel Card",
        text: "Use one card for buses and trams all week. The card does not work for bike hire. Students pay less if they show their school ID when they buy it.",
        stem: "What does the poster say about the travel card?",
        options: {
          A: "It can be used on buses and trams.",
          B: "It is only for students with bicycles.",
          C: "It costs the same for everyone."
        }
      },
      {
        q: 5,
        context: "A food festival poster",
        image: "assets/part1-food-festival.svg",
        title: "Food Festival Saturday",
        text: "Entrance to the festival is free. Try food from local restaurants and listen to live music. Cooking classes cost $5 and must be booked at the information desk.",
        stem: "What is true about the festival?",
        options: {
          A: "Visitors must pay to enter.",
          B: "All activities at the festival are free.",
          C: "People pay extra for cooking classes."
        }
      }
    ]
  },
  {
    id: "part2",
    label: "Part 2",
    title: "Matching",
    range: "Questions 6–10",
    instruction: "The people below all want to choose an activity. On the right there are descriptions of eight activities. Decide which activity would be the most suitable for each person.",
    optionsTitle: "Activities",
    options: [
      { letter: "A", title: "Meet-up Café", text: "A relaxed Saturday afternoon for people who want to meet new friends. There are board games, simple conversation games and quiet tables for people who are shy at first." },
      { letter: "B", title: "Travel Stories Workshop", text: "Tell a short story about a holiday problem and learn how to organise events with words like first, then, after that and later. Bring one photo if you have one." },
      { letter: "C", title: "Future Jobs Morning", text: "Local workers explain what they do and how their jobs may change in the future. Students can ask about part-time work, interviews and useful skills." },
      { letter: "D", title: "Stress-free Study Session", text: "A school nurse gives advice about sleep, exercise and exam stress. The session includes breathing exercises and practical ideas for feeling calmer." },
      { letter: "E", title: "City Transport Challenge", text: "Small teams travel around the city by bus and tram, finding famous buildings, parks and useful services. Comfortable shoes are necessary." },
      { letter: "F", title: "Ice-cream Science Talk", text: "A food expert explains how ice cream is made and why flavours can taste too sweet or not sweet enough. There is a short tasting activity at the end." },
      { letter: "G", title: "Outdoor Survival Morning", text: "Learn simple skills for staying safe outside, including reading signs, checking weather and deciding what to do if you get lost." },
      { letter: "H", title: "Healthy Cooking Club", text: "Cook a cheap meal with vegetables and learn how to avoid wasting food. Everyone eats together at the end of the class." }
    ],
    items: [
      { q: 6, name: "Sofia", image: "assets/part2-sofia.svg", text: "Sofia wants to practise telling a personal story. She would like help putting the events in the correct order." },
      { q: 7, name: "Mateo", image: "assets/part2-mateo.svg", text: "Mateo is thinking about his future. He wants to hear from people with different kinds of work and ask them questions." },
      { q: 8, name: "Lina", image: "assets/part2-lina.svg", text: "Lina has been tired and worried recently. She wants advice about looking after her mind and body before exams." },
      { q: 9, name: "Alex", image: "assets/part2-alex.svg", text: "Alex enjoys exploring city places. He wants an active group activity and is interested in public transport." },
      { q: 10, name: "Nora", image: "assets/part2-nora.svg", text: "Nora loves sweet food and wants to learn something interesting about how a popular dessert is made." }
    ]
  },
  {
    id: "part3",
    label: "Part 3",
    title: "Multiple choice",
    range: "Questions 11–15",
    instruction: "Read the text and questions below. For each question, choose the correct answer.",
    articleTitle: "A new way to get to school",
    image: "assets/part3-bus-journey.svg",
    text: [
      "When my family moved to the other side of the city, I was not happy. I used to walk to school in ten minutes, but my new home was too far away. My father had just started a new job, so he could not drive me every morning. That meant I had to take the bus. At first, it felt like a problem, not a new experience.",
      "On the first Monday, I left home late because I could not find my student travel card. Then I waited at the wrong bus stop. I was beginning to feel nervous when an older student from my school asked if I needed help. She showed me the correct stop and told me which bus to take. I arrived just before the first lesson started.",
      "After a few days, the journey became easier. I began to notice things that I had never seen from a car: a small bakery opening early, a man walking three dogs, and children playing football in a tiny park. I also started reading on the bus. I had always said that I didn’t have time to read, but I had twenty quiet minutes every morning.",
      "The bus was not perfect. Sometimes it was crowded, and once it broke down in heavy rain. However, I learned to leave home ten minutes earlier, and that helped a lot. I also became friends with Maya, the student who had helped me on the first day. Now we usually sit together and talk about homework, music and weekend plans.",
      "I have taken the bus for three months now. It is not faster than going by car, but I feel more independent. I know my city better, and I no longer worry if my parents are busy. A small change in my routine has helped me feel more confident."
    ],
    items: [
      { q: 11, stem: "Why did the writer have to start taking the bus?", options: { A: "His father could not take him to school any more.", B: "His school asked all students to use public transport.", C: "He wanted to read more books before class.", D: "He had lost the way to his old school." } },
      { q: 12, stem: "What happened on the first Monday?", options: { A: "The writer missed the first lesson.", B: "The writer found his travel card on the bus.", C: "Another student helped the writer.", D: "The writer decided to walk to school instead." } },
      { q: 13, stem: "What positive thing did the writer discover about the journey?", options: { A: "It gave him time to read and notice the city.", B: "It was always faster than travelling by car.", C: "It made him enjoy football more.", D: "It helped him get a job in a bakery." } },
      { q: 14, stem: "Why does the writer leave home earlier now?", options: { A: "He wants to buy breakfast every morning.", B: "He has to meet his father before school.", C: "He dislikes sitting with other students.", D: "He wants to avoid problems with the journey." } },
      { q: 15, stem: "What is the main idea of the text?", options: { A: "Moving house always makes school life difficult.", B: "A new routine can become useful and enjoyable.", C: "Students should never travel by car.", D: "City buses are too crowded for young people." } }
    ]
  },
  {
    id: "part4",
    label: "Part 4",
    title: "Gapped text",
    range: "Questions 16–20",
    instruction: "Five sentences have been removed from the text below. For each question, choose the correct answer. There are three extra sentences which you do not need to use.",
    articleTitle: "The photo challenge",
    image: "assets/part4-photo-challenge.svg",
    text: [
      { type: "text", value: "Last month, our teacher gave us a photo challenge. We had to take three pictures of ordinary places in the city and write a short description of each one. " },
      { type: "gap", q: 16 },
      { type: "text", value: " The next afternoon, I walked home slowly instead of taking the quickest road. I looked at shops, doors, windows and people waiting at bus stops. " },
      { type: "gap", q: 17 },
      { type: "text", value: " My first photo was of an old man repairing a bicycle outside his building. I asked him before I took the picture, and he smiled. " },
      { type: "gap", q: 18 },
      { type: "text", value: " For my second photo, I went to the market. It was too crowded, and at first I tried to include everything: fruit, flowers, bags and people. The photo looked confusing. " },
      { type: "gap", q: 19 },
      { type: "text", value: " At the class exhibition, I was surprised by how different everyone’s pictures were. Some students showed busy streets, while others chose quiet corners or small details. " },
      { type: "gap", q: 20 },
      { type: "text", value: " Since then, I have carried my camera more often. I have learned that interesting stories can be very close to home." }
    ],
    sentences: [
      { letter: "A", text: "He also told me stories about the neighbourhood and how it had changed." },
      { letter: "B", text: "The teacher said we had to buy an expensive camera before Friday." },
      { letter: "C", text: "However, when I stopped for a few minutes, I began to see small details." },
      { letter: "D", text: "That made me understand that a good photo can change how we see daily life." },
      { letter: "E", text: "The bus driver was very kind and waited while I looked for my card." },
      { letter: "F", text: "At first, I thought it sounded too easy to be interesting." },
      { letter: "G", text: "I had never eaten so much spicy food in one day." },
      { letter: "H", text: "After that, I decided to focus on one small object instead of the whole scene." }
    ],
    items: [
      { q: 16 }, { q: 17 }, { q: 18 }, { q: 19 }, { q: 20 }
    ]
  },
  {
    id: "part5",
    label: "Part 5",
    title: "Multiple-choice cloze",
    range: "Questions 21–26",
    instruction: "For each question, choose the correct answer.",
    articleTitle: "Keeping fit without a gym",
    text: [
      { type: "text", value: "Many students would like to keep fit, but they often say they do not have " },
      { type: "gap", q: 21 },
      { type: "text", value: " time. There are simple " },
      { type: "gap", q: 22 },
      { type: "text", value: " to be more active during a normal day. You can " },
      { type: "gap", q: 23 },
      { type: "text", value: " the stairs instead of the lift, or walk to a nearby shop instead of going by bus. " },
      { type: "gap", q: 24 },
      { type: "text", value: " you get off the bus one stop early, you may have ten extra minutes of exercise. You may " },
      { type: "gap", q: 25 },
      { type: "text", value: " feel less stressed after moving your body. After a few weeks, these small actions can become a healthy " },
      { type: "gap", q: 26 },
      { type: "text", value: "." }
    ],
    items: [
      { q: 21, options: { A: "too", B: "enough", C: "many", D: "much" } },
      { q: 22, options: { A: "ways", B: "answers", C: "rules", D: "hopes" } },
      { q: 23, options: { A: "make", B: "do", C: "take", D: "have" } },
      { q: 24, options: { A: "Because", B: "If", C: "Although", D: "So" } },
      { q: 25, options: { A: "ever", B: "also", C: "just", D: "yet" } },
      { q: 26, options: { A: "risk", B: "hobby", C: "habit", D: "event" } }
    ]
  },
  {
    id: "part6",
    label: "Part 6",
    title: "Open cloze",
    range: "Questions 27–32",
    instruction: "For each question, write the correct answer. Write one word for each gap.",
    articleTitle: "A special birthday dinner",
    text: [
      { type: "text", value: "Last Saturday, my cousin invited me to her new flat. I had never been there " },
      { type: "gap", q: 27 },
      { type: "text", value: ", so I used a map. When I arrived, she " },
      { type: "gap", q: 28 },
      { type: "text", value: " making dinner and talking to two friends. There were too " },
      { type: "gap", q: 29 },
      { type: "text", value: " people in the kitchen, so I helped to lay the table. I don’t usually eat spicy food, but this meal was " },
      { type: "gap", q: 30 },
      { type: "text", value: " too hot for me. After dinner, we listened " },
      { type: "gap", q: 31 },
      { type: "text", value: " music and looked at photos from her last holiday. It was the first time I had met some of her friends, but everyone was kind " },
      { type: "gap", q: 32 },
      { type: "text", value: " me." }
    ],
    items: [
      { q: 27 }, { q: 28 }, { q: 29 }, { q: 30 }, { q: 31 }, { q: 32 }
    ]
  }
];
