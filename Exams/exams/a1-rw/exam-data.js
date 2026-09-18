"use strict";
/* ==============================================
     Brighton English School
     Made by: David Santana
============================================== */

/*
  Brighton A1 Reading & Writing Final
  Task architecture: A1 Movers-style Reading & Writing.
  Language scope: Personal Best A1 Units 1–10 and the grammar already
  assessed in Brighton's Personal Best A1 unit tests.

  IMAGE PROMPT · PART 5
  Three-panel, wide horizontal editorial-style illustration for an A1 English exam,
  realistic but friendly and NOT childish, no text or labels. Panel 1: a young adult
  woman named Elena leaves home early with a small bag while a city bus approaches;
  a small hotel near the beach is visible in the distance. Panel 2: Elena works as a
  receptionist at a modern small hotel, then has lunch at a café next to the hotel;
  show a sandwich and orange juice. Panel 3: after work Elena meets her sister at a
  shopping mall, they look at clothes, then leave in a taxi. Clear uncluttered scenes,
  natural proportions, contemporary Latin American coastal city, landscape triptych.

  IMAGE PROMPT · PART 6
  Wide horizontal editorial-style illustration for an A1 English reading and writing
  exam, realistic but friendly and NOT childish, no text or labels. A modern Latin
  American city square/café district in daytime. Foreground: two young adult friends
  at an outdoor café table, one clearly drinking coffee and the other talking. Left:
  a young woman wearing a RED JACKET pays cash at a small market stall and carries a
  shopping bag. Right: a young man with a DARK BACKPACK stands beside a BUS STOP
  looking at his smartphone. A BLUE BICYCLE is parked NEXT TO A TREE. Include a taxi
  and ordinary shops/buildings in the background, mild sunny weather with a few
  clouds. Clear distinct objects, uncluttered composition, natural proportions,
  age-neutral adult/teen context, landscape 4:3, no captions, no brand names.
*/

window.examParts = [
  {
    id: "part1",
    label: "Part 1",
    title: "Vocabulary in context",
    range: "Questions 1–5",
    instruction: "Look at the picture placeholders and words. Read each definition and choose the correct word or phrase.",
    visualOptions: [
      { label: "a receptionist", imageDescription: "Picture placeholder: an adult hotel receptionist standing behind a reception desk." },
      { label: "a wallet", imageDescription: "Picture placeholder: a simple wallet with money and cards visible." },
      { label: "a department store", imageDescription: "Picture placeholder: the entrance of a large modern department store with clothing displays." },
      { label: "a train station", imageDescription: "Picture placeholder: a train station platform with a train and a station sign area, but no readable text." },
      { label: "an umbrella", imageDescription: "Picture placeholder: an open umbrella being used in the rain." },
      { label: "a sweater", imageDescription: "Picture placeholder: a folded sweater on a clothing display." },
      { label: "a museum", imageDescription: "Picture placeholder: the exterior of a modern museum building." },
      { label: "a taxi driver", imageDescription: "Picture placeholder: an adult taxi driver beside a city taxi." }
    ],
    items: [
      {
        q: 1,
        stem: "This person welcomes people and answers questions in a hotel or office.",
        options: {
          "a receptionist": "a receptionist",
          "a taxi driver": "a taxi driver",
          "a department store": "a department store",
          "a museum": "a museum",
          "a wallet": "a wallet",
          "a train station": "a train station",
          "an umbrella": "an umbrella",
          "a sweater": "a sweater"
        }
      },
      {
        q: 2,
        stem: "You keep money and cards in this personal item.",
        options: {
          "a wallet": "a wallet",
          "an umbrella": "an umbrella",
          "a sweater": "a sweater",
          "a receptionist": "a receptionist",
          "a museum": "a museum",
          "a train station": "a train station",
          "a department store": "a department store",
          "a taxi driver": "a taxi driver"
        }
      },
      {
        q: 3,
        stem: "You can buy clothes, shoes and other things in this large shop.",
        options: {
          "a department store": "a department store",
          "a museum": "a museum",
          "a train station": "a train station",
          "a wallet": "a wallet",
          "a sweater": "a sweater",
          "an umbrella": "an umbrella",
          "a receptionist": "a receptionist",
          "a taxi driver": "a taxi driver"
        }
      },
      {
        q: 4,
        stem: "You go here to catch a train.",
        options: {
          "a train station": "a train station",
          "a department store": "a department store",
          "a museum": "a museum",
          "a taxi driver": "a taxi driver",
          "a receptionist": "a receptionist",
          "a wallet": "a wallet",
          "an umbrella": "an umbrella",
          "a sweater": "a sweater"
        }
      },
      {
        q: 5,
        stem: "You use this when it is raining.",
        options: {
          "an umbrella": "an umbrella",
          "a sweater": "a sweater",
          "a wallet": "a wallet",
          "a receptionist": "a receptionist",
          "a train station": "a train station",
          "a department store": "a department store",
          "a museum": "a museum",
          "a taxi driver": "a taxi driver"
        }
      }
    ]
  },
  {
    id: "part2",
    label: "Part 2",
    title: "Everyday conversation",
    range: "Questions 6–11",
    instruction: "Look at the picture and read the conversation. For each question, choose the best answer: A, B or C.",
    context: "Leo is talking to Mia about her weekend and her plans.",
    imageDescription: "Picture placeholder: two young adults, Leo and Mia, talking in a modern shopping area. Mia is holding a shopping bag and a new jacket; a department store is visible behind them. Neutral contemporary style, not childish, no text.",
    items: [
      { q: 6, stem: "Leo: What did you do on Saturday?", replyLabel: "Mia", options: { A: "I went shopping with my sister.", B: "I go shopping every Saturday.", C: "I'm shopping now." } },
      { q: 7, stem: "Leo: Where did you buy that jacket?", replyLabel: "Mia", options: { A: "It was very cheap.", B: "At the new department store.", C: "I paid with cash." } },
      { q: 8, stem: "Leo: Was the store busy?", replyLabel: "Mia", options: { A: "Yes, there were a lot of people.", B: "Yes, I buy it there.", C: "Yes, it is near my house." } },
      { q: 9, stem: "Leo: How often do you go there?", replyLabel: "Mia", options: { A: "With my mother.", B: "About twice a month.", C: "Last Saturday." } },
      { q: 10, stem: "Leo: Are you doing anything this evening?", replyLabel: "Mia", options: { A: "Yes, I met them yesterday.", B: "Yes, I usually meet them.", C: "Yes, I'm meeting some friends." } },
      { q: 11, stem: "Leo: Do you want to go to the concert with us?", replyLabel: "Mia", options: { A: "At the museum.", B: "Yes, I want to.", C: "I went yesterday." } }
    ]
  },
  {
    id: "part3",
    label: "Part 3",
    title: "Story vocabulary",
    range: "Questions 12–17",
    instruction: "Look at the picture and read the story. Choose the correct answer for each gap. Then choose the best title for Question 17.",
    articleTitle: "Sofia and Daniel's weekend",
    imageDescription: "Picture placeholder: Sofia and Daniel, two young adults, visiting a small coastal town. Show a small hotel, a local market, rainy weather later in the day and a museum they can visit. Contemporary realistic style, not childish, no text.",
    text: [
      { type: "text", value: "Last weekend, Sofia and her brother Daniel took a bus to a small town near the ocean. They booked a room in a " },
      { type: "gap", q: 12 },
      { type: "text", value: ". On Saturday morning, the weather was " },
      { type: "gap", q: 13 },
      { type: "text", value: ", so they walked to the local " },
      { type: "gap", q: 14 },
      { type: "text", value: ". Sofia bought a hat, and Daniel bought a T-shirt. In the afternoon, it started to " },
      { type: "gap", q: 15 },
      { type: "text", value: ", so they visited a " },
      { type: "gap", q: 16 },
      { type: "text", value: ". On Sunday, they walked on the beach before taking the bus home. They were tired but happy." }
    ],
    items: [
      { q: 12, options: { hotel: "hotel", restaurant: "restaurant", "train station": "train station" } },
      { q: 13, options: { sunny: "sunny", cloudy: "cloudy", tired: "tired" } },
      { q: 14, options: { market: "market", museum: "museum", restaurant: "restaurant" } },
      { q: 15, options: { rain: "rain", shop: "shop", walk: "walk" } },
      { q: 16, options: { museum: "museum", restaurant: "restaurant", "train station": "train station" } },
      { q: 17, stem: "Choose the best title for the story.", options: { A: "A weekend near the ocean", B: "A day at work", C: "Shopping online" } }
    ]
  },
  {
    id: "part4",
    label: "Part 4",
    title: "Grammar in context",
    range: "Questions 18–22",
    instruction: "Read the text. Choose the correct answer for each gap.",
    articleTitle: "My daily routine",
    text: [
      { type: "text", value: "I work in a café near my house. I usually " },
      { type: "gap", q: 18 },
      { type: "text", value: " up at 6:30. I take a shower, get dressed and go to work " },
      { type: "gap", q: 19 },
      { type: "text", value: " bus. There " },
      { type: "gap", q: 20 },
      { type: "text", value: " a small market next to the café. I finish work at 4:00. This evening, I " },
      { type: "gap", q: 21 },
      { type: "text", value: " my friends at the shopping mall. We can " },
      { type: "gap", q: 22 },
      { type: "text", value: " dinner together." }
    ],
    items: [
      { q: 18, options: { A: "gets", B: "get", C: "getting" } },
      { q: 19, options: { A: "on", B: "at", C: "by" } },
      { q: 20, options: { A: "are", B: "is", C: "be" } },
      { q: 21, options: { A: "met", B: "am meeting", C: "meeting" } },
      { q: 22, options: { A: "having", B: "has", C: "have" } }
    ]
  },
  {
    id: "part5",
    label: "Part 5",
    title: "Reading for detail",
    range: "Questions 23–29",
    instruction: "Read the story and complete the answers. Write one, two or three words.",
    articleTitle: "Elena's first day at the hotel",
    picturePanels: [
      { title: "Picture 1", text: "Elena leaves home early. A city bus is arriving, and a small hotel near the beach can be seen in the distance." },
      { title: "Picture 2", text: "Elena works at the hotel reception desk. At lunchtime she is at the café next to the hotel with a sandwich and orange juice." },
      { title: "Picture 3", text: "After work Elena meets her sister at a shopping mall. Later, the two women leave in a taxi." }
    ],
    paragraphs: [
      "Last Monday, Elena started a new job as a receptionist at a small hotel near the beach. She got up at six o'clock, took a shower and got dressed. She left home at seven and went to work by bus.",
      "At lunchtime, Elena went to a café next to the hotel. She had a sandwich and orange juice. In the afternoon, a Canadian family asked about places in town. Elena talked about the museum and the local market.",
      "After work, Elena met her sister at the shopping mall. They tried on clothes but didn't buy anything. Then they went home by taxi. Elena was tired, but she was happy about her first day."
    ],
    items: [
      { q: 23, stem: "What was Elena's new job?" },
      { q: 24, stem: "Where was the hotel?" },
      { q: 25, stem: "How did Elena travel to work?" },
      { q: 26, stem: "Where did Elena go at lunchtime?" },
      { q: 27, stem: "Which two places did Elena talk about?" },
      { q: 28, stem: "Who did Elena meet after work?" },
      { q: 29, stem: "How did Elena and her sister go home?" }
    ]
  },
  {
    id: "part6",
    label: "Part 6",
    title: "Picture reading and writing",
    range: "Questions 30–35",
    instruction: "Look at the picture. Complete the sentences, answer the questions, and write two complete sentences about the picture.",
    imageTitle: "City café and market",
    imageDescription: "Image placeholder: an adult/teen city café and market scene. A woman in a red jacket is paying at a market stall; a man with a dark backpack is beside a bus stop; two friends are at a café and one is drinking coffee; a blue bicycle is next to a tree.",
    items: [
      { q: 30, type: "short", stem: "The woman at the market is wearing a red ________." },
      { q: 31, type: "short", stem: "The man near the bus stop has a ________ on his back." },
      { q: 32, type: "short", stem: "What is one person at the café drinking?" },
      { q: 33, type: "short", stem: "Where is the blue bicycle?" },
      { q: 34, type: "sentence", stem: "Write one complete sentence about the picture." },
      { q: 35, type: "sentence", stem: "Write another complete sentence about the picture." }
    ]
  }
];
