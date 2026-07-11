"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

window.examParts = [
  {
    id: "part1",
    label: "Part 1",
    title: "Short messages",
    range: "Questions 1–6",
    instruction: "For each question, choose the correct answer. Look at the notice, message or sign and choose A, B or C.",
    items: [
      {
        q: 1,
        context: "Notice at a community centre",
        visualTitle: "Cooking club",
        visualText: "Cooking Club\nTonight's class starts at 6:30, not 6:00. Bring a small container if you want to take food home.",
        image: "assets/part1-q1-cooking-club.png",
        stem: "What should people do?",
        options: {
          A: "Arrive half an hour earlier than usual.",
          B: "Bring something to carry food in.",
          C: "Cook the food at home before class."
        }
      },
      {
        q: 2,
        context: "Text message",
        visualTitle: "From Maya",
        visualText: "Hi Leo. I can't find my history book. Is it in your bag? I need it for homework, but I can collect it tomorrow morning.",
        image: "assets/part1-q2-maya-message.png",
        stem: "Why is Maya writing to Leo?",
        options: {
          A: "To ask if he has something of hers.",
          B: "To invite him to study history together.",
          C: "To tell him she finished her homework."
        }
      },
      {
        q: 3,
        context: "Sign in a clothes shop",
        visualTitle: "Changing rooms",
        visualText: "Changing rooms are closed today. You can return clothes within seven days. Please keep your receipt.",
        image: "assets/part1-q3-changing-rooms.png",
        stem: "What does the sign say?",
        options: {
          A: "Customers cannot try clothes on today.",
          B: "Customers must return clothes today.",
          C: "Customers can only buy clothes with cash."
        }
      },
      {
        q: 4,
        context: "School website message",
        visualTitle: "Sports day",
        visualText: "Sports day will be in the gym because of the rain. Students should wear trainers and bring a bottle of water.",
        image: "assets/part1-q4-sports-day.png",
        stem: "What has changed?",
        options: {
          A: "The place for the activity.",
          B: "The clothes students must wear.",
          C: "The day of the activity."
        }
      },
      {
        q: 5,
        context: "Note on a restaurant table",
        visualTitle: "Lunch menu",
        visualText: "Lunch menu: choose soup or salad with any sandwich. Ask your waiter for today's vegetarian option.",
        image: "assets/part1-q5-lunch-menu.png",
        stem: "What can customers do?",
        options: {
          A: "Choose two sandwiches for the same price.",
          B: "Ask about a meal without meat.",
          C: "Order lunch only after asking the waiter."
        }
      },
      {
        q: 6,
        context: "Message from a hotel",
        visualTitle: "Reception",
        visualText: "Reception closes at 10 p.m. If you arrive later, call us before 9 p.m. and we will send the door code.",
        image: "assets/part1-q6-reception.png",
        stem: "Guests who arrive late should",
        options: {
          A: "wait outside until reception opens.",
          B: "phone the hotel before 9 p.m.",
          C: "send the door code to reception."
        }
      }
    ]
  },
  {
    id: "part2",
    label: "Part 2",
    title: "Three short texts",
    range: "Questions 7–13",
    instruction: "For each question, choose the correct answer. Read the three short texts and choose A, B or C.",
    articleTitle: "Three students and their free time",
    options: [
      {
        letter: "A",
        name: "Nina",
        text: "I live near the centre of town, so I usually walk everywhere. On weekdays I study after school, but on Saturdays I help in my aunt's small cafe. I don't cook much there; I mostly take orders and clean tables. I enjoy meeting new people, and I like it when tourists ask me about places to visit. My best friend says I talk too much, but I think that is useful in a cafe. Next month I am going to start an online course about making desserts because I want to help more in the kitchen."
      },
      {
        letter: "B",
        name: "Oscar",
        text: "My family moved to a flat near the beach last year. It is smaller than our old house, but I prefer it because I can go swimming after class. I often make short videos about the weather and the sea. I was very shy before, so speaking to a camera felt strange at first. Now it is easier, and some classmates watch my videos. I never post anything during school time because I know I have to finish my homework first. At the weekend, I sometimes invite friends to play volleyball."
      },
      {
        letter: "C",
        name: "Lara",
        text: "I love old things, especially photographs and clothes from the past. My grandmother tells me stories about life in the 1980s, and I write them in a notebook. Last summer she gave me an old jacket, and I wore it to a school party. Everybody asked where I bought it! I am not very interested in sport, but I enjoy walking around the market on Sundays. I usually buy nothing because I am saving money for a train trip with my cousin. We are going to visit three cities in August."
      }
    ],
    items: [
      { q: 7, stem: "Who helps in a place where people eat?" },
      { q: 8, stem: "Who makes videos about the place where they live?" },
      { q: 9, stem: "Who is planning to learn more about food?" },
      { q: 10, stem: "Who has something that belonged to a family member?" },
      { q: 11, stem: "Who says they changed and became less shy?" },
      { q: 12, stem: "Who is saving money for a journey?" },
      { q: 13, stem: "Who gives visitors information about their town?" }
    ]
  },
  {
    id: "part3",
    label: "Part 3",
    title: "Reading multiple choice",
    range: "Questions 14–18",
    instruction: "For each question, choose the correct answer. Read the article and choose A, B or C.",
    articleTitle: "My first week in a new city",
    image: "assets/part3-new-city.png",
    imageAlt: "Teenage student with a backpack in a new city street near a bus stop and bookshop.",
    text: [
      "When I moved to Bristol with my family, I felt excited and worried at the same time. Our new flat was above a small bookshop, and my bedroom window looked down onto a busy street. At first the buses and people made too much noise, but after a few nights I began to like hearing the city wake up in the morning.",
      "On my first day at college, I got lost because I took the wrong bus. I was late for my first class, and I thought everyone would laugh. Instead, a girl called Amira showed me where to sit and lent me a pen. At break time she asked if I wanted to see the library. It was much bigger than the one at my old school, with comfortable chairs and a quiet room for studying.",
      "The hardest thing was not the work. It was knowing what to do after class. In my old town, I knew every street and every person in my group. In Bristol, I had to make new routines. I started by going to the same bakery every Tuesday. The woman there remembered my name after the third visit, and that small thing made the city feel friendlier.",
      "By Friday, Amira invited me to join her friends at a free concert in the park. I nearly said no because I was tired, but I went. The music was great, and I met two students who liked the same films as me. We are going to watch a film together next weekend.",
      "I still miss my old home, especially my grandparents' garden. But I have learned that a new place becomes familiar one small step at a time. You do not need to love everything immediately. You only need to begin."
    ],
    items: [
      { q: 14, stem: "How did the writer feel when the family moved?", options: { A: "Only happy", B: "Only afraid", C: "Both happy and nervous" } },
      { q: 15, stem: "What happened on the writer's first day at college?", options: { A: "Someone helped the writer.", B: "The writer arrived early.", C: "Everyone laughed at the writer." } },
      { q: 16, stem: "What was difficult for the writer after class?", options: { A: "Finding enough homework", B: "Creating new habits", C: "Understanding the teachers" } },
      { q: 17, stem: "Why was the bakery important to the writer?", options: { A: "It sold the cheapest food in the city.", B: "It helped the writer feel known.", C: "It was next to the college." } },
      { q: 18, stem: "What does the writer learn at the end?", options: { A: "New places become easier slowly.", B: "It is better not to move house.", C: "Friends are only important at college." } }
    ]
  },
  {
    id: "part4",
    label: "Part 4",
    title: "Multiple-choice cloze",
    range: "Questions 19–24",
    instruction: "For each question, choose the correct answer. Read the text and choose the best word for each gap.",
    articleTitle: "A school lunch project",
    text: [
      { type: "text", value: "Last month, our class started a project about food from different countries. First, we asked students what they usually " },
      { type: "gap", q: 19 },
      { type: "text", value: " for lunch. Many people brought sandwiches, but some students bought rice, soup or fruit from the school cafe. Then we made a wall chart with " },
      { type: "gap", q: 20 },
      { type: "text", value: " pictures of our favourite meals. Our teacher said we should write short texts under the pictures, so visitors could learn " },
      { type: "gap", q: 21 },
      { type: "text", value: " the food came from. On Friday, we invited parents to try a few dishes. There was not " },
      { type: "gap", q: 22 },
      { type: "text", value: " pasta, but there were a lot of small cakes. I made a salad with my brother because he is " },
      { type: "gap", q: 23 },
      { type: "text", value: " at cooking than I am. The best part was listening to people's stories. Food can show us " },
      { type: "gap", q: 24 },
      { type: "text", value: " people live and what they enjoy." }
    ],
    items: [
      { q: 19, options: { A: "eat", B: "eats", C: "ate" } },
      { q: 20, options: { A: "any", B: "some", C: "much" } },
      { q: 21, options: { A: "where", B: "when", C: "who" } },
      { q: 22, options: { A: "many", B: "few", C: "much" } },
      { q: 23, options: { A: "good", B: "better", C: "best" } },
      { q: 24, options: { A: "how", B: "because", C: "than" } }
    ]
  },
  {
    id: "part5",
    label: "Part 5",
    title: "Open cloze",
    range: "Questions 25–30",
    instruction: "For each question, write the correct answer. Write one word for each gap.",
    articleTitle: "A message from a hotel",
    text: [
      { type: "text", value: "Dear guests,\nWelcome to the Blue River Hotel. Breakfast is served " },
      { type: "gap", q: 25 },
      { type: "text", value: " 7:00 and 9:30 every morning. There " },
      { type: "gap", q: 26 },
      { type: "text", value: " a small cafe next to reception where you can buy drinks in the afternoon. If you would like " },
      { type: "gap", q: 27 },
      { type: "text", value: " visit the museum, ask at reception for a free map. We also have bikes " },
      { type: "gap", q: 28 },
      { type: "text", value: " you can use for two hours. Please return them before six o'clock. Yesterday some guests left " },
      { type: "gap", q: 29 },
      { type: "text", value: " keys in the restaurant, so please check your table before you leave. We hope you enjoy " },
      { type: "gap", q: 30 },
      { type: "text", value: " stay." }
    ],
    items: [
      { q: 25 }, { q: 26 }, { q: 27 }, { q: 28 }, { q: 29 }, { q: 30 }
    ]
  },
  {
    id: "part6",
    label: "Part 6",
    title: "Writing: Short message",
    range: "Question 31",
    instruction: "Write 25 words or more.",
    items: [
      {
        q: 31,
        promptTitle: "Write an email to a friend",
        prompt: "You are going to visit your friend's city next weekend. Write an email to your friend. In your email, say when you will arrive, ask about the weather, and suggest one activity to do together.",
        minWords: 25,
        checklist: ["say when you will arrive", "ask about the weather", "suggest one activity"]
      }
    ]
  },
  {
    id: "part7",
    label: "Part 7",
    title: "Writing: Picture story",
    range: "Question 32",
    instruction: "Look at the three pictures. Write the story shown in the pictures. Write 35 words or more.",
    items: [
      {
        q: 32,
        promptTitle: "Write the story shown in the pictures",
        minWords: 35,
        pictures: [
          { title: "Picture 1", image: "assets/part7-picture1-bus-stop-rain.png", text: "A student is waiting at a bus stop in the rain. The bus is late." },
          { title: "Picture 2", image: "assets/part7-picture2-umbrella.png", text: "The student meets a classmate and they share an umbrella." },
          { title: "Picture 3", image: "assets/part7-picture3-school-arrival.png", text: "They arrive at school together and laugh about the rainy morning." }
        ],
        checklist: ["describe the rainy morning", "include the classmate", "finish at school"]
      }
    ]
  }
];
