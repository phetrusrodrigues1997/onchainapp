export interface TriviaQuestion {
  question: string;
  answers: string[];
  correctAnswer: number;
}

export const triviaQuestions2: TriviaQuestion[] = [
  // === ASTRONOMY & SPACE (40 questions) ===
  {
    question: "What is the name of the galaxy closest to the Milky Way?",
    answers: ["Andromeda Galaxy", "Whirlpool Galaxy", "Triangulum Galaxy", "Pinwheel Galaxy"],
    correctAnswer: 0
  },
  {
    question: "Which planet has the most moons in our solar system?",
    answers: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    correctAnswer: 1
  },
  {
    question: "What is the brightest star in the night sky?",
    answers: ["Polaris", "Vega", "Sirius", "Rigel"],
    correctAnswer: 2
  },
  {
    question: "How long does it take light from the Sun to reach Earth?",
    answers: ["8 minutes", "8 seconds", "8 hours", "8 days"],
    correctAnswer: 0
  },
  {
    question: "What is the name of NASA's most famous space telescope?",
    answers: ["Kepler", "Spitzer", "Hubble", "Webb"],
    correctAnswer: 2
  },
  {
    question: "Which planet rotates on its side?",
    answers: ["Neptune", "Uranus", "Saturn", "Pluto"],
    correctAnswer: 1
  },
  {
    question: "What is the name of the first artificial satellite launched into space?",
    answers: ["Explorer 1", "Vostok 1", "Sputnik 1", "Luna 1"],
    correctAnswer: 2
  },
  {
    question: "What type of star is the Sun classified as?",
    answers: ["Red giant", "White dwarf", "Yellow dwarf", "Blue giant"],
    correctAnswer: 2
  },
  {
    question: "Which planet has the Great Red Spot?",
    answers: ["Mars", "Jupiter", "Saturn", "Neptune"],
    correctAnswer: 1
  },
  {
    question: "What is the term for a star that suddenly increases in brightness?",
    answers: ["Supernova", "Nova", "Pulsar", "Quasar"],
    correctAnswer: 1
  },
  {
    question: "How many Earth days does it take Mars to orbit the Sun?",
    answers: ["365 days", "500 days", "687 days", "800 days"],
    correctAnswer: 2
  },
  {
    question: "What is the name of the boundary around a black hole?",
    answers: ["Event horizon", "Photon sphere", "Ergosphere", "Singularity"],
    correctAnswer: 0
  },
  {
    question: "Which moon of Jupiter is believed to have a subsurface ocean?",
    answers: ["Io", "Europa", "Ganymede", "Callisto"],
    correctAnswer: 1
  },
  {
    question: "What is the name of the theoretical form of matter that makes up most of the universe?",
    answers: ["Dark matter", "Antimatter", "Strange matter", "Exotic matter"],
    correctAnswer: 0
  },
  {
    question: "Which spacecraft was the first to land on Mars?",
    answers: ["Viking 1", "Pathfinder", "Spirit", "Phoenix"],
    correctAnswer: 0
  },
  {
    question: "What is the name of the closest star system to Earth?",
    answers: ["Alpha Centauri", "Barnard's Star", "Wolf 359", "Sirius"],
    correctAnswer: 0
  },
  {
    question: "How long is a day on Venus compared to Earth?",
    answers: ["Shorter", "The same", "Longer", "Venus doesn't rotate"],
    correctAnswer: 2
  },
  {
    question: "What is the name of the largest volcano in the solar system?",
    answers: ["Mount Everest", "Olympus Mons", "Mauna Kea", "Kilimanjaro"],
    correctAnswer: 1
  },
  {
    question: "Which planet has the fastest winds in the solar system?",
    answers: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    correctAnswer: 3
  },
  {
    question: "What is the name of the mission that first landed humans on the Moon?",
    answers: ["Apollo 10", "Apollo 11", "Apollo 12", "Gemini 7"],
    correctAnswer: 1
  },
  {
    question: "What causes the Northern Lights (Aurora Borealis)?",
    answers: ["Solar wind particles", "Moon's gravity", "Earth's rotation", "Volcanic activity"],
    correctAnswer: 0
  },
  {
    question: "Which planet has the most extreme temperature variations?",
    answers: ["Mercury", "Venus", "Mars", "Pluto"],
    correctAnswer: 0
  },
  {
    question: "What is the name of the space station currently orbiting Earth?",
    answers: ["Mir", "Skylab", "International Space Station", "Freedom"],
    correctAnswer: 2
  },
  {
    question: "How many planets in our solar system have rings?",
    answers: ["1", "2", "3", "4"],
    correctAnswer: 3
  },
  {
    question: "What is the name of the largest asteroid in our solar system?",
    answers: ["Vesta", "Pallas", "Ceres", "Hygiea"],
    correctAnswer: 2
  },
  {
    question: "Which spacecraft took the famous 'Pale Blue Dot' photo of Earth?",
    answers: ["Hubble", "Voyager 1", "Cassini", "New Horizons"],
    correctAnswer: 1
  },
  {
    question: "What is the temperature at the core of the Sun?",
    answers: ["1 million°C", "10 million°C", "15 million°C", "100 million°C"],
    correctAnswer: 2
  },
  {
    question: "Which comet is visible from Earth approximately every 76 years?",
    answers: ["Hale-Bopp", "Halley's Comet", "Hyakutake", "Shoemaker-Levy 9"],
    correctAnswer: 1
  },
  {
    question: "What is the name of the first woman in space?",
    answers: ["Sally Ride", "Valentina Tereshkova", "Mae Jemison", "Eileen Collins"],
    correctAnswer: 1
  },
  {
    question: "How many moons does Mars have?",
    answers: ["0", "1", "2", "3"],
    correctAnswer: 2
  },
  {
    question: "What is the name of the region where most comets originate?",
    answers: ["Asteroid Belt", "Kuiper Belt", "Oort Cloud", "Heliosphere"],
    correctAnswer: 2
  },
  {
    question: "Which planet takes the longest to complete one rotation on its axis?",
    answers: ["Mercury", "Venus", "Jupiter", "Neptune"],
    correctAnswer: 1
  },
  {
    question: "What is the name of the largest moon in the solar system?",
    answers: ["Titan", "Ganymede", "Callisto", "Europa"],
    correctAnswer: 1
  },
  {
    question: "What happens to a star when it runs out of nuclear fuel?",
    answers: ["It explodes", "It becomes a black hole", "It depends on its mass", "It disappears"],
    correctAnswer: 2
  },
  {
    question: "Which space agency launched the Perseverance rover to Mars?",
    answers: ["ESA", "NASA", "Roscosmos", "JAXA"],
    correctAnswer: 1
  },
  {
    question: "What is the name of the effect that causes time to slow down near massive objects?",
    answers: ["Doppler effect", "Time dilation", "Red shift", "Gravitational lensing"],
    correctAnswer: 1
  },
  {
    question: "How many times has humanity landed on the Moon?",
    answers: ["3 times", "6 times", "9 times", "12 times"],
    correctAnswer: 1
  },
  {
    question: "What is the name of the first planet discovered using a telescope?",
    answers: ["Neptune", "Uranus", "Pluto", "Ceres"],
    correctAnswer: 1
  },
  {
    question: "Which element makes up most of the Sun's mass?",
    answers: ["Helium", "Hydrogen", "Carbon", "Oxygen"],
    correctAnswer: 1
  },
  {
    question: "What is the name of the spacecraft that provided our first close-up images of Pluto?",
    answers: ["Voyager 2", "New Horizons", "Cassini", "Pioneer 10"],
    correctAnswer: 1
  },

  // === BIOLOGY & MEDICINE (40 questions) ===
  {
    question: "What is the powerhouse of the cell?",
    answers: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
    correctAnswer: 1
  },
  {
    question: "Which blood type is known as the universal donor?",
    answers: ["A+", "B-", "AB+", "O-"],
    correctAnswer: 3
  },
  {
    question: "How many chambers does a human heart have?",
    answers: ["2", "3", "4", "5"],
    correctAnswer: 2
  },
  {
    question: "What is the study of fungi called?",
    answers: ["Mycology", "Bryology", "Phycology", "Lichenology"],
    correctAnswer: 0
  },
  {
    question: "Which hormone regulates blood sugar levels?",
    answers: ["Insulin", "Adrenaline", "Cortisol", "Thyroxine"],
    correctAnswer: 0
  },
  {
    question: "What is the largest bone in the human body?",
    answers: ["Tibia", "Femur", "Humerus", "Fibula"],
    correctAnswer: 1
  },
  {
    question: "How many pairs of chromosomes do humans typically have?",
    answers: ["22", "23", "24", "46"],
    correctAnswer: 1
  },
  {
    question: "What is the process by which plants make their food?",
    answers: ["Respiration", "Photosynthesis", "Fermentation", "Digestion"],
    correctAnswer: 1
  },
  {
    question: "Which part of the brain controls balance and coordination?",
    answers: ["Cerebrum", "Cerebellum", "Brain stem", "Hypothalamus"],
    correctAnswer: 1
  },
  {
    question: "What is the smallest unit of life?",
    answers: ["Atom", "Molecule", "Cell", "Tissue"],
    correctAnswer: 2
  },
  {
    question: "Which organ produces bile?",
    answers: ["Pancreas", "Gallbladder", "Liver", "Kidney"],
    correctAnswer: 2
  },
  {
    question: "What is the process of cell division called?",
    answers: ["Mitosis", "Meiosis", "Both A and B", "Osmosis"],
    correctAnswer: 2
  },
  {
    question: "How many bones are there in an adult human body?",
    answers: ["206", "208", "210", "215"],
    correctAnswer: 0
  },
  {
    question: "What is the main function of red blood cells?",
    answers: ["Fight infection", "Carry oxygen", "Clot blood", "Digest food"],
    correctAnswer: 1
  },
  {
    question: "Which vitamin is produced when skin is exposed to sunlight?",
    answers: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"],
    correctAnswer: 2
  },
  {
    question: "What is the longest muscle in the human body?",
    answers: ["Sartorius", "Biceps", "Quadriceps", "Gastrocnemius"],
    correctAnswer: 0
  },
  {
    question: "Which organelle is responsible for protein synthesis?",
    answers: ["Nucleus", "Ribosome", "Mitochondria", "Lysosome"],
    correctAnswer: 1
  },
  {
    question: "What is the normal resting heart rate for adults?",
    answers: ["40-60 bpm", "60-100 bpm", "100-120 bpm", "120-140 bpm"],
    correctAnswer: 1
  },
  {
    question: "Which gas do plants absorb from the atmosphere during photosynthesis?",
    answers: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    correctAnswer: 2
  },
  {
    question: "What is the study of heredity called?",
    answers: ["Genetics", "Genomics", "Phenomics", "Proteomics"],
    correctAnswer: 0
  },
  {
    question: "How many lungs does a typical human have?",
    answers: ["1", "2", "3", "4"],
    correctAnswer: 1
  },
  {
    question: "What is the main component of hair and nails?",
    answers: ["Collagen", "Keratin", "Elastin", "Chitin"],
    correctAnswer: 1
  },
  {
    question: "Which part of the eye controls the amount of light entering?",
    answers: ["Cornea", "Lens", "Pupil", "Retina"],
    correctAnswer: 2
  },
  {
    question: "What is the largest organ system in the human body?",
    answers: ["Nervous system", "Circulatory system", "Integumentary system", "Digestive system"],
    correctAnswer: 2
  },
  {
    question: "How long does it typically take for food to pass through the entire digestive system?",
    answers: ["12 hours", "24 hours", "48 hours", "72 hours"],
    correctAnswer: 2
  },
  {
    question: "What is the pH level of normal blood?",
    answers: ["6.8", "7.0", "7.4", "8.0"],
    correctAnswer: 2
  },
  {
    question: "Which part of the nervous system controls involuntary actions?",
    answers: ["Central nervous system", "Peripheral nervous system", "Autonomic nervous system", "Somatic nervous system"],
    correctAnswer: 2
  },
  {
    question: "What is the medical term for the kneecap?",
    answers: ["Patella", "Fibula", "Tibia", "Femur"],
    correctAnswer: 0
  },
  {
    question: "How many taste buds does an average human have?",
    answers: ["5,000", "10,000", "15,000", "20,000"],
    correctAnswer: 1
  },
  {
    question: "Which hormone is responsible for the 'fight or flight' response?",
    answers: ["Insulin", "Cortisol", "Adrenaline", "Dopamine"],
    correctAnswer: 2
  },
  {
    question: "What is the lifespan of a red blood cell?",
    answers: ["30 days", "60 days", "120 days", "180 days"],
    correctAnswer: 2
  },
  {
    question: "Which part of the brain is responsible for memory?",
    answers: ["Hippocampus", "Amygdala", "Thalamus", "Medulla"],
    correctAnswer: 0
  },
  {
    question: "What is the strongest muscle in the human body relative to its size?",
    answers: ["Heart", "Jaw muscle", "Tongue", "Calf muscle"],
    correctAnswer: 1
  },
  {
    question: "How many chambers does a frog's heart have?",
    answers: ["2", "3", "4", "5"],
    correctAnswer: 1
  },
  {
    question: "What is the medical term for high blood pressure?",
    answers: ["Hypotension", "Hypertension", "Tachycardia", "Bradycardia"],
    correctAnswer: 1
  },
  {
    question: "Which vitamin deficiency causes scurvy?",
    answers: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
    correctAnswer: 2
  },
  {
    question: "How many muscles are in the human face?",
    answers: ["33", "43", "53", "63"],
    correctAnswer: 1
  },
  {
    question: "What is the main function of the spleen?",
    answers: ["Filter blood", "Produce hormones", "Digest food", "Store fat"],
    correctAnswer: 0
  },
  {
    question: "Which type of cell division produces gametes?",
    answers: ["Mitosis", "Meiosis", "Binary fission", "Budding"],
    correctAnswer: 1
  },
  {
    question: "What is the average human body temperature in Celsius?",
    answers: ["35°C", "36°C", "37°C", "38°C"],
    correctAnswer: 2
  },

  // === CHEMISTRY & PHYSICS (40 questions) ===
  {
    question: "What is the chemical symbol for gold?",
    answers: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: 2
  },
  {
    question: "What is the most abundant element in the universe?",
    answers: ["Oxygen", "Carbon", "Hydrogen", "Helium"],
    correctAnswer: 2
  },
  {
    question: "At what temperature does water boil at sea level?",
    answers: ["90°C", "95°C", "100°C", "105°C"],
    correctAnswer: 2
  },
  {
    question: "What is the hardest natural substance on Earth?",
    answers: ["Quartz", "Diamond", "Titanium", "Granite"],
    correctAnswer: 1
  },
  {
    question: "How many electrons can the first shell of an atom hold?",
    answers: ["1", "2", "4", "8"],
    correctAnswer: 1
  },
  {
    question: "What is the chemical formula for methane?",
    answers: ["CH₄", "CO₂", "H₂O", "NH₃"],
    correctAnswer: 0
  },
  {
    question: "What is the speed of light in a vacuum?",
    answers: ["299,792,458 m/s", "300,000,000 m/s", "186,000 m/s", "150,000,000 m/s"],
    correctAnswer: 0
  },
  {
    question: "What is the atomic number of carbon?",
    answers: ["4", "6", "8", "12"],
    correctAnswer: 1
  },
  {
    question: "Which law states that energy cannot be created or destroyed?",
    answers: ["Newton's First Law", "Law of Conservation of Energy", "Boyle's Law", "Charles's Law"],
    correctAnswer: 1
  },
  {
    question: "What is the chemical symbol for sodium?",
    answers: ["So", "Sd", "Na", "S"],
    correctAnswer: 2
  },
  {
    question: "What type of bond is formed when electrons are shared between atoms?",
    answers: ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"],
    correctAnswer: 1
  },
  {
    question: "What is the pH of pure water?",
    answers: ["6", "7", "8", "9"],
    correctAnswer: 1
  },
  {
    question: "Which particle has no electric charge?",
    answers: ["Proton", "Electron", "Neutron", "Ion"],
    correctAnswer: 2
  },
  {
    question: "What is the chemical formula for table salt?",
    answers: ["NaCl", "KCl", "CaCl₂", "MgCl₂"],
    correctAnswer: 0
  },
  {
    question: "What is the unit of electric current?",
    answers: ["Volt", "Watt", "Ampere", "Ohm"],
    correctAnswer: 2
  },
  {
    question: "Which gas makes up approximately 78% of Earth's atmosphere?",
    answers: ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"],
    correctAnswer: 2
  },
  {
    question: "What is the melting point of ice?",
    answers: ["-1°C", "0°C", "1°C", "2°C"],
    correctAnswer: 1
  },
  {
    question: "What is the chemical symbol for iron?",
    answers: ["Ir", "Fe", "In", "I"],
    correctAnswer: 1
  },
  {
    question: "Which scientist developed the periodic table?",
    answers: ["Marie Curie", "Albert Einstein", "Dmitri Mendeleev", "Niels Bohr"],
    correctAnswer: 2
  },
  {
    question: "What is the most electronegative element?",
    answers: ["Oxygen", "Fluorine", "Nitrogen", "Chlorine"],
    correctAnswer: 1
  },
  {
    question: "What happens to the volume of a gas when temperature increases at constant pressure?",
    answers: ["Decreases", "Increases", "Stays the same", "Becomes zero"],
    correctAnswer: 1
  },
  {
    question: "What is the chemical formula for ammonia?",
    answers: ["NH₂", "NH₃", "NH₄", "N₂H₄"],
    correctAnswer: 1
  },
  {
    question: "Which force keeps electrons in orbit around the nucleus?",
    answers: ["Gravitational force", "Electromagnetic force", "Strong nuclear force", "Weak nuclear force"],
    correctAnswer: 1
  },
  {
    question: "What is the unit of frequency?",
    answers: ["Meter", "Second", "Hertz", "Joule"],
    correctAnswer: 2
  },
  {
    question: "What is the chemical symbol for potassium?",
    answers: ["P", "Po", "K", "Pt"],
    correctAnswer: 2
  },
  {
    question: "Which type of radiation has the highest energy?",
    answers: ["Alpha", "Beta", "Gamma", "X-ray"],
    correctAnswer: 2
  },
  {
    question: "What is the molecular formula for glucose?",
    answers: ["C₆H₁₂O₆", "C₁₂H₂₂O₁₁", "C₂H₅OH", "CH₃COOH"],
    correctAnswer: 0
  },
  {
    question: "What is the unit of power?",
    answers: ["Joule", "Watt", "Newton", "Pascal"],
    correctAnswer: 1
  },
  {
    question: "Which element has the highest atomic number that occurs naturally?",
    answers: ["Plutonium", "Uranium", "Thorium", "Radium"],
    correctAnswer: 1
  },
  {
    question: "What is the chemical formula for hydrogen peroxide?",
    answers: ["H₂O", "H₂O₂", "HO₂", "H₃O"],
    correctAnswer: 1
  },
  {
    question: "What is the SI unit of temperature?",
    answers: ["Celsius", "Fahrenheit", "Kelvin", "Rankine"],
    correctAnswer: 2
  },
  {
    question: "Which noble gas is most abundant in the atmosphere?",
    answers: ["Helium", "Neon", "Argon", "Krypton"],
    correctAnswer: 2
  },
  {
    question: "What is the charge of a proton?",
    answers: ["+1", "-1", "0", "+2"],
    correctAnswer: 0
  },
  {
    question: "Which law describes the relationship between pressure and volume of a gas?",
    answers: ["Charles's Law", "Boyle's Law", "Gay-Lussac's Law", "Avogadro's Law"],
    correctAnswer: 1
  },
  {
    question: "What is the chemical symbol for mercury?",
    answers: ["Me", "Mr", "Hg", "Mc"],
    correctAnswer: 2
  },
  {
    question: "How many valence electrons does oxygen have?",
    answers: ["4", "6", "8", "2"],
    correctAnswer: 1
  },
  {
    question: "What is the unit of electric resistance?",
    answers: ["Ampere", "Volt", "Ohm", "Coulomb"],
    correctAnswer: 2
  },
  {
    question: "Which isotope of carbon is used in radiocarbon dating?",
    answers: ["Carbon-12", "Carbon-13", "Carbon-14", "Carbon-15"],
    correctAnswer: 2
  },
  {
    question: "What is the chemical formula for sulfuric acid?",
    answers: ["H₂SO₃", "H₂SO₄", "HSO₄", "SO₄"],
    correctAnswer: 1
  },
  {
    question: "What is the acceleration due to gravity on Earth?",
    answers: ["9.8 m/s²", "10 m/s²", "9.6 m/s²", "8.9 m/s²"],
    correctAnswer: 0
  },

  // === WORLD CULTURES & LANGUAGES (40 questions) ===
  {
    question: "What is the most widely spoken language in the world?",
    answers: ["English", "Mandarin Chinese", "Spanish", "Hindi"],
    correctAnswer: 1
  },
  {
    question: "Which country is known as the 'Land of the Rising Sun'?",
    answers: ["China", "South Korea", "Japan", "Thailand"],
    correctAnswer: 2
  },
  {
    question: "What is the traditional greeting in India with palms pressed together?",
    answers: ["Namaste", "Konnichiwa", "Salaam", "Shalom"],
    correctAnswer: 0
  },
  {
    question: "Which festival is known as the 'Festival of Lights' in Hinduism?",
    answers: ["Holi", "Diwali", "Navratri", "Dussehra"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional dress worn by men in Scotland?",
    answers: ["Kilt", "Toga", "Kimono", "Sari"],
    correctAnswer: 0
  },
  {
    question: "Which language uses the Cyrillic alphabet?",
    answers: ["Greek", "Arabic", "Russian", "Hebrew"],
    correctAnswer: 2
  },
  {
    question: "What is the traditional New Year celebration in China called?",
    answers: ["Golden Week", "Spring Festival", "Mid-Autumn Festival", "Dragon Boat Festival"],
    correctAnswer: 1
  },
  {
    question: "Which country is famous for the tango dance?",
    answers: ["Brazil", "Argentina", "Spain", "Mexico"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional martial art of Japan?",
    answers: ["Karate", "Kung Fu", "Taekwondo", "Muay Thai"],
    correctAnswer: 0
  },
  {
    question: "Which continent has the most languages spoken?",
    answers: ["Asia", "Africa", "Europe", "South America"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional bread eaten during Jewish Passover?",
    answers: ["Challah", "Matzo", "Bagel", "Pita"],
    correctAnswer: 1
  },
  {
    question: "Which country celebrates Dia de los Muertos (Day of the Dead)?",
    answers: ["Spain", "Mexico", "Guatemala", "Peru"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional garment worn by women in India?",
    answers: ["Kimono", "Sari", "Hanbok", "Cheongsam"],
    correctAnswer: 1
  },
  {
    question: "Which language has the most native speakers in Europe?",
    answers: ["English", "French", "German", "Russian"],
    correctAnswer: 3
  },
  {
    question: "What is the traditional dance of Hawaii?",
    answers: ["Hula", "Salsa", "Flamenco", "Ballet"],
    correctAnswer: 0
  },
  {
    question: "Which country is known for its fjords?",
    answers: ["Sweden", "Denmark", "Norway", "Finland"],
    correctAnswer: 2
  },
  {
    question: "What is the traditional tea ceremony country?",
    answers: ["China", "India", "Japan", "England"],
    correctAnswer: 2
  },
  {
    question: "Which festival involves throwing colored powder in India?",
    answers: ["Diwali", "Holi", "Karva Chauth", "Raksha Bandhan"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional instrument of Scotland?",
    answers: ["Violin", "Bagpipes", "Harp", "Flute"],
    correctAnswer: 1
  },
  {
    question: "Which country is famous for flamenco dancing?",
    answers: ["Portugal", "Italy", "Spain", "Greece"],
    correctAnswer: 2
  },
  {
    question: "What is the traditional writing system of Japan that uses Chinese characters?",
    answers: ["Hiragana", "Katakana", "Kanji", "Romaji"],
    correctAnswer: 2
  },
  {
    question: "Which country celebrates Oktoberfest?",
    answers: ["Austria", "Germany", "Switzerland", "Belgium"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional boat used in Venice, Italy?",
    answers: ["Canoe", "Gondola", "Yacht", "Sailboat"],
    correctAnswer: 1
  },
  {
    question: "Which language is spoken in Brazil?",
    answers: ["Spanish", "Portuguese", "Italian", "French"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional fermented cabbage dish from Korea?",
    answers: ["Sauerkraut", "Kimchi", "Coleslaw", "Pickles"],
    correctAnswer: 1
  },
  {
    question: "Which country is known for its aboriginal didgeridoo instrument?",
    answers: ["New Zealand", "Australia", "Papua New Guinea", "Fiji"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional costume worn during German Oktoberfest?",
    answers: ["Lederhosen", "Kimono", "Kilt", "Toga"],
    correctAnswer: 0
  },
  {
    question: "Which country is famous for its tulips and windmills?",
    answers: ["Belgium", "Netherlands", "Denmark", "Luxembourg"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional Russian nesting doll called?",
    answers: ["Babushka", "Matryoshka", "Balalaika", "Troika"],
    correctAnswer: 1
  },
  {
    question: "Which country celebrates the Running of the Bulls?",
    answers: ["Portugal", "Spain", "Mexico", "Argentina"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional wrap-around skirt worn in many Pacific islands?",
    answers: ["Sarong", "Kilt", "Pareo", "Both A and C"],
    correctAnswer: 3
  },
  {
    question: "Which language family does Finnish belong to?",
    answers: ["Indo-European", "Finno-Ugric", "Altaic", "Sino-Tibetan"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional headwear worn by Sikh men?",
    answers: ["Turban", "Kufi", "Kippah", "Taqiyah"],
    correctAnswer: 0
  },
  {
    question: "Which country is known for its carnival celebration in Rio de Janeiro?",
    answers: ["Argentina", "Colombia", "Brazil", "Venezuela"],
    correctAnswer: 2
  },
  {
    question: "What is the traditional bamboo instrument from Romania?",
    answers: ["Panpipe", "Nai", "Recorder", "Flute"],
    correctAnswer: 1
  },
  {
    question: "Which country celebrates La Tomatina (tomato throwing festival)?",
    answers: ["Italy", "Spain", "Portugal", "France"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional throat singing called in Mongolia?",
    answers: ["Khoomei", "Yodel", "Scat", "Vibrato"],
    correctAnswer: 0
  },
  {
    question: "Which language uses the Arabic script but is not Arabic?",
    answers: ["Hebrew", "Persian", "Turkish", "Kurdish"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional New Zealand war dance performed by the rugby team?",
    answers: ["Hula", "Haka", "Tango", "Samba"],
    correctAnswer: 1
  },
  {
    question: "Which country is famous for its sauna culture?",
    answers: ["Sweden", "Norway", "Finland", "Denmark"],
    correctAnswer: 2
  },

  // === FOOD & COOKING (40 questions) ===
  {
    question: "What spice is derived from the Crocus flower?",
    answers: ["Turmeric", "Saffron", "Paprika", "Cardamom"],
    correctAnswer: 1
  },
  {
    question: "Which country is the origin of the croissant?",
    answers: ["France", "Austria", "Italy", "Belgium"],
    correctAnswer: 1
  },
  {
    question: "What is the main ingredient in traditional Japanese miso soup?",
    answers: ["Soy sauce", "Fermented soybean paste", "Rice wine", "Seaweed"],
    correctAnswer: 1
  },
  {
    question: "Which pepper is considered the hottest in the world?",
    answers: ["Ghost pepper", "Carolina Reaper", "Habanero", "Scotch bonnet"],
    correctAnswer: 1
  },
  {
    question: "What is the French cooking technique of cooking food slowly in its own fat?",
    answers: ["Braising", "Confit", "Poaching", "Sautéing"],
    correctAnswer: 1
  },
  {
    question: "Which vitamin is abundant in citrus fruits?",
    answers: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
    correctAnswer: 2
  },
  {
    question: "What is the main ingredient in traditional hummus?",
    answers: ["Lentils", "Chickpeas", "Black beans", "Kidney beans"],
    correctAnswer: 1
  },
  {
    question: "Which cheese is traditionally used in Greek salad?",
    answers: ["Mozzarella", "Cheddar", "Feta", "Gouda"],
    correctAnswer: 2
  },
  {
    question: "What is the cooking method where food is cooked in an oven using dry heat?",
    answers: ["Roasting", "Steaming", "Poaching", "Braising"],
    correctAnswer: 0
  },
  {
    question: "Which country is famous for inventing pizza?",
    answers: ["France", "Greece", "Italy", "Spain"],
    correctAnswer: 2
  },
  {
    question: "What is the main ingredient in traditional Japanese sake?",
    answers: ["Wheat", "Rice", "Barley", "Corn"],
    correctAnswer: 1
  },
  {
    question: "Which herb is commonly used in Italian cuisine and means 'royal' in Greek?",
    answers: ["Oregano", "Basil", "Thyme", "Rosemary"],
    correctAnswer: 1
  },
  {
    question: "What is the French term for 'everything in its place' in cooking?",
    answers: ["Mise en scene", "Mise en place", "Bon appétit", "À la carte"],
    correctAnswer: 1
  },
  {
    question: "Which country is the largest producer of coffee beans?",
    answers: ["Colombia", "Vietnam", "Brazil", "Ethiopia"],
    correctAnswer: 2
  },
  {
    question: "What is the main protein in wheat that gives bread its elasticity?",
    answers: ["Casein", "Albumin", "Gluten", "Keratin"],
    correctAnswer: 2
  },
  {
    question: "Which cooking method involves cooking food in liquid at just below boiling point?",
    answers: ["Simmering", "Boiling", "Steaming", "Blanching"],
    correctAnswer: 0
  },
  {
    question: "What is the traditional sweetener used in Mexican horchata?",
    answers: ["Honey", "Agave", "Cinnamon sugar", "Brown sugar"],
    correctAnswer: 2
  },
  {
    question: "Which grain is used to make traditional Japanese sake?",
    answers: ["Wheat", "Barley", "Rice", "Corn"],
    correctAnswer: 2
  },
  {
    question: "What is the main ingredient in traditional Indian dal?",
    answers: ["Rice", "Lentils", "Chickpeas", "Wheat"],
    correctAnswer: 1
  },
  {
    question: "Which country is famous for creating the Caesar salad?",
    answers: ["Italy", "Mexico", "United States", "Greece"],
    correctAnswer: 1
  },
  {
    question: "What is the French pastry technique for making flaky layers?",
    answers: ["Choux", "Pâte brisée", "Lamination", "Creaming"],
    correctAnswer: 2
  },
  {
    question: "Which spice is known as the 'Queen of Spices'?",
    answers: ["Saffron", "Cardamom", "Cinnamon", "Nutmeg"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional fermented Korean vegetable dish?",
    answers: ["Sauerkraut", "Pickles", "Kimchi", "Coleslaw"],
    correctAnswer: 2
  },
  {
    question: "Which cooking fat has the highest smoke point?",
    answers: ["Butter", "Olive oil", "Coconut oil", "Avocado oil"],
    correctAnswer: 3
  },
  {
    question: "What is the main ingredient in traditional Middle Eastern tahini?",
    answers: ["Sunflower seeds", "Sesame seeds", "Pumpkin seeds", "Pine nuts"],
    correctAnswer: 1
  },
  {
    question: "Which country is the origin of the sandwich?",
    answers: ["United States", "England", "France", "Germany"],
    correctAnswer: 1
  },
  {
    question: "What is the cooking technique where vegetables are briefly cooked in boiling water?",
    answers: ["Steaming", "Sautéing", "Blanching", "Braising"],
    correctAnswer: 2
  },
  {
    question: "Which pepper is used to make traditional paprika?",
    answers: ["Bell pepper", "Jalapeño", "Cayenne", "All of the above"],
    correctAnswer: 3
  },
  {
    question: "What is the main ingredient in traditional Spanish gazpacho?",
    answers: ["Beans", "Tomatoes", "Peppers", "Onions"],
    correctAnswer: 1
  },
  {
    question: "Which country is famous for creating fondue?",
    answers: ["France", "Switzerland", "Austria", "Germany"],
    correctAnswer: 1
  },
  {
    question: "What is the fermentation process that creates sourdough's tangy flavor?",
    answers: ["Alcoholic fermentation", "Lactic acid fermentation", "Acetic acid fermentation", "Malolactic fermentation"],
    correctAnswer: 1
  },
  {
    question: "Which cut of beef is traditionally used for filet mignon?",
    answers: ["Sirloin", "Tenderloin", "Ribeye", "Strip loin"],
    correctAnswer: 1
  },
  {
    question: "What is the traditional Italian pasta shape that means 'little worms'?",
    answers: ["Spaghetti", "Vermicelli", "Angel hair", "Linguine"],
    correctAnswer: 1
  },
  {
    question: "Which country is the largest producer of vanilla?",
    answers: ["Mexico", "Madagascar", "Indonesia", "India"],
    correctAnswer: 1
  },
  {
    question: "What is the cooking method where meat is cooked in liquid for a long time?",
    answers: ["Grilling", "Roasting", "Braising", "Searing"],
    correctAnswer: 2
  },
  {
    question: "Which type of flour has the highest protein content?",
    answers: ["All-purpose flour", "Cake flour", "Bread flour", "Pastry flour"],
    correctAnswer: 2
  },
  {
    question: "What is the traditional thickening agent used in French roux?",
    answers: ["Cornstarch", "Flour", "Arrowroot", "Tapioca"],
    correctAnswer: 1
  },
  {
    question: "Which country is famous for creating the original recipe for Worcestershire sauce?",
    answers: ["United States", "England", "France", "India"],
    correctAnswer: 1
  },
  {
    question: "What is the main flavoring in traditional Greek ouzo?",
    answers: ["Mint", "Anise", "Orange", "Lemon"],
    correctAnswer: 1
  },
  {
    question: "Which cooking method involves submerging food in hot fat?",
    answers: ["Sautéing", "Pan-frying", "Deep-frying", "Stir-frying"],
    correctAnswer: 2
  },

  // === INVENTIONS & INNOVATIONS (40 questions) ===
  {
    question: "Who invented the telephone?",
    answers: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Benjamin Franklin"],
    correctAnswer: 1
  },
  {
    question: "In what year was the first iPhone released?",
    answers: ["2005", "2006", "2007", "2008"],
    correctAnswer: 2
  },
  {
    question: "Who invented the World Wide Web?",
    answers: ["Bill Gates", "Steve Jobs", "Tim Berners-Lee", "Mark Zuckerberg"],
    correctAnswer: 2
  },
  {
    question: "What was the first antibiotic discovered?",
    answers: ["Streptomycin", "Tetracycline", "Penicillin", "Erythromycin"],
    correctAnswer: 2
  },
  {
    question: "Who invented the printing press with movable type?",
    answers: ["Johannes Gutenberg", "William Caxton", "Aldus Manutius", "Christopher Plantin"],
    correctAnswer: 0
  },
  {
    question: "In what year was the first personal computer (Altair 8800) released?",
    answers: ["1973", "1974", "1975", "1976"],
    correctAnswer: 2
  },
  {
    question: "Who invented the electric light bulb?",
    answers: ["Nikola Tesla", "Thomas Edison", "Joseph Swan", "Both B and C"],
    correctAnswer: 3
  },
  {
    question: "What was the first video game console?",
    answers: ["Atari 2600", "Magnavox Odyssey", "Nintendo Entertainment System", "Pong"],
    correctAnswer: 1
  },
  {
    question: "Who invented the radio?",
    answers: ["Guglielmo Marconi", "Heinrich Hertz", "James Clerk Maxwell", "Lee de Forest"],
    correctAnswer: 0
  },
  {
    question: "In what year was the first email sent?",
    answers: ["1969", "1971", "1973", "1975"],
    correctAnswer: 1
  },
  {
    question: "Who invented the television?",
    answers: ["John Logie Baird", "Philo Farnsworth", "Vladimir Zworykin", "All of the above"],
    correctAnswer: 3
  },
  {
    question: "What was the first search engine on the internet?",
    answers: ["Yahoo", "Google", "Archie", "AltaVista"],
    correctAnswer: 2
  },
  {
    question: "Who invented the airplane?",
    answers: ["Wright brothers", "Santos Dumont", "Glenn Curtiss", "Louis Blériot"],
    correctAnswer: 0
  },
  {
    question: "In what year was the first microprocessor invented?",
    answers: ["1969", "1970", "1971", "1972"],
    correctAnswer: 2
  },
  {
    question: "Who invented the steam engine?",
    answers: ["James Watt", "Thomas Newcomen", "Richard Trevithick", "George Stephenson"],
    correctAnswer: 1
  },
  {
    question: "What was the first social media platform?",
    answers: ["Friendster", "MySpace", "Six Degrees", "LiveJournal"],
    correctAnswer: 2
  },
  {
    question: "Who invented the X-ray machine?",
    answers: ["Marie Curie", "Wilhelm Röntgen", "Henri Becquerel", "Ernest Rutherford"],
    correctAnswer: 1
  },
  {
    question: "In what year was GPS first made available for civilian use?",
    answers: ["1983", "1990", "1995", "2000"],
    correctAnswer: 3
  },
  {
    question: "Who invented the laser?",
    answers: ["Albert Einstein", "Theodore Maiman", "Charles Townes", "Arthur Schawlow"],
    correctAnswer: 1
  },
  {
    question: "What was the first programming language?",
    answers: ["FORTRAN", "COBOL", "Assembly", "Machine code"],
    correctAnswer: 0
  },
  {
    question: "Who invented the pneumatic tire?",
    answers: ["John Boyd Dunlop", "Édouard Michelin", "Charles Goodyear", "Robert Thomson"],
    correctAnswer: 0
  },
  {
    question: "In what year was the first mobile phone call made?",
    answers: ["1971", "1973", "1975", "1977"],
    correctAnswer: 1
  },
  {
    question: "Who invented the photocopier?",
    answers: ["Chester Carlson", "Edwin Land", "Harold Edgerton", "Wilson Greatbatch"],
    correctAnswer: 0
  },
  {
    question: "What was the first artificial satellite launched into space?",
    answers: ["Explorer 1", "Vanguard 1", "Sputnik 1", "Luna 1"],
    correctAnswer: 2
  },
  {
    question: "Who invented the stethoscope?",
    answers: ["René Laennec", "Wilhelm Röntgen", "Louis Pasteur", "Joseph Lister"],
    correctAnswer: 0
  },
  {
    question: "In what year was the first ATM installed?",
    answers: ["1965", "1967", "1969", "1971"],
    correctAnswer: 1
  },
  {
    question: "Who invented the mechanical calculator?",
    answers: ["Blaise Pascal", "Gottfried Leibniz", "Charles Babbage", "Both A and B"],
    correctAnswer: 3
  },
  {
    question: "What was the first web browser?",
    answers: ["Mosaic", "WorldWideWeb", "Netscape", "Internet Explorer"],
    correctAnswer: 1
  },
  {
    question: "Who invented the refrigerator?",
    answers: ["Jacob Perkins", "William Cullen", "Oliver Evans", "All contributed"],
    correctAnswer: 3
  },
  {
    question: "In what year was the first CD (Compact Disc) released?",
    answers: ["1980", "1982", "1984", "1986"],
    correctAnswer: 1
  },
  {
    question: "Who invented the zipper?",
    answers: ["Whitcomb Judson", "Gideon Sundback", "Elias Howe", "Both A and B"],
    correctAnswer: 3
  },
  {
    question: "What was the first instant messaging service?",
    answers: ["ICQ", "AOL Instant Messenger", "IRC", "Yahoo Messenger"],
    correctAnswer: 2
  },
  {
    question: "Who invented the ballpoint pen?",
    answers: ["László Bíró", "John Loud", "Marcel Bich", "Both A and B"],
    correctAnswer: 3
  },
  {
    question: "In what year was the first digital camera invented?",
    answers: ["1973", "1975", "1977", "1979"],
    correctAnswer: 1
  },
  {
    question: "Who invented the microwave oven?",
    answers: ["Percy Spencer", "John Bardeen", "Walter Brattain", "William Shockley"],
    correctAnswer: 0
  },
  {
    question: "What was the first electronic computer?",
    answers: ["UNIVAC", "ENIAC", "EDVAC", "MARK I"],
    correctAnswer: 1
  },
  {
    question: "Who invented the safety pin?",
    answers: ["Walter Hunt", "Elias Howe", "Isaac Singer", "Thomas Saint"],
    correctAnswer: 0
  },
  {
    question: "In what year was YouTube founded?",
    answers: ["2003", "2004", "2005", "2006"],
    correctAnswer: 2
  },
  {
    question: "Who invented the electric motor?",
    answers: ["Michael Faraday", "Joseph Henry", "Thomas Davenport", "All contributed"],
    correctAnswer: 3
  },
  {
    question: "What was the first commercially successful video game?",
    answers: ["Pong", "Space Invaders", "Pac-Man", "Asteroids"],
    correctAnswer: 0
  },

  // === MATHEMATICS & LOGIC (22 questions) ===
  {
    question: "What is the value of π (pi) to two decimal places?",
    answers: ["3.14", "3.15", "3.16", "3.17"],
    correctAnswer: 0
  },
  {
    question: "What is the square root of 144?",
    answers: ["11", "12", "13", "14"],
    correctAnswer: 1
  },
  {
    question: "In a right triangle, what is the relationship between the sides called?",
    answers: ["Pythagorean theorem", "Euclidean theorem", "Geometric theorem", "Trigonometric theorem"],
    correctAnswer: 0
  },
  {
    question: "What is 7! (7 factorial)?",
    answers: ["49", "343", "5040", "7000"],
    correctAnswer: 2
  },
  {
    question: "What is the sum of angles in a triangle?",
    answers: ["90 degrees", "180 degrees", "270 degrees", "360 degrees"],
    correctAnswer: 1
  },
  {
    question: "What is the next number in the Fibonacci sequence: 1, 1, 2, 3, 5, 8, ?",
    answers: ["11", "12", "13", "15"],
    correctAnswer: 2
  },
  {
    question: "What is the mathematical term for the average of a set of numbers?",
    answers: ["Median", "Mode", "Mean", "Range"],
    correctAnswer: 2
  },
  {
    question: "What is the area of a circle with radius 5?",
    answers: ["25π", "10π", "5π", "15π"],
    correctAnswer: 0
  },
  {
    question: "What is the slope of a line perpendicular to y = 2x + 3?",
    answers: ["2", "-2", "1/2", "-1/2"],
    correctAnswer: 3
  },
  {
    question: "What is the greatest common divisor (GCD) of 12 and 18?",
    answers: ["2", "3", "6", "9"],
    correctAnswer: 2
  },
  {
    question: "What is 2^10?",
    answers: ["100", "512", "1024", "2048"],
    correctAnswer: 2
  },
  {
    question: "In probability, what is the chance of rolling a 6 on a fair six-sided die?",
    answers: ["1/6", "1/5", "1/4", "1/3"],
    correctAnswer: 0
  },
  {
    question: "What is the derivative of x²?",
    answers: ["x", "2x", "x²", "2"],
    correctAnswer: 1
  },
  {
    question: "What is the volume of a cube with side length 4?",
    answers: ["16", "48", "64", "256"],
    correctAnswer: 2
  },
  {
    question: "What is the least common multiple (LCM) of 4 and 6?",
    answers: ["10", "12", "24", "2"],
    correctAnswer: 1
  },
  {
    question: "What is log₁₀(100)?",
    answers: ["1", "2", "10", "100"],
    correctAnswer: 1
  },
  {
    question: "What is the sum of the first 10 positive integers?",
    answers: ["45", "50", "55", "100"],
    correctAnswer: 2
  },
  {
    question: "What is the mathematical constant 'e' approximately equal to?",
    answers: ["2.618", "2.718", "3.142", "1.414"],
    correctAnswer: 1
  },
  {
    question: "How many diagonals does a pentagon have?",
    answers: ["3", "4", "5", "10"],
    correctAnswer: 2
  },
  {
    question: "What is the integral of 2x?",
    answers: ["x²", "x² + C", "2", "2x + C"],
    correctAnswer: 1
  },
  {
    question: "In a normal distribution, what percentage of data falls within one standard deviation?",
    answers: ["68%", "95%", "99%", "50%"],
    correctAnswer: 0
  },
  {
    question: "What is the hypotenuse of a right triangle with legs of length 3 and 4?",
    answers: ["5", "6", "7", "12"],
    correctAnswer: 0
  }
];