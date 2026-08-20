"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-a2-units-5-6",
  title: "A2 Units 5–6 Test",
  subtitle: "Multiple Choice",
  level: "A2",
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
        q(1, "Peter usually ________ TV in the evening.", "is watching", "watches", "does watch"),
        q(2, "I like wearing ________ in the winter when it's cold.", "shorts", "sandals", "boots"),
        q(3, "Ana ________ soccer after school today.", "can't play", "can't plays", "doesn't play"),
        q(4, "Do you enjoy making ________?", "photos", "chess", "jewelry"),
        q(5, "This soccer game ________!", "has terrible", "terrible is", "is terrible"),
        q(6, "Daniel wears ________ when he plays volleyball.", "sneakers", "shoes", "sandals"),
        q(7, "I ________ dresses to skirts.", "preferring", "prefer", "am preferring"),
        q(8, "She always plays ________ with her family. She's very good now.", "chess", "coins", "sewing"),
        q(9, "I like ________ sweaters for my nieces.", "knitting", "painting", "collecting"),
        q(10, "I ________ to the movies tonight. I have homework!", "can't goes", "can't go", "can go not"),
        q(11, "It's very hot today. Wear your ________.", "scarf", "shorts", "coat"),
        q(12, "She is making ________.", "a dinner really nice", "a really nice dinner", "a dinner is nice"),
        q(13, "It doesn't often snow in my city, but ________ now!", "it's snowing", "it snows", "it's snow"),
        q(14, "________ French, but they are good at English.", "Can't they speak", "They can't speak", "They can't to speak"),
        q(15, "My best friend's birthday is on August ________.", "20st", "20th", "20rd"),
        q(16, "________ me cook the dinner tonight, please?", "Can you to help", "You can help", "Can you help"),
        q(17, "Can you ________ the drums?", "do", "play", "take"),
        q(18, "I'm going to bed. ________", "This movie is boring.", "Boring is this movie.", "This movie is being boring."),
        q(19, "I ________ why he isn't helping us.", "not understand", "am not understanding", "don't understand"),
        q(20, "October is the ________ month of the year.", "tenth", "twentieth", "ten")
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
        q(21, "My friend's house has a very big ________. We can all eat there – it's great.", "dining room", "attic", "basement"),
        q(22, "We ________ books for the new students.", "aren't any", "don't have some", "don't have any"),
        q(23, "My father works in a big ________ downtown.", "office building", "monument", "apartment building"),
        q(24, "Our apartment ________, so we can walk to most places.", "has downtown", "is next to downtown", "is downtown"),
        q(25, "I love sitting in my grandmother's ________. It's very old and very comfortable.", "bed", "armchair", "cabinet"),
        q(26, "This mirror is very ________, but it's beautiful.", "clean", "uncomfortable", "cheap"),
        q(27, "Can you help me move this desk, please? It's really ________!", "light", "heavy", "expensive"),
        q(28, "The ________ is very old and is open to all visitors on Sundays.", "bridge", "skyscraper", "cathedral"),
        q(29, "“This house is nice. Is there a yard, too?” “No, ________.”", "it's not", "there isn't", "there aren't"),
        q(30, "We can put all our old books and the things we don't use in the ________.", "attic", "living room", "kitchen"),
        q(31, "“Your bedroom is really nice!” “Yes, and it's ________.”", "pretty a big, too", "a pretty big room, too", "pretty big room, too"),
        q(32, "I hate ________ – I don't like very tall buildings!", "skyscrapers", "stadiums", "monuments"),
        q(33, "Our ________ is very nice and I often sit there in the sun.", "garage", "basement", "balcony"),
        q(34, "The hotel ________ the ocean. It's very quiet and relaxing.", "is in the middle of", "is next to", "is a good place to"),
        q(35, "My brother's room is ________, but he has a small bed!", "narrow", "heavy", "light"),
        q(36, "Do you ________ trees in your yard?", "some", "have any", "haven't any"),
        q(37, "I have a big ________. Three people can sit on it.", "sofa", "armchair", "table"),
        q(38, "My parents' room is ________ my room and my sister's.", "on", "in", "between"),
        q(39, "Let's go and see the new play in the ________ tonight!", "theater", "stadium", "library"),
        q(40, "In my aunt's house, you walk down the ________ to get to the bathroom.", "basement", "stairs", "attic")
      ]
    }
  ]
};
