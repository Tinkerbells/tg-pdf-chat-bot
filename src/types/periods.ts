const PeriodsState = {
  one: "ONE_MONTH",
  three: "THREE_MONTNS",
  six: "SIX_MONTNS",
  year: "ONE_YEAR",
} as const;

export type PeroidType = (typeof PeriodsState)[keyof typeof PeriodsState];
