"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-a2-units-9-12",
  title: "A2 Units 9–12 Test",
  subtitle: "Multiple Choice",
  level: "A2",
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
        q(1, "I have to ________ an exam at school tomorrow. I hope I pass!", "do", "take", "make"),
        q(2, "We're going to eat healthier food this year because we want to ________ our diet.", "save", "join", "improve"),
        q(3, "The opposite of dangerous is ________.", "safe", "ugly", "crowded"),
        q(4, "His hair isn't curly or wavy. It's ________.", "long", "straight", "blond"),
        q(5, "Trains under a city transport people on the ________.", "bridge", "bus", "subway"),
        q(6, "We like going ________ on vacation; for example, visiting old buildings and famous places.", "sightseeing", "camping", "surfing"),
        q(7, "An ________ paints pictures.", "actor", "artist", "scientist"),
        q(8, "The opposite of interesting is ________.", "interesting", "funny", "boring"),
        q(9, "This school subject includes chemistry, biology, and physics.", "science", "geography", "PE"),
        q(10, "“How long is his hair?” “It isn't really long or really short. He has ________ hair.”", "curly", "medium-length", "bald"),
        q(11, "“When ________ your new job?” “Last week.”", "have you started", "you started", "did you start"),
        q(12, "She's ________ than me at basketball, but I'm on the team, too.", "better", "best", "more good"),
        q(13, "________ at a campsite?", "Did you ever stayed", "Have you ever stayed", "Have you ever stay"),
        q(14, "We've been to Italy and Spain. We ________ in 2014.", "have gone", "go", "went"),
        q(15, "You ________ pass two exams and go on an interview to get into that college.", "have to", "has to", "had to"),
        q(16, "Have you ever ________ a ballet?", "saw", "seen", "see")
      ]
    },
    {
      label: "Language 2",
      shortLabel: "Page 2",
      sourceLabel: "Units 9–12 · Page 2",
      title: "Vocabulary & Corrections",
      unit: "9-12",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(17, "I like learning about places, so I enjoy studying ________.", "geometry", "geography", "geology"),
        q(18, "Jacob goes running every day and, in June, he's going to run a ________.", "match", "meeting", "marathon"),
        q(19, "The exhibit was very ________. There were a lot of people in front of the paintings, so I couldn't see.", "crowded", "cheerful", "confident"),
        q(20, "My father helped me buy an apartment. He's very ________.", "brave", "generous", "overweight"),
        q(21, "I'm going to start using my ________ to get to work and to get in shape.", "bus", "boat", "bike"),
        q(22, "I prefer relaxing by the ________ at the hotel because the beach is very dirty.", "pool", "park", "pub"),
        q(23, "We went to the theater last night. The dancers were amazing, so the ________ was really good.", "band", "ballet", "bridge"),
        q(24, "Your sister is ________ – she's smart, she's cool, she makes great food, and she's really funny!", "gray", "generous", "great"),
        q(25, "My dad's hair was dark when he was younger, then it turned gray, and now it's completely ________.", "white", "wavy", "wide"),
        q(26, "I like Jennifer Lawrence and Chris Pratt, but Tom Cruise is my favorite ________.", "artist", "actor", "athlete"),
        q(27, "Choose the corrected sentence.", "I need saving money for my vacation now.", "I need save money for my vacation now.", "I need to save money for my vacation now."),
        q(28, "Choose the corrected sentence.", "The exhibit was the worst I've ever seen!", "The exhibit was the baddest I've ever seen!", "The exhibit was the most bad I've ever seen!"),
        q(29, "Choose the corrected sentence.", "He hasn't to wear a tie in his office.", "He doesn't have to wear a tie in his office.", "He doesn't has to wear a tie in his office."),
        q(30, "Choose the corrected sentence.", "I've already seen an opera, but I've seen three ballets.", "I've ever seen an opera, but I've seen three ballets.", "I've never seen an opera, but I've seen three ballets."),
        q(31, "Choose the corrected sentence.", "She's never been to an art gallery.", "She's never be to an art gallery.", "She's never went to an art gallery."),
        q(32, "Choose the corrected sentence.", "The children are going to going to kindergarten next September.", "The children are going to go to kindergarten next September.", "The children going to go to kindergarten next September."),
        q(33, "Choose the corrected sentence.", "My boss is awful. I'd love getting a new job.", "My boss is awful. I'd love to getting a new job.", "My boss is awful. I'd love to get a new job."),
        q(34, "Choose the corrected sentence.", "This isn't the oldest college in the country, but it's the best.", "This isn't the oldest college in the country, but it's the bestest.", "This isn't the oldest college in the country, but it's the most best."),
        q(35, "We didn't go surfing ________ it was very expensive.", "so", "because", "but"),
        q(36, "I failed my exams, ________ I had to re-take them in January.", "because", "but", "so"),
        q(37, "________ I met him, I thought he looked sad.", "When", "So", "Because"),
        q(38, "________ I can visit you in Australia one day! Who knows?", "Always", "Maybe", "Never"),
        q(39, "I had ________ big party because I got a new job.", "the", "one", "a"),
        q(40, "I'm going to be busy every evening ________ I join the gym!", "if", "because", "so")
      ]
    },
    {
      label: "Language in Context",
      shortLabel: "Page 3",
      sourceLabel: "Units 9–12 · Page 3",
      title: "Language in Context",
      unit: "9-12",
      instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(41, "I needed to get healthy and to get in ________, so I decided to make some changes.", "diet", "shape", "weight"),
        q(42, "I wanted to be more ________, so I wrote a plan with my resolutions.", "confident", "generous", "organized"),
        q(43, "It was important for me to ________ more exercise because I was usually very tired.", "get", "go", "have"),
        q(44, "So I ________ a gym.", "made", "joined", "got"),
        q(45, "I also wanted to ________ a marathon at the end of the year.", "meet", "go", "run"),
        q(46, "I had to ________ running every day.", "go", "get", "make"),
        q(47, "Then I improved my ________. I ate more salads and stopped drinking cola.", "shape", "diet", "weight"),
        q(48, "This made me feel much ________ immediately.", "slim", "confident", "better"),
        q(49, "I lost ________.", "weight", "shape", "diet"),
        q(50, "My hair is now ________ too, so I look completely different.", "slim", "long", "overweight"),
        q(51, "After a few months, I felt happier and also more ________, so I joined a hiking club.", "organized", "generous", "confident"),
        q(52, "The club was really interesting and I ________ a lot of new friends at the end of the year.", "made", "joined", "got"),
        q(53, "Things were really good, and then I ________ a great new job in a travel company.", "made", "got", "have"),
        q(54, "I love my job and now I'm ________ money.", "getting", "making", "saving"),
        q(55, "I'm saving money to buy a new ________!", "car", "bike", "job"),
        q(56, "Have you ever ________ about what you need to do to be a flight attendant?", "think", "thought", "thinking"),
        q(57, "Have you ever thought about what you need ________ to be a flight attendant?", "do", "doing", "to do"),
        q(58, "In fact, it ________ much harder than people think.", "is", "was", "has been"),
        q(59, "Andy ________ to be a flight attendant when he was a child.", "wants", "wanted", "has wanted"),
        q(60, "Last year, he ________ an interview with an airline.", "has gone on", "goes on", "went on"),
        q(61, "You ________ really slim for this job.", "don't have to be", "didn't have to be", "haven't to be"),
        q(62, "I ________ in shape before the interview.", "have to get", "had to get", "must to get"),
        q(63, "I also ________ my college exams last summer, including English and math.", "have passed", "passes", "passed"),
        q(64, "He ________ he was interested in languages and travel.", "had to show", "has to show", "showed to"),
        q(65, "It ________ a really difficult interview!", "is", "was", "has been"),
        q(66, "Then he ________ six weeks' training and he was on a plane.", "has had", "has", "had"),
        q(67, "I ________ a lot of new people this year.", "have met", "met", "am meeting"),
        q(68, "I ________ weight too because we're always busy.", "lost", "have lost", "am losing"),
        q(69, "I ________ my job.", "am enjoying", "enjoyed", "enjoy"),
        q(70, "I ________ to Australia next year.", "am going to travel", "traveled", "have traveled")
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
        title: "Is This the End of Movie Theaters?",
        paragraphs: [
          "Why do we go to the movies? There are a lot of good reasons: they're a cheap form of entertainment, the technology is better than the average TV in your own home, and many people like watching something with their friends. However, movie theaters don't often make much money from the movies they show. They make their money from the food and drinks you buy. Some have special offers. For example, you can watch a movie and have dinner at the same time, so after the movie, you don't have to go to a restaurant.",
          "Nowadays, there are so many TV shows – and many of them are really good, too. This means that movie theaters have a lot of competition because people prefer to stay in their own homes and watch TV instead of going out to the movies – and we've never had so many different types of movies to watch. Some people say that big Hollywood movies are all the same now and that TV has more interesting movies and more choices. This is because they make a lot more movies in different places now, and not only at the Hollywood studios, so you can see movies from European countries, from China, India, and many other countries.",
          "It's true that the movies you can watch now on TV are often better than the movies that they show at the movie theater, and you don't even have to leave your own sofa! TVs are getting bigger and bigger, so you can feel like you are at the movie theater. Some people say that in the future, movie theaters are going to change and become meeting places for friends and family with other forms of entertainment. In fact, sometimes you can watch a play or a ballet at the movie theater at the same time that the actors and dancers are performing them in the theater. But many people think movie theaters are going to die and TV is going to become more and more popular. What do you think?"
        ]
      },
      questions: [
        q(71, "Movie theaters have better technology than TVs.", "True", "False", "Not enough information"),
        q(72, "Movie theaters do not always make most of their money from ticket sales.", "True", "False", "Not enough information"),
        q(73, "You can do more in a movie theater than see a movie.", "True", "False", "Not enough information"),
        q(74, "People watch too much TV.", "True", "False", "Not enough information"),
        q(75, "The types of movies we can watch these days are changing.", "True", "False", "Not enough information"),
        q(76, "Movie studios from other countries are more important than Hollywood.", "True", "False", "Not enough information"),
        q(77, "Movies on TV can sometimes be better than movies at the movie theater.", "True", "False", "Not enough information"),
        q(78, "Movie theaters are going to have stores in the future.", "True", "False", "Not enough information"),
        q(79, "Movies are not the only thing you can see at the movie theater.", "True", "False", "Not enough information"),
        q(80, "Most people think TV is going to become less popular.", "True", "False", "Not enough information")
      ]
    }
  ]
};
