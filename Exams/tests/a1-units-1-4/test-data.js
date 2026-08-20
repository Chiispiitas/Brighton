"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-a1-units-1-4",
  title: "A1 Units 1–4 Test",
  subtitle: "Multiple Choice",
  level: "A1",
  unitRange: "1-4",
  totalQuestions: 80,
  maxScore: 80,
  pages: [
    {
      label: "Language 1", shortLabel: "Page 1", sourceLabel: "Units 1–4 · Page 1",
      title: "Vocabulary & Grammar", unit: "1-4",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1, "I go ________ bus because I don't have a car.", "at", "by", "on"),
        q(2, "Do you have a ________ card?", "cell", "cash", "credit"),
        q(3, "My ________ backpack is blue.", "friend's", "friend", "friends"),
        q(4, "Do they ________ homework on the weekend?", "have", "do", "make"),
        q(5, "Are ________ eggs for lunch?", "this", "that", "those"),
        q(6, "Does your family live in ________?", "Mexican", "Mexico", "Mexicans"),
        q(7, "On a hot day, we usually have a cold ________ for lunch.", "pizza", "salad", "soup"),
        q(8, "My name is Miho, and ________ from Japan.", "I'm", "I", "i'm"),
        q(9, "Her mother's ________ actor.", "the", "an", "a"),
        q(10, "My brother sometimes studies ________ night.", "on", "in", "at"),
        q(11, "Choose the opposite of noisy.", "quiet", "cheap", "slow"),
        q(12, "Choose the opposite of cheap.", "expensive", "noisy", "fast"),
        q(13, "Choose the opposite of fast.", "cheap", "slow", "beautiful"),
        q(14, "Choose the opposite of beautiful.", "quiet", "ugly", "expensive"),
        q(15, "This is a white drink. People sometimes use it in coffee.", "milk", "juice", "tea"),
        q(16, "This is your mother's father or your father's father.", "uncle", "grandfather", "brother"),
        q(17, "Chocolate is usually this color, but sometimes it's white or black.", "brown", "purple", "gray"),
        q(18, "British people are from this country.", "France", "England", "Germany")
      ]
    },
    {
      label: "Language 2", shortLabel: "Page 2", sourceLabel: "Units 1–4 · Page 2",
      title: "Grammar & Everyday English", unit: "1-4",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(19, "Mariana and Stuart ________ a big family.", "has", "having", "have"),
        q(20, "________ that your tablet?", "Is", "Does", "Are"),
        q(21, "We ________ from Brazil.", "don't be", "isn't", "aren't"),
        q(22, "My friend Gregor ________ in an apartment.", "living", "live", "lives"),
        q(23, "That's my ________ purse.", "sister", "sister's", "sisters"),
        q(24, "They ________ work at 6:30 p.m.", "finishing", "finishes", "finish"),
        q(25, "________ you cold?", "Is", "Do", "Are"),
        q(26, "He ________ at work today.", "isn't", "doesn't be", "aren't"),
        q(27, "Tokyo and Cairo are very big ________.", "city", "citys", "cities"),
        q(28, "Where ________ your grandparents from?", "is", "do", "are"),
        q(29, "I go to school on ________.", "feet", "foot", "bike"),
        q(30, "These are my children. ________ names are Tom and Robert.", "They're", "They", "Their"),
        q(31, "They ________ to the radio in the mornings.", "look", "listen", "live"),
        q(32, "What's the time, please? I don't have a ________.", "watch", "wallet", "week"),
        q(33, "He ________ eats fish. He doesn't like it!", "normally", "now", "never"),
        q(34, "I'm sorry, I don't understand. Can you ________ that, please?", "repeat", "read", "remember"),
        q(35, "My sister is a TV ________ in New York.", "house", "hotel", "host"),
        q(36, "Ariana ________ says hello. She's very friendly.", "always", "after", "also"),
        q(37, "________, seventeen, eighteen", "seventeen", "sixteen", "sixty"),
        q(38, "Monday, Tuesday, ________", "Wednesday", "Thursday", "Sunday"),
        q(39, "ninety-eight, ninety-nine, ________", "one hundred", "ninety-nine", "ninety"),
        q(40, "three, ________, five", "two", "six", "four")
      ]
    },
    {
      label: "Language in Context", shortLabel: "Page 3", sourceLabel: "Units 1–4 · Page 3",
      title: "Language in Context", unit: "1-4",
      instructions: "Choose the word or form that best completes each sentence from the two short texts.",
      questions: [
        q(41, "So, Christina, ________ do you live?", "where", "how", "who"),
        q(42, "And ________ do you live with?", "when", "where", "who"),
        q(43, "I live with my family - my ________, Marek, and my daughter, Aneta.", "parents", "doctor", "husband"),
        q(44, "Marek is an ________. He works in an office.", "actor", "engineer", "doctor"),
        q(45, "He works in an office near ________ apartment.", "his", "our", "their"),
        q(46, "Marek is from ________.", "Germany", "German", "Germany's"),
        q(47, "His ________ live in Paris, too.", "parents", "school", "husband"),
        q(48, "We have lunch with them ________ Sundays.", "in", "at", "on"),
        q(49, "And ________ old is Aneta?", "Where", "How", "Who"),
        q(50, "She goes to ________ here.", "study", "doctor", "school"),
        q(51, "She speaks French, ________, and English.", "Germany's", "German", "Germany"),
        q(52, "She wants to be a ________.", "doctor", "engineer", "husband"),
        q(53, "It's not big, ________ we think it's really nice.", "and", "in", "but"),
        q(54, "We think the apartment is really ________.", "German", "happy", "nice"),
        q(55, "I'm ________ when I'm at home!", "nice", "happy", "where"),
        q(56, "How ________ to work?", "do you travel", "you travel", "does you travel"),
        q(57, "Elewa, Michael, and Ali ________ by bike!", "goes", "going", "go"),
        q(58, "In Nairobi, a lot of ________ travel by bike.", "person", "people", "persons"),
        q(59, "It's difficult because of all the cars, ________, and trucks.", "buses", "bus", "buss"),
        q(60, "I ________ a bike, so I use my brother's bike.", "not have", "doesn't have", "don't have"),
        q(61, "I use my ________ bike.", "brothers", "brother's", "brother"),
        q(62, "Munich ________ a big city.", "doesn't be", "isn't", "aren't"),
        q(63, "My girlfriend ________ to work by bike.", "goes", "going", "go"),
        q(64, "She ________ it's great!", "thinks", "think", "thinking"),
        q(65, "She ________ the subway.", "don't like", "doesn't like", "not likes"),
        q(66, "I ________ at home.", "working", "work", "works"),
        q(67, "My bike ________ a big bag for the food!", "has", "have", "having"),
        q(68, "These ________ my bikes - I have three!", "be", "is", "are"),
        q(69, "I ________ an IT worker downtown.", "am", "is", "are"),
        q(70, "My office ________ about 20 kilometers from my house.", "is", "be", "are")
      ]
    },
    {
      label: "Reading", shortLabel: "Page 4", sourceLabel: "Units 1–4 · Page 4",
      title: "Reading", unit: "1-4",
      instructions: "Read the text. Choose True, False, or Not enough information.",
      passage: {
        title: "My job profile", byline: "Mario Contadini",
        paragraphs: [
          "I'm a chef on a cruise ship. A cruise ship is a very big boat. People go on vacation on the ship. The ship goes to different countries, so I travel a lot with my job - I'm not at home very often! I go to places like Italy, Canada, and Mexico every year.",
          "My job's not easy. We usually have about 6,000 people on the ship - 4,000 people on vacation and 2,000 workers. We make a lot of food every day! We make breakfast, lunch, afternoon tea, and dinner for the people on the ship. In the morning, I usually get up early, at six o'clock. I take a shower and get dressed, and then I go to the restaurant. I make some coffee and eat breakfast. Then I start work!",
          "We have 300 chefs on the ship. Some chefs make bread and cakes, some chefs prepare fruit, vegetables, and salads, and some chefs just make food from one country, for example, Japanese food. All the chefs are good at their job, and they're friendly, too! When you work on a cruise ship, you know people from a lot of different countries. The job's not boring because all the workers are nice.",
          "The ship goes to a lot of interesting towns and cities. When you start this job, you want to leave the ship and see these places. The young chefs always want to eat some food from the towns and cities, too! I don't do that - I don't leave the ship. After work, I go to my room and read a book, or I go to bed. I'm a father and sometimes I'm sad because I don't see my family when I'm on the ship. But I think I have a good job!"
        ]
      },
      questions: [
        q(71, "Mario works on a boat.", "False", "True", "Not enough information"),
        q(72, "Mario goes to different countries with his job.", "True", "False", "Not enough information"),
        q(73, "Mario's favorite countries are Canada and Mexico.", "False", "Not enough information", "True"),
        q(74, "Mario thinks he has a difficult job.", "Not enough information", "True", "False"),
        q(75, "4,000 people work on Mario's ship.", "True", "False", "Not enough information"),
        q(76, "Mario gets up at 6:00 a.m.", "True", "False", "Not enough information"),
        q(77, "Mario makes Japanese food in the restaurant.", "False", "True", "Not enough information"),
        q(78, "Mario thinks the chefs on the ship are nice.", "False", "Not enough information", "True"),
        q(79, "Mario leaves the ship when it goes to a town or city.", "False", "Not enough information", "True"),
        q(80, "Mario has a daughter.", "True", "False", "Not enough information")
      ]
    }
  ]
};
