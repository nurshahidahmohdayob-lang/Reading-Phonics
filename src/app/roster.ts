/* Class roster for the Reading Assessment tracker — Year 1 to Year 6.
   Names come from the Cambridge Students 2026/2027 name list. Edit the arrays
   below to add, remove, or correct a child; the tracker and the assessment
   name picker read straight from here. */

export type ClassGroup = {
  /** Display label, e.g. "Year 1". */
  year: string;
  /** Short key used in stored records, e.g. "y1". */
  key: string;
  students: string[];
};

export const ROSTER: ClassGroup[] = [
  {
    year: "Year 1",
    key: "y1",
    students: [
      "Aloysius Cheng",
      "Asher Ng",
      "Austyn Liew Ze Yu",
      "Bella Tan Ning Er",
      "Chin Isabelle Ler Han",
      "Emma Kuan Yu En",
      "Grayson Low",
      "Grayson Ng Kai Shern",
      "Ho Zi CC Astrid",
      "Jayler Hong Jie Le",
      "Law Chen Yi",
      "Lucas Ling Sheng Jie",
      "Marco Chia Guan Fu",
      "Park Ji Hoon",
      "Wong Kai Cheng",
      "Yap Kyree",
      "Yap Yu Qian",
      "Lucas Tiu Ee Wee",
      "Luvish Rao Chandrasegar",
      "Chang Yiqian (Ethan)",
    ],
  },
  {
    year: "Year 2",
    key: "y2",
    students: [
      "Ethan Kuan Yu Xuan",
      "Kingsley Tan",
      "Jefferson Ang Zhen Xi",
      "Sora Kiew",
      "Wu Yee Tang (Sammi)",
      "Chiah Chen Fong (Ethan)",
      "Che Kang You",
      "Tan Jing Yan (Yan Yan)",
      "Zhao Yile",
      "Kouga Kuroki",
      "Avery Boon",
      "Alucard Chek",
    ],
  },
  {
    year: "Year 3",
    key: "y3",
    students: [
      "Alysa Sanjana",
      "Hannah Ng Yu Ting",
      "Neo Gao Ze",
      "Tiffany Michael Abdelmeseh Farag",
      "Christopher James Bruyns Fernandez (CJ)",
      "Sean Ng Chen Feng",
      "Sarah Evangeline A/P Edward Gregory",
      "Berenice Tan Jia En",
      "Cheng Wen Xuan",
      "Chua Yun Xin",
      "Lim Jun Xuan",
      "Lau Ze Yang",
      "Lee En Chee",
      "Peter John Pizon",
      "Muhammad Alif",
    ],
  },
  {
    year: "Year 4",
    key: "y4",
    students: [
      "Asher Santosh A/L Ananthan",
      "Oscar Yup Zi Hao",
      "Lucian Cristopher Tay",
      "Ervina Isabelle Selvanesan",
      "Liu Xinan",
      "Tan Chia Xin (Jia Xin)",
      "Kho Chen Xi",
      "Mia Chua",
    ],
  },
  {
    year: "Year 5",
    key: "y5",
    students: [
      "Donovan Goh Yan Chong",
      "Vanessa Ng Yu Xuan",
      "Harper Destiny Lucius",
      "Johansson Zhen Yu Ang",
      "Lucas Choo Jia Le",
      "Chong Xuan Yu (Shawn)",
      "Georgina Lee Zi Yue",
      "Dominic Carl Tan Jun Shen",
      "Yao Tang (Tang Yao)",
      "Kang Ruo Hann (Ella)",
    ],
  },
  {
    year: "Year 6",
    key: "y6",
    students: [
      "Bunny Ng Yu Shan",
      "Chok Jie Yeo (Adrian)",
      "Hadif Hefny Bin Hasnor Hakim",
      "Nattania Rao A/P Jaganmohan",
      "Neo Gao Jun",
      "Neo Jing Er",
      "Nicholas Lim Zhi Yun",
      "Stevan Abilash A/L Ananthan",
      "Anston Ho Zi Xue",
      "Sia Yee Chen (Justin)",
      "Leong Yu Jie (Menicssa)",
      "Ng Guo Jun",
      "Yang Fuyu (Dorcas)",
      "Do Nhu Huyen",
      "Le Minh Thong (Jake)",
      "Kim Dongwoo (Rovin)",
    ],
  },
];

/** All students, flattened, each tagged with their class — handy for name search. */
export const ALL_STUDENTS: { name: string; year: string; yearKey: string }[] =
  ROSTER.flatMap((g) =>
    g.students.map((name) => ({ name, year: g.year, yearKey: g.key })),
  );

/** Stable per-student key for stored records (year + normalised name). */
export function studentKey(yearKey: string, name: string): string {
  return `${yearKey}:${name.toLowerCase().replace(/\s+/g, " ").trim()}`;
}
