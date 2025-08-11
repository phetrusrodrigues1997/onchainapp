interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

// Import questions from the second file
import { triviaQuestions2 } from './triviaQuestions2';

export const triviaQuestions: TriviaQuestion[] = [
  // Science (60 questions)
  {
    question: "What is the chemical symbol for gold?",
    options: ["Gd", "Au", "Ag", "Go"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which planet is closest to the Sun?",
    options: ["Venus", "Earth", "Mercury", "Mars"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What gas do plants absorb from the atmosphere during photosynthesis?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond", "Quartz"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "How many chambers does a human heart have?",
    options: ["Two", "Three", "Four", "Five"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the speed of light in vacuum?",
    options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "299,792,458 m/s"],
    correctAnswer: 3,
    category: "Science"
  },
  {
    question: "Which blood type is considered the universal donor?",
    options: ["A+", "B+", "AB+", "O-"],
    correctAnswer: 3,
    category: "Science"
  },
  {
    question: "What is the most abundant gas in Earth's atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the smallest unit of matter?",
    options: ["Molecule", "Atom", "Proton", "Electron"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which organ produces insulin?",
    options: ["Liver", "Kidney", "Pancreas", "Heart"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the formula for water?",
    options: ["H2O", "CO2", "NaCl", "CH4"],
    correctAnswer: 0,
    category: "Science"
  },
  {
    question: "What type of animal is a dolphin?",
    options: ["Fish", "Mammal", "Reptile", "Amphibian"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "How many bones are in an adult human body?",
    options: ["195", "206", "215", "230"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the largest organ in the human body?",
    options: ["Brain", "Liver", "Lungs", "Skin"],
    correctAnswer: 3,
    category: "Science"
  },
  {
    question: "Which element has the atomic number 1?",
    options: ["Helium", "Hydrogen", "Lithium", "Carbon"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the boiling point of water at sea level?",
    options: ["90°C", "100°C", "110°C", "120°C"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which scientist developed the theory of evolution?",
    options: ["Einstein", "Newton", "Darwin", "Tesla"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the largest planet in our solar system?",
    options: ["Saturn", "Jupiter", "Neptune", "Earth"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the study of earthquakes called?",
    options: ["Geology", "Seismology", "Meteorology", "Astronomy"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which vitamin is produced when skin is exposed to sunlight?",
    options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
    correctAnswer: 3,
    category: "Science"
  },
  {
    question: "What is the pH level of pure water?",
    options: ["6", "7", "8", "9"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which organelle is known as the powerhouse of the cell?",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which planet has the most moons?",
    options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the chemical formula for table salt?",
    options: ["NaCl", "KCl", "CaCl2", "MgCl2"],
    correctAnswer: 0,
    category: "Science"
  },
  {
    question: "What is the boiling point of water at sea level in Celsius?",
    options: ["90°C", "95°C", "100°C", "105°C"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "Which blood vessels carry blood away from the heart?",
    options: ["Veins", "Arteries", "Capillaries", "Ventricles"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which gas is most responsible for global warming?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the process by which plants make their own food?",
    options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the name of our galaxy?",
    options: ["Andromeda", "Milky Way", "Whirlpool", "Sombrero"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which scientist is famous for the equation E=mc²?",
    options: ["Newton", "Einstein", "Curie", "Hawking"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the study of heredity called?",
    options: ["Biology", "Genetics", "Anatomy", "Physiology"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which part of the brain controls balance?",
    options: ["Cerebrum", "Cerebellum", "Medulla", "Hypothalamus"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the chemical symbol for iron?",
    options: ["Ir", "Fe", "In", "I"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the main component of the Sun?",
    options: ["Oxygen", "Carbon", "Hydrogen", "Helium"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "Which scientist discovered penicillin?",
    options: ["Louis Pasteur", "Alexander Fleming", "Marie Curie", "Joseph Lister"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the normal human body temperature in Fahrenheit?",
    options: ["96.8°F", "98.6°F", "100.4°F", "102.2°F"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which force keeps planets in orbit around the Sun?",
    options: ["Magnetism", "Gravity", "Nuclear force", "Electromagnetic force"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the most common type of star in the universe?",
    options: ["Red giant", "White dwarf", "Red dwarf", "Blue giant"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the speed of sound in air at room temperature?",
    options: ["343 m/s", "300 m/s", "400 m/s", "500 m/s"],
    correctAnswer: 0,
    category: "Science"
  },
  {
    question: "Which particles are found in the nucleus of an atom?",
    options: ["Electrons and neutrons", "Protons and electrons", "Protons and neutrons", "Only protons"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the term for animals that eat both plants and meat?",
    options: ["Herbivores", "Carnivores", "Omnivores", "Decomposers"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "Which layer of the atmosphere contains the ozone layer?",
    options: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the chemical formula for water?",
    options: ["H2O", "HO2", "H3O", "H2O2"],
    correctAnswer: 0,
    category: "Science"
  },
  {
    question: "Which scientist proposed the heliocentric model of the solar system?",
    options: ["Galileo", "Kepler", "Copernicus", "Newton"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "Which type of rock is formed by cooling magma?",
    options: ["Sedimentary", "Metamorphic", "Igneous", "Mineral"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the unit of electric current?",
    options: ["Volt", "Watt", "Ampere", "Ohm"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "Which hormone regulates blood sugar levels?",
    options: ["Adrenaline", "Insulin", "Thyroxine", "Cortisol"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "What is the study of fungi called?",
    options: ["Botany", "Zoology", "Mycology", "Ecology"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "Which element is essential for thyroid function?",
    options: ["Iron", "Calcium", "Iodine", "Zinc"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the smallest particle of an element?",
    options: ["Molecule", "Compound", "Atom", "Ion"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "Which planet has rings around it?",
    options: ["Mars", "Venus", "Saturn", "Mercury"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the process of cell division called?",
    options: ["Meiosis", "Mitosis", "Both A and B", "Photosynthesis"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "Which vitamin prevents scurvy?",
    options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the center of an atom called?",
    options: ["Electron", "Nucleus", "Proton", "Neutron"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which gas do we exhale when we breathe out?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the study of weather called?",
    options: ["Geology", "Geography", "Meteorology", "Astronomy"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "Which organ filters blood in the human body?",
    options: ["Liver", "Heart", "Kidneys", "Lungs"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    question: "What is the approximate age of the Earth?",
    options: ["3.5 billion years", "4.5 billion years", "5.5 billion years", "6.5 billion years"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    question: "Which scientist developed the periodic table?",
    options: ["Marie Curie", "Dmitri Mendeleev", "Antoine Lavoisier", "John Dalton"],
    correctAnswer: 1,
    category: "Science"
  },
  // Geography (53 questions)
  {
    question: "What is the capital of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Perth"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which is the longest river in the world?",
    options: ["Amazon", "Nile", "Mississippi", "Yangtze"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "Which country has the most time zones?",
    options: ["USA", "Russia", "China", "Canada"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the smallest country in the world?",
    options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which mountain range contains Mount Everest?",
    options: ["Andes", "Rocky Mountains", "Alps", "Himalayas"],
    correctAnswer: 3,
    category: "Geography"
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctAnswer: 3,
    category: "Geography"
  },
  {
    question: "Which desert is the largest in the world?",
    options: ["Sahara", "Gobi", "Antarctic", "Arabian"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the capital of Brazil?",
    options: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which continent has the most countries?",
    options: ["Asia", "Europe", "Africa", "South America"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the deepest point on Earth?",
    options: ["Dead Sea", "Grand Canyon", "Mariana Trench", "Lake Baikal"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which country is both in Europe and Asia?",
    options: ["Russia", "Turkey", "Kazakhstan", "All of the above"],
    correctAnswer: 3,
    category: "Geography"
  },
  {
    question: "What is the largest island in the world?",
    options: ["Australia", "Greenland", "New Guinea", "Madagascar"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "Which city is known as the 'City of Love'?",
    options: ["Rome", "Venice", "Paris", "Vienna"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the highest waterfall in the world?",
    options: ["Niagara Falls", "Victoria Falls", "Angel Falls", "Iguazu Falls"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which African country was never colonized?",
    options: ["Ghana", "Ethiopia", "Kenya", "Nigeria"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the largest lake in the world by surface area?",
    options: ["Lake Superior", "Caspian Sea", "Lake Victoria", "Lake Huron"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "Which country has the longest coastline?",
    options: ["Australia", "Russia", "Canada", "USA"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the capital of Canada?",
    options: ["Toronto", "Vancouver", "Montreal", "Ottawa"],
    correctAnswer: 3,
    category: "Geography"
  },
  {
    question: "Which strait separates Europe from Africa?",
    options: ["Strait of Hormuz", "Strait of Gibraltar", "Bering Strait", "Strait of Malacca"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the most populous city in the world?",
    options: ["New York", "Tokyo", "Shanghai", "Mumbai"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the deepest point in the ocean?",
    options: ["Puerto Rico Trench", "Mariana Trench", "Java Trench", "Peru-Chile Trench"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "Which African country is completely surrounded by South Africa?",
    options: ["Swaziland", "Lesotho", "Botswana", "Namibia"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "Which strait separates Europe and Africa?",
    options: ["Strait of Hormuz", "Strait of Gibraltar", "Bosphorus Strait", "Strait of Malacca"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "Which lake is the largest by volume of water?",
    options: ["Lake Superior", "Lake Baikal", "Caspian Sea", "Lake Victoria"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the largest country in South America?",
    options: ["Argentina", "Peru", "Colombia", "Brazil"],
    correctAnswer: 3,
    category: "Geography"
  },
  {
    question: "Which sea is the saltiest?",
    options: ["Red Sea", "Dead Sea", "Mediterranean Sea", "Baltic Sea"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the capital of New Zealand?",
    options: ["Auckland", "Christchurch", "Wellington", "Hamilton"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which river flows through Paris?",
    options: ["Thames", "Rhine", "Seine", "Danube"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the smallest continent?",
    options: ["Europe", "Australia", "Antarctica", "South America"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "Which city is located on two continents?",
    options: ["Cairo", "Istanbul", "Moscow", "Tehran"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the largest gulf in the world?",
    options: ["Gulf of Mexico", "Persian Gulf", "Gulf of Alaska", "Bay of Bengal"],
    correctAnswer: 0,
    category: "Geography"
  },
  {
    question: "Which country is known as the Land of the Rising Sun?",
    options: ["China", "South Korea", "Japan", "Thailand"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the capital of Egypt?",
    options: ["Alexandria", "Cairo", "Giza", "Luxor"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "Which plateau is known as the 'Roof of the World'?",
    options: ["Deccan Plateau", "Tibetan Plateau", "Altiplano", "Colorado Plateau"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the largest peninsula in the world?",
    options: ["Iberian Peninsula", "Indian Peninsula", "Arabian Peninsula", "Scandinavian Peninsula"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which river is the longest in Europe?",
    options: ["Danube", "Rhine", "Volga", "Dnieper"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the capital of South Korea?",
    options: ["Busan", "Incheon", "Seoul", "Daegu"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which country is home to the ancient city of Petra?",
    options: ["Syria", "Lebanon", "Jordan", "Israel"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the largest rainforest in the world?",
    options: ["Congo Rainforest", "Amazon Rainforest", "Southeast Asian Rainforest", "Temperate Rainforest"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "Which country is made up of 7,641 islands?",
    options: ["Indonesia", "Philippines", "Japan", "Greece"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the capital of Argentina?",
    options: ["Córdoba", "Rosario", "Buenos Aires", "Mendoza"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which sea lies between Europe and Africa?",
    options: ["Black Sea", "Caspian Sea", "Mediterranean Sea", "Adriatic Sea"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the highest peak in Africa?",
    options: ["Mount Kenya", "Mount Kilimanjaro", "Mount Stanley", "Ras Dashen"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "Which country has three capital cities?",
    options: ["Netherlands", "South Africa", "Switzerland", "Bolivia"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the largest delta in the world?",
    options: ["Nile Delta", "Amazon Delta", "Ganges Delta", "Mississippi Delta"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which country is closest to the North Pole?",
    options: ["Canada", "Russia", "Greenland", "Norway"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the capital of Thailand?",
    options: ["Chiang Mai", "Phuket", "Bangkok", "Pattaya"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which ocean is the Bermuda Triangle located in?",
    options: ["Pacific Ocean", "Indian Ocean", "Atlantic Ocean", "Arctic Ocean"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the largest country in Africa?",
    options: ["Libya", "Chad", "Niger", "Algeria"],
    correctAnswer: 3,
    category: "Geography"
  },
  {
    question: "Which river forms part of the border between Mexico and the United States?",
    options: ["Colorado River", "Rio Grande", "Columbia River", "Sacramento River"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    question: "What is the capital of Kenya?",
    options: ["Mombasa", "Kisumu", "Nairobi", "Nakuru"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "Which European country is shaped like a boot?",
    options: ["Spain", "Greece", "Italy", "Portugal"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    question: "What is the lowest point on Earth's surface?",
    options: ["Death Valley", "Dead Sea", "Salton Sea", "Lake Assal"],
    correctAnswer: 1,
    category: "Geography"
  },
  // History (55 questions)
  {
    question: "In which year did World War II end?",
    options: ["1944", "1945", "1946", "1947"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who was the first person to walk on the moon?",
    options: ["Buzz Aldrin", "Neil Armstrong", "John Glenn", "Alan Shepard"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which ancient wonder of the world was located in Alexandria?",
    options: ["Colossus of Rhodes", "Lighthouse of Alexandria", "Hanging Gardens", "Temple of Artemis"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who painted the ceiling of the Sistine Chapel?",
    options: ["Leonardo da Vinci", "Raphael", "Michelangelo", "Donatello"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "In which year did the Berlin Wall fall?",
    options: ["1987", "1988", "1989", "1990"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who was the first President of the United States?",
    options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Which empire was ruled by Julius Caesar?",
    options: ["Greek Empire", "Roman Empire", "Byzantine Empire", "Ottoman Empire"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "What year did the Titanic sink?",
    options: ["1910", "1911", "1912", "1913"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who wrote the Communist Manifesto?",
    options: ["Lenin", "Stalin", "Marx and Engels", "Trotsky"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Which war was fought between the North and South in America?",
    options: ["Revolutionary War", "War of 1812", "Civil War", "Spanish-American War"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who was known as the 'Iron Lady'?",
    options: ["Queen Elizabeth II", "Margaret Thatcher", "Golda Meir", "Indira Gandhi"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which city was the capital of the Byzantine Empire?",
    options: ["Athens", "Rome", "Alexandria", "Constantinople"],
    correctAnswer: 3,
    category: "History"
  },
  {
    question: "What was the name of the ship on which Charles Darwin made his famous voyage?",
    options: ["HMS Victory", "HMS Beagle", "HMS Bounty", "HMS Enterprise"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who was the last Tsar of Russia?",
    options: ["Nicholas I", "Alexander III", "Nicholas II", "Alexander II"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "In which year did Columbus first arrive in the Americas?",
    options: ["1490", "1491", "1492", "1493"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Which ancient civilization built Machu Picchu?",
    options: ["Aztecs", "Mayans", "Incas", "Olmecs"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who was the leader of Nazi Germany?",
    options: ["Heinrich Himmler", "Joseph Goebbels", "Adolf Hitler", "Hermann Göring"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Which battle marked the end of Napoleon's rule?",
    options: ["Battle of Austerlitz", "Battle of Trafalgar", "Battle of Waterloo", "Battle of Leipzig"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "What was the name of the first atomic bomb dropped on Japan?",
    options: ["Fat Man", "Little Boy", "Trinity", "Gadget"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who was the first woman to win a Nobel Prize?",
    options: ["Marie Curie", "Rosa Parks", "Mother Teresa", "Jane Addams"],
    correctAnswer: 0,
    category: "History"
  },
  {
    question: "Who was the first woman to fly solo across the Atlantic Ocean?",
    options: ["Bessie Coleman", "Amelia Earhart", "Jacqueline Cochran", "Sally Ride"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who was the Egyptian queen who had relationships with Julius Caesar and Mark Antony?",
    options: ["Nefertiti", "Hatshepsut", "Cleopatra", "Ankhesenamun"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Which ship sank in 1912 after hitting an iceberg?",
    options: ["Lusitania", "Titanic", "Britannic", "Olympic"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who led the Indian independence movement through non-violence?",
    options: ["Jawaharlal Nehru", "Subhas Chandra Bose", "Mahatma Gandhi", "Sardar Patel"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Which revolution began in 1789?",
    options: ["American Revolution", "Russian Revolution", "French Revolution", "Industrial Revolution"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who was the first Holy Roman Emperor?",
    options: ["Otto I", "Charlemagne", "Frederick I", "Henry IV"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which wall was built to keep barbarians out of China?",
    options: ["Wall of Hadrian", "Berlin Wall", "Great Wall of China", "Western Wall"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who assassinated President Lincoln?",
    options: ["Lee Harvey Oswald", "John Wilkes Booth", "Charles Guiteau", "Leon Czolgosz"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "In which year did India gain independence?",
    options: ["1946", "1947", "1948", "1949"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which explorer reached the Americas in 1492?",
    options: ["Vasco da Gama", "Ferdinand Magellan", "Christopher Columbus", "Amerigo Vespucci"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who was the first person to circumnavigate the globe?",
    options: ["Christopher Columbus", "Vasco da Gama", "Ferdinand Magellan", "James Cook"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Which war lasted from 1914 to 1918?",
    options: ["World War I", "World War II", "Seven Years' War", "Thirty Years' War"],
    correctAnswer: 0,
    category: "History"
  },
  {
    question: "Who was the first female Prime Minister of the United Kingdom?",
    options: ["Theresa May", "Margaret Thatcher", "Elizabeth I", "Victoria"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which ancient Greek philosopher was the teacher of Alexander the Great?",
    options: ["Plato", "Socrates", "Aristotle", "Pythagoras"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "In which year did the United States declare independence?",
    options: ["1774", "1775", "1776", "1777"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who was the longest-reigning monarch in British history?",
    options: ["Queen Victoria", "Queen Elizabeth I", "Queen Elizabeth II", "King George III"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Which Russian leader was known for his policy of glasnost?",
    options: ["Vladimir Putin", "Boris Yeltsin", "Mikhail Gorbachev", "Leonid Brezhnev"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who invented the printing press?",
    options: ["Leonardo da Vinci", "Johannes Gutenberg", "Benjamin Franklin", "Thomas Edison"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which country was the first to grant women the right to vote?",
    options: ["United States", "United Kingdom", "New Zealand", "Australia"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who was the first Emperor of Rome?",
    options: ["Julius Caesar", "Augustus", "Nero", "Caligula"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which pandemic killed millions of people in Europe during the 14th century?",
    options: ["Spanish flu", "Black Death", "Cholera", "Typhus"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who led the Mongol Empire at its peak?",
    options: ["Kublai Khan", "Genghis Khan", "Ögedei Khan", "Möngke Khan"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which treaty ended World War I?",
    options: ["Treaty of Paris", "Treaty of Versailles", "Treaty of Trianon", "Treaty of Sèvres"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who was the first person to reach the South Pole?",
    options: ["Ernest Shackleton", "Roald Amundsen", "Robert Scott", "Richard Byrd"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which civilization built the pyramids of Giza?",
    options: ["Mesopotamians", "Greeks", "Egyptians", "Romans"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who was the first person to fly an airplane?",
    options: ["Charles Lindbergh", "Amelia Earhart", "Wright Brothers", "Santos Dumont"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Which empire was founded by Cyrus the Great?",
    options: ["Roman Empire", "Persian Empire", "Ottoman Empire", "Macedonian Empire"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who wrote the 95 Theses that started the Protestant Reformation?",
    options: ["John Calvin", "Martin Luther", "Henry VIII", "Huldrych Zwingli"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which war was fought between Britain and China over trade disputes?",
    options: ["Boxer Rebellion", "Opium Wars", "Sino-Japanese War", "Taiping Rebellion"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who was the first President of South Africa after apartheid?",
    options: ["F.W. de Klerk", "Nelson Mandela", "Thabo Mbeki", "Jacob Zuma"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which city was divided by a wall during the Cold War?",
    options: ["Vienna", "Prague", "Berlin", "Budapest"],
    correctAnswer: 2,
    category: "History"
  },
  {
    question: "Who was the first woman in space?",
    options: ["Sally Ride", "Valentina Tereshkova", "Mae Jemison", "Eileen Collins"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which ancient library was considered the greatest in the world?",
    options: ["Library of Pergamon", "Library of Alexandria", "Library of Trajan", "Library of Celsus"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Who united Germany in the 19th century?",
    options: ["Kaiser Wilhelm I", "Otto von Bismarck", "Friedrich III", "Helmuth von Moltke"],
    correctAnswer: 1,
    category: "History"
  },
  {
    question: "Which revolution overthrew the Tsar in Russia?",
    options: ["February Revolution", "October Revolution", "December Revolution", "Both A and B"],
    correctAnswer: 3,
    category: "History"
  },
  // Sports (64 questions)
  {
    question: "How many players are on a basketball team on the court at one time?",
    options: ["4", "5", "6", "7"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "In which sport would you perform a slam dunk?",
    options: ["Volleyball", "Tennis", "Basketball", "Badminton"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "How often are the Summer Olympic Games held?",
    options: ["Every 2 years", "Every 3 years", "Every 4 years", "Every 5 years"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "What is the maximum score possible in ten-pin bowling?",
    options: ["200", "250", "300", "350"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "Which country has won the most FIFA World Cups?",
    options: ["Germany", "Argentina", "Italy", "Brazil"],
    correctAnswer: 3,
    category: "Sports"
  },
  {
    question: "What is the diameter of a basketball hoop in inches?",
    options: ["16", "18", "20", "22"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "In golf, what is one stroke under par called?",
    options: ["Eagle", "Birdie", "Bogey", "Albatross"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which sport is played at Wimbledon?",
    options: ["Cricket", "Tennis", "Golf", "Rugby"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "How many periods are there in ice hockey?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "What is the highest possible score in a single frame of bowling?",
    options: ["20", "25", "30", "35"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "Which swimmer has won the most Olympic gold medals?",
    options: ["Mark Spitz", "Michael Phelps", "Katie Ledecky", "Ian Thorpe"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "In American football, how many points is a touchdown worth?",
    options: ["3", "6", "7", "8"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "What is the length of a marathon in miles?",
    options: ["24.2", "25.2", "26.2", "27.2"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "Which team sport is played on the largest field?",
    options: ["American Football", "Soccer", "Cricket", "Polo"],
    correctAnswer: 3,
    category: "Sports"
  },
  {
    question: "How many holes are played in a standard round of golf?",
    options: ["16", "18", "20", "22"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "What is the term for scoring three goals in one hockey game?",
    options: ["Triple", "Hat trick", "Trio", "Three-peat"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which country originated the sport of rugby?",
    options: ["Australia", "New Zealand", "England", "South Africa"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "How many rings are on the Olympic flag?",
    options: ["4", "5", "6", "7"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "In tennis, what is the term for a score of 40-40?",
    options: ["Match point", "Game point", "Deuce", "Advantage"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "Which sport uses the largest ball?",
    options: ["Basketball", "Volleyball", "Beach ball", "Exercise ball"],
    correctAnswer: 3,
    category: "Sports"
  },
  {
    question: "Which sport is known as 'The Beautiful Game'?",
    options: ["Basketball", "Soccer", "Tennis", "Baseball"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "How many holes are there in a standard round of golf?",
    options: ["16", "18", "20", "24"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which tennis tournament is played on clay courts?",
    options: ["Wimbledon", "US Open", "French Open", "Australian Open"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "How many minutes are in a soccer match?",
    options: ["80", "90", "100", "120"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which sport uses terms like 'spike' and 'dig'?",
    options: ["Tennis", "Badminton", "Volleyball", "Squash"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "What is the name of the trophy awarded to the NHL champion?",
    options: ["Lombardi Trophy", "Stanley Cup", "Larry O'Brien Trophy", "Commissioner's Trophy"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which boxer was known as 'The Greatest'?",
    options: ["Mike Tyson", "Joe Frazier", "Muhammad Ali", "George Foreman"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "How many sets do you need to win to win a men's tennis match at Wimbledon?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which sport features a pommel horse?",
    options: ["Track and Field", "Swimming", "Gymnastics", "Wrestling"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "What is the home run record in MLB for a single season?",
    options: ["70", "73", "75", "77"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which country invented badminton?",
    options: ["China", "Denmark", "England", "India"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "How many points is a touchdown worth in American football?",
    options: ["3", "6", "7", "8"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "What is the term for three strikes in a row in bowling?",
    options: ["Turkey", "Eagle", "Birdie", "Ace"],
    correctAnswer: 0,
    category: "Sports"
  },
  {
    question: "How many yards is an American football field?",
    options: ["90", "100", "110", "120"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which basketball player was known as 'His Airness'?",
    options: ["LeBron James", "Kobe Bryant", "Michael Jordan", "Magic Johnson"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "What is the name of the championship game in American football?",
    options: ["World Series", "Stanley Cup", "Super Bowl", "Final Four"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "How many periods are there in a hockey game?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which country hosted the 2016 Summer Olympics?",
    options: ["China", "United Kingdom", "Brazil", "Russia"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "Which sport uses a puck?",
    options: ["Field Hockey", "Ice Hockey", "Lacrosse", "Water Polo"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "How many players are on a baseball team's active roster?",
    options: ["23", "25", "27", "30"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which race is known as 'The Most Exciting Two Minutes in Sports'?",
    options: ["Daytona 500", "Kentucky Derby", "Indianapolis 500", "Monaco Grand Prix"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "What is the term for a score of one under par in golf?",
    options: ["Eagle", "Birdie", "Bogey", "Ace"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which sport features terms like 'slam dunk' and 'three-pointer'?",
    options: ["Volleyball", "Tennis", "Basketball", "Handball"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "How many laps are in the Indianapolis 500?",
    options: ["400", "500", "200", "300"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "Which country dominates in the sport of cricket?",
    options: ["Australia", "England", "India", "All of the above"],
    correctAnswer: 3,
    category: "Sports"
  },
  {
    question: "What is the term for zero points in tennis?",
    options: ["Nothing", "Zero", "Love", "Nil"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "Which sport is played with a shuttlecock?",
    options: ["Tennis", "Squash", "Badminton", "Ping Pong"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "How many strikes do you get in baseball before you're out?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which swimmer is known for his butterfly stroke?",
    options: ["Ian Thorpe", "Michael Phelps", "Caeleb Dressel", "Adam Peaty"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "What is the maximum weight for a boxing heavyweight?",
    options: ["190 lbs", "200 lbs", "No limit", "250 lbs"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "Which sport is known as 'America's Pastime'?",
    options: ["Basketball", "Football", "Baseball", "Soccer"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "How many Grand Slam tournaments are there in tennis?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which athlete has won the most Olympic medals overall?",
    options: ["Michael Phelps", "Larisa Latynina", "Mark Spitz", "Carl Lewis"],
    correctAnswer: 0,
    category: "Sports"
  },
  {
    question: "What is the term for a perfect game in bowling?",
    options: ["Strike", "Spare", "300", "Perfect"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "Which sport uses terms like 'checkmate' and 'castling'?",
    options: ["Checkers", "Chess", "Go", "Backgammon"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "How many points do you need to win a volleyball set?",
    options: ["21", "25", "30", "15"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which martial art originated in Japan?",
    options: ["Karate", "Taekwondo", "Kung Fu", "Muay Thai"],
    correctAnswer: 0,
    category: "Sports"
  },
  {
    question: "What is the name of the golf tournament held at Augusta National?",
    options: ["US Open", "PGA Championship", "The Masters", "British Open"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "Which sport features a pommel horse and parallel bars?",
    options: ["Track and Field", "Gymnastics", "Wrestling", "Weightlifting"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "How many minutes is each quarter in an NBA game?",
    options: ["10", "12", "15", "20"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which country has won the most Winter Olympic medals?",
    options: ["United States", "Germany", "Norway", "Canada"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "What is the term for hitting the ball over the fence in baseball?",
    options: ["Grand slam", "Home run", "Triple", "Double"],
    correctAnswer: 1,
    category: "Sports"
  },
  {
    question: "Which sport is Tiger Woods famous for?",
    options: ["Tennis", "Basketball", "Golf", "Baseball"],
    correctAnswer: 2,
    category: "Sports"
  },
  {
    question: "How many players are on a soccer team on the field at one time?",
    options: ["9", "10", "11", "12"],
    correctAnswer: 2,
    category: "Sports"
  },
  // Entertainment (61 questions)
  {
    question: "Who directed the movie 'Jaws'?",
    options: ["George Lucas", "Steven Spielberg", "Martin Scorsese", "Francis Ford Coppola"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which movie won the Academy Award for Best Picture in 1994?",
    options: ["Pulp Fiction", "The Shawshank Redemption", "Forrest Gump", "The Lion King"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who composed the music for 'Star Wars'?",
    options: ["Hans Zimmer", "John Williams", "Danny Elfman", "Howard Shore"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which TV series featured the character Walter White?",
    options: ["The Sopranos", "Breaking Bad", "Better Call Saul", "Dexter"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who played the lead role in 'Iron Man'?",
    options: ["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Which band released the album 'Abbey Road'?",
    options: ["The Rolling Stones", "Led Zeppelin", "The Beatles", "Pink Floyd"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "What is the highest-grossing film of all time (adjusted for inflation)?",
    options: ["Avatar", "Titanic", "Gone with the Wind", "Avengers: Endgame"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who wrote the 'Harry Potter' series?",
    options: ["J.R.R. Tolkien", "C.S. Lewis", "J.K. Rowling", "Roald Dahl"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Which streaming service produced 'Stranger Things'?",
    options: ["Amazon Prime", "Hulu", "Disney+", "Netflix"],
    correctAnswer: 3,
    category: "Entertainment"
  },
  {
    question: "Who is known as the 'King of Pop'?",
    options: ["Elvis Presley", "Michael Jackson", "Prince", "David Bowie"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which movie features the quote 'May the Force be with you'?",
    options: ["Star Trek", "Star Wars", "Battlestar Galactica", "Guardians of the Galaxy"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who played Hermione Granger in the Harry Potter movies?",
    options: ["Emma Stone", "Emma Roberts", "Emma Watson", "Emma Thompson"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Which reality TV show features the phrase 'You're fired!'?",
    options: ["Survivor", "The Apprentice", "Big Brother", "The Bachelor"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "What is the name of the coffee shop in the TV show 'Friends'?",
    options: ["Central Perk", "Café Nervosa", "The Coffee Bean", "Starbucks"],
    correctAnswer: 0,
    category: "Entertainment"
  },
  {
    question: "Who directed the movie 'Pulp Fiction'?",
    options: ["Martin Scorsese", "Quentin Tarantino", "David Fincher", "Christopher Nolan"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which video game character is known for collecting rings?",
    options: ["Mario", "Link", "Sonic", "Pac-Man"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "What is the name of the wizard in 'The Lord of the Rings'?",
    options: ["Merlin", "Dumbledore", "Gandalf", "Saruman"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Which social media platform is known for its 280-character limit?",
    options: ["Facebook", "Instagram", "Twitter", "TikTok"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who created the animated series 'The Simpsons'?",
    options: ["Seth MacFarlane", "Matt Groening", "Mike Judge", "Trey Parker"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which movie won the first Academy Award for Best Animated Feature?",
    options: ["Monsters, Inc.", "Shrek", "Ice Age", "Finding Nemo"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which movie features the line 'May the Force be with you'?",
    options: ["Star Trek", "Star Wars", "Guardians of the Galaxy", "Interstellar"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who played Jack in 'Titanic'?",
    options: ["Brad Pitt", "Leonardo DiCaprio", "Tom Cruise", "Johnny Depp"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which TV show features characters named Ross, Rachel, and Monica?",
    options: ["How I Met Your Mother", "The Big Bang Theory", "Friends", "Seinfeld"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who composed the music for 'The Lion King'?",
    options: ["Alan Menken", "Elton John", "Hans Zimmer", "John Williams"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Which actor played the Joker in 'The Dark Knight'?",
    options: ["Jack Nicholson", "Joaquin Phoenix", "Heath Ledger", "Jared Leto"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "What is the highest-grossing movie of all time?",
    options: ["Titanic", "Avatar", "Avengers: Endgame", "Star Wars: The Force Awakens"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who played Forrest Gump?",
    options: ["Tom Hanks", "Robin Williams", "Kevin Costner", "Harrison Ford"],
    correctAnswer: 0,
    category: "Entertainment"
  },
  {
    question: "Who directed 'Pulp Fiction'?",
    options: ["Martin Scorsese", "Quentin Tarantino", "David Lynch", "Christopher Nolan"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which Disney movie features the song 'Let It Go'?",
    options: ["Moana", "Tangled", "Frozen", "The Little Mermaid"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who played Iron Man in the Marvel Cinematic Universe?",
    options: ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which TV show features the character Walter White?",
    options: ["Better Call Saul", "The Sopranos", "Breaking Bad", "Dexter"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who directed 'The Godfather'?",
    options: ["Martin Scorsese", "Francis Ford Coppola", "Robert De Niro", "Al Pacino"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who created the TV series 'Game of Thrones'?",
    options: ["David Benioff", "D.B. Weiss", "George R.R. Martin", "Both A and B"],
    correctAnswer: 3,
    category: "Entertainment"
  },
  {
    question: "Which actor played Wolverine in the X-Men movies?",
    options: ["Russell Crowe", "Hugh Jackman", "Christian Bale", "Ryan Reynolds"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "What is the name of the coffee shop in 'Friends'?",
    options: ["Central Perk", "The Grind", "Java Joe's", "Coffee Central"],
    correctAnswer: 0,
    category: "Entertainment"
  },
  {
    question: "Who composed the theme for 'Jaws'?",
    options: ["Hans Zimmer", "Danny Elfman", "John Williams", "Alan Silvestri"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Which movie features a shark as the main antagonist?",
    options: ["Deep Blue Sea", "The Meg", "Jaws", "Sharknado"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Which TV show is about a chemistry teacher turned meth manufacturer?",
    options: ["Dexter", "The Wire", "Breaking Bad", "Narcos"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who directed 'E.T. the Extra-Terrestrial'?",
    options: ["George Lucas", "Steven Spielberg", "Ridley Scott", "James Cameron"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which movie trilogy features Frodo Baggins?",
    options: ["The Hobbit", "The Lord of the Rings", "The Chronicles of Narnia", "Harry Potter"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who played Captain Jack Sparrow?",
    options: ["Orlando Bloom", "Johnny Depp", "Russell Crowe", "Hugh Jackman"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which animated movie features a talking snowman named Olaf?",
    options: ["Ice Age", "Frozen", "The Polar Express", "Happy Feet"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who directed 'Inception'?",
    options: ["Christopher Nolan", "Denis Villeneuve", "Ridley Scott", "James Cameron"],
    correctAnswer: 0,
    category: "Entertainment"
  },
  {
    question: "Which TV show features dragons and the Iron Throne?",
    options: ["The Witcher", "Game of Thrones", "Vikings", "The Last Kingdom"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who played Neo in 'The Matrix'?",
    options: ["Will Smith", "Keanu Reeves", "Brad Pitt", "Tom Cruise"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who created the character of Mickey Mouse?",
    options: ["Walt Disney", "Chuck Jones", "Tex Avery", "Bob Clampett"],
    correctAnswer: 0,
    category: "Entertainment"
  },
  {
    question: "Which TV show features the character Tyrion Lannister?",
    options: ["Vikings", "The Crown", "Game of Thrones", "Outlander"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who played the lead role in 'Gladiator'?",
    options: ["Gerard Butler", "Russell Crowe", "Mel Gibson", "Kevin Costner"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which movie features the line 'Nobody puts Baby in a corner'?",
    options: ["Ghost", "Dirty Dancing", "Pretty Woman", "The Notebook"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who directed 'Jurassic Park'?",
    options: ["James Cameron", "Ridley Scott", "Steven Spielberg", "Michael Crichton"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Which TV show features Sheldon Cooper?",
    options: ["Friends", "How I Met Your Mother", "The Big Bang Theory", "Two and a Half Men"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who played the title character in 'Forrest Gump'?",
    options: ["Robin Williams", "Tom Hanks", "Kevin Costner", "Harrison Ford"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which movie won the first Academy Award for Best Picture?",
    options: ["Wings", "The Jazz Singer", "7th Heaven", "The Way of All Flesh"],
    correctAnswer: 0,
    category: "Entertainment"
  },
  {
    question: "Which actor played Batman in 'The Dark Knight' trilogy?",
    options: ["Ben Affleck", "Michael Keaton", "Christian Bale", "George Clooney"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who directed 'Avatar'?",
    options: ["Steven Spielberg", "James Cameron", "Peter Jackson", "George Lucas"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which TV show is set in the 1980s and features supernatural events?",
    options: ["The X-Files", "Stranger Things", "Twin Peaks", "Supernatural"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who played the Genie in Disney's 'Aladdin' (1992)?",
    options: ["Eddie Murphy", "Robin Williams", "Jim Carrey", "Mike Myers"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which movie features the line 'Houston, we have a problem'?",
    options: ["Gravity", "Interstellar", "Apollo 13", "The Right Stuff"],
    correctAnswer: 2,
    category: "Entertainment"
  },
  {
    question: "Who played Katniss Everdeen in 'The Hunger Games'?",
    options: ["Emma Stone", "Jennifer Lawrence", "Kristen Stewart", "Shailene Woodley"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Which TV show features the character Don Draper?",
    options: ["Breaking Bad", "Mad Men", "The Sopranos", "House of Cards"],
    correctAnswer: 1,
    category: "Entertainment"
  },
  {
    question: "Who directed 'The Shawshank Redemption'?",
    options: ["Frank Darabont", "Rob Reiner", "Stephen King", "Martin Scorsese"],
    correctAnswer: 0,
    category: "Entertainment"
  },
  // Mathematics (50 questions)
  {
    question: "What is the value of π (pi) to two decimal places?",
    options: ["3.12", "3.14", "3.16", "3.18"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 7 × 8?",
    options: ["54", "56", "58", "60"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is 15% of 200?",
    options: ["25", "30", "35", "40"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the next prime number after 17?",
    options: ["18", "19", "20", "21"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 2³ (2 to the power of 3)?",
    options: ["6", "8", "9", "12"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the sum of angles in a triangle?",
    options: ["90°", "120°", "180°", "360°"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is 0.5 as a fraction?",
    options: ["1/3", "1/2", "2/3", "3/4"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the area of a circle with radius 5?",
    options: ["25π", "10π", "15π", "20π"],
    correctAnswer: 0,
    category: "Mathematics"
  },
  {
    question: "What is 100 - 37?",
    options: ["63", "67", "73", "77"],
    correctAnswer: 0,
    category: "Mathematics"
  },
  {
    question: "What is the factorial of 5 (5!)?",
    options: ["60", "100", "120", "150"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is 3/4 as a decimal?",
    options: ["0.25", "0.5", "0.75", "1.0"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is the hypotenuse of a right triangle with sides 3 and 4?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 0,
    category: "Mathematics"
  },
  {
    question: "What is 12 × 12?",
    options: ["124", "144", "154", "164"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the median of 3, 7, 2, 9, 5?",
    options: ["3", "5", "7", "9"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 25% of 80?",
    options: ["15", "20", "25", "30"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the perimeter of a square with side length 6?",
    options: ["18", "24", "30", "36"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 9²?",
    options: ["72", "81", "90", "99"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 1/3 + 1/6?",
    options: ["1/2", "2/9", "1/9", "2/3"],
    correctAnswer: 0,
    category: "Mathematics"
  },
  {
    question: "What is the volume of a cube with side length 4?",
    options: ["16", "32", "48", "64"],
    correctAnswer: 3,
    category: "Mathematics"
  },
  {
    question: "What is log₁₀(100)?",
    options: ["1", "2", "10", "100"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 6! ÷ 4!?",
    options: ["24", "30", "36", "42"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the slope of a line passing through (0,0) and (2,4)?",
    options: ["1", "2", "3", "4"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is sin(90°)?",
    options: ["0", "0.5", "1", "2"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is 2⁴?",
    options: ["8", "12", "16", "20"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is the greatest common divisor of 12 and 18?",
    options: ["2", "3", "6", "9"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is 5/8 as a percentage?",
    options: ["58%", "60%", "62.5%", "65%"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is the circumference of a circle with diameter 10?",
    options: ["10π", "20π", "5π", "15π"],
    correctAnswer: 0,
    category: "Mathematics"
  },
  {
    question: "What is 144 ÷ 12?",
    options: ["11", "12", "13", "14"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the mode of 2, 3, 3, 4, 5, 5, 5?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 3,
    category: "Mathematics"
  },
  {
    question: "What is 0.25 × 16?",
    options: ["2", "4", "6", "8"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the sum of first 10 natural numbers?",
    options: ["45", "50", "55", "60"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is cos(0°)?",
    options: ["0", "0.5", "1", "2"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is 7 × 9 - 3?",
    options: ["58", "60", "62", "64"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the next number in the sequence: 2, 4, 8, 16, ...?",
    options: ["24", "28", "32", "36"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is 3x + 5 = 14, solve for x?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the absolute value of -15?",
    options: ["15", "-15", "0", "30"],
    correctAnswer: 0,
    category: "Mathematics"
  },
  {
    question: "What is 11 × 11?",
    options: ["111", "121", "131", "141"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 2/5 + 1/5?",
    options: ["3/10", "3/5", "1/2", "2/3"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the interior angle of a regular hexagon?",
    options: ["108°", "120°", "135°", "144°"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 50% of 150?",
    options: ["65", "70", "75", "80"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is √25?",
    options: ["4", "5", "6", "7"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 8 + 7 × 2?",
    options: ["22", "30", "16", "24"],
    correctAnswer: 0,
    category: "Mathematics"
  },
  {
    question: "What is tan(45°)?",
    options: ["0", "0.5", "1", "2"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is 100 ÷ 4?",
    options: ["20", "25", "30", "35"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is the least common multiple of 4 and 6?",
    options: ["10", "12", "14", "16"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 3³?",
    options: ["9", "18", "27", "36"],
    correctAnswer: 2,
    category: "Mathematics"
  },
  {
    question: "What is 7/10 as a decimal?",
    options: ["0.7", "0.07", "7.0", "70"],
    correctAnswer: 0,
    category: "Mathematics"
  },
  {
    question: "What is the derivative of x²?",
    options: ["x", "2x", "x²", "2"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  {
    question: "What is 13 + 17?",
    options: ["29", "30", "31", "32"],
    correctAnswer: 1,
    category: "Mathematics"
  },
  // Literature (79 questions)
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which novel begins with 'It was the best of times, it was the worst of times'?",
    options: ["Great Expectations", "Oliver Twist", "A Tale of Two Cities", "David Copperfield"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote '1984'?",
    options: ["George Orwell", "Aldous Huxley", "Ray Bradbury", "H.G. Wells"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "What is the first book in the Harry Potter series?",
    options: ["Chamber of Secrets", "Prisoner of Azkaban", "Philosopher's Stone", "Goblet of Fire"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'Pride and Prejudice'?",
    options: ["Emily Brontë", "Charlotte Brontë", "Jane Austen", "George Eliot"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Which Shakespeare play features the character Hamlet?",
    options: ["Macbeth", "Othello", "King Lear", "Hamlet"],
    correctAnswer: 3,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Great Gatsby'?",
    options: ["Ernest Hemingway", "F. Scott Fitzgerald", "John Steinbeck", "William Faulkner"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "What is the opening line of 'A Christmas Carol'?",
    options: ["It was Christmas Eve", "Marley was dead", "Scrooge was a miser", "The ghost appeared"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who wrote 'To Kill a Mockingbird'?",
    options: ["Harper Lee", "Flannery O'Connor", "Toni Morrison", "Maya Angelou"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Which novel features the character Atticus Finch?",
    options: ["The Catcher in the Rye", "To Kill a Mockingbird", "Of Mice and Men", "The Grapes of Wrath"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who wrote 'One Hundred Years of Solitude'?",
    options: ["Gabriel García Márquez", "Isabel Allende", "Mario Vargas Llosa", "Jorge Luis Borges"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "What is the first book in 'The Lord of the Rings' trilogy?",
    options: ["The Two Towers", "The Return of the King", "The Fellowship of the Ring", "The Hobbit"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'Wuthering Heights'?",
    options: ["Emily Brontë", "Charlotte Brontë", "Anne Brontë", "Jane Austen"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Which poet wrote 'The Road Not Taken'?",
    options: ["Walt Whitman", "Robert Frost", "Emily Dickinson", "Langston Hughes"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Catcher in the Rye'?",
    options: ["J.D. Salinger", "Jack Kerouac", "Allen Ginsberg", "William S. Burroughs"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "What is the name of Sherlock Holmes' assistant?",
    options: ["Dr. Watson", "Inspector Lestrade", "Mrs. Hudson", "Mycroft Holmes"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Who wrote 'Moby Dick'?",
    options: ["Nathaniel Hawthorne", "Herman Melville", "Edgar Allan Poe", "Washington Irving"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which novel begins with 'Call me Ishmael'?",
    options: ["The Scarlet Letter", "Moby Dick", "Billy Budd", "The Confidence Man"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who wrote 'Jane Eyre'?",
    options: ["Emily Brontë", "Charlotte Brontë", "Anne Brontë", "Elizabeth Gaskell"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "What is the last book in the Chronicles of Narnia series?",
    options: ["The Lion, the Witch and the Wardrobe", "Prince Caspian", "The Last Battle", "The Silver Chair"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'Brave New World'?",
    options: ["George Orwell", "Aldous Huxley", "Ray Bradbury", "Isaac Asimov"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which Shakespeare play features the line 'To be or not to be'?",
    options: ["Macbeth", "Hamlet", "Romeo and Juliet", "Othello"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Sun Also Rises'?",
    options: ["F. Scott Fitzgerald", "Ernest Hemingway", "John Dos Passos", "Gertrude Stein"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "What is the first line of 'The Hobbit'?",
    options: ["In a hole in the ground there lived a hobbit", "Long ago in Middle-earth", "Bilbo Baggins was a hobbit", "The adventure began"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Who wrote 'Les Misérables'?",
    options: ["Alexandre Dumas", "Victor Hugo", "Gustave Flaubert", "Honoré de Balzac"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which poet wrote 'I Wandered Lonely as a Cloud'?",
    options: ["Lord Byron", "William Wordsworth", "Samuel Taylor Coleridge", "Percy Shelley"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who created the character Hercule Poirot?",
    options: ["Arthur Conan Doyle", "Agatha Christie", "Dorothy Sayers", "Raymond Chandler"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "What is the subtitle of 'Frankenstein'?",
    options: ["The Modern Prometheus", "A Gothic Tale", "The Monster's Story", "Science and Horror"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Picture of Dorian Gray'?",
    options: ["Oscar Wilde", "George Bernard Shaw", "W.B. Yeats", "James Joyce"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Which novel features the character Jay Gatsby?",
    options: ["The Sun Also Rises", "This Side of Paradise", "The Great Gatsby", "Tender Is the Night"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'Invisible Man'?",
    options: ["James Baldwin", "Ralph Ellison", "Richard Wright", "Langston Hughes"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "What is the first book in the Game of Thrones series?",
    options: ["A Clash of Kings", "A Storm of Swords", "A Game of Thrones", "A Feast for Crows"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Old Man and the Sea'?",
    options: ["William Faulkner", "Ernest Hemingway", "John Steinbeck", "F. Scott Fitzgerald"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which poet wrote 'The Love Song of J. Alfred Prufrock'?",
    options: ["T.S. Eliot", "Ezra Pound", "Wallace Stevens", "William Carlos Williams"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Who wrote 'Anna Karenina'?",
    options: ["Fyodor Dostoevsky", "Leo Tolstoy", "Anton Chekhov", "Ivan Turgenev"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "What is the name of Don Quixote's horse?",
    options: ["Bucephalus", "Rocinante", "Pegasus", "Silver"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Metamorphosis'?",
    options: ["Franz Kafka", "Hermann Hesse", "Thomas Mann", "Robert Musil"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Which novel begins with 'Happy families are all alike'?",
    options: ["War and Peace", "Anna Karenina", "The Brothers Karamazov", "Crime and Punishment"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who wrote 'On the Road'?",
    options: ["Allen Ginsberg", "Jack Kerouac", "William S. Burroughs", "Gary Snyder"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "What is the first book in the Hunger Games trilogy?",
    options: ["Catching Fire", "Mockingjay", "The Hunger Games", "The Ballad of Songbirds"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'Their Eyes Were Watching God'?",
    options: ["Zora Neale Hurston", "Toni Morrison", "Alice Walker", "Maya Angelou"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Which Shakespeare play features the character Iago?",
    options: ["Hamlet", "Macbeth", "Othello", "King Lear"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Canterbury Tales'?",
    options: ["William Shakespeare", "Geoffrey Chaucer", "Edmund Spenser", "Christopher Marlowe"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "What is the name of the narrator in 'The Great Gatsby'?",
    options: ["Jay Gatsby", "Tom Buchanan", "Nick Carraway", "George Wilson"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'Slaughterhouse-Five'?",
    options: ["Joseph Heller", "Kurt Vonnegut", "Philip K. Dick", "Ray Bradbury"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which poet wrote 'Do Not Go Gentle Into That Good Night'?",
    options: ["W.H. Auden", "Dylan Thomas", "Philip Larkin", "Ted Hughes"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Handmaid's Tale'?",
    options: ["Ursula K. Le Guin", "Margaret Atwood", "Doris Lessing", "Joyce Carol Oates"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "What is the first book in the Twilight series?",
    options: ["New Moon", "Eclipse", "Breaking Dawn", "Twilight"],
    correctAnswer: 3,
    category: "Literature"
  },
  {
    question: "Who wrote 'One Flew Over the Cuckoo's Nest'?",
    options: ["Jack Kerouac", "Ken Kesey", "Hunter S. Thompson", "Tom Wolfe"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which novel features the character Holden Caulfield?",
    options: ["On the Road", "The Catcher in the Rye", "Franny and Zooey", "Nine Stories"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which Shakespeare play features the characters Romeo and Juliet?",
    options: ["Hamlet", "Macbeth", "Romeo and Juliet", "Othello"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "What is the first book in the 'Lord of the Rings' trilogy?",
    options: ["The Two Towers", "The Return of the King", "The Fellowship of the Ring", "The Hobbit"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Which book series features a boy wizard named Harry?",
    options: ["Percy Jackson", "The Chronicles of Narnia", "Harry Potter", "Artemis Fowl"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Which epic poem was written by Homer?",
    options: ["The Aeneid", "The Iliad", "Beowulf", "Paradise Lost"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who wrote 'Beloved'?",
    options: ["Alice Walker", "Toni Morrison", "Maya Angelou", "Zora Neale Hurston"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which book features the line 'Call me Ishmael'?",
    options: ["The Old Man and the Sea", "Moby-Dick", "20,000 Leagues Under the Sea", "Robinson Crusoe"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which novel is set during the French Revolution?",
    options: ["Les Misérables", "A Tale of Two Cities", "War and Peace", "The Count of Monte Cristo"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Lord of the Flies'?",
    options: ["George Orwell", "Aldous Huxley", "William Golding", "Ray Bradbury"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Which book features the character Scout Finch?",
    options: ["The Help", "To Kill a Mockingbird", "Go Set a Watchman", "The Color Purple"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which novel begins with 'In the beginning was the Word'?",
    options: ["The Bible", "Paradise Lost", "Doctor Faustus", "The Divine Comedy"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Adventures of Huckleberry Finn'?",
    options: ["Mark Twain", "Nathaniel Hawthorne", "Herman Melville", "Edgar Allan Poe"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Which book features the character Elizabeth Bennet?",
    options: ["Emma", "Sense and Sensibility", "Pride and Prejudice", "Mansfield Park"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Grapes of Wrath'?",
    options: ["John Steinbeck", "William Faulkner", "Ernest Hemingway", "Sinclair Lewis"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Who wrote 'Fahrenheit 451'?",
    options: ["Isaac Asimov", "Philip K. Dick", "Ray Bradbury", "Ursula K. Le Guin"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Which play features the line 'To be or not to be, that is the question'?",
    options: ["Macbeth", "King Lear", "Hamlet", "Romeo and Juliet"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Scarlet Letter'?",
    options: ["Herman Melville", "Nathaniel Hawthorne", "Washington Irving", "Edgar Allan Poe"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which book is the sequel to 'The Adventures of Tom Sawyer'?",
    options: ["The Prince and the Pauper", "A Connecticut Yankee", "The Adventures of Huckleberry Finn", "Pudd'nhead Wilson"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'Animal Farm'?",
    options: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "Kurt Vonnegut"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which novel features the character Jean Valjean?",
    options: ["The Hunchback of Notre-Dame", "Les Misérables", "The Count of Monte Cristo", "The Three Musketeers"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which book features the character Captain Ahab?",
    options: ["Treasure Island", "Robinson Crusoe", "Moby-Dick", "20,000 Leagues Under the Sea"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Which novel is considered the first modern detective story?",
    options: ["The Moonstone", "The Murders in the Rue Morgue", "A Study in Scarlet", "The Mystery of Edwin Drood"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which book features the character Winston Smith?",
    options: ["Brave New World", "1984", "Fahrenheit 451", "We"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which novel features the character Pip?",
    options: ["Oliver Twist", "David Copperfield", "Great Expectations", "Hard Times"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Which book is the first in 'The Chronicles of Narnia' series?",
    options: ["The Lion, the Witch and the Wardrobe", "The Magician's Nephew", "Prince Caspian", "The Horse and His Boy"],
    correctAnswer: 0,
    category: "Literature"
  },
  {
    question: "Who wrote 'The Color Purple'?",
    options: ["Toni Morrison", "Alice Walker", "Maya Angelou", "Zora Neale Hurston"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which novel features the character Nick Carraway as narrator?",
    options: ["This Side of Paradise", "The Beautiful and Damned", "The Great Gatsby", "Tender Is the Night"],
    correctAnswer: 2,
    category: "Literature"
  },
  {
    question: "Who wrote 'Catch-22'?",
    options: ["Kurt Vonnegut", "Joseph Heller", "Ken Kesey", "Thomas Pynchon"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which book features the character Gandalf?",
    options: ["The Chronicles of Narnia", "The Lord of the Rings", "The Dark Tower", "The Wheel of Time"],
    correctAnswer: 1,
    category: "Literature"
  },
  {
    question: "Which novel is set in the fictional town of Maycomb?",
    options: ["The Help", "Fried Green Tomatoes", "To Kill a Mockingbird", "The Secret Life of Bees"],
    correctAnswer: 2,
    category: "Literature"
  },
  // Technology (86 questions)
  {
    question: "What does 'HTML' stand for?",
    options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Management Language"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Who founded Apple Inc.?",
    options: ["Bill Gates", "Steve Jobs", "Mark Zuckerberg", "Larry Page"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What does 'CPU' stand for?",
    options: ["Computer Processing Unit", "Central Processing Unit", "Core Processing Unit", "Central Program Unit"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company developed the Android operating system?",
    options: ["Apple", "Microsoft", "Google", "Samsung"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'RAM' stand for?",
    options: ["Random Access Memory", "Rapid Access Memory", "Read Access Memory", "Remote Access Memory"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which programming language is known as the 'language of the web'?",
    options: ["Python", "Java", "JavaScript", "C++"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'URL' stand for?",
    options: ["Universal Resource Locator", "Uniform Resource Locator", "Universal Reference Link", "Uniform Reference Locator"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company created the iPhone?",
    options: ["Samsung", "Google", "Apple", "Microsoft"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'GPS' stand for?",
    options: ["Global Positioning System", "General Position System", "Global Position Service", "Geographic Positioning System"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which social media platform has a character limit of 280?",
    options: ["Facebook", "Instagram", "Twitter", "LinkedIn"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'AI' stand for?",
    options: ["Automated Intelligence", "Artificial Intelligence", "Advanced Intelligence", "Applied Intelligence"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company owns YouTube?",
    options: ["Facebook", "Google", "Microsoft", "Amazon"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What does 'WiFi' originally stand for?",
    options: ["Wireless Fidelity", "Wireless Frequency", "Wide Fidelity", "Wire-Free Internet"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which programming language was created by Guido van Rossum?",
    options: ["Java", "Python", "C++", "Ruby"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What does 'USB' stand for?",
    options: ["Universal Serial Bus", "Universal System Bus", "Uniform Serial Bus", "Universal Service Bus"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which company developed Windows operating system?",
    options: ["Apple", "Google", "Microsoft", "IBM"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What is the maximum number of characters in a tweet?",
    options: ["140", "280", "320", "500"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company created the PlayStation gaming console?",
    options: ["Nintendo", "Microsoft", "Sony", "Sega"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'VPN' stand for?",
    options: ["Virtual Private Network", "Very Private Network", "Virtual Public Network", "Visual Private Network"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which language is primarily used for iOS app development?",
    options: ["Java", "Swift", "Python", "C#"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What does 'SSD' stand for?",
    options: ["Solid State Drive", "Super Speed Drive", "Standard Storage Device", "System State Drive"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which company acquired Instagram in 2012?",
    options: ["Google", "Twitter", "Facebook", "Microsoft"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'HTTP' stand for?",
    options: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transport Protocol", "Home Text Transfer Protocol"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which search engine was founded by Larry Page and Sergey Brin?",
    options: ["Yahoo", "Bing", "Google", "DuckDuckGo"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'IoT' stand for?",
    options: ["Internet of Things", "Internet of Technology", "Interface of Things", "Integration of Technology"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which company developed the first commercial computer mouse?",
    options: ["IBM", "Xerox", "Apple", "Microsoft"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What is the most popular database management system?",
    options: ["Oracle", "MySQL", "PostgreSQL", "MongoDB"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which protocol is used to send emails?",
    options: ["HTTP", "FTP", "SMTP", "TCP"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'API' stand for?",
    options: ["Application Programming Interface", "Automated Program Interface", "Application Process Interface", "Advanced Programming Interface"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which company created the first smartphone?",
    options: ["Apple", "IBM", "Motorola", "Nokia"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What is the binary representation of the decimal number 8?",
    options: ["1010", "1000", "1100", "1001"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which programming language is known for its use in data science?",
    options: ["JavaScript", "C++", "Python", "PHP"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'DNS' stand for?",
    options: ["Domain Name System", "Digital Network Service", "Data Network System", "Domain Network Service"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which company developed the Java programming language?",
    options: ["Microsoft", "Sun Microsystems", "IBM", "Oracle"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What is the standard port number for HTTP?",
    options: ["21", "80", "443", "25"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company owns LinkedIn?",
    options: ["Google", "Facebook", "Microsoft", "Twitter"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'SQL' stand for?",
    options: ["Structured Query Language", "Standard Query Language", "System Query Language", "Simple Query Language"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which company developed the C programming language?",
    options: ["Microsoft", "IBM", "Bell Labs", "Google"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What is the latest version of HTML?",
    options: ["HTML4", "HTML5", "HTML6", "XHTML"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which cloud service is provided by Amazon?",
    options: ["Azure", "Google Cloud", "AWS", "iCloud"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'CSS' stand for?",
    options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company created the first web browser?",
    options: ["Microsoft", "Google", "Netscape", "CERN"],
    correctAnswer: 3,
    category: "Technology"
  },
  {
    question: "What is the most widely used version control system?",
    options: ["SVN", "Git", "Mercurial", "CVS"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company developed React.js?",
    options: ["Google", "Facebook", "Microsoft", "Twitter"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What does 'FTP' stand for?",
    options: ["File Transfer Protocol", "Fast Transfer Protocol", "File Transport Protocol", "Free Transfer Protocol"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which operating system kernel is used by Android?",
    options: ["Windows NT", "macOS", "Linux", "Unix"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What is the standard port number for HTTPS?",
    options: ["80", "21", "443", "25"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "Which company acquired WhatsApp in 2014?",
    options: ["Google", "Microsoft", "Facebook", "Twitter"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'XML' stand for?",
    options: ["eXtensible Markup Language", "eXtra Markup Language", "eXternal Markup Language", "eXecutable Markup Language"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which programming language is primarily used for web development alongside HTML and CSS?",
    options: ["Python", "Java", "JavaScript", "C++"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'WWW' stand for?",
    options: ["World Wide Web", "World Wild Web", "Wide World Web", "Web World Wide"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Who founded Microsoft?",
    options: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Larry Page"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What does 'AI' stand for in technology?",
    options: ["Automated Intelligence", "Artificial Intelligence", "Advanced Intelligence", "Applied Intelligence"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company developed the iPhone?",
    options: ["Samsung", "Google", "Apple", "Microsoft"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "Who founded Facebook?",
    options: ["Bill Gates", "Steve Jobs", "Mark Zuckerberg", "Jeff Bezos"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'RAM' stand for in computing?",
    options: ["Random Access Memory", "Rapid Access Memory", "Read Access Memory", "Real Access Memory"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which programming language is known for its use in web development?",
    options: ["Python", "JavaScript", "C++", "Java"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company created the Android operating system?",
    options: ["Apple", "Microsoft", "Google", "Samsung"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What is the most popular search engine?",
    options: ["Bing", "Yahoo", "Google", "DuckDuckGo"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "Who is the CEO of Tesla?",
    options: ["Jeff Bezos", "Elon Musk", "Bill Gates", "Tim Cook"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What does 'WiFi' stand for?",
    options: ["Wireless Fidelity", "Wide Fidelity", "Wireless Frequency", "It doesn't stand for anything"],
    correctAnswer: 3,
    category: "Technology"
  },
  {
    question: "What is the binary system based on?",
    options: ["Base 8", "Base 10", "Base 2", "Base 16"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "Which social media platform is known for 280-character messages?",
    options: ["Facebook", "Instagram", "Twitter", "LinkedIn"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What is the maximum number of bits in an IPv4 address?",
    options: ["16", "32", "64", "128"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company developed the Windows operating system?",
    options: ["Apple", "Google", "Microsoft", "IBM"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "Which technology is used for contactless payments?",
    options: ["Bluetooth", "NFC", "WiFi", "GPS"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What is the name of Amazon's virtual assistant?",
    options: ["Siri", "Cortana", "Alexa", "Google Assistant"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "Which programming language was developed by Sun Microsystems?",
    options: ["Python", "C++", "Java", "Ruby"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'SSD' stand for in computer storage?",
    options: ["Solid State Drive", "Super Speed Drive", "System Storage Drive", "Secure Storage Device"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which company created the first personal computer?",
    options: ["Apple", "IBM", "Microsoft", "Intel"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What is the most widely used database management system?",
    options: ["Oracle", "MySQL", "PostgreSQL", "MongoDB"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What does '5G' refer to in mobile technology?",
    options: ["5 Gigahertz", "5th Generation", "5 Gigabytes", "5 Graphics"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which technology enables blockchain?",
    options: ["Machine Learning", "Artificial Intelligence", "Cryptography", "Virtual Reality"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What is the maximum theoretical speed of USB 3.0?",
    options: ["480 Mbps", "5 Gbps", "10 Gbps", "20 Gbps"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company developed the first web browser?",
    options: ["Microsoft", "Netscape", "Apple", "CERN"],
    correctAnswer: 3,
    category: "Technology"
  },
  {
    question: "What is the most popular version control system?",
    options: ["SVN", "Git", "Mercurial", "CVS"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which technology is used for machine learning?",
    options: ["Blockchain", "Neural Networks", "Virtual Reality", "Quantum Computing"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company owns Instagram?",
    options: ["Google", "Twitter", "Facebook", "Apple"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What is the standard resolution for 4K video?",
    options: ["1920x1080", "2560x1440", "3840x2160", "4096x2160"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "Which cloud storage service is owned by Google?",
    options: ["OneDrive", "iCloud", "Google Drive", "Dropbox"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What does 'HTTPS' stand for?",
    options: ["Hypertext Transfer Protocol Secure", "High Transfer Protocol Secure", "Hypertext Transport Protocol Secure", "Hypertext Transfer Process Secure"],
    correctAnswer: 0,
    category: "Technology"
  },
  {
    question: "Which company created the first computer mouse?",
    options: ["Apple", "IBM", "Xerox", "Douglas Engelbart"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "What is the main language used for iOS app development?",
    options: ["Java", "Swift", "C++", "Python"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "Which company developed the Python programming language?",
    options: ["Google", "Facebook", "Guido van Rossum", "Microsoft"],
    correctAnswer: 2,
    category: "Technology"
  },
  {
    question: "Which technology is used to create Bitcoin?",
    options: ["Machine Learning", "Blockchain", "Virtual Reality", "Cloud Computing"],
    correctAnswer: 1,
    category: "Technology"
  },
  {
    question: "What is the maximum number of devices that can connect to a Bluetooth network?",
    options: ["5", "7", "8", "10"],
    correctAnswer: 1,
    category: "Technology"
  },
  // Art & Culture (50 questions)
  {
    question: "Who painted 'The Starry Night'?",
    options: ["Pablo Picasso", "Vincent van Gogh", "Claude Monet", "Salvador Dalí"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which artist cut off his own ear?",
    options: ["Pablo Picasso", "Vincent van Gogh", "Paul Gauguin", "Henri Toulouse-Lautrec"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Which museum houses the Mona Lisa?",
    options: ["Metropolitan Museum", "British Museum", "Louvre", "Uffizi Gallery"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who sculpted 'David'?",
    options: ["Leonardo da Vinci", "Raphael", "Michelangelo", "Bernini"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Which art movement is associated with Pablo Picasso?",
    options: ["Impressionism", "Surrealism", "Cubism", "Abstract Expressionism"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'The Persistence of Memory' with melting clocks?",
    options: ["Pablo Picasso", "Salvador Dalí", "René Magritte", "Joan Miró"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which composer wrote 'The Four Seasons'?",
    options: ["Johann Sebastian Bach", "Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Antonio Vivaldi"],
    correctAnswer: 3,
    category: "Art & Culture"
  },
  {
    question: "Who composed 'The Magic Flute'?",
    options: ["Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Johann Sebastian Bach", "Franz Schubert"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which painting technique uses small dots of color?",
    options: ["Impressionism", "Pointillism", "Cubism", "Fauvism"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'Girl with a Pearl Earring'?",
    options: ["Rembrandt", "Johannes Vermeer", "Jan van Eyck", "Peter Paul Rubens"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which composer wrote 'Swan Lake'?",
    options: ["Igor Stravinsky", "Sergei Prokofiev", "Pyotr Ilyich Tchaikovsky", "Modest Mussorgsky"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'The Scream'?",
    options: ["Gustav Klimt", "Edvard Munch", "Wassily Kandinsky", "Paul Klee"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which architect designed the Guggenheim Museum in New York?",
    options: ["Frank Gehry", "Le Corbusier", "Frank Lloyd Wright", "I.M. Pei"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who wrote the opera 'Carmen'?",
    options: ["Giuseppe Verdi", "Georges Bizet", "Giacomo Puccini", "Richard Wagner"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which art movement emphasized emotion and individualism?",
    options: ["Neoclassicism", "Romanticism", "Realism", "Impressionism"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'American Gothic'?",
    options: ["Edward Hopper", "Grant Wood", "Andrew Wyeth", "Norman Rockwell"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which composer is known as 'The Waltz King'?",
    options: ["Johann Strauss Jr.", "Franz Liszt", "Johannes Brahms", "Robert Schumann"],
    correctAnswer: 0,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'Water Lilies'?",
    options: ["Pierre-Auguste Renoir", "Edgar Degas", "Claude Monet", "Camille Pissarro"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Which dance originated in Argentina?",
    options: ["Flamenco", "Samba", "Tango", "Salsa"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who sculpted 'The Thinker'?",
    options: ["Auguste Rodin", "Constantin Brâncuși", "Henry Moore", "Alberto Giacometti"],
    correctAnswer: 0,
    category: "Art & Culture"
  },
  {
    question: "Which instrument has 88 keys?",
    options: ["Organ", "Harpsichord", "Piano", "Accordion"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'The Birth of Venus'?",
    options: ["Leonardo da Vinci", "Sandro Botticelli", "Raphael", "Titian"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which composer wrote 'Für Elise'?",
    options: ["Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Frédéric Chopin", "Franz Liszt"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "What is the art of beautiful handwriting called?",
    options: ["Typography", "Calligraphy", "Lithography", "Photography"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'Las Meninas'?",
    options: ["El Greco", "Francisco Goya", "Diego Velázquez", "Pablo Picasso"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Which art style is characterized by geometric shapes and fragmented objects?",
    options: ["Impressionism", "Surrealism", "Cubism", "Abstract Expressionism"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who composed 'The Rite of Spring'?",
    options: ["Claude Debussy", "Maurice Ravel", "Igor Stravinsky", "Sergei Rachmaninoff"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Which museum is located in St. Petersburg, Russia?",
    options: ["Louvre", "Prado", "Hermitage", "Uffizi"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'Guernica'?",
    options: ["Salvador Dalí", "Pablo Picasso", "Joan Miró", "Francisco Goya"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which composer wrote 'The Moonlight Sonata'?",
    options: ["Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Franz Schubert", "Robert Schumann"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "What does 'Renaissance' mean?",
    options: ["New Beginning", "Rebirth", "Revolution", "Reform"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'The Kiss'?",
    options: ["Pablo Picasso", "Gustav Klimt", "Henri Matisse", "Paul Cézanne"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which dance style originated in Spain?",
    options: ["Ballet", "Flamenco", "Waltz", "Polka"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Who composed 'Clair de Lune'?",
    options: ["Claude Debussy", "Maurice Ravel", "Erik Satie", "Gabriel Fauré"],
    correctAnswer: 0,
    category: "Art & Culture"
  },
  {
    question: "Which artist is known for his Campbell's Soup Can paintings?",
    options: ["Roy Lichtenstein", "Andy Warhol", "Jackson Pollock", "Mark Rothko"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "What is the term for a painting done on wet plaster?",
    options: ["Oil painting", "Watercolor", "Fresco", "Tempera"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who wrote 'The Art of War'?",
    options: ["Confucius", "Lao Tzu", "Sun Tzu", "Mencius"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Which composer wrote 'Canon in D'?",
    options: ["Johann Sebastian Bach", "Johann Pachelbel", "George Frideric Handel", "Antonio Vivaldi"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'The Night Watch'?",
    options: ["Johannes Vermeer", "Rembrandt van Rijn", "Jan van Eyck", "Peter Paul Rubens"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which art movement was led by André Breton?",
    options: ["Dadaism", "Surrealism", "Futurism", "Constructivism"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Who composed 'William Tell Overture'?",
    options: ["Giuseppe Verdi", "Gioachino Rossini", "Gaetano Donizetti", "Vincenzo Bellini"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which cathedral is famous for its Gothic architecture in Paris?",
    options: ["Sainte-Chapelle", "Sacré-Cœur", "Notre-Dame", "Saint-Germain"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'A Sunday on La Grande Jatte'?",
    options: ["Claude Monet", "Pierre-Auguste Renoir", "Georges Seurat", "Paul Cézanne"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Which composer wrote 'Eine kleine Nachtmusik'?",
    options: ["Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Franz Joseph Haydn", "Antonio Salieri"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "What is the art of paper folding called?",
    options: ["Kirigami", "Origami", "Quilling", "Decoupage"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Who painted 'The Great Wave off Kanagawa'?",
    options: ["Utagawa Hiroshige", "Katsushika Hokusai", "Kitagawa Utamaro", "Ando Hiroshige"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  {
    question: "Which opera features the aria 'Nessun dorma'?",
    options: ["La Bohème", "Tosca", "Turandot", "Madama Butterfly"],
    correctAnswer: 2,
    category: "Art & Culture"
  },
  {
    question: "Who designed the Eiffel Tower?",
    options: ["Gustave Eiffel", "Auguste Bartholdi", "Eugène Viollet-le-Duc", "Victor Baltard"],
    correctAnswer: 0,
    category: "Art & Culture"
  },
  {
    question: "Which painting style focuses on light and its changing qualities?",
    options: ["Realism", "Impressionism", "Expressionism", "Cubism"],
    correctAnswer: 1,
    category: "Art & Culture"
  },
  // Food & Cooking (50 questions)
  {
    question: "What is the main ingredient in guacamole?",
    options: ["Tomato", "Avocado", "Pepper", "Onion"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which spice is derived from the Crocus flower?",
    options: ["Turmeric", "Paprika", "Saffron", "Cinnamon"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What type of pastry is used to make profiteroles?",
    options: ["Puff pastry", "Shortcrust pastry", "Choux pastry", "Filo pastry"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which country is famous for inventing pizza?",
    options: ["Greece", "Italy", "France", "Spain"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in hummus?",
    options: ["Lentils", "Chickpeas", "Black beans", "Kidney beans"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which cooking method involves cooking food in its own fat?",
    options: ["Braising", "Confit", "Poaching", "Steaming"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the French term for 'everything in its place' in cooking?",
    options: ["Mise en place", "Bon appétit", "Chef de cuisine", "Sous vide"],
    correctAnswer: 0,
    category: "Food & Cooking"
  },
  {
    question: "Which grain is used to make risotto?",
    options: ["Basmati rice", "Jasmine rice", "Arborio rice", "Wild rice"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in a traditional Greek moussaka?",
    options: ["Zucchini", "Eggplant", "Potato", "Cabbage"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which herb is traditionally used in pesto?",
    options: ["Oregano", "Thyme", "Basil", "Rosemary"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What is the primary ingredient in the Japanese dish tempura?",
    options: ["Rice", "Noodles", "Vegetables or seafood in batter", "Raw fish"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which type of alcohol is used in a traditional tiramisu?",
    options: ["Rum", "Brandy", "Marsala wine", "Amaretto"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What is the main protein in a traditional Caesar salad?",
    options: ["Chicken", "Shrimp", "Anchovies", "Bacon"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which country originated the dish paella?",
    options: ["Italy", "Portugal", "Spain", "France"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What is the key ingredient that makes bread rise?",
    options: ["Salt", "Sugar", "Yeast", "Egg"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which cut of beef is typically used for filet mignon?",
    options: ["Ribeye", "Sirloin", "Tenderloin", "Chuck"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in gazpacho?",
    options: ["Cucumber", "Tomato", "Pepper", "Onion"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which cooking technique involves cooking food slowly in liquid?",
    options: ["Grilling", "Roasting", "Braising", "Sautéing"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What type of cheese is traditionally used in Greek salad?",
    options: ["Mozzarella", "Cheddar", "Feta", "Goat cheese"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which spice gives curry its yellow color?",
    options: ["Paprika", "Turmeric", "Saffron", "Cumin"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in traditional Japanese miso soup?",
    options: ["Soy sauce", "Miso paste", "Rice wine", "Seaweed"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which country is famous for maple syrup?",
    options: ["USA", "Canada", "Sweden", "Finland"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in traditional Indian dal?",
    options: ["Rice", "Chickpeas", "Lentils", "Wheat"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which cooking method uses dry heat to cook food quickly?",
    options: ["Boiling", "Steaming", "Grilling", "Poaching"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in traditional Mexican salsa verde?",
    options: ["Green tomatoes", "Tomatillos", "Green peppers", "Avocado"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which type of flour is typically used to make pasta?",
    options: ["All-purpose flour", "Whole wheat flour", "Semolina flour", "Rice flour"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What is the traditional alcohol used in a Piña Colada?",
    options: ["Vodka", "Rum", "Tequila", "Gin"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which vegetable is the main ingredient in baba ganoush?",
    options: ["Zucchini", "Eggplant", "Cauliflower", "Artichoke"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in a traditional Greek tzatziki?",
    options: ["Sour cream", "Yogurt", "Cream cheese", "Mayonnaise"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which country originated sushi?",
    options: ["China", "Korea", "Thailand", "Japan"],
    correctAnswer: 3,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in hollandaise sauce?",
    options: ["Cream", "Butter", "Oil", "Cheese"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which herb is commonly used in Italian cuisine?",
    options: ["Cilantro", "Basil", "Dill", "Tarragon"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the primary ingredient in wasabi?",
    options: ["Horseradish", "Mustard", "Wasabi root", "Green chili"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which cooking technique involves submerging food in hot oil?",
    options: ["Sautéing", "Deep frying", "Pan frying", "Stir frying"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in traditional French onion soup?",
    options: ["Shallots", "Leeks", "Yellow onions", "Green onions"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which type of milk is traditionally used to make mozzarella?",
    options: ["Cow milk", "Goat milk", "Buffalo milk", "Sheep milk"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What is the main flavoring in Earl Grey tea?",
    options: ["Lemon", "Orange", "Bergamot", "Lavender"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which country is famous for inventing chocolate?",
    options: ["Belgium", "Switzerland", "Mexico", "Ecuador"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in traditional Spanish gazpacho?",
    options: ["Cucumber", "Tomato", "Bell pepper", "Onion"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which type of wine is typically used in cooking coq au vin?",
    options: ["White wine", "Red wine", "Champagne", "Rosé"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in traditional Korean kimchi?",
    options: ["Cucumber", "Radish", "Cabbage", "Bean sprouts"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which spice is known as the 'queen of spices'?",
    options: ["Cinnamon", "Cardamom", "Cloves", "Nutmeg"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in traditional Middle Eastern falafel?",
    options: ["Lentils", "Chickpeas", "Black beans", "Fava beans"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which cooking method involves cooking food in a sealed container?",
    options: ["Braising", "En papillote", "Confit", "Sous vide"],
    correctAnswer: 3,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in traditional Indian naan bread?",
    options: ["Rice flour", "Corn flour", "Wheat flour", "Chickpea flour"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  {
    question: "Which country originated the croissant?",
    options: ["France", "Austria", "Belgium", "Switzerland"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the main protein in a traditional Cobb salad?",
    options: ["Turkey", "Chicken", "Ham", "Shrimp"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which type of sugar is commonly used to make caramel?",
    options: ["Brown sugar", "White sugar", "Raw sugar", "Powdered sugar"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "What is the main ingredient in traditional Thai tom yum soup?",
    options: ["Coconut milk", "Lemongrass", "Fish sauce", "Lime leaves"],
    correctAnswer: 1,
    category: "Food & Cooking"
  },
  {
    question: "Which country is famous for inventing ice cream?",
    options: ["Italy", "France", "China", "United States"],
    correctAnswer: 2,
    category: "Food & Cooking"
  },
  // Movies & TV (49 questions)
  {
    question: "Which movie won the Academy Award for Best Picture in 2020?",
    options: ["1917", "Joker", "Parasite", "Once Upon a Time in Hollywood"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Who directed the movie 'Inception'?",
    options: ["Steven Spielberg", "Christopher Nolan", "Martin Scorsese", "Quentin Tarantino"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which TV series is set in the fictional town of Hawkins?",
    options: ["Twin Peaks", "Stranger Things", "Dark", "The X-Files"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Who played the character of Tony Stark in the Marvel movies?",
    options: ["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Which movie features the song 'My Heart Will Go On'?",
    options: ["The Bodyguard", "Ghost", "Titanic", "Dirty Dancing"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the coffee shop in the TV series 'Friends'?",
    options: ["The Grind", "Central Perk", "Java Joe's", "Bean There"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Who directed the movie 'The Godfather'?",
    options: ["Martin Scorsese", "Francis Ford Coppola", "Robert De Niro", "Al Pacino"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which animated movie features the song 'Let It Go'?",
    options: ["Moana", "Tangled", "Frozen", "Brave"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the dragon in 'The Lord of the Rings'?",
    options: ["Smaug", "Balerion", "Drogon", "Ancalagon"],
    correctAnswer: 0,
    category: "Movies & TV"
  },
  {
    question: "Which TV series features the character Tyrion Lannister?",
    options: ["The Witcher", "Game of Thrones", "Vikings", "The Last Kingdom"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Who played the character of Neo in 'The Matrix'?",
    options: ["Brad Pitt", "Keanu Reeves", "Tom Cruise", "Will Smith"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which movie is famous for the quote 'Here's looking at you, kid'?",
    options: ["Gone with the Wind", "Citizen Kane", "Casablanca", "The Maltese Falcon"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the pub in the TV series 'How I Met Your Mother'?",
    options: ["MacLaren's", "Cheers", "Moe's Tavern", "The Drunken Clam"],
    correctAnswer: 0,
    category: "Movies & TV"
  },
  {
    question: "Who directed the movie 'E.T. the Extra-Terrestrial'?",
    options: ["George Lucas", "Steven Spielberg", "Ridley Scott", "James Cameron"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which superhero is known as the 'Man of Steel'?",
    options: ["Batman", "Spider-Man", "Superman", "Iron Man"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the news anchor in 'Anchorman'?",
    options: ["Brick Tamland", "Brian Fantana", "Ron Burgundy", "Champ Kind"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Which TV series is based on George R.R. Martin's novels?",
    options: ["The Witcher", "Game of Thrones", "House of the Dragon", "The Wheel of Time"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Who played the character of Forrest Gump?",
    options: ["Kevin Costner", "Tom Hanks", "Robin Williams", "John Travolta"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which movie features a boy who can see dead people?",
    options: ["The Others", "The Sixth Sense", "Signs", "The Village"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the school in 'Harry Potter'?",
    options: ["Durmstrang", "Beauxbatons", "Hogwarts", "Ilvermorny"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Which TV series features the character Eleven?",
    options: ["Dark", "The X-Files", "Stranger Things", "Fringe"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Who directed the movie 'Avatar' (2009)?",
    options: ["Steven Spielberg", "Peter Jackson", "James Cameron", "George Lucas"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Which movie franchise features the character John Wick?",
    options: ["The Bourne Series", "Mission: Impossible", "John Wick", "Taken"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the island in 'Lost'?",
    options: ["The Island", "Mystery Island", "Purgatory", "Jacob's Island"],
    correctAnswer: 0,
    category: "Movies & TV"
  },
  {
    question: "Who played the character of Jack Sparrow?",
    options: ["Orlando Bloom", "Johnny Depp", "Geoffrey Rush", "Keira Knightley"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which animated movie features a fish with memory problems?",
    options: ["Finding Nemo", "The Little Mermaid", "Shark Tale", "Moana"],
    correctAnswer: 0,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the bar where everybody knows your name?",
    options: ["MacLaren's", "Central Perk", "Cheers", "Moe's Tavern"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Who directed the movie 'The Dark Knight'?",
    options: ["Zack Snyder", "Christopher Nolan", "Tim Burton", "Joel Schumacher"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which TV series features the character Sheldon Cooper?",
    options: ["Friends", "How I Met Your Mother", "The Big Bang Theory", "Two and a Half Men"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the hobbit in 'The Lord of the Rings'?",
    options: ["Frodo Baggins", "Bilbo Baggins", "Samwise Gamgee", "Peregrin Took"],
    correctAnswer: 0,
    category: "Movies & TV"
  },
  {
    question: "Which movie features the quote 'I'll be back'?",
    options: ["Predator", "The Terminator", "Total Recall", "Commando"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Who played the character of Ellen Ripley in 'Alien'?",
    options: ["Linda Hamilton", "Sigourney Weaver", "Jamie Lee Curtis", "Jodie Foster"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which TV series is set in a post-apocalyptic world with zombies?",
    options: ["Fear the Walking Dead", "Z Nation", "The Walking Dead", "Black Summer"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the ship in 'Pirates of the Caribbean'?",
    options: ["The Flying Dutchman", "The Black Pearl", "The Queen Anne's Revenge", "The Interceptor"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Who directed the movie 'Goodfellas'?",
    options: ["Francis Ford Coppola", "Martin Scorsese", "Robert De Niro", "Joe Pesci"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which animated movie features a family of superheroes?",
    options: ["The Incredibles", "Megamind", "Despicable Me", "Monsters Inc."],
    correctAnswer: 0,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the dog in 'The Wizard of Oz'?",
    options: ["Lassie", "Rin Tin Tin", "Toto", "Benji"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Who played the character of Hannibal Lecter in 'The Silence of the Lambs'?",
    options: ["Robert De Niro", "Jack Nicholson", "Anthony Hopkins", "Al Pacino"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Which movie is famous for the quote 'Nobody puts Baby in a corner'?",
    options: ["Ghost", "Dirty Dancing", "Pretty Woman", "Top Gun"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the space station in '2001: A Space Odyssey'?",
    options: ["Discovery One", "HAL 9000", "Space Station V", "Leonov"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Which TV series features the character Tony Soprano?",
    options: ["Goodfellas", "The Sopranos", "The Godfather", "Casino"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Who directed the movie 'Schindler's List'?",
    options: ["Martin Scorsese", "Steven Spielberg", "Robert Zemeckis", "Ron Howard"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which animated movie features a young lion prince?",
    options: ["The Jungle Book", "The Lion King", "Madagascar", "Rio"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the motel in 'Psycho'?",
    options: ["Overlook Hotel", "Bates Motel", "Hotel California", "The Stanley Hotel"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which TV series features the character Dexter Morgan?",
    options: ["Criminal Minds", "CSI", "Dexter", "Law & Order"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  {
    question: "Who played the character of Vito Corleone in 'The Godfather Part II'?",
    options: ["Marlon Brando", "Robert De Niro", "Al Pacino", "James Caan"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which movie features the quote 'Show me the money!'?",
    options: ["Top Gun", "Jerry Maguire", "A Few Good Men", "Rain Man"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "What is the name of the AI computer in '2001: A Space Odyssey'?",
    options: ["WALL-E", "HAL 9000", "GLaDOS", "FRIDAY"],
    correctAnswer: 1,
    category: "Movies & TV"
  },
  {
    question: "Which TV series is based on Stephen King's novels?",
    options: ["American Horror Story", "The Walking Dead", "Castle Rock", "Stranger Things"],
    correctAnswer: 2,
    category: "Movies & TV"
  },
  // Music (49 questions)
  {
    question: "Which band released the album 'Dark Side of the Moon'?",
    options: ["Led Zeppelin", "Pink Floyd", "The Who", "Black Sabbath"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Who composed 'Bohemian Rhapsody'?",
    options: ["John Lennon", "David Bowie", "Freddie Mercury", "Elton John"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Which instrument did Jimi Hendrix famously play?",
    options: ["Piano", "Drums", "Bass", "Guitar"],
    correctAnswer: 3,
    category: "Music"
  },
  {
    question: "What was Elvis Presley's middle name?",
    options: ["Aaron", "Andrew", "Anthony", "Alexander"],
    correctAnswer: 0,
    category: "Music"
  },
  {
    question: "Which city is considered the birthplace of jazz?",
    options: ["Chicago", "New York", "New Orleans", "Memphis"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Who wrote the song 'Imagine'?",
    options: ["Paul McCartney", "John Lennon", "George Harrison", "Ringo Starr"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Which singer is known as 'The Queen of Soul'?",
    options: ["Diana Ross", "Aretha Franklin", "Whitney Houston", "Tina Turner"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "What is the highest male singing voice?",
    options: ["Tenor", "Baritone", "Bass", "Countertenor"],
    correctAnswer: 3,
    category: "Music"
  },
  {
    question: "Which band performed 'Stairway to Heaven'?",
    options: ["The Rolling Stones", "Led Zeppelin", "Deep Purple", "Black Sabbath"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Who composed 'The Blue Danube'?",
    options: ["Johann Strauss Jr.", "Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Franz Schubert"],
    correctAnswer: 0,
    category: "Music"
  },
  {
    question: "Which country is famous for reggae music?",
    options: ["Cuba", "Brazil", "Jamaica", "Puerto Rico"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Who is known as 'The King of Rock and Roll'?",
    options: ["Chuck Berry", "Little Richard", "Elvis Presley", "Jerry Lee Lewis"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Which composer wrote 'The Marriage of Figaro'?",
    options: ["Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Johann Sebastian Bach", "Franz Joseph Haydn"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "What does the musical term 'forte' mean?",
    options: ["Soft", "Loud", "Fast", "Slow"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Which singer recorded 'Like a Rolling Stone'?",
    options: ["Neil Young", "Bob Dylan", "Leonard Cohen", "Joni Mitchell"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "How many strings does a standard guitar have?",
    options: ["4", "5", "6", "7"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Which band released 'Hotel California'?",
    options: ["Fleetwood Mac", "The Eagles", "America", "Crosby, Stills & Nash"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Who composed 'The Nutcracker Suite'?",
    options: ["Sergei Rachmaninoff", "Pyotr Ilyich Tchaikovsky", "Igor Stravinsky", "Sergei Prokofiev"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Which genre of music originated in the Bronx in the 1970s?",
    options: ["Disco", "Punk", "Hip-hop", "New wave"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Who was the lead singer of the band Queen?",
    options: ["David Bowie", "Freddie Mercury", "Robert Plant", "Roger Daltrey"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Which instrument family does the trumpet belong to?",
    options: ["Woodwind", "Brass", "Percussion", "String"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Who wrote the musical 'West Side Story'?",
    options: ["Andrew Lloyd Webber", "Stephen Sondheim", "Leonard Bernstein", "Rodgers and Hammerstein"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Which singer is known for the hit 'Purple Rain'?",
    options: ["Michael Jackson", "Prince", "Stevie Wonder", "Marvin Gaye"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "What is the lowest female singing voice?",
    options: ["Soprano", "Mezzo-soprano", "Alto", "Contralto"],
    correctAnswer: 3,
    category: "Music"
  },
  {
    question: "Which band recorded 'Smoke on the Water'?",
    options: ["Led Zeppelin", "Black Sabbath", "Deep Purple", "Rainbow"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Who composed 'Rhapsody in Blue'?",
    options: ["Duke Ellington", "George Gershwin", "Count Basie", "Miles Davis"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Which country is famous for flamenco music?",
    options: ["Portugal", "Italy", "Spain", "Greece"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Who was known as 'The Godfather of Soul'?",
    options: ["Sam Cooke", "Otis Redding", "James Brown", "Wilson Pickett"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "What does the musical term 'piano' mean?",
    options: ["Loud", "Soft", "Fast", "Slow"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Which singer recorded 'Respect'?",
    options: ["Diana Ross", "Aretha Franklin", "Tina Turner", "Gladys Knight"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "How many keys are there on a standard piano?",
    options: ["76", "84", "88", "96"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Which band released 'Back in Black'?",
    options: ["Black Sabbath", "AC/DC", "Metallica", "Iron Maiden"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Who composed 'The Four Seasons' violin concertos?",
    options: ["Johann Sebastian Bach", "George Frideric Handel", "Antonio Vivaldi", "Arcangelo Corelli"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Which city is famous for country music?",
    options: ["Austin", "Memphis", "Nashville", "Atlanta"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Who was the lead vocalist of Nirvana?",
    options: ["Eddie Vedder", "Chris Cornell", "Kurt Cobain", "Layne Staley"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Which instrument family does the violin belong to?",
    options: ["Woodwind", "Brass", "Percussion", "String"],
    correctAnswer: 3,
    category: "Music"
  },
  {
    question: "Who wrote the musical 'The Phantom of the Opera'?",
    options: ["Stephen Sondheim", "Andrew Lloyd Webber", "Tim Rice", "Leonard Bernstein"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Which singer is known for 'What's Going On'?",
    options: ["Stevie Wonder", "Marvin Gaye", "Al Green", "Curtis Mayfield"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "What is a group of four musicians called?",
    options: ["Trio", "Quartet", "Quintet", "Sextet"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Which band recorded 'Bohemian Rhapsody'?",
    options: ["The Beatles", "Led Zeppelin", "Queen", "The Who"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Who composed 'Moonlight Sonata'?",
    options: ["Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Franz Schubert", "Frédéric Chopin"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Which country is the birthplace of tango music?",
    options: ["Spain", "Brazil", "Argentina", "Chile"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Who was known as 'Lady Day'?",
    options: ["Ella Fitzgerald", "Sarah Vaughan", "Billie Holiday", "Nina Simone"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Which composer wrote the 'Pastoral Symphony'?",
    options: ["Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Franz Schubert", "Johannes Brahms"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "What does the musical term 'allegro' mean?",
    options: ["Very slow", "Slow", "Fast", "Very fast"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Which singer recorded 'My Way'?",
    options: ["Dean Martin", "Frank Sinatra", "Sammy Davis Jr.", "Tony Bennett"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "How many movements does a typical classical symphony have?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 2,
    category: "Music"
  },
  {
    question: "Which band released 'The Wall'?",
    options: ["The Beatles", "Pink Floyd", "Led Zeppelin", "The Who"],
    correctAnswer: 1,
    category: "Music"
  },
  {
    question: "Who composed the opera 'La Traviata'?",
    options: ["Giacomo Puccini", "Giuseppe Verdi", "Gioachino Rossini", "Gaetano Donizetti"],
    correctAnswer: 1,
    category: "Music"
  },
  // Nature & Animals (45 questions)
  {
    question: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "How many hearts does an octopus have?",
    options: ["1", "2", "3", "4"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which bird is known for its colorful tail feathers?",
    options: ["Cardinal", "Blue Jay", "Peacock", "Robin"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "What is the fastest land animal?",
    options: ["Lion", "Cheetah", "Leopard", "Gazelle"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "Which animal is known as the 'King of the Jungle'?",
    options: ["Tiger", "Leopard", "Lion", "Jaguar"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "How many legs does a spider have?",
    options: ["6", "8", "10", "12"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "Which mammal is capable of true flight?",
    options: ["Flying Squirrel", "Bat", "Sugar Glider", "Flying Lemur"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "What is the largest cat species?",
    options: ["Lion", "Leopard", "Tiger", "Jaguar"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which animal has the longest neck?",
    options: ["Ostrich", "Emu", "Giraffe", "Swan"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "How many chambers does a bird's heart have?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which insect produces honey?",
    options: ["Wasp", "Bee", "Hornet", "Ant"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "What is the largest bird in the world?",
    options: ["Eagle", "Condor", "Ostrich", "Albatross"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which animal is known for changing colors?",
    options: ["Iguana", "Gecko", "Chameleon", "Anole"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "How many eyes does a typical spider have?",
    options: ["4", "6", "8", "10"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which animal has the most powerful bite?",
    options: ["Great White Shark", "Crocodile", "Hyena", "Hippo"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "What is the smallest mammal in the world?",
    options: ["Shrew", "Mouse", "Bumblebee Bat", "Lemming"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which animal sleeps the most per day?",
    options: ["Sloth", "Koala", "Cat", "Panda"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "How many wings does a bee have?",
    options: ["2", "4", "6", "8"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "Which marine animal is known for its intelligence?",
    options: ["Shark", "Dolphin", "Whale", "Octopus"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "What is the tallest tree species in the world?",
    options: ["Douglas Fir", "Redwood", "Sequoia", "Pine"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "Which animal has stripes that are unique like fingerprints?",
    options: ["Tiger", "Zebra", "Giraffe", "Cheetah"],
    correctAnswer: 0,
    category: "Nature & Animals"
  },
  {
    question: "How long is an elephant's pregnancy?",
    options: ["12 months", "18 months", "22 months", "24 months"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which bird cannot fly but is an excellent swimmer?",
    options: ["Ostrich", "Emu", "Penguin", "Kiwi"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "What is the most venomous snake in the world?",
    options: ["King Cobra", "Black Mamba", "Inland Taipan", "Rattlesnake"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which animal can survive without water the longest?",
    options: ["Camel", "Kangaroo Rat", "Desert Tortoise", "Fennec Fox"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "How many species of penguin are there?",
    options: ["12", "17", "22", "27"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "Which animal has the best eyesight?",
    options: ["Eagle", "Hawk", "Falcon", "All have similar eyesight"],
    correctAnswer: 0,
    category: "Nature & Animals"
  },
  {
    question: "What is the lifespan of a mayfly?",
    options: ["1 hour", "1 day", "1 week", "1 month"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "Which mammal lays eggs?",
    options: ["Bat", "Platypus", "Dolphin", "Whale"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "How fast can a hummingbird's wings beat per second?",
    options: ["50 times", "80 times", "120 times", "200 times"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "Which animal has the largest brain relative to body size?",
    options: ["Human", "Dolphin", "Elephant", "Chimpanzee"],
    correctAnswer: 0,
    category: "Nature & Animals"
  },
  {
    question: "Which flower is known as the symbol of love?",
    options: ["Tulip", "Rose", "Lily", "Daisy"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "How many bones does a shark have?",
    options: ["0", "50", "100", "200"],
    correctAnswer: 0,
    category: "Nature & Animals"
  },
  {
    question: "Which animal group do frogs belong to?",
    options: ["Reptiles", "Amphibians", "Fish", "Mammals"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "How many legs does a centipede have?",
    options: ["50", "100", "Varies", "1000"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which tree produces acorns?",
    options: ["Pine", "Maple", "Oak", "Birch"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which animal is known for its ability to regenerate limbs?",
    options: ["Gecko", "Salamander", "Lizard", "Frog"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "How many chambers does a fish heart have?",
    options: ["1", "2", "3", "4"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "Which insect can lift 50 times its own weight?",
    options: ["Bee", "Ant", "Beetle", "Grasshopper"],
    correctAnswer: 1,
    category: "Nature & Animals"
  },
  {
    question: "Which animal has three hearts?",
    options: ["Squid", "Octopus", "Cuttlefish", "All cephalopods"],
    correctAnswer: 3,
    category: "Nature & Animals"
  },
  {
    question: "How many teeth does an adult human typically have?",
    options: ["28", "30", "32", "36"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which gas do plants release during photosynthesis?",
    options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "What is the fastest fish in the ocean?",
    options: ["Tuna", "Marlin", "Sailfish", "Shark"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "Which mammal has no vocal cords?",
    options: ["Dolphin", "Whale", "Giraffe", "Elephant"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  {
    question: "How many eyes does a honeybee have?",
    options: ["2", "3", "5", "6"],
    correctAnswer: 2,
    category: "Nature & Animals"
  },
  // World Facts (47 questions)
  {
    question: "Which is the most spoken language in the world?",
    options: ["English", "Spanish", "Mandarin Chinese", "Hindi"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "What is the most populated country in the world?",
    options: ["India", "China", "United States", "Indonesia"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "Which currency is used in Japan?",
    options: ["Won", "Yuan", "Yen", "Rupee"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "What is the largest religion in the world?",
    options: ["Islam", "Christianity", "Hinduism", "Buddhism"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the smallest country in the world by area?",
    options: ["Monaco", "Nauru", "Vatican City", "San Marino"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "Which ocean is the smallest?",
    options: ["Atlantic", "Indian", "Arctic", "Southern"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "What is the most traded commodity in the world?",
    options: ["Gold", "Oil", "Coffee", "Wheat"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "Which country produces the most coffee?",
    options: ["Colombia", "Vietnam", "Brazil", "Ethiopia"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "What is the longest mountain range in the world?",
    options: ["Himalayas", "Rocky Mountains", "Andes", "Alps"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "Which country has the most natural lakes?",
    options: ["Finland", "Canada", "Russia", "Sweden"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the driest place on Earth?",
    options: ["Sahara Desert", "Death Valley", "Atacama Desert", "Gobi Desert"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "Which city has the highest population?",
    options: ["Shanghai", "Tokyo", "Delhi", "São Paulo"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the most visited country in the world?",
    options: ["United States", "Spain", "France", "China"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "What is the deepest lake in the world?",
    options: ["Lake Superior", "Caspian Sea", "Lake Baikal", "Lake Tanganyika"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "Which country invented pizza?",
    options: ["Greece", "Italy", "Turkey", "France"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the most expensive spice by weight?",
    options: ["Vanilla", "Cardamom", "Saffron", "Cinnamon"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "Which country has the most UNESCO World Heritage Sites?",
    options: ["China", "Germany", "Italy", "Spain"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "What is the highest capital city in the world?",
    options: ["Quito", "La Paz", "Bogotá", "Addis Ababa"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "Which country produces the most wine?",
    options: ["Spain", "France", "Italy", "United States"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "What is the most common blood type?",
    options: ["A+", "B+", "AB+", "O+"],
    correctAnswer: 3,
    category: "World Facts"
  },
  {
    question: "Which country has the most islands?",
    options: ["Norway", "Finland", "Sweden", "Canada"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the windiest place on Earth?",
    options: ["Mount Washington", "Antarctica", "Cape Horn", "Patagonia"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "Which country consumes the most chocolate per capita?",
    options: ["Belgium", "Switzerland", "Germany", "Austria"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the oldest city in the world?",
    options: ["Athens", "Rome", "Damascus", "Jerusalem"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "Which country has the most pyramids?",
    options: ["Egypt", "Sudan", "Mexico", "Peru"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the most Lightning-struck place on Earth?",
    options: ["Florida", "Lake Maracaibo", "Central Africa", "Amazon Basin"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "Which country invented the sandwich?",
    options: ["France", "England", "Germany", "Italy"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the coldest permanently inhabited place on Earth?",
    options: ["Siberia", "Alaska", "Oymyakon", "Antarctica"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "Which country has the most volcanoes?",
    options: ["Japan", "Indonesia", "Philippines", "Chile"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the most traded agricultural product?",
    options: ["Rice", "Wheat", "Corn", "Soybeans"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "Which country produces the most tea?",
    options: ["India", "China", "Sri Lanka", "Kenya"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the largest hot desert in the world?",
    options: ["Gobi", "Kalahari", "Arabian", "Sahara"],
    correctAnswer: 3,
    category: "World Facts"
  },
  {
    question: "Which country has the most neighbors?",
    options: ["Russia", "China", "Brazil", "Germany"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the most earthquake-prone country?",
    options: ["Chile", "Japan", "Indonesia", "Turkey"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "Which country invented ice cream?",
    options: ["Italy", "France", "China", "United States"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "What is the wettest place on Earth?",
    options: ["Amazon Rainforest", "Mawsynram", "Mount Waialeale", "Cherrapunji"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "Which country has the most biodiversity?",
    options: ["Brazil", "Colombia", "Indonesia", "Peru"],
    correctAnswer: 0,
    category: "World Facts"
  },
  {
    question: "What is the most recycled material in the world?",
    options: ["Paper", "Plastic", "Glass", "Steel"],
    correctAnswer: 3,
    category: "World Facts"
  },
  {
    question: "Which country invented pasta?",
    options: ["China", "Italy", "Greece", "Turkey"],
    correctAnswer: 0,
    category: "World Facts"
  },
  {
    question: "Which country has the most castles?",
    options: ["France", "Germany", "Scotland", "Ireland"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the most commonly used password?",
    options: ["password", "123456", "admin", "qwerty"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "Which country invented the hamburger?",
    options: ["Germany", "United States", "Denmark", "Austria"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the most photographed building in the world?",
    options: ["Taj Mahal", "Eiffel Tower", "Empire State Building", "Big Ben"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "Which country has the most World Cup wins?",
    options: ["Germany", "Argentina", "Brazil", "Italy"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "What is the most abundant element in the universe?",
    options: ["Carbon", "Oxygen", "Hydrogen", "Helium"],
    correctAnswer: 2,
    category: "World Facts"
  },
  {
    question: "Which country invented the telephone?",
    options: ["United States", "Scotland", "Germany", "Italy"],
    correctAnswer: 1,
    category: "World Facts"
  },
  {
    question: "What is the most consumed beverage after water?",
    options: ["Coffee", "Tea", "Soda", "Beer"],
    correctAnswer: 1,
    category: "World Facts"
  },
];

// Combine both question sets
const allQuestions = [...triviaQuestions, ...triviaQuestions2];

// Function to get a random question from both sets
export function getRandomQuestion() {
  const randomIndex = Math.floor(Math.random() * allQuestions.length);
  const selectedQuestion = allQuestions[randomIndex];
  
  // Convert the interface to match AIPage expectations
  // Handle both 'options' (from triviaQuestions) and 'answers' (from triviaQuestions2)
  const options = (selectedQuestion as any).options || (selectedQuestion as any).answers;
  
  // Determine category for questions from triviaQuestions2 based on index
  let category = (selectedQuestion as any).category;
  
  if (!category && randomIndex >= triviaQuestions.length) {
    // This is from triviaQuestions2, assign category based on position
    const indexInSecondSet = randomIndex - triviaQuestions.length;
    if (indexInSecondSet < 40) category = 'Astronomy & Space';
    else if (indexInSecondSet < 80) category = 'Biology & Medicine';
    else if (indexInSecondSet < 120) category = 'Chemistry & Physics';
    else if (indexInSecondSet < 160) category = 'World Cultures';
    else if (indexInSecondSet < 200) category = 'Food & Cooking';
    else if (indexInSecondSet < 240) category = 'Inventions & Technology';
    else if (indexInSecondSet < 262) category = 'Mathematics';
    else category = 'General';
  }
  
  return {
    question: selectedQuestion.question,
    options: options,
    correctAnswer: selectedQuestion.correctAnswer,
    category: category || 'General'
  };
}
