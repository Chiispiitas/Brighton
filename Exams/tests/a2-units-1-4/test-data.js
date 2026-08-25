"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-a2-units-1-4",
  title: "A2 Units 1–4 Test",
  subtitle: "Multiple Choice",
  level: "A2",
  unitRange: "1-4",
  totalQuestions: 80,
  maxScore: 80,
  pages: [
    {
      label: "Language 1",
      shortLabel: "Page 1",
      sourceLabel: "Units 1–4 · Page 1",
      title: "Vocabulary & Grammar",
      unit: "1-4",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1, "A person from France is French. A person from Poland is ________.", "Polish", "Poland", "Portuguese"),
        q(2, "You use these to see or read.", "gloves", "glasses", "sunglasses"),
        q(3, "You pay this person to take you somewhere in a car.", "taxi driver", "tour guide", "flight attendant"),
        q(4, "My uncle's son is my ________.", "nephew", "cousin", "brother"),
        q(5, "My mom keeps her money in her ________.", "wallet", "key", "identity card"),
        q(6, "I usually ________ friends at our favorite café in town on Saturdays.", "go out for", "meet", "listen to"),
        q(7, "I love cooking and eating in the yard with friends and family. Let's have a ________.", "picnic", "party", "barbecue"),
        q(8, "I don't drive in bad weather because it's difficult to see when it's raining, snowing, or ________.", "windy", "sunny", "foggy"),
        q(9, "The four seasons are ________, summer, fall, and winter.", "spring", "weather", "winter"),
        q(10, "My sister and brother-in-law have two ________. Their daughter's name is Martha and their son's name is Paul.", "children", "cousins", "parents"),
        q(11, "My aunt ________ a chef. She loves her job.", "are", "be", "is"),
        q(12, "Who ________ with your parents on weekends?", "you visit", "do you visit", "does you visit"),
        q(13, "I don't mind ________ soccer on TV.", "watching", "watch", "to watching"),
        q(14, "They ________ an Italian book right now.", "read", "reads", "are reading"),
        q(15, "My wife and I have three young children. We hardly ever ________ out for dinner.", "going", "go", "goes"),
        q(16, "He's a construction worker and he loves his job. He enjoys ________ to work.", "going", "go", "to go")
      ]
    },
    {
      label: "Language 2",
      shortLabel: "Page 2",
      sourceLabel: "Units 1–4 · Page 2",
      title: "Vocabulary & Corrections",
      unit: "1-4",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(17, "My friend is Chinese. He comes from ________.", "Chinese", "China", "Chile"),
        q(18, "In the winter when it's cold, I always wear ________.", "sandals", "shorts", "gloves"),
        q(19, "My brother travels all the time for his job. He's a ________. He loves flying!", "flight attendant", "tour guide", "waiter"),
        q(20, "In the evening, I often relax by playing the ________. I love music!", "gallery", "guitar", "game"),
        q(21, "My sister has a really nice daughter. I'm happy she's my ________.", "cousin", "aunt", "niece"),
        q(22, "You love art. Do you want to visit a ________ this Sunday?", "gallery", "garage", "garden"),
        q(23, "Every day Marta wakes up at 7 a.m. and then she ________.", "does a shower", "takes a shower", "makes a shower"),
        q(24, "The season after summer and before winter is ________.", "spring", "winter", "fall"),
        q(25, "My nephew is working as a ________ this summer. He serves food in a restaurant.", "waiter", "chef", "receptionist"),
        q(26, "My grandparents are from Lisbon and they live in Portugal. They're ________.", "Polish", "Portuguese", "Spanish"),
        q(27, "Choose the corrected sentence: Where is mine phone?", "Where is me phone?", "Where is my phone?", "Where is phone mine?"),
        q(28, "Choose the corrected sentence: We have not any milk.", "We haven't some milk.", "We don't have any milk.", "We doesn't have any milk."),
        q(29, "Choose the corrected sentence: He helps always me with my studies.", "He helps me always with my studies.", "He always helps me with my studies.", "He is always help me with my studies."),
        q(30, "Choose the correct phrase: Do you want to go to the movies ________?", "in the weekend", "on the weekend", "at weekend in"),
        q(31, "Choose the corrected sentence: Julia doesn't teaches Spanish.", "Julia doesn't teaches Spanish.", "Julia doesn't teach Spanish.", "Julia don't teach Spanish."),
        q(32, "Alex and Kate usually go to bed ________ midnight on Saturdays.", "on", "in", "at"),
        q(33, "Choose the corrected sentence: We always having a barbecue on Friday evenings.", "We always have a barbecue on Friday evenings.", "We always has a barbecue on Friday evenings.", "We always are have a barbecue on Friday evenings."),
        q(34, "I really enjoy ________ vacations with my family.", "planing", "plan", "planning"),
        q(35, "The soccer games ________ usually in the evenings.", "are", "is", "be"),
        q(36, "I like yoga, ________ I prefer doing karate.", "and", "but", "or"),
        q(37, "We can go to the café now ________ after the movie. What do you prefer?", "but", "and", "or"),
        q(38, "My brother really hates pizza and I hate pizza, ________.", "too", "also", "either"),
        q(39, "It's cold, wet, and it's ________ very windy.", "too", "also", "either"),
        q(40, "Do you like my sunglasses? ________ new.", "Their", "There", "They're")
      ]
    },
    {
      label: "Language in Context",
      shortLabel: "Page 3",
      sourceLabel: "Units 1–4 · Page 3",
      title: "Language in Context",
      unit: "1-4",
      instructions: "Choose the word or form that best completes each sentence.",
      questions: [
        q(41, "Family first? Family vacations are usually wonderful, ________ sometimes they are really difficult.", "also", "but", "or"),
        q(42, "Your fourteen- or ________-year-old sons and daughters want to play volleyball or go swimming.", "forty", "fourteen", "fifteen"),
        q(43, "Your fourteen- or fifteen-year-old sons and ________ want to play volleyball or go swimming.", "daughters", "cousins", "grandmothers"),
        q(44, "They want to ________ volleyball or go swimming in the afternoon.", "do", "play", "go"),
        q(45, "Their ________ wants to sit and read a book.", "daughter", "cousin", "grandmother"),
        q(46, "Their grandmother wants to sit and read a ________.", "book", "newspapering", "bike"),
        q(47, "Your wife wants to ________ shopping in the local town and visit a museum or gallery.", "do", "go", "play"),
        q(48, "The weather is sometimes another problem, too. It's sometimes ________ or cold on vacation.", "sunny", "dry", "rainy"),
        q(49, "It's nice to ________ a movie together.", "see", "read", "play"),
        q(50, "It's nice to see a movie together, and ________ for the whole family to go out for dinner.", "but", "also", "or"),
        q(51, "It's nice for the whole family to go ________ for dinner.", "in", "on", "out"),
        q(52, "On ________ days, some people love getting on their bikes.", "sunny", "rainy", "cold"),
        q(53, "Some people love getting on their bikes and they go ________ with their family.", "running", "bike riding", "shopping"),
        q(54, "On a great vacation, everyone ________ and has a good time.", "relax", "relaxing", "relaxes"),
        q(55, "And it's ________ vacation, too. You need to do what you enjoy!", "your", "you", "yours"),
        q(56, "Happy jobs? Teachers and nurses usually ________ that they really love their jobs.", "says", "say", "are saying"),
        q(57, "Construction workers and hairdressers ________ also very happy at work.", "are", "is", "be"),
        q(58, "These people don't mind ________ early.", "get up", "to get up", "getting up"),
        q(59, "They don't mind getting up early or ________ work very late.", "finish", "finishing", "to finishing"),
        q(60, "Construction workers often ________ in very bad weather, too.", "work", "works", "working"),
        q(61, "They ________ the weather is a problem because they love their job.", "doesn't think", "aren't think", "don't think"),
        q(62, "Many people really ________ jobs where they help people or make something.", "enjoys", "enjoy", "enjoying"),
        q(63, "They ________ jobs where they always do the same thing every day.", "don't like", "doesn't like", "aren't like"),
        q(64, "They don't like jobs where they always ________ the same thing every day.", "does", "doing", "do"),
        q(65, "My sister Lucinda is a nurse and today she's ________ late at the hospital.", "work", "working", "works"),
        q(66, "She says money ________ important.", "isn't", "doesn't", "aren't"),
        q(67, "In her job, she ________ new people every day.", "meet", "meeting", "meets"),
        q(68, "She really likes ________ people, too.", "help", "helping", "helps"),
        q(69, "________ your job?", "Do you love", "Are you love", "Does you love"),
        q(70, "________ something right now that you enjoy?", "Do you doing", "You are doing", "Are you doing")
      ]
    },
    {
      label: "Reading",
      shortLabel: "Page 4",
      sourceLabel: "Units 1–4 · Page 4",
      title: "Reading",
      unit: "1-4",
      instructions: "Read the text. Choose True, False, or Not enough information.",
      passage: {
        title: "Fun Activity Center",
        paragraphs: [
          "It doesn't matter what age you are – from eighteen to eighty-eight, come and have fun at our new activity center. We have something for everyone! Come alone or with your friends!",
          "Sports — There are a lot of activities to do: karate, yoga or bowling. You can go cycling or swimming, and you can play golf or volleyball with friends, too. Are these sports new for you? Don't worry – we have classes. There are karate and yoga lessons on Mondays and Wednesdays. Golf lessons are in the mornings from Thursday to Monday.",
          "Music — Do you enjoy listening to music? In the mornings, perhaps listen to music and, in the afternoon, learn to play the guitar or the violin and also to sing. You can practise with friends, too. Why not try dancing with us at our evening classes? We have great teachers.",
          "Culture — Our cultural activities are always after lunch. You can visit museums and galleries in the city with our tour guide. We have a coach to take you into town – don't worry. There's a programme of films for you to watch in the evenings. You choose the film! We have visitors from all over the world at the centre and you can practise your languages from Swedish to Vietnamese.",
          "Relaxing — You can relax at the centre and read a newspaper. You can meet your new friends and go out for a coffee, too – or do you just want to sit and watch a football match on TV? Anything is possible.",
          "Food — We enjoy our food at our centre. We cook breakfast and dinner for everyone every day, or you can have a takeaway or a snack. We sometimes have a barbecue in the summer, too. Tell us what you like. It's your choice!",
          "Accommodation — We sleep sixty people. All the rooms have two beds. And we have everything here – a doctor, a hairdresser and a nurse. All you need to bring with you are warm clothes, sunglasses and a torch for outside activities."
        ]
      },
      questions: [
        q(71, "The center is for adults, not children.", "False", "True", "Not enough information"),
        q(72, "You can learn a new sport.", "True", "Not enough information", "False"),
        q(73, "Bike riding is on Fridays.", "True", "False", "Not enough information"),
        q(74, "There is music all day.", "Not enough information", "True", "False"),
        q(75, "You need a friend to dance with.", "True", "False", "Not enough information"),
        q(76, "The center has movies in the mornings.", "Not enough information", "True", "False"),
        q(77, "You can meet new people.", "True", "Not enough information", "False"),
        q(78, "You can have coffee after lunch at the center.", "False", "Not enough information", "True"),
        q(79, "There are barbecues, but not every day.", "Not enough information", "False", "True"),
        q(80, "You need sixty people to visit the center.", "True", "Not enough information", "False")
      ]
    }
  ]
};
