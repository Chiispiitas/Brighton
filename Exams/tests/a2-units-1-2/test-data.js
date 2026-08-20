"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-a2-units-1-2",
  title: "A2 Units 1–2 Test",
  subtitle: "Multiple Choice",
  level: "A2",
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
        q(1, "This writing is very small. Here are your ________.", "glasses", "photos", "sunglasses"),
        q(2, "Manolo is Argentinian. He's from ________.", "Brazil", "Argentina", "Argentine"),
        q(3, "My friends ________ Portugal.", "from", "are", "are from"),
        q(4, "You ________.", "a good student are", "is a good student", "are a good student"),
        q(5, "This is my ________ phone.", "teachers'", "teachers", "teacher's"),
        q(6, "The number 468 in words is ________.", "four thousand and sixty-eight", "four hundred and sixty-eight", "four hundred and seventy-eight"),
        q(7, "“Lilia, is this ________ phone?” “Yes, it is.”", "yours", "your", "you"),
        q(8, "Your ________ has your name, photo, and date of birth.", "wallet", "change purse", "identity card"),
        q(9, "Jess is from Australia. She's ________.", "Australian", "British", "Austrian"),
        q(10, "A hundred and one in numbers is ________.", "110", "1001", "101"),
        q(11, "We ________ at home today.", "am not", "aren't", "isn't"),
        q(12, "________. It's an interesting language.", "I German like", "I like German", "German I like"),
        q(13, "Louis is French. He's from ________.", "The France", "Frence", "France"),
        q(14, "________ soccer team is really good. She's a great player.", "Its", "His", "Her"),
        q(15, "The number 1,000 in words is ________.", "one thousand", "one hundred", "ten hundreds"),
        q(16, "My ________ is at home. No money!", "wallet", "key", "tablet"),
        q(17, "________ his name Dario?", "Am", "Are", "Is"),
        q(18, "Tommy is from Dublin, in Ireland. He's ________.", "Irelandish", "Irish", "Irlandian"),
        q(19, "________ glasses are at home.", "Annas", "Anna's", "Anna"),
        q(20, "Our soccer games ________.", "very exciting are", "exciting very are", "are very exciting")
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
        q(21, "At 7 p.m., he has dinner and ________ TV.", "watches", "watchs", "watch"),
        q(22, "Miray is from Turkey. She works in a hotel and says hello to people. She's a ________.", "receptionist", "doctor", "police officer"),
        q(23, "I ________ friends on Saturday afternoons.", "go out", "meet", "go out for"),
        q(24, "We ________ school at about 3 p.m.", "do finish", "finishes", "finish"),
        q(25, "My cousin works in an office. She ________ things to customers. She's a businessperson.", "fixes", "sells", "cooks"),
        q(26, "It's good to ________ your family.", "go out", "relax", "spend time with"),
        q(27, "My dad is a chef, ________ on Sundays he doesn't cook. He plays tennis.", "and", "but", "or"),
        q(28, "They ________ friends for dinner a lot.", "don't meets", "doesn't meet", "don't meet"),
        q(29, "________ live in Spain all year?", "Do they", "Does they", "Doesn't they"),
        q(30, "Javier works in an office and he works with numbers. He's ________.", "a teacher", "a lawyer", "an accountant"),
        q(31, "You ________ a big car.", "doesn't have", "don't have", "don't has"),
        q(32, "Manu is a construction worker. He ________ people's houses.", "works", "sells", "fixes"),
        q(33, "Daniele ________ every morning for five kilometers.", "goes running", "studies", "meets friends"),
        q(34, "My parents work in an office. They help people with problems. They're ________.", "mechanics", "nurses", "lawyers"),
        q(35, "________ to school?", "How does you go", "How do you go", "How you go"),
        q(36, "On Saturdays, I go out for lunch with my family, ________ we watch TV at home in the evening.", "and", "do", "or"),
        q(37, "He ________ in his room and studies.", "listens to music", "goes out for coffee", "sees a movie"),
        q(38, "My mom ________ German in the evenings.", "studies", "studys", "study"),
        q(39, "I want to go to the movies tonight. What time do you ________ work?", "make", "cut", "finish"),
        q(40, "“Does your dad play soccer?” “________”", "No, he don't.", "No, he does.", "No, he doesn't.")
      ]
    }
  ]
};
