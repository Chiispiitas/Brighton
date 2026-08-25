"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-b1plus-units-1-2",
  title: "B1+ Units 1–2 Test",
  subtitle: "Multiple Choice",
  level: "B1+",
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
        q(1, "I’m busy right now, but I can ________ you a call later.", "do", "make", "give"),
        q(2, "I ________ my first cell phone – it was very basic!", "remember", "remembering", "am remembering"),
        q(3, "How many languages do you ________?", "talk", "speak", "say"),
        q(4, "I love my tablet. ________, I’m thinking of buying one for my children.", "In fact", "In a fact", "In actually fact"),
        q(5, "She often comments ________ my social media posts.", "to", "on", "in"),
        q(6, "Where does your English teacher come ________?", "from", "for", "to"),
        q(7, "To tell you the ________, I don’t really like social media.", "secret", "story", "truth"),
        q(8, "When I get a text message from one of my friends, I usually ________ to it right away.", "look", "answer", "reply"),
        q(9, "He ________ so many selfies on social media that they get really boring!", "shares", "is sharing", "sharing"),
        q(10, "I never ________ my phone before breakfast.", "listen", "look", "check"),
        q(11, "Do you ________ to be online to access social media?", "need", "needing", "necessary"),
        q(12, "Could you ________ more slowly, please?", "say", "speak", "tell"),
        q(13, "Wait a minute, please. ________ a text message.", "I send", "I’m need to send", "I’m sending"),
        q(14, "I always ________ to my best friend about my problems.", "say", "talk", "tell"),
        q(15, "What ________ at on my laptop?", "are you looking", "you look", "you are looking"),
        q(16, "In college, we don’t have to pay to ________ the Internet.", "connect", "access", "check"),
        q(17, "On the weekends, I ________ my messages.", "am not checking", "not check", "don’t check"),
        q(18, "Who ________ jokes in your family?", "usually tell", "usually does tell", "usually tells"),
        q(19, "How many times a day do you usually ________ your Facebook account?", "look", "check", "watch"),
        q(20, "I don’t understand my teacher when he speaks Spanish. He talks really ________.", "quickly", "quick", "quicker")
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
        q(21, "They went to college ________ they’d passed their final exams and left high school.", "after", "until", "before"),
        q(22, "What do you ________ do on Saturday afternoons?", "use to", "used to", "usually"),
        q(23, "It makes me so ________ when people don’t put the milk back in the fridge.", "annoy", "annoying", "annoyed"),
        q(24, "They were planning to get married, but suddenly, he ________ with her.", "ended up", "broke up", "went out"),
        q(25, "I ________ play the guitar when I was a teenager.", "used to", "usually", "’m used to"),
        q(26, "She ran pretty slowly and was ________ by her position in the race.", "disappointing", "disappointed", "disappoint"),
        q(27, "My brother and I never ________ much time together, but now we are good friends.", "use to spend", "had spent", "used to spend"),
        q(28, "________! The movie starts soon, and we’re waiting for you at the theater.", "Set off", "Go back", "Hurry up"),
        q(29, "I’m ________ by how many different languages you can hear in New York.", "fascinated", "depressed", "amazing"),
        q(30, "Did you hear how unlucky I was yesterday? ________ my keys and my phone.", "I was losing", "I’d lost", "I lost"),
        q(31, "She didn’t like the pants when she ________.", "tried them on", "paid them back", "set them off"),
        q(32, "I was ________ when I heard the news.", "shock", "shocking", "shocked"),
        q(33, "I can ________ the money at the end of the month.", "go back", "pay back", "go up"),
        q(34, "I stayed at work ________ it had stopped raining.", "before", "as soon as", "until"),
        q(35, "I’m looking forward to ________ up with old friends at the wedding.", "breaking", "catching", "hurrying"),
        q(36, "She was amazed when she found out that she ________ last week’s lottery.", "wins", "was winning", "’d won"),
        q(37, "I’m ________ dogs.", "terrifying to", "terrified of", "terrifying of"),
        q(38, "They always ________ early to avoid arriving late.", "run out", "hurry up", "set off"),
        q(39, "Sorry I didn’t answer the phone. I ________ a movie when you called.", "’d watched", "watched", "was watching"),
        q(40, "When I tried the T-shirt on at home, it didn’t fit. ________ the wrong size.", "I’d bought", "I was buying", "I buy")
      ]
    }
  ]
};
