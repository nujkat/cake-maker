// 주문과 결과물을 비교해 별점과 금액을 계산하는 순수 함수 모음
export const WEIGHTS = { ingredients: 0.6, order: 0.15, amount: 0.25 };
export const STAR_THRESHOLDS = [90, 70, 45];
export const AMOUNT_TOLERANCE = 0.1;
export const AMOUNT_LIMIT = 0.5;

function countById(items) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  }
  return counts;
}

export function scoreIngredients(order, result) {
  if (order.length === 0 && result.length === 0) return 1;
  const wanted = countById(order);
  const made = countById(result);
  let matched = 0;
  for (const [id, n] of wanted) {
    matched += Math.min(n, made.get(id) ?? 0);
  }
  return matched / Math.max(order.length, result.length);
}

// 가장 긴 증가 부분수열의 길이. 입력이 짧아 O(n^2) 로 충분하다.
function longestIncreasingLength(seq) {
  const best = seq.map(() => 1);
  for (let i = 1; i < seq.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (seq[j] < seq[i] && best[j] + 1 > best[i]) {
        best[i] = best[j] + 1;
      }
    }
  }
  return Math.max(0, ...best);
}

export function scoreOrder(order, result) {
  const taken = order.map(() => false);
  const positions = [];
  for (const item of result) {
    const index = order.findIndex((wanted, i) => !taken[i] && wanted.id === item.id);
    if (index === -1) continue; // 주문에 없는 재료는 재료 축에서 벌한다
    taken[index] = true;
    positions.push(index);
  }
  if (positions.length <= 1) return 1;
  return longestIncreasingLength(positions) / positions.length;
}

function errorToScore(errorRatio) {
  if (errorRatio <= AMOUNT_TOLERANCE) return 1;
  if (errorRatio >= AMOUNT_LIMIT) return 0;
  return (AMOUNT_LIMIT - errorRatio) / (AMOUNT_LIMIT - AMOUNT_TOLERANCE);
}

export function scoreAmounts(order, result) {
  const taken = result.map(() => false);
  let sum = 0;
  let counted = 0;
  for (const wanted of order) {
    if (typeof wanted.amount !== 'number') continue;
    const index = result.findIndex(
      (made, i) => !taken[i] && made.id === wanted.id && typeof made.amount === 'number'
    );
    if (index === -1) continue; // 안 담은 것은 재료 축에서 벌한다
    taken[index] = true;
    sum += errorToScore(Math.abs(result[index].amount - wanted.amount) / wanted.amount);
    counted += 1;
  }
  return counted === 0 ? null : sum / counted;
}
