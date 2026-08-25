"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-b1-units-1-2",
  title: "B1 Units 1–2 Test",
  subtitle: "Multiple Choice",
  level: "B1",
  unitRange: "1-2",
  totalQuestions: 40,
  maxScore: 40,
  pages: [
    {
      label: "Unit 1",
      shortLabel: "Unit 1",
      sourceLabel: "Unit 1 · Page 1",
      title: "Unit 1",
      unit: 1,
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1, "I always carry my keys in my pocket. That’s why I never ________ them.", "miss", "remember", "lose"),
        q(2, "________ work in an office?", "Does you", "Do you", "Doesn’t you"),
        q(3, "I don’t want to wait for a bus. I’m ________! I prefer to walk.", "lazy", "impatient", "patient"),
        q(4, "________ to bring your laptop tomorrow.", "Remember", "Remind", "Expect"),
        q(5, "I ________ coffee after dinner.", "hardly ever drink", "drink hardly ever", "don’t hardly ever drink"),
        q(6, "Many people join clubs to ________ new people.", "meet up", "meet", "learn"),
        q(7, "Megan is ________. Her profile says she’s 24 and works in a bank, but she’s 20 and she’s a student.", "dishonest", "serious", "sociable"),
        q(8, "I’m very busy at work right now. ________ I relax at home on the weekend.", "Because", "That’s why", "So that"),
        q(9, "Julia wants to be a TV host because they ________ a lot of money.", "win", "earn", "take"),
        q(10, "Tim ________ at his friend’s house for two weeks.", "stays", "are staying", "is staying"),
        q(11, "Are you OK, Pilar? You ________ sick.", "look like", "look", "’re looking like"),
        q(12, "My new neighbors are really ________. They never say hello.", "patient", "rude", "polite"),
        q(13, "Many people say they want to ________ more time with their families.", "win", "lose", "spend"),
        q(14, "This lemon cake ________ me of my grandmother.", "tells", "remembers", "reminds"),
        q(15, "What do you do to ________ in shape?", "look", "stay", "go"),
        q(16, "She leaves the house late, so she ________ stressed when she gets to work.", "are always", "always is", "is always"),
        q(17, "In my free time, I’m learning ________.", "records", "movies", "the guitar"),
        q(18, "I don’t usually enjoy parties because I’m very ________.", "sociable", "shy", "selfish"),
        q(19, "There are a lot of people in here. I’ll ________ for you outside.", "hope", "meet", "wait"),
        q(20, "I love social media. I ________ blogs from my favorite artists every day.", "am reading", "do read", "read")
      ]
    },
    {
      label: "Unit 2",
      shortLabel: "Unit 2",
      sourceLabel: "Unit 2 · Page 2",
      title: "Unit 2",
      unit: 2,
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(21, "I was ________ to hear that my friend from elementary school worked in a zoo. She always hated animals.", "amazing", "surprising", "surprised"),
        q(22, "________ crying?", "Why you are", "Why are you", "Why do you be"),
        q(23, "We had coffee, ________ we went to the movies.", "then after", "after then", "then"),
        q(24, "“Did you go out on Saturday night?” “No, I ________.”", "not", "didn’t", "don’t"),
        q(25, "After a busy day at work, I think swimming is very ________.", "tired", "interesting", "relaxing"),
        q(26, "They met in 1984 and immediately ________.", "fell on love", "fell in love", "got in love"),
        q(27, "________ does she start her new job?", "When", "How long", "What"),
        q(28, "Please could you explain that again? I’m really ________.", "confusing", "confused", "annoyed"),
        q(29, "My grandmother was married for ten years before she ________ children.", "got", "born", "had"),
        q(30, "I couldn’t buy it because I ________ any money in my wallet.", "didn’t had", "didn’t have", "don’t had"),
        q(31, "I waited for you at the café, but ________, I decided to go home.", "after 40 minutes", "40 minutes after", "later 40 minutes"),
        q(32, "Isabel is ________ in geography. She’s going to study it at college.", "excited", "bored", "interested"),
        q(33, "How ________ children did your grandparents have?", "old", "much", "many"),
        q(34, "Diego is a famous chef now, but he ________ his career in a fast food restaurant.", "got", "started", "had"),
        q(35, "The results of the competition were very ________.", "disappointed", "surprising", "tiring"),
        q(36, "Which video game ________ yesterday?", "are you play", "did you play", "do you play"),
        q(37, "Where were you ________ three o’clock?", "at", "on", "last"),
        q(38, "I retired in 2005. ________, I took care of my grandchildren.", "After then", "After that", "After"),
        q(39, "________ is your middle name?", "How", "Who", "What"),
        q(40, "George got engaged to Helen ________.", "past year", "year ago", "last year")
      ]
    }
  ]
};
