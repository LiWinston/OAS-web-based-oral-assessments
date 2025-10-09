// Lightweight query preprocessing, tokenization, and scoring helpers

export function preprocessQuery(q) {
  if (!q) return '';
  return String(q)
    .toLowerCase()
    // insert spaces between letters and numbers both ways
    .replace(/([a-z])([0-9])/gi, '$1 $2')
    .replace(/([0-9])([a-z])/gi, '$1 $2')
    // collapse non-alphanumerics to spaces
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim();
}

export function tokenize(q) {
  const pre = preprocessQuery(q);
  if (!pre) return [];
  return pre.split(/\s+/).filter(Boolean);
}

// Basic scoring: coverage + boosts for course code like tokens and type keywords
export function scoreItem(tokens, item) {
  if (!tokens?.length || !item) return 0;
  const text = [item.title, item.subtitle, item.keywords]
    .filter(Boolean)
    .join(' ') 
    .toLowerCase();
  const normalized = text.replace(/[^a-z0-9]/g, '');

  let coverage = 0;
  let typeBoost = 0;
  let typeDirect = 0;
  let codeBoost = 0;

  for (const tk of tokens) {
    if (!tk) continue;
    if (text.includes(tk)) coverage += 1;
  }

  // Course code like token: 4 letters + 5 digits (e.g., swen90017)
  const codeToken = tokens.find((t) => /^[a-z]{4}[0-9]{5}$/i.test(t));
  if (codeToken && normalized.includes(codeToken.toLowerCase())) {
    codeBoost += 2;
  }

  // Type keyword boosts
  const hasResourceQuery = tokens.some((t) => /^(resource|resources|资料|材料)$/i.test(t));
  if (hasResourceQuery && /(resource|resources|资料|材料)/i.test(text)) {
    typeBoost += 2;
  }

  const hasResultQuery = tokens.some((t) => /^(result|results|成绩|分数|mark|marks)$/i.test(t));
  if (hasResultQuery && /(result|results|成绩|分数|mark|marks)/i.test(text)) {
    typeBoost += 1;
  }

  const hasRubricQuery = tokens.some((t) => /^(rubric|criteria|评分标准)$/i.test(t));
  if (hasRubricQuery && /(rubric|criteria|评分标准)/i.test(text)) {
    typeBoost += 1;
  }

  const hasSessionQuery = tokens.some((t) => /^(session|sessions|timeslot|schedule|booking|排期|时段)$/i.test(t));
  if (hasSessionQuery && /(session|sessions|timeslot|schedule|booking|排期|时段)/i.test(text)) {
    typeBoost += 1;
  }

  // Strong direct boost based on item type id/href vs type query
  const idStr = String(item.id || '').toLowerCase();
  const hrefStr = String(item.href || '').toLowerCase();
  const isRubricItem = idStr.includes('assignment-rubric') || hrefStr.includes('/rubric');
  const isResultsItem = idStr.includes('assignment-results') || hrefStr.includes('/results');
  const isScheduleItem = idStr.includes('assignment-schedule') || hrefStr.includes('/timeslots') || hrefStr.includes('/schedule');

  if (hasRubricQuery) {
    if (isRubricItem) typeDirect += 3;
    else typeDirect -= 0.5; // de-prioritize non-rubric items that merely mention rubric
  }
  if (hasResultQuery) {
    if (isResultsItem) typeDirect += 3;
    else typeDirect -= 0.25;
  }
  if (hasSessionQuery) {
    if (isScheduleItem) typeDirect += 3;
    else typeDirect -= 0.25;
  }

  return coverage + typeBoost + typeDirect + codeBoost;
}
