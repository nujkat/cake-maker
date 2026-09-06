// 해금된 재료 안에서 손님 주문 하나를 만들어 내는 생성기
import { INGREDIENTS, findIngredient } from './data.js';

const PRICE_MARKUP = 2.2; // 재료 원가 대비 손님이 내는 값

// 제한 시간. 주문서를 읽는 시간에 재료마다 담는 시간을 더한다.
// 계량 재료는 슬라이더를 맞춰야 해서 클릭보다 오래 걸린다.
// 플레이해 보고 감으로 맞추는 값이다.
const READ_SECONDS = 6;
const PLAIN_SECONDS = 2;
const MEASURED_SECONDS = 5;

export function orderSeconds(items) {
  return items.reduce(
    (total, item) => total + (typeof item.amount === 'number' ? MEASURED_SECONDS : PLAIN_SECONDS),
    READ_SECONDS
  );
}

function pickOne(pool, rng) {
  return pool[Math.floor(rng() * pool.length)];
}

function pickCount(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

function withAmount(spec, rng) {
  if (!spec.measured) return { id: spec.id };
  const [low, high] = spec.range;
  const steps = Math.floor((high - low) / spec.step);
  return { id: spec.id, amount: low + Math.round(rng() * steps) * spec.step };
}

export function createOrder(unlockedIds, rng = Math.random) {
  const unlocked = INGREDIENTS.filter((it) => unlockedIds.includes(it.id));
  const byType = (type) => unlocked.filter((it) => it.type === type);

  // 해금 3개마다 재료가 하나씩 늘어난다. 난이도는 해금을 따라 올라간다.
  const bonus = Math.max(0, Math.floor((unlocked.length - 5) / 3));
  const maxFillings = Math.min(3, 1 + bonus);
  const maxToppings = Math.min(3, 1 + bonus);

  const items = [];
  const sheets = byType('sheet');
  const fillings = byType('filling');
  const toppings = byType('topping');

  const sheetCount = pickCount(1, Math.min(2, sheets.length), rng);
  for (let i = 0; i < sheetCount; i += 1) items.push(withAmount(pickOne(sheets, rng), rng));

  if (fillings.length > 0) {
    const count = pickCount(1, Math.min(maxFillings, fillings.length), rng);
    for (let i = 0; i < count; i += 1) items.push(withAmount(pickOne(fillings, rng), rng));
  }

  if (toppings.length > 0) {
    const count = pickCount(0, Math.min(maxToppings, toppings.length), rng);
    for (let i = 0; i < count; i += 1) items.push(withAmount(pickOne(toppings, rng), rng));
  }

  const cost = items.reduce((sum, it) => sum + findIngredient(it.id).price, 0);
  const price = Math.round((cost * PRICE_MARKUP) / 10) * 10;
  return { items, price, seconds: orderSeconds(items) };
}
