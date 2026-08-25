"use strict";

const q = (q, text, a, b, c) => ({ q, text, options: [a, b, c] });

window.BRIGHTON_TEST_DATA = {
  testId: "brighton-b1-units-1-4",
  title: "B1 Units 1–4 Test",
  subtitle: "Multiple Choice",
  level: "B1",
  unitRange: "1-4",
  totalQuestions: 80,
  maxScore: 80,
  pages: [
    {
      label: "Language 1", shortLabel: "Page 1", sourceLabel: "Units 1–4 · Page 1", title: "Language 1", unit: "1-4", instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(1,"1.1 Complete the sentence: I went ________ while I was on vacation in New York. I saw Central Park and the Statue of Liberty.","sightseeing","shopping","camping"),
        q(2,"1.2 Complete the sentence: Please ________ to call your parents when you get home.","remind","expect","remember"),
        q(3,"1.3 Complete the sentence: It’s difficult for Luis to meet new people. He’s serious and very ________.","sociable","generous","shy"),
        q(4,"1.4 Complete the sentence: There are some factories near here, so the water is dirty and very ________.","peaceful","crowded","polluted"),
        q(5,"1.5 Complete the sentence: I got my driver’s ________ when I was 21.","salary","license","career"),
        q(6,"1.6 Complete the sentence: My cousin works as a ________ guard in a big office building.","tour","security","flight"),
        q(7,"1.7 Complete the sentence: Peter hates snakes and spiders – he’s ________ of them!","excited","relaxed","terrified"),
        q(8,"1.8 Complete the sentence: I enjoy going to concerts and next year, I’m going to learn an ________. Maybe the violin.","instrument","intern","interview"),
        q(9,"2.1 Complete the sentence: Do you think Daniela ________ like that famous model? They both have red hair.","looks","look","is looking"),
        q(10,"2.2 Complete the sentence: I’m really looking ________ to going camping next week.","after","up","forward"),
        q(11,"2.3 Complete the sentence: We went to Argentina ________ 2015.","on","at","in"),
        q(12,"2.4 Complete the sentence: We’re traveling to Paris the day ________ tomorrow.","after","before","later"),
        q(13,"2.5 Complete the sentence: My son wants to be a flight attendant when he grows ________.","out","up","on"),
        q(14,"2.6 Complete the sentence: Joanna is ________ most generous person I know.","the","a","an"),
        q(15,"2.7 Complete the sentence: I’m getting ________ with some friends later.","over","around","together"),
        q(16,"2.8 Complete the sentence: She gets exercise twice ________ week.","a","the","per the"),
        q(17,"3.1 Choose the correct question.","When your sister usually finishes work?","When does your sister usually finishes work?","When does your sister usually finish work?"),
        q(18,"3.2 Choose the correct question.","How often you go to the gym?","How often do you go to the gym?","How often are you go to the gym?"),
        q(19,"3.3 Choose the correct question.","Did you went to the party last night?","You did go to the party last night?","Did you go to the party last night?"),
        q(20,"3.4 Choose the correct question.","What you are reading right now?","What are you reading right now?","What do you reading right now?"),
        q(21,"3.5 Choose the correct question.","Do you think it will rain tomorrow?","Do you think will it rain tomorrow?","Are you think it will rain tomorrow?"),
        q(22,"3.6 Choose the correct question.","What did you watching on TV when I called yesterday?","What were you watching on TV when I called yesterday?","What you were watching on TV when I called yesterday?")
      ]
    },
    {
      label: "Language 2", shortLabel: "Page 2", sourceLabel: "Units 1–4 · Page 2", title: "Language 2", unit: "1-4", instructions: "Choose the correct answer: a, b, or c.",
      questions: [
        q(23,"4.1 Complete the sentence with the correct form of go: Preeti usually ________ running in the morning.","is going","goes","went"),
        q(24,"4.2 Complete the sentence with the correct form of do: I ________ Pilates when my phone rang.","did","am doing","was doing"),
        q(25,"4.3 Complete the sentence with the correct form of work: We met Ana while we ________ in Hong Kong.","worked","are working","were working"),
        q(26,"4.4 Complete the sentence with the correct form of not be: It definitely ________ sunny tomorrow.","won’t be","isn’t","wasn’t"),
        q(27,"4.5 Complete the sentence with the correct form of relax: I ________ at home this evening.","am relaxing","relax","relaxed"),
        q(28,"4.6 Complete the sentence with the correct form of spend: He ________ time with his family every weekend.","is spending","spent","spends"),
        q(29,"4.7 Complete the sentence with the correct form of play: Michael and Sam ________ video games right now.","play","are playing","played"),
        q(30,"4.8 Complete the sentence with the correct form of have: We ________ a barbecue next weekend, but I’m not sure.","might have","have","had"),
        q(31,"5.1 Complete the second sentence: Jung-ho doesn’t see his friends very often. Jung-ho ________ his friends.","hardly ever sees","sees hardly ever","doesn’t hardly ever see"),
        q(32,"5.2 Complete the second sentence: Russia is colder than Germany. Germany ________ as Russia.","is as cold","isn’t as cold","isn’t colder"),
        q(33,"5.3 Complete the second sentence: What are you having for dinner tonight? What are you ________ for dinner tonight?","going to have","going have","going to having"),
        q(34,"5.4 Complete the second sentence: I’m not going to the movies because I have a lot of homework. I have a lot of homework. ________ I’m not going to the movies.","That’s why","Because","Although"),
        q(35,"5.5 Complete the second sentence: The students were quiet while they waited for their teacher. The children ________ for their teacher.","quietly were waiting","waited quietly","waited quiet"),
        q(36,"5.6 Complete the second sentence: I downloaded some music and then I watched TV. I downloaded some music. ________, I watched TV.","After that","After","Later after"),
        q(37,"6.1 This person writes articles for newspapers, magazines, or websites.","receptionist","security guard","journalist"),
        q(38,"6.2 This word means ‘not beautiful at all.’","crowded","ugly","polluted"),
        q(39,"6.3 You buy these when you’re on vacation to remind yourself of the place.","souvenirs","licenses","salaries"),
        q(40,"6.4 This is the money you earn every month for doing your job.","career","promotion","salary")
      ]
    },
    {
      label: "Language in Context", shortLabel: "Page 3", sourceLabel: "Units 1–4 · Page 3", title: "Language in Context", unit: "1-4", instructions: "Choose the word or form that best completes each sentence.",
      questions: [
        q(41,"Me and my job: My name is Carmen and I work as a ________ in a large hotel.","intern","security guard","receptionist"),
        q(42,"Me and my job: I became interested in a ________ in tourism after I finished school.","career","promotion","training"),
        q(43,"Me and my job: I became interested in a career in tourism after I finished ________.","training","work","school"),
        q(44,"Me and my job: I worked as a waitress at first, but I ________ going out at night with my friends.","missed","lost","enjoyed"),
        q(45,"Me and my job: Two months ________, I started looking for another job.","later","after","then after"),
        q(46,"Me and my job: I was very ________ when I got the offer for this one!","busy","excited","serious"),
        q(47,"Me and my job: I also understand Italian when people speak ________.","slowly","hard-working","abroad"),
        q(48,"Me and my job: I’m also very ________. That’s important because the hours are long.","busy","excited","hard-working"),
        q(49,"Me and my job: The hotel is always very ________, but I enjoy helping the guests.","slowly","busy","abroad"),
        q(50,"Me and my job: My colleagues and I ________ rooms for people.","reserve","miss","sunbathe"),
        q(51,"Me and my job: We sometimes tell ________ about local attractions they can visit.","them","it","they"),
        q(52,"Me and my job: I don’t go ________ on vacation, but I always go away with my family in August.","later","abroad","school"),
        q(53,"Me and my job: We stay at a house by the beach and go ________ every day.","training","swimming","sunbathe"),
        q(54,"Me and my job: Next month, I’m going to take a ________ course so I can learn more about social media and websites.","promotion","career","training"),
        q(55,"Me and my job: I hope I’ll get a ________ next year.","career","promotion","receptionist"),
        q(56,"Jane Austen in popular culture: Jane Austen is probably one of the ________ British writers in history. (famous)","more famous","most famous","famousest"),
        q(57,"Jane Austen in popular culture: She ________ born in 1775. (be)","is","were","was"),
        q(58,"Jane Austen in popular culture: Today, over 200 years later, her work ________ still popular. (be)","was","are","is"),
        q(59,"Jane Austen in popular culture: Her books are very ________. (fun)","fun","funnier","funny"),
        q(60,"Jane Austen in popular culture: The ________ version of an Austen story might be Pride and Prejudice and Zombies. (strange)","more strange","strangest","most strangely"),
        q(61,"Jane Austen in popular culture: Unfortunately, it ________ very successful. (not be)","isn’t","weren’t","wasn’t"),
        q(62,"Jane Austen in popular culture: Other Austen movies are ________ than these examples. (traditional)","most traditional","more traditional","traditionaler"),
        q(63,"Jane Austen in popular culture: In the 1990s, Emma Thompson ________ an Oscar for her role in Sense and Sensibility. (receive)","received","receives","was receiving"),
        q(64,"Jane Austen in popular culture: There ________ some problems while they were making the movie. (be)","was","were","are"),
        q(65,"Jane Austen in popular culture: While they ________ part of the story in the rain, Kate Winslet got sick. (film)","were filming","filmed","are filming"),
        q(66,"Jane Austen in popular culture: Kate Winslet got sick and ________ developed hypothermia. (late)","later","latest","lately"),
        q(67,"Jane Austen in popular culture: When Jane Austen was alive, the movies ________. (not exist)","weren’t exist","don’t exist","didn’t exist"),
        q(68,"Jane Austen in popular culture: So what ________ in her free time? (she / do)","she did","did she do","was she do"),
        q(69,"Jane Austen in popular culture: ________ Jane Austen’s stories in another 200 years? (people / enjoy)","Do people enjoy","Will people enjoy","Are people enjoying"),
        q(70,"Jane Austen in popular culture: I’m going to the library the day ________ to bring home a Jane Austen book for my son! (tomorrow)","tomorrow after","after tomorrow","later tomorrow")
      ]
    },
    {
      label: "Reading", shortLabel: "Page 4", sourceLabel: "Units 1–4 · Page 4", title: "Reading", unit: "1-4", instructions: "Read the text. Choose True, False, or Not enough information.",
      passage: {title:"WWOOF",paragraphs:[
        "Do you enjoy spending time outdoors? Are you interested in a career in farming? Would you like to travel and learn new skills? Then why not join the WWOOF organization and become a WWOOFer?",
        "WWOOF means ‘World Wide Opportunities on Organic Farms.’ Sue Coppard started the organization in 1971, while she was working in London. Sue wanted to give people in the city the chance to visit the country, so in her free time, she organized trips to farms in England for her friends.",
        "At first, the trips only lasted two days, but then people started staying at the farms for weeks and even months. The organization grew and now there are WWOOF farms in more than 110 countries around the world.",
        "WWOOFers are workers on WWOOF farms. While staying on the farm, WWOOFers help the farmers with a variety of different jobs such as cutting wood, feeding animals, and picking fruit and vegetables. WWOOFers work hard, but they don’t earn a salary. Instead, the farm owners provide the WWOOFers with accommodation and food during their stay.",
        "WWOOFing is a great opportunity to do something different. You’ll be able to visit new places, meet new people, and learn new skills. Many people choose WWOOFing because it’s a cheap way to travel. As well as learning about farming, you may find out how to build walls, make cheese, or bake bread. And if you become a WWOOFer in another country, you might even learn a new language!",
        "The life of a farmer can be difficult. As a WWOOFer, you get up early and work hard. Some of the work will be very tiring. However, this means that WWOOFing is a great way to stay in shape!",
        "Your accommodation on the farm won’t be uncomfortable, but it may be very simple. You might need to camp in a field, or stay in a farm building.",
        "You’ll have time every day to explore and visit local attractions while you are volunteering, but after you finish your work."
      ]},
      questions:[
        q(71,"WWOOFing is only for people who want to work as farmers.","True","False","Not enough information"),q(72,"Sue Coppard was working as a tour guide when she started the WWOOF organization.","True","False","Not enough information"),q(73,"Today you can be a WWOOFer in over 110 different countries.","True","False","Not enough information"),q(74,"All WWOOFers do the same jobs.","True","False","Not enough information"),q(75,"WWOOFers need to buy their own food while they are staying at the farm.","True","False","Not enough information"),q(76,"WWOOFing allows people to travel without spending too much money.","True","False","Not enough information"),q(77,"WWOOFers can learn about producing different types of food.","True","False","Not enough information"),q(78,"You need to speak good English to become a WWOOFer.","True","False","Not enough information"),q(79,"Some people stay in tents while they are WWOOFing.","True","False","Not enough information"),q(80,"WWOOFers never have time off to go sightseeing.","True","False","Not enough information")
      ]
    }
  ]
};
