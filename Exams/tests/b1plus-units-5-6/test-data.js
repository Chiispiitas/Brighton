"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-b1plus-units-5-6",
  title: "B1+ Units 5–6 Test",
  subtitle: "Multiple Choice",
  level: "B1+",
  unitRange: "5-6",
  totalQuestions: 40,
  maxScore: 40,
  pages: [
    {
      label: "Unit 5",
      shortLabel: "Unit 5",
      sourceLabel: "Unit 5 · Page 1",
      title: "Unit 5",
      unit: 5,
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1, "If I ________ money from anyone, I always pay it back as soon as I can.", "lend", "borrow", "take out"),
        q(2, "There was a ________ on the website. I couldn’t say no!", "special offer", "tax", "reasonable"),
        q(3, "I ________ buy a new bike this year. I’m not sure yet.", "might", "am going to", "will"),
        q(4, "I’m not going to ________ my money on expensive clothes.", "pay", "borrow", "waste"),
        q(5, "This cell phone is really terrible. I ________ access the Internet.", "can ever", "can even", "can’t even"),
        q(6, "I’ve forgotten my cash. ________ they accept this credit card, I’ll need to go home for my wallet.", "If", "Unless", "When"),
        q(7, "If those shoes are not ________, I’ll buy them tomorrow.", "sold out", "saved up", "paid back"),
        q(8, "I think that he ________ buy that tablet.", "may definitely", "will probably", "won’t probably"),
        q(9, "I can’t afford to buy any new clothes or shoes this month. I’m ________.", "broke", "wealthy", "loan"),
        q(10, "There’s an ATM in the mall, so ________ we get there, I’ll take out some money to pay you back.", "as soon as", "until", "unless"),
        q(11, "I don’t think ________ go to the restaurant tonight. I don’t have much money.", "I", "I’ll", "I won’t"),
        q(12, "I think I paid too much ________ on that. We usually pay 5%, not 6%.", "product", "tax", "shopping"),
        q(13, "I found a lot of special offers online. I ________ bought a new TV!", "even", "only", "never"),
        q(14, "That store is really popular, and they’re advertising the sale on TV, so the best items ________ sell out very quickly!", "are going to", "probably will", "won’t"),
        q(15, "If you can’t see the item on the shelves, ask the salesclerk if it’s ________.", "in delivery", "in product", "in stock"),
        q(16, "If you ________ him $50, he’ll pay it back when he gets home.", "lend", "might lend", "may lend"),
        q(17, "They’re ________ a new car. They’ll probably have enough money next year.", "saving up for", "saving up", "spending on"),
        q(18, "Unless I win the lottery, I ________ have a vacation this year.", "never will", "only won’t", "probably won’t"),
        q(19, "I’m not sure if he can go out with us this weekend. He ________ need to study.", "probably", "can", "may"),
        q(20, "I’ll probably open a new ________ when I start my job.", "ATM", "savings account", "checkout")
      ]
    },
    {
      label: "Unit 6",
      shortLabel: "Unit 6",
      sourceLabel: "Unit 6 · Page 2",
      title: "Unit 6",
      unit: 6,
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(21, "I ________ there for five years, but I left last September.", "’ve studied", "studied", "’ve been studying"),
        q(22, "In some countries, very young children go to ________ while their parents are at work.", "a nursery school", "an elementary school", "a college"),
        q(23, "Are both your grandparents still working, or have they already ________?", "gotten a promotion", "been fired", "retired"),
        q(24, "I ________ to Mexico four or five times.", "’ve been", "’ve been going", "’ve ever been"),
        q(25, "I was a terrible student in school. I never used to ________.", "get good grades", "cheat", "get into trouble"),
        q(26, "Antonio ________ the application form for a few days. I don’t think he really wants that job.", "had", "has been having", "has had"),
        q(27, "The person who applied for this job has a degree ________ nursing.", "in", "of", "to"),
        q(28, "I dream of getting a ________ job one day.", "working", "placement", "well-paid"),
        q(29, "At the end of each term, we get the ________ for our classes for the next term.", "grades", "experience", "schedule"),
        q(30, "He used to be a professor here, but I think he only ________ with us for about a year.", "worked", "has been working", "hasn’t worked"),
        q(31, "There’s a new training course for ________ people that helps them to get a job.", "employed", "unemployed", "employee"),
        q(32, "When I ________ my exams, I got a well-paid job.", "have passed", "passed", "will pass"),
        q(33, "I really don’t like people who ________ on exams. I think that’s so dishonest.", "cheat", "fail", "behave"),
        q(34, "The work is so interesting and ________. No two days are the same.", "various", "varied", "variety"),
        q(35, "“Why are you so wet?” “Because I ________ in the rain!”", "’ve walked", "’ve been walking", "’ve already walked"),
        q(36, "To apply for the job, just hand in your ________ to the receptionist.", "résumé", "notes", "experience"),
        q(37, "He’s a good student who takes a lot of notes to help him study ________ exams.", "to", "for", "in"),
        q(38, "I’ve only been working there for four months, and I’ve ________ gotten a promotion.", "yet", "until", "already"),
        q(39, "The working conditions are not very good at this company, so I think I’m going to ________.", "fired", "resign", "graduate"),
        q(40, "My job’s not very well paid, but I love it. It’s so ________.", "stressful", "rewarding", "temporary")
      ]
    }
  ]
};
