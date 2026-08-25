"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-b1plus-units-9-12",
  title: "B1+ Units 9–12 Test",
  subtitle: "Multiple Choice",
  level: "B1+",
  unitRange: "9-12",
  totalQuestions: 80,
  maxScore: 80,
  pages: [
    {
      label: "Language 1",
      shortLabel: "Page 1",
      sourceLabel: "Units 9–12 · Page 1",
      title: "Vocabulary & Grammar",
      unit: "9-12",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1, "The flight’s not full. You can sit by the window, or would you prefer an ________?", "aisle seat", "exit lounge", "boarding pass"),
        q(2, "On the one hand, big cities can be noisy. On ________, there are many interesting places to visit.", "another hand", "the other hand", "the second side"),
        q(3, "We don’t know much about art, so we’re going to go ________ tour of the gallery.", "in a guided", "on guided a", "on a guided"),
        q(4, "As we’ve all finished eating, should we get ________ and pay?", "the check", "a tip", "the menu"),
        q(5, "Put a little ________ on the asparagus before you grill it.", "soy milk", "olive oil", "whole wheat"),
        q(6, "The burglar ________ their apartment and stole the TV.", "took off", "checked in", "broke into"),
        q(7, "You can only take one small ________ on board the plane.", "carry-on bag", "checked suitcase", "boarding gate"),
        q(8, "I’ve finished high school and I’m planning to go ________ next year to get a degree in English.", "on college", "to college", "at a school degree"),
        q(9, "If you’re free this afternoon, why don’t we ________ coffee together?", "go on", "take out", "go for"),
        q(10, "The service was excellent. We should leave ________ for the waiter.", "a tip", "a check", "an order"),
        q(11, "She said, “I’ll call you tomorrow.” She said she ________ day.", "will call me tomorrow", "would call me the next", "called me the previous"),
        q(12, "His car is outside his house. ________ because his car is outside.", "He might not be home", "He can’t be at home", "He must be at home"),
        q(13, "It’s freezing here. I wouldn’t be so cold if ________ with me.", "I’d brought my coat", "I brought no coat", "I will bring my coat"),
        q(14, "Can you describe the house? What ________?", "does the house like", "is the house like", "looks the house"),
        q(15, "If you can, please ________ bread for me.", "get to me a", "getting some me", "get me some"),
        q(16, "I like both Mexican and Chinese food. I ________ going to either restaurant tonight.", "don’t mind", "won’t mind to", "am not mind"),
        q(17, "She hasn’t called yet. ________ late because she hasn’t called.", "She must not is", "She might be", "She would been"),
        q(18, "He asked, “Have you been to London this year?” He ________ to London this year.", "asked if have I been", "said me if I went", "asked me if I’d been"),
        q(19, "Tom was disappointed with the snacks he made. The snacks ________.", "were a disappointment", "were disappointed him", "had a disappoint"),
        q(20, "“I forgot to pack an umbrella.” “I did too!” = “I forgot to pack an umbrella.” “________!”", "Neither did I", "So did I", "So I did not")
      ]
    },
    {
      label: "Language 2",
      shortLabel: "Page 2",
      sourceLabel: "Units 9–12 · Page 2",
      title: "Grammar & Corrections",
      unit: "9-12",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(21, "Choose the corrected phrase: “If I would know you were vegetarian, I would have made different food.”", "If I would have known you were vegetarian", "If I knew you were vegetarian yesterday", "If I’d known you were vegetarian"),
        q(22, "Choose the corrected phrase: “Eat out in restaurants is a nice thing to do on weekends.”", "Eating out in restaurants is", "Eat out restaurants are", "To eating out in restaurants is"),
        q(23, "Choose the corrected phrase: “If I am rich, I would move to California.”", "If I will be rich", "If I were rich", "If I would be rich"),
        q(24, "Greg was with me when the car was stolen. Choose the correct deduction.", "Greg must be the thief.", "Greg can be the thief definitely.", "Greg can’t be the thief."),
        q(25, "Choose the corrected question: “What would you had done if you’d been in his position?”", "What would you have done if you’d been in his position?", "What had you would done if you’d been in his position?", "What would you did if you’d been in his position?"),
        q(26, "Choose the corrected phrase: “It’s important spending quality time with your family.”", "It’s important spend quality time with your family.", "It’s important to spend quality time with your family.", "It’s important to spending quality time with your family."),
        q(27, "We could stay longer ________.", "if we didn’t had to go back to work", "if we don’t had to go back to work", "if we didn’t have to go back to work"),
        q(28, "Choose the polite request.", "I’d like some more milk in my coffee, please.", "I like some more milk in my coffee, please.", "I’d liking some more milk in my coffee, please."),
        q(29, "I was looking out of the window ________.", "when it started to snowing", "when it started to snow", "when it start snow"),
        q(30, "It would be great ________ tomorrow. I have to be there at 6 a.m.", "if you can took me to an airport", "if you would taking me at airport", "if you could take me to the airport"),
        q(31, "I don’t want to cook or eat out tonight. Let’s get ________ from the Chinese restaurant instead.", "takeout", "service", "a reservation"),
        q(32, "Do you know what time the plane takes ________?", "out", "off", "on"),
        q(33, "Naples is ________ interesting place to visit.", "a", "the only", "an"),
        q(34, "What time do we need to check ________ for the flight?", "in", "on", "out"),
        q(35, "We’ll ________ to the island at 3 p.m. Can you meet us then?", "landed", "get", "arrive to"),
        q(36, "I’d like to eat ________ on my birthday, so we might go to a restaurant.", "off", "up", "out"),
        q(37, "We’re going ________ vacation next week.", "on", "in", "at"),
        q(38, "“I don’t like asparagus.” “Oh, ________ do I!”", "so", "neither", "either I"),
        q(39, "I prefer dairy products low in fat, so I always buy ________ milk.", "whole", "grated", "skim"),
        q(40, "When I first ________ a vegetarian in 1999, it was difficult to find tasty dishes.", "became", "become", "becoming")
      ]
    },
    {
      label: "Language in Context",
      shortLabel: "Page 3",
      sourceLabel: "Units 9–12 · Page 3",
      title: "Language in Context",
      unit: "9-12",
      instructions: "Choose the word or form that best completes each sentence.",
      questions: [
        q(41, "Want a vacation? You can now book a ________ to many destinations.", "education", "flight", "rainbow"),
        q(42, "Want a vacation? Travelers have a ________ choice of places to go.", "tiny", "miserable", "fantastic"),
        q(43, "Want a vacation? You could climb one of the impressive ________ of New Zealand.", "volcanoes", "icebergs", "rainbows"),
        q(44, "Want a vacation? At the top, you can see huge ________, or rivers and lakes of ice.", "forests", "glaciers", "deserts"),
        q(45, "Want a vacation? In Iceland, you can see pure blue-white ________ in northern waters.", "volcanoes", "fields", "icebergs"),
        q(46, "Want a vacation? Some icebergs are small, while others are absolutely ________.", "enormous", "tiny", "gorgeously"),
        q(47, "Want a vacation? In Nepal, travelers can go ________ in the mountains.", "swimming", "hiking", "shopping"),
        q(48, "Want a vacation? They may end each day feeling ________, but satisfied.", "boiling", "wealthy", "exhausted"),
        q(49, "Want a vacation? On the ________ hand, some travelers are more interested in culture.", "other", "one", "same"),
        q(50, "Want a vacation? Natural disasters ________ the terrible earthquake in Nepal can hurt local economies.", "of", "like", "for"),
        q(51, "Want a vacation? Nepal experienced a terrible ________ in 2015.", "rainbow", "glacier", "earthquake"),
        q(52, "Want a vacation? Helping can allow children to continue their ________.", "education", "flight", "hiking"),
        q(53, "Want a vacation? To sum ________, travel can improve lives.", "out", "up", "in"),
        q(54, "Want a vacation? Think about what you can do when your plane ________ in a new country.", "flies", "takes", "lands"),
        q(55, "Want a vacation? ________ really can be more than an adventure.", "Traveling", "Travel", "Traveled"),
        q(56, "What would you change? What one thing ________ if you had the chance?", "did you changed", "would you change", "will you change yesterday"),
        q(57, "What would you change? My friend told me he ________ to swim.", "has never learn", "never learning", "had never learned"),
        q(58, "What would you change? He said if he ________, he could do more on vacation.", "could swim", "can swam", "could swimming"),
        q(59, "What would you change? If he could swim, he ________ to do more with his kids.", "will can", "would be able", "would able"),
        q(60, "What would you change? My grandmother ________ she had dreamed of getting a degree.", "told me that did", "says yesterday", "said"),
        q(61, "What would you change? She ________ of getting a degree when she was young.", "had dreamed", "has dream", "was dream"),
        q(62, "What would you change? If she ________ to college at eighteen, she would have studied engineering.", "went now", "had gone", "would go"),
        q(63, "What would you change? She definitely ________ engineering if she had gone to college.", "would study yesterday", "had studying", "would have studied"),
        q(64, "What would you change? She believes she might ________ more at work with a degree.", "have achieved", "achieved have", "to achieve"),
        q(65, "What would you change? She might have achieved more if she ________ a degree.", "has got", "had gotten", "would get"),
        q(66, "What would you change? A publisher asked my sister ________ a cookbook.", "writing to", "write to", "to write"),
        q(67, "What would you change? She told them she ________ do it because she was too busy.", "couldn’t", "can’t yesterday", "wouldn’t could"),
        q(68, "What would you change? She ________ much free time, so she had to say no.", "hadn’t have", "didn’t have", "doesn’t had"),
        q(69, "What would you change? If she ________ the book at the time, it might have succeeded.", "wrote now", "would write", "had written"),
        q(70, "What would you change? I know the cookbook ________ very successful.", "would have been", "would be been", "had been will")
      ]
    },
    {
      label: "Reading",
      shortLabel: "Page 4",
      sourceLabel: "Units 9–12 · Page 4",
      title: "Reading",
      unit: "9-12",
      instructions: "Read the text. Choose True, False, or Not enough information.",
      passage: {
        title: "Our new love for cooking",
        paragraphs: [
          "Around the world in the last ten years, there have been more and more cooking shows on television. Some of the cooking shows are for confused beginners, the type of people who’ve never even boiled an egg; other shows are for more experienced people who are already interested in cooking, but want more information and ideas about how to do things better. These are the ones that can introduce people to new ingredients and flavors, like quinoa and soy sauce. On these shows, people introduce ideas from all around the world. You can learn how to use more international food like lentils and chickpeas, which can make delicious vegetarian dishes, and there are excellent shows for lovers of seafood, with recipes for things like shellfish and squid. Unfortunately, my family can’t stand fish and neither can I!",
          "Some of the most famous cooking shows on TV are competitions which include highly-skilled chefs. Cooking is their passion. These are people who know more than how to grill a lobster or bake a loaf of bread. The winner might receive a trophy, but cash prizes are not usually given. However, winning the competition is a real achievement which can turn chefs into celebrities. In fact, many of the chefs we know today wouldn’t be famous if they hadn’t taken part in these competitions. During the competitions, these chefs have to create the most amazing dishes with ingredients from the field, the forest, and the sea. Of course, how the food tastes is important. However, when you’re a professional chef, how to organize the food on the plate can be as important as the decision on how to cook it. When the chefs in these cooking competitions lose, we know they must be disappointed, but they always have to smile and talk about how good the winner is.",
          "Surprisingly, it’s the cooking competition shows with “amateur chefs” (normal people who’ve never worked professionally as a chef in their lives) that are the ones that people like the most. One of the most famous shows with amateurs in it is a show with a very simple idea: people bake bread and cakes. Just that. It seems amazing that a show with such a simple idea could be so popular, but in the end, I think people love watching other people doing normal things and doing such a fantastic job of it."
        ]
      },
      questions: [
        q(71, "Cooking shows are the most popular shows on television.", "True", "False", "Not enough information"),
        q(72, "Beginners’ cooking shows teach you how to boil an egg.", "True", "False", "Not enough information"),
        q(73, "Not everyone who watches cooking shows has the same level of skills.", "True", "False", "Not enough information"),
        q(74, "The writer doesn’t like fish.", "True", "False", "Not enough information"),
        q(75, "Top chefs usually enter the competitions to win money.", "True", "False", "Not enough information"),
        q(76, "The food that is made by the top chefs comes from many different places.", "True", "False", "Not enough information"),
        q(77, "To win the TV competitions, the top chefs sometimes have to think about both the organization and the taste of the food.", "True", "False", "Not enough information"),
        q(78, "The writer thinks that top chefs don’t mind losing.", "True", "False", "Not enough information"),
        q(79, "People really love cooking shows with “normal people.”", "True", "False", "Not enough information"),
        q(80, "The writer thinks that viewers enjoy seeing normal people’s achievements.", "True", "False", "Not enough information")
      ]
    }
  ]
};
