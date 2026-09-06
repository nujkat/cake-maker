// 채점 순수 함수들의 동작을 고정하는 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreIngredients, scoreOrder } from '../src/scoring.js';

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
