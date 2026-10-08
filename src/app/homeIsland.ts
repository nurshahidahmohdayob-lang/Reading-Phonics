// Made by scripts/home-island.py from the Blender render (blender/home_island.py). Don't edit by hand.

/** Where each landmark is on the island picture, in % across and down. */
export const ISLAND_SIZE = { w: 1920, h: 1080 };

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
      40.48,
      19.16
    ],
    "foot": [
      40.91,
      28.87
    ]
  },
  "guided": {
    "sign": [
      59.52,
      19.16
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
