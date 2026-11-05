import { spanishFor } from './translations.mjs';
import { sourceBanks } from './source-banks.mjs';

export { sourceBanks };
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const topicLessons = {
  greetings: ['1A'], personal: ['1A', '1D'], alphabet: ['1A'], numbers: ['1A'],
  jobs: ['1B'], adjectives: ['1B', '1C'], countries: ['1C'], phrases: ['1A', '1D']
};
const item = (topic, term, meaning, example, extra = {}) => ({
  id: `v-${topic}-${slug(term)}`, term, meaning, spanish:spanishFor(term,extra), example, topic,
  lessonIds: topicLessons[topic], kind: 'word', ...extra
});
const greetings = [
  ['Good morning', 'A time-of-day greeting at 7:00 a.m.', 'Good morning, Jo!', { group: 'time-greeting' }],
  ['Good afternoon', 'A time-of-day greeting at 3:00 p.m.', 'Good afternoon, Alex.', { group: 'time-greeting' }],
  ['Good evening', 'A time-of-day greeting when you meet at 8:00 p.m.', 'Good evening. Nice to meet you.', { group: 'time-greeting' }],
  ['Hello', 'A greeting when you meet someone.', 'Hello! I am Mina.', { equivalentGroup: 'hello', aliases: ['Hi'] }],
  ['Hi', 'A short, friendly greeting.', 'Hi, Alex!', { equivalentGroup: 'hello', aliases: ['Hello'] }],
  ['Nice to meet you', 'A friendly phrase for meeting someone for the first time.', 'I am Jo. Nice to meet you.', { kind: 'phrase' }],
  ['See you later', 'A goodbye when you expect to meet again.', 'See you later, Mina.', { equivalentGroup: 'goodbye', kind: 'phrase' }],
  ['Goodbye', 'A word for leaving.', 'Goodbye, Jo!', { equivalentGroup: 'goodbye', aliases: ['Bye'] }],
  ['Bye', 'A short, friendly goodbye.', 'Bye! See you later.', { equivalentGroup: 'goodbye', aliases: ['Goodbye'] }],
  ['Good night', 'A goodbye at night or before you go to bed.', 'Good night. See you tomorrow.', { kind: 'phrase' }]
].map(row => item('greetings', ...row));

const personal = [
  ['name', 'All of “Ana Ruiz” together.', 'My name is Ana Ruiz.', { aliases: ['full name'] }],
  ['class', 'Your learning group, for example group 3.', 'I am in Class 3.'],
  ['first name', 'Ana in the name Ana Ruiz.', 'My first name is Ana.', { aliases: ['given name'] }],
  ['last name', 'Ruiz in the name Ana Ruiz.', 'My last name is Ruiz.', { aliases: ['surname', 'family name'] }],
  ['country', 'Canada in the address Toronto, Canada.', 'I am from Canada.'],
  ['city', 'Toronto in the address Toronto, Canada.', 'My city is Toronto.'],
  ['phone number', 'Digits used to call someone, for example 050 555 0123.', 'My phone number is 050 555 0123.', { aliases: ['telephone number'] }],
  ['email', 'An electronic address, for example ana@club.example.', 'My email is ana@club.example.', { aliases: ['email address', 'e-mail', 'e-mail address'] }],
  ['age', 'How old you are, for example 21.', 'My age is 21.'],
  ['address', 'A place where someone lives, for example 10 Park Street.', 'My address is 10 Park Street.', { aliases: ['home address', 'street address'] }],
  ['postal code', 'Letters or numbers that identify an area for mail.', 'My postal code is AB12 3CD.', { aliases: ['postcode', 'zip code'] }],
  ['nationality', 'Canadian in the pair Canada — Canadian.', 'My nationality is Canadian.'],
  ['What is your phone number?', 'The question for asking for digits to call someone.', 'What is your phone number? It is 050 555 0123.', { kind: 'question', aliases: ["What's your phone number?", 'What is your telephone number?'], spoken: 'What is your phone number?' }]
].map(row => item('personal', ...row));

const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter => item(
  'alphabet', `${letter}${letter.toLowerCase()}`, `The capital form of ${letter.toLowerCase()}.`,
  `${letter} is a capital letter.`, { kind: 'letter', letter, spoken: letter, aliases: [letter] }
));
const numberValues = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,30,40,50,60,70,80,90,100];
const smallNumbers = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const tens = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
export function numberToWords(value) {
  if (!Number.isInteger(value) || value < 0 || value > 100) throw new RangeError('Use a whole number from 0 to 100.');
  if (value < 20) return smallNumbers[value];
  if (value === 100) return 'one hundred';
  return tens[Math.floor(value / 10)] + (value % 10 ? `-${smallNumbers[value % 10]}` : '');
}
const numbers = numberValues.map(value => item('numbers', numberToWords(value), `${value}`, `Locker ${value}.`, {
  kind: 'number', numberValue: value, spoken: numberToWords(value), aliases: value === 0 ? ['oh'] : value === 100 ? ['a hundred'] : []
}));

const jobs = [
  ['teacher', 'A person who teaches a class.', 'Sam is a teacher.', { illustrationKey: 'job-teacher' }],
  ['student', 'A person who studies in a class.', 'Alex is a student.', { illustrationKey: 'job-student' }],
  ['chef', 'A person who cooks food in a restaurant.', 'I am a chef.', { aliases: ['cook'], illustrationKey: 'job-chef' }],
  ['doctor', 'A health professional who treats sick people.', 'She is a doctor.', { distractorGroup: 'health', illustrationKey: 'job-doctor' }],
  ['office worker', 'A person whose job is in an office.', 'He is an office worker.', { illustrationKey: 'job-office-worker' }],
  ['receptionist', 'A person who welcomes people at a hotel or office.', 'Mina is a receptionist.', { illustrationKey: 'job-receptionist' }],
  ['salesclerk', 'A person who helps customers in a store.', 'He is a salesclerk.', { aliases: ['sales clerk', 'shop assistant', 'sales assistant'], illustrationKey: 'job-salesclerk' }],
  ['taxi driver', 'A person whose job is to drive a taxi.', 'She is a taxi driver.', { distractorGroup: 'driving', illustrationKey: 'job-taxi-driver' }],
  ['waiter', 'A man who serves food at restaurant tables.', 'He is a waiter.', { illustrationKey: 'job-waiter' }],
  ['waitress', 'A woman who serves food at restaurant tables.', 'She is a waitress.', { illustrationKey: 'job-waitress' }],
  ['farmer', 'A person who grows food or keeps farm animals.', 'I am a farmer.', { illustrationKey: 'job-farmer' }],
  ['actor', 'A person who plays a character in a film or play.', 'He is an actor.', { illustrationKey: 'job-actor' }],
  ['school', 'A place with teachers, students and classes.', 'This is our school.', { kind: 'place', illustrationKey: 'place-school' }],
  ['nurse', 'A person who looks after patients and works with a doctor.', 'She is a nurse.', { distractorGroup: 'health', illustrationKey: 'job-nurse' }],
  ['dentist', 'A health professional who treats your teeth.', 'He is a dentist.', { distractorGroup: 'health', illustrationKey: 'job-dentist' }],
  ['police officer', 'A person who works for the police and helps people in the street.', 'She is a police officer.', { illustrationKey: 'job-police-officer' }],
  ['driver', 'A person whose job is to drive a vehicle.', 'He is a driver.', { distractorGroup: 'driving', illustrationKey: 'job-driver' }]
].map(row => item('jobs', ...row));

const adjectives = [
  ['big', 'Large in size.', 'The room is big.', { aliases: ['large'], opposite: 'small' }],
  ['small', 'Little in size.', 'The room is small.', { aliases: ['little'], opposite: 'big' }],
  ['hot', 'With a high temperature.', 'Today it is hot.', { opposite: 'cold' }],
  ['cold', 'With a low temperature.', 'Today it is cold.', { opposite: 'hot' }],
  ['old', 'Made or built a long time ago.', 'The building is old.', { opposite: 'new' }],
  ['new', 'Made or built recently.', 'The building is new.', { opposite: 'old' }],
  ['busy', 'Full of people or activity.', 'The street is busy.', { opposite: 'calm' }],
  ['calm', 'Peaceful, with little activity.', 'The park is calm.', { aliases: ['quiet', 'peaceful'], opposite: 'busy' }],
  ['cheap', 'Not costing much money.', 'The food is cheap.', { aliases: ['inexpensive'], opposite: 'expensive' }],
  ['expensive', 'Costing a lot of money.', 'The hotel is expensive.', { opposite: 'cheap' }],
  ['beautiful', 'Very nice to look at.', 'The city is beautiful.', { aliases: ['pretty'], distractorGroup: 'positive-quality' }],
  ['friendly', 'Kind and happy to talk to people.', 'The people are friendly.', { distractorGroup: 'positive-quality' }],
  ['famous', 'Known by many people.', 'The restaurant is famous.', { aliases: ['well-known', 'well known'] }],
  ['good', 'The opposite of bad.', 'The food is good.', { distractorGroup: 'positive-quality' }],
  ['smart', 'Good at learning and understanding things.', 'The students are smart.', { aliases: ['clever', 'intelligent'], distractorGroup: 'positive-quality' }],
  ['fun', 'Enjoyable; a good time.', 'The game is fun.', { aliases: ['enjoyable'], distractorGroup: 'positive-quality' }],
  ['long', 'With many letters, like the name Alexandra.', 'Alexandra is a long name.', { opposite: 'short' }],
  ['short', 'With few letters, like the name Ana.', 'Ana is a short name.', { opposite: 'long' }]
].map(row => item('adjectives', ...row));

const countryPairs = [
  ['Argentina','Argentinian'], ['the US','American'], ['the UK','British'], ['Canada','Canadian'],
  ['South Korea','South Korean'], ['Ecuador','Ecuadorian'], ['Mexico','Mexican'], ['Brazil','Brazilian'],
  ['Spain','Spanish'], ['China','Chinese'], ['Japan','Japanese']
];
const countryAliases = {'the US':['US','USA','the USA','United States','the United States'], 'the UK':['UK','United Kingdom','the United Kingdom']};
const countries = countryPairs.flatMap(([country,nationality]) => [
  item('countries', country, `The country for the nationality ${nationality}.`, `I am from ${country}.`, {kind:'country', pair:nationality, aliases:countryAliases[country] || []}),
  item('countries', nationality, `The nationality for a person from ${country}.`, `I am ${nationality}.`, {kind:'nationality', pair:country, aliases:nationality==='Argentinian'?['Argentine']:[]})
]);

// These exact phrases are useful source models, rather than additional required bank entries.
const phrases = [
  ['What is your name?', 'Ask for a person’s full name.', 'What is your name? My name is Ana Ruiz.', {aliases:["What's your name?"]}],
  ['How do you spell that?', 'Ask for the letters of a name.', 'How do you spell that? A-N-A.'],
  ['Where are you from?', 'Ask for a person’s country.', 'Where are you from? I am from Canada.'],
  ['What is your first name?', 'Ask for the first part of a person’s name.', 'What is your first name? Ana.', {aliases:["What's your first name?"]}],
  ['What is your last name?', 'Ask for a person’s family name.', 'What is your last name? Ruiz.', {aliases:["What's your last name?"]}],
  ['What is your city?', 'Ask for a person’s city.', 'What is your city? Toronto.', {aliases:["What's your city?"]}],
  ['What is your email?', 'Ask for an electronic address.', 'What is your email? ana@club.example.', {aliases:["What's your email?",'What is your email address?']}]
].map(row => item('phrases', ...row.slice(0,3), {kind:'question', supportOnly:true, ...row[3]}));

export const vocabulary = [...greetings,...personal,...alphabet,...numbers,...jobs,...adjectives,...countries,...phrases];
export const wordById = Object.fromEntries(vocabulary.map(word=>[word.id,word]));
const ids = (topic, terms) => vocabulary.filter(word=>word.topic===topic && (!terms || terms.includes(word.term))).map(word=>word.id);
const chunk = (id,lessonId,title,description,wordIds,extra={}) => ({id,lessonId,title,description,wordIds,estimatedMinutes:3,...extra});
export const chunks = [
  chunk('1a-greetings','1A','Greetings','Meet someone and choose a greeting.',ids('greetings',['Good morning','Good afternoon','Good evening','Hello','Hi','Nice to meet you']),{character:'mina'}),
  chunk('1a-goodbyes','1A','Goodbyes','Leave a conversation with a friendly goodbye.',ids('greetings',['See you later','Goodbye','Bye','Good night']),{character:'pico'}),
  chunk('1a-your-details','1A','Names and contact details','Names, class and contact details.',ids('personal',['name','class','first name','last name','phone number','email','What is your phone number?']),{character:'mina'}),
  chunk('1a-more-details','1A','Personal information','Countries, cities and the extra fields in a form.',ids('personal',['country','city','age','address','postal code','nationality']),{character:'mina'}),
  chunk('1a-alphabet-ag','1A','Alphabet A–G','Match capital and small letters.',ids('alphabet').slice(0,7),{character:'alex'}),
  chunk('1a-alphabet-hn','1A','Alphabet H–N','Keep following the alphabet.',ids('alphabet').slice(7,14),{character:'alex'}),
  chunk('1a-alphabet-ot','1A','Alphabet O–T','Find the right letters.',ids('alphabet').slice(14,20),{character:'alex'}),
  chunk('1a-alphabet-uz','1A','Alphabet U–Z','Complete your alphabet collection.',ids('alphabet').slice(20),{character:'alex'}),
  chunk('1a-numbers-small','1A','Numbers 0–10','Read and remember short number codes.',ids('numbers').slice(0,11),{character:'pico'}),
  chunk('1a-numbers-teens','1A','Numbers 11–19','Meet the teen numbers.',ids('numbers').slice(11,20),{character:'alex'}),
  chunk('1a-numbers-tens','1A','Numbers 20–100','Read tens and build bigger numbers.',ids('numbers').slice(20),{character:'alex'}),
  chunk('1b-jobs-town','1B','Jobs 1','Meet people at school, work and the café.',ids('jobs',['teacher','student','chef','doctor','office worker','receptionist']),{character:'jo'}),
  chunk('1b-jobs-places','1B','Jobs 2','Shops, restaurants, farms and more.',ids('jobs',['salesclerk','taxi driver','waiter','waitress','farmer','actor','school']),{character:'jo'}),
  chunk('1b-more-jobs','1B','Jobs 3','Explore the extra jobs in your word bank.',ids('jobs',['nurse','dentist','police officer','driver']),{character:'mina'}),
  chunk('1b-opposites','1B','Opposites','Size, temperature, age, activity and price.',ids('adjectives').slice(0,10),{character:'alex'}),
  chunk('1b-people-words','1B','Describing people and places','Words for people, places and a good time.',ids('adjectives').slice(10),{character:'jo'}),
  chunk('1c-world-start','1C','Countries and nationalities 1','Country and nationality pairs from the lesson.',ids('countries').slice(0,10),{character:'mina'}),
  chunk('1c-world-more','1C','Countries and nationalities 2','Explore the fuller country and nationality bank.',ids('countries').slice(10),{character:'mina'}),
  chunk('1c-places-opposites','1C','Adjectives 1','Describe a place using opposite words.',ids('adjectives').slice(0,10),{character:'jo'}),
  chunk('1c-place-personality','1C','Adjectives 2','Say what a place or person is like.',ids('adjectives').slice(10),{character:'alex'}),
  chunk('1d-names-contact','1D','Personal information 1','Choose the right fields for names and contact details.',ids('personal',['name','class','first name','last name','phone number','email','What is your phone number?']),{character:'jo'}),
  chunk('1d-full-card','1D','Personal information 2','Country, city, age, address, postal code and nationality.',ids('personal',['country','city','age','address','postal code','nationality']),{character:'mina'}),
  chunk('1d-ask-check','1D','Personal questions','Useful questions for completing a form.',[...ids('phrases'),...ids('personal',['What is your phone number?'])],{character:'jo',supportOnly:true})
];
export const chunkById=Object.fromEntries(chunks.map(value=>[value.id,value]));

const choice = (id,prompt,correct,distractors,explanation,extra={}) => ({id,type:'choice',prompt,correctText:correct,distractors,explanation,wordIds:[],...extra});
const text = (id,prompt,accepted,explanation,extra={}) => ({id,type:'text',prompt,answer:accepted[0],accepted,explanation,wordIds:[],...extra});
const order = (id,prompt,sentence,extra={}) => ({id,type:'order',prompt,answer:sentence,accepted:[sentence],tokens:sentence.match(/\S+/g),explanation:sentence,wordIds:[],...extra});

const beRows=[
 ['I','am','I am a student.','I am not a student.','Am I a student?'],
 ['You','are','You are a student.','You are not a student.','Are you a student?'],
 ['He','is','He is a student.','He is not a student.','Is he a student?'],
 ['She','is','She is a student.','She is not a student.','Is she a student?'],
 ['It','is','It is a school.','It is not a school.','Is it a school?'],
 ['We','are','We are students.','We are not students.','Are we students?'],
 ['They','are','They are students.','They are not students.','Are they students?']
];
const formsQuestions=beRows.map(([subject,verb,positive],i)=>choice(`be-form-${i}`,`Complete: ${positive.replace(` ${verb} `,' ___ ')}`,verb,['am','is','are'].filter(x=>x!==verb),positive));
export const grammarSets=[
 {id:'1a-be',lessonId:'1A',title:'Verb to be',description:'Positive sentences, negatives, questions and short answers.',
  models:{columns:['Subject','Positive','Negative','Question'],rows:beRows.map(([subject,,positive,negative,question])=>[subject,positive,negative,question]),shortAnswers:[['Are you a student?','Yes, I am.','No, I’m not.'],['Is she a teacher?','Yes, she is.','No, she isn’t.'],['Are they students?','Yes, they are.','No, they aren’t.']]},
  questions:[...formsQuestions,
   choice('be-not','Choose the negative sentence.','She is not a teacher.',['She not is a teacher.','She is no a teacher.','She not a teacher.'],'She is not a teacher.'),
   choice('be-question','Choose the question.','Is she a teacher?',['She is a teacher?','Is a teacher she?','She a teacher is?'],'Is she a teacher?'),
   choice('be-short-positive','Is she a teacher? Choose a correct short answer.','Yes, she is.',['Yes, she’s.','Yes, she are.','Yes, is she.'],'Yes, she is.'),
   choice('be-short-negative','Are they in Class 2? The card says Class 3.','No, they aren’t.',['Yes, they are.','No, they isn’t.','No, they not.'],'No, they are not in Class 2.'),
   text('be-negative-i','Make this negative: I am a teacher.',['I am not a teacher.',"I'm not a teacher."],'I am not a teacher.'),
   text('be-question-they','Make this a question: They are students.',['Are they students?'],'Are they students?'),
   order('be-order-you','Build the question.','Are you a student?'),
   order('be-order-negative','Build the negative sentence.','They are not teachers.')
  ]},
 {id:'1b-articles',lessonId:'1B',title:'A and an',description:'Choose the article for the first sound.',
  models:{columns:['First sound','Article','Examples'],rows:[['Consonant sound','a','a teacher · a taxi driver'],['Vowel sound','an','an actor · an office worker']]},
  questions:[...['teacher','student','chef','doctor','receptionist','salesclerk','taxi driver','waiter','waitress','farmer','nurse','dentist','police officer','driver'].map((job,i)=>choice(`article-a-${i}`,`Complete: I am ___ ${job}.`,'a',['an'],`I am a ${job}.`)),
   ...['actor','office worker'].map((job,i)=>choice(`article-an-${i}`,`Complete: I am ___ ${job}.`,'an',['a'],`I am an ${job}.`)),
   text('article-repair-office','Fix one word: I am a office worker.',['I am an office worker.'],'I am an office worker.'),
   text('article-repair-teacher','Fix one word: She is an teacher.',['She is a teacher.'],'She is a teacher.'),
   order('article-order-actor','Build the sentence.','Alex is an actor.')
  ]},
 {id:'1b-contractions',lessonId:'1B',title:'Contractions',description:'Full forms and contractions of be.',
  models:{columns:['Full form','Short form'],rows:[['I am','I’m'],['You are','You’re'],['He is','He’s'],['She is','She’s'],['It is','It’s'],['We are','We’re'],['They are','They’re']]},
  questions:[...[
   ['I am a student.',"I'm a student."],['You are my friend.',"You're my friend."],['He is a doctor.',"He's a doctor."],['She is my teacher.',"She's my teacher."],['It is a good job.',"It's a good job."],['We are students.',"We're students."],['They are friendly.',"They're friendly."]
  ].flatMap(([full,short],i)=>[text(`contract-${i}`,`Write the short form: ${full}`,[short],short),text(`expand-${i}`,`Write the full form: ${short}`,[full],full)]),
   choice('contract-youre','Choose the short form of “You are a student.”',"You're a student.",["Your a student.","You's a student.","You'm a student."],"You're a student.")
  ]},
 {id:'1c-be-descriptions',lessonId:'1C',title:'Be: people and places',description:'Use be with a nationality or an adjective.',
  models:{columns:['Country','Nationality'],rows:countryPairs.map(([country,nationality])=>[`I am from ${country}.`,`I am ${nationality}.`])},
  questions:[
   choice('country-from','Complete: I am ___ Canada.','from',['Canadian','is','a'],'I am from Canada.'),
   choice('nationality-be','Complete: She ___ Ecuadorian.','is',['am','are','from'],'She is Ecuadorian.'),
   choice('city-be','Complete: The city ___ beautiful.','is',['am','are','from'],'The city is beautiful.'),
   choice('people-be','Complete: The people ___ friendly.','are',['am','is','from'],'The people are friendly.'),
   order('country-order','Build the sentence.','I am from Mexico.'),
   order('nationality-order','Build the sentence.','Mina is Canadian.'),
   order('place-order','Build the sentence.','The park is calm.'),
   text('nationality-argentina','Complete with the nationality: Jo is from Argentina. Jo is ___.',['Argentinian','Argentine'],'Jo is Argentinian.'),
   text('city-question','Make a question: The city is big.',['Is the city big?'],'Is the city big?')
  ]},
 {id:'1d-capitals',lessonId:'1D',title:'Capital letters',description:'Names, places, sentence starts and the word I.',
  models:{columns:['Use','Example'],rows:[['Names','Ana Ruiz'],['Places','Toronto · Canada'],['Sentence start and I','Hello, I am Ana.'],['Email','ana@club.example']]},
  questions:[
   text('caps-name','Write the name with capital letters: emma carter',['Emma Carter'],'Emma Carter',{normalization:'capitalization'}),
   text('caps-place','Write the places with capital letters: manta, ecuador',['Manta, Ecuador'],'Manta, Ecuador',{normalization:'capitalization'}),
   text('caps-sofia','Write the name with capital letters: sofia lopez',['Sofia Lopez','Sofía López'],'Sofia Lopez',{normalization:'capitalization'}),
   text('caps-i','Write it with capitals and a full stop: i am from canada',['I am from Canada.'],'I am from Canada.',{normalization:'capitalization'}),
   text('caps-name-sentence','Write it with capitals and a full stop: my name is daniel',['My name is Daniel.'],'My name is Daniel.',{normalization:'capitalization'}),
   text('caps-introduction','Write it with capitals and full stops: hello i am sara cruz i am from canada',['Hello, I am Sara Cruz. I am from Canada.','Hello. I am Sara Cruz. I am from Canada.','Hello I am Sara Cruz. I am from Canada.'],'Hello, I am Sara Cruz. I am from Canada.',{normalization:'capitalization'}),
   choice('caps-email','Copy the supplied email: ana@club.example','ana@club.example',['Ana@Club.Example','ana at club.example','ana@club Example'],'ana@club.example',{normalization:'capitalization'}),
   choice('caps-country','Which sentence is ready for the club card?','I am from Ecuador.',['i am from Ecuador.','I am from ecuador.','i am from ecuador.'],'I am from Ecuador.',{normalization:'capitalization'})
  ]}
];

const listeningQuestions=[
 choice('listen-class','Listen to Tom and Mary. What class is Mary in?','Class 4',['Class 1','Class 2','Class 3'],'Mary says, “I am in Class 4.”',{lessonId:'1A',audio:'../A1/Audios/Track 1.1.mp3',audioLabel:'Track 1.1 · New friends'}),
 choice('listen-teacher','Listen to Tom and Mary. Who is Mary’s teacher?','Mr. Wilson',['Tom','Mary','Jo'],'Mary confirms that Mr. Wilson is her teacher.',{lessonId:'1A',audio:'../A1/Audios/Track 1.1.mp3',audioLabel:'Track 1.1 · New friends'}),
 ...["I'm","You're","He's","She's"].map((short,i)=>choice(`listen-short-${i}`,`Listen to pair ${i+1}. Which short form do you hear?`,short,["I'm","You're","He's","She's"].filter(x=>x!==short),short,{lessonId:'1A',audio:'../A1/Audios/Track 1.2.mp3',audioLabel:'Track 1.2 · Two words, one short form'})),
 choice('listen-ariana-name','Listen to the new student. What is her name?','Ariana',['Allison','Ana','Lindsay'],'Her name is Ariana. A-R-I-A-N-A.',{lessonId:'1A',audio:'../A1/Audios/Track 1.3.mp3',audioLabel:'Track 1.3 · Personal information'}),
 text('listen-ariana-phone','Listen to Ariana. Type her phone number.',['0952107168'],'095 210 7168',{lessonId:'1A',audio:'../A1/Audios/Track 1.3.mp3',audioLabel:'Track 1.3 · Personal information',normalization:'digits'}),
 choice('listen-alphabet-start','Listen to the alphabet. Which group comes first?','A, B, C',['C, B, A','B, C, D','D, E, F'],'The alphabet begins A, B, C.',{lessonId:'1A',audio:'../A1/Audios/Track 1.4.mp3',audioLabel:'Track 1.4 · The alphabet'}),
 choice('listen-alphabet-end','Listen to the alphabet. Which group comes last?','W, X, Y, Z',['W, Y, X, Z','U, V, W, X','X, W, Z, Y'],'The final group is W, X, Y, Z.',{lessonId:'1A',audio:'../A1/Audios/Track 1.4.mp3',audioLabel:'Track 1.4 · The alphabet'}),
 ...[['Stephen',['Steven','Stefan','Stephan']],['Allison',['Alisson','Alison','Alyson']],['Bryan',['Brayan','Brian','Briyan']],['Lindsay',['Lindsey','Lindsy','Linsay']]].map(([name,wrong],i)=>choice(`listen-spell-${i}`,`Listen to name ${i+1}. Choose the spelling you hear.`,name,wrong,name,{lessonId:'1A',audio:'../A1/Audios/Track 1.5.mp3',audioLabel:'Track 1.5 · Names and letters'})),
 choice('listen-number-start','Listen to the number list. Which number comes first?','zero',['one','two','ten'],'The first number is zero.',{lessonId:'1A',audio:'../A1/Audios/Track 1.6.mp3',audioLabel:'Track 1.6 · Numbers'}),
 choice('listen-number-end','Listen to the number list. Which number comes last?','ten',['nine','eleven','twelve'],'The last number is ten.',{lessonId:'1A',audio:'../A1/Audios/Track 1.6.mp3',audioLabel:'Track 1.6 · Numbers'}),
 ...[['Allison','2','0984102376'],['Bryan','5','0963215084'],['Lindsay','3','0997601425']].flatMap(([name,classNumber,phone],i)=>[
  choice(`listen-profile-class-${i}`,`Listen to the interviews. What class is ${name} in?`,`Class ${classNumber}`,['Class 2','Class 3','Class 5','Class 4'].filter(x=>x!==`Class ${classNumber}`),`${name} is in Class ${classNumber}.`,{lessonId:'1A',audio:'../A1/Audios/Track 1.7.mp3',audioLabel:'Track 1.7 · Names, classes and numbers'}),
  text(`listen-profile-phone-${i}`,`Listen to the interviews. Type ${name}’s phone number.`,[phone],phone,{lessonId:'1A',audio:'../A1/Audios/Track 1.7.mp3',audioLabel:'Track 1.7 · Names, classes and numbers',normalization:'digits'})
 ]),
 choice('listen-job-list','Listen to the job list. Which job comes just after doctor?','office worker',['receptionist','teacher','salesclerk'],'The list says “A doctor. An office worker.”',{lessonId:'1B',audio:'../A1/Audios/Track 1.8.mp3',audioLabel:'Track 1.8 · Jobs'}),
 ...[['Allison','doctor'],['Mike','farmer'],['John','office worker'],['Lisa','waitress'],['Bryan','salesclerk']].map(([name,job],i)=>choice(`listen-job-${i}`,`Listen. What is ${name}’s job?`,job,['doctor','farmer','office worker','waitress','salesclerk'].filter(x=>x!==job),`${name} is a ${job}.`,{lessonId:'1B',audio:'../A1/Audios/Track 1.9.mp3',audioLabel:'Track 1.9 · Jobs in town'})),
 choice('listen-two-jobs','Listen to the three people. Who has two jobs?','Tom',['Sarah','Marco','All three people'],'Tom is a taxi driver in the morning and a teacher in the evening.',{lessonId:'1B',audio:'../A1/Audios/Track 1.8 - Exercise 4.1.mp3',audioLabel:'Track 1.8 · At work, in their words'}),
 ...[['Lionel Messi','Argentina'],['Taylor Swift','the US'],['Keanu Reeves','Canada'],['Millie B. Brown','the UK'],['Lee Jung-jae','South Korea']].map(([name,country],i)=>choice(`listen-country-${i}`,`Listen. Where is ${name} from in the recording?`,country,['Argentina','the US','Canada','the UK','South Korea'].filter(x=>x!==country),`The recording says ${name} is from ${country}.`,{lessonId:'1C',audio:'../A1/Audios/Track 1.10.mp3',audioLabel:'Track 1.10 · People and countries'})),
 choice('listen-emma-country','Listen at the hotel. Where is Emma from?','Canada',['Argentina','Ecuador','the UK'],'Emma says she is from Canada.',{lessonId:'1D',audio:'../A1/Audios/Track 1.12.mp3',audioLabel:'Track 1.12 · At the hotel'}),
 choice('listen-emma-last','Listen at the hotel. What is Emma’s last name?','Carter',['Toronto','Lisa','Canada'],'Carter. C-A-R-T-E-R.',{lessonId:'1D',audio:'../A1/Audios/Track 1.12.mp3',audioLabel:'Track 1.12 · At the hotel'})
];

const readingQuestions=[
 choice('read-club-role','Read the club card. What is Alex’s job?','student',['teacher','doctor','chef'],'Alex is a student.',{lessonId:'1A',passage:'Town Club\nName: Alex Chen\nClass: 3\nJob: student\nTeacher: Sam'}),
 choice('read-club-class','Read the club card. What class is Alex in?','Class 3',['Class 1','Class 2','Class 4'],'The card says Class 3.',{lessonId:'1A',passage:'Town Club\nName: Alex Chen\nClass: 3\nJob: student\nTeacher: Sam'}),
 choice('read-duty-food','Read the duty board. Who cooks the lunch?','Jo',['Alex','Mina','Sam'],'Jo is the chef.',{lessonId:'1B',passage:'Today at Town Club\nJo: chef — cooks the lunch\nMina: receptionist — welcomes visitors\nAlex: student — English class\nSam: teacher — teaches the class'}),
 choice('read-duty-reception','Read the duty board. Who welcomes visitors?','Mina',['Alex','Jo','Sam'],'Mina is the receptionist.',{lessonId:'1B',passage:'Today at Town Club\nJo: chef — cooks the lunch\nMina: receptionist — welcomes visitors\nAlex: student — English class\nSam: teacher — teaches the class'}),
 choice('read-room-small','Which room is small?','Room B',['Room A','Both rooms','The message does not say.'],'Room B is small.',{lessonId:'1C',passage:'Room A: big, old building, busy, hot, cheap.\nRoom B: small, new building, calm, cold, expensive.'}),
 choice('read-room-cheap','Which room costs less money?','Room A',['Room B','Both cost the same.','The message does not say.'],'Room A is cheap. Room B is expensive.',{lessonId:'1C',passage:'Room A: big, old building, busy, hot, cheap.\nRoom B: small, new building, calm, cold, expensive.'}),
 ...[
  ['read-city-hot','In the posts, which city is hot?','Rio de Janeiro',['Toronto','Hong Kong','All three cities'],'The Rio post says it is hot.'],
  ['read-city-buildings','Which post mentions both old and new buildings?','Toronto',['Rio de Janeiro','Hong Kong','None of the posts'],'The Toronto post mentions old and new buildings.'],
  ['read-city-parks','In which post are some parks calm?','Hong Kong',['Rio de Janeiro','Toronto','All three posts'],'The Hong Kong post says some parks are calm.'],
  ['read-city-price','Which post has cheap food and expensive hotels?','Hong Kong',['Toronto','Rio de Janeiro','None of the posts'],'The Hong Kong post has cheap food and expensive hotels.']
 ].map(([id,prompt,correct,wrong,explanation])=>choice(id,prompt,correct,wrong,explanation,{lessonId:'1C',passage:'Three class travel posts\nRio de Janeiro: Today it is hot. The beaches are beautiful. The people are friendly.\nToronto: Today it is cold. Some buildings are old and some are new. The food is expensive.\nHong Kong: The city is busy, but some parks are calm. The food is cheap. The hotels are expensive.'})),
 text('form-first-name','Read the club card. Write the first name.',['Camila'],'Camila is the first name.',{lessonId:'1D',passage:'Camila Rios\nArgentina · Salta\n07 216 405\ncamila@club.example',normalization:'name'}),
 text('form-last-name','Read the club card. Write the last name.',['Rios','Ríos'],'Rios is the last name.',{lessonId:'1D',passage:'Camila Rios\nArgentina · Salta\n07 216 405\ncamila@club.example',normalization:'name'}),
 choice('form-city-label','Camila’s card says “Salta”. Which label belongs here?','city',['country','first name','last name'],'Salta is the city.',{lessonId:'1D',passage:'Camila Rios\nArgentina · Salta\n07 216 405\ncamila@club.example'}),
 text('form-copy-phone','Read the club card. Copy the phone number.',['07410632'],'07 410 632',{lessonId:'1D',passage:'Elliot Gray\nthe UK · Bristol\n07 410 632\nelliot@club.example',normalization:'digits'}),
 choice('form-country-label','Elliot’s card says “the UK”. Which label belongs here?','country',['city','first name','last name'],'The UK is the country.',{lessonId:'1D',passage:'Elliot Gray\nthe UK · Bristol\n07 410 632\nelliot@club.example'})
];

export const challengeQuestions=[...listeningQuestions,...readingQuestions];
export const grammarSetById=Object.fromEntries(grammarSets.map(value=>[value.id,value]));
export const games=[
 {id:'1a-greeting-pairs',lessonId:'1A',title:'Greeting match',type:'memory',description:'Match English and Spanish.',chunkIds:['1a-greetings','1a-goodbyes'],character:'mina'},
 {id:'1a-locker-codes',lessonId:'1A',title:'Number memory',type:'locker',description:'Remember a short number code, then enter it.',chunkIds:['1a-numbers-small'],character:'pico'},
 {id:'1a-name-password',lessonId:'1A',title:'Name spelling',type:'spelling',description:'Put the letters of a name in order.',chunkIds:['1a-alphabet-ag','1a-alphabet-hn','1a-alphabet-ot','1a-alphabet-uz'],character:'alex'},
 {id:'1b-duty-board',lessonId:'1B',title:'Job match',type:'matching',description:'Match English and Spanish.',chunkIds:['1b-jobs-town','1b-jobs-places','1b-more-jobs'],character:'jo'},
 {id:'1b-opposite-pairs',lessonId:'1B',title:'Adjective match',type:'opposites',description:'Match English and Spanish.',chunkIds:['1b-opposites'],character:'alex'},
 {id:'1c-postcards',lessonId:'1C',title:'Country match',type:'countries',description:'Match English and Spanish.',chunkIds:['1c-world-start','1c-world-more'],character:'mina'},
 {id:'1c-room-message',lessonId:'1C',title:'Reading: rooms',type:'reading',description:'Use the room cards to choose and repair a message.',chunkIds:['1c-places-opposites'],character:'jo'},
 {id:'1d-club-card',lessonId:'1D',title:'Personal information',type:'form',description:'Sort the labels and check a fictional club card.',chunkIds:['1d-names-contact','1d-full-card'],character:'mina'}
];

const grammarActivities=grammarSets.map(set=>({id:`practice-${set.id}`,lessonId:set.lessonId,title:set.title,type:'grammar',description:set.description,grammarSetIds:[set.id],character:set.lessonId==='1B'?'alex':'mina',estimatedMinutes:3}));
const vocabActivities=chunks.map(set=>({id:`quiz-${set.id}`,lessonId:set.lessonId,title:set.title,type:'quiz',description:set.description,chunkIds:[set.id],character:set.character,estimatedMinutes:3}));
const archivedActivities=[...vocabActivities,...grammarActivities,...games.map(game=>({...game,estimatedMinutes:3})),
 ...['1A','1B','1C','1D'].map(lessonId=>({id:`listen-${lessonId.toLowerCase()}`,lessonId,title:'Listening',type:'listening',description:'Listen to a real book recording and find the details.',character:'jo',estimatedMinutes:4})),
 ...['1A','1B','1C','1D'].map(lessonId=>({id:`read-${lessonId.toLowerCase()}`,lessonId,title:'Reading',type:'reading',description:'Read a short message and find the information.',character:'mina',estimatedMinutes:3})),
 ...['1A','1B','1C','1D'].map(lessonId=>({id:`review-${lessonId.toLowerCase()}`,lessonId,title:'Review',type:'review',description:'Combine the lesson’s words and grammar.',character:'pico',estimatedMinutes:4}))
];
// Main-path topics mirror the book. Smaller sets remain available in Practise.
const topicActivities=[
 {id:'topic-1a-greetings',lessonId:'1A',title:'Greetings',type:'quiz',chunkIds:['1a-greetings','1a-goodbyes'],character:'mina'},
 {id:'topic-1a-alphabet',lessonId:'1A',title:'Alphabet',type:'quiz',chunkIds:['1a-alphabet-ag','1a-alphabet-hn','1a-alphabet-ot','1a-alphabet-uz'],character:'alex'},
 {id:'topic-1a-numbers',lessonId:'1A',title:'Numbers',type:'quiz',chunkIds:['1a-numbers-small','1a-numbers-teens','1a-numbers-tens'],character:'alex'},
 {id:'topic-1a-be',lessonId:'1A',title:'Verb to be',type:'grammar',grammarSetIds:['1a-be'],character:'mina'},
 {id:'topic-1b-jobs',lessonId:'1B',title:'Jobs',type:'quiz',chunkIds:['1b-jobs-town','1b-jobs-places','1b-more-jobs'],character:'jo'},
 {id:'topic-1b-articles',lessonId:'1B',title:'A and an',type:'grammar',grammarSetIds:['1b-articles'],character:'alex'},
 {id:'topic-1b-contractions',lessonId:'1B',title:'Contractions',type:'grammar',grammarSetIds:['1b-contractions'],character:'alex'},
 {id:'topic-1c-countries',lessonId:'1C',title:'Countries and nationalities',type:'quiz',chunkIds:['1c-world-start','1c-world-more'],character:'mina'},
 {id:'topic-1c-adjectives',lessonId:'1C',title:'Adjectives',type:'quiz',chunkIds:['1c-places-opposites','1c-place-personality'],character:'jo'},
 {id:'topic-1c-be',lessonId:'1C',title:'Be: people and places',type:'grammar',grammarSetIds:['1c-be-descriptions'],character:'alex'},
 {id:'topic-1d-details',lessonId:'1D',title:'Personal information',type:'quiz',chunkIds:['1d-names-contact','1d-full-card'],character:'mina'},
 {id:'topic-1d-questions',lessonId:'1D',title:'Personal questions',type:'quiz',chunkIds:['1d-ask-check'],character:'jo'},
 {id:'topic-1d-capitals',lessonId:'1D',title:'Capital letters',type:'grammar',grammarSetIds:['1d-capitals'],character:'alex'}
].map(activity=>({...activity,estimatedMinutes:3,description:'',kind:'topic'}));
export const activities=[...archivedActivities,...topicActivities];
export const activityById=Object.fromEntries(activities.map(value=>[value.id,value]));
export const pathNodes=['1A','1B','1C','1D'].flatMap(lessonId=>[
 ...topicActivities.filter(activity=>activity.lessonId===lessonId),
 ...['listening','reading'].map((type,index)=>({...activityById[`${index?'read':'listen'}-${lessonId.toLowerCase()}`],title:index?'Reading game':'Listening game',kind:'game',estimatedMinutes:2}))
]).map(node=>({...node,wordCount:new Set((node.chunkIds||[]).flatMap(id=>chunkById[id].wordIds)).size}));
export const pathNodeById=Object.fromEntries(pathNodes.map(node=>[node.id,node]));
export const lessons=[
 {id:'1A',title:'New friends',subtitle:'Meet someone, spell a name and exchange numbers.',character:'mina',color:'magenta',grammarSetIds:['1a-be']},
 {id:'1B',title:"What’s your job?",subtitle:'Find out what people do.',character:'jo',color:'orange',grammarSetIds:['1b-articles','1b-contractions']},
 {id:'1C',title:'Where are you from?',subtitle:'Describe a city and choose a place for a friend.',character:'mina',color:'blue',grammarSetIds:['1c-be-descriptions']},
 {id:'1D',title:'Let’s fill in a form',subtitle:'Ask for details and complete a registration form.',character:'alex',color:'magenta',grammarSetIds:['1d-capitals']}
].map(lesson=>({...lesson,chunkIds:chunks.filter(x=>x.lessonId===lesson.id).map(x=>x.id),activityIds:activities.filter(x=>x.lessonId===lesson.id).map(x=>x.id),pathNodeIds:pathNodes.filter(x=>x.lessonId===lesson.id).map(x=>x.id),bookPages:lesson.id==='1A'?[5,6]:lesson.id==='1B'?[7,8]:lesson.id==='1C'?[9,10]:[11,12]}));
export const lessonById=Object.fromEntries(lessons.map(value=>[value.id,value]));
export const course={id:'horizons-a1',bookId:'a1',title:'Horizons A1',level:'A1',unit:1,unitTitle:'New friends',language:'English',lessonIds:lessons.map(x=>x.id),
  description:'Vocabulary and grammar practice for the Student’s Book.',
  bookUrl:'../A1/Student%27s%20Book.html',sourceEdition:'2026-11-02',allLessonsAvailable:true,
  activityIds:activities.map(x=>x.id),pathNodeIds:pathNodes.map(x=>x.id),requiredBankEntries:vocabulary.filter(x=>!x.supportOnly).length};
