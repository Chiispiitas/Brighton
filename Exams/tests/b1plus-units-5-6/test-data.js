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
      sourceLabel: "Unit 5 · Page 2",
      title: "Unit 5",
      unit: 5,
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1, "Sara bought a dress that’s ________ perfect for the wedding this summer.", "too", "even", "just"),
        q(2, "Tell Alexandra if you ________ an extra loan. She has plenty of money!", "need", "are need", "will be need"),
        q(3, "Check with the salesclerk about the fridge. You might not have to pay for ________.", "savings", "checkout", "delivery"),
        q(4, "I definitely ________ be home later than ten o’clock.", "might not", "may not", "won’t"),
        q(5, "If you ________ card, you don’t need to carry a lot of cash.", "pay for", "pay by", "pay on"),
        q(6, "Try the new supermarket. Their products are ________ cheaper than their online prices!", "more", "only", "even"),
        q(7, "I don’t think I ________ ever be wealthy.", "might", "will", "may"),
        q(8, "I just need to take some money out of the ________.", "cash", "cart", "ATM"),
        q(9, "I like to ________ online before visiting the store.", "deliver", "lend", "browse"),
        q(10, "If I ________ out of money, I usually borrow some from my parents or my brother.", "run", "will run", "may run"),
        q(11, "If I can get a good job, I’ll definitely get a ________ and buy a nice house.", "product", "cart", "mortgage"),
        q(12, "Next month, I’m sure I ________ have enough money to buy my new smartphone.", "might", "may", "will"),
        q(13, "If I have any extra cash, I just ________ my savings account.", "waste it on", "put it into", "return it"),
        q(14, "First, select the items you want. Then check everything in your ________ before you go to the checkout to pay.", "products", "cart", "credit card"),
        q(15, "Sometimes, the website says a product is in stock, but it’s only available ________.", "in-store", "by cash", "by offer"),
        q(16, "I ________ get married next year.", "think they won’t", "don’t think they will", "think they will not"),
        q(17, "In my opinion, money’s not the most important thing. You don’t need to be ________ to be happy.", "broke", "wealthy", "poor"),
        q(18, "I’ll stay in this store ________ you give me a refund!", "until", "even", "just"),
        q(19, "If I don’t have time to go shopping for fruit and vegetables, I often ________ them online.", "spend", "order", "waste"),
        q(20, "Last year, I got a ________ from the bank and paid it back in six months.", "loan", "savings account", "tax")
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
