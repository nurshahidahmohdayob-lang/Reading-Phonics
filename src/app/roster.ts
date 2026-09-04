/* Class roster for the Reading Assessment tracker — Year 1 to Year 6.

   Names come from the Cambridge Students 2026/2027 name list. Edit the arrays
   below to add, remove, or correct a child; the tracker and the assessment
   name picker read straight from here.

   `pending: true` marks a child who has not registered yet (a future intake in
   the name list). They start LOCKED in the Class Tracker so nobody assesses
   them by mistake — unlock them there once they actually join. Teachers can
   also add students and lock/unlock anyone from the tracker itself; those
   changes are saved per device (see lib/rosterStore.ts). */

export type Student = {
  name: string;
  /** Not registered yet — starts locked in the tracker. */
  pending?: boolean;
};

export type ClassGroup = {
  /** Display label, e.g. "Year 1". */
  year: string;
  /** Short key used in stored records, e.g. "y1". */
  key: string;
  students: Student[];
};

export const ROSTER: ClassGroup[] = [
  {
    year: "Year 1",
    key: "y1",
    students: [
      { name: "Aloysius Cheng" },
      { name: "Asher Ng" },
      { name: "Austyn Liew Ze Yu" },
      { name: "Bella Tan Ning Er", pending: true },
      { name: "Chin Isabelle Ler Han", pending: true },
      { name: "Emma Kuan Yu En", pending: true },
      { name: "Grayson Low" },
      { name: "Grayson Ng Kai Shern", pending: true },
      { name: "Ho Zi CC Astrid" },
      { name: "Jayler Hong Jie Le", pending: true },
      { name: "Law Chen Yi" },
      { name: "Lucas Ling Sheng Jie" },
      { name: "Marco Chia Guan Fu" },
      { name: "Park Ji Hoon" },
      { name: "Wong Kai Cheng", pending: true },
      { name: "Yap Kyree" },
      { name: "Yap Yu Qian" },
      { name: "Lucas Tiu Ee Wee", pending: true },
      { name: "Luvish Rao Chandrasegar" },
      { name: "Chang Yiqian (Ethan)" },
    ],
  },
  {
    year: "Year 2",
    key: "y2",
    students: [
      { name: "Ethan Kuan Yu Xuan" },
      { name: "Kingsley Tan" },
      { name: "Jefferson Ang Zhen Xi" },
      { name: "Sora Kiew" },
      { name: "Wu Yee Tang (Sammi)" },
      { name: "Chiah Chen Fong (Ethan)" },
      { name: "Che Kang You" },
      { name: "Tan Jing Yan (Yan Yan)" },
      { name: "Zhao Yile" },
      { name: "Kouga Kuroki" },
      { name: "Avery Boon", pending: true },
      { name: "Alucard Chek", pending: true },
    ],
  },
  {
    year: "Year 3",
    key: "y3",
    students: [
      { name: "Alysa Sanjana" },
      { name: "Hannah Ng Yu Ting" },
      { name: "Neo Gao Ze" },
      { name: "Tiffany Michael Abdelmeseh Farag" },
      { name: "Christopher James Bruyns Fernandez (CJ)" },
      { name: "Sean Ng Chen Feng" },
      { name: "Sarah Evangeline A/P Edward Gregory" },
      { name: "Berenice Tan Jia En" },
      { name: "Cheng Wen Xuan" },
      { name: "Chua Yun Xin" },
      { name: "Lim Jun Xuan" },
      { name: "Lau Ze Yang" },
      { name: "Lee En Chee" },
      { name: "Peter John Pizon" },
      { name: "Muhammad Alif", pending: true },
    ],
  },
  {
    year: "Year 4",
    key: "y4",
    students: [
      { name: "Asher Santosh A/L Ananthan" },
      { name: "Oscar Yup Zi Hao" },
      { name: "Lucian Cristopher Tay" },
      { name: "Ervina Isabelle Selvanesan" },
      { name: "Liu Xinan" },
      { name: "Tan Chia Xin (Jia Xin)" },
      { name: "Kho Chen Xi" },
      { name: "Mia Chua" },
    ],
  },
  {
    year: "Year 5",
    key: "y5",
    students: [
      { name: "Donovan Goh Yan Chong" },
      { name: "Vanessa Ng Yu Xuan" },
      { name: "Harper Destiny Lucius" },
      { name: "Johansson Zhen Yu Ang" },
      { name: "Lucas Choo Jia Le" },
      { name: "Chong Xuan Yu (Shawn)" },
      { name: "Georgina Lee Zi Yue" },
      { name: "Dominic Carl Tan Jun Shen" },
      { name: "Yao Tang (Tang Yao)", pending: true },
      { name: "Kang Ruo Hann (Ella)", pending: true },
    ],
  },
  {
    year: "Year 6",
    key: "y6",
    students: [
      { name: "Bunny Ng Yu Shan" },
      { name: "Chok Jie Yeo (Adrian)" },
      { name: "Hadif Hefny Bin Hasnor Hakim" },
      { name: "Nattania Rao A/P Jaganmohan" },
      { name: "Neo Gao Jun" },
      { name: "Neo Jing Er" },
      { name: "Nicholas Lim Zhi Yun" },
      { name: "Stevan Abilash A/L Ananthan" },
      { name: "Anston Ho Zi Xue" },
      { name: "Sia Yee Chen (Justin)" },
      { name: "Leong Yu Jie (Menicssa)" },
      { name: "Ng Guo Jun" },
      { name: "Yang Fuyu (Dorcas)" },
      { name: "Do Nhu Huyen" },
      { name: "Le Minh Thong (Jake)" },
      { name: "Kim Dongwoo (Rovin)" },
    ],
  },
];

/** All students, flattened, each tagged with their class — handy for name search. */
export const ALL_STUDENTS: {
  name: string;
  year: string;
  yearKey: string;
  pending: boolean;
}[] = ROSTER.flatMap((g) =>
  g.students.map((s) => ({
    name: s.name,
    year: g.year,
    yearKey: g.key,
    pending: !!s.pending,
  })),
);

/** Stable per-student key for stored records (year + normalised name). */
export function studentKey(yearKey: string, name: string): string {
  return `${yearKey}:${name.toLowerCase().replace(/\s+/g, " ").trim()}`;
}
