"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-a1-units-5-6",
  title: "A1 Units 5–6 Test",
  subtitle: "Multiple Choice",
  level: "A1",
  unitRange: "5-6",
  totalQuestions: 40,
  maxScore: 40,
  description: "Complete two pages. Page 1 uses Unit 5 page 1 and Page 2 uses Unit 6 page 2. Your answers are saved automatically on this device until you submit.",
  pages: [
    {
      label: "Unit 5",
      shortLabel: "Unit 5",
      sourceLabel: "Unit 5 · Page 1",
      title: "Unit 5",
      unit: 5,
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1, "I go to work by bike. I like ________!", "bike riding", "cleaning", "running"),
        q(2, "I don't go grocery shopping here ________ the food is expensive.", "because", "but", "also"),
        q(3, "“Can they swim?” “No, they ________.”", "don't", "can't", "can"),
        q(4, "We like ________ sports on TV.", "reading", "watching", "doing"),
        q(5, "I can't meet you tomorrow ________ I have Spanish class.", "also", "but", "because"),
        q(6, "She can ________ Indian food.", "cook", "cooks", "cooking"),
        q(7, "After a long day, Ana is in bed with her eyes closed. What is she doing?", "sleeping", "swimming", "shopping"),
        q(8, "I ________ four languages.", "sing", "spell", "speak"),
        q(9, "________ you walk to work?", "How", "Are", "Can"),
        q(10, "We ________ friends on the weekend.", "look", "meet", "know"),
        q(11, "Which device helps you find directions while driving?", "smartphone", "tablet", "GPS"),
        q(12, "My girlfriend works at my office. I travel to work on the subway with ________.", "her", "him", "us"),
        q(13, "I can't speak Italian. = ________", "I am Italian.", "I don't speak Italian.", "I don't like Italian."),
        q(14, "We don't have a ________ player.", "desktop", "DVD", "TV"),
        q(15, "My sister has two children. I sometimes take care of ________.", "them", "me", "us"),
        q(16, "I go to work by car. = I ________ to work.", "dance", "drive", "swim"),
        q(17, "My brother helps ________ with my homework.", "him", "her", "me"),
        q(18, "I don't like ________. I usually travel by car.", "swimming", "bike riding", "dancing"),
        q(19, "My grandmother ________ use a computer.", "don't", "can't", "not"),
        q(20, "We ________ soccer on Tuesdays.", "go", "do", "play")
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
        q(21, "Your laptop is ________ the bedroom.", "on", "in", "under"),
        q(22, "My wife has green ________.", "eyes", "teeth", "ears"),
        q(23, "Our house is ________ the school.", "between", "behind", "next"),
        q(24, "There ________ a movie theater downtown.", "'re", "'s", "are"),
        q(25, "I often meet friends at this ________ because the coffee is very good.", "park", "bank", "café"),
        q(26, "I can't walk because I have a bad ________.", "face", "foot", "arm"),
        q(27, "I ________ it's interesting.", "think", "like", "give"),
        q(28, "There are ________ nice stores here.", "any", "a", "some"),
        q(29, "In the kitchen, there's a table and there are six ________.", "desks", "chairs", "lamps"),
        q(30, "The sofa is in front ________ the TV.", "to", "at", "of"),
        q(31, "“Are there any people in the park?” “Yes, there ________.”", "are", "'re not", "'s not"),
        q(32, "I ________ like this town.", "does", "don't", "doesn't"),
        q(33, "You swim with your arms and ________.", "legs", "ears", "knees"),
        q(34, "We have a big blue ________ in our living room.", "stove", "bed", "sofa"),
        q(35, "Corinne is a receptionist in this ________.", "grocery store", "hotel", "shopping mall"),
        q(36, "I think my backpack is in the ________.", "closet", "window", "refrigerator"),
        q(37, "There are three shelves ________ the desk.", "next", "in front", "above"),
        q(38, "I don't think this city ________ beautiful.", "is", "'s not", "are"),
        q(39, "His keys are ________ the table.", "in", "on", "between"),
        q(40, "My grandfather's ________ is white.", "head", "hair", "hand")
      ]
    }
  ]
};
