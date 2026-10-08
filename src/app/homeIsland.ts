// Made by scripts/home-island.py from the Blender render (blender/home_island.py). Don't edit by hand.

/** Where each landmark is on the island picture, in % across and down. */
export const ISLAND_SIZE = { w: 1920, h: 1080 };

/** The picture, with its version so browsers fetch a new render. */
export const ISLAND_IMAGE = "/images/home-island.webp?v=03d461a166";

export const ISLAND_SPOTS: Record<string, { sign: [number, number]; foot: [number, number] }> = {
  "tricky": {
    "sign": [
      22.23,
      19.34
    ],
    "foot": [
      23.75,
      31.25
    ]
  },
  "stories": {
    "sign": [
      40.39,
      17.0
    ],
    "foot": [
      40.91,
      28.87
    ]
  },
  "guided": {
    "sign": [
      59.61,
      17.0
    ],
    "foot": [
      59.09,
      28.87
    ]
  },
  "assessment": {
    "sign": [
      77.77,
      19.34
    ],
    "foot": [
      76.25,
      31.25
    ]
  },
  "phonics": {
    "sign": [
      11.24,
      33.12
    ],
    "foot": [
      13.54,
      45.19
    ]
  },
  "soundout": {
    "sign": [
      29.31,
      32.19
    ],
    "foot": [
      30.53,
      44.25
    ]
  },
  "storyplay": {
    "sign": [
      70.69,
      32.19
    ],
    "foot": [
      69.47,
      44.25
    ]
  },
  "threed": {
    "sign": [
      88.76,
      33.12
    ],
    "foot": [
      86.46,
      45.19
    ]
  },
  "flashcards": {
    "sign": [
      16.28,
      50.66
    ],
    "foot": [
      18.47,
      62.74
    ]
  },
  "spelling": {
    "sign": [
      32.95,
      55.32
    ],
    "foot": [
      34.09,
      67.37
    ]
  },
  "formation": {
    "sign": [
      50.0,
      56.52
    ],
    "foot": [
      50.0,
      68.56
    ]
  },
  "assignments": {
    "sign": [
      67.05,
      55.32
    ],
    "foot": [
      65.91,
      67.37
    ]
  },
  "tracker": {
    "sign": [
      83.72,
      50.66
    ],
    "foot": [
      81.53,
      62.74
    ]
  },
  "interactive": {
    "sign": [
      50.0,
      31.54
    ],
    "foot": [
      50.0,
      43.6
    ]
  },
  "lagoon": {
    "sign": [
      50.0,
      43.78
    ],
    "foot": [
      50.0,
      43.78
    ]
  }
};

/** Each landmark's animation strip: where it sits on the island (in % of
    the picture) and how many frames it has, side by side. */
export const ISLAND_LANDMARKS: Record<string, { x: number; y: number; w: number; h: number; frames: number }> = {
  "assessment": {
    "x": 72.135,
    "y": 16.759,
    "w": 9.219,
    "h": 17.13,
    "frames": 12
  },
  "assignments": {
    "x": 60.833,
    "y": 52.685,
    "w": 10.938,
    "h": 19.074,
    "frames": 12
  },
  "flashcards": {
    "x": 12.292,
    "y": 47.963,
    "w": 10.938,
    "h": 18.981,
    "frames": 12
  },
  "formation": {
    "x": 44.531,
    "y": 53.796,
    "w": 10.938,
    "h": 19.259,
    "frames": 12
  },
  "guided": {
    "x": 54.792,
    "y": 14.444,
    "w": 8.958,
    "h": 16.944,
    "frames": 12
  },
  "interactive": {
    "x": 45.156,
    "y": 28.889,
    "w": 9.688,
    "h": 17.87,
    "frames": 12
  },
  "phonics": {
    "x": 7.708,
    "y": 30.556,
    "w": 10.156,
    "h": 17.87,
    "frames": 12
  },
  "soundout": {
    "x": 25.208,
    "y": 29.537,
    "w": 9.844,
    "h": 17.87,
    "frames": 12
  },
  "spelling": {
    "x": 28.229,
    "y": 52.593,
    "w": 10.938,
    "h": 19.167,
    "frames": 12
  },
  "stories": {
    "x": 36.25,
    "y": 14.444,
    "w": 8.958,
    "h": 16.944,
    "frames": 12
  },
  "storyplay": {
    "x": 64.948,
    "y": 29.537,
    "w": 9.844,
    "h": 17.963,
    "frames": 12
  },
  "threed": {
    "x": 82.135,
    "y": 30.463,
    "w": 10.156,
    "h": 17.963,
    "frames": 12
  },
  "tracker": {
    "x": 76.771,
    "y": 47.963,
    "w": 10.938,
    "h": 18.889,
    "frames": 12
  },
  "tricky": {
    "x": 18.646,
    "y": 16.759,
    "w": 9.219,
    "h": 17.13,
    "frames": 12
  }
};
