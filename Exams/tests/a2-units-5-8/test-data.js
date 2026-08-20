"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-a2-units-5-8",
  title: "A2 Units 5–8 Test",
  subtitle: "Multiple Choice",
  level: "A2",
  unitRange: "5-8",
  totalQuestions: 80,
  maxScore: 80,
  pages: [
    {
      label: "Language 1",
      shortLabel: "Page 1",
      sourceLabel: "Units 5–8 · Page 1",
      title: "Vocabulary & Grammar",
      unit: "5-8",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1, "These are shoes you wear for sports.", "boots", "sneakers", "sandals"),
        q(2, "You can collect these or use them to buy something.", "stamps", "bracelets", "coins"),
        q(3, "This is a room where you cook.", "bathroom", "garage", "kitchen"),
        q(4, "This is where you can go to see big sports events.", "theater", "stadium", "gallery"),
        q(5, "Meat, fish, and cheese all contain this.", "sugar", "fiber", "protein"),
        q(6, "We usually buy cereal in a packet or a ________.", "bottle", "box", "jar"),
        q(7, "We keep our milk cold in the ________.", "stove", "cabinet", "fridge"),
        q(8, "Some people go to ________ to study after they finish high school.", "college", "library", "stadium"),
        q(9, "Earrings, necklaces, and bracelets are types of ________.", "clothes", "jewelry", "furniture"),
        q(10, "This room usually has a sofa, some armchairs, and often a TV.", "kitchen", "study", "living room"),
        q(11, "I live in Rio de Janeiro, but I ________ New York right now.", "am visiting", "visit", "visited"),
        q(12, "There ________ any chocolate and I need some!", "isn't", "aren't", "wasn't"),
        q(13, "I ________ to college three years ago.", "go", "goes", "went"),
        q(14, "We ________ a lot of books last weekend.", "buy", "bought", "buying"),
        q(15, "She called the mechanic yesterday and ________ to him about the car.", "spoke", "speak", "speaked"),
        q(16, "Look! It was sunny this morning, but now it's ________. You need an umbrella and your boots.", "snowing", "snow", "snows")
      ]
    },
    {
      label: "Language 2",
      shortLabel: "Page 2",
      sourceLabel: "Units 5–8 · Page 2",
      title: "Vocabulary & Corrections",
      unit: "5-8",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(17, "It's really cold – put your gloves, hat, and ________ on.", "scarf", "coat", "sweater"),
        q(18, "The last day of the fourth month is the ________ of April.", "twentieth", "thirtieth", "thirteen"),
        q(19, "I have a lot of cabinets and ________ in my room for my books.", "stairs", "sofas", "shelves"),
        q(20, "I like ________ furniture, but my parents prefer traditional styles.", "metal", "messy", "modern"),
        q(21, "I like vegetable soup. My favorite is ________ soup, but I like carrot soup, too.", "meat", "milk", "mushroom"),
        q(22, "Can I have a ________ of chocolate, please?", "packet", "piece", "bottle"),
        q(23, "I hate using the ________ at home. It cleans the floor, but it's very noisy!", "video camera", "washing machine", "vacuum cleaner"),
        q(24, "We got home and ________ dinner immediately.", "added", "asked", "ate"),
        q(25, "It wasn't very warm yesterday, so Jonathan wore ________ to work instead of shorts.", "pajamas", "purses", "pants"),
        q(26, "I put my jeans in the washing machine this morning. They were really ________.", "dry", "dark", "dirty"),
        q(27, "Choose the corrected sentence.", "I'm sorry, but I can't helping you.", "I'm sorry, but I can't to help you.", "I'm sorry, but I can't help you."),
        q(28, "Choose the corrected sentence.", "My laptop is at the table.", "My laptop is on the table.", "My laptop is in the table."),
        q(29, "Choose the corrected sentence.", "I like the bathroom, but it isn't very big.", "I like the bathroom, but it isn't much big.", "I like the bathroom, but it doesn't pretty big."),
        q(30, "Choose the corrected sentence.", "How much rice do you want?", "How many rice do you want?", "How a lot rice do you want?"),
        q(31, "Choose the corrected sentence.", "She likes cake, but she prefers ice cream.", "She likes cake, but she prefer ice cream.", "She likes cake, but she is prefer ice cream."),
        q(32, "Choose the corrected sentence.", "Can I have few milk for my tea, please?", "Can I have a little milk for my tea, please?", "Can I have a few milk for my tea, please?"),
        q(33, "Choose the corrected sentence.", "They didn't enjoyed the concert.", "They didn't enjoy the concert.", "They don't enjoyed the concert."),
        q(34, "Choose the corrected sentence.", "There isn't much pasta for dinner.", "There aren't many pasta for dinner.", "There isn't much pastas for dinner."),
        q(35, "I hate watching soccer. It's really ________. I go to sleep when I watch it because I'm not interested.", "bored", "boring", "funny"),
        q(36, "Lima is the ________ city of Peru.", "capital", "biggest", "center"),
        q(37, "Mia likes visiting her grandparents, but ________ house is very small.", "her", "their", "our"),
        q(38, "“Where's my phone?” “________'s in the living room.”", "It", "Its", "It's"),
        q(39, "Liu always goes running ________ breakfast at 5:30. It's the first thing she does.", "before", "after", "during"),
        q(40, "Adrian wants to learn Spanish now and ________ get a job in Colombia.", "then", "but", "because")
      ]
    },
    {
      label: "Language in Context",
      shortLabel: "Page 3",
      sourceLabel: "Units 5–8 · Page 3",
      title: "Language in Context",
      unit: "5-8",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(41, "Last year, we ________ to the upside-down house in Trassenheide in Germany.", "saw", "went", "had"),
        q(42, "In the ________, the table is upside down.", "attic", "bathroom", "kitchen"),
        q(43, "There is some ________ on the table.", "fruit", "TV", "laptop"),
        q(44, "Everything in the ________, such as pasta and tea, is also upside down.", "bathroom", "cabinets", "attic"),
        q(45, "There are ________ cereal in the upside-down kitchen.", "bottles of", "pieces of", "boxes of"),
        q(46, "Even the washing machine and ________ are upside down!", "dishwasher", "laptop", "sofa"),
        q(47, "The living room has a ________, but you can't sit on it.", "TV", "laptop", "sofa"),
        q(48, "The living room also has a ________, but you can't watch it.", "laptop", "TV", "attic"),
        q(49, "We looked at the rooms in the basement, and ________ we went up to the bedrooms.", "then", "before", "quiet"),
        q(50, "All the things in the ________ are upside down – the toilet, too!", "attic", "kitchen", "bathroom"),
        q(51, "It's very ________ to walk around the upside-down house.", "quiet", "uncomfortable", "modern"),
        q(52, "I ________ the house in the summer and it looked very nice.", "went", "ate", "saw"),
        q(53, "It was clean and ________. Not many people were there.", "quiet", "uncomfortable", "dirty"),
        q(54, "We ________ our lunch in the restaurant next to the house.", "had", "ate", "went"),
        q(55, "We ________ a really good time.", "saw", "went", "had"),
        q(56, "I ________ a new job last week.", "start", "started", "am starting"),
        q(57, "I ________ it a lot right now.", "enjoy", "am enjoying", "enjoyed"),
        q(58, "The office I work in ________ downtown next to the library.", "are", "is", "be"),
        q(59, "Every day, I ________ out to the local café for coffee.", "go", "am going", "went"),
        q(60, "The people I ________ with every day are very friendly.", "worked", "work", "am work"),
        q(61, "I ________ the work is interesting.", "am thinking", "thought", "think"),
        q(62, "There ________ several places to meet people and talk about work.", "is", "are", "be"),
        q(63, "Everyone ________ his or her own desk.", "has", "have", "having"),
        q(64, "I ________ how to do my job well.", "learn", "am learning", "learned"),
        q(65, "Right now I ________ what the others are doing this morning.", "watch", "watched", "am watching"),
        q(66, "Right now I am watching what the others ________ this morning.", "do", "are doing", "did"),
        q(67, "I ________ to make any mistakes.", "don't want", "am not wanting", "didn't want"),
        q(68, "My last job ________ very good.", "isn't", "wasn't", "weren't"),
        q(69, "I ________ the job for five years.", "did", "do", "am doing"),
        q(70, "I ________ any interesting people in my last job.", "don't meet", "wasn't meeting", "didn't meet")
      ]
    },
    {
      label: "Reading",
      shortLabel: "Page 4",
      sourceLabel: "Units 5–8 · Page 4",
      title: "Reading",
      unit: "5-8",
      instructions: "Read the text. Choose True, False, or Not enough information.",
      passage: {
        title: "Visiting Mumbai",
        paragraphs: [
          "Mumbai is a very large city on the west coast of India. It's famous for its businesses and industries such as the technology business and the film industry. I went there two years ago for a short trip as part of a business project for my work. We invented some new technology for cameras and we went to meet some customers in Mumbai.",
          "It's the most amazing city. It has a huge population and many people from outside the city are moving into the city to find work. The city is very noisy most of the time, but it's also very exciting and there are many things to do and to see. It has a lot of modern skyscrapers and also a lot of traditional buildings. I saw many fantastic monuments – some are very famous and interesting like the Gateway of India. You can also go on a Bollywood Studio Tour and there are some pretty gardens to see. There's also a great beach. You can relax there on the weekends.",
          "It's usually pretty hot there and sometimes it's very hot. I had my suit and tie with me, but generally I was more comfortable in a light shirt. The food is fantastic. There are many different types of food, but Indians eat a lot of rice, bread, and vegetables, and really nice fish, too. I also liked the sweet things they sell and the Indian ice cream. It's different from ice cream in my country. You can also buy really nice presents in Mumbai. There are some beautiful necklaces and other jewelry.",
          "We stayed for one week at a good hotel next to the beach. It was quiet and not very expensive, and we had really good food. Our rooms were very big and had desks and chairs, and a fridge, too. I was in the city for my work, but it was great to see everything, and I really want to go back."
        ]
      },
      questions: [
        q(71, "The writer went to Mumbai for two years.", "True", "False", "Not enough information"),
        q(72, "The writer went there because of his job.", "True", "False", "Not enough information"),
        q(73, "Mumbai has a very young population.", "True", "False", "Not enough information"),
        q(74, "You can see different types of buildings in Mumbai.", "True", "False", "Not enough information"),
        q(75, "The writer liked the Bollywood Studio Tour.", "True", "False", "Not enough information"),
        q(76, "There are some places to relax in the city.", "True", "False", "Not enough information"),
        q(77, "The writer wore his jacket for meetings.", "True", "False", "Not enough information"),
        q(78, "The writer didn't like the food in Mumbai.", "True", "False", "Not enough information"),
        q(79, "The writer thought his hotel was noisy.", "True", "False", "Not enough information"),
        q(80, "The writer liked the room in his hotel.", "True", "False", "Not enough information")
      ]
    }
  ]
};