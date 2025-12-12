export interface Poll {
  id: string;
  segment: number;
  segmentName: string;
  title: string;
  imageUrl: string;
  question: string;
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  votingTime: number; // in seconds
  revealTime: number; // in seconds
}

export const gameData: Poll[] = [
  // SEGMENT 1: OPENING HOOK + WARM-UP (3 polls)
  {
    id: "seg-1-1",
    segment: 1,
    segmentName: "Opening Hook",
    title: "Penrose Triangle",
    imageUrl: "/illusions/seg-1-1-Penrose_triangle.svg",
    question: "Is this object possible to build in real life?",
    options: ["Yes", "No", "Not sure"],
    correctAnswer: "No",
    explanation:
      "This is an impossible object - it looks real in 2D but can't exist in 3D space!",
    votingTime: 20,
    revealTime: 15,
  },
  {
    id: "seg-1-2",
    segment: 1,
    segmentName: "Opening Hook",
    title: "Rotating Snakes",
    imageUrl: "/illusions/seg-1-2-rotsnak5.gif",
    question: "Does this image actually move?",
    options: ["Yes", "No", "Can't tell"],
    correctAnswer: "No",
    explanation:
      "It's completely still! Your brain creates the illusion of movement from the pattern contrasts.",
    votingTime: 20,
    revealTime: 15,
  },
  {
    id: "seg-1-3",
    segment: 1,
    segmentName: "Opening Hook",
    title: "The Dress",
    imageUrl: "/illusions/seg-1-3-The_dress_blueblackwhitegold.jpg",
    question: "What colors do you see in the dress?",
    options: ["Blue & Black", "White & Gold", "Other"],
    correctAnswer: ["Blue & Black", "White & Gold"],
    explanation:
      "Both are valid! Your brain interprets the lighting differently.",
    votingTime: 20,
    revealTime: 15,
  },

  // SEGMENT 2: REACTION CHALLENGE (7 polls)
  {
    id: "seg-2-1",
    segment: 2,
    segmentName: "Reaction Challenge",
    title: "Duck-Rabbit",
    imageUrl: "/illusions/seg-2-1-Duck-Rabbit_illusion.jpg",
    question: "What animal do you see?",
    options: ["Duck", "Rabbit", "Both", "Neither"],
    correctAnswer: ["Duck", "Rabbit", "Both"],
    explanation:
      "Classic ambiguous image - your brain switches between interpretations!",
    votingTime: 30,
    revealTime: 20,
  },
  {
    id: "seg-2-2",
    segment: 2,
    segmentName: "Reaction Challenge",
    title: "Young Woman / Old Woman",
    imageUrl: "/illusions/seg-2-2-Youngoldwoman.jpg",
    question: "Who do you see in this image?",
    options: ["Young woman", "Old woman", "Both", "No one"],
    correctAnswer: ["Young woman", "Old woman", "Both"],
    explanation:
      "The young woman's ear becomes the old woman's eye! Look again!",
    votingTime: 30,
    revealTime: 20,
  },
  {
    id: "seg-2-3",
    segment: 2,
    segmentName: "Reaction Challenge",
    title: "Rubin's Vase / Faces",
    imageUrl: "/illusions/seg-2-3-Face_or_vase_ata_01.svg",
    question: "What do you see first?",
    options: ["Vase", "Two faces", "Both", "Nothing"],
    correctAnswer: ["Vase", "Two faces", "Both"],
    explanation:
      "Figure-ground illusion - your brain can only see one interpretation at a time!",
    votingTime: 30,
    revealTime: 20,
  },
  {
    id: "seg-2-4",
    segment: 2,
    segmentName: "Reaction Challenge",
    title: "Spinning Dancer",
    imageUrl: "/illusions/seg-2-4-Spinning_Dancer.gif",
    question: "Which direction is the dancer spinning?",
    options: ["Clockwise", "Counterclockwise", "Both", "Not spinning"],
    correctAnswer: ["Clockwise", "Counterclockwise", "Both"],
    explanation:
      "No depth cues mean your brain guesses the rotation direction!",
    votingTime: 30,
    revealTime: 20,
  },
  {
    id: "seg-2-5",
    segment: 2,
    segmentName: "Reaction Challenge",
    title: "Necker Cube",
    imageUrl: "/illusions/seg-2-5-Cube1.svg",
    question: "Which face of the cube is in front?",
    options: ["Top-left", "Bottom-right", "Changes", "Can't tell"],
    correctAnswer: ["Top-left", "Bottom-right", "Changes"],
    explanation:
      "Ambiguous depth cue - the cube flips perspective as you watch!",
    votingTime: 30,
    revealTime: 20,
  },
  {
    id: "seg-2-6",
    segment: 2,
    segmentName: "Reaction Challenge",
    title: "Café Wall Illusion",
    imageUrl: "/illusions/seg-2-6-Café_wall.svg",
    question: "Are the horizontal lines parallel or tilted?",
    options: ["Parallel", "Tilted", "Curved", "Wavy"],
    correctAnswer: "Parallel",
    explanation:
      "They're perfectly straight! The offset squares trick your brain.",
    votingTime: 30,
    revealTime: 20,
  },
  {
    id: "seg-2-7",
    segment: 2,
    segmentName: "Reaction Challenge",
    title: "Schröder Stairs",
    imageUrl: "/illusions/seg-2-7-Schroeder-trepperp.png",
    question: "Are you looking at the stairs from above or below?",
    options: ["Above", "Below", "Both", "Side view"],
    correctAnswer: ["Above", "Below", "Both"],
    explanation:
      "Reversible figure - your brain alternates between interpretations!",
    votingTime: 30,
    revealTime: 20,
  },

  // SEGMENT 3: HUNT GAME (5 polls)
  {
    id: "seg-3-1",
    segment: 3,
    segmentName: "Hunt Game",
    title: "FedEx Arrow",
    imageUrl: "/illusions/seg-3-1-FedEx_Ground_-_2016_Logo.svg",
    question: "What's hidden in the FedEx logo?",
    options: ["Arrow", "Triangle", "Letter", "Nothing"],
    correctAnswer: "Arrow",
    explanation:
      "The negative space between E and x forms an arrow - most people never notice it!",
    votingTime: 45,
    revealTime: 30,
  },
  {
    id: "seg-3-2",
    segment: 3,
    segmentName: "Hunt Game",
    title: "Hidden Face in Landscape",
    imageUrl: "/illusions/seg-3-2-hidden-face-landscape.avif",
    question: "Where is the hidden face?",
    options: ["Top-left", "Center", "Bottom-right", "No face"],
    correctAnswer: "Center",
    explanation:
      "Pareidolia - your brain is wired to recognize faces everywhere!",
    votingTime: 60,
    revealTime: 30,
  },
  {
    id: "seg-3-3",
    segment: 3,
    segmentName: "Hunt Game",
    title: "Hidden Animals",
    imageUrl: "/illusions/seg-3-3-hidden-animals-spot.avif",
    question: "How many animals are hidden in this image?",
    options: ["2", "3", "4", "5+"],
    correctAnswer: "4",
    explanation:
      "Each animal shares body parts with others - clever visual puzzle!",
    votingTime: 75,
    revealTime: 30,
  },
  {
    id: "seg-3-4",
    segment: 3,
    segmentName: "Hunt Game",
    title: "ABC or 13?",
    imageUrl: "/illusions/seg-3-4-B_or_13.gif",
    question: "What do you see in the middle?",
    options: ["13", "B", "Both", "Neither"],
    correctAnswer: ["13", "B", "Both"],
    explanation:
      "Context determines what your brain interprets! The same shape reads as letter or number.",
    votingTime: 45,
    revealTime: 30,
  },
  {
    id: "seg-3-5",
    segment: 3,
    segmentName: "Hunt Game",
    title: "Adelson's Checker Shadow",
    imageUrl: "/illusions/seg-3-5-Checker_shadow_illusion.svg",
    question: "Which squares are the SAME shade of gray?",
    options: ["A & B", "B & C", "A & C", "All different"],
    correctAnswer: "A & B",
    explanation:
      "They're the exact same color! Surrounding colors trick your perception. We'll prove it by connecting them!",
    votingTime: 60,
    revealTime: 45,
  },

  // SEGMENT 4: COLOR BLIND TEST (4 polls)
  {
    id: "seg-4-1",
    segment: 4,
    segmentName: "Color Vision Test",
    title: "Easy Plate (Baseline)",
    imageUrl: "/illusions/seg-4-1-easy-1-12.png",
    question: "What number do you see?",
    options: ["8", "12", "74", "Nothing"],
    correctAnswer: "12",
    explanation:
      "Normal vision: 12 | Red-green colorblind: may see nothing or different numbers",
    votingTime: 20,
    revealTime: 15,
  },
  {
    id: "seg-4-2",
    segment: 4,
    segmentName: "Color Vision Test",
    title: "Medium Difficulty",
    imageUrl: "/illusions/seg-4-2-easy-2-74.png",
    question: "What number do you see?",
    options: ["3", "5", "74", "Nothing"],
    correctAnswer: "74",
    explanation:
      "Different types of color blindness see different numbers! This reveals if you're red-blind vs green-blind.",
    votingTime: 20,
    revealTime: 15,
  },
  {
    id: "seg-4-3",
    segment: 4,
    segmentName: "Color Vision Test",
    title: "Vanishing Number",
    imageUrl: "/illusions/seg-4-3-easy-3-8.png",
    question: "What number do you see?",
    options: ["45", "46", "8", "Nothing"],
    correctAnswer: "8",
    explanation:
      "Only those with normal color vision can distinguish the green from red dots!",
    votingTime: 20,
    revealTime: 15,
  },
  {
    id: "seg-4-4",
    segment: 4,
    segmentName: "Color Vision Test",
    title: "BONUS - Super Hard",
    imageUrl: "/illusions/seg-4-4-medium-1-6.png",
    question: "Can you see ANY number? (Very difficult!)",
    options: ["2", "5", "6", "Nothing"],
    correctAnswer: "6",
    explanation:
      "If you saw it, you have exceptional color sensitivity! Only 1 in 5 people can read this plate.",
    votingTime: 25,
    revealTime: 20,
  },
];

export const getSegmentPolls = (segment: number): Poll[] => {
  return gameData.filter((poll) => poll.segment === segment);
};

export const getTotalPolls = (): number => {
  return gameData.length;
};

export const getPollById = (id: string): Poll | undefined => {
  return gameData.find((poll) => poll.id === id);
};
