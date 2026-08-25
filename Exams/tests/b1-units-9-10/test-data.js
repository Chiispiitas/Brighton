"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-b1-units-9-10",
  title: "B1 Units 9–10 Test",
  subtitle: "Multiple Choice",
  level: "B1",
  unitRange: "9-10",
  totalQuestions: 40,
  maxScore: 40,
  pages: [
    {
      label: "Unit 9",
      shortLabel: "Unit 9",
      sourceLabel: "Unit 9 · Page 1",
      title: "Unit 9",
      unit: 9,
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1, "How much is this house ________?", "cost", "worth", "paid"),
        q(2, "When I was in college, I ________ in a supermarket on Wednesdays and Saturdays.", "use to work", "was working", "used to work"),
        q(3, "“Can I try this on, please?” “Sorry, the ________ is very busy. Could you wait here?”", "department store", "dressing room", "shopping room"),
        q(4, "Kim ________ for being late.", "apologized", "apologies", "apology"),
        q(5, "This shopping center ________ in 2001.", "be built", "is built", "was built"),
        q(6, "I would like to ________ this dress, please. It’s too small.", "refund", "deliver", "return"),
        q(7, "________ have lunch at school?", "Did you use to", "Did you used to", "Used you to"),
        q(8, "My sister ________ me the money for a taxi home.", "borrowed", "paid", "lent"),
        q(9, "When I have all the ________, I’ll make a decision.", "inform", "information", "informations"),
        q(10, "Sorry, we don’t take cards here. Please ________ cash.", "deliver", "pay with", "pay on"),
        q(11, "When I was a child, we ________ in an apartment in Boston.", "use to live", "used to live", "usually lived"),
        q(12, "My car breaks down a lot, so I’m ________ for a new one next year.", "saving", "earning", "borrowing"),
        q(13, "________ is taken from your credit card immediately.", "Paying", "Pay", "Payment"),
        q(14, "Many children are taken care of ________ their grandparents during school vacations.", "at", "with", "by"),
        q(15, "I’d like to ________ this T-shirt for a bigger one, please.", "exchange", "return", "refund"),
        q(16, "He ________ money from his parents if he can’t pay the rent on his apartment.", "usually borrows", "used to borrow", "usually borrowed"),
        q(17, "________ are on Tuesdays and Fridays.", "Delivers", "Deliveries", "Deliverations"),
        q(18, "This camera is a ________. It’s half price.", "discount", "bargain", "sale"),
        q(19, "I love shopping for shoes. I ________ many pairs of sneakers and sandals.", "owe", "own", "spend"),
        q(20, "How much time at work ________ on social media?", "spends", "is spending", "is spent")
      ]
    },
    {
      label: "Unit 10",
      shortLabel: "Unit 10",
      sourceLabel: "Unit 10 · Page 2",
      title: "Unit 10",
      unit: 10,
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(21, "“Is Clara coming to Pilates with us?” “No, she said ________ to visit her grandmother.”", "she was going", "she going", "I’m going"),
        q(22, "The race starts in ten minutes and the athletes are already ________.", "taking part", "giving up", "warming up"),
        q(23, "He ________ finished the book yet.", "told that he hasn’t", "said that he hadn’t", "told that he hadn’t"),
        q(24, "It was very difficult to use the computer when I broke my ________.", "wrist", "ankle", "knee"),
        q(25, "Emilia ________ very far when she remembered that her laptop was at home.", "didn’t get", "hadn’t gotten", "wasn’t getting"),
        q(26, "The tennis player was badly injured, so the ________ stopped the match.", "referee", "umpire", "spectator"),
        q(27, "I’ve given up salty snacks, ________ potato chips and olives.", "such as", "such like", "such"),
        q(28, "Who ________ the most goals?", "scored", "tied", "won"),
        q(29, "“Did George see the game?” “Yes, he ________ it.”", "told to me he saw", "told me he’s seen", "told me he’d seen"),
        q(30, "Mark carried a lot of heavy boxes yesterday and now his ________ hurts.", "foot", "cheek", "back"),
        q(31, "The game ________, but some of the players were already giving up.", "hadn’t finished", "didn’t finish", "wasn’t finishing"),
        q(32, "She put the ________ around the player’s neck.", "trophy", "medal", "umpire"),
        q(33, "“What’s the answer to this question?” “She said ________ us tomorrow.”", "me she’d tell", "she’ll say", "she’d tell"),
        q(34, "Professional cyclists have strong ________ in their legs.", "elbows", "muscles", "chins"),
        q(35, "When I got home, there was a terrible smell in the kitchen because my children ________ the dinner.", "burned", "burns", "had burned"),
        q(36, "Melissa agreed to marry Sebastian and he put the ring on her ________.", "thumb", "toe", "finger"),
        q(37, "“I’m waiting for you in the café and I’m wearing a blue shirt.” “Sorry, I can’t hear you very well. Did you say ________ a blue skirt?”", "I was wearing", "you were wearing", "you wore"),
        q(38, "Don’t look at my cards! That’s ________!", "losing", "cheating", "scoring"),
        q(39, "It’s difficult to talk without moving your ________.", "lips", "forehead", "elbows"),
        q(40, "When I called, ________ TV? I thought I could hear someone talking.", "did you watch", "had you watched", "were you watching")
      ]
    }
  ]
};
