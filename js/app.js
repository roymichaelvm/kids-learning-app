/**
 * Lumina Learning Hub — Core Application Logic, Multi-Profile Engine & State Coordinator
 */
(function (window) {
  'use strict';

  /* =====================================================================
     FOUNDATIONAL CURRICULUM DATA (6+ Little Explorer & Trilingual Starter)
     ===================================================================== */
  const multiLangData = {
    spelling: {
      label: "6+ Spelling Bee",
      cloudDomain: "6+ Spelling Bee",
      langCode: "en-US",
      kidItems: [
        { emoji: "🤝", primary: "F - R - I - E - N - D", meaning: "FRIEND • A pal to the END! Someone you play and share with.", speech: "Friend. F, R, I, E, N, D. Friend!" },
        { emoji: "🌈", primary: "R - A - I - N - B - O - W", meaning: "RAINBOW • RAIN + BOW = Colorful arch in the sky after rain!", speech: "Rainbow. R, A, I, N, B, O, W. Rainbow!" },
        { emoji: "💡", primary: "B - E - C - A - U - S - E", meaning: "BECAUSE • Big Elephants Can Always Understand Small Elephants!", speech: "Because. B, E, C, A, U, S, E. Because!" },
        { emoji: "🏫", primary: "S - C - H - O - O - L", meaning: "SCHOOL • Starts with SCH and has two O's in the middle!", speech: "School. S, C, H, O, O, L. School!" },
        { emoji: "🦋", primary: "B - U - T - T - E - R - F - L - Y", meaning: "BUTTERFLY • BUTTER + FLY = Colorful garden insect!", speech: "Butterfly. B, U, T, T, E, R, F, L, Y. Butterfly!" },
        { emoji: "✨", primary: "S - H - I - N - I - N - G", meaning: "SHINING • Drop the silent E in SHINE before adding -ING!", speech: "Shining. S, H, I, N, I, N, G. Shining!" },
        { emoji: "🎂", primary: "B - I - R - T - H - D - A - Y", meaning: "BIRTHDAY • BIRTH + DAY = The special day you were born!", speech: "Birthday. B, I, R, T, H, D, A, Y. Birthday!" },
        { emoji: "🐬", primary: "D - O - L - P - H - I - N", meaning: "DOLPHIN • Watch how 'PH' makes the /F/ sound!", speech: "Dolphin. D, O, L, P, H, I, N. Dolphin!" },
        { emoji: "📚", primary: "L - I - B - R - A - R - Y", meaning: "LIBRARY • Don't forget both R's in LIB-RA-RY!", speech: "Library. L, I, B, R, A, R, Y. Library!" },
        { emoji: "🤗", primary: "T - O - G - E - T - H - E - R", meaning: "TOGETHER • Break it into 3 tiny words: TO + GET + HER!", speech: "Together. T, O, G, E, T, H, E, R. Together!" },
        { emoji: "🦒", primary: "G - I - R - A - F - F - E", meaning: "GIRAFFE • Soft G at the start and double F at the end!", speech: "Giraffe. G, I, R, A, F, F, E. Giraffe!" },
        { emoji: "🚀", primary: "B - E - L - I - E - V - E", meaning: "BELIEVE • I before E except after C!", speech: "Believe. B, E, L, I, E, V, E. Believe!" },
        { emoji: "⛰️", primary: "M - O - U - N - T - A - I - N", meaning: "MOUNTAIN • MOUNT + AIN = Tall rocky peak touching the clouds!", speech: "Mountain. M, O, U, N, T, A, I, N. Mountain!" },
        { emoji: "📅", primary: "W - E - D - N - E - S - D - A - Y", meaning: "WEDNESDAY • Remember the silent D in WED - NES - DAY!", speech: "Wednesday. W, E, D, N, E, S, D, A, Y. Wednesday!" },
        { emoji: "🎈", primary: "B - A - L - L - O - O - N", meaning: "BALLOON • Double L and Double O in BALL + OON!", speech: "Balloon. B, A, L, L, O, O, N. Balloon!" },
        { emoji: "🥞", primary: "B - R - E - A - K - F - A - S - T", meaning: "BREAKFAST • Compound word: BREAK + FAST = Morning meal!", speech: "Breakfast. B, R, E, A, K, F, A, S, T. Breakfast!" },
        { emoji: "🦕", primary: "D - I - N - O - S - A - U - R", meaning: "DINOSAUR • DINO + SAUR = Prehistoric giant reptile!", speech: "Dinosaur. D, I, N, O, S, A, U, R. Dinosaur!" },
        { emoji: "🪐", primary: "E - X - C - I - T - I - N - G", meaning: "EXCITING • Drop silent E from EXCITE before adding -ING!", speech: "Exciting. E, X, C, I, T, I, N, G. Exciting!" },
        { emoji: "☂️", primary: "U - M - B - R - E - L - L - A", meaning: "UMBRELLA • Double L keeps you dry in the rain!", speech: "Umbrella. U, M, B, R, E, L, L, A. Umbrella!" },
        { emoji: "🏝️", primary: "I - S - L - A - N - D", meaning: "ISLAND • Has a silent S! Land surrounded by water (IS + LAND).", speech: "Island. I, S, L, A, N, D. Island!" },
        { emoji: "🐘", primary: "E - L - E - P - H - A - N - T", meaning: "ELEPHANT • Huge friendly animal with a long trunk and big ears!", speech: "Elephant. E, L, E, P, H, A, N, T. Elephant!" },
        { emoji: "☀️", primary: "S - U - N - S - H - I - N - E", meaning: "SUNSHINE • Compound word: SUN + SHINE = Bright warm daylight!", speech: "Sunshine. S, U, N, S, H, I, N, E. Sunshine!" },
        { emoji: "🍫", primary: "C - H - O - C - O - L - A - T - E", meaning: "CHOCOLATE • Sweet cocoa treat that melts in your mouth!", speech: "Chocolate. C, H, O, C, O, L, A, T, E. Chocolate!" },
        { emoji: "🐙", primary: "O - C - T - O - P - U - S", meaning: "OCTOPUS • Clever ocean animal with eight suction-cup arms!", speech: "Octopus. O, C, T, O, P, U, S. Octopus!" },
        { emoji: "🐧", primary: "P - E - N - G - U - I - N", meaning: "PENGUIN • Black and white bird that swims like a torpedo!", speech: "Penguin. P, E, N, G, U, I, N. Penguin!" },
        { emoji: "🦎", primary: "C - H - A - M - E - L - E - O - N", meaning: "CHAMELEON • Clever lizard that changes color for camouflage!", speech: "Chameleon. C, H, A, M, E, L, E, O, N. Chameleon!" },
        { emoji: "🦘", primary: "K - A - N - G - A - R - O - O", meaning: "KANGAROO • Australian animal that hops and carries a joey!", speech: "Kangaroo. K, A, N, G, A, R, O, O. Kangaroo!" },
        { emoji: "💎", primary: "D - I - A - M - O - N - D", meaning: "DIAMOND • Hardest natural crystal that sparkles like a star!", speech: "Diamond. D, I, A, M, O, N, D. Diamond!" },
        { emoji: "🏴‍☠️", primary: "T - R - E - A - S - U - R - E", meaning: "TREASURE • Valuable gold, gems, and coins in a chest!", speech: "Treasure. T, R, E, A, S, U, R, E. Treasure!" },
        { emoji: "🤫", primary: "W - H - I - S - P - E - R", meaning: "WHISPER • Speaking very softly so only a best friend can hear!", speech: "Whisper. W, H, I, S, P, E, R. Whisper!" },
        { emoji: "🪶", primary: "F - E - A - T - H - E - R", meaning: "FEATHER • Soft, lightweight covering on a bird's wing!", speech: "Feather. F, E, A, T, H, E, R. Feather!" },
        { emoji: "🗺️", primary: "J - O - U - R - N - E - Y", meaning: "JOURNEY • An exciting trip or adventure to a new land!", speech: "Journey. J, O, U, R, N, E, Y. Journey!" },
        { emoji: "🧭", primary: "E - X - P - L - O - R - E", meaning: "EXPLORE • Traveling to discover brand new wonders!", speech: "Explore. E, X, P, L, O, R, E. Explore!" },
        { emoji: "🦁", primary: "C - O - U - R - A - G - E", meaning: "COURAGE • Being brave and standing strong even when things seem scary!", speech: "Courage. C, O, U, R, A, G, E. Courage!" },
        { emoji: "🌟", primary: "H - O - N - E - S - T - Y", meaning: "HONESTY • Always telling the truth with kindness and care!", speech: "Honesty. H, O, N, E, S, T, Y. Honesty!" },
        { emoji: "⏳", primary: "P - A - T - I - E - N - C - E", meaning: "PATIENCE • Waiting calmly and peacefully without rushing!", speech: "Patience. P, A, T, I, E, N, C, E. Patience!" },
        { emoji: "🧠", primary: "K - N - O - W - L - E - D - G - E", meaning: "KNOWLEDGE • Information and wisdom learned through reading and curiosity!", speech: "Knowledge. K, N, O, W, L, E, D, G, E. Knowledge!" },
        { emoji: "🌸", primary: "B - L - O - S - S - O - M", meaning: "BLOSSOM • A colorful sweet flower blooming on a spring tree!", speech: "Blossom. B, L, O, S, S, O, M. Blossom!" },
        { emoji: "⭐", primary: "S - T - A - R - L - I - G - H - T", meaning: "STARLIGHT • The gentle twinkle from distant stars in space!", speech: "Starlight. S, T, A, R, L, I, G, H, T. Starlight!" },
        { emoji: "🤩", primary: "W - O - N - D - E - R - F - U - L", meaning: "WONDERFUL • Extremely good, full of wonder and joy!", speech: "Wonderful. W, O, N, D, E, R, F, U, L. Wonderful!" }
      ]
    },
    comprehension: {
      label: "6+ Story Comprehension",
      cloudDomain: "6+ Story Comprehension",
      langCode: "en-US",
      kidItems: [
        { emoji: "🦁", primary: "Leo & Zara's Tall View", meaning: "When wind blew Leo the Lion's yellow hat into tall grass, Zara the Giraffe looked down from above the trees to spot it!", speech: "Leo the Little Lion loved wearing his bright yellow sun hat. When the wind blew it into the tall grass, Zara the tall Giraffe looked down from above the trees and spotted it right away!" },
        { emoji: "🌱", primary: "Maya's Tomato Garden", meaning: "Seeds need two main things to sprout into plants: daily water and warm sunshine!", speech: "Every morning before school, Maya watered her tiny tomato seeds and made sure they got warm sunshine. Soon green sprouts popped up!" },
        { emoji: "🐝", primary: "Buzzy the Helpful Bee", meaning: "Bees carry yellow pollen on their fuzzy legs from flower to flower, helping apple trees grow fruit!", speech: "Buzzy the Honeybee flew from flower to flower. Yellow pollen stuck to her fuzzy legs and helped the apple trees grow delicious apples!" },
        { emoji: "🦉", primary: "Barnaby the Nocturnal Owl", meaning: "'Nocturnal' means an animal that sleeps during the bright day and wakes up at night!", speech: "Owls are nocturnal animals, which means they sleep during the bright day and stay awake at night to explore." },
        { emoji: "🍞", primary: "Grandma's Banana Bread", meaning: "Story Sequence Words: FIRST mash bananas, NEXT stir flour & eggs, FINALLY bake in the oven!", speech: "First, Grandma mashed three ripe bananas. Next, Aarav stirred in flour and eggs. Finally, they baked the bread in the warm oven!" },
        { emoji: "🐧", primary: "Pip's Super Flippers", meaning: "Main Lesson: Everyone has a special talent! Penguin wings are built to swim super fast underwater.", speech: "Pip the Penguin couldn't fly in the sky, but underwater his wings worked like super fast flippers!" },
        { emoji: "🐢", primary: "Tilly the Steady Turtle", meaning: "Slow and steady wins the race! Tilly kept walking without giving up while Dash the Rabbit napped.", speech: "Dash the Rabbit ran fast at first but stopped to nap. Tilly the Turtle kept walking slowly and steadily and won the race!" },
        { emoji: "🔭", primary: "Meera's Moon Telescope", meaning: "Through a telescope, the Moon isn't smooth—it has round craters and rocky mountains!", speech: "Through her telescope, Meera saw round craters and rocky mountains on the Moon." },
        { emoji: "🦋", primary: "Mia & the Chrysalis", meaning: "A caterpillar wraps itself inside a protective shell called a CHRYSALIS before emerging as a butterfly!", speech: "A caterpillar wraps itself inside a smooth green shell called a chrysalis before emerging as a butterfly." },
        { emoji: "🐻", primary: "Bruno's Winter Hibernation", meaning: "To HIBERNATE means to sleep deeply in a cozy den or cave all through the cold winter months!", speech: "Bruno the Brown Bear curled up inside a cozy cave to hibernate all winter long until spring." },
        { emoji: "🧭", primary: "Dev's Magnetic Compass", meaning: "The red needle inside a compass is a tiny magnet that always points NORTH to guide explorers!", speech: "The red needle on a compass is a tiny magnet that always points North." },
        { emoji: "🌊", primary: "The Vanishing Puddle", meaning: "Warm sunlight causes liquid water to EVAPORATE—turn into invisible water vapor in the air!", speech: "Warm sunlight heats the puddle so the liquid water evaporates into invisible water vapor." },
        { emoji: "🎨", primary: "Ananya's Color Mixing", meaning: "Yellow and Blue are primary colors that mix together to create bright GREEN!", speech: "When Ananya mixed yellow paint and blue paint together, bright green appeared!" },
        { emoji: "🐪", primary: "Clever Desert Camels", meaning: "A camel's hump stores fat for energy, and its long eyelashes keep blowing desert sand out of its eyes!", speech: "A camel's hump stores fat for energy, and its long eyelashes keep blowing sand out of its eyes." },
        { emoji: "🎻", primary: "Neil's Daily Violin Practice", meaning: "Practicing a little bit every single day turns squeaky notes into smooth music!", speech: "Because Neil practiced his violin for fifteen minutes every day, he learned to play smoothly!" },
        { emoji: "🐿️", primary: "Sammy's Autumn Acorns", meaning: "Squirrels gather and bury acorns in autumn so they have plenty of food saved when winter snow arrives!", speech: "Sammy the Squirrel buried acorns in autumn so he would have food saved for the snowy winter." }
      ]
    },
    grammar: {
      label: "6+ Grammar & Sentences",
      cloudDomain: "6+ Grammar & Sentences",
      langCode: "en-US",
      kidItems: [
        { emoji: "🏃", primary: "Action Verbs", meaning: "An ACTION VERB tells what someone DOES: jump, run, sing, read, swim!", speech: "Action Verbs! An action verb tells what someone does, like jump, run, sing, or read." },
        { emoji: "🏛️", primary: "Nouns (Person, Place, Thing)", meaning: "A NOUN names a person (teacher), a place (park), an animal (puppy), or a thing (book)!", speech: "Nouns! A noun names a person, place, animal, or thing." },
        { emoji: "🎨", primary: "Adjectives (Describing Words)", meaning: "An ADJECTIVE describes how something looks, feels, or tastes: fluffy, yellow, sweet, tall!", speech: "Adjectives! An adjective describes a noun, like fluffy clouds or sweet strawberries." },
        { emoji: "❓", primary: "End Punctuation (. ? !)", meaning: "Use a PERIOD (.) for a telling sentence, a QUESTION MARK (?) to ask, and an EXCLAMATION POINT (!) for big feelings!", speech: "Use a question mark when you ask a question, a period for a statement, and an exclamation point for excitement!" },
        { emoji: "🔠", primary: "Capital Letters (Proper Nouns)", meaning: "Always capitalize the FIRST word of a sentence, peoples' names (Maya), days (Sunday), and cities!", speech: "Always start a sentence, a person's name, or a day of the week with a capital letter!" },
        { emoji: "🐾", primary: "Irregular Plurals", meaning: "1 mouse → 2 MICE • 1 child → 3 CHILDREN • 1 tooth → 2 TEETH • 1 foot → 2 FEET!", speech: "One mouse, two mice! One child, three children! One tooth, two teeth!" },
        { emoji: "⏳", primary: "Past Tense Verbs", meaning: "Happened YESTERDAY: walk → walked, go → WENT, eat → ATE, run → RAN!", speech: "Past tense tells what already happened yesterday: Today I go, yesterday I went!" },
        { emoji: "🍎", primary: "Using 'A' vs. 'AN'", meaning: "Use 'AN' before vowel sounds (a, e, i, o, u): AN apple, AN elephant, AN orange, AN umbrella!", speech: "Use AN before vowel sounds: an apple, an elephant, an orange!" },
        { emoji: "🔗", primary: "Contractions (Apostrophe ')", meaning: "A contraction joins two words with an apostrophe: do + not = DON'T, can + not = CAN'T, I + am = I'M!", speech: "Contractions use an apostrophe where letters were left out: do not becomes don't, can not becomes can't!" },
        { emoji: "🧩", primary: "Compound Words", meaning: "Two whole words joined together: SUN + FLOWER = SUNFLOWER, TOOTH + BRUSH = TOOTHBRUSH!", speech: "Compound words join two smaller words together, like sunflower and toothbrush!" },
        { emoji: "🏆", primary: "Comparing with -ER and -EST", meaning: "Use -ER to compare 2 things (faster) and -EST to compare 3 or more things (fastest of all)!", speech: "Use E R when comparing two things, and E S T when comparing three or more!" },
        { emoji: "🎒", primary: "Possessive Nouns ('s)", meaning: "Add apostrophe + s ('s) to show ownership: Leo's bicycle, Maya's backpack, the dog's bone!", speech: "Add apostrophe S to show that something belongs to someone, like Leo's bicycle!" },
        { emoji: "🤝", primary: "Synonyms (Same Meaning)", meaning: "Synonyms are words with the same meaning: happy = glad, clever = smart, big = large!", speech: "Synonyms are words that mean the same thing, like clever and smart!" },
        { emoji: "🔄", primary: "Antonyms (Opposites)", meaning: "Antonyms are words with opposite meanings: enormous ↔ tiny, ancient ↔ modern, brave ↔ fearful!", speech: "Antonyms are opposite words, like enormous and tiny!" },
        { emoji: "🐢", primary: "Adverbs (-LY Words)", meaning: "An ADVERB tells HOW an action happens: walked SLOWLY, sang HAPPILY, read CAREFULLY!", speech: "Adverbs tell how an action is done and often end in L Y, like slowly and carefully!" },
        { emoji: "🔊", primary: "Homophones (Sound-Alikes)", meaning: "Sound the same but spelled differently: BLEW (wind) vs BLUE (color), SEA (ocean) vs SEE (eyes)!", speech: "Homophones sound the same but have different spellings and meanings, like sea and see!" }
      ]
    },
    malayalam: {
      label: "Malayalam (മലയാളം)",
      langCode: "ml-IN",
      letters: [
        { char: "അ", translit: "A", word: "അമ്മ (Amma)", wordMeaning: "Mother", emoji: "👩", speech: "അ. അമ്മ." },
        { char: "ആ", translit: "Aa", word: "ആന (Aana)", wordMeaning: "Elephant", emoji: "🐘", speech: "ആ. ആന." },
        { char: "ഇ", translit: "I", word: "ഇല (Ila)", wordMeaning: "Leaf", emoji: "🍃", speech: "ഇ. ഇല." },
        { char: "ഈ", translit: "Ee", word: "ഈച്ച (Eecha)", wordMeaning: "Fly", emoji: "🪰", speech: "ഈ. ഈച്ച." },
        { char: "ഉ", translit: "U", word: "ഉരൽ (Ural)", wordMeaning: "Mortar", emoji: "🥣", speech: "ഉ. ഉരൽ." },
        { char: "ഊ", translit: "Oo", word: "ഊഞ്ഞാൽ (Oonjal)", wordMeaning: "Swing", emoji: "🪅", speech: "ഊ. ഊഞ്ഞാൽ." },
        { char: "ഋ", translit: "Ri", word: "ഋഷി (Rishi)", wordMeaning: "Sage", emoji: "🧘", speech: "ഋ. ഋഷി." },
        { char: "എ", translit: "E", word: "എലി (Eli)", wordMeaning: "Mouse / Rat", emoji: "🐭", speech: "എ. എലി." },
        { char: "ഏ", translit: "Ae", word: "ഏണി (Eani)", wordMeaning: "Ladder", emoji: "🪜", speech: "ഏ. ഏണി." },
        { char: "ഐ", translit: "Ai", word: "ഐസ് (Ice)", wordMeaning: "Ice", emoji: "🧊", speech: "ഐ. ഐസ്." },
        { char: "ഒ", translit: "O", word: "ഒട്ടകം (Ottakam)", wordMeaning: "Camel", emoji: "🐫", speech: "ഒ. ഒട്ടകം." },
        { char: "ഓ", translit: "Oo", word: "ഓടക്കുഴൽ (Odakkuzhal)", wordMeaning: "Flute", emoji: "🪈", speech: "ഓ. ഓടക്കുഴൽ." },
        { char: "ഔ", translit: "Au", word: "ഔഷധം (Aushadham)", wordMeaning: "Medicine", emoji: "💊", speech: "ഔ. ഔഷധം." },
        { char: "അം", translit: "Am", word: "അമ്പലം (Ambalam)", wordMeaning: "Temple", emoji: "🛕", speech: "അം. അമ്പലം." },
        { char: "ക", translit: "Ka", word: "കണ്ണ് (Kannu)", wordMeaning: "Eye", emoji: "👁️", speech: "ക. കണ്ണ്." },
        { char: "ഖ", translit: "Kha", word: "ഖഡ്ഗം (Khadgam)", wordMeaning: "Sword", emoji: "⚔️", speech: "ഖ. ഖഡ്ഗം." },
        { char: "ഗ", translit: "Ga", word: "ഗജം (Gajam)", wordMeaning: "Elephant", emoji: "🐘", speech: "ഗ. ഗജം." },
        { char: "ഘ", translit: "Gha", word: "ഘടികാരം (Ghatikaram)", wordMeaning: "Clock", emoji: "⏰", speech: "ഘ. ഘടികാരം." },
        { char: "ങ", translit: "Nga", word: "മാങ്ങ (Maanga)", wordMeaning: "Mango", emoji: "🥭", speech: "ങ. മാങ്ങ." },
        { char: "ച", translit: "Cha", word: "ചക്രം (Chakram)", wordMeaning: "Wheel", emoji: "☸️", speech: "ച. ചക്രം." },
        { char: "ഛ", translit: "Chha", word: "ഛത്രം (Chhathram)", wordMeaning: "Umbrella", emoji: "☂️", speech: "ഛ. ഛത്രം." },
        { char: "ജ", translit: "Ja", word: "ജലം (Jalam)", wordMeaning: "Water", emoji: "💧", speech: "ജ. ജലം." },
        { char: "ഝ", translit: "Jha", word: "ഝഷം (Jhasham)", wordMeaning: "Fish", emoji: "🐟", speech: "ഝ. ഝഷം." },
        { char: "ഞ", translit: "Nya", word: "ഞണ്ട് (Njandu)", wordMeaning: "Crab", emoji: "🦀", speech: "ഞ. ഞണ്ട്." },
        { char: "ട", translit: "Ta", word: "തക്കാളി (Thakkaali)", wordMeaning: "Tomato", emoji: "🍅", speech: "ട. തക്കാളി." },
        { char: "ഠ", translit: "Tha", word: "പാഠം (Paatham)", wordMeaning: "Lesson", emoji: "📖", speech: "ഠ. പാഠം." },
        { char: "ഡ", translit: "Da", word: "ഡപ്പി (Dappi)", wordMeaning: "Small Tin / Box", emoji: "📦", speech: "ഡ. ഡപ്പി." },
        { char: "ഢ", translit: "Dha", word: "ഢക്ക (Dhakka)", wordMeaning: "Drum", emoji: "🥁", speech: "ഢ. ഢക്ക." },
        { char: "ണ", translit: "Na", word: "വീണ (Veena)", wordMeaning: "Veena (Lute)", emoji: "🪕", speech: "ണ. വീണ." },
        { char: "ത", translit: "Tha", word: "താറാവ് (Thaaravu)", wordMeaning: "Duck", emoji: "🦆", speech: "ത. താറാവ്." },
        { char: "ഥ", translit: "Thha", word: "രഥം (Ratham)", wordMeaning: "Chariot", emoji: "🏎️", speech: "ഥ. രഥം." },
        { char: "ദ", translit: "Da", word: "ദന്തം (Dantham)", wordMeaning: "Tooth", emoji: "🦷", speech: "ദ. ദന്തം." },
        { char: "ധ", translit: "Dha", word: "ധനം (Dhanam)", wordMeaning: "Wealth / Coins", emoji: "🪙", speech: "ധ. ധനം." },
        { char: "ന", translit: "Na", word: "നക്ഷത്രം (Nakshatram)", wordMeaning: "Star", emoji: "⭐", speech: "ന. നക്ഷത്രം." },
        { char: "പ", translit: "Pa", word: "പശു (Pashu)", wordMeaning: "Cow", emoji: "🐄", speech: "പ. പശു." },
        { char: "ഫ", translit: "Pha", word: "ഫലം (Phalam)", wordMeaning: "Fruit", emoji: "🍎", speech: "ഫ. ഫലം." },
        { char: "ബ", translit: "Ba", word: "പന്ത് (Panthu) / ബസ് (Bus)", wordMeaning: "Ball / Bus", emoji: "⚽", speech: "ബ. പന്ത്." },
        { char: "ഭ", translit: "Bha", word: "ഭവനം (Bhavanam)", wordMeaning: "Home", emoji: "🏡", speech: "ഭ. ഭവനം." },
        { char: "മ", translit: "Ma", word: "മരം (Maram)", wordMeaning: "Tree", emoji: "🌳", speech: "മ. മരം." },
        { char: "യ", translit: "Ya", word: "യാത്ര (Yaathra)", wordMeaning: "Journey / Travel", emoji: "✈️", speech: "യ. യാത്ര." },
        { char: "ര", translit: "Ra", word: "രാജാവ് (Raajaavu)", wordMeaning: "King", emoji: "👑", speech: "ര. രാജാവ്." },
        { char: "ല", translit: "La", word: "ലഡു (Laddu)", wordMeaning: "Sweet Laddu", emoji: "🍬", speech: "ല. ലഡു." },
        { char: "വ", translit: "Va", word: "വണ്ടി (Vandi)", wordMeaning: "Vehicle / Cart", emoji: "🚗", speech: "വ. വണ്ടി." },
        { char: "ശ", translit: "Sha", word: "ശംഖ് (Shankhu)", wordMeaning: "Conch", emoji: "🐚", speech: "ശ. ശംഖ്." },
        { char: "ഷ", translit: "Sha", word: "ഷഡ്പദം (Shadpadam)", wordMeaning: "Six-Legged Insect", emoji: "🐞", speech: "ഷ. ഷഡ്പദം." },
        { char: "സ", translit: "Sa", word: "സൂര്യൻ (Sooryan)", wordMeaning: "Sun", emoji: "☀️", speech: "സ. സൂര്യൻ." },
        { char: "ഹ", translit: "Ha", word: "ഹംസം (Hamsam)", wordMeaning: "Swan", emoji: "🦢", speech: "ഹ. ഹംസം." },
        { char: "ള", translit: "La", word: "വിളക്ക് (Vilakku)", wordMeaning: "Lamp", emoji: "🪔", speech: "ള. വിളക്ക്." },
        { char: "ഴ", translit: "Zha", word: "മഴ (Mazha)", wordMeaning: "Rain", emoji: "🌧️", speech: "ഴ. മഴ." },
        { char: "റ", translit: "Ra", word: "റോസാപ്പൂവ് (Rosappoovu)", wordMeaning: "Rose Flower", emoji: "🌹", speech: "റ. റോസാപ്പൂവ്." }
      ],
      sentences: [
        { script: "അമ്മ എന്നെ സ്നേഹിക്കുന്നു.", translit: "Amma enne snehikkunnu.", meaning: "Mother loves me dearly.", speech: "അമ്മ എന്നെ സ്നേഹിക്കുന്നു" },
        { script: "ഞാൻ സ്കൂളിൽ പോകുന്നു.", translit: "Njan schoolil pokunnu.", meaning: "I go to school happily.", speech: "ഞാൻ സ്കൂളിൽ പോകുന്നു" },
        { script: "പൂച്ച പാൽ കുടിക്കുന്നു.", translit: "Poocha paal kudikkunnu.", meaning: "The cat drinks milk.", speech: "പൂച്ച പാൽ കുടിക്കുന്നു" },
        { script: "സൂര്യൻ കിഴക്ക് ഉദിക്കുന്നു.", translit: "Sooryan kizhakku udikkunnu.", meaning: "The sun rises in the east.", speech: "സൂര്യൻ കിഴക്ക് ഉദിക്കുന്നു" },
        { script: "ആകാശത്ത് മനോഹരമായ മഴവില്ല് ഉണ്ട്.", translit: "Aakashathu manoharamaya mazhavillu undu.", meaning: "There is a beautiful rainbow in the sky.", speech: "ആകാശത്ത് മനോഹരമായ മഴവില്ല് ഉണ്ട്" },
        { script: "പക്ഷികൾ മരത്തിൽ പാടുന്നു.", translit: "Pakshikal marathil paadunnu.", meaning: "Birds are singing in the tree.", speech: "പക്ഷികൾ മരത്തിൽ പാടുന്നു" },
        { script: "എനിക്ക് മധുരമുള്ള മാമ്പഴം ഇഷ്ടമാണ്.", translit: "Enikku madhuramulla mampazham ishtamanu.", meaning: "I love sweet mangoes.", speech: "എനിക്ക് മധുരമുള്ള മാമ്പഴം ഇഷ്ടമാണ്" },
        { script: "നാം എപ്പോഴും സത്യം പറയണം.", translit: "Naam eppozhum sathyam parayanam.", meaning: "We must always speak the truth.", speech: "നാം എപ്പോഴും സത്യം പറയണം" },
        { script: "പുസ്തകം വായിക്കുന്നത് നല്ല ശീലമാണ്.", translit: "Pusthakam vaayikkunnathu nalla sheelamanu.", meaning: "Reading books is a wonderful habit.", speech: "പുസ്തകം വായിക്കുന്നത് നല്ല ശീലമാണ്" },
        { script: "വരൂ, നമുക്ക് ഒരുമിച്ച് കളിക്കാം!", translit: "Varoo, namukku orumichu kalikkam!", meaning: "Come, let us play together!", speech: "വരൂ, നമുക്ക് ഒരുമിച്ച് കളിക്കാം" },
        { script: "ആന വളരെ വലിയ മൃഗമാണ്.", translit: "Aana valare valiya mrugamanu.", meaning: "The elephant is a very big animal.", speech: "ആന വളരെ വലിയ മൃഗമാണ്" },
        { script: "രാത്രിയിൽ നക്ഷത്രങ്ങൾ തിളങ്ങുന്നു.", translit: "Rathriyil nakshatrangal thilangunu.", meaning: "Stars shine bright in the night sky.", speech: "രാത്രിയിൽ നക്ഷത്രങ്ങൾ തിളങ്ങുന്നു" }
      ],
      teenCards: [
        { script: "നമസ്കാരം", translit: "Namaskaram", meaning: "Hello / Respectful Greeting", example: "മുതിർന്നവരെ കാണുമ്പോൾ നമസ്കാരം പറയണം (Greet elders with Namaskaram)." },
        { script: "നന്ദി", translit: "Nandi", meaning: "Thank you", example: "നിങ്ങളുടെ സഹായത്തിന് വളരെ നന്ദി (Thank you very much for your help)." },
        { script: "വിദ്യാലയം", translit: "Vidyalayam", meaning: "School", example: "ഞാൻ രാവിലെ വിദ്യാലയത്തിലേക്ക് പോകുന്നു (I go to school in the morning)." },
        { script: "പുസ്തകം", translit: "Pusthakam", meaning: "Book", example: "ഇത് എന്റെ പ്രിയപ്പെട്ട പുസ്തകമാണ് (This is my favorite book)." },
        { script: "വെള്ളം", translit: "Vellam", meaning: "Water", example: "ദയവായി കുറച്ചു വെള്ളം തരൂ (Please give me some water)." },
        { script: "സ്നേഹം", translit: "Sneham", meaning: "Love / Kindness", example: "സ്നേഹം ലോകത്തെ മനോഹരമാക്കുന്നു (Love makes the world beautiful)." },
        { script: "കുടുംബം", translit: "Kudumbam", meaning: "Family", example: "എന്റെ കുടുംബം വളരെ വലുതാണ് (My family is very big)." },
        { script: "സൂര്യൻ", translit: "Sooryan", meaning: "Sun", example: "സൂര്യൻ കിഴക്ക് ഉദിക്കുന്നു (The sun rises in the east)." },
        { script: "അറിവ്", translit: "Arivu", meaning: "Knowledge / Wisdom", example: "വായനയിലൂടെ അറിവ് വർദ്ധിക്കുന്നു (Knowledge grows through reading)." },
        { script: "പ്രകൃതി", translit: "Prakruthi", meaning: "Nature", example: "പ്രകൃതിയെ സംരക്ഷിക്കേണ്ടത് നമ്മുടെ കടമയാണ് (Protecting nature is our duty)." },
        { script: "സുഹൃത്ത്", translit: "Suhruthu", meaning: "Friend", example: "അവൻ എന്റെ ഏറ്റവും നല്ല സുഹൃത്താണ് (He is my best friend)." },
        { script: "സന്തോഷം", translit: "Santhosham", meaning: "Happiness / Joy", example: "നിങ്ങളെ കണ്ടതിൽ വളരെ സന്തോഷം (Very happy to meet you)." },
        { script: "അധ്യാപകൻ", translit: "Adhyapakan", meaning: "Teacher", example: "അധ്യാപകൻ പാഠം ലളിതമായി വിശദീകരിച്ചു (The teacher explained the lesson simply)." },
        { script: "കഠിനാധ്വാനം", translit: "Kathinadhwanam", meaning: "Hard Work", example: "കഠിനാധ്വാനം വിജയത്തിലേക്ക് നയിക്കുന്നു (Hard work leads to success)." },
        { script: "സത്യം", translit: "Sathyam", meaning: "Truth", example: "എപ്പോഴും സത്യം സംസാരിക്കുക (Always speak the truth)." },
        { script: "സമാധാനം", translit: "Samadhanam", meaning: "Peace", example: "ലോകത്തിൽ സമാധാനം നിലനിൽക്കട്ടെ (May peace prevail in the world)." },
        { script: "ആരോഗ്യം", translit: "Arogyam", meaning: "Health", example: "ആരോഗ്യം ഏറ്റവും വലിയ സമ്പത്താണ് (Health is the greatest wealth)." },
        { script: "ഭാവി", translit: "Bhavi", meaning: "Future", example: "നല്ല ഭാവിക്കായി നമുക്ക് ഇന്നേ പഠിക്കാം (Let us study today for a bright future)." },
        { script: "ശാസ്ത്രം", translit: "Shasthram", meaning: "Science", example: "ശാസ്ത്രം മനുഷ്യജീവിതം എളുപ്പമാക്കുന്നു (Science makes human life easier)." },
        { script: "ബഹുമാനം", translit: "Bahumanam", meaning: "Respect", example: "മാതാപിതാക്കളോട് ബഹുമാനം കാണിക്കുക (Show respect to parents)." }
      ],
      teenQuiz: [
        { q: "How do you say 'School' in Malayalam?", choices: ["പുസ്തകം (Pusthakam)", "വിദ്യാലയം (Vidyalayam)", "കുടുംബം (Kudumbam)", "വെള്ളം (Vellam)"], answer: 1 },
        { q: "What does 'നന്ദി (Nandi)' mean in English?", choices: ["Good morning", "Thank you", "See you later", "Friend"], answer: 1 },
        { q: "Which Malayalam word means 'Family'?", choices: ["കുടുംബം (Kudumbam)", "സൂര്യൻ (Sooryan)", "സ്നേഹം (Sneham)", "മരം (Maram)"], answer: 0 },
        { q: "What is the English meaning of 'അറിവ് (Arivu)'?", choices: ["Water", "Knowledge / Wisdom", "Happiness", "Nature"], answer: 1 },
        { q: "How do you say 'Friend' in Malayalam?", choices: ["സുഹൃത്ത് (Suhruthu)", "പ്രകൃതി (Prakruthi)", "സന്തോഷം (Santhosham)", "പുസ്തകം (Pusthakam)"], answer: 0 },
        { q: "What does 'സന്തോഷം (Santhosham)' mean?", choices: ["Morning", "Happiness / Joy", "Respect", "Star"], answer: 1 },
        { q: "Which Malayalam word means 'Hard Work'?", choices: ["കഠിനാധ്വാനം (Kathinadhwanam)", "സമാധാനം (Samadhanam)", "ആരോഗ്യം (Arogyam)", "ഭാവി (Bhavi)"], answer: 0 },
        { q: "What does 'അധ്യാപകൻ (Adhyapakan)' mean in English?", choices: ["Student", "Teacher", "Doctor", "Scientist"], answer: 1 },
        { q: "How do you say 'Science' in Malayalam?", choices: ["ശാസ്ത്രം (Shasthram)", "സത്യം (Sathyam)", "ബഹുമാനം (Bahumanam)", "സ്നേഹം (Sneham)"], answer: 0 },
        { q: "What is the meaning of 'ആരോഗ്യം (Arogyam)'?", choices: ["Wealth", "Health", "Future", "Truth"], answer: 1 },
        { q: "Which word means 'Peace' in Malayalam?", choices: ["സമാധാനം (Samadhanam)", "പ്രകൃതി (Prakruthi)", "വെള്ളം (Vellam)", "സൂര്യൻ (Sooryan)"], answer: 0 },
        { q: "What does 'സത്യം (Sathyam)' mean?", choices: ["Truth", "Story", "Time", "Victory"], answer: 0 },
        { q: "How do you say 'Respect' in Malayalam?", choices: ["ബഹുമാനം (Bahumanam)", "നമസ്കാരം (Namaskaram)", "സന്തോഷം (Santhosham)", "അറിവ് (Arivu)"], answer: 0 },
        { q: "Which Malayalam word means 'Nature'?", choices: ["പ്രകൃതി (Prakruthi)", "ഭാവി (Bhavi)", "പുസ്തകം (Pusthakam)", "വിദ്യാലയം (Vidyalayam)"], answer: 0 },
        { q: "In 'സൂര്യൻ കിഴക്ക് ഉദിക്കുന്നു', what does 'സൂര്യൻ (Sooryan)' mean?", choices: ["Moon", "Sun", "Star", "Sky"], answer: 1 },
        { q: "What does 'ഭാവി (Bhavi)' mean in English?", choices: ["History", "Present", "Future", "Morning"], answer: 2 },
        { q: "How do you ask for 'Water' in Malayalam?", choices: ["വെള്ളം (Vellam)", "പാൽ (Paal)", "പൂവ് (Poovu)", "മരം (Maram)"], answer: 0 },
        { q: "Which word means 'Book' in Malayalam?", choices: ["പുസ്തകം (Pusthakam)", "തൂലിക (Thoolika)", "മേശ (Mesha)", "കസേര (Kasera)"], answer: 0 },
        { q: "What does 'സ്നേഹം (Sneham)' mean?", choices: ["Anger", "Love / Kindness", "Speed", "Courage"], answer: 1 },
        { q: "Which respectful greeting is used in Malayalam?", choices: ["നമസ്കാരം (Namaskaram)", "നന്ദി (Nandi)", "ശരി (Shari)", "വരിക (Varika)"], answer: 0 }
      ],
      kidItems: [
        { emoji: "🐘", primary: "ആന (Aana)", meaning: "Elephant", speech: "Aana" },
        { emoji: "🐱", primary: "പൂച്ച (Poocha)", meaning: "Cat", speech: "Poocha" },
        { emoji: "🐶", primary: "പട്ടി (Patti)", meaning: "Dog", speech: "Patti" },
        { emoji: "☀️", primary: "സൂര്യൻ (Sooryan)", meaning: "Sun", speech: "Sooryan" },
        { emoji: "🌳", primary: "മരം (Maram)", meaning: "Tree", speech: "Maram" },
        { emoji: "🐟", primary: "മീൻ (Meen)", meaning: "Fish", speech: "Meen" },
        { emoji: "⭐", primary: "നക്ഷത്രം (Nakshatram)", meaning: "Star", speech: "Nakshatram" },
        { emoji: "🥭", primary: "മാമ്പഴം (Mampazham)", meaning: "Mango", speech: "Mampazham" },
        { emoji: "🌙", primary: "ചന്ദ്രൻ (Chandran)", meaning: "Moon", speech: "Chandran" },
        { emoji: "🌸", primary: "പൂവ് (Poovu)", meaning: "Flower", speech: "Poovu" },
        { emoji: "🐦", primary: "പക്ഷി (Pakshi)", meaning: "Bird", speech: "Pakshi" },
        { emoji: "🥛", primary: "പാൽ (Paal)", meaning: "Milk", speech: "Paal" },
        { emoji: "🌧️", primary: "മഴ (Mazha)", meaning: "Rain", speech: "Mazha" },
        { emoji: "🏠", primary: "വീട് (Veedu)", meaning: "House / Home", speech: "Veedu" },
        { emoji: "🚣", primary: "വള്ളം (Vallam)", meaning: "Boat", speech: "Vallam" },
        { emoji: "🍌", primary: "വാഴപ്പഴം (Vazhappazham)", meaning: "Banana", speech: "Vazhappazham" },
        { emoji: "🥥", primary: "തേങ്ങ (Thenga)", meaning: "Coconut", speech: "Thenga" },
        { emoji: "🦚", primary: "മയിൽ (Mayil)", meaning: "Peacock", speech: "Mayil" },
        { emoji: "👵", primary: "അമ്മൂമ്മ (Ammoomma)", meaning: "Grandmother", speech: "Ammoomma" },
        { emoji: "👴", primary: "അപ്പൂപ്പൻ (Appooppan)", meaning: "Grandfather", speech: "Appooppan" }
      ]
    },
    hindi: {
      label: "Hindi (हिंदी)",
      langCode: "hi-IN",
      letters: [
        { char: "अ", translit: "A", word: "अनार (Anaar)", wordMeaning: "Pomegranate", emoji: "🍎", speech: "अ से अनार" },
        { char: "आ", translit: "Aa", word: "आम (Aam)", wordMeaning: "Mango", emoji: "🥭", speech: "आ से आम" },
        { char: "इ", translit: "I", word: "इमली (Imli)", wordMeaning: "Tamarind", emoji: "🌿", speech: "इ से इमली" },
        { char: "ई", translit: "Ee", word: "ईख (Eekh)", wordMeaning: "Sugarcane", emoji: "🎋", speech: "ई से ईख" },
        { char: "उ", translit: "U", word: "उल्लू (Ullu)", wordMeaning: "Owl", emoji: "🦉", speech: "उ से उल्लू" },
        { char: "ऊ", translit: "Oo", word: "ऊन (Oon)", wordMeaning: "Wool", emoji: "🧶", speech: "ऊ से ऊन" },
        { char: "ऋ", translit: "Ri", word: "ऋषि (Rishi)", wordMeaning: "Sage", emoji: "🧘", speech: "ऋ से ऋषि" },
        { char: "ए", translit: "E", word: "एड़ी (Edee)", wordMeaning: "Heel", emoji: "🦶", speech: "ए से एड़ी" },
        { char: "ऐ", translit: "Ai", word: "ऐनक (Ainak)", wordMeaning: "Spectacles / Glasses", emoji: "👓", speech: "ऐ से ऐनक" },
        { char: "ओ", translit: "O", word: "ओखली (Okhli)", wordMeaning: "Mortar", emoji: "🥣", speech: "ओ से ओखली" },
        { char: "औ", translit: "Au", word: "औरत (Aurat)", wordMeaning: "Woman", emoji: "👩", speech: "औ से औरत" },
        { char: "अं", translit: "Am", word: "अंगूर (Angoor)", wordMeaning: "Grapes", emoji: "🍇", speech: "अं से अंगूर" },
        { char: "क", translit: "Ka", word: "कमल (Kamal)", wordMeaning: "Lotus", emoji: "🪷", speech: "क से कमल" },
        { char: "ख", translit: "Kha", word: "खरगोश (Khargosh)", wordMeaning: "Rabbit", emoji: "🐇", speech: "ख से खरगोश" },
        { char: "ग", translit: "Ga", word: "गमला (Gamla)", wordMeaning: "Flower Pot", emoji: "🪴", speech: "ग से गमला" },
        { char: "घ", translit: "Gha", word: "घड़ी (Ghadi)", wordMeaning: "Clock / Watch", emoji: "⏰", speech: "घ से घड़ी" },
        { char: "ङ", translit: "Nga", word: "अंग (Ang)", wordMeaning: "Part / Body", emoji: "🖐️", speech: "ङ" },
        { char: "च", translit: "Cha", word: "चम्मच (Chammach)", wordMeaning: "Spoon", emoji: "🥄", speech: "च से चम्मच" },
        { char: "छ", translit: "Chha", word: "छतरी (Chhatri)", wordMeaning: "Umbrella", emoji: "☂️", speech: "छ से छतरी" },
        { char: "ज", translit: "Ja", word: "जग (Jag)", wordMeaning: "Jug", emoji: "🫖", speech: "ज से जग" },
        { char: "झ", translit: "Jha", word: "झंडा (Jhanda)", wordMeaning: "Flag", emoji: "🚩", speech: "झ से झंडा" },
        { char: "ञ", translit: "Nya", word: "पंच (Panch)", wordMeaning: "Five", emoji: "5️⃣", speech: "ञ" },
        { char: "ट", translit: "Ta", word: "टमाटर (Tamaatar)", wordMeaning: "Tomato", emoji: "🍅", speech: "ट से टमाटर" },
        { char: "ठ", translit: "Tha", word: "ठठेरा (Thathera)", wordMeaning: "Tinsmith", emoji: "🔨", speech: "ठ से ठठेरा" },
        { char: "ड", translit: "Da", word: "डमरू (Damroo)", wordMeaning: "Small Drum", emoji: "🥁", speech: "ड से डमरू" },
        { char: "ढ", translit: "Dha", word: "ढक्कन (Dhakkan)", wordMeaning: "Lid / Cap", emoji: "🫙", speech: "ढ से ढक्कन" },
        { char: "ण", translit: "Na", word: "बाण (Baan)", wordMeaning: "Arrow", emoji: "🏹", speech: "ण से बाण" },
        { char: "त", translit: "Ta", word: "तरबूज (Tarbooj)", wordMeaning: "Watermelon", emoji: "🍉", speech: "त से तरबूज" },
        { char: "थ", translit: "Tha", word: "थर्मस (Thermos)", wordMeaning: "Thermos Flask", emoji: "🍶", speech: "थ से थर्मस" },
        { char: "द", translit: "Da", word: "दवात (Dawaat)", wordMeaning: "Inkpot", emoji: "✒️", speech: "द से दवात" },
        { char: "ध", translit: "Dha", word: "धनुष (Dhanush)", wordMeaning: "Bow", emoji: "🏹", speech: "ध से धनुष" },
        { char: "न", translit: "Na", word: "नल (Nal)", wordMeaning: "Water Tap", emoji: "🚰", speech: "न से नल" },
        { char: "प", translit: "Pa", word: "पतंग (Patang)", wordMeaning: "Kite", emoji: "🪁", speech: "प से पतंग" },
        { char: "फ", translit: "Pha", word: "फल (Phal)", wordMeaning: "Fruits", emoji: "🍎", speech: "फ से फल" },
        { char: "ब", translit: "Ba", word: "बत्तख (Batak)", wordMeaning: "Duck", emoji: "🦆", speech: "ब से बत्तख" },
        { char: "भ", translit: "Bha", word: "भालू (Bhaloo)", wordMeaning: "Bear", emoji: "🐻", speech: "भ से भालू" },
        { char: "म", translit: "Ma", word: "मछली (Machhli)", wordMeaning: "Fish", emoji: "🐟", speech: "म से मछली" },
        { char: "य", translit: "Ya", word: "यज्ञ (Yagya)", wordMeaning: "Sacred Fire", emoji: "🔥", speech: "य से यज्ञ" },
        { char: "र", translit: "Ra", word: "रथ (Rath)", wordMeaning: "Chariot", emoji: "🏎️", speech: "र से रथ" },
        { char: "ल", translit: "La", word: "लट्टू (Lattoo)", wordMeaning: "Spinning Top", emoji: "🪀", speech: "ल से लट्टू" },
        { char: "व", translit: "Va", word: "वक (Vak)", wordMeaning: "Crane Bird", emoji: "🦩", speech: "व से वक" },
        { char: "श", translit: "Sha", word: "शलजम (Shaljam)", wordMeaning: "Turnip", emoji: "🥗", speech: "श से शलजम" },
        { char: "ष", translit: "Sha", word: "षट्कोण (Shatkon)", wordMeaning: "Hexagon", emoji: "⬡", speech: "ष से षट्कोण" },
        { char: "स", translit: "Sa", word: "सपेरा (Sapera) / सेब (Seb)", wordMeaning: "Apple / Snake Charmer", emoji: "🍎", speech: "स से सेब" },
        { char: "ह", translit: "Ha", word: "हाथी (Haathi)", wordMeaning: "Elephant", emoji: "🐘", speech: "ह से हाथी" },
        { char: "क्ष", translit: "Ksh", word: "क्षत्रिय (Kshatriya)", wordMeaning: "Warrior", emoji: "🛡️", speech: "क्ष से क्षत्रिय" },
        { char: "त्र", translit: "Tra", word: "त्रिशूल (Trishul)", wordMeaning: "Trident", emoji: "🔱", speech: "त्र से त्रिशूल" },
        { char: "ज्ञ", translit: "Gya", word: "ज्ञानी (Gyaani)", wordMeaning: "Wise Person", emoji: "🧙", speech: "ज्ञ से ज्ञानी" }
      ],
      sentences: [
        { script: "माँ मुझे बहुत प्यार करती है।", translit: "Maa mujhe bahut pyaar karti hai.", meaning: "Mother loves me very much.", speech: "माँ मुझे बहुत प्यार करती है" },
        { script: "मैं रोज़ स्कूल जाता हूँ।", translit: "Main roz school jaata hoon.", meaning: "I go to school every day.", speech: "मैं रोज़ स्कूल जाता हूँ" },
        { script: "बिल्ली कटोरी में दूध पीती है।", translit: "Billi katori mein doodh peeti hai.", meaning: "The cat drinks milk in a bowl.", speech: "बिल्ली कटोरी में दूध पीती है" },
        { script: "सूरज पूर्व दिशा में उगता है।", translit: "Sooraj poorv disha mein ugta hai.", meaning: "The sun rises in the east.", speech: "सूरज पूर्व दिशा में उगता है" },
        { script: "आज ठंडी-ठंडी बारिश हो रही है।", translit: "Aaj thandi-thandi baarish ho rahi hai.", meaning: "Pleasant rain is falling today.", speech: "आज ठंडी ठंडी बारिश हो रही है" },
        { script: "सुंदर चिड़िया पेड़ की डाल पर गाती है।", translit: "Sundar chidiya ped ki daal par gaati hai.", meaning: "The pretty bird sings on the tree branch.", speech: "सुंदर चिड़िया पेड़ की डाल पर गाती है" },
        { script: "मुझे मीठे और रसीले आम बहुत पसंद हैं।", translit: "Mujhe meethe aur raseele aam bahut pasand hain.", meaning: "I really love sweet and juicy mangoes.", speech: "मुझे मीठे और रसीले आम बहुत पसंद हैं" },
        { script: "सदा सत्य बोलो और बड़ों का आदर करो।", translit: "Sada satya bolo aur badon ka aadar karo.", meaning: "Always speak the truth and respect elders.", speech: "सदा सत्य बोलो और बड़ों का आदर करो" },
        { script: "किताबें हमारी सच्ची और अच्छी मित्र हैं।", translit: "Kitaabein hamari sachhi aur achhi mitra hain.", meaning: "Books are our true and faithful friends.", speech: "किताबें हमारी सच्ची और अच्छी मित्र हैं" },
        { script: "आओ हम सब मिलकर पार्क में खेलें!", translit: "Aao hum sab milkar park mein khelein!", meaning: "Come, let us all play together in the park!", speech: "आओ हम सब मिलकर पार्क में खेलें" },
        { script: "हाथी जंगल का सबसे बड़ा जानवर है।", translit: "Haathi jangal ka sabse bada jaanwar hai.", meaning: "The elephant is the largest animal in the jungle.", speech: "हाथी जंगल का सबसे बड़ा जानवर है" },
        { script: "रात में नीले आसमान में तारे चमकते हैं।", translit: "Raat mein neele aasmaan mein taare chamakte hain.", meaning: "Stars twinkle in the dark night sky.", speech: "रात में नीले आसमान में तारे चमकते हैं" }
      ],
      teenCards: [
        { script: "नमस्ते", translit: "Namaste", meaning: "Hello / Respectful Greeting", example: "हम सबको आदर से नमस्ते कहते हैं।" },
        { script: "धन्यवाद", translit: "Dhanyavaad", meaning: "Thank you", example: "आपकी सहायता के लिए बहुत धन्यवाद।" },
        { script: "ज्ञान", translit: "Gyaan", meaning: "Knowledge / Wisdom", example: "ज्ञान से ही जीवन में प्रकाश आता है।" },
        { script: "परिश्रम", translit: "Parishram", meaning: "Hard Work", example: "परिश्रम सफलता की कुंजी है (Hard work is the key to success)." },
        { script: "पुस्तक", translit: "Pustak", meaning: "Book", example: "यह विज्ञान की पुस्तक बहुत रोचक है।" },
        { script: "परिवार", translit: "Parivaar", meaning: "Family", example: "मेरा परिवार मेरे लिए सबसे महत्वपूर्ण है।" },
        { script: "प्रकृति", translit: "Prakriti", meaning: "Nature", example: "हमें प्रकृति की रक्षा करनी चाहिए।" },
        { script: "मित्रता", translit: "Mitrata", meaning: "Friendship", example: "सच्ची मित्रता अनमोल होती है।" },
        { script: "विद्यालय", translit: "Vidyalay", meaning: "School", example: "हम प्रतिदिन विद्यालय जाते हैं।" },
        { script: "आत्मविश्वास", translit: "Aatmavishwas", meaning: "Self-Confidence", example: "सफलता के लिए आत्मविश्वास आवश्यक है।" },
        { script: "भविष्य", translit: "Bhavishya", meaning: "Future", example: "शिक्षा हमारे भविष्य को उज्ज्वल बनाती है।" },
        { script: "सम्मान", translit: "Sammaan", meaning: "Respect / Honor", example: "बड़ों का सम्मान करना अच्छी आदत है।" },
        { script: "सफलता", translit: "Saphalta", meaning: "Success", example: "निरंतर अभ्यास से सफलता मिलती है।" },
        { script: "सत्य", translit: "Satya", meaning: "Truth", example: "सत्य की सदैव विजय होती है (Truth always triumphs)." },
        { script: "स्वास्थ्य", translit: "Swasthya", meaning: "Health", example: "अच्छा स्वास्थ्य सबसे बड़ा धन है।" },
        { script: "विज्ञान", translit: "Vigyaan", meaning: "Science", example: "विज्ञान ने हमारे जीवन को सरल बनाया है।" },
        { script: "साहस", translit: "Saahas", meaning: "Courage / Bravery", example: "कठिन समय में साहस बनाए रखें।" },
        { script: "शांति", translit: "Shaanti", meaning: "Peace", example: "मन की शांति बहुत महत्वपूर्ण है।" },
        { script: "अध्यापक", translit: "Adhyapak", meaning: "Teacher", example: "अध्यापक हमें नई बातें सिखाते हैं।" },
        { script: "पर्यावरण", translit: "Paryavaran", meaning: "Environment", example: "पेड़-पौधे पर्यावरण को स्वच्छ रखते हैं।" }
      ],
      teenQuiz: [
        { q: "What is the meaning of 'परिश्रम (Parishram)'?", choices: ["Nature", "Hard Work", "Family", "Peace"], answer: 1 },
        { q: "Which Hindi word means 'Family'?", choices: ["पुस्तक (Pustak)", "परिवार (Parivaar)", "मित्रता (Mitrata)", "ज्ञान (Gyaan)"], answer: 1 },
        { q: "How do you say 'Thank you' formally in Hindi?", choices: ["नमस्ते (Namaste)", "धन्यवाद (Dhanyavaad)", "कृपया (Kripaya)", "स्वागत (Swagat)"], answer: 1 },
        { q: "What does 'आत्मविश्वास (Aatmavishwas)' mean?", choices: ["Self-Confidence", "Library", "Environment", "Kindness"], answer: 0 },
        { q: "Which Hindi word means 'Future'?", choices: ["प्रकृति (Prakriti)", "भविष्य (Bhavishya)", "सम्मान (Sammaan)", "विद्यालय (Vidyalay)"], answer: 1 },
        { q: "What does 'सम्मान (Sammaan)' mean in English?", choices: ["Respect / Honor", "Water", "Sun", "Homework"], answer: 0 },
        { q: "Which Hindi word means 'Environment'?", choices: ["पर्यावरण (Paryavaran)", "विज्ञान (Vigyaan)", "स्वास्थ्य (Swasthya)", "सफलता (Saphalta)"], answer: 0 },
        { q: "What does 'साहस (Saahas)' mean?", choices: ["Peace", "Courage / Bravery", "Truth", "Book"], answer: 1 },
        { q: "How do you say 'Science' in Hindi?", choices: ["ज्ञान (Gyaan)", "विज्ञान (Vigyaan)", "विद्यालय (Vidyalay)", "भविष्य (Bhavishya)"], answer: 1 },
        { q: "What is the English meaning of 'स्वास्थ्य (Swasthya)'?", choices: ["Health", "Wealth", "Success", "Friendship"], answer: 0 },
        { q: "Which Hindi word means 'Success'?", choices: ["सफलता (Saphalta)", "मित्रता (Mitrata)", "सत्य (Satya)", "शांति (Shaanti)"], answer: 0 },
        { q: "What does 'अध्यापक (Adhyapak)' mean?", choices: ["Student", "Teacher", "Friend", "Citizen"], answer: 1 },
        { q: "How do you say 'Peace' in Hindi?", choices: ["शांति (Shaanti)", "क्रांति (Kraanti)", "भक्ति (Bhakti)", "शक्ति (Shakti)"], answer: 0 },
        { q: "What does 'ज्ञान (Gyaan)' mean in English?", choices: ["Song", "Knowledge / Wisdom", "Journey", "Time"], answer: 1 },
        { q: "Which word means 'School' in Hindi?", choices: ["विद्यालय (Vidyalay)", "पुस्तकालय (Pustakalay)", "देवालय (Devalay)", "कार्यालय (Karyalay)"], answer: 0 },
        { q: "What is the meaning of 'मित्रता (Mitrata)'?", choices: ["Honesty", "Friendship", "Nature", "Bravery"], answer: 1 },
        { q: "In 'सत्य की सदैव विजय होती है', what does 'सत्य (Satya)' mean?", choices: ["Truth", "Power", "Kindness", "Effort"], answer: 0 },
        { q: "Which Hindi word means 'Nature'?", choices: ["प्रकृति (Prakriti)", "संस्कृति (Sanskriti)", "प्रगति (Pragati)", "स्मृति (Smriti)"], answer: 0 },
        { q: "How do you say 'Book' in formal Hindi?", choices: ["पुस्तक (Pustak)", "कलम (Kalam)", "मेज (Mej)", "पत्र (Patra)"], answer: 0 },
        { q: "Which respectful greeting is used in Hindi?", choices: ["नमस्ते (Namaste)", "धन्यवाद (Dhanyavaad)", "क्षमा (Kshama)", "अच्छा (Achha)"], answer: 0 }
      ],
      kidItems: [
        { emoji: "🐘", primary: "हाथी (Haathi)", meaning: "Elephant", speech: "हाथी" },
        { emoji: "🐱", primary: "बिल्ली (Billi)", meaning: "Cat", speech: "बिल्ली" },
        { emoji: "🐶", primary: "कुत्ता (Kutta)", meaning: "Dog", speech: "कुत्ता" },
        { emoji: "🦁", primary: "शेर (Sher)", meaning: "Lion", speech: "शेर" },
        { emoji: "☀️", primary: "सूरज (Sooraj)", meaning: "Sun", speech: "सूरज" },
        { emoji: "🌳", primary: "पेड़ (Ped)", meaning: "Tree", speech: "पेड़" },
        { emoji: "🐟", primary: "मछली (Machhli)", meaning: "Fish", speech: "मछली" },
        { emoji: "🍎", primary: "सेब (Seb)", meaning: "Apple", speech: "सेब" },
        { emoji: "🌙", primary: "चाँद (Chaand)", meaning: "Moon", speech: "चाँद" },
        { emoji: "🌸", primary: "फूल (Phool)", meaning: "Flower", speech: "फूल" },
        { emoji: "💧", primary: "पानी (Paani)", meaning: "Water", speech: "पानी" },
        { emoji: "🐦", primary: "चिड़िया (Chidiya)", meaning: "Bird", speech: "चिड़िया" },
        { emoji: "🥭", primary: "आम (Aam)", meaning: "Mango", speech: "आम" },
        { emoji: "🦚", primary: "मोर (Mor)", meaning: "Peacock", speech: "मोर" },
        { emoji: "🏠", primary: "घर (Ghar)", meaning: "House / Home", speech: "घर" },
        { emoji: "🥛", primary: "दूध (Doodh)", meaning: "Milk", speech: "दूध" },
        { emoji: "⭐", primary: "तारा (Taara)", meaning: "Star", speech: "तारा" },
        { emoji: "🦋", primary: "तितली (Titli)", meaning: "Butterfly", speech: "तितली" },
        { emoji: "🐇", primary: "खरगोश (Khargosh)", meaning: "Rabbit", speech: "खरगोश" },
        { emoji: "☂️", primary: "छाता (Chhaata)", meaning: "Umbrella", speech: "छाता" }
      ]
    },
    spanish: {
      label: "Spanish (Español)",
      langCode: "es-ES",
      sentences: [
        { script: "Mi mamá me ama mucho.", translit: "Mee mah-MAH meh AH-mah MOO-choh.", meaning: "My mom loves me very much.", speech: "Mi mamá me ama mucho" },
        { script: "Voy a la escuela con mis amigos.", translit: "Boy ah lah ehs-KWEH-lah kohn mees ah-MEE-gohs.", meaning: "I go to school with my friends.", speech: "Voy a la escuela con mis amigos" },
        { script: "El gato bebe leche fresca.", translit: "Ehl GAH-toh BEH-beh LEH-cheh FREHS-kah.", meaning: "The cat drinks fresh milk.", speech: "El gato bebe leche fresca" },
        { script: "El sol brilla en el cielo azul.", translit: "Ehl sohl BREE-yah ehn ehl SYEH-loh ah-SOOL.", meaning: "The sun shines in the blue sky.", speech: "El sol brilla en el cielo azul" },
        { script: "Me gusta comer manzanas rojas y dulces.", translit: "Meh GOOS-tah koh-MEHR mahn-SAH-nahs ROH-hahs ee DOOL-sehs.", meaning: "I like eating sweet red apples.", speech: "Me gusta comer manzanas rojas y dulces" },
        { script: "Los pájaros cantan por la mañana.", translit: "Lohs PAH-hah-rohs KAHN-tahn pohr lah mah-NYAH-nah.", meaning: "The birds sing in the morning.", speech: "Los pájaros cantan por la mañana" },
        { script: "Siempre decimos la verdad con respeto.", translit: "SYEHM-preh deh-SEE-mohs lah behr-DAHD kohn rehs-PEH-toh.", meaning: "We always tell the truth with respect.", speech: "Siempre decimos la verdad con respeto" },
        { script: "¡Vamos a jugar todos juntos en el parque!", translit: "BAH-mohs ah hoo-GAHR TOH-dohs HOON-tohs ehn ehl PAHR-keh!", meaning: "Let's all play together in the park!", speech: "Vamos a jugar todos juntos en el parque" }
      ],
      teenCards: [
        { script: "¡Hola! ¿Cómo estás?", translit: "OH-lah KOH-moh ehs-TAHS", meaning: "Hello! How are you?", example: "¡Hola! ¿Cómo estás hoy en la escuela?" },
        { script: "Muchas gracias", translit: "MOO-chahs GRAH-syahs", meaning: "Thank you very much", example: "Muchas gracias por explicarme el problema." },
        { script: "El Conocimiento", translit: "ehl koh-noh-see-MYEHN-toh", meaning: "Knowledge", example: "El conocimiento científico transforma el mundo." },
        { script: "La Biblioteca", translit: "lah bee-blyoh-TEH-kah", meaning: "The Library", example: "Voy a estudiar en la biblioteca esta tarde." },
        { script: "El Esfuerzo", translit: "ehl ehs-FWEHR-soh", meaning: "Effort / Perseverance", example: "Cada gran logro requiere esfuerzo diario." },
        { script: "La Familia", translit: "lah fah-MEE-lyah", meaning: "The Family", example: "Cenamos juntos con toda la familia." },
        { script: "La Naturaleza", translit: "lah nah-too-rah-LEH-sah", meaning: "Nature", example: "Cuidar la naturaleza es nuestra responsabilidad." },
        { script: "El Futuro", translit: "ehl foo-TOO-roh", meaning: "The Future", example: "Construimos el futuro paso a paso." },
        { script: "La Ciencia", translit: "lah SYEHN-syah", meaning: "Science", example: "La ciencia nos ayuda a comprender el universo." },
        { script: "La Amistad", translit: "lah ah-mees-TAHD", meaning: "Friendship", example: "La verdadera amistad dura toda la vida." },
        { script: "Aprender", translit: "ah-prehn-DEHR", meaning: "To Learn", example: "Me encanta aprender nuevos idiomas cada día." },
        { script: "La Esperanza", translit: "lah ehs-peh-RAHN-sah", meaning: "Hope", example: "Nunca debemos perder la esperanza." },
        { script: "La Escuela", translit: "lah ehs-KWEH-lah", meaning: "The School", example: "Mis amigos y yo caminamos a la escuela." },
        { script: "El Maestro / La Maestra", translit: "ehl mah-EHS-troh", meaning: "The Teacher", example: "La maestra explicó la lección con claridad." },
        { script: "La Verdad", translit: "lah behr-DAHD", meaning: "The Truth", example: "Siempre es importante decir la verdad." },
        { script: "El Respeto", translit: "ehl rehs-PEH-toh", meaning: "Respect", example: "Tratamos a todas las personas con respeto." },
        { script: "La Salud", translit: "lah sah-LOOD", meaning: "Health", example: "Dormir bien y hacer ejercicio mejora la salud." },
        { script: "El Éxito", translit: "ehl EHK-see-toh", meaning: "Success", example: "La práctica constante lleva al éxito." },
        { script: "Investigar", translit: "een-behs-tee-GAHR", meaning: "To Research / Investigate", example: "Los científicos van a investigar el océano." },
        { script: "La Paz", translit: "lah pahs", meaning: "Peace", example: "Deseamos la paz en todo el mundo." }
      ],
      teenQuiz: [
        { q: "What does 'La Biblioteca' mean in English?", choices: ["The Bookstore", "The Library", "The Laboratory", "The Classroom"], answer: 1 },
        { q: "Which Spanish noun means 'Effort / Perseverance'?", choices: ["El Futuro", "El Esfuerzo", "El Conocimiento", "La Familia"], answer: 1 },
        { q: "How do you ask 'How are you?' in Spanish?", choices: ["¿Dónde estás?", "¿Cómo estás?", "¿Qué hora es?", "¿Quién es?"], answer: 1 },
        { q: "What does the Spanish verb 'Aprender' mean?", choices: ["To Speak", "To Learn", "To Write", "To Travel"], answer: 1 },
        { q: "Which Spanish word means 'Friendship'?", choices: ["La Ciencia", "La Amistad", "La Esperanza", "La Naturaleza"], answer: 1 },
        { q: "What is the meaning of 'El Conocimiento'?", choices: ["Knowledge", "The Question", "The Neighbour", "The Morning"], answer: 0 },
        { q: "What does 'La Esperanza' mean in English?", choices: ["Waiting", "Hope", "Honesty", "History"], answer: 1 },
        { q: "Which Spanish word means 'Success'?", choices: ["El Éxito", "La Salida", "El Tiempo", "El Libro"], answer: 0 },
        { q: "How do you say 'The Truth' in Spanish?", choices: ["La Paz", "La Verdad", "La Salud", "La Escuela"], answer: 1 },
        { q: "What does the verb 'Investigar' mean?", choices: ["To Invite", "To Research / Investigate", "To Invent", "To Imagine"], answer: 1 },
        { q: "Which Spanish word means 'Health'?", choices: ["La Salud", "El Sol", "La Sal", "El Suelo"], answer: 0 },
        { q: "What does 'El Maestro / La Maestra' mean?", choices: ["The Principal", "The Teacher", "The Student", "The Author"], answer: 1 },
        { q: "How do you say 'Science' in Spanish?", choices: ["La Ciencia", "La Conciencia", "La Paciencia", "La Diferencia"], answer: 0 },
        { q: "What is the English meaning of 'La Naturaleza'?", choices: ["Nation", "Nature", "Night", "Number"], answer: 1 },
        { q: "Which word means 'Peace' in Spanish?", choices: ["La Paz", "El Paso", "El Pez", "El Pan"], answer: 0 },
        { q: "What does 'El Respeto' mean?", choices: ["Response", "Respect", "Rest", "Result"], answer: 1 },
        { q: "How do you say 'Thank you very much' in Spanish?", choices: ["Por favor", "Muchas gracias", "Buenos días", "Hasta luego"], answer: 1 },
        { q: "Which Spanish word means 'The Future'?", choices: ["El Pasado", "El Presente", "El Futuro", "El Mundo"], answer: 2 },
        { q: "What does 'La Escuela' mean?", choices: ["The Stairs", "The School", "The Star", "The Season"], answer: 1 },
        { q: "In 'Cenamos juntos con toda la familia', what does 'juntos' mean?", choices: ["Early", "Together", "Outside", "Quickly"], answer: 1 }
      ],
      kidItems: [
        { emoji: "🐘", primary: "El Elefante", meaning: "Elephant", speech: "El elefante" },
        { emoji: "🐱", primary: "El Gato", meaning: "Cat", speech: "El gato" },
        { emoji: "🐶", primary: "El Perro", meaning: "Dog", speech: "El perro" },
        { emoji: "🦁", primary: "El León", meaning: "Lion", speech: "El león" },
        { emoji: "☀️", primary: "El Sol", meaning: "Sun", speech: "El sol" },
        { emoji: "🌳", primary: "El Árbol", meaning: "Tree", speech: "El árbol" },
        { emoji: "🐟", primary: "El Pez", meaning: "Fish", speech: "El pez" },
        { emoji: "🍎", primary: "La Manzana", meaning: "Apple", speech: "La manzana" },
        { emoji: "🌙", primary: "La Luna", meaning: "Moon", speech: "La luna" },
        { emoji: "🌸", primary: "La Flor", meaning: "Flower", speech: "La flor" },
        { emoji: "💧", primary: "El Agua", meaning: "Water", speech: "El agua" },
        { emoji: "🐦", primary: "El Pájaro", meaning: "Bird", speech: "El pájaro" },
        { emoji: "🏠", primary: "La Casa", meaning: "House / Home", speech: "La casa" },
        { emoji: "📚", primary: "El Libro", meaning: "Book", speech: "El libro" },
        { emoji: "🥛", primary: "La Leche", meaning: "Milk", speech: "La leche" },
        { emoji: "⭐", primary: "La Estrella", meaning: "Star", speech: "La estrella" },
        { emoji: "🦋", primary: "La Mariposa", meaning: "Butterfly", speech: "La mariposa" },
        { emoji: "🐢", primary: "La Tortuga", meaning: "Turtle", speech: "La tortuga" },
        { emoji: "🍞", primary: "El Pan", meaning: "Bread", speech: "El pan" },
        { emoji: "🎈", primary: "El Globo", meaning: "Balloon", speech: "El globo" }
      ]
    },
    animals: {
      label: "Animals Kingdom",
      langCode: "en-US",
      kidItems: [
        { emoji: "🦁", primary: "Lion", meaning: "King of the Savanna (Roar!)", speech: "Lion! The Lion says Roar!" },
        { emoji: "🐬", primary: "Dolphin", meaning: "Smart Ocean Mammal that Breathes Air", speech: "Dolphin! Dolphins are smart ocean mammals!" },
        { emoji: "🦒", primary: "Giraffe", meaning: "Tallest Land Animal with a Long Neck", speech: "Giraffe! The tallest animal on land!" },
        { emoji: "🐧", primary: "Penguin", meaning: "Antarctic Bird that Swims Instead of Flies", speech: "Penguin! Penguins swim super fast in icy water!" },
        { emoji: "🦋", primary: "Butterfly", meaning: "Grows from a Caterpillar inside a Chrysalis", speech: "Butterfly! A caterpillar turns into a butterfly!" },
        { emoji: "🦘", primary: "Kangaroo", meaning: "Hops High & Carries Baby Joey in a Pouch", speech: "Kangaroo! Carries its baby joey in a pouch!" },
        { emoji: "🦉", primary: "Owl", meaning: "Nocturnal Bird that Sees in the Dark", speech: "Owl! Owls wake up at night!" },
        { emoji: "🐢", primary: "Sea Turtle", meaning: "Carries a Protective Hard Shell on its Back", speech: "Sea Turtle! Protected by a hard shell!" },
        { emoji: "🐝", primary: "Honeybee", meaning: "Makes Sweet Honey & Pollinates Flowers", speech: "Honeybee! Helps flowers grow into fruit!" },
        { emoji: "🐘", primary: "Elephant", meaning: "Largest Land Animal with a Long Trunk", speech: "Elephant! Uses its trunk to drink and trumpet!" },
        { emoji: "🐙", primary: "Octopus", meaning: "Ocean Creature with Eight Clever Arms", speech: "Octopus! An octopus has eight arms!" },
        { emoji: "🐆", primary: "Cheetah", meaning: "Fastest Runner on Planet Earth", speech: "Cheetah! The fastest land animal!" },
        { emoji: "🐼", primary: "Giant Panda", meaning: "Black-and-White Bear that Loves Bamboo", speech: "Giant Panda! Loves munching crunchy bamboo!" },
        { emoji: "🐨", primary: "Koala", meaning: "Tree-Dwelling Marsupial from Australia", speech: "Koala! Lives in eucalyptus trees in Australia!" },
        { emoji: "🐋", primary: "Blue Whale", meaning: "Largest Animal Ever to Live on Earth", speech: "Blue Whale! The largest animal on Earth!" },
        { emoji: "🦩", primary: "Flamingo", meaning: "Pink Wading Bird that Stands on One Leg", speech: "Flamingo! Famous for its pink feathers!" },
        { emoji: "🦎", primary: "Chameleon", meaning: "Clever Lizard that Changes Skin Color", speech: "Chameleon! Changes color for camouflage!" },
        { emoji: "🐻‍❄️", primary: "Polar Bear", meaning: "Arctic Bear with Thick Fur for Ice & Snow", speech: "Polar Bear! Stays warm in the icy Arctic!" },
        { emoji: "🐸", primary: "Tree Frog", meaning: "Amphibian that Starts Life as a Tadpole", speech: "Frog! An amphibian that starts life as a tadpole in water!" },
        { emoji: "🦫", primary: "Beaver", meaning: "Nature's Engineer that Builds River Dams", speech: "Beaver! Builds lodges and dams out of wood!" }
      ]
    },
    numbers: {
      label: "Numbers & Fun Math",
      cloudDomain: "6+ Numbers & Math",
      langCode: "en-US",
      kidItems: [
        { emoji: "1️⃣", primary: "One • ഒന്ന് (Onnu) • एक (Ek) • Uno", meaning: "Number 1", speech: "One. Uno." },
        { emoji: "2️⃣", primary: "Two • രണ്ട് (Randu) • दो (Do) • Dos", meaning: "Number 2", speech: "Two. Dos." },
        { emoji: "3️⃣", primary: "Three • മൂന്ന് (Moonnu) • तीन (Teen) • Tres", meaning: "Number 3", speech: "Three. Tres." },
        { emoji: "4️⃣", primary: "Four • നാല് (Naalu) • चार (Chaar) • Cuatro", meaning: "Number 4", speech: "Four. Cuatro." },
        { emoji: "5️⃣", primary: "Five • അഞ്ച് (Anchu) • पाँच (Paanch) • Cinco", meaning: "Number 5", speech: "Five. Cinco." },
        { emoji: "🔟", primary: "Ten • പത്ത് (Pathu) • दस (Das) • Diez", meaning: "Number 10", speech: "Ten. Diez." },
        { emoji: "➕", primary: "2 + 3 = 5", meaning: "Five Stars! ⭐⭐⭐⭐⭐", speech: "Two plus three equals five!" },
        { emoji: "🍎", primary: "4 + 4 = 8", meaning: "Double Four is Eight! 🍎🍎🍎🍎 + 🍎🍎🍎🍎", speech: "Four plus four equals eight!" },
        { emoji: "🚀", primary: "6 + 4 = 10", meaning: "Number Bond to Ten! 6 and 4 make 10", speech: "Six plus four equals ten!" },
        { emoji: "🌟", primary: "7 + 3 = 10", meaning: "Number Bond to Ten! 7 and 3 make 10", speech: "Seven plus three equals ten!" },
        { emoji: "🎈", primary: "9 - 3 = 6", meaning: "Take Away 3 from 9 Leaves 6 Balloons!", speech: "Nine minus three equals six!" },
        { emoji: "🍪", primary: "10 - 5 = 5", meaning: "Half of Ten is Five Cookies!", speech: "Ten minus five equals five!" },
        { emoji: "🐸", primary: "2, 4, 6, 8, 10", meaning: "Skip Counting by Twos (Even Numbers!)", speech: "Two, four, six, eight, ten!" },
        { emoji: "🖐️", primary: "5, 10, 15, 20", meaning: "Skip Counting by Fives!", speech: "Five, ten, fifteen, twenty!" },
        { emoji: "🔟", primary: "10, 20, 30, 40, 50", meaning: "Skip Counting by Tens!", speech: "Ten, twenty, thirty, forty, fifty!" },
        { emoji: "🧱", primary: "3 Tens + 5 Ones = 35", meaning: "Place Value: 30 + 5 = 35!", speech: "Three tens and five ones equals thirty-five!" },
        { emoji: "🪙", primary: "1 Dime = 10 Cents", meaning: "2 Nickels (5¢ + 5¢) also equal 10 Cents!", speech: "One dime equals ten cents!" },
        { emoji: "🍕", primary: "1/2 (One Half)", meaning: "1 of 2 Equal Pieces of a Whole Pizza!", speech: "One half is one of two equal parts!" },
        { emoji: "📐", primary: "Triangle (3) • Square (4) • Hexagon (6)", meaning: "Counting Polygon Sides!", speech: "A triangle has 3 sides, a square has 4 equal sides, and a hexagon has 6 sides!" },
        { emoji: "🕒", primary: "Half Past = :30", meaning: "When the long hand points to 6, it is 30 minutes past!", speech: "When the minute hand points to six, it is thirty minutes past the hour!" }
      ]
    },
    phonics: {
      label: "Sight Words & Phonics",
      langCode: "en-US",
      kidItems: [
        { emoji: "🚀", primary: "EXPLORE", meaning: "Ex-plore • To travel and discover new things!", speech: "Explore" },
        { emoji: "🌟", primary: "BRIGHT", meaning: "Bright • Shining with lots of light (-IGH says long I)", speech: "Bright" },
        { emoji: "📚", primary: "READ", meaning: "Read • Looking at words and stories (EA says long E)", speech: "Read" },
        { emoji: "🚢", primary: "SH — SHIP & SHELL", meaning: "Digraph 'SH' makes the quiet /shh/ sound!", speech: "S H makes the shh sound, like ship and shell!" },
        { emoji: "🚂", primary: "CH — CHOO & CHEESE", meaning: "Digraph 'CH' makes the train /ch/ sound!", speech: "C H makes the ch sound, like choo choo and cheese!" },
        { emoji: "🐋", primary: "WH — WHALE & WHERE", meaning: "Digraph 'WH' starts question words and whale!", speech: "W H makes the wh sound, like whale and where!" },
        { emoji: "👍", primary: "TH — THINK & THANK", meaning: "Digraph 'TH' sticks your tongue gently between your teeth!", speech: "T H makes the th sound, like think and thank!" },
        { emoji: "🎂", primary: "SILENT E — CAKE & BIKE", meaning: "Magic Silent 'E' at the end makes the vowel say its own name!", speech: "Magic Silent E makes the vowel say its own name, like cake and bike!" },
        { emoji: "☁️", primary: "OU — CLOUD & PROUD", meaning: "Vowel team 'OU' makes the /ow/ sound!", speech: "O U makes the ow sound, like cloud and proud!" },
        { emoji: "🌙", primary: "IGH — NIGHT & FLIGHT", meaning: "Trigraph 'IGH' makes the long /I/ sound!", speech: "I G H makes the long I sound, like night and flight!" },
        { emoji: "🌱", primary: "OW — GROW & SNOW", meaning: "Vowel team 'OW' at the end makes the long /O/ sound!", speech: "O W makes the long O sound, like grow and snow!" },
        { emoji: "🐝", primary: "EE — TREE & SLEEP", meaning: "Double 'EE' always says the long /E/ sound!", speech: "Double E makes the long E sound, like tree and sleep!" },
        { emoji: "⛵", primary: "OA — BOAT & COAT", meaning: "When two vowels go walking, the first one does the talking (/O/)!", speech: "O A makes the long O sound, like boat and coat!" },
        { emoji: "🌧️", primary: "AI — TRAIN & PAINT", meaning: "Vowel team 'AI' in the middle says the long /A/ sound!", speech: "A I makes the long A sound, like train and paint!" },
        { emoji: "🥄", primary: "OO — MOON & SPOON", meaning: "Double 'OO' makes the long /oo/ sound!", speech: "Double O makes the oo sound, like moon and spoon!" },
        { emoji: "🚗", primary: "AR — STAR & PARK", meaning: "Bossy 'R' with A ('AR') makes the pirate /ar/ sound!", speech: "A R makes the ar sound, like star and park!" },
        { emoji: "🌽", primary: "OR — CORN & STORM", meaning: "Bossy 'R' with O ('OR') makes the /or/ sound!", speech: "O R makes the or sound, like corn and storm!" },
        { emoji: "🐚", primary: "OY / OI — BOY & COIN", meaning: "Diphthongs 'OY' and 'OI' make the /oy/ sound!", speech: "O Y and O I make the oy sound, like boy and coin!" },
        { emoji: "👑", primary: "KN — KNIGHT & KNEE", meaning: "Silent 'K' before N: you only hear the /N/ sound!", speech: "In K N words like knight and knee, the K is silent!" },
        { emoji: "✍️", primary: "WR — WRITE & WRIST", meaning: "Silent 'W' before R: you only hear the /R/ sound!", speech: "In W R words like write and wrist, the W is silent!" }
      ]
    }
  };

  /* =====================================================================
     STATE, KID PROFILES & FIREBASE PERSISTENCE
     ===================================================================== */
  if (window.LuminaDB && typeof window.LuminaDB.init === 'function') {
    window.LuminaDB.init();
  }
  const appData = (window.LuminaDB && window.LuminaDB.state) || {};
  let selectedCalendarDateKey = (window.LuminaDB && typeof window.LuminaDB.getTodayDateKey === 'function')
    ? window.LuminaDB.getTodayDateKey()
    : new Date().toISOString().slice(0, 10);

  function activeProfile() {
    return (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : {};
  }

  function isTeenProfile(p) {
    return (p || activeProfile()).ageGroup !== 'kid';
  }

  function getQuestionSignature(item) {
    if (!item) return '';
    if (item.id) return item.id;
    if (!item.question) return '';
    const p = String(item.question.paragraph || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const q = String(item.question.question || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return `${item.domain || ''}::${p}::${q}`;
  }

  function getTeenQuestions(includeCompleted = false) {
    const p = activeProfile();
    const completed = new Set((p && p.completedQuestionIds) || []);
    const all = dedupeQuestionsList((appData.questions || []).filter(q => (q.targetProfile || 'teen') !== 'kid'));
    if (includeCompleted) return all;
    return all.filter(q => !completed.has(q.id) && !completed.has(getQuestionSignature(q)));
  }

  function getKidQuestionsByDomain(domainName, includeCompleted = false) {
    const p = activeProfile();
    const completed = new Set((p && p.completedQuestionIds) || []);
    let combined = (appData.questions || []).filter(q => q.targetProfile === 'kid' && q.domain === domainName);

    if (domainName === '6+ Spelling Bee' && typeof window.getGeneratedSpellingQuizQuestions === 'function') {
      combined = combined.concat(window.getGeneratedSpellingQuizQuestions());
    }
    if (domainName === '6+ Numbers & Math' && typeof window.getGeneratedMathQuestions === 'function') {
      combined = combined.concat(window.getGeneratedMathQuestions('all'));
    }

    let all = dedupeQuestionsList(combined);

    // Apply active Spelling Bee word-length filter in Multiple Choice Quiz mode too
    if (domainName === '6+ Spelling Bee' && window.spellingLengthFilter && window.spellingLengthFilter !== 'all') {
      const f = window.spellingLengthFilter;
      all = all.filter(q => {
        const correctChoice = q.question && q.question.choices && q.question.choices[q.question.correct_answer];
        const len = q.wordLength || (correctChoice ? String(correctChoice).replace(/[^A-Za-z]/g, '').length : 0);
        if (f === 'big') return len >= 7;
        return len === Number(f);
      });
    }

    // Apply active Numbers & Math operation filter (addition, subtraction, multiplication, division)
    if (domainName === '6+ Numbers & Math' && window.mathOpFilter && window.mathOpFilter !== 'all') {
      const op = window.mathOpFilter;
      all = all.filter(q => {
        if (q.mathOp) return q.mathOp === op;
        const txt = ((q.question && q.question.question) || '') + ' ' + ((q.question && q.question.paragraph) || '');
        if (op === 'addition') return txt.includes('+') || /add|more|sum|total|altogether/i.test(txt);
        if (op === 'subtraction') return txt.includes('-') || /minus|left|take away|flew away/i.test(txt);
        if (op === 'multiplication') return txt.includes('×') || /times|groups of/i.test(txt);
        if (op === 'division') return txt.includes('÷') || /divide|share.*equally/i.test(txt);
        return false;
      });
    }

    if (includeCompleted) return all;
    return all.filter(q => !completed.has(q.id) && !completed.has(getQuestionSignature(q)));
  }

  function saveState() {
    if (window.LuminaDB && typeof window.LuminaDB.saveLocal === 'function') {
      window.LuminaDB.saveLocal();
    }
  }

  // Deduplicate any question array by normalized paragraph+question or question+choiceA
  function dedupeQuestionsList(list) {
    const seen = new Set();
    return (list || []).filter(item => {
      if (!item || !item.question || !item.question.question) return false;
      const p = String(item.question.paragraph || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const q = String(item.question.question || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const a = String((item.question.choices && item.question.choices.A) || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const sig = (p && p !== 'null') ? `${p}::${q}` : `${q}::${a}`;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }

  // Non-repeating Fisher-Yates shuffled deck per category (prevents back-to-back or premature repeats!)
  const _shuffledDecks = {};
  function getNextFromDeck(deckKey, itemsArray, keyFn) {
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) return null;
    const seen = new Set();
    const unique = itemsArray.filter(it => {
      const k = keyFn ? keyFn(it) : JSON.stringify(it);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (unique.length === 1) return unique[0];

    let deck = _shuffledDecks[deckKey];
    if (!deck || deck.sourceLen !== unique.length || deck.queue.length === 0) {
      const lastKey = deck ? deck.lastKey : null;
      const indices = unique.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
      }
      if (lastKey !== null && indices.length > 1) {
        const firstItemKey = keyFn ? keyFn(unique[indices[0]]) : JSON.stringify(unique[indices[0]]);
        if (firstItemKey === lastKey) {
          const tmp = indices[0]; indices[0] = indices[indices.length - 1]; indices[indices.length - 1] = tmp;
        }
      }
      deck = { sourceLen: unique.length, queue: indices, lastKey: lastKey };
      _shuffledDecks[deckKey] = deck;
    }
    const nextIdx = deck.queue.shift();
    const chosen = unique[nextIdx];
    deck.lastKey = keyFn ? keyFn(chosen) : JSON.stringify(chosen);
    return chosen;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function showToast(message) {
    const t = document.createElement('div');
    t.className = "fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-fade";
    t.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  function mergeCustomKidCards() {
    (appData.customKidCards || []).forEach(card => {
      const cat = card.category && multiLangData[card.category] ? card.category : 'phonics';
      const exists = multiLangData[cat].kidItems.some(i => i.primary === card.primary);
      if (!exists) multiLangData[cat].kidItems.push(card);
    });
  }

  /**
   * Hydrates multiLangData from Firestore-synced / localStorage-cached language packs,
   * with seamless fallback to js/seed-data.js if not yet cached.
   */
  function mergeLanguagePacksFromDB() {
    const seedPacks = window.EXPANDED_LANGUAGE_PACKS || {};
    const dbPacks = (window.LuminaDB && window.LuminaDB.state && window.LuminaDB.state.languagePacks) || {};

    ['malayalam', 'hindi', 'spanish'].forEach(lang => {
      if (!multiLangData[lang]) return;
      const target = multiLangData[lang];
      if (!target.sentences) target.sentences = [];
      if (!target.kidItems) target.kidItems = [];
      if (!target.teenCards) target.teenCards = [];
      if (!target.teenQuiz) target.teenQuiz = [];
      if (!target.teenSentenceQuiz) target.teenSentenceQuiz = [];

      const seed = seedPacks[lang] || {};
      const db = dbPacks[lang] || {};

      // 1. Merge seed words & db words into kidItems
      [seed.words, db.words].forEach(wordsList => {
        if (Array.isArray(wordsList)) {
          wordsList.forEach(w => {
            const exists = target.kidItems.some(i => i.primary === w.primary);
            if (!exists) {
              target.kidItems.push({
                emoji: w.emoji || '📖',
                primary: w.primary,
                meaning: w.meaning,
                speech: w.speech || w.primary
              });
            }
          });
        }
      });

      // 2. Merge seed sentences & db sentences into sentences
      [seed.sentences, db.sentences].forEach(sentencesList => {
        if (Array.isArray(sentencesList)) {
          sentencesList.forEach(s => {
            const exists = target.sentences.some(i => i.script === s.script);
            if (!exists) {
              target.sentences.push({
                script: s.script,
                translit: s.translit || '',
                meaning: s.meaning,
                speech: s.speech || s.script
              });
            }
          });
        }
      });

      // 3. Merge words into teenCards
      [seed.words, db.words].forEach(wordsList => {
        if (Array.isArray(wordsList)) {
          wordsList.forEach(w => {
            const cleanScript = (w.primary || '').split('(')[0].trim();
            const translit = ((w.primary || '').match(/\(([^)]+)\)/) || ['', ''])[1];
            const exists = target.teenCards.some(i => i.script === cleanScript || i.script === w.primary);
            if (!exists && cleanScript) {
              target.teenCards.push({
                script: cleanScript,
                translit: translit,
                meaning: w.meaning,
                example: `${w.primary} — ${w.meaning}`
              });
            }
          });
        }
      });

      // 4. Merge vocabulary quiz items into teenQuiz
      [seed.words, db.words].forEach(wordsList => {
        if (Array.isArray(wordsList)) {
          wordsList.forEach(w => {
            const cleanScript = (w.primary || '').split('(')[0].trim();
            const translit = ((w.primary || '').match(/\(([^)]+)\)/) || ['', ''])[1];
            const qText = `What is the English meaning of '${cleanScript}${translit ? " (" + translit + ")" : ""}'?`;
            const exists = target.teenQuiz.some(q => q.q === qText);
            if (!exists && cleanScript) {
              const distractors = (seed.words || [])
                .filter(other => other.meaning !== w.meaning)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(other => other.meaning.split('/')[0].trim());
              if (distractors.length === 3) {
                const choices = [w.meaning.split('/')[0].trim(), ...distractors].sort(() => Math.random() - 0.5);
                const answerIdx = choices.indexOf(w.meaning.split('/')[0].trim());
                target.teenQuiz.push({
                  q: qText,
                  choices: choices,
                  answer: answerIdx
                });
              }
            }
          });
        }
      });

      // 5. Merge sentence quiz items into teenSentenceQuiz
      if (Array.isArray(target.sentences) && target.sentences.length >= 4) {
        target.sentences.forEach((s, idx) => {
          const qText1 = `What is the English meaning of: '${s.script}'?`;
          if (!target.teenSentenceQuiz.some(q => q.q === qText1)) {
            const distractors = target.sentences
              .filter((_, i) => i !== idx)
              .sort(() => Math.random() - 0.5)
              .slice(0, 3)
              .map(o => o.meaning);
            if (distractors.length === 3) {
              const choices = [s.meaning, ...distractors].sort(() => Math.random() - 0.5);
              target.teenSentenceQuiz.push({
                q: qText1,
                choices: choices,
                answer: choices.indexOf(s.meaning),
                script: s.script,
                translit: s.translit
              });
            }
          }

          const qText2 = `Which ${target.label.split(' ')[0]} sentence means: "${s.meaning}"?`;
          if (!target.teenSentenceQuiz.some(q => q.q === qText2)) {
            const distractors = target.sentences
              .filter((_, i) => i !== idx)
              .sort(() => Math.random() - 0.5)
              .slice(0, 3)
              .map(o => o.script);
            if (distractors.length === 3) {
              const choices = [s.script, ...distractors].sort(() => Math.random() - 0.5);
              target.teenSentenceQuiz.push({
                q: qText2,
                choices: choices,
                answer: choices.indexOf(s.script),
                script: s.script,
                translit: s.translit
              });
            }
          }
        });
      }
    });
  }

  async function manualCloudSync() {
    showToast("Syncing with Firebase Cloud Firestore...");
    if (window.LuminaDB) {
      await window.LuminaDB.pushToCloud();
      const res = await window.LuminaDB.pullFromCloud();
      if (res.ok) {
        showToast("Cloud sync complete!");
        mergeLanguagePacksFromDB();
        applyActiveProfileView();
      } else {
        showToast(res.error || "Saved locally on this device.");
      }
    }
  }

  function refreshHeaderUI() {
    const p = activeProfile();
    const streakEl = document.getElementById('headerStreakCount');
    if (streakEl && window.LuminaDB) streakEl.innerText = window.LuminaDB.getCurrentStreak(p);

    const xpEl = document.getElementById('headerXPCount');
    if (xpEl) xpEl.innerText = p.xp || 0;

    const qCount = getTeenQuestions().length;
    const totalQEl = document.getElementById('totalQuestionsCounter');
    if (totalQEl) totalQEl.innerText = qCount;

    const teenHeroQEl = document.getElementById('teenHeroQuestionCount');
    if (teenHeroQEl) teenHeroQEl.innerText = `${qCount} Questions Active`;

    const teenHeroGreetEl = document.getElementById('teenHeroGreeting');
    if (teenHeroGreetEl) teenHeroGreetEl.innerText = `Welcome back, ${p.name || 'Scholar'}! Ready to crush your SAT timing & language goals?`;

    renderCloudStatus();
    renderProfileSwitcher();
    renderTodayStrip();
    updateFamilyAuthUI();
  }

  function renderCloudStatus() {
    const map = {
      connected: ['bg-emerald-400', 'Firebase Connected'],
      syncing: ['bg-sky-400 animate-pulse', 'Syncing…'],
      error: ['bg-rose-500', 'Sync Issue'],
      local: ['bg-amber-400', 'Local Mode']
    };
    const [cls, label] = map[appData.cloudStatus] || map.local;
    const dot = document.getElementById('cloudStatusDot');
    const text = document.getElementById('cloudStatusText');
    const pill = document.getElementById('cloudStatusPill');
    if (dot) dot.className = `w-2 h-2 rounded-full ${cls}`;
    if (text) text.innerText = label;
    if (pill) pill.title = appData.cloudMessage || label;
  }

  function renderProfileSwitcher() {
    const container = document.getElementById('profileSwitcher');
    if (!container || !window.LuminaDB) return;
    const activeId = appData.activeProfileId;
    container.innerHTML = window.LuminaDB.getAllProfiles().map(p => {
      const active = p.id === activeId;
      const activeCls = p.ageGroup === 'kid' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-white text-indigo-950 shadow-xs';
      return `
        <button onclick="switchProfile('${p.id}')" class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${active ? activeCls : 'text-slate-600 hover:text-slate-900'}">
          <span class="text-sm">${escapeHtml(p.avatar)}</span>
          <span>${escapeHtml(p.name)}</span>
        </button>`;
    }).join('');
  }

  function renderTodayStrip() {
    const container = document.getElementById('todayProgressStrip');
    if (!container || !window.LuminaDB) return;
    const p = activeProfile();
    const days = window.LuminaDB.getLastNDaysSummary(p.id, 7);
    const today = days[days.length - 1];
    const mins = Math.floor((today.secondsSpent || 0) / 60);
    const qPct = Math.min(100, Math.round((today.questionsAttempted / (p.dailyGoalQuestions || 10)) * 100));
    const mPct = Math.min(100, Math.round((mins / (p.dailyGoalMinutes || 15)) * 100));
    const acc = today.questionsAttempted ? Math.round((today.questionsCorrect / today.questionsAttempted) * 100) : null;
    const goalMet = qPct >= 100 && mPct >= 100;
    const kid = p.ageGroup === 'kid';
    const maxQ = Math.max(1, ...days.map(d => d.questionsAttempted));

    container.innerHTML = `
      <div class="bg-white rounded-3xl border ${kid ? 'border-amber-200' : 'border-slate-200/80'} shadow-bento p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div class="md:col-span-4 flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl ${kid ? 'bg-amber-100' : 'bg-indigo-50'} flex items-center justify-center text-2xl shrink-0">${escapeHtml(p.avatar)}</div>
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">${escapeHtml(p.name)}'s Daily Activity Goal</p>
            <p class="font-extrabold text-slate-900 leading-tight">${goalMet ? '🏆 All daily goals completed!' : `Keep going, ${escapeHtml(p.name)}!`}</p>
            <p class="text-[11px] text-slate-500 font-semibold">${acc === null ? 'No questions answered yet today' : `Accuracy today: ${acc}% (${today.questionsCorrect}/${today.questionsAttempted})`} • ⚡ +${today.xpEarned || 0} XP today</p>
          </div>
        </div>
        <div class="md:col-span-3">
          <div class="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>📝 Questions Goal</span><span class="font-mono">${today.questionsAttempted} / ${p.dailyGoalQuestions || 10}</span></div>
          <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-indigo-500 transition-all" style="width:${qPct}%"></div></div>
        </div>
        <div class="md:col-span-3">
          <div class="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>⏱️ Active Time Goal</span><span class="font-mono">${mins} / ${p.dailyGoalMinutes || 15} min</span></div>
          <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-emerald-500 transition-all" style="width:${mPct}%"></div></div>
        </div>
        <div class="md:col-span-2 flex items-end justify-between gap-1 h-12" title="Questions answered over the last 7 days">
          ${days.map(d => `
            <div class="flex-1 flex flex-col items-center gap-0.5" title="${d.label}: ${d.questionsAttempted} questions">
              <div class="w-full rounded-md ${d.isToday ? 'bg-indigo-600' : (d.questionsAttempted > 0 ? 'bg-indigo-300' : 'bg-slate-200')}" style="height:${Math.max(4, Math.round((d.questionsAttempted / maxQ) * 32))}px"></div>
              <span class="text-[9px] font-bold text-slate-400">${d.shortDay.slice(0, 2)}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function trackActivity(opts) {
    const p = activeProfile();
    const before = window.LuminaDB.getLastNDaysSummary(p.id, 1)[0].questionsAttempted;
    window.LuminaDB.recordActivity(opts);
    if (opts.questionId && opts.isCorrect && window.LuminaDB && typeof window.LuminaDB.markQuestionCompleted === 'function') {
      window.LuminaDB.markQuestionCompleted(p.id, opts.questionId);
    }
    const after = window.LuminaDB.getLastNDaysSummary(p.id, 1)[0].questionsAttempted;
    if (before < (p.dailyGoalQuestions || 10) && after >= (p.dailyGoalQuestions || 10)) {
      setTimeout(() => {
        if (typeof window.confetti === 'function') {
          window.confetti({ particleCount: 160, spread: 100, origin: { y: 0.5 } });
        }
        showToast(`🏆 Daily goal reached, ${p.name}! ${p.dailyGoalQuestions} questions done today!`);
      }, 700);
    }
    refreshHeaderUI();
  }

  // Active study time heartbeat (adds 15s every 15s while child is actively interacting)
  let lastInteractionAt = Date.now();
  let pickerOpen = false;
  ['click', 'keydown', 'touchstart', 'scroll'].forEach(evt =>
    window.addEventListener(evt, () => { lastInteractionAt = Date.now(); }, { passive: true })
  );
  setInterval(() => {
    const recentlyActive = Date.now() - lastInteractionAt < 90000;
    if (document.visibilityState === 'visible' && recentlyActive && !pickerOpen) {
      if (window.LuminaDB) window.LuminaDB.addStudySeconds(15);
    }
  }, 15000);

  function showProfilePicker() {
    if (!window.LuminaDB || !window.LuminaDB.getCurrentUser || !window.LuminaDB.getCurrentUser()) {
      updateFamilyAuthUI();
      return;
    }
    pickerOpen = true;
    const grid = document.getElementById('profilePickerGrid');
    if (!grid || !window.LuminaDB) return;
    grid.innerHTML = window.LuminaDB.getAllProfiles().map(p => {
      const today = window.LuminaDB.getLastNDaysSummary(p.id, 1)[0];
      return `
        <button onclick="switchProfile('${p.id}')" class="p-6 rounded-3xl border-4 ${p.ageGroup === 'kid' ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'} btn-tactile transition flex flex-col items-center gap-2">
          <span class="text-6xl">${escapeHtml(p.avatar)}</span>
          <span class="font-extrabold text-xl text-slate-900 font-kids">${escapeHtml(p.name)}</span>
          <span class="text-xs font-bold text-slate-600">${escapeHtml(p.ageLabel || '')}</span>
          <span class="text-xs font-bold px-3 py-1 rounded-full bg-white/80 text-slate-700 mt-1">
            🔥 ${window.LuminaDB.getCurrentStreak(p)}d streak • 📝 ${today.questionsAttempted}/${p.dailyGoalQuestions} today
          </span>
        </button>
      `;
    }).join('');
    document.getElementById('profilePickerOverlay').classList.remove('hidden');
  }

  function hideProfilePicker() {
    pickerOpen = false;
    const overlay = document.getElementById('profilePickerOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function switchProfile(profileId) {
    if (window.LuminaDB) {
      window.LuminaDB.setActiveProfile(profileId);
      selectedCalendarDateKey = window.LuminaDB.getTodayDateKey();
    }
    Object.keys(_shuffledDecks).forEach(k => delete _shuffledDecks[k]);
    hideProfilePicker();
    applyActiveProfileView();
  }

  function resetTopicQuestions(domain) {
    const p = activeProfile();
    if (p && window.LuminaDB && typeof window.LuminaDB.resetCompletedQuestions === 'function') {
      window.LuminaDB.resetCompletedQuestions(p.id, domain);
    }
    Object.keys(_shuffledDecks).forEach(k => delete _shuffledDecks[k]);
    if (typeof window.showToast === 'function') {
      window.showToast(`Reset questions for ${domain === 'ALL' ? 'all topics' : domain}!`);
    }
    if (typeof window.populateDomainFilterDropdown === 'function') {
      window.populateDomainFilterDropdown();
    }
    refreshHeaderUI();
  }
  window.resetTopicQuestions = resetTopicQuestions;

  function applyActiveProfileView() {
    const p = activeProfile();
    const badge = document.getElementById('activeModeBadge');

    ['section-teen-dashboard', 'section-teen-sat', 'section-languages', 'section-kid-playground', 'section-parent-admin']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });

    if (isTeenProfile(p)) {
      if (badge) {
        badge.className = "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60";
        badge.innerText = `${p.avatar || '🎓'} ${p.name || 'Scholar'} (${p.ageLabel || 'Teen Scholar'})`;
      }
      const appBody = document.getElementById('appBody');
      if (appBody) appBody.className = "bg-[#F8FAFC] text-slate-900 min-h-screen flex flex-col font-sans transition-colors duration-300";
      if (typeof window.openTeenTab === 'function') {
        window.openTeenTab(appData.teenSubTab || 'dashboard');
      }
    } else {
      if (typeof window.stopSatTimer === 'function') window.stopSatTimer();
      if (badge) {
        badge.className = "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300";
        badge.innerText = `${p.avatar || '🌟'} ${p.name || 'Explorer'} (${p.ageLabel || 'Little Explorer'})`;
      }
      const appBody = document.getElementById('appBody');
      if (appBody) appBody.className = "bg-[#FFFBEB] text-slate-900 min-h-screen flex flex-col font-kids transition-colors duration-300";
      const kidSec = document.getElementById('section-kid-playground');
      if (kidSec) kidSec.classList.remove('hidden');
      renderSubNavForKid();
      if (typeof window.initKidPlayground === 'function') {
        window.initKidPlayground();
      }
    }

    refreshHeaderUI();
    refreshStudentXPBadges();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function renderSubNavForKid() {
    const container = document.getElementById('subNavTabs');
    if (!container) return;
    const currentTab = window.kidViewTab || 'practice';
    const isPractice = currentTab === 'practice';
    const isFlash = currentTab === 'flashcards';

    const practiceCls = isPractice
      ? "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition bg-amber-400 text-slate-950 border border-amber-500 shadow-xs"
      : "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition text-slate-700 hover:text-slate-950 hover:bg-slate-100";

    const flashCls = isFlash
      ? "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition bg-amber-400 text-slate-950 border border-amber-500 shadow-xs"
      : "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition text-slate-700 hover:text-slate-950 hover:bg-slate-100";

    container.innerHTML = `
      <div class="flex items-center gap-2">
        <button onclick="setKidViewTab('practice')" class="${practiceCls}">
          <span>🎮</span>
          <span>Practice &amp; Quizzes</span>
        </button>
        <button onclick="setKidViewTab('flashcards')" class="${flashCls}">
          <span>🃏</span>
          <span>Study Flashcards &amp; Deck</span>
        </button>
      </div>
      <button onclick="openParentAdminPortal()" class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition ml-auto">
        <span>⚙️</span>
        <span>Parent Portal</span>
      </button>
    `;
  }

  let authModalManuallyOpened = false;

  function setProtectedContentVisible(isVisible) {
    ['mainAppContent', 'profileQuickBar', 'todayGoalSection', 'subNavBar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', !isVisible);
    });
    const mainFallback = document.querySelector('main');
    if (mainFallback) mainFallback.classList.toggle('hidden', !isVisible);
    if (!isVisible) {
      hideProfilePicker();
      if (typeof window.stopSatTimer === 'function') window.stopSatTimer();
    }
  }

  function updateFamilyAuthUI() {
    const user = (window.LuminaDB && typeof window.LuminaDB.getCurrentUser === 'function')
      ? window.LuminaDB.getCurrentUser()
      : null;
    const textEl = document.getElementById('familyAuthText');
    const iconEl = document.getElementById('familyAuthIcon');
    const pill = document.getElementById('familyAuthPill');
    const userEmailEl = document.getElementById('familyAuthUserEmail');
    const loggedInView = document.getElementById('familyLoggedInView');
    const loginForm = document.getElementById('familyLoginForm');
    const modal = document.getElementById('familyAuthModal');
    const titleEl = document.getElementById('familyAuthTitle');

    if (user) {
      setProtectedContentVisible(true);
      if (modal && !authModalManuallyOpened) {
        modal.classList.add('hidden');
      }
      if (titleEl) titleEl.innerText = 'Account Status';
      if (textEl) textEl.innerText = user.email ? (user.email.split('@')[0]) : 'Signed In';
      if (iconEl) iconEl.setAttribute('data-lucide', 'shield-check');
      if (pill) {
        pill.className = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition border border-emerald-200 cursor-pointer";
        pill.title = `Signed in as ${user.email}. Click to view or sign out.`;
      }
      if (userEmailEl) userEmailEl.innerText = user.email || 'Authenticated User';
      if (loggedInView) loggedInView.classList.remove('hidden');
      if (loginForm) loginForm.classList.add('hidden');
    } else {
      authModalManuallyOpened = false;
      setProtectedContentVisible(false);
      if (modal) modal.classList.remove('hidden');
      if (titleEl) titleEl.innerText = 'Sign In Required';
      if (textEl) textEl.innerText = 'Sign In';
      if (iconEl) iconEl.setAttribute('data-lucide', 'lock');
      if (pill) {
        pill.className = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer";
        pill.title = "Sign in required to access Lumina Learning Hub";
      }
      if (loggedInView) loggedInView.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function toggleFamilyAuthModal() {
    const modal = document.getElementById('familyAuthModal');
    if (!modal) return;
    const user = (window.LuminaDB && typeof window.LuminaDB.getCurrentUser === 'function')
      ? window.LuminaDB.getCurrentUser()
      : null;
    if (!user) {
      updateFamilyAuthUI();
      modal.classList.remove('hidden');
      return;
    }
    const willOpen = modal.classList.contains('hidden');
    authModalManuallyOpened = willOpen;
    updateFamilyAuthUI();
    modal.classList.toggle('hidden', !willOpen);
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  async function handleFamilyLoginSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const emailEl = document.getElementById('familyEmailInput');
    const passEl = document.getElementById('familyPasswordInput');
    const errBox = document.getElementById('familyAuthError');
    const btn = document.getElementById('btnFamilySignIn');

    const email = (emailEl && emailEl.value || '').trim();
    const pass = (passEl && passEl.value || '');
    if (!email || !pass) {
      if (errBox) {
        errBox.innerText = 'Please enter both email and password.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Signing in...';
    }
    if (errBox) errBox.classList.add('hidden');

    if (window.LuminaDB && typeof window.LuminaDB.signIn === 'function') {
      const res = await window.LuminaDB.signIn(email, pass);
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Sign In to Unlock Hub';
      }
      if (res && res.ok) {
        authModalManuallyOpened = false;
        updateFamilyAuthUI();
        applyActiveProfileView();
        if (typeof showToast === 'function') showToast(`Signed in as ${email}!`);
        if (typeof window.LuminaDB.pullFromCloud === 'function') {
          const pullRes = await window.LuminaDB.pullFromCloud();
          if (pullRes && pullRes.ok) {
            mergeLanguagePacksFromDB();
            mergeCustomKidCards();
            applyActiveProfileView();
          }
        }
      } else {
        if (errBox) {
          errBox.innerText = (res && res.error) || 'Failed to sign in. Please verify your credentials.';
          errBox.classList.remove('hidden');
        }
      }
    }
  }

  async function handleFamilySignOut() {
    if (window.LuminaDB && typeof window.LuminaDB.signOut === 'function') {
      await window.LuminaDB.signOut();
      authModalManuallyOpened = false;
      updateFamilyAuthUI();
      if (typeof showToast === 'function') showToast('Signed out. Sign in to access Lumina Learning Hub.');
    }
  }

  /* =====================================================================
     PARENT & ADMIN PORTAL CONTROLLER
     ===================================================================== */
  let adminActiveStudentId = null;

  function openParentAdminPortal() {
    const user = (window.LuminaDB && typeof window.LuminaDB.getCurrentUser === 'function')
      ? window.LuminaDB.getCurrentUser()
      : null;
    if (!user) {
      if (typeof window.showToast === 'function') {
        window.showToast("Please sign in with your family account to access the Parent Portal.");
      }
      toggleFamilyAuthModal();
      return;
    }

    if (typeof window.stopSatTimer === 'function') window.stopSatTimer();

    ['section-teen-dashboard', 'section-teen-sat', 'section-languages', 'section-kid-playground']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });

    const adminSec = document.getElementById('section-parent-admin');
    if (adminSec) adminSec.classList.remove('hidden');

    const badge = document.getElementById('activeModeBadge');
    if (badge) {
      badge.className = "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-slate-700";
      badge.innerText = '⚙️ Parent Admin Portal';
    }

    const appBody = document.getElementById('appBody');
    if (appBody) appBody.className = "bg-[#F8FAFC] text-slate-900 min-h-screen flex flex-col font-sans transition-colors duration-300";

    const allProfiles = (window.LuminaDB && typeof window.LuminaDB.getAllProfiles === 'function')
      ? window.LuminaDB.getAllProfiles()
      : [];
    if (!adminActiveStudentId && allProfiles.length > 0) {
      const active = activeProfile();
      adminActiveStudentId = (active && active.id) || allProfiles[0].id;
    }

    renderAdminPortal();
    updateAdminDomainDropdown();

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeParentAdminPortal() {
    const adminSec = document.getElementById('section-parent-admin');
    if (adminSec) adminSec.classList.add('hidden');
    applyActiveProfileView();
  }

  function selectAdminStudent(pid) {
    adminActiveStudentId = pid;
    renderAdminPortal();
  }

  function getStudentTrackProgressList(pid) {
    const p = (window.LuminaDB && typeof window.LuminaDB.getProfileById === 'function')
      ? window.LuminaDB.getProfileById(pid)
      : null;
    if (!p) return [];
    const completed = new Set((p && p.completedQuestionIds) || []);

    const tracks = [];

    // 1. Spelling Bee
    const allSpelling = (typeof window.getAllSpellingItems === 'function')
      ? window.getAllSpellingItems()
      : [];
    const spellingDone = allSpelling.filter(i => completed.has('spelling_' + ((i.word || i.primary || '').replace(/[^A-Za-z]/g, '').toUpperCase()))).length;
    tracks.push({
      key: 'spelling',
      domain: '6+ Spelling Bee',
      title: '🐝 6+ Spelling Bee',
      category: 'Spelling & Vocabulary',
      targetProfile: 'kid',
      total: allSpelling.length || 200,
      completedCount: spellingDone,
      percent: Math.min(100, Math.round(((spellingDone) / (allSpelling.length || 1)) * 100)),
      isCompleted: spellingDone >= (allSpelling.length || 1) && allSpelling.length > 0
    });

    // 2. Math - Addition
    const addDone = Array.from(completed).filter(id => id.startsWith('kid_math_addition_')).length;
    tracks.push({
      key: 'math_addition',
      domain: '6+ Numbers & Math',
      title: '➕ Numbers & Math — Addition',
      category: 'Math',
      targetProfile: 'kid',
      total: 25,
      completedCount: Math.min(25, addDone),
      percent: Math.min(100, Math.round((Math.min(25, addDone) / 25) * 100)),
      isCompleted: addDone >= 25
    });

    // 3. Math - Subtraction
    const subDone = Array.from(completed).filter(id => id.startsWith('kid_math_subtraction_')).length;
    tracks.push({
      key: 'math_subtraction',
      domain: '6+ Numbers & Math',
      title: '➖ Numbers & Math — Subtraction',
      category: 'Math',
      targetProfile: 'kid',
      total: 25,
      completedCount: Math.min(25, subDone),
      percent: Math.min(100, Math.round((Math.min(25, subDone) / 25) * 100)),
      isCompleted: subDone >= 25
    });

    // 4. Math - Multiplication
    const mulDone = Array.from(completed).filter(id => id.startsWith('kid_math_multiplication_')).length;
    tracks.push({
      key: 'math_multiplication',
      domain: '6+ Numbers & Math',
      title: '✖️ Numbers & Math — Multiplication',
      category: 'Math',
      targetProfile: 'kid',
      total: 25,
      completedCount: Math.min(25, mulDone),
      percent: Math.min(100, Math.round((Math.min(25, mulDone) / 25) * 100)),
      isCompleted: mulDone >= 25
    });

    // 5. Math - Division
    const divDone = Array.from(completed).filter(id => id.startsWith('kid_math_division_')).length;
    tracks.push({
      key: 'math_division',
      domain: '6+ Numbers & Math',
      title: '➗ Numbers & Math — Division',
      category: 'Math',
      targetProfile: 'kid',
      total: 25,
      completedCount: Math.min(25, divDone),
      percent: Math.min(100, Math.round((Math.min(25, divDone) / 25) * 100)),
      isCompleted: divDone >= 25
    });

    // 6. Story Reading & Comprehension
    const compQs = (appData.questions || []).filter(q => q.domain === '6+ Story Reading & Comprehension');
    const compDone = compQs.filter(q => completed.has(q.id) || completed.has(getQuestionSignature(q))).length;
    const compTotal = compQs.length || 10;
    tracks.push({
      key: '6+ Story Reading & Comprehension',
      domain: '6+ Story Reading & Comprehension',
      title: '📖 6+ Story Reading & Comprehension',
      category: 'Reading',
      targetProfile: 'kid',
      total: compTotal,
      completedCount: compDone,
      percent: Math.min(100, Math.round((compDone / compTotal) * 100)),
      isCompleted: compDone >= compTotal && compTotal > 0
    });

    // 7. Grammar & Sentence Building
    const gramQs = (appData.questions || []).filter(q => q.domain === '6+ Grammar & Sentence Building');
    const gramDone = gramQs.filter(q => completed.has(q.id) || completed.has(getQuestionSignature(q))).length;
    const gramTotal = gramQs.length || 10;
    tracks.push({
      key: '6+ Grammar & Sentence Building',
      domain: '6+ Grammar & Sentence Building',
      title: '✏️ 6+ Grammar & Sentences',
      category: 'Grammar',
      targetProfile: 'kid',
      total: gramTotal,
      completedCount: gramDone,
      percent: Math.min(100, Math.round((gramDone / gramTotal) * 100)),
      isCompleted: gramDone >= gramTotal && gramTotal > 0
    });

    // 8. Sight Words & Phonics
    const phonicsItems = (window.multiLangData && window.multiLangData.phonics && window.multiLangData.phonics.kidItems) || [];
    const phonicsDone = phonicsItems.filter(i => completed.has('kid_match_phonics_words_' + i.primary) || completed.has('kid_match_phonics_' + i.primary)).length;
    tracks.push({
      key: 'phonics',
      domain: 'Sight Words & Phonics',
      title: '🔤 Sight Words & Phonics',
      category: 'Phonics',
      targetProfile: 'kid',
      total: phonicsItems.length || 20,
      completedCount: phonicsDone,
      percent: Math.min(100, Math.round((phonicsDone / (phonicsItems.length || 1)) * 100)),
      isCompleted: phonicsDone >= (phonicsItems.length || 1) && phonicsItems.length > 0
    });

    // 9. Animals & Science
    const animalItems = (window.multiLangData && window.multiLangData.animals && window.multiLangData.animals.kidItems) || [];
    const animalDone = animalItems.filter(i => completed.has('kid_match_animals_words_' + i.primary) || completed.has('kid_match_animals_' + i.primary)).length;
    tracks.push({
      key: 'animals',
      domain: 'Animals & Science',
      title: '🦁 Animals & Science Facts',
      category: 'Science',
      targetProfile: 'kid',
      total: animalItems.length || 20,
      completedCount: animalDone,
      percent: Math.min(100, Math.round((animalDone / (animalItems.length || 1)) * 100)),
      isCompleted: animalDone >= (animalItems.length || 1) && animalItems.length > 0
    });

    // 10. Malayalam Track
    const malPack = window.multiLangData && window.multiLangData.malayalam;
    const malTotal = ((malPack && malPack.letters ? malPack.letters.length : 0) + (malPack && malPack.kidItems ? malPack.kidItems.length : 0) + (malPack && malPack.sentences ? malPack.sentences.length : 0)) || 50;
    const malDone = Array.from(completed).filter(id => id.startsWith('kid_match_malayalam_')).length;
    tracks.push({
      key: 'malayalam',
      domain: 'Malayalam Language Pack',
      title: '🌴 Malayalam Track',
      category: 'Languages',
      targetProfile: 'kid',
      total: malTotal,
      completedCount: Math.min(malTotal, malDone),
      percent: Math.min(100, Math.round((Math.min(malTotal, malDone) / malTotal) * 100)),
      isCompleted: malDone >= malTotal && malTotal > 0
    });

    // 11. Hindi Track
    const hinPack = window.multiLangData && window.multiLangData.hindi;
    const hinTotal = ((hinPack && hinPack.letters ? hinPack.letters.length : 0) + (hinPack && hinPack.kidItems ? hinPack.kidItems.length : 0) + (hinPack && hinPack.sentences ? hinPack.sentences.length : 0)) || 50;
    const hinDone = Array.from(completed).filter(id => id.startsWith('kid_match_hindi_')).length;
    tracks.push({
      key: 'hindi',
      domain: 'Hindi Language Pack',
      title: '🪔 Hindi Track',
      category: 'Languages',
      targetProfile: 'kid',
      total: hinTotal,
      completedCount: Math.min(hinTotal, hinDone),
      percent: Math.min(100, Math.round((Math.min(hinTotal, hinDone) / hinTotal) * 100)),
      isCompleted: hinDone >= hinTotal && hinTotal > 0
    });

    // 12. Spanish Track
    const espPack = window.multiLangData && window.multiLangData.spanish;
    const espTotal = ((espPack && espPack.kidItems ? espPack.kidItems.length : 0) + (espPack && espPack.sentences ? espPack.sentences.length : 0)) || 40;
    const espDone = Array.from(completed).filter(id => id.startsWith('kid_match_spanish_')).length;
    tracks.push({
      key: 'spanish',
      domain: 'Spanish Language Pack',
      title: '🇪🇸 Spanish Track',
      category: 'Languages',
      targetProfile: 'kid',
      total: espTotal,
      completedCount: Math.min(espTotal, espDone),
      percent: Math.min(100, Math.round((Math.min(espTotal, espDone) / espTotal) * 100)),
      isCompleted: espDone >= espTotal && espTotal > 0
    });

    // 13. SAT Bluebook Reading & Writing
    const satRwQs = (appData.questions || []).filter(q => (q.targetProfile || 'teen') !== 'kid' && (q.domain.includes('Reading') || q.domain.includes('Writing') || q.domain.includes('Ideas')));
    const satRwDone = satRwQs.filter(q => completed.has(q.id) || completed.has(getQuestionSignature(q))).length;
    const satRwTotal = satRwQs.length || 30;
    tracks.push({
      key: 'sat_reading_writing',
      domain: 'Information & Ideas',
      title: '🎓 13+ SAT Reading & Writing',
      category: 'SAT Bluebook',
      targetProfile: 'teen',
      total: satRwTotal,
      completedCount: satRwDone,
      percent: Math.min(100, Math.round((satRwDone / satRwTotal) * 100)),
      isCompleted: satRwDone >= satRwTotal && satRwTotal > 0
    });

    // 14. SAT Bluebook Math
    const satMathQs = (appData.questions || []).filter(q => (q.targetProfile || 'teen') !== 'kid' && (q.domain.includes('Math') || q.domain.includes('Algebra') || q.domain.includes('Advanced')));
    const satMathDone = satMathQs.filter(q => completed.has(q.id) || completed.has(getQuestionSignature(q))).length;
    const satMathTotal = satMathQs.length || 20;
    tracks.push({
      key: 'sat_math',
      domain: 'Algebra',
      title: '📐 13+ SAT Math',
      category: 'SAT Bluebook',
      targetProfile: 'teen',
      total: satMathTotal,
      completedCount: satMathDone,
      percent: Math.min(100, Math.round((satMathDone / satMathTotal) * 100)),
      isCompleted: satMathDone >= satMathTotal && satMathTotal > 0
    });

    return tracks;
  }

  function renderAdminPortal() {
    const allProfiles = (window.LuminaDB && typeof window.LuminaDB.getAllProfiles === 'function')
      ? window.LuminaDB.getAllProfiles()
      : [];
    if (!adminActiveStudentId && allProfiles.length > 0) {
      adminActiveStudentId = allProfiles[0].id;
    }
    const student = allProfiles.find(p => p.id === adminActiveStudentId) || allProfiles[0];
    if (!student) return;

    // 1. Student Pills Bar
    const pillsBar = document.getElementById('adminStudentPillsBar');
    if (pillsBar) {
      pillsBar.innerHTML = allProfiles.map(p => {
        const active = p.id === student.id;
        const tracks = getStudentTrackProgressList(p.id);
        const finishedCount = tracks.filter(t => t.isCompleted).length;
        const cls = active
          ? "px-4 py-2 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs shadow-md border-2 border-indigo-700 flex items-center gap-2 transition btn-tactile"
          : "px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-2 transition btn-tactile";
        return `
          <button onclick="selectAdminStudent('${p.id}')" class="${cls}">
            <span class="text-base">${p.avatar || '👤'}</span>
            <span>${escapeHtml(p.name || 'Student')}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'}">${finishedCount} completed</span>
          </button>
        `;
      }).join('');
    }

    // Top Student Name & Reset All button
    const studentNameEl = document.getElementById('adminActiveStudentName');
    if (studentNameEl) studentNameEl.innerText = `${student.avatar || ''} ${student.name || 'Student'}`;

    const resetAllBox = document.getElementById('adminStudentResetAllBtnContainer');
    if (resetAllBox) {
      resetAllBox.innerHTML = `
        <button onclick="resetStudentAllCompletedAreas('${student.id}')" class="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 shadow-xs flex items-center gap-1.5 transition btn-tactile">
          <span>🔄</span>
          <span>Reset All Completed Tracks</span>
        </button>
      `;
    }

    // 2. Completed Areas Highlight Section
    const tracks = getStudentTrackProgressList(student.id);
    const completedTracks = tracks.filter(t => t.isCompleted);
    const completedGrid = document.getElementById('adminCompletedAreasGrid');
    const badgeEl = document.getElementById('adminCompletedAreasCountBadge');

    if (badgeEl) {
      badgeEl.innerHTML = `
        <span class="px-3 py-1 rounded-full text-xs font-black ${completedTracks.length > 0 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-100 text-slate-600'}">
          ${completedTracks.length} of ${tracks.length} Tracks Finished
        </span>
      `;
    }

    if (completedGrid) {
      if (completedTracks.length === 0) {
        completedGrid.className = "col-span-full py-8 text-center text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200";
        completedGrid.innerHTML = `
          <div class="text-4xl mb-2">🌱</div>
          <p class="text-sm font-bold text-slate-700">${escapeHtml(student.name || 'Student')} has not completely finished any full track yet.</p>
          <p class="text-xs text-slate-500 mt-1">As questions and matching cards are completed, finished tracks will appear right here with one-click question expansion!</p>
        `;
      } else {
        completedGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";
        completedGrid.innerHTML = completedTracks.map(t => `
          <div class="p-5 rounded-3xl bg-gradient-to-br from-emerald-50/90 to-teal-50/60 border-2 border-emerald-300 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-950 font-black text-[10px] uppercase tracking-wider">
                  ✓ 100% Completed
                </span>
                <span class="text-xs font-extrabold text-emerald-900">${t.completedCount} / ${t.total} Done</span>
              </div>
              <h4 class="text-base font-black text-slate-900">${escapeHtml(t.title)}</h4>
              <p class="text-xs font-semibold text-emerald-800 mt-1">Student has answered all questions in this track! Ready for new questions.</p>
            </div>
            <div class="mt-4 pt-3 border-t border-emerald-200/70 flex flex-wrap items-center gap-2">
              <button onclick="prefillAdminQuestionCreator('${escapeHtml(t.domain)}', '${t.targetProfile}')" class="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition btn-tactile">
                <span>➕</span>
                <span>Add Questions to This Track</span>
              </button>
              <button onclick="resetStudentArea('${student.id}', '${t.key}')" class="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 transition btn-tactile">
                <span>🔄 Reset</span>
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    // 3. All Curriculum Tracks Grid
    const allTracksGrid = document.getElementById('adminAllTracksGrid');
    if (allTracksGrid) {
      const overallSum = tracks.reduce((acc, t) => acc + t.completedCount, 0);
      const overallTotal = tracks.reduce((acc, t) => acc + t.total, 0);
      const overallPct = overallTotal ? Math.round((overallSum / overallTotal) * 100) : 0;

      const pctEl = document.getElementById('adminStudentOverallProgressText');
      if (pctEl) pctEl.innerText = `${overallPct}% (${overallSum} / ${overallTotal} items)`;

      allTracksGrid.innerHTML = tracks.map(t => {
        const isDone = t.isCompleted;
        const barColor = isDone ? 'bg-emerald-500' : (t.percent > 0 ? 'bg-indigo-600' : 'bg-slate-300');
        return `
          <div class="p-4 rounded-2xl bg-white border ${isDone ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'} shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-1 mb-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${escapeHtml(t.category)}</span>
                <span class="text-xs font-black ${isDone ? 'text-emerald-700' : 'text-slate-700'}">${t.completedCount} / ${t.total} (${t.percent}%)</span>
              </div>
              <h5 class="text-sm font-extrabold text-slate-900 leading-snug">${escapeHtml(t.title)}</h5>
              
              <!-- Progress Bar -->
              <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden my-2.5">
                <div class="h-full rounded-full transition-all duration-500 ${barColor}" style="width: ${t.percent}%"></div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <button onclick="prefillAdminQuestionCreator('${escapeHtml(t.domain)}', '${t.targetProfile}')" class="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition flex items-center gap-1">
                <span>➕ Add Q</span>
              </button>
              <button onclick="resetStudentArea('${student.id}', '${t.key}')" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold transition" title="Reset this section for ${escapeHtml(student.name)}">
                <span>🔄 Reset</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // 4. Render Section XP Multipliers Grid
    renderAdminSectionXPGrid();
  }

  function resetStudentArea(pid, trackKey) {
    const student = (window.LuminaDB && typeof window.LuminaDB.getProfileById === 'function')
      ? window.LuminaDB.getProfileById(pid)
      : null;
    const name = student ? student.name : 'Student';
    if (window.LuminaDB && typeof window.LuminaDB.resetCompletedQuestions === 'function') {
      window.LuminaDB.resetCompletedQuestions(pid, trackKey);
    }
    if (typeof window.showToast === 'function') {
      window.showToast(`Reset track "${trackKey}" for ${name}! Ready for practice.`);
    }
    renderAdminPortal();
    refreshHeaderUI();
  }

  function resetStudentAllCompletedAreas(pid) {
    const student = (window.LuminaDB && typeof window.LuminaDB.getProfileById === 'function')
      ? window.LuminaDB.getProfileById(pid)
      : null;
    const name = student ? student.name : 'Student';
    if (window.LuminaDB && typeof window.LuminaDB.resetCompletedQuestions === 'function') {
      window.LuminaDB.resetCompletedQuestions(pid, 'ALL');
    }
    if (typeof window.showToast === 'function') {
      window.showToast(`Reset all completed tracks for ${name}! Ready for a clean start.`);
    }
    renderAdminPortal();
    refreshHeaderUI();
  }

  function updateAdminDomainDropdown(selectedDomain) {
    const profileSelect = document.getElementById('adminNewQProfile');
    const domainSelect = document.getElementById('adminNewQDomain');
    if (!profileSelect || !domainSelect) return;

    const isKid = profileSelect.value === 'kid';
    const kidDomains = [
      '6+ Numbers & Math',
      '6+ Spelling Bee',
      '6+ Story Reading & Comprehension',
      '6+ Grammar & Sentence Building',
      'Sight Words & Phonics',
      'Animals & Science',
      'Malayalam Language Pack',
      'Hindi Language Pack',
      'Spanish Language Pack'
    ];
    const teenDomains = [
      'Information & Ideas',
      'Craft & Structure',
      'Expression of Ideas',
      'Standard English Conventions',
      'Algebra',
      'Advanced Math',
      'Problem-Solving & Data Analysis',
      'Geometry & Trigonometry',
      'Malayalam Language Pack',
      'Hindi Language Pack',
      'Spanish Language Pack'
    ];

    const list = isKid ? kidDomains : teenDomains;
    domainSelect.innerHTML = list.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    if (selectedDomain && list.includes(selectedDomain)) {
      domainSelect.value = selectedDomain;
    }
  }

  function prefillAdminQuestionCreator(domain, targetProfile) {
    const box = document.getElementById('adminQuestionCreatorBox');
    if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const prof = document.getElementById('adminNewQProfile');
    if (prof) {
      prof.value = targetProfile || 'kid';
    }
    updateAdminDomainDropdown(domain);

    const txt = document.getElementById('adminNewQText');
    if (txt) txt.focus();
    if (typeof window.showToast === 'function') {
      window.showToast(`Ready to add questions for ${domain}! Fill in the form below.`);
    }
  }

  function resetAdminQuestionForm() {
    const form = document.getElementById('adminNewQuestionForm');
    if (form) form.reset();
    updateAdminDomainDropdown();
  }

  function handleAdminCreateQuestionSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const profEl = document.getElementById('adminNewQProfile');
    const domainEl = document.getElementById('adminNewQDomain');
    const paraEl = document.getElementById('adminNewQParagraph');
    const qTextEl = document.getElementById('adminNewQText');
    const cAEl = document.getElementById('adminNewQChoiceA');
    const cBEl = document.getElementById('adminNewQChoiceB');
    const cCEl = document.getElementById('adminNewQChoiceC');
    const cDEl = document.getElementById('adminNewQChoiceD');
    const correctLetterEl = document.getElementById('adminNewQCorrectAnswer');
    const expEl = document.getElementById('adminNewQExplanation');

    if (!profEl || !domainEl || !qTextEl) return;

    const prof = profEl.value;
    const domain = domainEl.value;
    const para = paraEl ? paraEl.value.trim() : '';
    const qText = qTextEl.value.trim();
    const cA = cAEl ? cAEl.value.trim() : '';
    const cB = cBEl ? cBEl.value.trim() : '';
    const cC = cCEl ? cCEl.value.trim() : '';
    const cD = cDEl ? cDEl.value.trim() : '';
    const correctLetter = correctLetterEl ? correctLetterEl.value : 'A';
    const exp = expEl ? expEl.value.trim() : '';

    if (!qText || !cA || !cB || !cC || !cD) {
      if (typeof window.showToast === 'function') window.showToast("Please fill in question prompt and all four choices!");
      return;
    }

    const newQuestion = {
      id: 'q_' + prof + '_' + Date.now().toString(36),
      targetProfile: prof,
      domain: domain,
      skill: domain,
      question: {
        paragraph: para || null,
        question: qText,
        choices: {
          A: cA,
          B: cB,
          C: cC,
          D: cD
        },
        correct_answer: correctLetter,
        explanation: exp || `The correct answer is ${correctLetter}: ${correctLetter === 'A' ? cA : (correctLetter === 'B' ? cB : (correctLetter === 'C' ? cC : cD))}`
      }
    };

    if (window.LuminaDB && typeof window.LuminaDB.addQuestion === 'function') {
      window.LuminaDB.addQuestion(newQuestion);
    } else {
      appData.questions = appData.questions || [];
      appData.questions.unshift(newQuestion);
      saveState();
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`✓ Added new question to ${domain} and synced to cloud!`);
    }

    resetAdminQuestionForm();
    renderAdminPortal();
    refreshHeaderUI();
  }

  /* =====================================================================
     CUSTOM SECTION XP MULTIPLIERS & MOTIVATION SYSTEM
     ===================================================================== */
  const DEFAULT_SECTION_XP = {
    // Math Operations
    'math_division': 50,       // ➗ Division promoted by default (Tough)
    'math_multiplication': 35, // ✖️ Multiplication
    'math_subtraction': 20,    // ➖ Subtraction
    'math_addition': 20,       // ➕ Addition
    'numbers': 25,

    // Spelling Bee Levels
    'spelling_big': 50,        // 🐝 Big Words (7+ letters, Tough)
    'spelling_6': 30,          // 🐝 6-Letter Words
    'spelling_5': 25,          // 🐝 5-Letter Words
    'spelling_4': 20,          // 🐝 4-Letter Words
    'spelling_3': 15,          // 🐝 3-Letter Words
    'spelling': 25,            // 🐝 General Spelling

    // Trilingual Studio (Sentences, Words, Letters)
    'malayalam_sentences': 50, // 🌴 Malayalam Small Sentences (Tough)
    'malayalam_words': 20,     // 🌴 Malayalam Core Words
    'malayalam_letters': 15,   // 🌴 Malayalam Alphabet Letters
    'malayalam': 30,

    'hindi_sentences': 50,     // 🪔 Hindi Small Sentences (Tough)
    'hindi_words': 20,         // 🪔 Hindi Core Words
    'hindi_letters': 15,       // 🪔 Hindi Alphabet Letters
    'hindi': 30,

    'spanish_sentences': 50,   // 🇪🇸 Spanish Small Sentences (Tough)
    'spanish_words': 20,       // 🇪🇸 Spanish Core Words
    'spanish': 30,

    // Reading Comprehension & Facts
    'comprehension': 35,       // 📖 Story Reading & Comprehension
    'grammar': 25,             // ✏️ Grammar & Sentence Building
    'phonics': 20,             // 🔤 Sight Words & Phonics
    'animals': 20,             // 🦁 Animals & Science Facts

    // Teen Studio
    'sat_math': 40,            // 📐 SAT Advanced Math & Algebra (Tough)
    'sat_rw': 25,              // 📝 SAT Reading & Writing
    'sat': 30
  };

  const ADMIN_XP_SECTIONS = [
    // Math Operations
    { key: 'math_division', title: '➗ Math — Division', group: 'Math Operations', isTough: true, defaultXP: 50, hint: 'Sharing, grouping, and long division' },
    { key: 'math_multiplication', title: '✖️ Math — Multiplication', group: 'Math Operations', isTough: false, defaultXP: 35, hint: 'Times tables, arrays, and word problems' },
    { key: 'math_subtraction', title: '➖ Math — Subtraction', group: 'Math Operations', isTough: false, defaultXP: 20, hint: 'Minus, takeaway, and difference problems' },
    { key: 'math_addition', title: '➕ Math — Addition', group: 'Math Operations', isTough: false, defaultXP: 20, hint: 'Plus, sum, and combine math problems' },

    // Spelling Bee Levels
    { key: 'spelling_big', title: '🐝 Spelling — Big Words (7+ Letters)', group: 'Spelling Bee', isTough: true, defaultXP: 50, hint: 'Chameleon, dinosaur, chocolate, etc.' },
    { key: 'spelling_6', title: '🐝 Spelling — 6-Letter Words', group: 'Spelling Bee', isTough: false, defaultXP: 30, hint: 'School, friend, monkey, etc.' },
    { key: 'spelling_5', title: '🐝 Spelling — 5-Letter Words', group: 'Spelling Bee', isTough: false, defaultXP: 25, hint: 'Tiger, clock, water, apple, etc.' },
    { key: 'spelling_4', title: '🐝 Spelling — 4-Letter Words', group: 'Spelling Bee', isTough: false, defaultXP: 20, hint: 'Book, bird, star, frog, etc.' },
    { key: 'spelling_3', title: '🐝 Spelling — 3-Letter Words', group: 'Spelling Bee', isTough: false, defaultXP: 15, hint: 'Cat, sun, dog, pig, etc.' },
    { key: 'spelling', title: '🐝 Spelling Bee (Standard Track)', group: 'Spelling Bee', isTough: false, defaultXP: 25, hint: 'General spelling builder curriculum' },

    // Trilingual Languages
    { key: 'malayalam_sentences', title: '🌴 Malayalam — Small Sentences', group: 'Languages', isTough: true, defaultXP: 50, hint: 'Conversational Malayalam sentences' },
    { key: 'malayalam_words', title: '🌴 Malayalam — Core Words', group: 'Languages', isTough: false, defaultXP: 20, hint: '100+ Vocabulary words' },
    { key: 'malayalam_letters', title: '🌴 Malayalam — Alphabet Letters', group: 'Languages', isTough: false, defaultXP: 15, hint: '50+ Malayalam letter sounds' },

    { key: 'hindi_sentences', title: '🪔 Hindi — Small Sentences', group: 'Languages', isTough: true, defaultXP: 50, hint: 'Conversational Hindi sentences' },
    { key: 'hindi_words', title: '🪔 Hindi — Core Words', group: 'Languages', isTough: false, defaultXP: 20, hint: '100+ Hindi vocabulary words' },
    { key: 'hindi_letters', title: '🪔 Hindi — Alphabet Letters', group: 'Languages', isTough: false, defaultXP: 15, hint: 'Devanagari letter sounds' },

    { key: 'spanish_sentences', title: '🇪🇸 Spanish — Small Sentences', group: 'Languages', isTough: true, defaultXP: 50, hint: 'Conversational Spanish sentences' },
    { key: 'spanish_words', title: '🇪🇸 Spanish — Core Words', group: 'Languages', isTough: false, defaultXP: 20, hint: '100+ Spanish vocabulary words' },

    // Reading Comprehension & Facts
    { key: 'comprehension', title: '📖 6+ Story Reading & Comprehension', group: 'Reading & Science', isTough: false, defaultXP: 35, hint: 'Reading passages & paragraph questions' },
    { key: 'grammar', title: '✏️ 6+ Grammar & Sentence Building', group: 'Reading & Science', isTough: false, defaultXP: 25, hint: 'Parts of speech & sentence structure' },
    { key: 'phonics', title: '🔤 Sight Words & Phonics', group: 'Reading & Science', isTough: false, defaultXP: 20, hint: 'Phonetic blends and sight words' },
    { key: 'animals', title: '🦁 Animals & Science Facts', group: 'Reading & Science', isTough: false, defaultXP: 20, hint: 'Animal science and nature facts' },

    // Teen Studio
    { key: 'sat_math', title: '📐 SAT Advanced Math & Algebra', group: 'Digital SAT', isTough: true, defaultXP: 40, hint: '13+ College Board SAT Math' },
    { key: 'sat_rw', title: '📝 SAT Reading & Writing', group: 'Digital SAT', isTough: false, defaultXP: 25, hint: '13+ College Board SAT Verbal' }
  ];

  function getSectionXP(trackKey, subKey) {
    const custom = (window.LuminaDB && window.LuminaDB.state && window.LuminaDB.state.sectionXP) || {};
    if (subKey && custom[`${trackKey}_${subKey}`] !== undefined) {
      return Number(custom[`${trackKey}_${subKey}`]) || 20;
    }
    if (trackKey && custom[trackKey] !== undefined) {
      return Number(custom[trackKey]) || 20;
    }
    if (subKey && DEFAULT_SECTION_XP[`${trackKey}_${subKey}`] !== undefined) {
      return DEFAULT_SECTION_XP[`${trackKey}_${subKey}`];
    }
    if (trackKey && DEFAULT_SECTION_XP[trackKey] !== undefined) {
      return DEFAULT_SECTION_XP[trackKey];
    }
    return 20;
  }

  function setSectionXP(trackKey, xp) {
    if (!window.LuminaDB) return;
    if (!window.LuminaDB.state.sectionXP) window.LuminaDB.state.sectionXP = {};
    const cleanVal = Math.max(5, Math.min(500, Math.round(Number(xp) || 20)));
    window.LuminaDB.state.sectionXP[trackKey] = cleanVal;
    if (typeof window.LuminaDB.saveLocal === 'function') window.LuminaDB.saveLocal();
    if (typeof window.LuminaDB.scheduleCloudSync === 'function') window.LuminaDB.scheduleCloudSync(500);
    renderAdminSectionXPGrid();
    refreshStudentXPBadges();
    if (typeof window.showToast === 'function') {
      window.showToast(`Updated ${trackKey.replace(/_/g, ' ')} reward to +${cleanVal} XP!`);
    }
  }

  function resetAllSectionXPToDefaults() {
    if (!confirm('Reset all section XP rewards back to standard defaults?')) return;
    if (window.LuminaDB && window.LuminaDB.state) {
      window.LuminaDB.state.sectionXP = {};
      if (typeof window.LuminaDB.saveLocal === 'function') window.LuminaDB.saveLocal();
      if (typeof window.LuminaDB.scheduleCloudSync === 'function') window.LuminaDB.scheduleCloudSync(500);
    }
    renderAdminSectionXPGrid();
    refreshStudentXPBadges();
    if (typeof window.showToast === 'function') {
      window.showToast('All section XP rewards reset to standard defaults.');
    }
  }

  function renderAdminSectionXPGrid() {
    const grid = document.getElementById('adminSectionXPGrid');
    if (!grid) return;

    grid.innerHTML = ADMIN_XP_SECTIONS.map(sec => {
      const currentXP = getSectionXP(sec.key);
      const isHighXP = currentXP >= 40;
      const isSuperHigh = currentXP >= 75;

      const badgeCls = isSuperHigh
        ? "bg-rose-100 text-rose-950 border-rose-300 animate-pulse"
        : (isHighXP ? "bg-amber-100 text-amber-950 border-amber-300" : "bg-indigo-50 text-indigo-800 border-indigo-200");

      return `
        <div class="p-5 rounded-3xl bg-slate-50/80 border-2 ${isHighXP ? 'border-amber-300/80 bg-amber-50/30' : 'border-slate-200'} shadow-sm flex flex-col justify-between transition hover:border-indigo-300">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">${escapeHtml(sec.group)}</span>
              ${sec.isTough ? '<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-extrabold flex items-center gap-1"><span>🔥</span><span>Tough Topic</span></span>' : ''}
            </div>
            <h4 class="text-sm font-extrabold text-slate-900 leading-snug">${escapeHtml(sec.title)}</h4>
            <p class="text-[11px] text-slate-500 mt-1">${escapeHtml(sec.hint)}</p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-200/70">
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <span class="text-xs font-bold text-slate-600">Reward:</span>
              <span class="px-3 py-1 rounded-full text-xs font-black border ${badgeCls} flex items-center gap-1 shadow-2xs">
                <span>${isSuperHigh ? '🚀' : (isHighXP ? '🔥' : '⚡')}</span>
                <span>+${currentXP} XP</span>
              </span>
            </div>

            <!-- Preset buttons -->
            <div class="grid grid-cols-4 gap-1.5 mb-2.5">
              <button onclick="setSectionXP('${sec.key}', 10)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 10 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'}">10</button>
              <button onclick="setSectionXP('${sec.key}', 20)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 20 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'}">20</button>
              <button onclick="setSectionXP('${sec.key}', 50)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 50 ? 'bg-amber-500 text-white shadow-xs' : 'bg-white hover:bg-amber-100 text-amber-800 border border-amber-200'}">50 🌟</button>
              <button onclick="setSectionXP('${sec.key}', 100)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 100 ? 'bg-rose-600 text-white shadow-xs' : 'bg-white hover:bg-rose-100 text-rose-800 border border-rose-200'}">100 🔥</button>
            </div>

            <!-- Custom input -->
            <div class="flex items-center justify-between gap-2 text-xs">
              <span class="text-slate-500 font-semibold text-[11px]">Custom XP:</span>
              <div class="flex items-center gap-1">
                <input type="number" min="5" max="500" step="5" value="${currentXP}" onchange="setSectionXP('${sec.key}', this.value)" class="w-16 px-2 py-1 text-center font-bold text-xs bg-white border border-slate-300 rounded-lg focus:outline-indigo-500" />
                <span class="font-bold text-slate-500">XP</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function refreshStudentXPBadges() {
    // 1. Kid categories
    const catMap = {
      'spelling': () => Math.max(getSectionXP('spelling_big'), getSectionXP('spelling_6'), getSectionXP('spelling_5'), getSectionXP('spelling_4'), getSectionXP('spelling_3'), getSectionXP('spelling')),
      'comprehension': () => getSectionXP('comprehension'),
      'grammar': () => getSectionXP('grammar'),
      'numbers': () => Math.max(getSectionXP('math_division'), getSectionXP('math_multiplication'), getSectionXP('math_subtraction'), getSectionXP('math_addition'), getSectionXP('numbers')),
      'phonics': () => getSectionXP('phonics'),
      'animals': () => getSectionXP('animals'),
      'malayalam': () => Math.max(getSectionXP('malayalam_sentences'), getSectionXP('malayalam_words'), getSectionXP('malayalam_letters')),
      'hindi': () => Math.max(getSectionXP('hindi_sentences'), getSectionXP('hindi_words'), getSectionXP('hindi_letters')),
      'spanish': () => Math.max(getSectionXP('spanish_sentences'), getSectionXP('spanish_words'))
    };

    Object.entries(catMap).forEach(([idSuffix, getVal]) => {
      const btn = document.getElementById(`kidCat-${idSuffix}`);
      if (!btn) return;
      let badge = btn.querySelector('.kid-cat-xp-badge');
      const xp = (typeof getVal === 'function') ? getVal() : getSectionXP(getVal);
      const isHigh = xp >= 40;
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'kid-cat-xp-badge';
        btn.appendChild(badge);
      }
      badge.className = `kid-cat-xp-badge px-2 py-0.5 rounded-full text-[10px] font-black mt-1 ${isHigh ? 'bg-rose-500 text-white shadow-xs animate-bounce' : 'bg-slate-900/10 text-slate-800'}`;
      badge.innerText = isHigh ? `🔥 +${xp} XP` : `+${xp} XP`;
    });

    // 2. Kid trilingual sub-nav
    const cat = (window.appData && window.appData.kidCategory) || 'malayalam';
    if (cat === 'malayalam' || cat === 'hindi' || cat === 'spanish') {
      const bLet = document.getElementById('btn-kid-sub-letters');
      const bWrd = document.getElementById('btn-kid-sub-words');
      const bSen = document.getElementById('btn-kid-sub-sentences');
      const xpLet = getSectionXP(cat, 'letters');
      const xpWrd = getSectionXP(cat, 'words');
      const xpSen = getSectionXP(cat, 'sentences');
      if (bLet) bLet.innerHTML = `🔤 Letters <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-900/10 ml-1">+${xpLet}</span>`;
      if (bWrd) bWrd.innerHTML = `📖 Words <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-900/10 ml-1">+${xpWrd}</span>`;
      if (bSen) bSen.innerHTML = `💬 Sentences <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full ${xpSen >= 40 ? 'bg-rose-500 text-white' : 'bg-slate-900/10'} ml-1">${xpSen >= 40 ? '🔥 ' : ''}+${xpSen}</span>`;
    }

    // 3. Teen trilingual sub-nav
    const teenLang = (window.appData && window.appData.activeLanguage) || 'malayalam';
    const tbLet = document.getElementById('btn-teen-sub-letters');
    const tbWrd = document.getElementById('btn-teen-sub-words');
    const tbSen = document.getElementById('btn-teen-sub-sentences');
    const txpLet = getSectionXP(teenLang, 'letters');
    const txpWrd = getSectionXP(teenLang, 'words');
    const txpSen = getSectionXP(teenLang, 'sentences');
    if (tbLet) tbLet.innerHTML = `🔤 Alphabet Letters <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 ml-1">+${txpLet}</span>`;
    if (tbWrd) tbWrd.innerHTML = `📖 Core Words <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 ml-1">+${txpWrd}</span>`;
    if (tbSen) tbSen.innerHTML = `💬 Small Sentences <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full ${txpSen >= 40 ? 'bg-rose-500 text-white shadow-xs' : 'bg-indigo-100 text-indigo-900'} ml-1">${txpSen >= 40 ? '🔥 ' : ''}+${txpSen} XP</span>`;

    // 4. Spelling level buttons
    if (typeof window.ensureSpellingLevelBar === 'function') {
      window.ensureSpellingLevelBar();
    }
    // 5. Math operation filter bar
    if (typeof window.ensureMathOpBar === 'function') {
      window.ensureMathOpBar();
    }
  }

  /* =====================================================================
     WINDOW EXPORTS & BOOTSTRAP
     ===================================================================== */
  if (!appData.activeLanguage) appData.activeLanguage = 'malayalam';
  window.multiLangData = multiLangData;
  window.appData = appData;
  window.selectedCalendarDateKey = selectedCalendarDateKey;
  window.activeProfile = activeProfile;
  window.isTeenProfile = isTeenProfile;
  window.getTeenQuestions = getTeenQuestions;
  window.getKidQuestionsByDomain = getKidQuestionsByDomain;
  window.saveState = saveState;
  window.dedupeQuestionsList = dedupeQuestionsList;
  window.getNextFromDeck = getNextFromDeck;
  window.escapeHtml = escapeHtml;
  window.showToast = showToast;
  window.mergeCustomKidCards = mergeCustomKidCards;
  window.mergeLanguagePacksFromDB = mergeLanguagePacksFromDB;
  window.mergeExpandedLanguagePacks = mergeLanguagePacksFromDB;
  window.manualCloudSync = manualCloudSync;
  window.refreshHeaderUI = refreshHeaderUI;
  window.renderCloudStatus = renderCloudStatus;
  window.renderProfileSwitcher = renderProfileSwitcher;
  window.renderTodayStrip = renderTodayStrip;
  window.trackActivity = trackActivity;
  window.showProfilePicker = showProfilePicker;
  window.hideProfilePicker = hideProfilePicker;
  window.switchProfile = switchProfile;
  window.applyActiveProfileView = applyActiveProfileView;
  window.renderSubNavForKid = renderSubNavForKid;
  window.toggleFamilyAuthModal = toggleFamilyAuthModal;
  window.handleFamilyLoginSubmit = handleFamilyLoginSubmit;
  window.handleFamilySignOut = handleFamilySignOut;
  window.updateFamilyAuthUI = updateFamilyAuthUI;
  window.openParentAdminPortal = openParentAdminPortal;
  window.closeParentAdminPortal = closeParentAdminPortal;
  window.selectAdminStudent = selectAdminStudent;
  window.getStudentTrackProgressList = getStudentTrackProgressList;
  window.renderAdminPortal = renderAdminPortal;
  window.resetStudentArea = resetStudentArea;
  window.resetStudentAllCompletedAreas = resetStudentAllCompletedAreas;
  window.updateAdminDomainDropdown = updateAdminDomainDropdown;
  window.prefillAdminQuestionCreator = prefillAdminQuestionCreator;
  window.resetAdminQuestionForm = resetAdminQuestionForm;
  window.handleAdminCreateQuestionSubmit = handleAdminCreateQuestionSubmit;
  window.DEFAULT_SECTION_XP = DEFAULT_SECTION_XP;
  window.ADMIN_XP_SECTIONS = ADMIN_XP_SECTIONS;
  window.getSectionXP = getSectionXP;
  window.setSectionXP = setSectionXP;
  window.resetAllSectionXPToDefaults = resetAllSectionXPToDefaults;
  window.renderAdminSectionXPGrid = renderAdminSectionXPGrid;
  window.refreshStudentXPBadges = refreshStudentXPBadges;

  if (window.LuminaDB && typeof window.LuminaDB.onChange === 'function') {
    window.LuminaDB.onChange(() => {
      refreshHeaderUI();
      refreshStudentXPBadges();
    });
  }

  window.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.initDictionaryChips === 'function') {
      window.initDictionaryChips();
    }
    mergeLanguagePacksFromDB();
    mergeCustomKidCards();
    applyActiveProfileView();
    refreshStudentXPBadges();

    if (window.LuminaDB && typeof window.LuminaDB.pullFromCloud === 'function') {
      const res = await window.LuminaDB.pullFromCloud();
      if (res && res.ok) {
        mergeLanguagePacksFromDB();
        mergeCustomKidCards();
        applyActiveProfileView();
        refreshStudentXPBadges();
      }
    }
  });

})(window);
