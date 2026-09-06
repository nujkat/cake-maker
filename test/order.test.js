// 주문 생성이 해금 범위와 난이도 규칙을 지키는지 확인하는 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrder, orderSeconds } from '../src/order.js';
import { STARTING_UNLOCKED, findIngredient } from '../src/data.js';

// 정해진 값을 돌아가며 내놓는 고정 난수
function fixedRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

test('해금하지 않은 재료는 절대 주문에 나오지 않는다', () => {
  for (let i = 0; i < 200; i += 1) {
    const order = createOrder(STARTING_UNLOCKED);
    for (const item of order.items) {
      assert.ok(STARTING_UNLOCKED.includes(item.id), `${item.id} 는 해금되지 않았다`);
    }
  }
});

test('시트가 최소 하나는 들어간다', () => {
  for (let i = 0; i < 200; i += 1) {
    const order = createOrder(STARTING_UNLOCKED);
    const sheets = order.items.filter((it) => findIngredient(it.id).type === 'sheet');
    assert.ok(sheets.length >= 1);
  }
});

test('계량 재료에는 수치가 붙고 범위 안에 있다', () => {
  for (let i = 0; i < 200; i += 1) {
    const order = createOrder(STARTING_UNLOCKED);
    for (const item of order.items) {
      const spec = findIngredient(item.id);
      if (!spec.measured) {
        assert.equal(item.amount, undefined);
        continue;
      }
      assert.equal(typeof item.amount, 'number');
      assert.ok(item.amount >= spec.range[0] && item.amount <= spec.range[1]);
    }
  }
});

test('정가는 재료 원가보다 크다', () => {
  const order = createOrder(STARTING_UNLOCKED, fixedRng([0.5]));
  const cost = order.items.reduce((sum, it) => sum + findIngredient(it.id).price, 0);
  assert.ok(order.price > cost);
});

test('같은 난수를 주면 같은 주문이 나온다', () => {
  const a = createOrder(STARTING_UNLOCKED, fixedRng([0.1, 0.6, 0.3, 0.8]));
  const b = createOrder(STARTING_UNLOCKED, fixedRng([0.1, 0.6, 0.3, 0.8]));
  assert.deepEqual(a, b);
});

test('해금이 늘면 주문이 길어질 수 있다', () => {
  const all = ['vanilla-sheet', 'choco-sheet', 'strawberry-cream', 'sugar', 'cherry',
    'blueberry', 'matcha-cream', 'mint', 'choco-cream', 'butter', 'red-velvet-sheet', 'gold-leaf'];
  const longest = (ids) => Math.max(...Array.from({ length: 300 }, () => createOrder(ids).items.length));
  const before = longest(STARTING_UNLOCKED);
  const after = longest(all);
  assert.ok(after > before, `해금 전 최대 ${before}, 해금 후 최대 ${after}`);
});

test('빈 주문에도 최소 시간은 남는다', () => {
  assert.ok(orderSeconds([]) > 0);
});

test('재료가 늘면 제한 시간이 늘어난다', () => {
  const one = orderSeconds([{ id: 'cherry' }]);
  const two = orderSeconds([{ id: 'cherry' }, { id: 'cherry' }]);
  assert.ok(two > one);
});

test('계량 재료는 일반 재료보다 시간을 더 받는다', () => {
  const plain = orderSeconds([{ id: 'cherry' }]);
  const measured = orderSeconds([{ id: 'sugar', amount: 100 }]);
  assert.ok(measured > plain, `계량 ${measured}초, 일반 ${plain}초`);
});

test('제한 시간은 정수 초다', () => {
  assert.equal(orderSeconds([{ id: 'sugar', amount: 100 }, { id: 'cherry' }]) % 1, 0);
});

test('주문에 제한 시간이 붙어 있다', () => {
  for (let i = 0; i < 200; i += 1) {
    const order = createOrder(STARTING_UNLOCKED);
    assert.equal(order.seconds, orderSeconds(order.items));
    assert.ok(order.seconds >= 10, `${order.items.length}개 주문에 ${order.seconds}초는 너무 짧다`);
  }
});
