// Made by scripts/home-house.py from the Blender render (blender/home_house.py). Don't edit by hand.

export const HOUSE_SIZE = { w: 2400, h: 1350 };

/** The picture, with its version so browsers fetch a new render. */
export const HOUSE_IMAGE = "/images/home-house.webp?v=887796966b";

/** The grass colour, to fill the screen round the picture. */
export const HOUSE_LAWN = "#4b8c34";

/** Where each room is on the picture, in % across and down: its sign
    goes at `sign`, and `foot` is the middle of its floor. */
export const HOUSE_SPOTS: Record<string, { sign: [number, number]; foot: [number, number] }> = {
  "stories": {
    "sign": [
      44.6,
      34.26
    ],
    "foot": [
      44.6,
      40.39
    ]
  },
  "guided": {
    "sign": [
      53.44,
      43.94
    ],
    "foot": [
      53.44,
      50.07
    ]
  },
  "tricky": {
    "sign": [
      62.28,
      53.61
    ],
    "foot": [
      62.28,
      59.74
    ]
  },
  "assessment": {
    "sign": [
      71.11,
      63.29
    ],
    "foot": [
      71.11,
      69.42
    ]
  },
  "phonics": {
    "sign": [
      36.74,
      42.86
    ],
    "foot": [
      36.74,
      48.99
    ]
  },
  "soundout": {
    "sign": [
      45.58,
      52.54
    ],
    "foot": [
      45.58,
      58.67
    ]
  },
  "storyplay": {
    "sign": [
      54.42,
      62.21
    ],
    "foot": [
      54.42,
      68.34
    ]
  },
  "threed": {
    "sign": [
      63.26,
      71.89
    ],
    "foot": [
      63.26,
      78.01
    ]
  },
  "flashcards": {
    "sign": [
      28.89,
      51.46
    ],
    "foot": [
      28.89,
      57.59
    ]
  },
  "spelling": {
    "sign": [
      37.72,
      61.14
    ],
    "foot": [
      37.72,
      67.27
    ]
  },
  "formation": {
    "sign": [
      46.56,
      70.81
    ],
    "foot": [
      46.56,
      76.94
    ]
  },
  "assignments": {
    "sign": [
      55.4,
      80.48
    ],
    "foot": [
      55.4,
      86.61
    ]
  },
  "interactive": {
    "sign": [
      77.4,
      72.79
    ],
    "foot": [
      77.4,
      85.05
    ]
  },
  "tracker": {
    "sign": [
      31.44,
      69.56
    ],
    "foot": [
      31.44,
      81.82
    ]
  },
  "hub": {
    "sign": [
      40.87,
      80.26
    ],
    "foot": [
      40.87,
      83.76
    ]
  },
  "fountain": {
    "sign": [
      22.3,
      62.24
    ],
    "foot": [
      22.3,
      63.99
    ]
  }
};
