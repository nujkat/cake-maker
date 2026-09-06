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
