// Made by scripts/forest.py from the Blender render (blender/forest.py). Don't edit by hand.

export const FOREST_SIZE = { w: 2048, h: 1152 };

/** The depth layers, back to front; each has holes where nearer ones cover it. */
export const FOREST_LAYERS = {
  "back": "/images/forest/back.webp?v=ac604815b0",
  "mid": "/images/forest/mid.webp?v=278a62bdfe",
  "crowns": "/images/forest/crowns.webp?v=dd79adec9d",
  "front": "/images/forest/front.webp?v=8e4dde749f",
  "sails": "/images/forest/sails.webp?v=662734bbdd"
};

/** The colour along the bottom of the picture, to fill round it. */
export const FOREST_GROUND = "#68a53d";

/** Where the windmill's sails turn round, in % across and down the picture. */
export const FOREST_HUB: [number, number] = [30.12, 40.59];

/** Where some of the fairy lights hang, in % across and down. */
export const FOREST_BULBS: [number, number][] = [[27.4, 3.79], [33.64, 6.84], [39.83, 9.11], [45.98, 10.62], [52.11, 11.37], [58.23, 11.37], [64.37, 10.62], [70.53, 9.11], [76.75, 6.84], [83.02, 3.79], [37.42, 5.94], [42.22, 8.33], [47.0, 10.03], [51.76, 11.05], [56.51, 11.38], [61.27, 11.05], [66.04, 10.03], [70.84, 8.33], [75.68, 5.94], [24.96, 7.21], [27.42, 9.15], [29.86, 10.61], [32.28, 11.57], [34.69, 12.06], [37.09, 12.06], [39.48, 11.57], [41.87, 10.61], [44.26, 9.15], [46.66, 7.21]];
