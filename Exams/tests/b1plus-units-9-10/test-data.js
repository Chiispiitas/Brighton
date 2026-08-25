"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-b1plus-units-9-10",
  title: "B1+ Units 9–10 Test",
  subtitle: "Multiple Choice",
  level: "B1+",
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
        q(1, "I’d like ________ a class in Thai cooking, but I can’t find one.", "take", "to take", "taking"),
        q(2, "In restaurants in my country, the ________ is usually on the left and the knife is usually on the right.", "fork", "bowl", "tablecloth"),
        q(3, "We can’t serve lobster. Some people are allergic to ________.", "lamb chops", "soy sauce", "shellfish"),
        q(4, "Are you any good at ________ Japanese food?", "making", "make", "to make"),
        q(5, "How about some ________ cheese on your pasta?", "grated", "takeout", "boiled"),
        q(6, "You shouldn’t really add salt and ________ to your food without trying it first.", "squid", "pepper", "toast"),
        q(7, "French fries are just ________ potatoes that are fried.", "melted", "grilled", "sliced"),
        q(8, "They decided not ________ the new restaurant after reading the reviews.", "trying", "try", "to try"),
        q(9, "I’ve never tried chickpeas. What are they ________?", "look like", "like", "in"),
        q(10, "It’s your birthday, so we’re not going to cook tonight. Let’s ________!", "eat out", "get the check", "takeout"),
        q(11, "The café wasn’t very good. One table had no tablecloth and the other ________ were dirty.", "they", "one", "ones"),
        q(12, "We offered ________ and they suggested roast lamb.", "cook", "cooking", "to cook"),
        q(13, "“What’s the best thing about your mom’s cooking?” “Her ________ bread.”", "boiled", "takeout", "homemade"),
        q(14, "Mmm! There’s a lot of ________ in this tomato sauce. It smells absolutely delicious.", "garlic", "oil", "soy"),
        q(15, "________ ice cream is one of the things children love about their summer vacations.", "Eating", "Eat", "To eat"),
        q(16, "It’s a very popular restaurant. Have you thought about ________ a table there?", "reserve", "reserving", "to reserve"),
        q(17, "What kind of movie do you feel like ________?", "watch", "watching", "to watch"),
        q(18, "I don’t want a dessert or coffee, thanks. Should we just ________ the check?", "order", "ask", "get"),
        q(19, "If you like seafood, you might enjoy the ________.", "chickpeas", "zucchini", "squid"),
        q(20, "I’ll have a ________ of the chicken and lentil soup, please.", "plate", "bowl", "spoon")
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
        q(21, "Many people need a lot of ________ from the sun so they don’t get sunburned.", "connection", "information", "protection"),
        q(22, "I told him yesterday that I ________ a little late, but in the end, I was two hours late!", "am", "would be", "will be"),
        q(23, "Thieves have ________ $2,000,000 from a city bank.", "stolen", "mugged", "broken into"),
        q(24, "There is some ________ about which foods are healthy and which are not.", "decision", "situation", "confusion"),
        q(25, "The police ________ one of the suspects in last night’s burglary at the shopping center.", "have arrested", "have mugged", "have broken into"),
        q(26, "She asked me ________ coming to visit her.", "was I", "that I was", "if I was"),
        q(27, "The police are looking for two thieves. Both ________ are believed to be in their early twenties.", "suspects", "witnesses", "victims"),
        q(28, "He ________ he had lost his keys.", "said me that", "told that", "told me"),
        q(29, "________ the one hand, there’s less crime in this city than in the past. On the other hand, people’s fear of crime has increased.", "In", "On", "Of"),
        q(30, "I can see a ________ between health and exercise.", "connection", "protection", "decision"),
        q(31, "Did the police ask any ________ what they had seen?", "courts", "witnesses", "muggers"),
        q(32, "You ________ find it easier to learn Japanese if you practiced speaking more.", "will", "might", "can"),
        q(33, "One ________ of living in the city is that the level of crime is higher than in the country.", "disadvantage", "however", "sum up"),
        q(34, "Whose ________ was it to try to rob the bank?", "achievement", "decision", "protection"),
        q(35, "If Tony ________ more free time in the evenings, he’d join a gym.", "would have", "have", "had"),
        q(36, "The president promised yesterday that the ________ was going to try to reduce crime.", "protection", "disappointment", "government"),
        q(37, "When I was younger, my parents always told me that education ________ really important for my future.", "would be", "would", "be"),
        q(38, "We’ve been ________! Someone has broken into our house and stolen the TV and my laptop.", "burglarized", "mugged", "stolen"),
        q(39, "He said that they ________ a new car, but it was stolen the next day.", "have bought", "would buy", "had bought"),
        q(40, "The suspects were in ________ yesterday for stealing from the department store.", "law", "court", "theft")
      ]
    }
  ]
};
