"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-a1-units-9-10",
  title: "A1 Units 9–10 Test",
  subtitle: "Multiple Choice",
  level: "A1",
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
        q(1, "That ________ store is very expensive.", "shopping", "department", "market"),
        q(2, "Which item has a collar, buttons down the front, and short sleeves?", "shirt", "T-shirt", "suit"),
        q(3, "I have a new job. I'm very ________.", "hungry", "angry", "happy"),
        q(4, "You wear ________ on your feet.", "pants", "jeans", "socks"),
        q(5, "I ________ online because it's easy.", "shop", "spend", "try on"),
        q(6, "That's Emily in the ________ of the photo.", "middle", "left", "right"),
        q(7, "Christopher's not ________ his laptop at the moment.", "uses", "use", "using"),
        q(8, "I'm ________ because I can't go to the party tonight.", "excited", "sad", "surprised"),
        q(9, "I'm ________ wearing my glasses.", "don't", "no", "not"),
        q(10, "Which item is a warm knitted top with long sleeves?", "jacket", "sweater", "jeans"),
        q(11, "How ________ do you call your sister?", "many", "old", "often"),
        q(12, "What ________ cooking?", "are you", "you are", "do you"),
        q(13, "We go to the movies ________ a month.", "two", "twice", "time"),
        q(14, "Here's a photo of my grandfather. He's on the ________.", "corner", "middle", "right"),
        q(15, "Excuse me. Can I ________ on these shoes, please?", "try", "pay", "buy"),
        q(16, "We ________ studying today.", "not", "'re not", "'s not"),
        q(17, "I'm not ________. I had a big lunch.", "thirsty", "hungry", "angry"),
        q(18, "I like the ________ stores near my house.", "local", "online", "shopping"),
        q(19, "Which footwear covers your feet and ankles and is often worn outside?", "socks", "belts", "boots"),
        q(20, "“Are you going to bed?” “Yes, we ________.”", "going", "go", "are")
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
        q(21, "Which sport uses a ball and a hoop?", "volleyball", "basketball", "baseball"),
        q(22, "I ________ meeting Francesca on the weekend.", "don't", "'m not", "not"),
        q(23, "We often ________ family on the weekend.", "visit", "go", "stay"),
        q(24, "Please ________ home with me tonight.", "staying", "stay", "stayed"),
        q(25, "When did you ________ those boots?", "bought", "buying", "buy"),
        q(26, "I'm starting a new job ________ month.", "next", "late", "last"),
        q(27, "How often do you ________ yoga?", "do", "play", "go"),
        q(28, "________ your tickets for the concert here!", "Buys", "Buy", "Buying"),
        q(29, "I'm cooking for Luc and Abi ________ evening.", "next", "the", "this"),
        q(30, "________ Selena at the party yesterday?", "Were", "Was", "Does"),
        q(31, "Which type of music is commonly performed by popular mainstream singers?", "pop music", "classical music", "action music"),
        q(32, "________ your last name Chen?", "Does", "Is", "Are"),
        q(33, "Are you playing basketball ________?", "last", "late", "later"),
        q(34, "________ your brother play the guitar?", "Are", "Do", "Can"),
        q(35, "My children love staying ________ a tent!", "on", "in", "at"),
        q(36, "She's a DJ. She loves ________ music.", "electronic", "classical", "jazz"),
        q(37, "Please ________ walk on the grass.", "not", "don't", "doesn't"),
        q(38, "Which activity uses a board with black and white squares and game pieces?", "play chess", "play tennis", "play baseball"),
        q(39, "________ time does the class start?", "When", "What", "How"),
        q(40, "Do you like science-________ movies?", "horror", "fiction", "drama")
      ]
    }
  ]
};
