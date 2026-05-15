// ─── Number words ─────────────────────────────────────────────────────────────
// To extend: add entries here. Games pick up the new range automatically.

export type NumberItem = {
  numeral: number;
  albanian: string;
  english: string;
};

export const NUMBERS: NumberItem[] = [
  { numeral: 1,  albanian: 'një',              english: 'one'       },
  { numeral: 2,  albanian: 'dy',               english: 'two'       },
  { numeral: 3,  albanian: 'tre',              english: 'three'     },
  { numeral: 4,  albanian: 'katër',            english: 'four'      },
  { numeral: 5,  albanian: 'pesë',             english: 'five'      },
  { numeral: 6,  albanian: 'gjashtë',          english: 'six'       },
  { numeral: 7,  albanian: 'shtatë',           english: 'seven'     },
  { numeral: 8,  albanian: 'tetë',             english: 'eight'     },
  { numeral: 9,  albanian: 'nëntë',            english: 'nine'      },
  { numeral: 10, albanian: 'dhjetë',           english: 'ten'       },
  { numeral: 11, albanian: 'njëmbëdhjetë',     english: 'eleven'    },
  { numeral: 12, albanian: 'dymbëdhjetë',      english: 'twelve'    },
  { numeral: 13, albanian: 'trembëdhjetë',     english: 'thirteen'  },
  { numeral: 14, albanian: 'katërmbëdhjetë',   english: 'fourteen'  },
  { numeral: 15, albanian: 'pesëmbëdhjetë',    english: 'fifteen'   },
  { numeral: 16, albanian: 'gjashtëmbëdhjetë', english: 'sixteen'   },
  { numeral: 17, albanian: 'shtatëmbëdhjetë',  english: 'seventeen' },
  { numeral: 18, albanian: 'tetëmbëdhjetë',    english: 'eighteen'  },
  { numeral: 19, albanian: 'nëntëmbëdhjetë',   english: 'nineteen'  },
  { numeral: 20, albanian: 'njëzet',           english: 'twenty'    },
];

export function getNumber(n: number): NumberItem | undefined {
  return NUMBERS.find(item => item.numeral === n);
}

// ─── Math difficulty ───────────────────────────────────────────────────────────
// Edit values here — no game code changes needed.

export const MATH_CONFIG = {
  // Count & Match (ages 3–6)
  countMin: 1,
  countMax: 10,

  // Math Challenge (ages 7+)
  addMax: 10,       // max value for each addend  (answers up to addMax*2)
  subMax: 15,       // max minuend for subtraction
  maxAnswer: 20,    // hard ceiling on any answer
  addWeight: 0.6,   // probability of an addition problem (vs subtraction)
};

// ─── Problem types ─────────────────────────────────────────────────────────────

export type MathProblem = {
  a: number;
  b: number;
  op: '+' | '-';
  answer: number;
};

export function generateProblem(): MathProblem {
  const useAdd = Math.random() < MATH_CONFIG.addWeight;
  if (useAdd) {
    const a = Math.ceil(Math.random() * MATH_CONFIG.addMax);
    const b = Math.ceil(Math.random() * MATH_CONFIG.addMax);
    const raw = a + b;
    if (raw > MATH_CONFIG.maxAnswer) {
      const b2 = MATH_CONFIG.maxAnswer - a;
      return { a, b: b2, op: '+', answer: a + b2 };
    }
    return { a, b, op: '+', answer: raw };
  } else {
    const a = Math.floor(Math.random() * (MATH_CONFIG.subMax - 1)) + 2;
    const b = Math.ceil(Math.random() * (a - 1));
    return { a, b, op: '-', answer: a - b };
  }
}

export function generateProblems(count: number): MathProblem[] {
  return Array.from({ length: count }, generateProblem);
}

export function getWrongAnswers(answer: number, needed = 3): number[] {
  const result = new Set<number>();
  let attempts = 0;
  while (result.size < needed && attempts < 200) {
    attempts++;
    const offset = Math.ceil(Math.random() * 4);
    const sign = Math.random() > 0.5 ? 1 : -1;
    const candidate = answer + sign * offset;
    if (candidate >= 1 && candidate <= MATH_CONFIG.maxAnswer && candidate !== answer) {
      result.add(candidate);
    }
  }
  return Array.from(result);
}
