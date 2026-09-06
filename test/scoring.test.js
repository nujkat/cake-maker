// 채점 순수 함수들의 동작을 고정하는 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreIngredients } from '../src/scoring.js';

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
