"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-a1-units-5-7",
  title: "A1 Units 5–7 Test",
  subtitle: "Multiple Choice",
  level: "A1",
  unitRange: "5-7",
  totalQuestions: 80,
  maxScore: 80,
  pages: [
    {
      label: "Language 1",
      shortLabel: "Page 1",
      sourceLabel: "Units 5–7 · Page 1",
      title: "Vocabulary & Grammar",
      unit: "5-7",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1, "You can watch new movies in this place in town.", "movie theater", "bank", "bookstore"),
        q(2, "You listen with this part of your body.", "eyes", "ears", "hands"),
        q(3, "You do this activity when your house is dirty.", "clean the house", "go shopping", "cook dinner"),
        q(4, "Your eyes, nose, and mouth are on this part of your body.", "face", "leg", "back"),
        q(5, "This person's job is to drive very fast cars.", "race car driver", "taxi driver", "police officer"),
        q(6, "You sleep in this room at night.", "bathroom", "bedroom", "kitchen"),
        q(7, "This is the month between April and June.", "May", "March", "July"),
        q(8, "You cook food in this room.", "living room", "bedroom", "kitchen"),
        q(9, "She's a doctor. She works in a ________ in Manchester.", "hotel", "hospital", "house"),
        q(10, "Cara Delevingne is an actor and a famous ________ model.", "famous", "fashion", "film"),
        q(11, "We don't have a TV in our ________ room.", "living", "local", "large"),
        q(12, "Your ________ is part of your leg.", "knee", "neck", "hand"),
        q(13, "We played tennis ________ morning.", "yesterday", "yellow", "year"),
        q(14, "The bank is ________ to the post office.", "between", "next", "new"),
        q(15, "There's a ________ in the kitchen.", "shelves", "stove", "shower"),
        q(16, "Patrick helps ________ with my English homework.", "me", "my", "I"),
        q(17, "Are there ________ vegetables in the refrigerator?", "some", "any", "a"),
        q(18, "He started school ________ September 2.", "at", "in", "on"),
        q(19, "I ________ care of my son's children on Tuesdays.", "take", "give", "make"),
        q(20, "There are tables in front ________ the café.", "to", "of", "on"),
        q(21, "We wait at the ________ stop every morning.", "bus", "train", "car"),
        q(22, "These chairs are ugly. I don't like ________.", "it", "them", "him"),
        q(23, "Do you use a desktop ________ at work?", "laptop", "computer", "tablet"),
        q(24, "Our apartment is ________ a pizza restaurant!", "above", "between", "next")
      ]
    },
    {
      label: "Language 2",
      shortLabel: "Page 2",
      sourceLabel: "Units 5–7 · Page 2",
      title: "Grammar & Transformations",
      unit: "5-7",
      instructions: "Choose the option that correctly completes or rewrites each sentence.",
      questions: [
        q(25, "I don't think he's a good actor. = In ________, he's not a good actor.", "the opinion", "my opinion", "an opinion"),
        q(26, "My city has three parks. = ________ three parks in my city.", "There is", "There are", "They are"),
        q(27, "He reads a book. Then he goes to bed. = He reads a book. ________, he goes to bed.", "Before that", "At that", "After that"),
        q(28, "I called her last week. = I called her a ________.", "week ago", "last week ago", "week before"),
        q(29, "There ________ store in our town, so we go to the grocery store in the city.", "aren't a", "isn't a", "doesn't a"),
        q(30, "We ________ watching TV in the mornings.", "hates", "are hate", "hate"),
        q(31, "I can't ________ this tablet.", "use", "uses", "using"),
        q(32, "________ there a GPS in your new car?", "Are", "Is", "Does"),
        q(33, "Can your parents ________ Spanish?", "speaks", "speaking", "speak"),
        q(34, "My brother ________ to music with his headphones.", "listens", "listen", "listening"),
        q(35, "Choose the simple past form: Are the students friendly?", "Did the students friendly?", "Were the students friendly?", "Was the students friendly?"),
        q(36, "Choose the simple past form: Where does your father work?", "Where was your father work?", "Where your father worked?", "Where did your father work?"),
        q(37, "Choose the simple past form: My children don't study French.", "My children didn't study French.", "My children weren't study French.", "My children don't studied French."),
        q(38, "Choose the simple past form: She's a journalist.", "She did a journalist.", "She was a journalist.", "She were a journalist."),
        q(39, "Choose the simple past form: Do you like the movie?", "Were you like the movie?", "Do you liked the movie?", "Did you like the movie?"),
        q(40, "Choose the simple past form: The restaurant's not good.", "The restaurant wasn't good.", "The restaurant didn't good.", "The restaurant weren't good.")
      ]
    },
    {
      label: "Language in Context",
      shortLabel: "Page 3",
      sourceLabel: "Units 5–7 · Page 3",
      title: "Language in Context",
      unit: "5-7",
      instructions: "Choose the word or form that best completes each sentence.",
      questions: [
        q(41, "Karina's travel blog: We ________ in Buenos Aires last month.", "was", "are", "were"),
        q(42, "We were in Buenos Aires ________ month.", "every", "last", "first"),
        q(43, "Here are three places I ________ you need to see!", "think", "meet", "play"),
        q(44, "In the 1920s, El Ateneo Grand Splendid ________ a theater and a movie theater.", "were", "was", "is"),
        q(45, "If you like ________, El Ateneo is the place for you!", "soccer", "running", "reading"),
        q(46, "There's a very good ________ where you can buy coffee and alfajores.", "café", "club", "museum"),
        q(47, "La Bombonera is famous ________ the Boca Juniors play soccer there.", "but", "because", "then"),
        q(48, "The Boca Juniors ________ soccer at La Bombonera.", "play", "plays", "playing"),
        q(49, "La Bombonera's museum is open ________ day.", "last", "first", "every"),
        q(50, "You can learn about famous ________ like Diego Maradona and Martín Palermo.", "singers", "soccer players", "engineers"),
        q(51, "There's a blue and gold guitar in the museum. Lenny Kravitz played ________ at La Bombonera.", "it", "them", "him"),
        q(52, "Lenny Kravitz played there ________ 2005.", "on", "at", "in"),
        q(53, "La Catedral is a great ________ for tango music.", "café", "club", "store"),
        q(54, "You can take a tango class here, ________ have a drink and watch the dancers.", "because", "but", "then"),
        q(55, "But don't ________ early - it's very quiet before midnight!", "arrive", "meet", "play"),
        q(56, "Piano Day: Nils Frahm is a German ________ and a very good piano player.", "music", "musician", "musical"),
        q(57, "In 2015, Nils ________ Piano Day.", "start", "starting", "started"),
        q(58, "He started Piano Day because he ________ more people to listen to new piano music.", "wanted", "wants", "wanting"),
        q(59, "Piano Day happens on the ________ day of the year.", "eighty-eight", "eightieth-eight", "eighty-eighth"),
        q(60, "Each year on Piano Day, there ________ concerts all over the world.", "is", "are", "be"),
        q(61, "In 2017, there ________ concerts in Barcelona, London, Tokyo, Budapest, and many other cities.", "were", "was", "are"),
        q(62, "People can ________ to new piano music online, too.", "listens", "listening", "listen"),
        q(63, "In March 2015, Piano Day ________ on the twenty-ninth day of the month.", "happen", "happened", "happens"),
        q(64, "Piano Day happened on the ________ day of March.", "twenty-ninth", "twenty-nine", "twentieth-nine"),
        q(65, "Nils ________ a concert at the Royal Albert Hall in London.", "play", "plays", "played"),
        q(66, "In the concert, he ________ old electronic instruments as well as the piano.", "use", "used", "uses"),
        q(67, "Many of the instruments ________ from the 1970s and 1980s.", "were", "was", "are"),
        q(68, "When Nils ________ young, he liked going out to clubs.", "were", "is", "was"),
        q(69, "When Nils was young, he liked ________ out to clubs.", "go", "going", "went"),
        q(70, "Electronic music is very important to ________.", "him", "he", "his")
      ]
    },
    {
      label: "Reading",
      shortLabel: "Page 4",
      sourceLabel: "Units 5–7 · Page 4",
      title: "Reading",
      unit: "5-7",
      instructions: "Read the text. Choose True, False, or Not enough information.",
      passage: {
        title: "The inventors of the selfie stick",
        byline: "by Shura Washington",
        paragraphs: [
          "Do you take selfies with your smartphone? Do you use a selfie stick? I do, and in my opinion, selfie sticks are a good idea. Now I can take great photos of myself and my friends. I have my smartphone in the selfie stick in one hand, and I take the photo with the other hand. I use a remote control on my headphones. It's very easy! But some people don't like selfie sticks. You can't use them in some museums now, for example the Van Gogh Museum in Amsterdam and the Museum of Modern Art in New York.",
          "The first person to have the idea for the selfie stick was Hiroshi Ueda - in the 1980s! Ueda was an engineer at the Japanese camera company, Minolta. He loved taking photos in his free time. But when Ueda traveled to Europe on vacation, there was a problem - it was difficult to take photos of himself and his wife. Ueda sometimes asked people to take a photo for him, but often, the photo wasn't good. Ueda decided to make something to help him - he called his idea the extender stick. Minolta liked Ueda's idea, and they started to make extender sticks in 1983, but people didn't buy them.",
          "This is different today, thanks to Wayne Fromm. Fromm is from Canada, and he studied at the University of Toronto. He wasn't the first person to have the idea for a selfie stick, but he thinks he is the father of the device we use today. In the 2000s, Fromm looked at different umbrellas and used some ideas from them for his selfie stick, the Quik Pod. You can use the Quik Pod with any camera or cell phone, and you can even use it in water! Wayne is happy because people like his idea, and now you can buy the Quik Pod in 42 different countries around the world."
        ]
      },
      questions: [
        q(71, "The writer doesn't think selfie sticks are a good idea.", "True", "False", "Not enough information"),
        q(72, "The writer has a remote control for her smartphone camera.", "True", "False", "Not enough information"),
        q(73, "You can't use selfie sticks in the Van Gogh Museum.", "True", "False", "Not enough information"),
        q(74, "Hiroshi Ueda worked as a photographer at Minolta.", "True", "False", "Not enough information"),
        q(75, "Ueda often traveled to Europe with his wife.", "True", "False", "Not enough information"),
        q(76, "It was sometimes difficult for Ueda to take photos when he was on vacation.", "True", "False", "Not enough information"),
        q(77, "People didn't buy extender sticks in the 1980s.", "True", "False", "Not enough information"),
        q(78, "Wayne Fromm's father was Canadian.", "True", "False", "Not enough information"),
        q(79, "At first, Fromm wanted to make an umbrella.", "True", "False", "Not enough information"),
        q(80, "You can use the Quik Pod when you go swimming.", "True", "False", "Not enough information")
      ]
    }
  ]
};
