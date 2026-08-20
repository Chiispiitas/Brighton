"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-a2-units-9-10",
  title: "A2 Units 9–10 Test",
  subtitle: "Multiple Choice",
  level: "A2",
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
        q(1, "I'm really bad with numbers, so I don't like ________ at all.", "geography", "IT", "math"),
        q(2, "I studied art in college ________ I love drawing.", "did", "because", "but"),
        q(3, "I'm going running because I want to ________.", "improve my diet", "get in shape", "join a gym"),
        q(4, "________ music at school?", "Did you study", "You studied", "Did you studied"),
        q(5, "I'd like ________ some new clothes for my vacation.", "buy", "to buy", "buying"),
        q(6, "In ________ you learn about people and places.", "biology", "geography", "science"),
        q(7, "I hope ________ some new friends when I start my new job.", "make", "making", "to make"),
        q(8, "Join a club! It's a great way to ________.", "improve your relationship", "earn more money", "meet someone new"),
        q(9, "________ interested in science at all in school?", "Were you", "You were", "Did you be"),
        q(10, "Children between the ages of 14 and 16 usually go to ________.", "high school", "elementary school", "college"),
        q(11, "My sister wants ________ a marathon – she runs ten kilometers every day!", "run", "to run", "running"),
        q(12, "I stopped buying books because I wanted to ________.", "save money", "improve my diet", "lose weight"),
        q(13, "Where ________ to college?", "you did go", "you went", "did you go"),
        q(14, "It can be difficult to ________ college.", "get into", "pass to", "do"),
        q(15, "Do you intend ________ French in college?", "studying", "to study", "study"),
        q(16, "Marco is wearing a suit because he ________ today.", "is going to buy a car", "is going to join a gym", "is going on an interview"),
        q(17, "I stopped eating potato chips and chocolate, ________ I lost weight very quickly!", "so", "because", "but"),
        q(18, "“Did you find chemistry difficult in school?” “No, ________.”", "I didn't", "I didn't find", "it wasn't"),
        q(19, "I ________ last year because I played tennis every day!", "saved money", "improved my diet", "lost weight"),
        q(20, "I enjoyed studying ________ because I like sports.", "art", "science", "PE")
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
        q(21, "My neighbor has ________ car on our road.", "the expensivist", "the most expensive", "the more expensive"),
        q(22, "My aunt's hair was ________ when she was 50, but my mother's hair is still dark.", "gray", "wavy", "straight"),
        q(23, "I think working in an office is ________ than studying!", "a lot easiest", "a lot easy", "a lot easier"),
        q(24, "I went to live in Canada ________ I was a child.", "when", "then", "because"),
        q(25, "She wanted to get in shape and now she's really ________.", "elderly", "short", "thin"),
        q(26, "My son is very ________. He often buys me presents.", "popular", "generous", "polite"),
        q(27, "Wow! Your bag is ________ than mine!", "heaviest", "more heavier", "much heavier"),
        q(28, "I failed the test and I had ________ grade in the whole class.", "the most bad", "the baddest", "the worst"),
        q(29, "Be careful! The castle is very old and dark. It's a little ________ to walk around it.", "dangerous", "ugly", "light"),
        q(30, "Her hair is beautiful – it's ________, so you can see her easily in a crowd.", "dark", "red", "brown"),
        q(31, "Carla is the ________ person in my office. She knows everything!", "smartest", "smarter", "more smart"),
        q(32, "I really like ________ hair, so I'm growing mine now.", "curly", "long", "bald"),
        q(33, "The lecture today was ________ than studying in the library.", "much more interesting", "much interesting", "most interesting"),
        q(34, "I was really busy, but my colleague was very ________ and helped me with my work.", "cheerful", "confident", "kind"),
        q(35, "My grandfather is ________ and my baby daughter loves putting her hands on his head!", "bald", "elderly", "tall"),
        q(36, "________ we got to the beach, the sun disappeared!", "Because", "Then", "When"),
        q(37, "I met my ________ friend at elementary school twenty years ago.", "oldest", "more older", "older"),
        q(38, "My office is really ________. People don't talk to each other.", "dirty", "unfriendly", "empty"),
        q(39, "This area of the city is ________ than where he lived before.", "less dangerous", "not dangerous", "little dangerous"),
        q(40, "Jemma doesn't understand why her grandfather is unhappy with her nose ________.", "glasses", "earrings", "piercings")
      ]
    }
  ]
};
