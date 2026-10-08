// Made by scripts/home-island.py from the Blender render (blender/home_island.py). Don't edit by hand.

/** Where each landmark is on the island picture, in % across and down. */
export const ISLAND_SIZE = { w: 1920, h: 1080 };

/** The picture, with its version so browsers fetch a new render. */
export const ISLAND_IMAGE = "/images/home-island.webp?v=83b5806967";

export const ISLAND_SPOTS: Record<string, { sign: [number, number]; foot: [number, number] }> = {
  "tricky": {
    "sign": [
      22.51,
      21.51
    ],
    "foot": [
      23.75,
      31.25
    ]
  },
  "stories": {
    "sign": [
      40.14,
      11.41
    ],
    "foot": [
      40.91,
      28.87
    ]
  },
  "guided": {
    "sign": [
      60.22,
      3.08
    ],
    "foot": [
      59.09,
      28.87
    ]
  },
  "assessment": {
    "sign": [
      77.49,
      21.51
    ],
    "foot": [
      76.25,
      31.25
    ]
  },
  "phonics": {
    "sign": [
      11.66,
      35.33
    ],
    "foot": [
      13.54,
      45.19
    ]
  },
  "soundout": {
    "sign": [
      29.53,
      34.39
    ],
    "foot": [
      30.53,
      44.25
    ]
  },
  "storyplay": {
    "sign": [
      70.47,
      34.39
    ],
    "foot": [
      69.47,
      44.25
    ]
  },
  "threed": {
    "sign": [
      88.34,
      35.33
    ],
    "foot": [
      86.46,
      45.19
    ]
  },
  "flashcards": {
    "sign": [
      16.68,
      52.88
    ],
    "foot": [
      18.47,
      62.74
    ]
  },
  "spelling": {
    "sign": [
      33.16,
      57.54
    ],
    "foot": [
      34.09,
      67.37
    ]
  },
  "formation": {
    "sign": [
      50.0,
      58.74
    ],
    "foot": [
      50.0,
      68.56
    ]
  },
  "assignments": {
    "sign": [
      66.84,
      57.54
    ],
    "foot": [
      65.91,
      67.37
    ]
  },
  "tracker": {
    "sign": [
      83.32,
      52.88
    ],
    "foot": [
      81.53,
      62.74
    ]
  },
  "interactive": {
    "sign": [
      50.0,
      30.42
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
    "x": 74.271,
    "y": 11.389,
    "w": 6.823,
    "h": 22.315,
    "frames": 12
  },
  "assignments": {
    "x": 63.49,
    "y": 54.259,
    "w": 8.438,
    "h": 16.481,
    "frames": 12
  },
  "flashcards": {
    "x": 13.49,
    "y": 51.852,
    "w": 8.542,
    "h": 12.963,
    "frames": 12
  },
  "formation": {
    "x": 45.521,
    "y": 46.852,
    "w": 10.156,
    "h": 24.352,
    "frames": 12
  },
  "guided": {
    "x": 54.427,
    "y": 3.241,
    "w": 11.094,
    "h": 31.019,
    "frames": 12
  },
  "interactive": {
    "x": 44.792,
    "y": 25.926,
    "w": 10.417,
    "h": 20.741,
    "frames": 12
  },
  "phonics": {
    "x": 8.281,
    "y": 32.13,
    "w": 8.958,
    "h": 13.704,
    "frames": 12
  },
  "soundout": {
    "x": 25.938,
    "y": 30.926,
    "w": 7.656,
    "h": 14.259,
    "frames": 12
  },
  "spelling": {
    "x": 29.844,
    "y": 57.87,
    "w": 7.917,
    "h": 10.926,
    "frames": 12
  },
  "stories": {
    "x": 33.229,
    "y": 10.0,
    "w": 15.156,
    "h": 20.833,
    "frames": 12
  },
  "storyplay": {
    "x": 64.792,
    "y": 29.259,
    "w": 9.583,
    "h": 20.833,
    "frames": 12
  },
  "threed": {
    "x": 84.583,
    "y": 28.981,
    "w": 8.125,
    "h": 20.185,
    "frames": 12
  },
  "tracker": {
    "x": 77.604,
    "y": 46.019,
    "w": 10.26,
    "h": 22.037,
    "frames": 12
  },
  "tricky": {
    "x": 18.385,
    "y": 12.407,
    "w": 7.083,
    "h": 21.019,
    "frames": 12
  }
};
