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
        context: "A notice in a school library",
        image: "assets/part1-phone-free-study-zone.png",
        title: "Phone-free study zone",
        text: "Please put your phone away and keep it out of sight. This helps everyone concentrate and study quietly. Thank you for respecting our library.",
        stem: "What is the main message of this notice?",
        options: {
          A: "Students should keep their phones away while they study.",
          B: "Students may use their phones if they speak quietly.",
          C: "Students must leave the library if they bring a phone."
        }
      },
      {
        q: 2,
        context: "An email from a teacher",
        image: "assets/part1-sports-day-update.png",
        title: "Sports Day Update",
        text: "Due to the weather forecast, Sports Day will now take place next Friday, 23 May. All events and times will stay the same.",
        stem: "What does Mr Taylor want students to know?",
        options: {
          A: "Some events will start at different times.",
          B: "Sports Day has been moved to another date.",
          C: "Students should choose new events for Sports Day."
        }
      },
      {
        q: 3,
        context: "A notice near school reception",
        image: "assets/part1-lost-wallet.png",
        title: "Lost Wallet",
        text: "A black wallet was lost in the school library on Thursday 16th May. It contains ID and a bank card. Please return it to Reception.",
        stem: "What should someone do if they find the wallet?",
        options: {
          A: "Keep it until Thursday.",
          B: "Take it to Reception.",
          C: "Leave it in the library."
        }
      },
      {
        q: 4,
        context: "A public information poster",
        image: "assets/part1-city-bike-hire.png",
        title: "City Bike Hire",
        text: "Collect a bike from any bike hire station across the city. Return your bike to any bike hire station. Make sure it is locked.",
        stem: "What does the poster explain?",
        options: {
          A: "Bikes can be picked up and returned at different stations.",
          B: "Bikes must always be returned to the same station.",
          C: "Bikes are only available from one place in the city."
        }
      },
      {
        q: 5,
        context: "A shop sale poster",
        image: "assets/part1-black-friday-sale.png",
        title: "Black Friday Sale",
        text: "One day only. 20–50% off across the store. Open 9:00 AM–9:00 PM. In-store and online.",
        stem: "What is true about the sale?",
        options: {
          A: "It continues all weekend.",
          B: "It is available only in the shop.",
          C: "It lasts for one day and is online too."
        }
      }
    ]
  },
  {
    id: "part2",
    label: "Part 2",
    title: "Matching",
    range: "Questions 6–10",
    instruction: "The people below all want to choose a weekend activity. On the right there are descriptions of eight activities. Decide which activity would be the most suitable for each person.",
    optionsTitle: "Weekend Activities",
    options: [
      { letter: "A", title: "Silent Reading Café", text: "Bring your own book or choose one from our small shelf. Phones are switched off for two hours, and hot drinks are served quietly at your table. Best for people who want a calm break from screens." },
      { letter: "B", title: "City Photo Walk", text: "Explore old streets with a local guide and learn how to take better pictures with your phone or camera. The walk finishes at a small exhibition of city photographs." },
      { letter: "C", title: "Park Running Club", text: "Meet outside the sports centre every Saturday morning. Beginners are welcome, and the first three sessions are free. The group runs outdoors unless the weather is dangerous." },
      { letter: "D", title: "Vintage Games Afternoon", text: "Try board games and classic video games from different decades. You can play alone or in teams, and there is a short talk about how games have changed." },
      { letter: "E", title: "Young Film Makers Talk", text: "Students from a local film school explain how action scenes are planned safely. There will be clips, questions and practical advice for anyone interested in film, TV or stunt work." },
      { letter: "F", title: "Community Kitchen", text: "Learn to prepare simple healthy meals using cheap ingredients. The class is on Thursday evenings and ends with everyone eating together around one table." },
      { letter: "G", title: "Birdwatching Morning", text: "Join a natural-world expert for a walk by the river. You will learn to recognise common birds and hear how small changes in the weather affect them." },
      { letter: "H", title: "Reuse Fair", text: "An indoor market selling second-hand clothes, books and handmade gifts. Money raised goes to a local charity, and there are snacks from small neighbourhood cafés." }
    ],
    items: [
      { q: 6, name: "Mia", image: "assets/part2-mia.png", text: "Mia wants to spend time away from screens. She prefers a quiet place where she can read and relax by herself." },
      { q: 7, name: "Daniel", image: "assets/part2-daniel.png", text: "Daniel wants to get fitter with other people. He cannot spend much money and would enjoy being outside." },
      { q: 8, name: "Lara", image: "assets/part2-lara.png", text: "Lara wants to learn useful ideas for making healthier meals. She is only free after work in the evening." },
      { q: 9, name: "Tom", image: "assets/part2-tom.png", text: "Tom loves films and wants to understand how exciting scenes are made. He would like to ask questions to people with experience." },
      { q: 10, name: "Sara", image: "assets/part2-sara.png", text: "Sara wants to buy gifts without spending too much. She prefers an indoor place and likes activities that support other people." }
    ]
  },
  {
    id: "part3",
    label: "Part 3",
    title: "Multiple choice",
    range: "Questions 11–15",
    instruction: "Read the text and questions below. For each question, choose the correct answer.",
    articleTitle: "The week I put my phone away",
    image: "assets/part3-digital-detox.png",
    text: [
      "When my cousin suggested a phone-free week, I laughed. I use my phone for almost everything: messages, music, photos, homework reminders and the bus timetable. I told her that surviving without it would be impossible. She said that was exactly why I should try. In the end, I agreed, partly because I wanted to prove that I was not as dependent on my phone as everyone thought.",
      "The first morning was the hardest. I kept reaching for my pocket, even though the phone was in a drawer in the kitchen. I had not realised how often I checked it while doing other things. I checked it when I was bored, when I was nervous and even when I already knew nothing important had happened. Without it, small empty moments suddenly felt very long.",
      "By Wednesday, however, something had changed. I started carrying a small notebook and writing down things I usually typed into my phone. At first it felt old-fashioned, but then I noticed I remembered more. I also began reading again on the bus. I had always said I did not have time for books, but the truth was that I had been giving that time to short videos and messages.",
      "The biggest surprise was not silence but conversation. Because I was not looking down, people spoke to me more. A neighbour told me about a community garden near my flat, and I went there on Saturday. I did not take photos, so I had to describe it to my friends later. That made the experience feel more real, not less real.",
      "I got my phone back on Sunday evening. I was pleased to have it again, but I changed the way I used it. I deleted two apps, turned off most notifications and decided not to take it to bed. I still think smartphones are useful. I just no longer want mine to choose how I spend every quiet minute."
    ],
    items: [
      { q: 11, stem: "Why did the writer first agree to try a phone-free week?", options: { A: "She wanted to help her cousin with an experiment.", B: "She wanted to show that she could manage without her phone.", C: "She had already planned to stop using her phone.", D: "She needed to repair her phone for a week." } },
      { q: 12, stem: "What did the writer discover on the first morning?", options: { A: "She had forgotten how to travel by bus.", B: "Her family sent her too many messages.", C: "She used her phone more automatically than she had realised.", D: "Her phone was necessary for important information." } },
      { q: 13, stem: "What does the writer say about using a notebook?", options: { A: "It helped her remember things better.", B: "It made her feel embarrassed in public.", C: "It was useful only for school work.", D: "It was less convenient than she expected." } },
      { q: 14, stem: "What was the writer’s biggest surprise during the week?", options: { A: "She became interested in photography.", B: "She found the community garden disappointing.", C: "Her friends did not want to hear about her experience.", D: "She had more conversations with people around her." } },
      { q: 15, stem: "What is the writer’s opinion at the end of the text?", options: { A: "Phones are useful, but people should control when they use them.", B: "Phones are harmful and should be avoided completely.", C: "Phones are best used only for school and travel.", D: "Phones are less interesting than books and notebooks." } }
    ]
  },
  {
    id: "part4",
    label: "Part 4",
    title: "Gapped text",
    range: "Questions 16–20",
    instruction: "Five sentences have been removed from the text below. For each question, choose the correct answer. There are three extra sentences which you do not need to use.",
    articleTitle: "A garden for the whole street",
    image: "assets/part4-community-garden.png",
    text: [
      { type: "text", value: "The piece of land behind our apartment block had been empty for years. People used it as a shortcut, but nobody stayed there because it was full of rubbish and broken wood. Last spring, our neighbour Marta suggested turning it into a community garden. " },
      { type: "gap", q: 16 },
      { type: "text", value: " At the first meeting, only eight people came. Some wanted flowers, while others wanted vegetables. A few people were worried that the project would create noise or extra work. " },
      { type: "gap", q: 17 },
      { type: "text", value: " We began by clearing the rubbish on a Saturday morning. It was harder than we expected, but by lunchtime the ground already looked different. A local shop gave us some tools, and a school donated old wooden boxes for plants. " },
      { type: "gap", q: 18 },
      { type: "text", value: " During the summer, the garden became a place where people met without planning to. Children watered the tomatoes, older neighbours sat in the shade, and students revised for exams at the picnic table. " },
      { type: "gap", q: 19 },
      { type: "text", value: " Of course, there were problems. Someone forgot to lock the gate one evening, and two young plants were damaged. Instead of blaming anyone, Marta organised a simple timetable for looking after the place. " },
      { type: "gap", q: 20 },
      { type: "text", value: " Now, when I walk past the garden, I do not just see plants. I see neighbours who have learned each other’s names, shared ideas and made an ordinary space feel like home." }
    ],
    sentences: [
      { letter: "A", text: "That support made more people believe the plan could really work." },
      { letter: "B", text: "The weather had been too cold for anyone to plant anything outside." },
      { letter: "C", text: "However, everyone agreed that leaving the area as it was would be worse." },
      { letter: "D", text: "After that, people knew what to do and the arguments became less serious." },
      { letter: "E", text: "Marta had never liked eating vegetables before she moved into the building." },
      { letter: "F", text: "At first, I thought it was a nice idea but probably too difficult." },
      { letter: "G", text: "The city council refused to answer our emails about the problem." },
      { letter: "H", text: "It was not just a garden any more; it was a reason to talk." }
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
    articleTitle: "Cooking at home",
    text: [
      { type: "text", value: "More young people have started cooking at home. For many, the first reason is money, but there are other " },
      { type: "gap", q: 21 },
      { type: "text", value: ". When you prepare your own food, you can decide exactly what goes " },
      { type: "gap", q: 22 },
      { type: "text", value: " each dish. You can also avoid wasting food by using leftovers to make something " },
      { type: "gap", q: 23 },
      { type: "text", value: ". A simple vegetable soup, for example, may become a sauce the next day. The best cooks are not always the people with expensive equipment; they are the ones who " },
      { type: "gap", q: 24 },
      { type: "text", value: " attention to small details. They taste food while it is cooking and they are not afraid to make " },
      { type: "gap", q: 25 },
      { type: "text", value: ". After a few weeks, cooking can become a relaxing habit instead of a stressful " },
      { type: "gap", q: 26 },
      { type: "text", value: "." }
    ],
    items: [
      { q: 21, options: { A: "causes", B: "reasons", C: "results", D: "purposes" } },
      { q: 22, options: { A: "into", B: "on", C: "up", D: "by" } },
      { q: 23, options: { A: "ordinary", B: "fresh", C: "single", D: "narrow" } },
      { q: 24, options: { A: "pay", B: "take", C: "give", D: "put" } },
      { q: 25, options: { A: "changes", B: "differences", C: "movements", D: "exchanges" } },
      { q: 26, options: { A: "task", B: "tool", C: "order", D: "rule" } }
    ]
  },
  {
    id: "part6",
    label: "Part 6",
    title: "Open cloze",
    range: "Questions 27–32",
    instruction: "For each question, write the correct answer. Write one word for each gap.",
    articleTitle: "A weekend without a plan",
    text: [
      { type: "text", value: "Last month I spent a weekend in a small town near the coast. I had never been there " },
      { type: "gap", q: 27 },
      { type: "text", value: ", but a friend said it was worth visiting. Instead " },
      { type: "gap", q: 28 },
      { type: "text", value: " making a strict plan, I decided to see what happened. On Saturday morning, I followed a path which led from the station " },
      { type: "gap", q: 29 },
      { type: "text", value: " the beach. It was quieter " },
      { type: "gap", q: 30 },
      { type: "text", value: " I had expected. I soon realised that travelling slowly can be just " },
      { type: "gap", q: 31 },
      { type: "text", value: " interesting as visiting famous places. By the end of the weekend, I felt more confident about doing things " },
      { type: "gap", q: 32 },
      { type: "text", value: " myself." }
    ],
    items: [
      { q: 27 }, { q: 28 }, { q: 29 }, { q: 30 }, { q: 31 }, { q: 32 }
    ]
  }
];
