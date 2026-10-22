export interface TaleParagraph {
  en: string;
  ru: string;
}

export interface TalePage {
  /** Illustration file in public/tales (public-domain artwork, see credit). */
  img?: string;
  credit?: string;
  paragraphs: TaleParagraph[];
}

export interface Tale {
  id: string;
  title: string;
  titleRu: string;
  source: string;
  level: string;
  pages: TalePage[];
}

/** Classic fairy tales retold in simple English (original retellings, A1–A2). */
export const tales: Tale[] = [
  {
    id: "pigs",
    title: "The Three Little Pigs",
    titleRu: "Три поросёнка",
    source: "английская народная сказка",
    level: "A1",
    pages: [
      {
        paragraphs: [
          { en: "Once upon a time there were three little pigs. They lived with their mother in a small house.", ru: "Жили-были три поросёнка. Они жили с мамой в маленьком домике." },
          { en: "One day the mother said: \"You are big now. Go and build your own houses.\" The three little pigs said goodbye and went down the road.", ru: "Однажды мама сказала: «Вы уже большие. Идите и постройте свои дома». Три поросёнка попрощались и пошли по дороге." },
        ],
      },
      {
        paragraphs: [
          { en: "The first pig was lazy. He built a house of straw. It was quick and easy.", ru: "Первый поросёнок был ленивый. Он построил дом из соломы. Это было быстро и легко." },
          { en: "The second pig built a house of sticks. It was a little stronger.", ru: "Второй поросёнок построил дом из веток. Он был немного крепче." },
        ],
      },
      {
        paragraphs: [
          { en: "The third pig worked all day. He built a house of bricks. It was strong and warm.", ru: "Третий поросёнок работал весь день. Он построил дом из кирпичей. Он был крепкий и тёплый." },
          { en: "\"Why do you work so hard?\" laughed his brothers. \"Because a wolf lives in the forest,\" said the third pig.", ru: "«Почему ты так много работаешь?» — смеялись братья. «Потому что в лесу живёт волк», — сказал третий поросёнок." },
        ],
      },
      {
        paragraphs: [
          { en: "Soon the wolf came to the house of straw. \"Little pig, little pig, let me in!\" he said. \"No, no, no!\" said the pig.", ru: "Скоро волк пришёл к дому из соломы. «Поросёнок, поросёнок, впусти меня!» — сказал он. «Нет, нет, нет!» — сказал поросёнок." },
          { en: "\"Then I will huff and puff and blow your house down!\" The wolf blew, and the house of straw fell down. The first pig ran to his brother.", ru: "«Тогда я как дуну, как дуну — и сдую твой дом!» Волк дунул, и дом из соломы упал. Первый поросёнок побежал к брату." },
        ],
      },
      {
        paragraphs: [
          { en: "The wolf came to the house of sticks. He huffed and puffed, and the house fell down too. The two pigs ran to the house of bricks.", ru: "Волк пришёл к дому из веток. Он дул и дул, и этот дом тоже упал. Два поросёнка побежали к дому из кирпичей." },
          { en: "The wolf huffed and puffed and puffed and huffed, but the brick house did not fall.", ru: "Волк дул и дул, пыхтел и пыхтел, но кирпичный дом не упал." },
        ],
      },
      {
        paragraphs: [
          { en: "The wolf was angry. He climbed on the roof to go down the chimney. But the third pig put a big pot of hot water on the fire.", ru: "Волк разозлился. Он залез на крышу, чтобы спуститься через трубу. Но третий поросёнок поставил на огонь большой котёл с горячей водой." },
          { en: "The wolf fell into the pot, jumped out and ran away forever. The three little pigs lived happily in the house of bricks.", ru: "Волк упал в котёл, выскочил и убежал навсегда. Три поросёнка счастливо жили в доме из кирпичей." },
        ],
      },
    ],
  },
  {
    id: "goldilocks",
    title: "Goldilocks and the Three Bears",
    titleRu: "Златовласка и три медведя",
    source: "английская народная сказка",
    level: "A1",
    pages: [
      {
        paragraphs: [
          { en: "In a house in the forest lived three bears: a big Father Bear, a middle-sized Mother Bear and a little Baby Bear.", ru: "В домике в лесу жили три медведя: большой Папа-медведь, средняя Мама-медведица и маленький Медвежонок." },
          { en: "One morning Mother Bear made porridge. It was too hot, so the bears went for a walk.", ru: "Однажды утром Мама-медведица сварила кашу. Она была слишком горячая, и медведи пошли погулять." },
        ],
      },
      {
        paragraphs: [
          { en: "A little girl called Goldilocks was walking in the forest. She saw the house and went in.", ru: "Девочка по имени Златовласка гуляла по лесу. Она увидела домик и вошла." },
          { en: "On the table she saw three bowls of porridge. \"I am hungry,\" she said.", ru: "На столе она увидела три миски каши. «Я голодная», — сказала она." },
        ],
      },
      {
        paragraphs: [
          { en: "She tried the big bowl. \"Too hot!\" She tried the middle bowl. \"Too cold!\" She tried the little bowl. \"Just right!\" And she ate it all.", ru: "Она попробовала из большой миски. «Слишком горячо!» Попробовала из средней. «Слишком холодно!» Попробовала из маленькой. «В самый раз!» И съела всё." },
          { en: "Then she saw three chairs. The big chair was too hard, the middle chair was too soft, and the little chair was just right. But it broke!", ru: "Потом она увидела три стула. Большой стул был слишком жёсткий, средний — слишком мягкий, а маленький — в самый раз. Но он сломался!" },
        ],
      },
      {
        paragraphs: [
          { en: "Goldilocks was tired. She went upstairs and saw three beds. The big bed was too hard and the middle bed was too soft.", ru: "Златовласка устала. Она поднялась наверх и увидела три кровати. Большая была слишком жёсткая, а средняя — слишком мягкая." },
          { en: "The little bed was just right. Goldilocks lay down and fell asleep.", ru: "Маленькая кровать была в самый раз. Златовласка легла и уснула." },
        ],
      },
      {
        paragraphs: [
          { en: "The three bears came home. \"Someone has eaten my porridge!\" said Father Bear. \"Someone has eaten my porridge!\" said Mother Bear.", ru: "Три медведя вернулись домой. «Кто-то ел мою кашу!» — сказал Папа-медведь. «Кто-то ел мою кашу!» — сказала Мама-медведица." },
          { en: "\"Someone has eaten my porridge, and it is all gone!\" cried Baby Bear. \"And someone has broken my chair!\"", ru: "«Кто-то ел мою кашу и всё съел!» — заплакал Медвежонок. «И кто-то сломал мой стул!»" },
        ],
      },
      {
        paragraphs: [
          { en: "They went upstairs. \"Someone is sleeping in my bed!\" cried Baby Bear. Goldilocks woke up and saw the three bears.", ru: "Они поднялись наверх. «Кто-то спит в моей кровати!» — закричал Медвежонок. Златовласка проснулась и увидела трёх медведей." },
          { en: "She jumped out of the window and ran home as fast as she could. She never went into the forest again.", ru: "Она выпрыгнула в окно и побежала домой со всех ног. Больше она никогда не ходила в лес." },
        ],
      },
    ],
  },
  {
    id: "redhood",
    title: "Little Red Riding Hood",
    titleRu: "Красная Шапочка",
    source: "европейская народная сказка",
    level: "A1",
    pages: [
      {
        paragraphs: [
          { en: "Once there was a girl who always wore a red hood. Everybody called her Little Red Riding Hood.", ru: "Жила-была девочка, которая всегда носила красный капюшон. Все звали её Красная Шапочка." },
          { en: "One day her mother said: \"Grandmother is ill. Take her this cake and some butter. Go straight there and do not talk to strangers.\"", ru: "Однажды мама сказала: «Бабушка заболела. Отнеси ей этот пирог и масло. Иди прямо к ней и не разговаривай с незнакомцами»." },
        ],
      },
      {
        paragraphs: [
          { en: "Little Red Riding Hood walked through the forest. Soon she met a wolf. \"Where are you going, little girl?\" he asked.", ru: "Красная Шапочка шла через лес. Скоро она встретила волка. «Куда ты идёшь, девочка?» — спросил он." },
          { en: "\"To my grandmother's house, near the big oak tree,\" she said. The wolf smiled and ran away.", ru: "«К бабушке, её дом у большого дуба», — сказала она. Волк улыбнулся и убежал." },
        ],
      },
      {
        paragraphs: [
          { en: "The wolf ran to the grandmother's house and knocked on the door. He went in, and the grandmother hid in the cupboard.", ru: "Волк прибежал к дому бабушки и постучал в дверь. Он вошёл, а бабушка спряталась в шкафу." },
          { en: "Then the wolf put on her nightcap and got into her bed.", ru: "Потом волк надел её ночной чепчик и лёг в её кровать." },
        ],
      },
      {
        paragraphs: [
          { en: "Little Red Riding Hood came in. \"Grandmother, what big ears you have!\" \"The better to hear you with, my dear.\"", ru: "Красная Шапочка вошла. «Бабушка, какие у тебя большие уши!» «Это чтобы лучше слышать тебя, дорогая»." },
          { en: "\"Grandmother, what big eyes you have!\" \"The better to see you with, my dear.\"", ru: "«Бабушка, какие у тебя большие глаза!» «Это чтобы лучше видеть тебя, дорогая»." },
        ],
      },
      {
        paragraphs: [
          { en: "\"Grandmother, what big teeth you have!\" \"The better to eat you with!\" cried the wolf and jumped out of the bed.", ru: "«Бабушка, какие у тебя большие зубы!» «Это чтобы съесть тебя!» — закричал волк и выскочил из кровати." },
          { en: "Little Red Riding Hood screamed and ran. A hunter was walking near the house and heard her.", ru: "Красная Шапочка закричала и побежала. Рядом с домом проходил охотник и услышал её." },
        ],
      },
      {
        paragraphs: [
          { en: "The hunter ran in and chased the wolf far into the forest. Grandmother came out of the cupboard, safe and sound.", ru: "Охотник вбежал в дом и прогнал волка далеко в лес. Бабушка вышла из шкафа, целая и невредимая." },
          { en: "They all had tea and cake together, and Little Red Riding Hood never talked to strangers again.", ru: "Они все вместе пили чай с пирогом, и Красная Шапочка больше никогда не разговаривала с незнакомцами." },
        ],
      },
    ],
  },
  {
    id: "tortoise",
    title: "The Tortoise and the Hare",
    titleRu: "Черепаха и заяц",
    source: "басня Эзопа",
    level: "A1",
    pages: [
      {
        paragraphs: [
          { en: "A hare was very proud of his speed. \"I am the fastest animal in the forest,\" he said every day.", ru: "Заяц очень гордился своей скоростью. «Я самое быстрое животное в лесу», — говорил он каждый день." },
          { en: "A tortoise was tired of his words. \"Let's have a race,\" she said. All the animals laughed.", ru: "Черепахе надоели его слова. «Давай устроим гонку», — сказала она. Все звери засмеялись." },
        ],
      },
      {
        paragraphs: [
          { en: "The race began. The hare ran very fast, and soon he could not see the tortoise.", ru: "Гонка началась. Заяц побежал очень быстро, и скоро черепахи не было видно." },
          { en: "\"She is so slow,\" he thought. \"I have time for a little nap.\" He lay down under a tree and fell asleep.", ru: "«Она такая медленная, — подумал он. — У меня есть время немного вздремнуть». Он лёг под деревом и уснул." },
        ],
      },
      {
        paragraphs: [
          { en: "The tortoise did not stop. Step by step, slowly but surely, she walked along the road.", ru: "Черепаха не останавливалась. Шаг за шагом, медленно, но верно, она шла по дороге." },
          { en: "She passed the sleeping hare and went on.", ru: "Она прошла мимо спящего зайца и пошла дальше." },
        ],
      },
      {
        paragraphs: [
          { en: "When the hare woke up, the sun was low. He ran as fast as he could.", ru: "Когда заяц проснулся, солнце было уже низко. Он побежал изо всех сил." },
          { en: "But it was too late. The tortoise was already at the finish line, and all the animals were cheering.", ru: "Но было слишком поздно. Черепаха уже была на финише, и все звери её приветствовали." },
        ],
      },
      {
        paragraphs: [
          { en: "\"Slow and steady wins the race,\" said the tortoise. The hare never laughed at her again.", ru: "«Медленно и упорно — вот как выигрывают гонку», — сказала черепаха. Заяц больше никогда над ней не смеялся." },
        ],
      },
    ],
  },
  {
    id: "lion",
    title: "The Lion and the Mouse",
    titleRu: "Лев и мышь",
    source: "басня Эзопа",
    level: "A1",
    pages: [
      {
        paragraphs: [
          { en: "A lion was sleeping in the sun. A little mouse ran over his nose and woke him up.", ru: "Лев спал на солнце. Маленькая мышка пробежала по его носу и разбудила его." },
          { en: "The lion caught the mouse with his big paw. \"I will eat you,\" he said.", ru: "Лев поймал мышку большой лапой. «Я тебя съем», — сказал он." },
        ],
      },
      {
        paragraphs: [
          { en: "\"Please, let me go!\" cried the mouse. \"One day I will help you.\"", ru: "«Пожалуйста, отпусти меня! — закричала мышка. — Однажды я тебе помогу»." },
          { en: "The lion laughed. \"How can a mouse help a lion?\" But he let her go.", ru: "Лев засмеялся. «Как мышь может помочь льву?» Но он её отпустил." },
        ],
      },
      {
        paragraphs: [
          { en: "A few days later, hunters came to the forest. They caught the lion in a net.", ru: "Через несколько дней в лес пришли охотники. Они поймали льва в сеть." },
          { en: "The lion roared and roared, but he could not get out.", ru: "Лев рычал и рычал, но не мог выбраться." },
        ],
      },
      {
        paragraphs: [
          { en: "The little mouse heard him. She ran to the net and began to bite the ropes.", ru: "Маленькая мышка услышала его. Она подбежала к сети и начала грызть верёвки." },
          { en: "She worked all night. In the morning, the last rope broke, and the lion was free.", ru: "Она трудилась всю ночь. Утром последняя верёвка порвалась, и лев был свободен." },
        ],
      },
      {
        paragraphs: [
          { en: "\"You were right, little friend,\" said the lion. \"Even a small friend can be a great help.\"", ru: "«Ты была права, маленький друг, — сказал лев. — Даже маленький друг может очень помочь»." },
        ],
      },
    ],
  },
  {
    id: "wolf",
    title: "The Boy Who Cried Wolf",
    titleRu: "Мальчик, который кричал «Волк!»",
    source: "басня Эзопа",
    level: "A1",
    pages: [
      {
        paragraphs: [
          { en: "A boy looked after the sheep on a hill near the village. The work was boring, and the boy wanted some fun.", ru: "Мальчик пас овец на холме рядом с деревней. Работа была скучная, и мальчику хотелось развлечься." },
          { en: "One day he ran down to the village and shouted: \"Wolf! Wolf! A wolf is eating the sheep!\"", ru: "Однажды он сбежал в деревню и закричал: «Волк! Волк! Волк ест овец!»" },
        ],
      },
      {
        paragraphs: [
          { en: "The villagers ran up the hill with sticks. But there was no wolf. The boy laughed and laughed.", ru: "Жители деревни побежали на холм с палками. Но волка не было. Мальчик смеялся и смеялся." },
          { en: "The next day he did it again, and again the villagers came running. \"Very funny,\" they said angrily.", ru: "На следующий день он сделал это снова, и жители снова прибежали. «Очень смешно», — сердито сказали они." },
        ],
      },
      {
        paragraphs: [
          { en: "Then one evening a real wolf came. The boy shouted: \"Wolf! Wolf! Please help!\"", ru: "А однажды вечером пришёл настоящий волк. Мальчик закричал: «Волк! Волк! Помогите!»" },
          { en: "But the villagers only laughed. \"He is lying again,\" they said, and nobody came.", ru: "Но жители только смеялись. «Он опять врёт», — говорили они, и никто не пришёл." },
        ],
      },
      {
        paragraphs: [
          { en: "The wolf ate many sheep and ran away. The boy went home crying.", ru: "Волк съел много овец и убежал. Мальчик пошёл домой в слезах." },
          { en: "\"Nobody believes a liar,\" said his father, \"even when he tells the truth.\"", ru: "«Лжецу никто не верит, — сказал отец, — даже когда он говорит правду»." },
        ],
      },
    ],
  },
  {
    id: "duckling",
    title: "The Ugly Duckling",
    titleRu: "Гадкий утёнок",
    source: "сказка Ганса Христиана Андерсена",
    level: "A2",
    pages: [
      {
        paragraphs: [
          { en: "On a farm, a mother duck sat on her eggs. One by one, the eggs opened, and little yellow ducklings came out.", ru: "На ферме мама-утка сидела на яйцах. Одно за другим яйца раскрывались, и из них выходили маленькие жёлтые утята." },
          { en: "The last egg was big. When it opened, a big grey duckling came out. He was not like the others.", ru: "Последнее яйцо было большое. Когда оно раскрылось, из него вышел большой серый утёнок. Он был не такой, как остальные." },
        ],
      },
      {
        paragraphs: [
          { en: "\"He is so ugly!\" said the other ducks. The chickens laughed at him. Even his brothers and sisters did not play with him.", ru: "«Какой он гадкий!» — говорили другие утки. Куры смеялись над ним. Даже братья и сёстры не играли с ним." },
          { en: "The ugly duckling was very sad, and one day he ran away.", ru: "Гадкому утёнку было очень грустно, и однажды он убежал." },
        ],
      },
      {
        paragraphs: [
          { en: "Winter came. It was cold, and the lake was frozen. The duckling was alone and hungry.", ru: "Пришла зима. Было холодно, озеро замёрзло. Утёнок был один и голоден." },
          { en: "A kind farmer found him in the snow and took him home. In spring, the duckling went back to the lake.", ru: "Добрый фермер нашёл его в снегу и забрал домой. Весной утёнок вернулся на озеро." },
        ],
      },
      {
        paragraphs: [
          { en: "On the lake he saw beautiful white birds with long necks. They were swans.", ru: "На озере он увидел прекрасных белых птиц с длинными шеями. Это были лебеди." },
          { en: "\"They are so beautiful,\" thought the duckling. \"They will laugh at me too.\"", ru: "«Они такие красивые, — подумал утёнок. — Они тоже будут надо мной смеяться»." },
        ],
      },
      {
        paragraphs: [
          { en: "But the swans came to him and said: \"Welcome, brother!\" The duckling looked at the water.", ru: "Но лебеди подплыли к нему и сказали: «Добро пожаловать, брат!» Утёнок посмотрел на воду." },
          { en: "He saw a beautiful white swan. It was him! He was never an ugly duckling. He was a young swan.", ru: "Он увидел прекрасного белого лебедя. Это был он сам! Он никогда не был гадким утёнком. Он был молодым лебедем." },
        ],
      },
    ],
  },
  {
    id: "jack",
    title: "Jack and the Beanstalk",
    titleRu: "Джек и бобовый стебель",
    source: "английская народная сказка",
    level: "A2",
    pages: [
      {
        paragraphs: [
          { en: "Jack lived with his mother. They were very poor. One day his mother said: \"Take our cow to the market and sell her.\"", ru: "Джек жил с мамой. Они были очень бедны. Однажды мама сказала: «Отведи нашу корову на рынок и продай её»." },
          { en: "On the road Jack met an old man. \"I will give you five magic beans for your cow,\" he said. Jack agreed.", ru: "По дороге Джек встретил старика. «Я дам тебе пять волшебных бобов за корову», — сказал он. Джек согласился." },
        ],
      },
      {
        paragraphs: [
          { en: "His mother was angry. \"Beans! We need money, not beans!\" She threw the beans out of the window.", ru: "Мама рассердилась. «Бобы! Нам нужны деньги, а не бобы!» Она выбросила бобы в окно." },
          { en: "In the morning, a huge beanstalk was growing up to the sky.", ru: "Утром огромный бобовый стебель рос до самого неба." },
        ],
      },
      {
        paragraphs: [
          { en: "Jack climbed up the beanstalk. At the top he saw a giant castle.", ru: "Джек залез по стеблю. Наверху он увидел огромный замок." },
          { en: "Inside lived a giant. \"Fee, fi, fo, fum!\" he roared. Jack hid in a big pot.", ru: "В замке жил великан. «Фи-фай-фо-фам!» — зарычал он. Джек спрятался в большой котёл." },
        ],
      },
      {
        paragraphs: [
          { en: "The giant counted his gold coins and fell asleep. Jack took a bag of gold and climbed down.", ru: "Великан пересчитал золотые монеты и уснул. Джек взял мешок золота и спустился вниз." },
          { en: "Now Jack and his mother had money. But soon it was gone, and Jack climbed up again.", ru: "Теперь у Джека и мамы были деньги. Но скоро они кончились, и Джек полез наверх снова." },
        ],
      },
      {
        paragraphs: [
          { en: "This time he took a hen that laid golden eggs. The third time he took a magic harp. But the harp cried: \"Master! Master!\"", ru: "На этот раз он взял курицу, которая несла золотые яйца. В третий раз он взял волшебную арфу. Но арфа закричала: «Хозяин! Хозяин!»" },
          { en: "The giant woke up and ran after Jack down the beanstalk.", ru: "Великан проснулся и побежал за Джеком вниз по стеблю." },
        ],
      },
      {
        paragraphs: [
          { en: "Jack jumped to the ground. \"Mother, the axe!\" He cut the beanstalk, and the giant fell down with a great crash.", ru: "Джек спрыгнул на землю. «Мама, топор!» Он срубил стебель, и великан с грохотом упал." },
          { en: "Jack and his mother were never poor again.", ru: "Джек и его мама больше никогда не были бедными." },
        ],
      },
    ],
  },
];
