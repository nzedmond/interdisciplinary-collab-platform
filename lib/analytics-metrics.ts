// Ranking metrics for evaluating recommendations against what people actually did.
//
// For one applicant, every candidate project gets a score from a method (semantic,
// keyword, or hybrid). If the project they applied to ranks near the top, the method
// "predicted" their choice well. Ties count as half above / half below, so a method
// that gives many projects the same score (common for keyword matching: lots of 0s)
// is neither rewarded nor punished for the tie.

// 1-based rank of scores[index] among all scores; ties share the average position.
export function averageRank(scores: number[], index: number) {
  const target = scores[index];
  let higher = 0;
  let tied = 0;

  scores.forEach((score, position) => {
    if (position === index) return;
    if (score > target) higher += 1;
    else if (score === target) tied += 1;
  });

  return 1 + higher + tied / 2;
}

// Share of other candidates that scores[index] beats (1 = ranked first, 0 = last,
// 0.5 = what random ordering gives on average). Null when there is nothing to compare.
export function percentileRank(scores: number[], index: number) {
  if (scores.length < 2) {
    return null;
  }

  const target = scores[index];
  let lower = 0;
  let tied = 0;

  scores.forEach((score, position) => {
    if (position === index) return;
    if (score < target) lower += 1;
    else if (score === target) tied += 1;
  });

  return (lower + tied / 2) / (scores.length - 1);
}

export type RankObservation = { percentile: number; rank: number };

export function summarizeRanks(observations: RankObservation[]) {
  const count = observations.length;

  if (count === 0) {
    return { count, meanPercentile: null, hitAt1: null, hitAt3: null };
  }

  const mean = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;

  return {
    count,
    meanPercentile: mean(observations.map((observation) => observation.percentile)),
    hitAt1: mean(observations.map((observation) => (observation.rank <= 1 ? 1 : 0))),
    hitAt3: mean(observations.map((observation) => (observation.rank <= 3 ? 1 : 0)))
  };
}

// Applicant and project are in different departments: the applicant's department
// isn't one of the project's. Null when the applicant's department is unknown.
export function isCrossDepartment(applicantDepartment: string | null | undefined, projectDepartments: string[]) {
  if (!applicantDepartment) {
    return null;
  }

  const normalized = applicantDepartment.trim().toLowerCase();
  return !projectDepartments.some((department) => department.trim().toLowerCase() === normalized);
}
