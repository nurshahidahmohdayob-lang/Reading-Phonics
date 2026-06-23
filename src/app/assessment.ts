/** Reading-assessment content. Each reading level (Year 1 → Year 6) has more
    than one ~100-word passage so a single text (or a child's prior knowledge)
    can't skew the result — the passages can be cross-checked for reliability.
    Each passage has 8 questions (3 literal, 3 inferential, 2 vocabulary), each
    with FOUR plain-text choices shown as lettered options (A–D). More items and
    no answer-revealing pictures mean comprehension and word knowledge are
    measured with less guessing and less measurement error. */

export type QKind = "literal" | "inferential" | "vocabulary";

export type AssessQuestion = {
  kind: QKind;
  question: string;
  /** Four plain-text choices, shown as lettered options (A–D) with no picture
      cue so the answer can't be guessed from an emoji. */
  options: string[];
  answer: number;
};

export type AssessPassage = {
  /** Reading level index, 0 = Year 1 … 5 = Year 6. */
  level: number;
  id: string;
  title: string;
  emoji: string;
  pages: { text: string; emoji: string }[];
  questions: AssessQuestion[]; // 8: 3 literal, 3 inferential, 2 vocabulary
};

function Q(
  kind: QKind,
  question: string,
  options: string[],
  answer: number,
): AssessQuestion {
  return { kind, question, options, answer };
}

export const assessmentPassages: AssessPassage[] = [
  /* ===================== Year 1 ===================== */
  {
    level: 0,
    id: "y1-a",
    title: "Sam and the Hat",
    emoji: "🐱",
    pages: [
      { text: "Sam is a little cat. Sam has a red hat. He likes his red hat a lot. He wears it every day.", emoji: "🐱" },
      { text: "One day, Sam runs and plays in the sun. The wind starts to blow hard. It blows and blows.", emoji: "🌬️" },
      { text: "Off goes the red hat! It flies up high in the sky. Then it lands on a hen.", emoji: "🐔" },
      { text: "The hen likes the hat. She puts it on her head. She will not give it back to Sam.", emoji: "🪺" },
      { text: "Now poor Sam has no hat. So Sam gets a new hat. The new hat is blue. Sam is happy again.", emoji: "🧢" },
    ],
    questions: [
      Q("literal", "What animal is Sam?", ["A dog", "A cat", "A hen", "A pig"], 1),
      Q("literal", "What colour was Sam's first hat?", ["Blue", "Green", "Red", "Yellow"], 2),
      Q("literal", "Where did the hat land?", ["On a dog", "On a hen", "In a tree", "In a box"], 1),
      Q("inferential", "Why did the hat fall off Sam's head?", ["Sam threw it away", "The wind blew it off", "A dog pulled it off", "He gave it away"], 1),
      Q("inferential", "How do we know the hen liked the hat?", ["She ate the hat", "She would not give it back", "She ran away from it", "She gave it to Sam"], 1),
      Q("inferential", "How does Sam feel at the end of the story?", ["Sad", "Angry", "Happy", "Sleepy"], 2),
      Q("vocabulary", "What does the word \"blows\" mean here?", ["Moves the air hard", "Bakes a cake", "Goes to sleep", "Sings a song"], 0),
      Q("vocabulary", "In \"it lands on a hen\", what does \"lands\" mean?", ["Comes down onto", "Flies away from", "Hides under", "Runs around"], 0),
    ],
  },
  {
    level: 0,
    id: "y1-b",
    title: "Pip the Dog",
    emoji: "🐶",
    pages: [
      { text: "Pip is a little dog. Pip likes to run and play. He runs in the park every day. His tail wags fast.", emoji: "🐶" },
      { text: "One day, Pip sees a big red ball. The ball is shiny and round. Pip wants to play with it.", emoji: "⚽" },
      { text: "Pip runs fast to get the ball. He runs and runs across the grass. He is very quick.", emoji: "🏃" },
      { text: "But the ball rolls away from him. It rolls and rolls into the pond. Splash! The ball is gone.", emoji: "💦" },
      { text: "Pip jumps in to get the ball. He swims back with it in his mouth. Good dog, Pip!", emoji: "🦴" },
    ],
    questions: [
      Q("literal", "What kind of animal is Pip?", ["A cat", "A dog", "A duck", "A fish"], 1),
      Q("literal", "What did Pip see in the park?", ["A big red ball", "A bone", "A cat", "A stick"], 0),
      Q("literal", "Where did the ball go?", ["Up a tree", "Into the pond", "Under a car", "Into a box"], 1),
      Q("inferential", "Why did Pip jump into the pond?", ["He was hot", "To get the ball", "To catch a fish", "To have a bath"], 1),
      Q("inferential", "How do we know Pip is a good dog?", ["He ran away", "He brought the ball back", "He ate the ball", "He barked all day"], 1),
      Q("inferential", "How do we know Pip has lots of energy?", ["He sleeps all day", "He runs fast and his tail wags", "He sits very still", "He hides away"], 1),
      Q("vocabulary", "What does \"rolls\" mean?", ["Moves along turning", "Jumps up high", "Burns up", "Floats away"], 0),
      Q("vocabulary", "What does \"quick\" mean?", ["Slow", "Fast", "Tired", "Quiet"], 1),
    ],
  },

  /* ===================== Year 2 ===================== */
  {
    level: 1,
    id: "y2-a",
    title: "A Day at the Park",
    emoji: "🏞️",
    pages: [
      { text: "Tom and Meg went to the park on a bright, sunny day. The sun shone in the blue sky. They could not wait to play.", emoji: "🏞️" },
      { text: "First, they ran on the soft green grass. Then they kicked a ball to each other. It was great fun.", emoji: "⚽" },
      { text: "Next, Meg went up the big slide. Whee, it was so fast! She slid down again and again.", emoji: "🛝" },
      { text: "Soon, dark clouds came across the sky. The wind blew cold. Then it began to rain on them.", emoji: "🌧️" },
      { text: "Mum came with a big umbrella to keep them dry. They all went home for a warm lunch.", emoji: "☂️" },
    ],
    questions: [
      Q("literal", "Who went to the park?", ["Mum and Dad", "Tom and Meg", "Two dogs", "Sam and Pip"], 1),
      Q("literal", "What did Meg go up?", ["The swing", "A ladder", "The big slide", "A tree"], 2),
      Q("literal", "What did Mum bring to the park?", ["A ball", "An umbrella", "A picnic", "A dog"], 1),
      Q("inferential", "Why did they go home?", ["They were only hungry", "It started to rain", "It got dark at night", "They were bored"], 1),
      Q("inferential", "How do we know Tom and Meg had fun?", ["They cried", "They ran, played ball and went down the slide", "They argued", "They sat still"], 1),
      Q("inferential", "Why did Mum bring the umbrella?", ["To play a game", "To keep them dry from the rain", "To make shade from the sun", "To carry the ball"], 1),
      Q("vocabulary", "What do \"dark clouds\" usually tell us?", ["It is sunny", "Rain is coming", "It is night", "It will be hot"], 1),
      Q("vocabulary", "What does \"slid\" mean in \"she slid down\"?", ["Climbed up slowly", "Moved smoothly down", "Jumped over", "Fell asleep"], 1),
    ],
  },
  {
    level: 1,
    id: "y2-b",
    title: "The New Bike",
    emoji: "🚲",
    pages: [
      { text: "Meg got a brand new bike for her birthday. It was the best present ever. She ran outside to see it straight away.", emoji: "🎁" },
      { text: "The bike was shiny and red, with a bright silver bell. Meg loved to ring it. It shone in the bright sun.", emoji: "🔔" },
      { text: "At first, Meg wobbled from side to side. She felt scared and nearly fell off.", emoji: "😨" },
      { text: "Dad held the back of the bike. He ran beside her to help her stay up. Do not be scared, he said.", emoji: "🏃" },
      { text: "Soon Meg could ride all by herself. Ring, ring! She felt so proud and happy.", emoji: "🚲" },
    ],
    questions: [
      Q("literal", "What did Meg get for her birthday?", ["A bike", "A guitar", "A kite", "A puppy"], 0),
      Q("literal", "What colour was the bike?", ["Blue", "Green", "Red", "Black"], 2),
      Q("literal", "What was on the bike?", ["A basket", "A silver bell", "A flag", "A light"], 1),
      Q("inferential", "Why did Dad run beside Meg?", ["For exercise", "To help her stay up", "To race her", "To fetch the bell"], 1),
      Q("inferential", "How did Meg feel when she first tried the bike?", ["Bored", "Scared", "Angry", "Sleepy"], 1),
      Q("inferential", "How did Meg feel once she could ride by herself?", ["Still scared", "Sad", "Proud and happy", "Cross"], 2),
      Q("vocabulary", "What does \"wobbled\" mean?", ["Moved unsteadily", "Went very fast", "Stopped still", "Fell asleep"], 0),
      Q("vocabulary", "What does \"proud\" mean?", ["Pleased with yourself", "Very scared", "Very tired", "Very hungry"], 0),
    ],
  },

  /* ===================== Year 3 ===================== */
  {
    level: 2,
    id: "y3-a",
    title: "The Lost Puppy",
    emoji: "🐶",
    pages: [
      { text: "One rainy afternoon, Lily heard a soft cry coming from the bushes. The rain was falling fast. She stopped to listen.", emoji: "🌳" },
      { text: "She pushed back the leaves and looked inside. There she found a small, wet puppy. It was all alone.", emoji: "🐶" },
      { text: "The poor puppy was cold and shivering in the rain. It could not stop shaking. It looked up at her with sad eyes.", emoji: "🌧️" },
      { text: "Lily gently wrapped the puppy in her warm scarf. Then she carried it all the way home.", emoji: "🧣" },
      { text: "She gave it food and a soft bed. She named the puppy Lucky, for it had found a friend.", emoji: "🐾" },
    ],
    questions: [
      Q("literal", "Where did Lily hear the soft cry?", ["In the house", "In the bushes", "In a car", "Up a tree"], 1),
      Q("literal", "What did Lily find?", ["A kitten", "A bird", "A puppy", "A rabbit"], 2),
      Q("literal", "What did Lily wrap the puppy in?", ["A towel", "Her scarf", "A blanket", "Her coat"], 1),
      Q("inferential", "Why was the puppy shivering?", ["It was cold and wet", "It was excited", "It had been running", "It was only hungry"], 0),
      Q("inferential", "How do we know Lily is kind?", ["She left it outside", "She warmed it, took it home and fed it", "She ignored it", "She was afraid of it"], 1),
      Q("inferential", "Why did Lily name the puppy \"Lucky\"?", ["It was a lucky colour", "It had found a friend and a home", "It won a prize", "It was very fast"], 1),
      Q("vocabulary", "What does \"shivering\" mean?", ["Shaking from cold", "Laughing loudly", "Eating quickly", "Running fast"], 0),
      Q("vocabulary", "What does \"gently\" mean in \"gently wrapped\"?", ["Roughly", "Softly and with care", "Quickly", "Loudly"], 1),
    ],
  },
  {
    level: 2,
    id: "y3-b",
    title: "The Big Race",
    emoji: "🏃",
    pages: [
      { text: "Today was the school sports day, and the whole school was excited. Bright flags waved in the wind.", emoji: "🏫" },
      { text: "Anim lined up at the start for the running race. Other children stood beside him. He took a deep breath.", emoji: "🏃" },
      { text: "His heart was beating fast as he waited. His hands were shaking a little. He felt nervous but he wanted to try.", emoji: "💓" },
      { text: "When the whistle blew, he ran as fast as he could. His legs went faster and faster.", emoji: "💨" },
      { text: "He did not win the race, but he tried his very best. Anim felt proud of himself. He smiled at his friends.", emoji: "🥉" },
    ],
    questions: [
      Q("literal", "What day was it at school?", ["A birthday", "Sports day", "Picture day", "A holiday"], 1),
      Q("literal", "What race was Anim in?", ["Swimming", "Cycling", "Running", "Jumping"], 2),
      Q("literal", "What sound started the race?", ["A bell", "A whistle", "A drum", "A clap"], 1),
      Q("inferential", "Why was Anim's heart beating fast before the race?", ["He had been running", "He felt nervous", "He was cold", "He was angry"], 1),
      Q("inferential", "Did Anim win the race?", ["Yes, he came first", "No, but he tried his best", "He did not run", "The story does not say"], 1),
      Q("inferential", "How do we know Anim is a good sport?", ["He cried", "He tried his best and felt proud", "He got angry", "He gave up"], 1),
      Q("vocabulary", "What does \"nervous\" mean?", ["Feeling worried or scared", "Feeling sleepy", "Feeling hungry", "Feeling cold"], 0),
      Q("vocabulary", "What does \"proud\" mean?", ["Pleased with yourself", "Very frightened", "Very bored", "Very tired"], 0),
    ],
  },

  /* ===================== Year 4 ===================== */
  {
    level: 3,
    id: "y4-a",
    title: "The Brave Little Fox",
    emoji: "🦊",
    pages: [
      { text: "A little fox lived deep inside the dark, quiet wood. He was small but clever. He knew every tree and path.", emoji: "🦊" },
      { text: "One night, he heard a strange noise outside his den. He had never heard it before. It was loud and close.", emoji: "🌙" },
      { text: "His heart pounded with fear, but he wanted to be brave. He took one step forward. So he decided to look.", emoji: "💓" },
      { text: "Slowly and quietly, he crept towards the strange sound. His paws made no noise at all.", emoji: "👣" },
      { text: "It was only an owl, hooting in a tree! The fox laughed at his own fear and went home.", emoji: "🦉" },
    ],
    questions: [
      Q("literal", "Where did the little fox live?", ["On a mountain", "Deep in the wood", "By the sea", "In a town"], 1),
      Q("literal", "When did the fox hear the strange noise?", ["At noon", "One night", "In the morning", "At sunset"], 1),
      Q("literal", "What was really making the noise?", ["A wolf", "An owl", "A bear", "The wind"], 1),
      Q("inferential", "Why did the fox creep slowly and quietly?", ["He was sleepy", "He was scared but wanted to be careful", "He was chasing dinner", "He was playing a game"], 1),
      Q("inferential", "How do we know the fox felt silly afterwards?", ["He cried", "He laughed at his own fear", "He ran away", "He hid all day"], 1),
      Q("inferential", "What is the little fox like?", ["Lazy and slow", "Small but brave and clever", "Mean and loud", "Big and strong"], 1),
      Q("vocabulary", "What does \"crept\" mean?", ["Ran very fast", "Moved slowly and quietly", "Jumped high", "Shouted loudly"], 1),
      Q("vocabulary", "What does \"his heart pounded\" tell us his heart did?", ["Beat hard and fast", "Stopped beating", "Felt cold", "Went quiet"], 0),
    ],
  },
  {
    level: 3,
    id: "y4-b",
    title: "The Kind Stranger",
    emoji: "🪙",
    pages: [
      { text: "It was a cold, grey morning. Maya was walking home when she dropped her coins on the busy street. The street was full of people.", emoji: "🪙" },
      { text: "The coins scattered everywhere across the pavement. They rolled in every direction. Maya began to panic.", emoji: "😰" },
      { text: "She was afraid she would lose all of her money. She felt like crying. People hurried past without stopping.", emoji: "🧍" },
      { text: "Then a tall stranger knelt down to help her. Together they gathered every single coin. He did not hurry away like the others.", emoji: "🤝" },
      { text: "Maya thanked him with a big smile. The kind stranger simply smiled back and walked away.", emoji: "🙂" },
    ],
    questions: [
      Q("literal", "What did Maya drop on the street?", ["Her books", "Her coins", "Her keys", "Her lunch"], 1),
      Q("literal", "What was the morning like?", ["Hot and sunny", "Cold and grey", "Warm and bright", "Snowy"], 1),
      Q("literal", "Who stopped to help Maya?", ["A police officer", "Her teacher", "A tall stranger", "Her mum"], 2),
      Q("inferential", "Why did Maya begin to panic?", ["She was late for school", "She was afraid she would lose her money", "She felt unwell", "She was lost"], 1),
      Q("inferential", "How do we know the stranger was kind?", ["He hurried past", "He knelt down and helped her pick up the coins", "He took the coins", "He shouted at her"], 1),
      Q("inferential", "How were the other people different from the stranger?", ["They helped too", "They hurried past without stopping", "They laughed at her", "They called her mum"], 1),
      Q("vocabulary", "What does \"scattered\" mean?", ["Stuck together", "Spread out everywhere", "Disappeared", "Floated away"], 1),
      Q("vocabulary", "What does \"panic\" mean?", ["A calm feeling", "A sudden strong worry", "A happy surprise", "A long sleep"], 1),
    ],
  },

  /* ===================== Year 5 ===================== */
  {
    level: 4,
    id: "y5-a",
    title: "The Magic Seed",
    emoji: "🌱",
    pages: [
      { text: "One spring morning, Anya planted a tiny seed in her garden. She covered it gently with soft soil. She hoped it would become something wonderful.", emoji: "🌱" },
      { text: "Every single day, she gave it fresh water and warm sunlight. She waited patiently for it to grow.", emoji: "💧" },
      { text: "At first, nothing grew at all, and Anya nearly gave up hope. The ground stayed bare and brown.", emoji: "😕" },
      { text: "Then, one bright morning, a tiny green shoot pushed through the soil. Anya could not believe her eyes. It grew taller every day.", emoji: "🌿" },
      { text: "At the very top bloomed the most beautiful flower she had ever seen. Anya's patience had paid off.", emoji: "🌺" },
    ],
    questions: [
      Q("literal", "What did Anya plant in her garden?", ["A tree", "A seed", "A flower bulb", "A bush"], 1),
      Q("literal", "What did Anya give the seed every day?", ["Water and sunlight", "Sweets", "Music", "Cold air"], 0),
      Q("literal", "What grew at the very top in the end?", ["A weed", "A beautiful flower", "An apple", "Only some leaves"], 1),
      Q("inferential", "Why did Anya nearly give up hope?", ["She was bored", "Nothing grew at first", "She lost the seed", "It was too sunny"], 1),
      Q("inferential", "What lesson does this story teach?", ["Plants need no care", "Being patient pays off", "Gardens are easy", "Give up quickly"], 1),
      Q("inferential", "How do we know Anya was patient?", ["She watered it daily and kept waiting", "She dug it up", "She forgot about it", "She planted many seeds"], 0),
      Q("vocabulary", "What does \"bloomed\" mean?", ["Opened into a flower", "Dried up", "Froze over", "Fell down"], 0),
      Q("vocabulary", "What does \"patiently\" mean?", ["Waiting calmly without rushing", "Quickly and crossly", "Loudly", "Carelessly"], 0),
    ],
  },
  {
    level: 4,
    id: "y5-b",
    title: "The Storm at Sea",
    emoji: "⛵",
    pages: [
      { text: "Far out at sea, a little fishing boat rocked on the wild, crashing waves. Rain poured down and thunder boomed across the sky.", emoji: "🌊" },
      { text: "Dark clouds gathered overhead, and the wind howled fiercely around them. The waves rose higher and higher.", emoji: "⛈️" },
      { text: "Captain Lee gripped the wheel with steady, careful hands. He had sailed through storms before. He would not let go.", emoji: "🧑‍✈️" },
      { text: "Far away, he could see the harbour lights glowing. His heart was pounding. He steered towards them to reach safety.", emoji: "🪔" },
      { text: "Slowly and carefully, he guided the boat home. At last they reached the shore, soaked but safe. The danger was over.", emoji: "🏝️" },
    ],
    questions: [
      Q("literal", "Where did the story take place?", ["On a river", "Far out at sea", "In a harbour pool", "On a lake"], 1),
      Q("literal", "Who steered the fishing boat?", ["A young boy", "Captain Lee", "A dolphin", "Nobody"], 1),
      Q("literal", "What did Captain Lee steer towards?", ["A lighthouse island", "The harbour lights", "Another boat", "A beach hut"], 1),
      Q("inferential", "Why did Captain Lee head for the harbour lights?", ["To catch more fish", "To reach safety", "To watch the storm", "To meet a friend"], 1),
      Q("inferential", "How do we know the storm was dangerous?", ["The sea was calm", "Wild waves, howling wind and thunder", "It was sunny", "There was a rainbow"], 1),
      Q("inferential", "How do we know Captain Lee was calm and experienced?", ["He panicked and let go", "He had sailed through storms before and held the wheel steadily", "He jumped into the sea", "He had never sailed before"], 1),
      Q("vocabulary", "What does \"fiercely\" mean?", ["Gently", "Very strongly", "Slowly", "Quietly"], 1),
      Q("vocabulary", "What does \"gripped\" mean in \"gripped the wheel\"?", ["Let go of", "Held tightly", "Pushed away", "Tapped lightly"], 1),
    ],
  },

  /* ===================== Year 6 ===================== */
  {
    level: 5,
    id: "y6-a",
    title: "The Hidden Cave",
    emoji: "🕳️",
    pages: [
      { text: "Beyond the deep forest lay a hidden cave that few people had ever explored. Strange stories were told about what lay inside.", emoji: "🌲" },
      { text: "Curious and determined, Maya gripped her flashlight and stepped inside alone. Her heart raced with excitement.", emoji: "🔦" },
      { text: "The narrow passage twisted deeper into the cold, silent darkness. The air grew colder with every step. She did not turn back.", emoji: "🦇" },
      { text: "Suddenly, the walls glittered with thousands of tiny crystals. Maya gasped in wonder. They sparkled like stars in the torchlight.", emoji: "💎" },
      { text: "Amazed by the sight, Maya carefully sketched the cave. She wanted to share her wonderful discovery with everyone.", emoji: "📓" },
    ],
    questions: [
      Q("literal", "What lay beyond the deep forest?", ["A castle", "A hidden cave", "A lake", "A village"], 1),
      Q("literal", "What did Maya carry into the cave?", ["A map", "A rope", "A flashlight", "A camera"], 2),
      Q("literal", "What did the cave walls glitter with?", ["Gold coins", "Tiny crystals", "Painted stars", "Drops of water"], 1),
      Q("inferential", "Why did Maya sketch the cave?", ["She was bored", "To share her discovery with everyone", "To find the way out", "To pass the time"], 1),
      Q("inferential", "How do we know Maya was determined and brave?", ["She turned back quickly", "She went in alone and did not turn back", "She waited outside", "She called for help"], 1),
      Q("inferential", "How did Maya feel when she saw the crystals?", ["Bored", "Frightened", "Amazed and full of wonder", "Sleepy"], 2),
      Q("vocabulary", "What does \"glittered\" mean?", ["Went dark", "Sparkled and shone", "Got wet", "Cracked open"], 1),
      Q("vocabulary", "What does \"determined\" mean?", ["Firmly decided and not giving up", "Easily scared", "Quickly bored", "Very tired"], 0),
    ],
  },
  {
    level: 5,
    id: "y6-b",
    title: "The Forgotten Library",
    emoji: "📚",
    pages: [
      { text: "Beneath the old town hall lay a forgotten library that no one had visited for years. Daniel found the dark stairs by chance.", emoji: "🏛️" },
      { text: "Thick dust coated the shelves, and grey cobwebs draped every corner of the room. The air smelled old and stale.", emoji: "🕸️" },
      { text: "On a high shelf, Daniel discovered a leather book sealed tightly with wax. His hands shook as he opened it.", emoji: "📕" },
      { text: "Inside were old maps of secret tunnels that no one had walked for many years. He could not believe what he saw.", emoji: "🗺️" },
      { text: "Daniel realised that the town held secrets far older than anyone had ever imagined.", emoji: "🔑" },
    ],
    questions: [
      Q("literal", "Where was the forgotten library?", ["In a forest", "Beneath the old town hall", "On a hill", "In a school"], 1),
      Q("literal", "What did Daniel find on the high shelf?", ["A pile of gold", "A leather book sealed with wax", "A treasure chest", "A painting"], 1),
      Q("literal", "What was inside the book?", ["Old maps of secret tunnels", "A diary", "Drawings of animals", "Nothing at all"], 0),
      Q("inferential", "How do we know the library had been abandoned for a long time?", ["It was bright and busy", "Thick dust and cobwebs covered everything", "New books lined the shelves", "People were reading there"], 1),
      Q("inferential", "Why were the maps important?", ["They showed secret tunnels and old town secrets", "They were good for colouring", "They showed the way to school", "They were worth money"], 0),
      Q("inferential", "How do we know Daniel felt nervous or excited?", ["He fell asleep", "His hands shook as he opened the book", "He left at once", "He laughed loudly"], 1),
      Q("vocabulary", "What does \"forgotten\" mean?", ["Brand new", "No longer remembered", "Very popular", "Well looked after"], 1),
      Q("vocabulary", "What does \"sealed\" mean in \"sealed tightly with wax\"?", ["Closed up tightly", "Torn open", "Painted brightly", "Left open"], 0),
    ],
  },
];

/** All passages at a given reading level (for picking / cross-checking). */
export function passagesForLevel(level: number): AssessPassage[] {
  return assessmentPassages.filter((p) => p.level === level);
}

/* ---------- Reading Level Placement Guide ---------- */

export type PlacementAction = "up" | "stay" | "down";

export type BenchmarkBand = {
  label: "Independent" | "Instructional" | "Frustration";
  meaning: string;
  /** Tailwind classes for a coloured pill. */
  tone: string;
};

/**
 * Classify one accuracy reading by the Reading Level Placement Guide's fixed
 * cut-offs — the benchmark used everywhere in the assessment, the same for
 * every year so a trial at any level is judged on the same scale:
 *   98–100% Independent · 95–97% Instructional · below 95% Frustration.
 */
export function benchmarkBand(accuracy: number): BenchmarkBand {
  if (accuracy >= 98)
    return {
      label: "Independent",
      meaning: "Can read this alone 🎉",
      tone: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    };
  if (accuracy >= 95)
    return {
      label: "Instructional",
      meaning: "Great with a little help 💪",
      tone: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    };
  return {
    label: "Frustration",
    meaning: "Let's try an easier text 🌱",
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  };
}

export type Placement = {
  action: PlacementAction;
  /** The placement band that produced this decision. */
  band: "Independent" | "Instructional" | "Frustration";
  /** A short reason, phrased for a teacher. */
  reason: string;
};

/**
 * Decide whether a reader moves up, stays, or moves down, following the
 * Reading Level Placement Guide. All scores are 0–100; fluency ≥ 75 == 3/4.
 * A `null` score means "not measured" and never blocks a decision.
 *
 *   🟢 Move up   — Accuracy ≥ 98%  AND Fluency ≥ 3/4  AND Comprehension ≥ 80%
 *   🟡 Stay      — Accuracy 95–97%  (or strong accuracy but comp/fluency not yet there)
 *   🔴 Move down — Accuracy < 95%   OR  Comprehension < 70%
 */
export function placementDecision(
  accuracy: number | null,
  fluencyScore: number | null,
  compScore: number | null,
): Placement {
  if (accuracy == null) {
    return { action: "stay", band: "Instructional", reason: "No reading was recorded." };
  }
  if (accuracy < 95) {
    return {
      action: "down",
      band: "Frustration",
      reason: `Accuracy ${accuracy}% is below 95% — this text is too hard.`,
    };
  }
  if (compScore != null && compScore < 70) {
    return {
      action: "down",
      band: "Frustration",
      reason: `Comprehension ${compScore}% is below 70% — meaning isn't coming through.`,
    };
  }
  if (
    accuracy >= 98 &&
    (fluencyScore == null || fluencyScore >= 75) &&
    (compScore == null || compScore >= 80)
  ) {
    return {
      action: "up",
      band: "Independent",
      reason: `Accuracy ${accuracy}%, smooth reading and strong comprehension — ready for harder text.`,
    };
  }
  // Accuracy 95–97%, or 98%+ but fluency/comprehension not yet strong.
  return {
    action: "stay",
    band: "Instructional",
    reason:
      accuracy >= 98
        ? "Accurate, but fluency or comprehension needs a little more practice here."
        : `Accuracy ${accuracy}% is in the 95–97% range — keep guided reading at this level.`,
  };
}

/** Named Lexile bands used to match a reader to books. */
export function lexileBand(lexile: number): string {
  if (lexile < 100) return "Emerging";
  if (lexile < 300) return "Early";
  if (lexile < 500) return "Developing";
  if (lexile < 700) return "Independent";
  if (lexile < 850) return "Advanced";
  return "Proficient";
}
