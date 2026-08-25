"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-b1-units-5-6",
  title: "B1 Units 5–6 Test",
  subtitle: "Multiple Choice",
  level: "B1",
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
        q(1, "If I have some free time later, I ________ running.", "go", "’m going", "’ll go"),
        q(2, "I ________ call my husband because I think I’m going to be home late.", "shouldn’t", "should", "don’t"),
        q(3, "Julieta felt ________ because she was late for her son’s basketball game.", "jealous", "guilty", "envious"),
        q(4, "I’m going to relax for an hour because I am ________.", "a headache", "the flu", "stressed"),
        q(5, "Katie passed her driving test today. Her parents are ________ proud.", "extremely", "a little", "a lot"),
        q(6, "They went to Russia and ________ an effort to speak the language.", "made", "did", "had"),
        q(7, "Where ________ I send the application form?", "will", "could", "should"),
        q(8, "Lorenzo ________ his finger on the stove while he was making soup.", "cut", "burned", "broke"),
        q(9, "I’ll make an excuse if I ________ to go to the party.", "won’t want", "don’t want", "didn’t want"),
        q(10, "It’s difficult to be ________ when you’re late and the traffic is bad.", "calm", "stressed", "nervous"),
        q(11, "When you’re giving a presentation, ________ a deep breath and try to relax before you start.", "take", "make", "have"),
        q(12, "Why don’t you ________ today? You look tired.", "take a nap", "have nap", "take nap"),
        q(13, "“How can I help you, Mrs. Romero?” “I ________.”", "’m feeling earache", "have an earache", "’m hurting my ear"),
        q(14, "She’s ________ happy because she didn’t get the job.", "very", "a little", "not very"),
        q(15, "________ to work if it’s sunny tomorrow?", "Do you walk", "Walk you", "Will you walk"),
        q(16, "Grace thanked Deepti and gave her some flowers. Deepti was ________.", "delighted", "cheerful", "confident"),
        q(17, "How many mistakes did you ________ on the test?", "make", "do", "have"),
        q(18, "Camilo doesn’t think ________ leave your job.", "you shouldn’t", "you should", "should you"),
        q(19, "I was very sick yesterday. I still have a cold, but I feel ________ better today.", "very", "really", "a little"),
        q(20, "I have a temperature, a headache, and a sore throat. I think I have ________.", "the flu", "stress", "a cough")
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
        q(21, "Don’t ________ the newspaper. I’m going to read it later.", "throw away", "look up", "hold on"),
        q(22, "Yesterday, we visited some of the local attractions and ________ saw a lot of wildlife.", "as well", "also", "too"),
        q(23, "Anna’s car ________ while she was driving to work.", "took up", "broke down", "ran out of"),
        q(24, "You can take a boat on the river through the ________.", "branch", "cliff", "valley"),
        q(25, "I ________ nervous if I was going for an interview tomorrow.", "’d be", "was", "be"),
        q(26, "I love ________, but I wouldn’t want to see a bear!", "wildlife", "roots", "waves"),
        q(27, "Can you ________ what time their flight arrives?", "take care of", "take up", "find out"),
        q(28, "I ________ a vacation in the mountains.", "haven’t never had", "ever had", "’ve never had"),
        q(29, "We would get more exercise if we ________ time.", "would have", "had", "have"),
        q(30, "There was a ________ while we were hiking. We were cold and miserable.", "thunderstorm", "shore", "peak"),
        q(31, "Alexandra ________ parachuting, but she usually likes adventure sports.", "has try", "not tried", "has never tried"),
        q(32, "A ________ isn’t as big as a river.", "stream", "shore", "lake"),
        q(33, "I didn’t understand the word, so I ________ in a dictionary.", "looked it at", "looked it up", "looked it"),
        q(34, "The ocean was calm, but we didn’t go swimming because there were a lot of ________.", "waves", "roots", "rocks"),
        q(35, "The ________ was amazing this morning. The sky turned really pink.", "sunrise", "rainforest", "sunset"),
        q(36, "If you went to the gym this morning, you ________ a nap later.", "could took", "can take", "could take"),
        q(37, "Rio de Janeiro is famous for the beaches on its ________.", "coast", "waves", "mountains"),
        q(38, "Your camera isn’t broken. You haven’t ________!", "turned it into", "turned it on", "filled it out"),
        q(39, "Please turn off the radio! I ________ this song three times today and I hate it.", "’m hearing", "hear", "’ve heard"),
        q(40, "He’s really angry because she hasn’t ________ the money.", "given back", "given up", "taken up")
      ]
    }
  ]
};
