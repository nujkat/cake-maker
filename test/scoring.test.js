// 채점 순수 함수들의 동작을 고정하는 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreIngredients, scoreOrder, scoreAmounts, grade } from '../src/scoring.js';

test('주문과 완전히 같으면 재료 축 만점', () => {
  const order = [{ id: 'choco-sheet' }, { id: 'cherry' }];
  const result = [{ id: 'choco-sheet' }, { id: 'cherry' }];
  assert.equal(scoreIngredients(order, result), 1);
});

test('재료를 하나 빠뜨리면 그만큼 깎인다', () => {
  const order = [{ id: 'choco-sheet' }, { id: 'cherry' }];
  const result = [{ id: 'choco-sheet' }];
  assert.equal(scoreIngredients(order, result), 0.5);
});

test('없는 재료를 더 넣으면 그만큼 깎인다', () => {
  const order = [{ id: 'choco-sheet' }];
  const result = [{ id: 'choco-sheet' }, { id: 'mint' }];
  assert.equal(scoreIngredients(order, result), 0.5);
});

test('같은 재료의 개수까지 본다', () => {
  const order = [{ id: 'cherry' }, { id: 'cherry' }, { id: 'cherry' }];
  const result = [{ id: 'cherry' }, { id: 'cherry' }];
  assert.equal(scoreIngredients(order, result).toFixed(4), (2 / 3).toFixed(4));
});

test('순서만 다르면 재료 축은 깎이지 않는다', () => {
  const order = [{ id: 'choco-sheet' }, { id: 'cherry' }];
  const result = [{ id: 'cherry' }, { id: 'choco-sheet' }];
  assert.equal(scoreIngredients(order, result), 1);
});

test('아무것도 담지 않으면 0점', () => {
  assert.equal(scoreIngredients([{ id: 'cherry' }], []), 0);
});

test('순서까지 같으면 순서 축 만점', () => {
  const order = [{ id: 'sheet' }, { id: 'cream' }, { id: 'cherry' }];
  assert.equal(scoreOrder(order, order), 1);
});

test('완전히 뒤집으면 상대 순서가 하나만 남는다', () => {
  const order = [{ id: 'sheet' }, { id: 'cream' }, { id: 'cherry' }];
  const result = [{ id: 'cherry' }, { id: 'cream' }, { id: 'sheet' }];
  assert.equal(scoreOrder(order, result).toFixed(4), (1 / 3).toFixed(4));
});

test('두 개만 자리를 바꾸면 나머지 상대 순서는 살아 있다', () => {
  const order = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const result = [{ id: 'b' }, { id: 'a' }, { id: 'c' }, { id: 'd' }];
  assert.equal(scoreOrder(order, result), 0.75);
});

test('주문에 없는 재료는 순서 축에서 세지 않는다', () => {
  const order = [{ id: 'a' }, { id: 'b' }];
  const result = [{ id: 'a' }, { id: 'mint' }, { id: 'b' }];
  assert.equal(scoreOrder(order, result), 1);
});

test('빠뜨린 재료 때문에 순서가 이중으로 깎이지 않는다', () => {
  const order = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const result = [{ id: 'a' }, { id: 'c' }];
  assert.equal(scoreOrder(order, result), 1);
});

test('담은 게 하나뿐이면 순서를 따질 수 없으므로 만점', () => {
  assert.equal(scoreOrder([{ id: 'a' }, { id: 'b' }], [{ id: 'a' }]), 1);
});

test('수치가 정확하면 계량 축 만점', () => {
  const order = [{ id: 'sugar', amount: 120 }];
  assert.equal(scoreAmounts(order, [{ id: 'sugar', amount: 120 }]), 1);
});

test('오차 10퍼센트까지는 만점', () => {
  const order = [{ id: 'sugar', amount: 100 }];
  assert.equal(scoreAmounts(order, [{ id: 'sugar', amount: 110 }]), 1);
});

test('오차 50퍼센트를 넘으면 0점', () => {
  const order = [{ id: 'sugar', amount: 100 }];
  assert.equal(scoreAmounts(order, [{ id: 'sugar', amount: 160 }]), 0);
});

test('오차 30퍼센트는 중간 점수', () => {
  const order = [{ id: 'sugar', amount: 100 }];
  assert.equal(scoreAmounts(order, [{ id: 'sugar', amount: 130 }]), 0.5);
});

test('계량 재료가 여럿이면 평균을 낸다', () => {
  const order = [{ id: 'sugar', amount: 100 }, { id: 'butter', amount: 100 }];
  const result = [{ id: 'sugar', amount: 100 }, { id: 'butter', amount: 160 }];
  assert.equal(scoreAmounts(order, result), 0.5);
});

test('계량 재료가 없는 주문은 계량 축이 존재하지 않는다', () => {
  assert.equal(scoreAmounts([{ id: 'cherry' }], [{ id: 'cherry' }]), null);
});

test('계량 재료를 아예 담지 않았으면 계량 축이 존재하지 않는다', () => {
  assert.equal(scoreAmounts([{ id: 'sugar', amount: 100 }], []), null);
});

test('완벽하면 별 3개와 정가 전액', () => {
  const order = [{ id: 'sheet' }, { id: 'sugar', amount: 100 }, { id: 'cherry' }];
  const got = grade(order, order, 600);
  assert.equal(got.total, 100);
  assert.equal(got.stars, 3);
  assert.equal(got.payout, 600);
  assert.equal(got.weakest, null);
});

test('계량 재료가 없는 주문도 완벽하면 별 3개', () => {
  const order = [{ id: 'sheet' }, { id: 'cherry' }];
  const got = grade(order, order, 600);
  assert.equal(got.axes.amount, null);
  assert.equal(got.total, 100);
  assert.equal(got.stars, 3);
});

test('전부 틀리면 별 0개와 0원', () => {
  const order = [{ id: 'sheet' }, { id: 'cherry' }];
  const result = [{ id: 'mint' }, { id: 'butter' }];
  const got = grade(order, result, 600);
  assert.equal(got.stars, 0);
  assert.equal(got.payout, 0);
});

test('별 2개는 정가의 3분의 2', () => {
  // 재료 축만 살짝 깎아 70~89점 구간을 만든다
  const order = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
  const result = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const got = grade(order, result, 900);
  assert.equal(got.stars, 2);
  assert.equal(got.payout, 600);
});

test('가장 많이 깎인 축을 짚어 준다', () => {
  const order = [{ id: 'sheet' }, { id: 'sugar', amount: 100 }];
  const result = [{ id: 'sheet' }, { id: 'sugar', amount: 200 }];
  assert.equal(grade(order, result, 600).weakest, 'amount');
});
