/**
 * Lumina Learning Hub — Tough Words Glossary & Vocabulary Vault Engine
 * Features single-click word lookup, pronunciation, SAT & 6+ Explorer glossaries,
 * and per-profile Tough Words Vault persistence.
 */
(function (window) {
  'use strict';

  const escapeHtml = window.escapeHtml || function (str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  const showToast = function (msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  };

  const TOUGH_WORDS_GLOSSARY = {
    // High-Frequency SAT Vocabulary
    "ubiquitous": {
      pos: "adjective", phonetic: "/juːˈbɪk.wə.təs/",
      def: "Present, appearing, or found everywhere at the same time.",
      simple: "Everywhere you look! Like smartphones or sunlight on Earth.",
      example: "Smartphones have become ubiquitous in modern adolescent life."
    },
    "ephemeral": {
      pos: "adjective", phonetic: "/əˈfem.ər.əl/",
      def: "Lasting for a very short, fleeting period of time.",
      simple: "Short-lived! Like a shooting star or a soap bubble.",
      example: "The ephemeral beauty of cherry blossoms lasts for just a few days each spring."
    },
    "pragmatic": {
      pos: "adjective", phonetic: "/præɡˈmæt.ɪk/",
      def: "Dealing with things sensibly and realistically based on practical rather than theoretical considerations.",
      simple: "Practical and realistic — focused on what really works in real life.",
      example: "The engineer proposed a pragmatic solution that reduced costs without sacrificing safety."
    },
    "ameliorate": {
      pos: "verb", phonetic: "/əˈmiː.li.ə.reɪt/",
      def: "To make something bad, unsatisfactory, or painful much better.",
      simple: "To make things better or improve a tough situation.",
      example: "New medical research helped ameliorate the patients' symptoms."
    },
    "superfluous": {
      pos: "adjective", phonetic: "/suːˈpɜː.flu.əs/",
      def: "Exceeding what is sufficient or necessary; extra and unneeded.",
      simple: "Extra stuff you don't actually need.",
      example: "The editor eliminated superfluous words to make the essay concise."
    },
    "substantiate": {
      pos: "verb", phonetic: "/səbˈstæn.ʃi.eɪt/",
      def: "To provide evidence or proof to support or demonstrate the truth of something.",
      simple: "To prove with solid evidence and facts.",
      example: "The scientist published rigorous lab data to substantiate her hypothesis."
    },
    "anachronism": {
      pos: "noun", phonetic: "/əˈnæk.rə.nɪ.zəm/",
      def: "Something or someone that is chronologically out of place in history.",
      simple: "Something from the wrong time period (like a Roman soldier holding a smartphone).",
      example: "Seeing an airplane flying over the medieval battlefield in the movie was an obvious anachronism."
    },
    "lucid": {
      pos: "adjective", phonetic: "/ˈluː.sɪd/",
      def: "Expressed clearly; very easy to comprehend and understand.",
      simple: "Crystal clear and easy to follow.",
      example: "The professor gave a lucid explanation of quantum mechanics."
    },
    "mitigate": {
      pos: "verb", phonetic: "/ˈmɪt.ɪ.ɡeɪt/",
      def: "To make less severe, serious, or painful.",
      simple: "To lessen harm or ease a problem.",
      example: "Planting mangroves along coastlines helps mitigate storm surge flooding."
    },
    "resilient": {
      pos: "adjective", phonetic: "/rɪˈzɪl.jənt/",
      def: "Able to withstand or recover quickly from difficult conditions or adversity.",
      simple: "Bouncing back strong when things get hard.",
      example: "Desert cacti are resilient plants that endure long droughts."
    },
    "sagacious": {
      pos: "adjective", phonetic: "/səˈɡeɪ.ʃəs/",
      def: "Having or showing keen mental discernment and good judgment; wise.",
      simple: "Wise and having great judgment.",
      example: "The tribal elder gave sagacious counsel to the young leaders."
    },
    "tenacious": {
      pos: "adjective", phonetic: "/təˈneɪ.ʃəs/",
      def: "Tending to keep a firm hold of something; persistent and determined.",
      simple: "Never giving up! Holding on tight to your goals.",
      example: "Her tenacious study habits earned her top marks on the SAT."
    },
    "alacrity": {
      pos: "noun", phonetic: "/əˈlæk.rə.ti/",
      def: "Brisk, cheerful, and eager readiness to do something.",
      simple: "Excited speed and enthusiasm to jump into action.",
      example: "The puppies sprinted into the yard with joyful alacrity."
    },
    "deleterious": {
      pos: "adjective", phonetic: "/ˌdel.ɪˈtɪə.ri.əs/",
      def: "Causing harm, destruction, or damage.",
      simple: "Harmful or bad for health and nature.",
      example: "Chronic sleep deprivation causes deleterious effects on memory."
    },
    "empathy": {
      pos: "noun", phonetic: "/ˈem.pə.θi/",
      def: "The ability to understand and share the feelings of another.",
      simple: "Understanding and caring about how someone else feels inside.",
      example: "Reading diverse novels builds empathy for people from all backgrounds."
    },
    "innocuous": {
      pos: "adjective", phonetic: "/ɪˈnɒk.ju.əs/",
      def: "Not harmful, toxic, or offensive.",
      simple: "Completely harmless (safe).",
      example: "The garden snake looked scary to Maya, but it was completely innocuous."
    },
    "prolific": {
      pos: "adjective", phonetic: "/prəˈlɪf.ɪk/",
      def: "Producing much fruit or foliage or many works.",
      simple: "Creating lots and lots of wonderful things.",
      example: "The prolific author wrote over forty adventure novels in her lifetime."
    },
    // 6+ Explorer Science & Story Words
    "chrysalis": {
      pos: "noun", phonetic: "/ˈkrɪs.ə.lɪs/",
      def: "The hard protective shell inside which a caterpillar transforms into a butterfly.",
      simple: "A magical sleeping pod where a caterpillar turns into a butterfly!",
      example: "The green chrysalis hung quietly beneath the milkweed leaf."
    },
    "nocturnal": {
      pos: "adjective", phonetic: "/nɒkˈtɜː.nəl/",
      def: "Active primarily during the night rather than daytime.",
      simple: "Awake and active at night, and sleeping all day (like an owl or bat).",
      example: "Barn owls are nocturnal hunters with amazing night eyesight."
    },
    "photosynthesis": {
      pos: "noun", phonetic: "/ˌfəʊ.təʊˈsɪn.θə.sɪs/",
      def: "The chemical process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water.",
      simple: "How plants use sunshine and water to cook their own food!",
      example: "Green leaves absorb golden sunlight to carry out photosynthesis."
    },
    "pollinate": {
      pos: "verb", phonetic: "/ˈpɒl.ə.neɪt/",
      def: "To transfer pollen to a flower or plant to allow fertilization and seed formation.",
      simple: "Moving yellow pollen from flower to flower so fruit and seeds can grow.",
      example: "Fuzzy honeybees pollinate apple trees in the farm orchard."
    },
    "habitat": {
      pos: "noun", phonetic: "/ˈhæb.ɪ.tæt/",
      def: "The natural home or environment of an animal, plant, or other organism.",
      simple: "The special natural home where an animal or plant lives best.",
      example: "The coral reef provides a colorful habitat for clownfish and sea turtles."
    },
    "camouflage": {
      pos: "noun / verb", phonetic: "/ˈkæm.ə.flɑːʒ/",
      def: "Natural coloring or patterns that help an animal blend in with its surroundings.",
      simple: "Nature's invisible cloak! Blending in with trees, sand, or snow.",
      example: "The chameleon used green camouflage to hide among leafy branches."
    },
    "hibernate": {
      pos: "verb", phonetic: "/ˈhaɪ.bə.neɪt/",
      def: "To spend the winter in a dormant, deep sleeping state to save energy.",
      simple: "Taking a super-long cozy winter sleep to save energy until warm spring.",
      example: "Bears eat berries in autumn so they can hibernate safely through winter."
    },
    "fossil": {
      pos: "noun", phonetic: "/ˈfɒs.əl/",
      def: "The preserved remains or traces of an ancient plant or animal preserved in rock.",
      simple: "Ancient footprints or bones turned into hard stone over millions of years!",
      example: "The paleontologist uncovered a dinosaur footprint fossil on the cliff."
    },
    "metamorphosis": {
      pos: "noun", phonetic: "/ˌmet.əˈmɔː.fə.sɪs/",
      def: "A complete physical transformation in the shape or structure of an animal during its life cycle.",
      simple: "A complete body transformation, like a tadpole turning into a leaping frog!",
      example: "A tadpole undergoes metamorphosis to become an adult frog."
    },
    "constellation": {
      pos: "noun", phonetic: "/ˌkɒn.stəˈleɪ.ʃən/",
      def: "A recognizable group of stars forming a pattern in the night sky.",
      simple: "A dot-to-dot picture of stars in the night sky (like the Big Dipper!).",
      example: "Orion is a famous constellation with three bright stars in its belt."
    },
    // SAT Academic Vocabulary Expansion (A)
    "negligible": {
      pos: "adjective", phonetic: "/ˈneɡ.lɪ.dʒə.bəl/",
      def: "So small or unimportant as to be not worth considering; insignificant.",
      simple: "Tiny in amount — so small it barely matters.",
      example: "The error in the measurement was negligible and did not change the result."
    },
    "instrumental": {
      pos: "adjective", phonetic: "/ˌɪn.strəˈmen.təl/",
      def: "Serving as a means or tool in bringing about a result; very helpful or important.",
      simple: "Playing a key part in making something happen.",
      example: "Her research was instrumental in developing the new vaccine."
    },
    "conform": {
      pos: "verb", phonetic: "/kənˈfɔːm/",
      def: "To comply with rules, standards, or conventions; to behave like others.",
      simple: "To follow the rules or fit in with the group.",
      example: "All products must conform to strict safety standards."
    },
    "convention": {
      pos: "noun", phonetic: "/kənˈven.ʃən/",
      def: "A widely accepted way of behaving or doing things; also a large formal meeting.",
      simple: "The usual, accepted way things are done.",
      example: "By convention, essays begin with an introduction and end with a conclusion."
    },
    "dissent": {
      pos: "noun / verb", phonetic: "/dɪˈsent/",
      def: "A strong difference of opinion, especially from the official or majority view.",
      simple: "Disagreeing with the group or the people in charge.",
      example: "The judge wrote a powerful dissent arguing the law was unfair."
    },
    "distinction": {
      pos: "noun", phonetic: "/dɪˈstɪŋk.ʃən/",
      def: "A difference or contrast between similar things; also excellence or honor.",
      simple: "A clear difference that sets things apart.",
      example: "The author draws a sharp distinction between fact and opinion."
    },
    "perspective": {
      pos: "noun", phonetic: "/pəˈspek.tɪv/",
      def: "A particular attitude toward or way of regarding something; a point of view.",
      simple: "How something looks from your point of view.",
      example: "The memoir is told from the perspective of a young refugee."
    },
    "emphasize": {
      pos: "verb", phonetic: "/ˈem.fə.saɪz/",
      def: "To give special importance or prominence to something in speaking or writing.",
      simple: "To stress or highlight what matters most.",
      example: "The teacher emphasized the need to cite evidence from the text."
    },
    "primarily": {
      pos: "adverb", phonetic: "/praɪˈmer.əl.i/",
      def: "For the most part; mainly; chiefly.",
      simple: "Mainly; most of all.",
      example: "The festival is primarily a celebration of local farmers."
    },
    "literary": {
      pos: "adjective", phonetic: "/ˈlɪt.ər.ər.i/",
      def: "Related to literature, writing, or the study of books and written works.",
      simple: "Having to do with books and great writing.",
      example: "The novel is praised for its rich literary style and symbolism."
    },
    "sequence": {
      pos: "noun", phonetic: "/ˈsiː.kwəns/",
      def: "A particular order in which related events, movements, or things follow each other.",
      simple: "Things arranged in an order, one after another.",
      example: "The DNA sequence determines many inherited traits."
    },
    "species": {
      pos: "noun", phonetic: "/ˈspiː.ʃiːz/",
      def: "A group of living organisms consisting of similar individuals able to breed together.",
      simple: "A kind or type of animal or plant.",
      example: "Over 300 species of birds migrate through the valley each spring."
    },
    "circumference": {
      pos: "noun", phonetic: "/səˈkʌm.fər.əns/",
      def: "The distance around the edge of a circle or round object.",
      simple: "The distance all the way around a circle.",
      example: "The circumference of the wheel is about two meters."
    },
    "drought": {
      pos: "noun", phonetic: "/draʊt/",
      def: "A long period of abnormally low rainfall leading to a shortage of water.",
      simple: "A long stretch with almost no rain.",
      example: "The drought dried up the reservoirs across the region."
    },
    "glucose": {
      pos: "noun", phonetic: "/ˈɡluː.kəʊs/",
      def: "A simple sugar that is an important energy source in living organisms.",
      simple: "A natural sugar our bodies use for energy.",
      example: "Plants produce glucose during photosynthesis."
    },
    "bacteria": {
      pos: "noun (plural)", phonetic: "/bækˈtɪə.ri.ə/",
      def: "Microscopic single-celled organisms, some helpful and some causing disease.",
      simple: "Tiny living germs — some good, some make us sick.",
      example: "Helpful bacteria in yogurt aid digestion."
    },
    "hypothesis": {
      pos: "noun", phonetic: "/haɪˈpɒθ.ə.sɪs/",
      def: "A proposed explanation made on limited evidence, used as a starting point for testing.",
      simple: "A smart, testable guess a scientist tries to prove.",
      example: "Her hypothesis was that plants grow faster under blue light."
    },
    "phenomenon": {
      pos: "noun", phonetic: "/fɪˈnɒm.ɪ.nən/",
      def: "An observable fact or event, especially one that is unusual or difficult to explain.",
      simple: "Something interesting that happens and can be observed.",
      example: "The aurora is a natural phenomenon visible near the poles."
    },
    "considerable": {
      pos: "adjective", phonetic: "/kənˈsɪd.ər.ə.bəl/",
      def: "Notably large in size, amount, or extent; significant.",
      simple: "A lot; large enough to matter.",
      example: "The project required a considerable amount of funding."
    },
    "significant": {
      pos: "adjective", phonetic: "/sɪɡˈnɪf.ɪ.kənt/",
      def: "Sufficiently great or important to be worthy of attention; meaningful.",
      simple: "Important and worth noticing.",
      example: "The study found a significant link between sleep and memory."
    },
    "demonstrate": {
      pos: "verb", phonetic: "/ˈdem.ən.streɪt/",
      def: "To clearly show the existence or truth of something by giving proof or evidence.",
      simple: "To show or prove something clearly.",
      example: "The experiment demonstrates how sound travels through water."
    },
    "indicate": {
      pos: "verb", phonetic: "/ˈɪn.dɪ.keɪt/",
      def: "To point out, show, or suggest something as a sign.",
      simple: "To point to or give a sign of something.",
      example: "Dark clouds indicate that rain is likely."
    },
    "establish": {
      pos: "verb", phonetic: "/ɪˈstæb.lɪʃ/",
      def: "To set up or prove something firmly and permanently; to discover and prove a fact.",
      simple: "To set something up solidly, or to prove it true.",
      example: "The evidence helped establish the author's identity."
    },
    "constitute": {
      pos: "verb", phonetic: "/ˈkɒn.stɪ.tʃuːt/",
      def: "To be the elements or parts that form something; to amount to.",
      simple: "To make up or form something.",
      example: "Twelve members constitute the full committee."
    },
    "derive": {
      pos: "verb", phonetic: "/dɪˈraɪv/",
      def: "To obtain or get something from a source; to develop or come from.",
      simple: "To get or come from something else.",
      example: "Many English words derive from Latin."
    },
    "inherent": {
      pos: "adjective", phonetic: "/ɪnˈhɪə.rənt/",
      def: "Existing as a permanent, natural, and essential quality of something.",
      simple: "Built-in; a natural part of something.",
      example: "Climbing involves an inherent risk of falling."
    },
    "implicit": {
      pos: "adjective", phonetic: "/ɪmˈplɪs.ɪt/",
      def: "Suggested or understood without being directly stated.",
      simple: "Implied — hinted at, not said out loud.",
      example: "His silence was taken as implicit agreement."
    },
    "explicit": {
      pos: "adjective", phonetic: "/ɪkˈsplɪs.ɪt/",
      def: "Stated clearly and in detail, leaving no room for confusion or doubt.",
      simple: "Said directly and super clearly.",
      example: "The instructions gave explicit steps for the experiment."
    },
    "ambiguous": {
      pos: "adjective", phonetic: "/æmˈbɪɡ.ju.əs/",
      def: "Open to more than one interpretation; not having one clear meaning.",
      simple: "Unclear — it could mean two different things.",
      example: "The ending of the poem is deliberately ambiguous."
    },
    "coherent": {
      pos: "adjective", phonetic: "/kəʊˈhɪə.rənt/",
      def: "Logical and consistent; clearly organized and easy to follow.",
      simple: "Making sense as a whole; well organized.",
      example: "She presented a coherent argument supported by data."
    },
    "comprehensive": {
      pos: "adjective", phonetic: "/ˌkɒm.prɪˈhen.sɪv/",
      def: "Complete and including all or nearly all elements or aspects of something.",
      simple: "Complete — covering everything.",
      example: "The report provides a comprehensive review of climate studies."
    },
    "concise": {
      pos: "adjective", phonetic: "/kənˈsaɪs/",
      def: "Giving a lot of information clearly and in few words; brief but complete.",
      simple: "Short and clear, with no wasted words.",
      example: "Keep your summary concise — just the main ideas."
    },
    "conjecture": {
      pos: "noun / verb", phonetic: "/kənˈdʒek.tʃər/",
      def: "An opinion or conclusion formed on the basis of incomplete information; a guess.",
      simple: "An educated guess without full proof.",
      example: "Without the missing fossils, the theory remains conjecture."
    },
    "contemporary": {
      pos: "adjective", phonetic: "/kənˈtem.pər.ər.i/",
      def: "Living or occurring at the same time; belonging to the present time.",
      simple: "From the same time period, or modern.",
      example: "Contemporary poets often write about city life."
    },
    "contradict": {
      pos: "verb", phonetic: "/ˌkɒn.trəˈdɪkt/",
      def: "To say the opposite of what someone else has said; to be in conflict with.",
      simple: "To say the opposite — to go against.",
      example: "The new data contradict the earlier findings."
    },
    "convey": {
      pos: "verb", phonetic: "/kənˈveɪ/",
      def: "To communicate or express an idea, feeling, or message.",
      simple: "To pass along an idea or feeling.",
      example: "The poet uses ocean imagery to convey loneliness."
    },
    "criterion": {
      pos: "noun", phonetic: "/kraɪˈtɪə.ri.ən/",
      def: "A principle or standard by which something may be judged or decided.",
      simple: "A rule or standard used for judging.",
      example: "The main criterion for the award is originality."
    },
    "crucial": {
      pos: "adjective", phonetic: "/ˈkruː.ʃəl/",
      def: "Decisive or critically important, especially for success or failure.",
      simple: "Extremely important — make-or-break.",
      example: "The final experiment was crucial to proving the theory."
    },
    "depict": {
      pos: "verb", phonetic: "/dɪˈpɪkt/",
      def: "To represent or show something in a picture, story, or description.",
      simple: "To show or describe something in words or pictures.",
      example: "The mural depicts scenes from the town's history."
    },
    "discourse": {
      pos: "noun", phonetic: "/ˈdɪs.kɔːs/",
      def: "Written or spoken communication or debate; serious discussion of a topic.",
      simple: "Serious talk or writing about a topic.",
      example: "The essay changed public discourse about education."
    },
    "discrete": {
      pos: "adjective", phonetic: "/dɪˈskriːt/",
      def: "Individually separate and distinct; clearly defined.",
      simple: "Separate and clearly apart from others.",
      example: "The process has three discrete stages."
    },
    "diverse": {
      pos: "adjective", phonetic: "/daɪˈvɜːs/",
      def: "Showing a great deal of variety; very different from each other.",
      simple: "Many different kinds mixed together.",
      example: "The rainforest hosts an incredibly diverse range of species."
    },
    "domain": {
      pos: "noun", phonetic: "/dəˈmeɪn/",
      def: "An area of territory, knowledge, or activity that someone controls or studies.",
      simple: "A field or area of knowledge/activity.",
      example: "Genetics is a rapidly growing domain of science."
    },
    // SAT Academic Vocabulary Expansion (B)
    "elaborate": {
      pos: "adjective / verb", phonetic: "/iˈlæb.ər.ət/",
      def: "Involving many carefully arranged parts or details; to develop or explain in detail.",
      simple: "Detailed and carefully worked out.",
      example: "The author built an elaborate metaphor across the whole novel."
    },
    "emerge": {
      pos: "verb", phonetic: "/ɪˈmɜːdʒ/",
      def: "To become apparent, known, or visible; to come out into view.",
      simple: "To appear or come out into the open.",
      example: "New evidence began to emerge during the investigation."
    },
    "empirical": {
      pos: "adjective", phonetic: "/ɪmˈpɪr.ɪ.kəl/",
      def: "Based on observation, experiment, or experience rather than theory or pure logic.",
      simple: "Proven by testing and seeing, not just thinking.",
      example: "The theory gained support from empirical studies."
    },
    "encounter": {
      pos: "verb / noun", phonetic: "/ɪnˈkaʊn.tər/",
      def: "To unexpectedly face or experience something, especially a difficulty or a person.",
      simple: "To run into something, often a problem.",
      example: "Explorers may encounter harsh weather in the mountains."
    },
    "enhance": {
      pos: "verb", phonetic: "/ɪnˈhɑːns/",
      def: "To intensify, increase, or improve the quality or value of something.",
      simple: "To make something better or stronger.",
      example: "Filters enhance the colors in the photograph."
    },
    "entail": {
      pos: "verb", phonetic: "/ɪnˈteɪl/",
      def: "To involve something as a necessary or inevitable part or consequence.",
      simple: "To include or require something as part of the deal.",
      example: "The job entails long hours and frequent travel."
    },
    "entity": {
      pos: "noun", phonetic: "/ˈen.tɪ.ti/",
      def: "Something with a distinct and independent existence; an organization or being.",
      simple: "A thing that exists on its own, like a company or body.",
      example: "The school became a separate legal entity."
    },
    "equilibrium": {
      pos: "noun", phonetic: "/ˌiː.kwɪˈlɪb.ri.əm/",
      def: "A state in which opposing forces or influences are perfectly balanced.",
      simple: "Perfect balance, with nothing tipping over.",
      example: "The ecosystem stays in equilibrium when predators and prey are balanced."
    },
    "equivalent": {
      pos: "adjective", phonetic: "/ɪˈkwɪv.əl.ənt/",
      def: "Equal in value, amount, function, or meaning.",
      simple: "Equal to; worth the same as.",
      example: "One kilometer is roughly equivalent to 0.62 miles."
    },
    "evaluate": {
      pos: "verb", phonetic: "/ɪˈvæl.ju.eɪt/",
      def: "To judge or calculate the quality, importance, amount, or value of something.",
      simple: "To judge how good or valuable something is.",
      example: "Scientists evaluate the data before drawing conclusions."
    },
    "evident": {
      pos: "adjective", phonetic: "/ˈev.ɪ.dənt/",
      def: "Plain or clear to the sight or understanding; obvious.",
      simple: "Easy to see; obvious.",
      example: "It was evident from the charts that sales had improved."
    },
    "evolve": {
      pos: "verb", phonetic: "/ɪˈvɒlv/",
      def: "To develop gradually over time into a more complex or advanced form.",
      simple: "To change and grow slowly over a long time.",
      example: "Birds evolved from small feathered dinosaurs."
    },
    "exceed": {
      pos: "verb", phonetic: "/ɪkˈsiːd/",
      def: "To be greater in number or size than something; to go beyond a limit.",
      simple: "To go over or be more than something.",
      example: "The results exceeded everyone's expectations."
    },
    "exclude": {
      pos: "verb", phonetic: "/ɪkˈskluːd/",
      def: "To deliberately leave something out; to deny someone access or participation.",
      simple: "To leave out on purpose.",
      example: "The study excluded participants under eighteen."
    },
    "exhibit": {
      pos: "verb / noun", phonetic: "/ɪɡˈzɪb.ɪt/",
      def: "To show, display, or demonstrate a quality or object publicly.",
      simple: "To show or display something.",
      example: "Many patients exhibit similar early symptoms."
    },
    "feasible": {
      pos: "adjective", phonetic: "/ˈfiː.zə.bəl/",
      def: "Possible and practical to do easily or conveniently.",
      simple: "Doable — realistically possible.",
      example: "It is not feasible to finish the bridge in one month."
    },
    "fluctuate": {
      pos: "verb", phonetic: "/ˈflʌk.tʃu.eɪt/",
      def: "To rise and fall irregularly in number or amount; to vary unpredictably.",
      simple: "To go up and down, not staying steady.",
      example: "Temperatures fluctuate widely in the desert."
    },
    "formulate": {
      pos: "verb", phonetic: "/ˈfɔː.mjə.leɪt/",
      def: "To create or prepare a plan, theory, or method in detail.",
      simple: "To work out a clear plan or idea.",
      example: "The team formulated a hypothesis before experimenting."
    },
    "fundamental": {
      pos: "adjective", phonetic: "/ˌfʌn.dəˈmen.təl/",
      def: "Forming a necessary base or core; of central importance.",
      simple: "Basic and most important.",
      example: "Reading is a fundamental skill for every subject."
    },
    "generate": {
      pos: "verb", phonetic: "/ˈdʒen.ə.reɪt/",
      def: "To produce, create, or bring something into existence.",
      simple: "To make or produce something.",
      example: "Wind turbines generate clean electricity."
    },
    "identical": {
      pos: "adjective", phonetic: "/aɪˈden.tɪ.kəl/",
      def: "Exactly alike in every way; the same.",
      simple: "Exactly the same in every detail.",
      example: "The twin buildings are nearly identical."
    },
    "ideology": {
      pos: "noun", phonetic: "/ˌaɪ.diˈɒl.ə.dʒi/",
      def: "A system of ideas and ideals, especially forming a political or economic theory.",
      simple: "A set of beliefs that guides a person or group.",
      example: "The movement's ideology centered on equality."
    },
    "illuminate": {
      pos: "verb", phonetic: "/ɪˈluː.mɪ.neɪt/",
      def: "To light something up; to clarify or help explain a subject.",
      simple: "To light up, or to make something clear.",
      example: "The letters illuminate the poet's later life."
    },
    "illustrate": {
      pos: "verb", phonetic: "/ˈɪl.ə.streɪt/",
      def: "To clarify something by giving an example or providing pictures.",
      simple: "To explain using examples or pictures.",
      example: "The graph illustrates how temperatures have risen."
    },
    "immense": {
      pos: "adjective", phonetic: "/ɪˈmens/",
      def: "Extremely large or great, especially in scale or degree.",
      simple: "Huge — enormously big.",
      example: "The canyon's immense size amazed the visitors."
    },
    "implement": {
      pos: "verb / noun", phonetic: "/ˈɪm.plɪ.ment/",
      def: "To put a plan, decision, or system into effect; a tool or piece of equipment.",
      simple: "To actually carry out a plan.",
      example: "The school will implement the new schedule in fall."
    },
    "implication": {
      pos: "noun", phonetic: "/ˌɪm.plɪˈkeɪ.ʃən/",
      def: "A conclusion that can be drawn from something, although it is not explicitly stated; a likely consequence.",
      simple: "What something suggests will follow or mean.",
      example: "The implication of the study is that sleep improves grades."
    },
    "impose": {
      pos: "verb", phonetic: "/ɪmˈpəʊz/",
      def: "To force something unwelcome to be accepted; to establish rules or taxes by authority.",
      simple: "To force a rule or burden on others.",
      example: "The city imposed a tax on plastic bags."
    },
    "incentive": {
      pos: "noun", phonetic: "/ɪnˈsen.tɪv/",
      def: "Something that motivates or encourages someone to do something.",
      simple: "A reward or reason that pushes you to act.",
      example: "Extra credit is an incentive to revise essays."
    },
    "incorporate": {
      pos: "verb", phonetic: "/ɪnˈkɔː.pər.eɪt/",
      def: "To take in or include something as part of a whole; to blend into.",
      simple: "To include something as part of a bigger thing.",
      example: "The recipe incorporates spices from three cultures."
    },
    "induce": {
      pos: "verb", phonetic: "/ɪnˈdjuːs/",
      def: "To succeed in persuading or causing something to happen.",
      simple: "To cause or bring about something.",
      example: "The medicine may induce sleepiness."
    },
    "inevitable": {
      pos: "adjective", phonetic: "/ɪˈnev.ɪ.tə.bəl/",
      def: "Certain to happen; unavoidable.",
      simple: "Impossible to stop or avoid.",
      example: "Change is inevitable as technology advances."
    },
    "infer": {
      pos: "verb", phonetic: "/ɪnˈfɜːr/",
      def: "To conclude something from evidence and reasoning rather than direct statements.",
      simple: "To figure out using clues.",
      example: "From his tone, we can infer that he disagrees."
    },
    "infrastructure": {
      pos: "noun", phonetic: "/ˈɪn.frəˌstrʌk.tʃər/",
      def: "The basic physical systems a society needs, such as roads, bridges, water, and power.",
      simple: "The basic systems — roads, power, water — a place runs on.",
      example: "The city invested in infrastructure after the flood."
    },
    "inhibit": {
      pos: "verb", phonetic: "/ɪnˈhɪb.ɪt/",
      def: "To hinder, restrain, or prevent an action or process.",
      simple: "To hold back or slow something down.",
      example: "Dry conditions inhibit plant growth."
    },
    "innovation": {
      pos: "noun", phonetic: "/ˌɪn.əˈveɪ.ʃən/",
      def: "A new method, idea, product, or way of doing something.",
      simple: "A brand-new idea or invention.",
      example: "The smartphone was a major innovation in communication."
    },
    "insight": {
      pos: "noun", phonetic: "/ˈɪn.saɪt/",
      def: "A deep, accurate understanding of a person or situation.",
      simple: "A clear, deep understanding of something.",
      example: "Her diary provides insight into life during the war."
    },
    "integral": {
      pos: "adjective", phonetic: "/ˈɪn.tɪ.ɡrəl/",
      def: "Necessary to make a whole complete; essential or fundamental.",
      simple: "A necessary part of the whole.",
      example: "Teamwork is integral to the project's success."
    },
    "integrate": {
      pos: "verb", phonetic: "/ˈɪn.tɪ.ɡreɪt/",
      def: "To combine parts into a unified whole; to bring into full membership.",
      simple: "To combine into one working whole.",
      example: "The course integrates art with science."
    },
    "intense": {
      pos: "adjective", phonetic: "/ɪnˈtens/",
      def: "Of extreme force, degree, or strength; deeply felt.",
      simple: "Very strong or powerful.",
      example: "The intense heat forced the marathon to start earlier."
    },
    "interact": {
      pos: "verb", phonetic: "/ˌɪn.tərˈækt/",
      def: "To act in such a way that one affects the other; to communicate or work together.",
      simple: "To affect each other or work together.",
      example: "Bees and flowers interact in pollination."
    },
    "interpret": {
      pos: "verb", phonetic: "/ɪnˈtɜː.prɪt/",
      def: "To explain the meaning of information, words, or actions.",
      simple: "To explain what something means.",
      example: "Historians interpret the letter as a peace offer."
    },
    // SAT Academic Vocabulary Expansion (C)
    "intervene": {
      pos: "verb", phonetic: "/ˌɪn.təˈviːn/",
      def: "To come between people or events in order to change what happens or prevent something.",
      simple: "To step in during a situation to change how it goes.",
      example: "The mediator had to intervene when the negotiations began to break down."
    },
    "intrinsic": {
      pos: "adjective", phonetic: "/ɪnˈtrɪn.zɪk/",
      def: "Belonging naturally to something; part of its essential nature rather than added from outside.",
      simple: "Built into something itself — part of what it truly is.",
      example: "The intrinsic value of the old coins far exceeded their face value."
    },
    "invoke": {
      pos: "verb", phonetic: "/ɪnˈvəʊk/",
      def: "To refer to or call upon something — a law, idea, memory, or feeling — for support or effect.",
      simple: "To bring up or call on something for help or impact.",
      example: "The author invokes Greek mythology to frame the hero's journey."
    },
    "isolate": {
      pos: "verb", phonetic: "/ˈaɪ.sə.leɪt/",
      def: "To separate something or someone from others; to identify a single element apart from a group.",
      simple: "To set something apart, all by itself.",
      example: "Scientists were able to isolate the chemical that caused the reaction."
    },
    "justify": {
      pos: "verb", phonetic: "/ˈdʒʌs.tɪ.faɪ/",
      def: "To show or prove that something is right, reasonable, or deserved.",
      simple: "To give good reasons that prove something is fair or right.",
      example: "The author justifies the character's harsh decision by revealing her difficult past."
    },
    "manifest": {
      pos: "verb / adjective", phonetic: "/ˈmæn.ɪ.fest/",
      def: "To display or show a quality or feeling clearly; as an adjective, clear or obvious to see.",
      simple: "To show clearly; easy to see and recognize.",
      example: "Anxiety can manifest as trouble sleeping in the weeks before a major exam."
    },
    "marginal": {
      pos: "adjective", phonetic: "/ˈmɑː.dʒɪ.nəl/",
      def: "Of minor importance or effect; small, or barely at the edge of being acceptable.",
      simple: "Very small or barely important.",
      example: "The new policy had only a marginal effect on overall emissions."
    },
    "mechanism": {
      pos: "noun", phonetic: "/ˈmek.ə.nɪ.zəm/",
      def: "A system of parts working together, or the process by which something happens.",
      simple: "The way something works, step by step.",
      example: "The study explains the mechanism by which plants store energy from sunlight."
    },
    "metaphor": {
      pos: "noun", phonetic: "/ˈmet.ə.fɔːr/",
      def: "A figure of speech that describes one thing as if it were another, in order to show a hidden similarity.",
      simple: "Saying one thing IS another to make a point — like 'time is a thief.'",
      example: "The poet uses the metaphor of a long journey to describe growing up."
    },
    "minimize": {
      pos: "verb", phonetic: "/ˈmɪn.ɪ.maɪz/",
      def: "To reduce something to the smallest possible amount or degree; to treat it as less important than it is.",
      simple: "To make something as small as possible.",
      example: "Wearing a seatbelt minimizes the risk of serious injury in a crash."
    },
    "modify": {
      pos: "verb", phonetic: "/ˈmɒd.ɪ.faɪ/",
      def: "To change something slightly, usually to improve it or make it more suitable for a purpose.",
      simple: "To change a little, to make it better or fit better.",
      example: "The engineers modified the design after the first test flight failed."
    },
    "mutual": {
      pos: "adjective", phonetic: "/ˈmjuː.tʃu.əl/",
      def: "Felt, done, or shared by two or more people toward each other.",
      simple: "Shared both ways — each side feels or does it too.",
      example: "The two nations reached an agreement based on mutual respect."
    },
    "nevertheless": {
      pos: "adverb", phonetic: "/ˌnev.ə.ðəˈles/",
      def: "In spite of that; however; all the same.",
      simple: "Anyway — even though that was true.",
      example: "The hike was exhausting; nevertheless, the view from the summit made it worthwhile."
    },
    "notion": {
      pos: "noun", phonetic: "/ˈnəʊ.ʃən/",
      def: "An idea, belief, or understanding about something.",
      simple: "An idea or belief about something.",
      example: "The essay challenges the notion that success depends only on natural talent."
    },
    "notwithstanding": {
      pos: "preposition / adverb", phonetic: "/ˌnɒt.wɪðˈstæn.dɪŋ/",
      def: "In spite of; despite.",
      simple: "Even though; despite that.",
      example: "Notwithstanding the heavy rain, the festival drew a record crowd."
    },
    "objective": {
      pos: "adjective / noun", phonetic: "/əbˈdʒek.tɪv/",
      def: "As an adjective, based on facts rather than personal feelings; as a noun, a goal or purpose.",
      simple: "Fair and based on facts, not feelings — or, a goal you aim for.",
      example: "A good science report stays objective and reports only what the data show."
    },
    "obtain": {
      pos: "verb", phonetic: "/əbˈteɪn/",
      def: "To get or acquire something, especially through effort or a formal process.",
      simple: "To get something, often by working for it.",
      example: "Researchers obtained water samples from three different lakes."
    },
    "offset": {
      pos: "verb", phonetic: "/ˌɒfˈset/",
      def: "To counteract or balance something, reducing or cancelling out its effect.",
      simple: "To balance out or make up for something.",
      example: "Planting trees helps offset the carbon released by the factory."
    },
    "ongoing": {
      pos: "adjective", phonetic: "/ˈɒnˌɡəʊ.ɪŋ/",
      def: "Continuing to exist or develop; still happening and not yet finished.",
      simple: "Still going on; not finished yet.",
      example: "The investigation is ongoing, and officials have not yet released a conclusion."
    },
    "paradigm": {
      pos: "noun", phonetic: "/ˈpær.ə.daɪm/",
      def: "A typical example or model of something; also a framework of beliefs or methods shared by a group.",
      simple: "A model or pattern that shows how things are usually thought of or done.",
      example: "The discovery created a new paradigm in the study of genetics."
    },
    "paradox": {
      pos: "noun", phonetic: "/ˈpær.ə.dɒks/",
      def: "A statement or situation that seems contradictory or impossible, yet may actually be true.",
      simple: "Something that seems to contradict itself but might still be true.",
      example: "The novel explores the paradox of feeling most alone in a crowded city."
    },
    "parallel": {
      pos: "adjective / noun", phonetic: "/ˈpær.ə.lel/",
      def: "Similar or corresponding in an important way; also describing lines that run side by side and never meet.",
      simple: "Very similar in some way, like matching lines side by side.",
      example: "The two stories follow parallel paths before finally crossing in the last chapter."
    },
    "parameter": {
      pos: "noun", phonetic: "/pəˈræm.ɪ.tər/",
      def: "A limit or boundary that defines how something can be done or measured.",
      simple: "A rule or limit that sets the boundaries.",
      example: "Within the parameters of the study, only adults could participate."
    },
    "partial": {
      pos: "adjective", phonetic: "/ˈpɑː.ʃəl/",
      def: "Not complete; existing only in part. Can also mean biased toward one side.",
      simple: "Only partway — not the whole thing.",
      example: "The new plan was only a partial solution to the traffic problem."
    },
    "participate": {
      pos: "verb", phonetic: "/pɑːˈtɪs.ɪ.peɪt/",
      def: "To take part in an activity or event.",
      simple: "To join in and take part.",
      example: "More students participate in science fairs each year than ever before."
    },
    "passive": {
      pos: "adjective", phonetic: "/ˈpæs.ɪv/",
      def: "Accepting what happens without active response or resistance; not taking action.",
      simple: "Letting things happen without stepping in.",
      example: "Rather than remain passive, the community organized to protect the park."
    },
    "perceive": {
      pos: "verb", phonetic: "/pəˈsiːv/",
      def: "To become aware of something through the senses, or to understand it in a particular way.",
      simple: "To notice something, or see it in a certain way.",
      example: "Readers perceive the narrator as unreliable from the very first chapter."
    },
    "persist": {
      pos: "verb", phonetic: "/pəˈsɪst/",
      def: "To continue firmly or stubbornly, despite difficulty, opposition, or warning.",
      simple: "To keep going and refuse to give up.",
      example: "Even after several failed attempts, she persisted in her experiments."
    },
    "potential": {
      pos: "noun / adjective", phonetic: "/pəˈten.ʃəl/",
      def: "The capacity to develop, become, or succeed in the future; possible but not yet actual.",
      simple: "A hidden ability that could grow into something great.",
      example: "The young violinist showed enormous potential at her first recital."
    },
    "precede": {
      pos: "verb", phonetic: "/prɪˈsiːd/",
      def: "To come before something else in time, order, or position.",
      simple: "To come before something else.",
      example: "A short introduction precedes each chapter of the book."
    },
    "precise": {
      pos: "adjective", phonetic: "/prɪˈsaɪs/",
      def: "Exact, accurate, and clearly defined in every detail.",
      simple: "Exactly right, with no wobble or fuzziness.",
      example: "The scientist recorded a precise measurement of the temperature change."
    },
    "predict": {
      pos: "verb", phonetic: "/prɪˈdɪkt/",
      def: "To say or estimate that something will happen in the future, based on evidence or reasoning.",
      simple: "To say what will probably happen next.",
      example: "Meteorologists predict that the storm will reach the coast by Friday."
    },
    "predominant": {
      pos: "adjective", phonetic: "/prɪˈdɒm.ɪ.nənt/",
      def: "Present as the strongest or most common element; more powerful or noticeable than others.",
      simple: "The biggest or strongest one, standing out the most.",
      example: "The predominant color in the painting is a deep, stormy blue."
    },
    "premise": {
      pos: "noun", phonetic: "/ˈprem.ɪs/",
      def: "A statement or idea that is assumed to be true and used as the basis of an argument or conclusion.",
      simple: "The starting idea that an argument is built on.",
      example: "The essay's premise is that technology changes how we remember the past."
    },
    "preserve": {
      pos: "verb", phonetic: "/prɪˈzɜːv/",
      def: "To keep something in its original or good condition; to protect it from harm, loss, or decay.",
      simple: "To keep something safe and unchanged.",
      example: "The museum works to preserve ancient manuscripts before they crumble."
    },
    "presume": {
      pos: "verb", phonetic: "/prɪˈzjuːm/",
      def: "To suppose that something is true without having proof; to assume.",
      simple: "To assume something is true without checking.",
      example: "We cannot presume the results will be the same in a much larger sample."
    },
    "prevail": {
      pos: "verb", phonetic: "/prɪˈveɪl/",
      def: "To prove more powerful than opposing forces; to succeed or win out in the end.",
      simple: "To win out in the end.",
      example: "After a long and noisy debate, the calmer voices finally prevailed."
    },
    "prohibit": {
      pos: "verb", phonetic: "/prəˈhɪb.ɪt/",
      def: "To formally forbid something by law, rule, or other authority.",
      simple: "To officially not allow something.",
      example: "Park rules prohibit fires outside the marked grills."
    },
    "promote": {
      pos: "verb", phonetic: "/prəˈməʊt/",
      def: "To support or actively encourage the progress, growth, or acceptance of something.",
      simple: "To help something grow or become more popular.",
      example: "The program promotes healthy eating habits in elementary schools."
    },
    "proportion": {
      pos: "noun", phonetic: "/prəˈpɔː.ʃən/",
      def: "The relationship of one part to another part or to the whole, in terms of size or amount.",
      simple: "How big one part is compared to the whole thing.",
      example: "A large proportion of the town's income comes from tourism."
    },
    "propose": {
      pos: "verb", phonetic: "/prəˈpəʊz/",
      def: "To put forward an idea, plan, or suggestion for consideration.",
      simple: "To suggest a plan or idea for others to think about.",
      example: "The committee proposed a new schedule for the public library."
    },
    "prospect": {
      pos: "noun", phonetic: "/ˈprɒs.pekt/",
      def: "The possibility or likelihood of something happening in the future; a future opportunity or outlook.",
      simple: "A chance or hope for what could happen in the future.",
      example: "Graduates faced the prospect of a highly competitive job market."
    },
    "protocol": {
      pos: "noun", phonetic: "/ˈprəʊ.tə.kɒl/",
      def: "An official procedure or system of rules that must be followed, especially in experiments or formal situations.",
      simple: "The official step-by-step rules to follow.",
      example: "Lab protocol requires gloves and goggles when handling the samples."
    },
    "pursue": {
      pos: "verb", phonetic: "/pəˈsjuː/",
      def: "To follow and try to achieve or obtain something over a period of time; to chase.",
      simple: "To keep trying hard to reach a goal.",
      example: "She decided to pursue a degree in environmental science."
    },
    "impact": {
      pos: "noun / verb", phonetic: "/ˈɪm.pækt/",
      def: "A powerful effect that something has on a situation or person; also, the force of one object hitting another.",
      simple: "A strong effect that really changes things.",
      example: "The documentary had a lasting impact on how students viewed ocean pollution."
    },
    "sustain": {
      pos: "verb", phonetic: "/səˈsteɪn/",
      def: "To keep something going over a long period of time; to support or maintain it.",
      simple: "To keep something alive or going for a long time.",
      example: "Small farms must sustain healthy soil to grow food year after year."
    },
    "tentative": {
      pos: "adjective", phonetic: "/ˈten.tə.tɪv/",
      def: "Not yet certain or fixed; done cautiously and without full confidence.",
      simple: "Not decided yet — careful and unsure.",
      example: "The two sides reached a tentative agreement, subject to final approval."
    },
    "subtle": {
      pos: "adjective", phonetic: "/ˈsʌt.əl/",
      def: "So delicate or slight that it is not immediately obvious; difficult to notice or describe.",
      simple: "Small and easy to miss — you have to look closely.",
      example: "A subtle change in the character's tone signals her growing doubt."
    },
    "rigid": {
      pos: "adjective", phonetic: "/ˈrɪdʒ.ɪd/",
      def: "Unable to bend or be changed; stiff, strict, and unyielding.",
      simple: "Stiff and unwilling to change.",
      example: "The rigid schedule left no room for creative projects."
    },
    "robust": {
      pos: "adjective", phonetic: "/rəʊˈbʌst/",
      def: "Strong and able to withstand difficult conditions; of evidence or methods, thorough and convincing.",
      simple: "Strong and sturdy — able to take a beating.",
      example: "The study's robust design made its conclusions hard to dispute."
    },
    "thrive": {
      pos: "verb", phonetic: "/θraɪv/",
      def: "To grow, develop, and succeed vigorously; to flourish.",
      simple: "To grow strong and do really well.",
      example: "These plants thrive in bright, indirect sunlight."
    },
    "unprecedented": {
      pos: "adjective", phonetic: "/ʌnˈpres.ɪ.den.tɪd/",
      def: "Never done or known before; without any earlier example.",
      simple: "Never happened before in all of history.",
      example: "The river rose to an unprecedented level for the third year in a row."
    },
    "vulnerable": {
      pos: "adjective", phonetic: "/ˈvʌl.nər.ə.bəl/",
      def: "Easily harmed, attacked, or influenced; open to injury or criticism.",
      simple: "Easy to hurt; not well protected.",
      example: "Young seedlings are especially vulnerable to late spring frosts."
    },
    "reluctant": {
      pos: "adjective", phonetic: "/rɪˈlʌk.tənt/",
      def: "Unwilling or hesitant; not eager to do something.",
      simple: "Not wanting to do something; dragging your feet.",
      example: "He was reluctant to share his early drafts with the class."
    },
    "relevant": {
      pos: "adjective", phonetic: "/ˈrel.ə.vənt/",
      def: "Closely connected or appropriate to the matter being considered.",
      simple: "Directly related to the topic at hand.",
      example: "Include only evidence that is relevant to your argument."
    },
    "restrict": {
      pos: "verb", phonetic: "/rɪˈstrɪkt/",
      def: "To put a limit on something; to keep something within set bounds.",
      simple: "To limit something or hold it back.",
      example: "The city voted to restrict water use during the drought."
    },
    "retain": {
      pos: "verb", phonetic: "/rɪˈteɪn/",
      def: "To keep or continue to hold something; also, to remember information.",
      simple: "To keep hold of something — or keep it in memory.",
      example: "Reviewing notes weekly helps students retain vocabulary for months."
    },
    "suppress": {
      pos: "verb", phonetic: "/səˈpres/",
      def: "To forcibly put an end to something; or to hold back and keep something from being expressed.",
      simple: "To push something down and stop it from showing.",
      example: "She had to suppress a laugh during the serious ceremony."
    },
    "tedious": {
      pos: "adjective", phonetic: "/ˈtiː.di.əs/",
      def: "Too long, slow, or dull; tiresome and boring because of length or repetition.",
      simple: "Boring and draggy — it feels like it never ends.",
      example: "Copying the table by hand was so tedious that they decided to scan it instead."
    }
  };

  // Offline local word index: merges the curated glossary with the teen and kid
  // spelling banks so lookups work without any network access. Built lazily on
  // first use and cached (rebuilt if the underlying banks finish loading later).
  let _localWordIndex = null;
  let _localWordIndexKey = "";

  function buildLocalWordIndex() {
    const teenBank = Array.isArray(window.TEEN_SPELLING_WORDS) ? window.TEEN_SPELLING_WORDS : [];
    const kidBank = Array.isArray(window.SHORT_SPELLING_WORDS_RAW) ? window.SHORT_SPELLING_WORDS_RAW : [];
    const cacheKey = Object.keys(TOUGH_WORDS_GLOSSARY).length + ":" + teenBank.length + ":" + kidBank.length;
    if (_localWordIndex && _localWordIndexKey === cacheKey) return _localWordIndex;

    const index = {};
    kidBank.forEach(row => {
      if (!Array.isArray(row) || !row[0]) return;
      const w = String(row[0]).trim().toLowerCase();
      if (w && !index[w]) {
        index[w] = { pos: "word", phonetic: "", def: row[2] || "", simple: "", example: "" };
      }
    });
    teenBank.forEach(entry => {
      if (!entry || !entry.word) return;
      const w = String(entry.word).trim().toLowerCase();
      if (w && !index[w]) {
        index[w] = {
          pos: "word",
          phonetic: "",
          def: entry.meaning || "",
          simple: entry.tip || "",
          example: entry.sentence || "",
          root: entry.root || ""
        };
      }
    });
    // Curated glossary entries win on conflicts.
    Object.keys(TOUGH_WORDS_GLOSSARY).forEach(w => { index[w] = TOUGH_WORDS_GLOSSARY[w]; });

    _localWordIndex = index;
    _localWordIndexKey = cacheKey;
    return _localWordIndex;
  }

  // Candidate forms for a query: the word itself first, then progressively
  // simpler derived forms (plurals, -ing/-ed forms, etc.) so that inflected
  // words like "emphasized" or "conventions" resolve to their base entry.
  function stemCandidates(word) {
    const out = [word];
    const add = (w) => { if (w && w.length >= 3 && !out.includes(w)) out.push(w); };
    let base = word;
    if (base.endsWith("'s")) {
      base = base.slice(0, -2);
      add(base);
    }
    if (base.endsWith("ies")) add(base.slice(0, -3) + "y");
    if (base.endsWith("es")) add(base.slice(0, -2));
    if (base.endsWith("s") && !base.endsWith("ss")) add(base.slice(0, -1));
    if (base.endsWith("ing")) {
      const stem = base.slice(0, -3);
      add(stem);
      add(stem + "e");
      if (stem.length > 1 && stem.charAt(stem.length - 1) === stem.charAt(stem.length - 2)) add(stem.slice(0, -1));
    }
    if (base.endsWith("ied")) add(base.slice(0, -3) + "y");
    if (base.endsWith("ed")) {
      const stem = base.slice(0, -2);
      add(stem);
      add(stem + "e");
      if (stem.length > 1 && stem.charAt(stem.length - 1) === stem.charAt(stem.length - 2)) add(stem.slice(0, -1));
    }
    if (base.endsWith("ly")) add(base.slice(0, -2));
    if (base.endsWith("ness")) add(base.slice(0, -4));
    if (base.endsWith("ment")) add(base.slice(0, -4));
    return out;
  }

  function lookupLocalWord(word) {
    const index = buildLocalWordIndex();
    const candidates = stemCandidates(word);
    for (let i = 0; i < candidates.length; i++) {
      if (index[candidates[i]]) return { word: candidates[i], data: index[candidates[i]] };
    }
    return null;
  }

  let activeLookupWord = "";

  function openDictionaryModal(initialWord) {
    const overlay = document.getElementById('dictionaryModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    initDictionaryChips();
    renderDictionaryVault();

    if (initialWord && typeof initialWord === 'string') {
      const clean = initialWord.trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
      document.getElementById('dictSearchInput').value = clean;
      lookupDictionaryWord(clean);
    } else {
      const firstChip = "ubiquitous";
      document.getElementById('dictSearchInput').value = firstChip;
      lookupDictionaryWord(firstChip);
    }
  }

  function closeDictionaryModal() {
    const overlay = document.getElementById('dictionaryModalOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  async function lookupDictionaryWord(wordOverride) {
    const inputEl = document.getElementById('dictSearchInput');
    const query = (wordOverride || (inputEl ? inputEl.value : "")).trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
    if (!query) {
      if (typeof window.showToast === 'function') window.showToast("Type or click a word to look up!");
      return;
    }
    activeLookupWord = query;
    const resContainer = document.getElementById('dictResultContainer');
    resContainer.innerHTML = `
      <div class="text-center py-6">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
        <p class="text-xs font-bold text-slate-500">Looking up "${escapeHtml(query)}"...</p>
      </div>
    `;

    // 1. Check the offline local word index (curated glossary + spelling banks)
    const localHit = lookupLocalWord(query);
    if (localHit) {
      renderDictionaryResultCard(localHit.word, localHit.data);
      return;
    }

    // 2. Fetch from Free Dictionary API (exact word first, then closest word forms)
    const apiCandidates = [query];
    stemCandidates(query).slice(1, 3).forEach(c => {
      if (!apiCandidates.includes(c)) apiCandidates.push(c);
    });
    for (const candidate of apiCandidates) {
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(candidate)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]) {
            const entry = data[0];
            const meaning = (entry.meanings && entry.meanings[0]) || {};
            const defObj = (meaning.definitions && meaning.definitions[0]) || {};
            const item = {
              pos: meaning.partOfSpeech || "word",
              phonetic: entry.phonetic || (entry.phonetics && entry.phonetics[0] && entry.phonetics[0].text) || "",
              def: defObj.definition || "No definition found.",
              simple: defObj.definition || "",
              example: defObj.example || `Used in sentence context for: "${candidate}".`
            };
            renderDictionaryResultCard(candidate, item);
            return;
          }
        }
      } catch (err) {
        console.warn("Dictionary API lookup error:", err);
        break; // Network unreachable — the remaining candidates would fail the same way.
      }
    }

    // 3. Fallback when word not found in online dictionary
    resContainer.innerHTML = `
      <div class="text-center py-4 space-y-3">
        <div class="text-4xl">🔍</div>
        <h3 class="text-lg font-extrabold text-slate-900 capitalize">${escapeHtml(query)}</h3>
        <p class="text-xs font-medium text-slate-600 max-w-md mx-auto">
          This specific word wasn't found in the instant English glossary. Double-check your spelling, or tap <strong>Pronounce</strong> to hear it phonetically!
        </p>
        <div class="flex items-center justify-center gap-2 pt-2">
          <button onclick="speakNativeAudio('${escapeHtml(query)}', 'en-US')" class="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5">
            🔊 Pronounce Phonics
          </button>
          <button onclick="toggleSaveToughWord('${escapeHtml(query)}')" class="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 border border-amber-200">
            ⭐ Save to Vault Anyway
          </button>
        </div>
      </div>
    `;
  }

  function renderDictionaryResultCard(word, data) {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : {};
    const isSaved = (p.savedToughWords && p.savedToughWords.includes(word));
    const resContainer = document.getElementById('dictResultContainer');

    resContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
          <div>
            <div class="flex items-center gap-2.5">
              <h3 class="text-2xl font-black text-slate-900 capitalize tracking-tight">${escapeHtml(word)}</h3>
              <button onclick="speakNativeAudio('${escapeHtml(word)}', 'en-US')" class="w-8 h-8 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 flex items-center justify-center text-sm shadow-xs transition" title="Listen to pronunciation">
                🔊
              </button>
            </div>
            <p class="text-xs font-mono font-bold text-indigo-600 mt-0.5">
              ${data.pos ? `[${escapeHtml(data.pos)}]` : ''} ${escapeHtml(data.phonetic || '')}
            </p>
          </div>
          <button onclick="toggleSaveToughWord('${escapeHtml(word)}')" class="px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition ${
            isSaved ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200'
          }">
            <span>${isSaved ? '⭐ In My Vault' : '☆ Save to Vault'}</span>
          </button>
        </div>

        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Student &amp; Official Definition</span>
          <p class="text-sm font-semibold text-slate-800 mt-1 leading-relaxed">${escapeHtml(data.def)}</p>
        </div>

        ${data.simple ? `
          <div class="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-950">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <span>💡</span> <span>Quick &amp; Simple Meaning</span>
            </span>
            <p class="text-xs sm:text-sm font-bold mt-0.5">${escapeHtml(data.simple)}</p>
          </div>
        ` : ''}

        ${data.root ? `
          <div class="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <span>🌱</span> <span>Root &amp; Origin</span>
            </span>
            <p class="text-xs sm:text-sm font-semibold mt-0.5">${escapeHtml(data.root)}</p>
          </div>
        ` : ''}

        ${data.example ? `
          <div class="p-3 rounded-2xl bg-slate-100/90 text-xs text-slate-700 leading-relaxed italic">
            <strong>Example:</strong> "${escapeHtml(data.example)}"
          </div>
        ` : ''}
      </div>
    `;
  }

  function toggleSaveToughWord(word) {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : null;
    if (!p) return;
    if (!p.savedToughWords) p.savedToughWords = [];
    const idx = p.savedToughWords.indexOf(word);
    if (idx >= 0) {
      p.savedToughWords.splice(idx, 1);
      if (typeof window.showToast === 'function') window.showToast(`Removed "${word}" from your vault.`);
    } else {
      p.savedToughWords.push(word);
      if (typeof window.showToast === 'function') window.showToast(`⭐ Saved "${word}" to your Tough Words Vault!`);
    }
    if (typeof window.saveState === 'function') window.saveState();
    renderDictionaryVault();
    if (activeLookupWord === word) {
      const hit = lookupLocalWord(word);
      if (hit) renderDictionaryResultCard(hit.word, hit.data);
    }
  }

  function renderDictionaryVault() {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : null;
    const list = (p && p.savedToughWords) || [];
    const countEl = document.getElementById('dictSavedCount');
    const listEl = document.getElementById('dictSavedWordsList');
    if (countEl) countEl.innerText = `${list.length} saved`;
    if (!listEl) return;

    if (list.length === 0) {
      listEl.innerHTML = `<span class="text-xs text-slate-400 italic">No tough words saved yet. Click "☆ Save to Vault" on any word to keep it here!</span>`;
      return;
    }

    listEl.innerHTML = list.map(w => `
      <span onclick="lookupDictionaryWord('${escapeHtml(w)}')" class="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-100/90 hover:bg-amber-200 text-amber-950 font-bold text-xs cursor-pointer border border-amber-300 transition">
        <span>${escapeHtml(w)}</span>
        <button onclick="event.stopPropagation(); toggleSaveToughWord('${escapeHtml(w)}')" class="text-amber-700 hover:text-rose-600 font-extrabold ml-1">&times;</button>
      </span>
    `).join('');
  }

  function initDictionaryChips() {
    const satChipsEl = document.getElementById('dictSatQuickChips');
    const kidChipsEl = document.getElementById('dictKidQuickChips');
    if (satChipsEl && satChipsEl.children.length === 0) {
      const satWords = ["ubiquitous", "ephemeral", "pragmatic", "ameliorate", "substantiate", "anachronism", "mitigate", "resilient", "sagacious", "tenacious", "alacrity", "deleterious"];
      satChipsEl.innerHTML = satWords.map(w => `
        <button onclick="document.getElementById('dictSearchInput').value='${w}'; lookupDictionaryWord('${w}')" class="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition">
          ${w}
        </button>
      `).join('');
    }

    if (kidChipsEl && kidChipsEl.children.length === 0) {
      const kidWords = ["chrysalis", "nocturnal", "photosynthesis", "pollinate", "habitat", "camouflage", "hibernate", "fossil", "metamorphosis", "constellation"];
      kidChipsEl.innerHTML = kidWords.map(w => `
        <button onclick="document.getElementById('dictSearchInput').value='${w}'; lookupDictionaryWord('${w}')" class="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition">
          ${w}
        </button>
      `).join('');
    }
  }

  function renderInteractiveText(text) {
    if (!text) return '';
    // Split the RAW text first, then escape each part: escaping before
    // wrapping words broke HTML entities (the "quot" inside &quot;
    // got wrapped in a span, so passages showed literal &quot;).
    return String(text).split(/(\b[a-zA-Z]{2,}\b)/g).map(part => {
      if (/^[a-zA-Z]{2,}$/.test(part)) {
        return `<span class="interactive-word cursor-pointer hover:bg-amber-200/90 hover:text-indigo-950 rounded px-1 py-0.5 transition inline-block select-none active:scale-95" onclick="handleWordSingleClick(event, '${part}')">${part}</span>`;
      }
      return escapeHtml(part);
    }).join('');
  }

  function handleWordSingleClick(event, word) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!word) return;
    const clean = word.trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
    if (clean.length >= 2) {
      openDictionaryModal(clean);
    }
  }

  window.TOUGH_WORDS_GLOSSARY = TOUGH_WORDS_GLOSSARY;
  window.openDictionaryModal = openDictionaryModal;
  window.closeDictionaryModal = closeDictionaryModal;
  window.lookupDictionaryWord = lookupDictionaryWord;
  window.renderDictionaryResultCard = renderDictionaryResultCard;
  window.toggleSaveToughWord = toggleSaveToughWord;
  window.renderDictionaryVault = renderDictionaryVault;
  window.initDictionaryChips = initDictionaryChips;
  window.renderInteractiveText = renderInteractiveText;
  window.handleWordSingleClick = handleWordSingleClick;
})(window);
