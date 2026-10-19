/**
 * Lumina Learning Hub — Interactive Spelling Letter-Tile Picker ("Build the Word")
 * Enables kids to tap scrambled letter tiles into empty spelling slots,
 * with undo/remove, pronunciation, hints, confetti, and streak XP.
 */
(function (window) {
  'use strict';

  let spellingSubMode = 'tiles'; // 'tiles' or 'quiz'
  let currentSpellingItem = null;
  let currentSpellingWord = '';
  let currentSpellingSlots = []; // array of { char, trayIdx } or null
  let currentSpellingTray = [];  // array of { char, origIdx, used }
  let isSpellingResolving = false;
  let hasFailedFirstAttempt = false;
  let spellingHintRevealed = false;
  let spellingLengthFilter = '3'; // '3' | '4' | '5' | '6' | 'big' (7+) | 'all'

  // Expanded 120+ spelling words across 3, 4, 5, 6, and 7+ letters: [WORD, emoji, kid-friendly clue]
  const SHORT_SPELLING_WORDS = [
    // 3 letters (45 words)
    ['CAT', '🐱', 'A furry pet that says meow!'], ['DOG', '🐶', 'A friendly pet that barks and wags its tail!'],
    ['SUN', '☀️', 'The big bright star that gives us daylight!'], ['HAT', '🎩', 'You wear it on your head!'],
    ['BUS', '🚌', 'A big vehicle that takes kids to school!'], ['PIG', '🐷', 'A pink farm animal that says oink!'],
    ['CUP', '☕', 'You drink from it!'], ['BED', '🛏️', 'Where you sleep at night!'],
    ['BAT', '🦇', 'An animal that flies at night!'], ['COW', '🐄', 'A farm animal that gives us milk!'],
    ['FOX', '🦊', 'A clever orange animal with a bushy tail!'], ['BEE', '🐝', 'A buzzing insect that makes honey!'],
    ['EGG', '🥚', 'Hens lay it, and chicks hatch from it!'], ['KEY', '🔑', 'It opens a lock!'],
    ['MAP', '🗺️', 'It shows you where places are!'], ['PEN', '🖊️', 'You write with ink using it!'],
    ['BOX', '📦', 'You can pack things inside it!'], ['ANT', '🐜', 'A tiny insect that works very hard!'],
    ['OWL', '🦉', 'A wise bird that hoots at night!'], ['CAR', '🚗', 'It has four wheels and you ride in it!'],
    ['BUG', '🐞', 'A little crawling or flying insect!'], ['JAM', '🍓', 'Sweet fruit spread you put on toast!'],
    ['NET', '🥅', 'Used to catch fish or score a goal!'], ['RUG', '🧶', 'A soft mat on the floor!'],
    ['TOP', '陀', 'A toy that spins round and round!'], ['VAN', '🚐', 'A boxy vehicle that carries people or cargo!'],
    ['WEB', '🕸️', 'What a spider spins to catch flies!'], ['ZIP', '🤐', 'To close up a jacket fast!'],
    ['JET', '✈️', 'A super fast airplane in the sky!'], ['FAN', '🪭', 'It blows cool air on a warm day!'],
    ['MOP', '🧹', 'Used to clean spills off the floor!'], ['POT', '🍲', 'Used for cooking yummy soup on the stove!'],
    ['PIN', '🧷', 'A small metal fastener!'], ['LID', '🫙', 'The cover that closes a jar or pot!'],
    ['LOG', '🪵', 'A thick cut piece of wood from a tree!'], ['HEN', '🐔', 'A mother chicken that clucks and lays eggs!'],
    ['TUB', '🛁', 'Where you take a bubbly warm bath!'], ['NUT', '🥜', 'A crunchy little snack squirrels love!'],
    ['CUB', '🐻', 'A cute little baby bear or tiger!'], ['MUG', '☕', 'A cup with a handle for hot cocoa!'],
    ['PAN', '🍳', 'You fry eggs and pancakes in it!'], ['LIP', '👄', 'One of the soft edges of your mouth!'],
    ['DOT', '🔴', 'A small round spot!'], ['BOW', '🎀', 'A pretty knot of ribbon!'],
    ['FOG', '🌫️', 'A thick low cloud that makes it hard to see!'],
    // 4 letters (45 words)
    ['FISH', '🐟', 'It swims in water and has fins!'], ['BIRD', '🐦', 'It has feathers and can fly!'],
    ['CAKE', '🎂', 'A sweet treat for birthdays!'], ['BOOK', '📖', 'You read stories in it!'],
    ['TREE', '🌳', 'A tall plant with leaves and branches!'], ['MOON', '🌙', 'It shines in the night sky!'],
    ['STAR', '⭐', 'It twinkles in the night sky!'], ['FROG', '🐸', 'A green animal that hops and says ribbit!'],
    ['DUCK', '🦆', 'A bird that swims and says quack!'], ['BEAR', '🐻', 'A big furry animal that loves honey!'],
    ['LION', '🦁', 'The king of the jungle that roars!'], ['BALL', '⚽', 'You kick it or throw it to play!'],
    ['MILK', '🥛', 'A white drink that makes bones strong!'], ['SHIP', '🚢', 'A huge boat that sails the sea!'],
    ['KITE', '🪁', 'It flies high in the wind on a string!'], ['RAIN', '🌧️', 'Water drops falling from clouds!'],
    ['CORN', '🌽', 'A yellow vegetable on a cob!'], ['DRUM', '🥁', 'You bang it to make music!'],
    ['HAND', '✋', 'It has five fingers!'], ['BOAT', '⛵', 'It floats on water!'],
    ['BELL', '🔔', 'It rings with a ding-dong sound!'], ['COAT', '🧥', 'You wear it to stay warm outside!'],
    ['DEER', '🦌', 'A gentle forest animal with antlers!'], ['FIRE', '🔥', 'It is hot and gives light and warmth!'],
    ['GOAT', '🐐', 'A farm animal with horns that climbs hills!'], ['KING', '🤴', 'A royal ruler who wears a crown!'],
    ['LEAF', '🍃', 'A green part that grows on a tree branch!'], ['NEST', '🪺', 'A cozy home a bird builds for its eggs!'],
    ['RING', '💍', 'A little circle of metal worn on a finger!'], ['SNOW', '❄️', 'Soft white flakes that fall in winter!'],
    ['DOOR', '🚪', 'You open it to walk into a room!'], ['WIND', '💨', 'Moving air you feel outside!'],
    ['SAND', '🏖️', 'Tiny soft grains on the beach!'], ['PARK', '🏞️', 'A green place where kids play on swings!'],
    ['SEAL', '🦭', 'A playful sea animal that claps its flippers!'], ['LAMB', '🐑', 'A gentle baby sheep with white wool!'],
    ['CRAB', '🦀', 'A sea creature with pincers that walks sideways!'], ['PEAR', '🍐', 'A sweet and juicy green fruit!'],
    ['GOLD', '🪙', 'A shiny yellow precious metal!'], ['ROSE', '🌹', 'A pretty red flower with a sweet smell!'],
    ['BABY', '👶', 'A tiny newborn person!'], ['WOLF', '🐺', 'A wild dog that howls at the full moon!'],
    ['SOUP', '🥣', 'A warm bowl of broth and veggies!'], ['SOCK', '🧦', 'You wear it on your foot inside your shoe!'],
    ['TENT', '⛺', 'A portable shelter you sleep in while camping!'],
    // 5 letters (45 words)
    ['APPLE', '🍎', 'A crunchy red or green fruit!'], ['HOUSE', '🏠', 'The place where a family lives!'],
    ['TRAIN', '🚆', 'It runs on tracks and goes choo-choo!'], ['HORSE', '🐴', 'An animal you can ride that says neigh!'],
    ['MOUSE', '🐭', 'A tiny animal that squeaks!'], ['TIGER', '🐯', 'A big orange cat with black stripes!'],
    ['ZEBRA', '🦓', 'A horse-like animal with black and white stripes!'], ['SNAKE', '🐍', 'A long animal with no legs that hisses!'],
    ['CLOUD', '☁️', 'A fluffy white shape in the sky!'], ['PIZZA', '🍕', 'A cheesy round food cut into slices!'],
    ['LEMON', '🍋', 'A sour yellow fruit!'], ['GRAPE', '🍇', 'A small round fruit that grows in bunches!'],
    ['CHAIR', '🪑', 'You sit on it!'], ['CLOCK', '⏰', 'It tells you the time!'],
    ['PLANT', '🪴', 'It grows in soil and needs water!'], ['WATER', '💧', 'You drink it when you are thirsty!'],
    ['BREAD', '🍞', 'You make sandwiches with it!'], ['SHEEP', '🐑', 'A woolly farm animal that says baa!'],
    ['TRUCK', '🚚', 'A big vehicle that carries heavy things!'], ['SMILE', '😊', 'What your face does when you are happy!'],
    ['BEACH', '🏖️', 'A sandy shore right by the ocean!'], ['BRUSH', '🪥', 'You use it to clean your teeth or paint!'],
    ['CROWN', '👑', 'A golden hat worn by a king or queen!'], ['EARTH', '🌍', 'The blue and green planet we live on!'],
    ['HEART', '❤️', 'It beats inside your chest and means love!'], ['KOALA', '🐨', 'A cute Australian animal that hugs eucalyptus trees!'],
    ['PANDA', '🐼', 'A black and white bear that munches bamboo!'], ['QUEEN', '👸', 'A royal lady who wears a crown!'],
    ['SHARK', '🦈', 'A big ocean fish with sharp teeth!'], ['WHALE', '🐋', 'The biggest animal in the ocean!'],
    ['RIVER', '🏞️', 'A wide stream of fresh water flowing to the sea!'], ['GRASS', '🌱', 'The green plant carpet covering lawns and meadows!'],
    ['CHEST', '📦', 'A treasure box or the front of your body!'], ['GHOST', '👻', 'A spooky, friendly sheet that says boo!'],
    ['FLUTE', '🪈', 'A long thin musical pipe you blow into!'], ['PIANO', '🎹', 'An instrument with black and white keys!'],
    ['BERRY', '🫐', 'A small sweet juicy fruit like a blueberry!'], ['CHICK', '🐥', 'A fluffy yellow baby bird!'],
    ['STAMP', '📮', 'A little sticker you put on a letter to mail it!'], ['SPOON', '🥄', 'You eat soup and cereal with it!'],
    ['STORM', '⛈️', 'Thunder, lightning, and heavy rain!'], ['TOWEL', '🧖', 'Used to dry yourself after a swim or bath!'],
    ['SKATE', '🛼', 'A boot with wheels or a blade on the bottom!'], ['IGLOO', '🧊', 'A dome house built of snow blocks!'],
    ['CANDY', '🍬', 'A sweet sugary treat!'],
    // 6 letters (45 words)
    ['ORANGE', '🍊', 'A round juicy fruit, and also a color!'], ['RABBIT', '🐰', 'A fluffy animal with long ears that hops!'],
    ['MONKEY', '🐒', 'A playful animal that swings in trees!'], ['TURTLE', '🐢', 'A slow animal that carries its shell!'],
    ['PENCIL', '✏️', 'You write and draw with it, and can erase!'], ['FLOWER', '🌸', 'A pretty, colorful part of a plant!'],
    ['BANANA', '🍌', 'A long yellow fruit monkeys love!'], ['CARROT', '🥕', 'An orange vegetable bunnies love!'],
    ['ROCKET', '🚀', 'It blasts off into space!'], ['CASTLE', '🏰', 'A big stone home for kings and queens!'],
    ['SPIDER', '🕷️', 'It has eight legs and spins a web!'], ['PURPLE', '🟣', 'The color you get mixing red and blue!'],
    ['CHEESE', '🧀', 'A yellow food made from milk!'], ['BUTTON', '🔘', 'It keeps your shirt closed!'],
    ['GARDEN', '🌻', 'A place where flowers and vegetables grow!'], ['WINDOW', '🪟', 'You look outside through it!'],
    ['BRIDGE', '🌉', 'It helps you cross over a river!'], ['PARROT', '🦜', 'A colorful bird that can talk!'],
    ['TOMATO', '🍅', 'A red juicy fruit used in ketchup!'], ['COOKIE', '🍪', 'A sweet round baked treat!'],
    ['BASKET', '🧺', 'A woven container for carrying picnic food!'], ['CANDLE', '🕯️', 'A wax stick with a wick that glows when lit!'],
    ['DOCTOR', '🩺', 'A helper who takes care of you when you are sick!'], ['DRAGON', '🐉', 'A fairy-tale creature with wings that breathes fire!'],
    ['FINGER', '☝️', 'One of the five parts on your hand!'], ['GUITAR', '🎸', 'A musical instrument with strings you strum!'],
    ['JACKET', '🧥', 'A short coat you wear in cool weather!'], ['PLANET', '🪐', 'A large world that orbits around a star!'],
    ['TROPHY', '🏆', 'A shiny cup you win for doing your best!'], ['YELLOW', '💛', 'The bright color of lemons and the sun!'],
    ['SILVER', '🥈', 'A shiny grayish-white metal second to gold!'], ['FOREST', '🌲', 'A large area dense with tall trees!'],
    ['PIGEON', '🐦', 'A friendly city bird that pecks at bread crumbs!'], ['CHERRY', '🍒', 'A small round bright red fruit with a stem!'],
    ['KITTEN', '🐱', 'A playful little baby cat that purrs!'], ['MAGNET', '🧲', 'A piece of metal that attracts iron objects!'],
    ['PUPPET', '🧸', 'A doll moved by hand strings or fingers!'], ['WIZARD', '🧙', 'A magical person with a wand and starry hat!'],
    ['CIRCUS', '🎪', 'A big show with acrobats and clowns in a giant tent!'], ['DONKEY', '🫏', 'A hardworking animal with long ears that brays hee-haw!'],
    ['PARCEL', '📦', 'A wrapped package delivered in the mail!'], ['CRAYON', '🖍️', 'A stick of colored wax used for coloring!'],
    ['ROBOTS', '🤖', 'Smart mechanical machines that follow computer code!'], ['ISLAND', '🏝️', 'A piece of land surrounded by water on all sides!'],
    ['SAFARI', '🦁', 'An expedition to observe wild animals in their habitat!'],
    // 7+ letters (30 big words)
    ['TEACHER', '👩‍🏫', 'Someone who helps students learn at school!'],
    ['AIRPLANE', '🛩️', 'A flying machine with wings that carries passengers!'],
    ['SANDWICH', '🥪', 'Two slices of bread with yummy filling in between!'],
    ['BACKPACK', '🎒', 'A bag you wear on your back to carry books!'],
    ['SNOWFLAKE', '❄️', 'A six-sided ice crystal falling from winter clouds!'],
    ['PINEAPPLE', '🍍', 'A tropical fruit with a spiky crown and sweet yellow inside!'],
    ['STRAWBERRY', '🍓', 'A sweet red berry with tiny seeds on the outside!'],
    ['WATERMELON', '🍉', 'A giant green fruit that is pink and juicy inside!'],
    ['CATERPILLAR', '🐛', 'A hungry little larva that turns into a butterfly!'],
    ['FIRETRUCK', '🚒', 'A bright red truck that firefighters drive!'],
    ['DOLPHIN', '🐬', 'A friendly, smart sea mammal that leaps from waves!'],
    ['OCTOPUS', '🐙', 'An ocean animal with eight flexible arms!'],
    ['HAMBURGER', '🍔', 'A round patty inside a toasted bun with lettuce!'],
    ['SUNFLOWER', '🌻', 'A tall yellow flower that turns towards the sun!'],
    ['BUTTERFLY', '🦋', 'A delicate winged insect with vibrant colors!'],
    ['CROCODILE', '🐊', 'A large reptile with sharp teeth that swims in rivers!'],
    ['HELICOPTER', '🚁', 'An aircraft with spinning blades on top!'],
    ['TELESCOPE', '🔭', 'An instrument that lets you see far-away stars and planets!'],
    ['MOUNTAIN', '⛰️', 'A giant landform that rises high into the clouds!'],
    ['SUBMARINE', '🚢', 'A naval ship that travels deep underwater!'],
    ['KANGAROO', '🦘', 'An Australian animal that carries its joey in a pouch!'],
    ['FLAMINGO', '🦩', 'A tall pink wading bird that balances on one leg!'],
    ['DINOSAUR', '🦕', 'Prehistoric creatures that lived millions of years ago!'],
    ['ASTRONAUT', '👨‍🚀', 'A brave explorer who travels in outer space!'],
    ['LIGHTNING', '⚡', 'A giant electric flash that streaks across stormy skies!']
  ].map(([w, emoji, clue]) => ({
    emoji,
    primary: w.split('').join(' - '),
    meaning: `${w} • ${clue}`,
    speech: `${w.charAt(0) + w.slice(1).toLowerCase()}. ${w.split('').join(', ')}.`
  }));

  function spellingWordOf(item) {
    return (item.primary || '').replace(/[^A-Za-z]/g, '').toUpperCase();
  }

  function makeMisspellings(word) {
    const w = word.toUpperCase();
    const out = new Set();
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    // 1. Swap first vowel with another vowel
    for (let i = 0; i < w.length; i++) {
      if (vowels.includes(w[i])) {
        vowels.forEach(v => {
          if (v !== w[i]) out.add(w.slice(0, i) + v + w.slice(i + 1));
        });
      }
    }
    // 2. Transpose two adjacent distinct letters
    for (let i = 0; i < w.length - 1; i++) {
      if (w[i] !== w[i + 1]) {
        out.add(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2));
      }
    }
    // 3. Double a consonant or drop a letter
    if (w.length >= 3) {
      out.add(w + w[w.length - 1]);
      out.add(w.slice(0, -1) + (w[w.length - 1] === 'E' ? 'A' : 'E'));
    }
    out.delete(w);
    return Array.from(out).slice(0, 3);
  }

  function getAllSpellingItems() {
    const pack = window.multiLangData && window.multiLangData.spelling;
    const base = (pack && pack.kidItems) || [];
    const seen = new Set(base.map(spellingWordOf));
    SHORT_SPELLING_WORDS.forEach(item => {
      const w = spellingWordOf(item);
      if (!seen.has(w)) {
        seen.add(w);
        base.push(item);
      }
    });
    return base;
  }

  function getGeneratedSpellingQuizQuestions() {
    const items = getAllSpellingItems();
    const letters = ['A', 'B', 'C', 'D'];
    return items.map((item, idx) => {
      const w = spellingWordOf(item);
      const cluePart = (item.meaning || '').split('•').slice(1).join('•').trim() || item.meaning || '';
      const wrongs = makeMisspellings(w);
      while (wrongs.length < 3) {
        wrongs.push(w + letters[wrongs.length]);
      }
      const correctPos = idx % 4;
      const opts = wrongs.slice(0, 3);
      opts.splice(correctPos, 0, w);
      const choices = { A: opts[0], B: opts[1], C: opts[2], D: opts[3] };
      return {
        id: 'kid_spell_auto_' + w.toLowerCase(),
        targetProfile: 'kid',
        domain: '6+ Spelling Bee',
        wordLength: w.length,
        difficulty: w.length <= 4 ? 'Easy' : (w.length <= 6 ? 'Medium' : 'Hard'),
        question: {
          paragraph: `${item.emoji || '🐝'} Spelling Clue (${w.length} letters): ${cluePart}`,
          question: `Which is the correct spelling for this ${w.length}-letter word?`,
          choices: choices,
          correct_answer: letters[correctPos],
          explanation: `The correct spelling is ${w.split('').join(' - ')} (${w}): ${cluePart}`
        }
      };
    });
  }

  function matchesLengthFilter(item) {
    const n = spellingWordOf(item).length;
    if (spellingLengthFilter === 'all') return true;
    if (spellingLengthFilter === 'big') return n >= 7;
    return n === Number(spellingLengthFilter);
  }

  function ensureSpellingLevelBar() {
    const toggle = document.getElementById('spellingModeToggle');
    const zone = document.getElementById('spellingBuilderZone');
    const host = (toggle && toggle.parentNode) ? toggle.parentNode : zone;
    if (!host) return;
    let bar = document.getElementById('spellingLevelBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'spellingLevelBar';
      bar.className = 'flex flex-wrap items-center justify-center gap-2 mb-3';
      if (toggle && toggle.nextSibling) {
        host.insertBefore(bar, toggle.nextSibling);
      } else {
        host.insertBefore(bar, host.firstChild);
      }
    }
    const isSpelling = !!(window.appData && window.appData.kidCategory === 'spelling');
    bar.classList.toggle('hidden', !isSpelling);
    const all = getAllSpellingItems();
    const levels = [['3', '3 Letters'], ['4', '4 Letters'], ['5', '5 Letters'], ['6', '6 Letters'], ['big', 'Big Words'], ['all', 'All']];
    bar.innerHTML = levels.map(([key, label]) => {
      const saved = spellingLengthFilter;
      spellingLengthFilter = key;
      const count = all.filter(matchesLengthFilter).length;
      spellingLengthFilter = saved;
      const active = key === spellingLengthFilter;
      const cls = active
        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50';
      return `<button id="spelling-level-${key}" onclick="setSpellingLengthFilter('${key}')" class="px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition ${cls}">${label} <span class="opacity-60">(${count})</span></button>`;
    }).join('');
  }

  function setSpellingLengthFilter(key) {
    spellingLengthFilter = key;
    window.spellingLengthFilter = key;
    ensureSpellingLevelBar();
    if (typeof window.renderKidFlashcard === 'function') {
      window.renderKidFlashcard();
    }
    if (spellingSubMode === 'tiles') {
      generateSpellingTileRound();
    } else if (typeof window.generateKidQuizRound === 'function') {
      window.generateKidQuizRound();
    }
  }

  function setSpellingBuilderContentVisible(visible) {
    const zone = document.getElementById('spellingBuilderZone');
    if (!zone) return;
    Array.from(zone.children).forEach(ch => {
      if (ch.id === 'spellingLevelBar' || ch.id === 'spellingCompleteBox') return;
      ch.classList.toggle('hidden', !visible);
    });
    let box = document.getElementById('spellingCompleteBox');
    if (!visible && !box) {
      box = document.createElement('div');
      box.id = 'spellingCompleteBox';
      zone.appendChild(box);
    }
    if (box) box.classList.toggle('hidden', visible);
  }

  function setSpellingSubMode(mode) {
    spellingSubMode = mode;
    window.spellingSubMode = mode;
    const btnTiles = document.getElementById('btn-spelling-sub-tiles');
    const btnQuiz = document.getElementById('btn-spelling-sub-quiz');
    if (btnTiles && btnQuiz) {
      if (mode === 'tiles') {
        btnTiles.className = "px-3 py-1 rounded-xl transition bg-amber-400 text-slate-950 shadow-sm";
        btnQuiz.className = "px-3 py-1 rounded-xl transition text-slate-600 hover:text-slate-900";
      } else {
        btnQuiz.className = "px-3 py-1 rounded-xl transition bg-amber-400 text-slate-950 shadow-sm";
        btnTiles.className = "px-3 py-1 rounded-xl transition text-slate-600 hover:text-slate-900";
      }
    }
    if (typeof window.generateKidQuizRound === 'function') {
      window.generateKidQuizRound();
    }
  }

  function handleKidNextQuizBtn() {
    if (window.appData && window.appData.kidCategory === 'spelling' && spellingSubMode === 'tiles') {
      generateSpellingTileRound();
    } else if (typeof window.generateKidQuizRound === 'function') {
      window.generateKidQuizRound();
    }
  }

  function resetCompletedSpellingWords() {
    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);
    if (p && window.LuminaDB) {
      const levelItems = getAllSpellingItems().filter(matchesLengthFilter);
      if (spellingLengthFilter === 'all' && typeof window.LuminaDB.resetCompletedQuestions === 'function') {
        window.LuminaDB.resetCompletedQuestions(p.id, 'spelling');
      } else if (typeof window.LuminaDB.unmarkQuestionCompleted === 'function') {
        levelItems.forEach(i => window.LuminaDB.unmarkQuestionCompleted(p.id, 'spelling_' + spellingWordOf(i)));
      }
    }
    if (typeof window.showToast === 'function') window.showToast("Spelling Bee words reset! Ready to play again.");
    generateSpellingTileRound();
  }

  function generateSpellingTileRound() {
    isSpellingResolving = false;
    hasFailedFirstAttempt = false;
    spellingHintRevealed = false;

    const btnHint = document.getElementById('btnSpellingHint');
    if (btnHint) btnHint.classList.add('hidden');

    const allItems = getAllSpellingItems().filter(matchesLengthFilter);
    ensureSpellingLevelBar();
    if (allItems.length === 0) return;

    // Filter out words that are already completed for this profile
    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);
    const completed = new Set((p && p.completedQuestionIds) || []);

    const uncompletedItems = allItems.filter(i => !completed.has('spelling_' + spellingWordOf(i)));

    const levelName = spellingLengthFilter === 'all' ? 'every' : (spellingLengthFilter === 'big' ? 'every big' : `every ${spellingLengthFilter}-letter`);
    if (uncompletedItems.length === 0) {
      setSpellingBuilderContentVisible(false);
      const box = document.getElementById('spellingCompleteBox');
      if (box) {
        box.innerHTML = `
          <div class="text-center py-8 px-6 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-3xl border-4 border-amber-300 shadow-xl space-y-4 animate-fade">
            <div class="text-6xl animate-bounce">🏆</div>
            <h3 class="text-2xl font-black text-slate-900">Spelling Bee Champion!</h3>
            <p class="text-base font-bold text-slate-700">You built ${levelName} spelling word in the hive! Try another level above.</p>
            <div class="pt-2">
              <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-100 text-amber-950 text-xs font-bold border border-amber-300">
                ⭐ Level Completed! Ask your parent or admin in the Parent Portal to reset or add more words.
              </span>
            </div>
          </div>
        `;
      }
      return;
    }
    setSpellingBuilderContentVisible(true);

    // Zero-repeat non-repeating deck queue
    const item = (typeof window.getNextFromDeck === 'function')
      ? window.getNextFromDeck('spelling_tiles_deck_' + (p ? p.id : 'default') + '_' + spellingLengthFilter, uncompletedItems, i => i.primary)
      : uncompletedItems[Math.floor(Math.random() * uncompletedItems.length)];

    currentSpellingItem = item;
    const target = spellingWordOf(item);
    currentSpellingWord = target;
    currentSpellingSlots = new Array(target.length).fill(null);

    // Scramble letters for the tray
    const tiles = target.split('').map((char, idx) => ({ char, origIdx: idx, used: false }));
    // Fisher-Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = tiles[i]; tiles[i] = tiles[j]; tiles[j] = tmp;
    }
    // Prevent accidental unshuffled state if word length > 1
    if (tiles.map(t => t.char).join('') === target && tiles.length > 1) {
      const tmp = tiles[0]; tiles[0] = tiles[tiles.length - 1]; tiles[tiles.length - 1] = tmp;
    }
    currentSpellingTray = tiles;

    renderSpellingBuilderUI();

    const headerBadge = document.getElementById('kidQuizHeaderBadge');
    if (headerBadge) {
      headerBadge.innerText = `🔤 Spelling Bee • Build the Word (${uncompletedItems.length} left)`;
    }
    // Pronounce clue word
    if (typeof window.speakNativeAudio === 'function') {
      window.speakNativeAudio(target, 'en-US');
    }
  }

  function renderSpellingBuilderUI() {
    const clueEmoji = document.getElementById('spellingClueEmoji');
    const clueMeaning = document.getElementById('spellingClueMeaning');
    const slotsRow = document.getElementById('spellingSlotsRow');
    const trayRow = document.getElementById('spellingTilesTray');
    const toast = document.getElementById('kidQuizFeedbackToast');
    if (toast && !isSpellingResolving) toast.classList.add('hidden');

    if (clueEmoji && currentSpellingItem) clueEmoji.innerText = currentSpellingItem.emoji || '🐝';
    if (clueMeaning && currentSpellingItem) {
      if (spellingHintRevealed) {
        clueMeaning.innerText = currentSpellingItem.meaning || `Spell "${currentSpellingWord}"`;
      } else {
        clueMeaning.innerText = "Spell this word! Tap the scrambled letter tiles below.";
      }
    }

    // Render slots
    if (slotsRow) {
      const firstEmptyIdx = currentSpellingSlots.findIndex(s => s === null);
      slotsRow.innerHTML = currentSpellingSlots.map((slot, idx) => {
        if (slot) {
          return `
            <button onclick="removeSpellingSlot(${idx})" title="Tap to remove letter back to tray" class="animate-tile-pop w-11 h-13 sm:w-14 sm:h-16 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl sm:text-3xl border-4 border-amber-500 shadow-md flex items-center justify-center cursor-pointer transition transform hover:scale-105 active:scale-95 group relative">
              <span>${slot.char}</span>
              <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">✕</span>
            </button>
          `;
        } else {
          const isNext = (idx === firstEmptyIdx);
          return `
            <div class="w-11 h-13 sm:w-14 sm:h-16 rounded-2xl border-4 ${isNext ? 'border-amber-400 bg-amber-50/80 animate-pulse' : 'border-dashed border-slate-300 bg-slate-50/60'} text-slate-400 font-extrabold text-2xl sm:text-3xl flex items-center justify-center select-none transition">
              _
            </div>
          `;
        }
      }).join('');
    }

    // Render tray
    if (trayRow) {
      trayRow.innerHTML = currentSpellingTray.map((tile, tIdx) => {
        if (tile.used) {
          return `
            <button disabled class="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-100 text-slate-300 font-black text-xl sm:text-2xl border-2 border-slate-200 opacity-25 pointer-events-none scale-90 flex items-center justify-center select-none transition">
              ${tile.char}
            </button>
          `;
        } else {
          return `
            <button onclick="placeSpellingTile(${tIdx})" class="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xl sm:text-2xl border-b-4 border-amber-600 shadow-md active:translate-y-1 active:border-b-0 hover:scale-105 flex items-center justify-center cursor-pointer select-none transition btn-tactile">
              ${tile.char}
            </button>
          `;
        }
      }).join('');
    }
  }

  function placeSpellingTile(tIdx) {
    if (isSpellingResolving) return;
    const tile = currentSpellingTray[tIdx];
    if (!tile || tile.used) return;

    const slotIdx = currentSpellingSlots.findIndex(s => s === null);
    if (slotIdx === -1) return; // All slots full

    tile.used = true;
    currentSpellingSlots[slotIdx] = { char: tile.char, trayIdx: tIdx };
    renderSpellingBuilderUI();
    checkSpellingCompletion();
  }

  function removeSpellingSlot(slotIdx) {
    if (isSpellingResolving) return;
    const slot = currentSpellingSlots[slotIdx];
    if (!slot) return;

    if (currentSpellingTray[slot.trayIdx]) {
      currentSpellingTray[slot.trayIdx].used = false;
    }
    currentSpellingSlots[slotIdx] = null;
    renderSpellingBuilderUI();
  }

  function undoSpellingLastSlot() {
    if (isSpellingResolving) return;
    for (let i = currentSpellingSlots.length - 1; i >= 0; i--) {
      if (currentSpellingSlots[i] !== null) {
        removeSpellingSlot(i);
        return;
      }
    }
  }

  function clearSpellingSlots() {
    if (isSpellingResolving) return;
    currentSpellingSlots = new Array(currentSpellingWord.length).fill(null);
    currentSpellingTray.forEach(t => t.used = false);
    renderSpellingBuilderUI();
  }

  function giveSpellingHint() {
    if (isSpellingResolving) return;
    const target = currentSpellingWord;
    let hintSlotIdx = -1;
    for (let i = 0; i < target.length; i++) {
      if (!currentSpellingSlots[i] || currentSpellingSlots[i].char !== target[i]) {
        hintSlotIdx = i;
        break;
      }
    }
    if (hintSlotIdx === -1) return; // already complete

    if (currentSpellingSlots[hintSlotIdx]) {
      removeSpellingSlot(hintSlotIdx);
    }

    const targetChar = target[hintSlotIdx];
    let foundTrayIdx = currentSpellingTray.findIndex(t => !t.used && t.char === targetChar);
    if (foundTrayIdx === -1) {
      for (let i = hintSlotIdx + 1; i < currentSpellingSlots.length; i++) {
        if (currentSpellingSlots[i] && currentSpellingSlots[i].char === targetChar) {
          removeSpellingSlot(i);
          break;
        }
      }
      foundTrayIdx = currentSpellingTray.findIndex(t => !t.used && t.char === targetChar);
    }

    if (foundTrayIdx !== -1) {
      currentSpellingTray[foundTrayIdx].used = true;
      currentSpellingSlots[hintSlotIdx] = { char: targetChar, trayIdx: foundTrayIdx };
      renderSpellingBuilderUI();
      checkSpellingCompletion();
    }
  }

  function speakSpellingTargetWord() {
    if (currentSpellingWord && typeof window.speakNativeAudio === 'function') {
      window.speakNativeAudio(currentSpellingWord, 'en-US');
    }
  }

  function checkSpellingCompletion() {
    if (currentSpellingSlots.some(s => s === null)) return;

    const assembled = currentSpellingSlots.map(s => s.char).join('');
    const target = currentSpellingWord;
    const toast = document.getElementById('kidQuizFeedbackToast');
    const slotsRow = document.getElementById('spellingSlotsRow');

    if (assembled === target) {
      isSpellingResolving = true;
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 85, spread: 80, origin: { y: 0.6 } });
      }

      if (slotsRow) {
        slotsRow.querySelectorAll('button').forEach(btn => {
          btn.className = "w-11 h-13 sm:w-14 sm:h-16 rounded-2xl bg-emerald-500 text-white font-black text-2xl sm:text-3xl border-4 border-emerald-600 shadow-lg flex items-center justify-center animate-bounce";
        });
      }

      if (toast) {
        toast.className = "mt-5 p-4 rounded-2xl text-center text-lg font-bold bg-emerald-100 text-emerald-950 border-2 border-emerald-400";
        toast.innerHTML = `🎉 Super Speller! You built <strong>${target}</strong>! (+20 Stars ⭐)`;
        toast.classList.remove('hidden');
      }

      if (typeof window.speakNativeAudio === 'function') {
        window.speakNativeAudio(`Awesome! ${target.split('').join(' ')} spells ${target.toLowerCase()}!`, 'en-US');
      }

      if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
        window.LuminaDB.recordActivity({
          type: 'spelling_bee',
          isQuestion: true,
          domain: '6+ Spelling Bee',
          title: `Build Word: ${target}`,
          xp: 20,
          durationSec: 10
        });
      }
      const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
        ? window.LuminaDB.getActiveProfile()
        : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);
      if (p && window.LuminaDB && typeof window.LuminaDB.markQuestionCompleted === 'function') {
        window.LuminaDB.markQuestionCompleted(p.id, 'spelling_' + target);
      }
      if (typeof window.refreshHeaderUI === 'function') {
        window.refreshHeaderUI();
      }

      setTimeout(() => {
        generateSpellingTileRound();
      }, 1900);
    } else {
      if (!hasFailedFirstAttempt) {
        hasFailedFirstAttempt = true;
        const btnHint = document.getElementById('btnSpellingHint');
        if (btnHint) btnHint.classList.remove('hidden');
      }

      if (slotsRow) {
        slotsRow.classList.remove('animate-tile-shake');
        void slotsRow.offsetWidth;
        slotsRow.classList.add('animate-tile-shake');
        slotsRow.querySelectorAll('button').forEach(btn => {
          btn.classList.add('border-rose-400', 'bg-rose-100', 'text-rose-900');
        });
      }
      if (toast) {
        toast.className = "mt-5 p-4 rounded-2xl text-center text-base sm:text-lg font-bold bg-rose-100 text-rose-950 border-2 border-rose-300";
        toast.innerHTML = `🤔 Almost! That spells <em>${assembled}</em>. Tap a letter to fix it or tap <strong>💡 Show Hint</strong>!`;
        toast.classList.remove('hidden');
      }
      if (typeof window.speakNativeAudio === 'function') {
        window.speakNativeAudio('Not quite, check your letters!', 'en-US');
      }
    }
  }

  function handleSpellingHintClick() {
    if (isSpellingResolving) return;
    spellingHintRevealed = true;
    const clueMeaning = document.getElementById('spellingClueMeaning');
    if (clueMeaning && currentSpellingItem) {
      clueMeaning.innerText = currentSpellingItem.meaning || `Spell "${currentSpellingWord}"`;
    }
    const btnHint = document.getElementById('btnSpellingHint');
    if (btnHint) btnHint.classList.add('hidden');
    giveSpellingHint();
    if (typeof window.speakNativeAudio === 'function') {
      const clueText = currentSpellingItem ? currentSpellingItem.meaning : currentSpellingWord;
      window.speakNativeAudio(`Hint: ${clueText}`, 'en-US');
    }
  }

  window.spellingSubMode = spellingSubMode;
  window.spellingLengthFilter = spellingLengthFilter;
  window.setSpellingSubMode = setSpellingSubMode;
  window.setSpellingLengthFilter = setSpellingLengthFilter;
  window.ensureSpellingLevelBar = ensureSpellingLevelBar;
  window.getAllSpellingItems = getAllSpellingItems;
  window.getGeneratedSpellingQuizQuestions = getGeneratedSpellingQuizQuestions;
  window.handleKidNextQuizBtn = handleKidNextQuizBtn;
  window.generateSpellingTileRound = generateSpellingTileRound;
  window.renderSpellingBuilderUI = renderSpellingBuilderUI;
  window.placeSpellingTile = placeSpellingTile;
  window.removeSpellingSlot = removeSpellingSlot;
  window.undoSpellingLastSlot = undoSpellingLastSlot;
  window.clearSpellingSlots = clearSpellingSlots;
  window.giveSpellingHint = giveSpellingHint;
  window.handleSpellingHintClick = handleSpellingHintClick;
  window.resetCompletedSpellingWords = resetCompletedSpellingWords;
  window.speakSpellingTargetWord = speakSpellingTargetWord;
  window.getCurrentSpellingWord = function () { return currentSpellingWord; };
  window.getCurrentSpellingItem = function () { return currentSpellingItem; };
  window.checkSpellingCompletion = checkSpellingCompletion;
})(window);
