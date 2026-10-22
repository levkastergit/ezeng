export interface Twister {
  id: string;
  en: string;
  cy?: string;
  ru: string;
  focus: string;
  tip: string;
}

/** Traditional English tongue twisters (public domain). */
export const twisters: Twister[] = [
  {
    id: "t01",
    en: "Peter Piper picked a peck of pickled peppers.", cy: "пи́тэр па́йпэр пикт э пэк ав пи́кэлд пэ́пэрз.",
    ru: "Питер Пайпер собрал меру маринованных перцев.",
    focus: "/p/",
    tip: "Английское «p» в начале слова произносится с придыханием: пх-итер.",
  },
  {
    id: "t02",
    en: "She sells seashells by the seashore.", cy: "ши сэлз си́шэлз бай зэ си́шор.",
    ru: "Она продаёт морские ракушки на берегу моря.",
    focus: "/s/ и /ʃ/",
    tip: "Следи за разницей: «с» в sells и «ш» в she, shells, shore.",
  },
  {
    id: "t03",
    en: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?", cy: "хау мач вуд вуд э ву́дчак чак иф э ву́дчак куд чак вуд?",
    ru: "Сколько дров бросил бы сурок, если бы сурок мог бросать дрова?",
    focus: "/w/",
    tip: "Губы трубочкой на каждом w: wood, would, woodchuck.",
  },
  {
    id: "t04",
    en: "Red lorry, yellow lorry.", cy: "рэд ло́ри, йэ́лоу ло́ри.",
    ru: "Красный грузовик, жёлтый грузовик.",
    focus: "/r/ и /l/",
    tip: "Чередуй английское «r» (язык ничего не касается) и «l» (кончик языка у зубов).",
  },
  {
    id: "t05",
    en: "I scream, you scream, we all scream for ice cream.", cy: "ай скрим, ю скрим, уи ол скрим фор айс крим.",
    ru: "Я кричу, ты кричишь, мы все кричим: «мороженое!»",
    focus: "/iː/",
    tip: "I scream и ice cream звучат почти одинаково — в этом вся шутка.",
  },
  {
    id: "t06",
    en: "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair.", cy: "фа́зи уа́зи уазэ бэр. фа́зи уа́зи хэд но́у хэр.",
    ru: "Пушистик Вуззи был медведем. У Пушистика Вуззи не было шерсти.",
    focus: "/z/ и /w/",
    tip: "Звонкое «з» в fuzzy, wuzzy, was; не оглушай его в «с».",
  },
  {
    id: "t07",
    en: "Betty Botter bought some butter, but she said the butter's bitter.", cy: "бэ́ти ба́тэр бот сам ба́тэр, бат ши сэд зэ ба́тэрз би́тэр.",
    ru: "Бетти Боттер купила масло, но сказала, что масло горчит.",
    focus: "/b/ и /t/",
    tip: "В американском «t» между гласными звучит почти как «д»: Betty — бэди, butter — бадэр.",
  },
  {
    id: "t08",
    en: "A proper copper coffee pot.", cy: "э пра́пэр ка́пэр ко́фи пат.",
    ru: "Настоящий медный кофейник.",
    focus: "/p/ и /k/",
    tip: "Короткие чёткие согласные, гласные не растягивай.",
  },
  {
    id: "t09",
    en: "Which witch is which?", cy: "уич уи́ч из уи́ч?",
    ru: "Которая ведьма которая?",
    focus: "/w/ и /tʃ/",
    tip: "Which и witch произносятся одинаково: уич.",
  },
  {
    id: "t10",
    en: "Six slippery snails slid slowly seaward.", cy: "сикс сли́пэрри снэйлз слид сло́ули си́вэрд.",
    ru: "Шесть скользких улиток медленно ползли к морю.",
    focus: "/s/ и /l/",
    tip: "Сочетание sl: сначала «с», потом сразу «л» без гласной между ними.",
  },
  {
    id: "t11",
    en: "Three free throws.", cy: "сри фри сро́уз.",
    ru: "Три штрафных броска.",
    focus: "/θ/ и /r/",
    tip: "three и throws начинаются с th (язык между зубами), free — с обычного «ф».",
  },
  {
    id: "t12",
    en: "I thought a thought, but the thought I thought wasn't the thought I thought I thought.", cy: "ай сот э сот, бат зэ сот ай сот уа́знт зэ сот ай сот ай сот.",
    ru: "Я подумал мысль, но мысль, которую я подумал, была не той мыслью, которую, как я думал, я подумал.",
    focus: "/θ/",
    tip: "Каждое thought — язык между зубами. Медленно, потом быстрее.",
  },
  {
    id: "t13",
    en: "Fresh fried fish, fish fresh fried.", cy: "фрэш фрайд фиш, фиш фрэш фрайд.",
    ru: "Свежая жареная рыба, рыба, свежепожаренная.",
    focus: "/f/ и /ʃ/",
    tip: "Верхние зубы касаются нижней губы на каждом «f».",
  },
  {
    id: "t14",
    en: "Red leather, yellow leather.", cy: "рэд лэ́зэр, йэ́лоу лэ́зэр.",
    ru: "Красная кожа, жёлтая кожа.",
    focus: "/l/ и /ð/",
    tip: "th в leather звонкое: лэзэр. Язык между зубами, с голосом.",
  },
  {
    id: "t15",
    en: "Eleven benevolent elephants.", cy: "илэ́вэн бэнэ́вэлэнт э́лифэнтс.",
    ru: "Одиннадцать доброжелательных слонов.",
    focus: "/l/ и /v/",
    tip: "Чередование «л» и «в»: следи, чтобы «в» было губно-зубным, а не «w».",
  },
  {
    id: "t16",
    en: "Unique New York, unique New York.", cy: "юни́к ну йорк, юни́к ну йорк.",
    ru: "Уникальный Нью-Йорк, уникальный Нью-Йорк.",
    focus: "/j/ и /n/",
    tip: "Unique начинается со звука «ю», New York — «ню йорк».",
  },
  {
    id: "t17",
    en: "The big black bug bit the big black bear.", cy: "зэ биг блэк баг бит зэ биг блэк бэр.",
    ru: "Большой чёрный жук укусил большого чёрного медведя.",
    focus: "/b/ и /æ/",
    tip: "Гласный в black, bag, bear разный: блэк — баг — бэр.",
  },
  {
    id: "t18",
    en: "Can you can a can as a canner can can a can?", cy: "кэн ю кэн э кэн эз э кэ́нэр кэн кэн э кэн?",
    ru: "Можешь ли ты законсервировать банку, как консервщик может законсервировать банку?",
    focus: "/k/ и /æ/",
    tip: "Can здесь три разных слова: мочь, консервировать и банка. Произносятся одинаково: кэн.",
  },
  {
    id: "t19",
    en: "I saw Susie sitting in a shoeshine shop.", cy: "ай со су́зи си́тинг ин э шу́шайн шап.",
    ru: "Я видел, как Сьюзи сидит в мастерской по чистке обуви.",
    focus: "/s/ и /ʃ/",
    tip: "saw, Susie, sitting — «с»; shoeshine, shop — «ш».",
  },
  {
    id: "t20",
    en: "A big black bear sat on a big black rug.", cy: "э биг блэк бэр сэт он э биг блэк раг.",
    ru: "Большой чёрный медведь сел на большой чёрный коврик.",
    focus: "/b/ и /r/",
    tip: "rug — «раг» с американским «r», без дрожания языка.",
  },
];
