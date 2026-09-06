# 케익 만들기 게임 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 손님의 주문서대로 케익을 만들어 정확도에 따라 별 0~3개와 돈을 받고, 그 돈으로 새 재료를 해금하는 브라우저 게임을 만든다.

**Architecture:** 빌드 도구 없는 순수 웹. `<script type="module">`로 파일을 나누고 의존성은 0개다. 채점 로직(`src/scoring.js`)은 DOM도 게임 상태도 모르는 순수 함수 모음이며 유일한 자동 테스트 대상이다. 나머지 모듈은 채점 결과와 게임 상태를 화면에 옮기는 얇은 층이다.

**Tech Stack:** HTML / CSS / 순수 JavaScript (ES modules), SVG 인라인 렌더링, Node 내장 테스트 러너(`node --test`), `localStorage`

**Spec:** `docs/superpowers/specs/2026-09-06-cake-maker-design.md`

## Global Constraints

- **런타임 의존성 0개.** `package.json`의 `dependencies`와 `devDependencies`는 비어 있어야 한다. npm 패키지를 추가하지 않는다.
- **`package.json`에 `"type": "module"`** 을 반드시 넣는다. 없으면 `node --test`가 `import` 구문에서 실패한다.
- **Node 18 이상** 필요 (`node --test` 내장 러너). 개발 환경은 Node v24.14.1로 확인됨.
- **모든 소스 파일 첫 줄은 역할을 한 줄로 적은 한국어 주석.** 예: `// 주문과 결과물을 비교해 별점과 금액을 계산하는 순수 함수 모음`. `package.json` 같은 설정 파일은 제외.
- **채점 상수는 `src/scoring.js` 상단에 모아 export 한다.** 가중치 재료 0.60 / 순서 0.15 / 계량 0.25, 별점 구간 90·70·45점, 계량 오차 허용 10% / 한계 50%. 다른 파일에 이 숫자를 복사하지 않는다.
- **UI 텍스트는 한국어.** 문장은 마침표로 끝내고 콜론으로 끝내지 않는다.
- **로컬 실행은 `python -m http.server 8000` 후 `http://localhost:8000`.** ES 모듈이라 `file://`로는 열리지 않는다. README에 이 한 줄을 적는다.

---

### Task 1: 프로젝트 뼈대 + 재료 축 채점

이 태스크는 저장소 구조를 세우고 채점 3축 중 첫 번째를 TDD로 만든다. 설정 파일은 첫 채점 함수가 돌아가는 데 필요하므로 같은 태스크에 묶는다.

**Files:**
- Create: `package.json`
- Create: `README.md`
- Create: `checklist.md`
- Create: `context-notes.md`
- Create: `src/scoring.js`
- Test: `test/scoring.test.js`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  - `WEIGHTS: { ingredients: number, order: number, amount: number }`
  - `STAR_THRESHOLDS: [number, number, number]`
  - `AMOUNT_TOLERANCE: number`, `AMOUNT_LIMIT: number`
  - `scoreIngredients(order: Item[], result: Item[]): number` — 0~1
  - `Item` 은 `{ id: string, amount?: number }` 모양의 평범한 객체다. 주문서와 플레이어 결과물 모두 `Item[]` 이며 배열 순서가 곧 담은 순서다.

- [ ] **Step 1: `package.json` 작성**

```json
{
  "name": "cake-maker",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test test/",
    "start": "python -m http.server 8000"
  }
}
```

`"type": "module"` 이 빠지면 다음 단계의 테스트가 `import` 에서 바로 깨진다.

- [ ] **Step 2: `README.md` 작성**

```markdown
# 케익 만들기 게임

주문서대로 케익을 만들어 별점과 돈을 받고, 그 돈으로 새 재료를 해금하는 브라우저 게임.

## 실행

ES 모듈을 쓰기 때문에 `file://` 로는 열리지 않는다. 로컬 서버가 필요하다.

    python -m http.server 8000

브라우저에서 http://localhost:8000 을 연다.

## 테스트

    npm test

## 문서

- 설계 `docs/superpowers/specs/2026-09-06-cake-maker-design.md`
- 구현 계획 `docs/superpowers/plans/2026-09-06-cake-maker.md`
- 진행 상황 `checklist.md`
- 결정 기록 `context-notes.md`
```

- [ ] **Step 3: `checklist.md` 와 `context-notes.md` 초기화**

`checklist.md` 는 이 계획의 태스크 9개를 체크박스로 옮겨 적는다.

```markdown
# 진행 상황

- [ ] Task 1 프로젝트 뼈대 + 재료 축 채점
- [ ] Task 2 순서 축 채점
- [ ] Task 3 계량 축 채점
- [ ] Task 4 총점·별점·금액 산출
- [ ] Task 5 재료 카탈로그 + 주문 생성
- [ ] Task 6 케익 SVG 렌더링
- [ ] Task 7 화면 뼈대 + 코어 루프
- [ ] Task 8 결과 화면
- [ ] Task 9 해금 + 저장
```

`context-notes.md` 는 헤더와 첫 결정만 두고 시작한다. 이후 태스크에서 판단이 갈린 지점을 계속 덧붙인다.

```markdown
# 결정 기록

작업 중 갈림길에서 무엇을 왜 골랐는지 적는다. 코드를 읽어서 알 수 있는 것은 적지 않는다.

## 2026-09-06 채점을 순수 함수로 분리

`src/scoring.js` 는 DOM 도 게임 상태도 모른다. 이 게임의 재미가 전부 채점에 걸려 있어
자동 테스트로 지킬 대상이 여기뿐이기 때문이다. 화면과 얽히면 테스트가 불가능해진다.
```

- [ ] **Step 4: 실패하는 테스트 작성**

`test/scoring.test.js` 를 만든다.

```js
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
```

네 번째 테스트가 다중집합 비교를 강제한다. 집합으로 구현하면 체리 2개만 담아도 만점이 나와 여기서 걸린다.

- [ ] **Step 5: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../src/scoring.js'`

- [ ] **Step 6: 최소 구현**

`src/scoring.js` 를 만든다.

```js
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
```

분모가 `max(주문 개수, 결과 개수)` 라서 빠뜨림과 잘못 넣음이 한 식으로 함께 감점된다.

- [ ] **Step 7: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 6 tests

- [ ] **Step 8: 커밋**

```bash
git add package.json README.md checklist.md context-notes.md src/scoring.js test/scoring.test.js
git commit -m "feat: 프로젝트 뼈대와 재료 축 채점 추가"
```

---

### Task 2: 순서 축 채점

**Files:**
- Modify: `src/scoring.js`
- Test: `test/scoring.test.js`

**Interfaces:**
- Consumes: Task 1의 `Item` 모양
- Produces: `scoreOrder(order: Item[], result: Item[]): number` — 0~1

- [ ] **Step 1: 실패하는 테스트 추가**

`test/scoring.test.js` 상단 import 를 `import { scoreIngredients, scoreOrder } from '../src/scoring.js';` 로 바꾸고 아래를 파일 끝에 붙인다.

```js
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
```

마지막 두 테스트가 설계 문서의 "이중 감점 금지" 결정을 코드로 고정한다. 빠뜨린 재료는 재료 축에서 이미 벌을 받았으므로 순서 축에서 또 깎지 않는다.

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `scoreOrder is not a function`

- [ ] **Step 3: 최소 구현**

`src/scoring.js` 의 `scoreIngredients` 아래에 붙인다.

```js
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 12 tests

- [ ] **Step 5: 커밋**

```bash
git add src/scoring.js test/scoring.test.js
git commit -m "feat: 상대 순서 기반 순서 축 채점 추가"
```

---

### Task 3: 계량 축 채점

**Files:**
- Modify: `src/scoring.js`
- Test: `test/scoring.test.js`

**Interfaces:**
- Consumes: Task 1의 `AMOUNT_TOLERANCE`, `AMOUNT_LIMIT`
- Produces: `scoreAmounts(order: Item[], result: Item[]): number | null` — 계량 재료가 없거나 하나도 담기지 않았으면 `null`. `null` 은 "이 주문에 계량 축이 존재하지 않는다" 는 뜻이며 Task 4의 가중치 재분배가 이 값을 본다.

- [ ] **Step 1: 실패하는 테스트 추가**

import 에 `scoreAmounts` 를 더하고 아래를 파일 끝에 붙인다.

```js
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
```

마지막 테스트가 이중 감점을 막는다. 설탕을 안 담은 것은 재료 축이 이미 벌했다.

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `scoreAmounts is not a function`

- [ ] **Step 3: 최소 구현**

`src/scoring.js` 에 붙인다.

```js
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 19 tests

- [ ] **Step 5: 커밋**

```bash
git add src/scoring.js test/scoring.test.js
git commit -m "feat: 오차율 기반 계량 축 채점 추가"
```

---

### Task 4: 총점·별점·금액 산출

**Files:**
- Modify: `src/scoring.js`
- Modify: `context-notes.md`
- Test: `test/scoring.test.js`

**Interfaces:**
- Consumes: `scoreIngredients`, `scoreOrder`, `scoreAmounts`, `WEIGHTS`, `STAR_THRESHOLDS`
- Produces: `grade(order: Item[], result: Item[], price: number): Grade`

```js
// Grade 의 모양
{
  axes: { ingredients: number, order: number, amount: number | null },
  total: number,   // 0~100 정수
  stars: number,   // 0~3 정수
  payout: number,  // 원 단위 정수
  weakest: 'ingredients' | 'order' | 'amount' | null
}
```

`weakest` 는 가장 많이 깎인 축의 이름이며 Task 8의 한 줄 코멘트가 이 값을 쓴다. 만점이면 `null` 이다.

- [ ] **Step 1: 실패하는 테스트 추가**

import 에 `grade` 를 더하고 아래를 파일 끝에 붙인다.

```js
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
```

네 번째 테스트를 검산해 둔다. 재료 축 4/5 = 0.8, 순서 축 1, 계량 축 없음. 가중치 재분배로 재료 0.6/0.75 = 0.8, 순서 0.15/0.75 = 0.2. 총점 = (0.8 × 0.8 + 1 × 0.2) × 100 = 84점 → 별 2개, 900 × 2/3 = 600원.

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `grade is not a function`

- [ ] **Step 3: 최소 구현**

`src/scoring.js` 에 붙인다.

```js
export function grade(order, result, price) {
  const axes = {
    ingredients: scoreIngredients(order, result),
    order: scoreOrder(order, result),
    amount: scoreAmounts(order, result),
  };

  // 존재하지 않는 축의 가중치는 남은 축에 비례 배분한다.
  // 그러지 않으면 계량 재료 없는 주문은 완벽해도 별 3개가 나오지 않는다.
  let usedWeight = 0;
  let weighted = 0;
  for (const [name, weight] of Object.entries(WEIGHTS)) {
    if (axes[name] === null) continue;
    usedWeight += weight;
    weighted += weight * axes[name];
  }
  const total = Math.round((weighted / usedWeight) * 100);

  const [gold, silver, bronze] = STAR_THRESHOLDS;
  const stars = total >= gold ? 3 : total >= silver ? 2 : total >= bronze ? 1 : 0;

  let weakest = null;
  for (const name of Object.keys(WEIGHTS)) {
    if (axes[name] === null || axes[name] === 1) continue;
    if (weakest === null || axes[name] < axes[weakest]) weakest = name;
  }

  return { axes, total, stars, payout: Math.round((price * stars) / 3), weakest };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 24 tests

- [ ] **Step 5: `context-notes.md` 에 결정 기록**

```markdown
## 2026-09-06 없는 축의 가중치를 재분배한다

계량 재료가 없는 주문에서 계량 축(25%)을 0점으로 두면 완벽하게 만들어도 75점이라
별 3개가 절대 나오지 않는다. 축이 존재하지 않으면(`null`) 가중치를 남은 축에
비례 배분해 총점 만점이 100점이 되도록 한다.

## 2026-09-06 이중 감점을 하지 않는다

재료를 빠뜨리면 재료 축에서 이미 감점된다. 순서 축과 계량 축은 "담긴 것들"만 보고
빠진 것을 다시 벌하지 않는다. 그러지 않으면 실수 하나가 세 축을 동시에 깎아
별점이 필요 이상으로 가혹해진다.
```

- [ ] **Step 6: 커밋**

```bash
git add src/scoring.js test/scoring.test.js context-notes.md
git commit -m "feat: 가중치 재분배를 포함한 총점·별점·금액 산출 추가"
```

---

### Task 5: 재료 카탈로그 + 주문 생성

**Files:**
- Create: `src/data.js`
- Create: `src/order.js`
- Test: `test/order.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `INGREDIENTS: Ingredient[]` — 전체 재료 카탈로그
  - `STARTING_UNLOCKED: string[]` — 시작부터 열려 있는 재료 id 목록
  - `findIngredient(id: string): Ingredient` — 없으면 예외
  - `createOrder(unlockedIds: string[], rng?: () => number): Order`

```js
// Ingredient 의 모양
{
  id: string,
  name: string,             // 한국어 표시명
  type: 'sheet' | 'filling' | 'topping',
  color: string,            // SVG 채우기 색
  measured: boolean,
  unit?: string,            // measured 일 때만. 예 'g'
  range?: [number, number], // measured 일 때만. 슬라이더 최소/최대
  step?: number,            // measured 일 때만
  price: number,            // 재료 원가. 주문 정가 계산에 쓴다
  unlockCost: number        // 0 이면 처음부터 열려 있다
}

// Order 의 모양
{ items: Item[], price: number }
```

`rng` 는 0 이상 1 미만을 돌려주는 함수이며 기본값은 `Math.random` 이다. 테스트에서 고정된 값을 주입하기 위해 인자로 뺀다.

- [ ] **Step 1: `src/data.js` 작성**

```js
// 게임에 등장하는 모든 재료의 카탈로그와 조회 함수
export const INGREDIENTS = [
  { id: 'vanilla-sheet', name: '바닐라 시트', type: 'sheet', color: '#f2e0bd', measured: false, price: 200, unlockCost: 0 },
  { id: 'choco-sheet', name: '초코 시트', type: 'sheet', color: '#5b3a26', measured: false, price: 220, unlockCost: 0 },
  { id: 'strawberry-cream', name: '딸기 크림', type: 'filling', color: '#f7a8bf', measured: false, price: 150, unlockCost: 0 },
  { id: 'sugar', name: '설탕', type: 'filling', color: '#fdfdfd', measured: true, unit: 'g', range: [40, 200], step: 5, price: 50, unlockCost: 0 },
  { id: 'cherry', name: '체리', type: 'topping', color: '#c0223b', measured: false, price: 80, unlockCost: 0 },

  { id: 'blueberry', name: '블루베리', type: 'topping', color: '#4a4b9c', measured: false, price: 90, unlockCost: 250 },
  { id: 'matcha-cream', name: '말차 크림', type: 'filling', color: '#8bbf62', measured: false, price: 180, unlockCost: 300 },
  { id: 'mint', name: '민트 잎', type: 'topping', color: '#3fa36b', measured: false, price: 70, unlockCost: 350 },
  { id: 'choco-cream', name: '초코 크림', type: 'filling', color: '#6b4423', measured: false, price: 190, unlockCost: 400 },
  { id: 'butter', name: '버터', type: 'filling', color: '#f5d76e', measured: true, unit: 'g', range: [20, 120], step: 5, price: 120, unlockCost: 500 },
  { id: 'red-velvet-sheet', name: '레드벨벳 시트', type: 'sheet', color: '#a32638', measured: false, price: 260, unlockCost: 600 },
  { id: 'gold-leaf', name: '금박', type: 'topping', color: '#e6c34a', measured: false, price: 300, unlockCost: 900 },
];

export const STARTING_UNLOCKED = INGREDIENTS.filter((it) => it.unlockCost === 0).map((it) => it.id);

export function findIngredient(id) {
  const found = INGREDIENTS.find((it) => it.id === id);
  if (!found) throw new Error(`알 수 없는 재료 ${id}`);
  return found;
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

`test/order.test.js` 를 만든다.

```js
// 주문 생성이 해금 범위와 난이도 규칙을 지키는지 확인하는 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrder } from '../src/order.js';
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
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../src/order.js'`

- [ ] **Step 4: 최소 구현**

`src/order.js` 를 만든다.

```js
// 해금된 재료 안에서 손님 주문 하나를 만들어 내는 생성기
import { INGREDIENTS, findIngredient } from './data.js';

const PRICE_MARKUP = 2.2; // 재료 원가 대비 손님이 내는 값

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
  return { items, price };
}
```

시트 → 필링 → 토핑 순으로 담는 것이 주문서의 정답 순서다. 플레이어가 이 순서를 지켜야 순서 축이 만점이 된다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 30 tests

- [ ] **Step 6: 커밋**

```bash
git add src/data.js src/order.js test/order.test.js
git commit -m "feat: 재료 카탈로그와 해금 범위 기반 주문 생성 추가"
```

---

### Task 6: 케익 SVG 렌더링

**Files:**
- Create: `src/cake.js`
- Create: `scratch-cake.html` (Task 7에서 삭제할 임시 확인용 파일)

**Interfaces:**
- Consumes: `findIngredient` (Task 5)
- Produces: `renderCake(items: Item[]): string` — `<svg>...</svg>` 문자열. 빈 배열이면 빈 접시만 그린다.

자동 테스트를 두지 않는다. 그림이 맞는지는 눈으로만 알 수 있어 문자열 비교 테스트가 값을 못 한다. 대신 Step 3에서 브라우저로 직접 확인한다.

- [ ] **Step 1: `src/cake.js` 작성**

```js
// 레시피 배열을 받아 케익 모습을 SVG 문자열로 그리는 렌더러
import { findIngredient } from './data.js';

const WIDTH = 200;
const HEIGHT = 200;
const PLATE_Y = 176;
const SHEET_HEIGHT = 26;
const FILLING_HEIGHT = 9;

export function renderCake(items) {
  const parts = [
    `<ellipse cx="100" cy="${PLATE_Y + 6}" rx="86" ry="10" fill="#d8d2c8" />`,
  ];

  let y = PLATE_Y; // 아래에서 위로 쌓는다
  const toppings = [];

  for (const item of items) {
    const spec = findIngredient(item.id);
    if (spec.type === 'topping') {
      toppings.push(spec);
      continue;
    }
    const height = spec.type === 'sheet' ? SHEET_HEIGHT : FILLING_HEIGHT;
    y -= height;
    const width = spec.type === 'sheet' ? 140 : 132;
    const x = (WIDTH - width) / 2;
    parts.push(
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="${spec.color}" stroke="rgba(0,0,0,.12)" />`
    );
  }

  // 토핑은 가장 위층 위에 좌우로 흩뿌린다
  toppings.forEach((spec, i) => {
    const perRow = Math.min(toppings.length, 5);
    const step = 108 / (perRow + 1);
    const cx = 46 + step * ((i % perRow) + 1);
    const cy = y - 9 - Math.floor(i / perRow) * 15;
    parts.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="${spec.color}" stroke="rgba(0,0,0,.15)" />`);
  });

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="100%" role="img" aria-label="만드는 중인 케익">${parts.join('')}</svg>`;
}
```

- [ ] **Step 2: 확인용 임시 페이지 작성**

`scratch-cake.html` 을 저장소 루트에 만든다. Task 7에서 지울 임시 파일이다.

```html
<!doctype html>
<meta charset="utf-8">
<title>케익 렌더 확인</title>
<div id="box" style="width:300px"></div>
<script type="module">
  import { renderCake } from './src/cake.js';
  document.getElementById('box').innerHTML = renderCake([
    { id: 'choco-sheet' }, { id: 'strawberry-cream' },
    { id: 'vanilla-sheet' }, { id: 'sugar', amount: 100 },
    { id: 'cherry' }, { id: 'cherry' }, { id: 'cherry' },
  ]);
</script>
```

- [ ] **Step 3: 브라우저로 눈으로 확인**

Run: `python -m http.server 8000` 후 `http://localhost:8000/scratch-cake.html` 을 연다.
Expected: 접시 위에 시트 2단이 쌓이고 그 사이에 얇은 크림 띠가 보이며, 맨 위에 빨간 원 3개가 나란히 있다. 층이 겹치거나 화면 밖으로 나가지 않아야 한다.

어긋나면 `PLATE_Y`, `SHEET_HEIGHT`, 토핑 `cy` 값을 조정한다. 이 숫자들은 계산이 아니라 보면서 맞추는 값이다.

- [ ] **Step 4: 커밋**

```bash
git add src/cake.js scratch-cake.html
git commit -m "feat: 레시피를 SVG 케익 그림으로 그리는 렌더러 추가"
```

---

### Task 7: 화면 뼈대 + 코어 루프

이 태스크가 끝나면 게임이 돌아간다. 주문을 받아 재료를 담고 완성을 누르면 다음 주문으로 넘어간다. 결과 화면과 해금은 다음 태스크다.

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/game.js`
- Delete: `scratch-cake.html`

**Interfaces:**
- Consumes: `INGREDIENTS`, `STARTING_UNLOCKED`, `findIngredient` (Task 5), `createOrder` (Task 5), `renderCake` (Task 6), `grade` (Task 4)
- Produces: 없음. `src/game.js` 는 최상위 진입점이며 다른 모듈이 import 하지 않는다.

- [ ] **Step 1: `index.html` 작성**

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>케익 만들기</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="topbar">
    <h1>🍰 케익 가게</h1>
    <div class="stats">
      <span>💰 <b id="money">0</b>원</span>
      <span>주문 <b id="orderNo">1</b>번째</span>
    </div>
  </header>

  <main class="board">
    <section class="panel" id="orderPanel">
      <h2>주문서</h2>
      <ul id="orderList"></ul>
      <p class="price">정가 <b id="orderPrice">0</b>원</p>
    </section>

    <section class="panel" id="benchPanel">
      <h2>작업대</h2>
      <div class="cake" id="cake"></div>
      <h3>넣은 것</h3>
      <ol id="benchList" class="bench"></ol>
      <button id="finishBtn" type="button">완성!</button>
    </section>

    <section class="panel" id="shelfPanel">
      <h2>재료 선반</h2>
      <ul id="shelfList" class="shelf"></ul>
    </section>
  </main>

  <dialog id="amountDialog">
    <form method="dialog">
      <h3 id="amountTitle">설탕</h3>
      <input type="range" id="amountRange">
      <p class="amountValue"><b id="amountValue">0</b><span id="amountUnit">g</span></p>
      <menu>
        <button value="cancel" type="submit">취소</button>
        <button value="ok" type="submit">담기</button>
      </menu>
    </form>
  </dialog>

  <dialog id="resultDialog"></dialog>

  <script type="module" src="src/game.js"></script>
</body>
</html>
```

`<dialog>` 는 브라우저 기본 기능이다. 모달을 직접 만들지 않는다.

- [ ] **Step 2: `styles.css` 작성**

```css
/* 3단 레이아웃과 재료 버튼의 겉모습 */
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; background: #faf6f0; color: #33291f; }

.topbar { display: flex; justify-content: space-between; align-items: center;
  padding: 12px 20px; background: #fff; border-bottom: 1px solid #e6ded3; }
.topbar h1 { font-size: 20px; margin: 0; }
.stats { display: flex; gap: 20px; font-size: 15px; }

.board { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 16px; padding: 16px;
  align-items: start; max-width: 1100px; margin: 0 auto; }
.panel { background: #fff; border: 1px solid #e6ded3; border-radius: 10px; padding: 16px; }
.panel h2 { margin: 0 0 12px; font-size: 16px; }
.panel h3 { margin: 16px 0 8px; font-size: 14px; color: #7a6a58; }

#orderList { list-style: none; padding: 0; margin: 0; }
#orderList li { padding: 8px 0; border-bottom: 1px dashed #eee3d6; }
.price { margin-top: 14px; font-size: 15px; }

.cake { height: 200px; display: flex; align-items: flex-end; justify-content: center; }
.bench { margin: 0; padding-left: 20px; min-height: 60px; }
.bench li { padding: 4px 0; }
.bench button { margin-left: 8px; border: 0; background: none; cursor: pointer; color: #b04a4a; }

#finishBtn { width: 100%; margin-top: 16px; padding: 12px; font-size: 16px; cursor: pointer;
  border: 0; border-radius: 8px; background: #d9773f; color: #fff; }
#finishBtn:disabled { background: #d8cfc4; cursor: not-allowed; }

.shelf { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.shelf button { width: 100%; display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; cursor: pointer; border: 1px solid #e6ded3; border-radius: 8px; background: #fffdfa; }
.shelf button:hover { border-color: #d9773f; }
.shelf .locked button { color: #a2968a; background: #f4efe8; }
.swatch { width: 14px; height: 14px; border-radius: 4px; border: 1px solid rgba(0,0,0,.15); }
.shelf .label { display: flex; align-items: center; gap: 8px; }

dialog { border: 0; border-radius: 12px; padding: 20px; min-width: 280px; }
dialog::backdrop { background: rgba(0,0,0,.35); }
dialog menu { display: flex; justify-content: flex-end; gap: 8px; padding: 0; margin: 16px 0 0; }
dialog button { padding: 8px 16px; cursor: pointer; border-radius: 6px; border: 1px solid #ddd2c4; background: #fff; }
#amountRange { width: 100%; }
.amountValue { text-align: center; font-size: 22px; margin: 8px 0 0; }

.stars { font-size: 34px; text-align: center; margin: 0 0 12px; }
.axes { display: grid; gap: 6px; margin: 0 0 14px; font-size: 14px; }
.comment { text-align: center; color: #7a6a58; margin: 0 0 14px; }
.payout { text-align: center; font-size: 18px; margin: 0; }
```

- [ ] **Step 3: `src/game.js` 작성**

```js
// 게임 상태를 들고 화면 조각들을 배선하는 진입점
import { INGREDIENTS, STARTING_UNLOCKED, findIngredient } from './data.js';
import { createOrder } from './order.js';
import { renderCake } from './cake.js';
import { grade } from './scoring.js';

const state = {
  money: 0,
  orderNo: 1,
  unlocked: [...STARTING_UNLOCKED],
  order: null,
  bench: [],
};

const el = (id) => document.getElementById(id);

function startOrder() {
  state.order = createOrder(state.unlocked);
  state.bench = [];
  render();
}

function describe(item) {
  const spec = findIngredient(item.id);
  return typeof item.amount === 'number' ? `${spec.name} ${item.amount}${spec.unit}` : spec.name;
}

function renderTopbar() {
  el('money').textContent = state.money.toLocaleString('ko-KR');
  el('orderNo').textContent = state.orderNo;
}

function renderOrder() {
  el('orderList').innerHTML = state.order.items
    .map((item) => `<li>${describe(item)}</li>`)
    .join('');
  el('orderPrice').textContent = state.order.price.toLocaleString('ko-KR');
}

function renderBench() {
  el('cake').innerHTML = renderCake(state.bench);
  el('benchList').innerHTML = state.bench
    .map((item, i) => `<li>${describe(item)}<button type="button" data-remove="${i}">✕</button></li>`)
    .join('');
  el('finishBtn').disabled = state.bench.length === 0;
}

function renderShelf() {
  el('shelfList').innerHTML = INGREDIENTS.map((spec) => {
    const unlocked = state.unlocked.includes(spec.id);
    const right = unlocked ? `${spec.price}원` : `🔒 ${spec.unlockCost}원`;
    return `<li class="${unlocked ? '' : 'locked'}">
      <button type="button" data-id="${spec.id}">
        <span class="label"><span class="swatch" style="background:${spec.color}"></span>${spec.name}</span>
        <span>${right}</span>
      </button></li>`;
  }).join('');
}

function render() {
  renderTopbar();
  renderOrder();
  renderBench();
  renderShelf();
}

// 계량 재료를 담기 전에 슬라이더로 수치를 받는다.
// 주문서의 정답 수치는 절대 보여주지 않는다. 그것을 맞추는 것이 게임이다.
function askAmount(spec) {
  return new Promise((resolve) => {
    const dialog = el('amountDialog');
    const range = el('amountRange');
    const [low, high] = spec.range;
    range.min = low;
    range.max = high;
    range.step = spec.step;
    range.value = Math.round((low + high) / 2);
    el('amountTitle').textContent = `${spec.name} 얼마나 넣을까요?`;
    el('amountUnit').textContent = spec.unit;
    el('amountValue').textContent = range.value;
    range.oninput = () => { el('amountValue').textContent = range.value; };
    dialog.onclose = () => resolve(dialog.returnValue === 'ok' ? Number(range.value) : null);
    dialog.showModal();
  });
}

async function addIngredient(id) {
  const spec = findIngredient(id);
  if (!spec.measured) {
    state.bench.push({ id });
  } else {
    const amount = await askAmount(spec);
    if (amount === null) return;
    state.bench.push({ id, amount });
  }
  renderBench();
}

el('shelfList').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;
  const id = button.dataset.id;
  if (!state.unlocked.includes(id)) return; // 해금은 Task 9 에서 붙인다
  addIngredient(id);
});

el('benchList').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-remove]');
  if (!button) return;
  state.bench.splice(Number(button.dataset.remove), 1);
  renderBench();
});

el('finishBtn').addEventListener('click', () => {
  const result = grade(state.order.items, state.bench, state.order.price);
  state.money += result.payout;
  state.orderNo += 1;
  startOrder(); // 결과 화면은 Task 8 에서 이 사이에 끼운다
});

startOrder();
```

- [ ] **Step 4: 임시 파일 삭제**

```bash
git rm scratch-cake.html
```

- [ ] **Step 5: 브라우저로 한 판 돌려 확인**

Run: `python -m http.server 8000` 후 `http://localhost:8000`
Expected 순서대로 확인한다.
1. 주문서에 재료 목록과 정가가 뜬다. 계량 재료는 수치가 함께 보인다.
2. 선반의 재료를 누르면 작업대 목록과 케익 그림이 늘어난다.
3. 설탕을 누르면 슬라이더 창이 뜨고, 담기를 누르면 수치와 함께 목록에 들어간다. 취소하면 담기지 않는다.
4. ✕ 를 누르면 그 재료만 빠지고 케익이 다시 그려진다.
5. 완성을 누르면 돈이 늘고 주문 번호가 올라가며 새 주문이 나온다.
6. 잠긴 재료를 눌러도 아무 일도 일어나지 않는다.

- [ ] **Step 6: 커밋**

```bash
git add index.html styles.css src/game.js
git commit -m "feat: 3단 화면과 주문-제작-정산 코어 루프 추가"
```

---

### Task 8: 결과 화면

**Files:**
- Modify: `src/game.js`

**Interfaces:**
- Consumes: `grade` 의 반환값 `{ axes, total, stars, payout, weakest }` (Task 4)
- Produces: 없음

- [ ] **Step 1: 결과 화면 그리는 함수 추가**

`src/game.js` 의 `render()` 아래에 붙인다.

```js
const AXIS_LABEL = { ingredients: '재료', order: '순서', amount: '계량' };
const AXIS_COMMENT = {
  ingredients: '주문한 재료가 아닌데요.',
  order: '넣는 순서가 뒤바뀌었어요.',
  amount: '양이 잘 안 맞네요.',
};

function dots(score) {
  const filled = Math.round(score * 6);
  return '●'.repeat(filled) + '○'.repeat(6 - filled);
}

function showResult(result) {
  return new Promise((resolve) => {
    const axes = Object.entries(result.axes)
      .filter(([, score]) => score !== null)
      .map(([name, score]) => `<div>${AXIS_LABEL[name]} <b>${dots(score)}</b></div>`)
      .join('');
    const comment = result.weakest ? AXIS_COMMENT[result.weakest] : '완벽해요. 딱 주문한 그대로예요.';

    const dialog = el('resultDialog');
    dialog.innerHTML = `
      <form method="dialog">
        <p class="stars">${'⭐'.repeat(result.stars)}${'☆'.repeat(3 - result.stars)}</p>
        <div class="axes">${axes}</div>
        <p class="comment">"${comment}"</p>
        <p class="payout"><b>${result.payout.toLocaleString('ko-KR')}</b>원 획득</p>
        <menu><button value="next" type="submit">다음 손님</button></menu>
      </form>`;
    dialog.onclose = () => resolve();
    dialog.showModal();
  });
}
```

축을 따로 보여주는 것이 이 화면의 목적이다. 별 2개만 던지면 무엇을 틀렸는지 몰라 다음에도 같은 실수를 한다.

- [ ] **Step 2: 완성 버튼 핸들러를 결과 화면 경유로 바꾸기**

`src/game.js` 의 `finishBtn` 핸들러를 통째로 아래로 교체한다.

```js
el('finishBtn').addEventListener('click', async () => {
  const result = grade(state.order.items, state.bench, state.order.price);
  state.money += result.payout;
  state.orderNo += 1;
  await showResult(result);
  startOrder();
});
```

- [ ] **Step 3: 브라우저로 확인**

Run: `python -m http.server 8000` 후 `http://localhost:8000`
Expected 세 경우를 직접 만들어 본다.
1. 주문서 그대로 담고 완성 → 별 3개, 세 축 모두 ●●●●●●, "완벽해요", 정가 전액.
2. 설탕만 크게 빗나가게 담고 완성 → 계량 축만 눈에 띄게 짧고 코멘트가 "양이 잘 안 맞네요."
3. 엉뚱한 재료만 담고 완성 → 별 0개, 0원 획득.

계량 재료가 없는 주문에서는 결과 화면에 계량 줄이 아예 나오지 않아야 한다.

- [ ] **Step 4: 커밋**

```bash
git add src/game.js
git commit -m "feat: 축별 피드백을 보여주는 결과 화면 추가"
```

---

### Task 9: 해금 + 저장

**Files:**
- Modify: `src/game.js`
- Modify: `checklist.md`
- Modify: `context-notes.md`

**Interfaces:**
- Consumes: `state.money`, `state.unlocked`
- Produces: 없음

- [ ] **Step 1: 저장 함수 추가**

`src/game.js` 의 `state` 선언 바로 아래에 붙인다.

```js
const SAVE_KEY = 'cake-maker-save';

// 돈과 해금 목록만 저장한다. 진행 중이던 주문은 새로고침하면 버린다.
function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ money: state.money, unlocked: state.unlocked }));
}

function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    state.money = saved.money ?? 0;
    // 저장된 뒤 카탈로그에서 사라진 재료가 있어도 게임이 깨지지 않게 걸러 낸다
    state.unlocked = (saved.unlocked ?? STARTING_UNLOCKED).filter((id) =>
      INGREDIENTS.some((spec) => spec.id === id)
    );
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }
}
```

- [ ] **Step 2: 해금 처리 추가**

`src/game.js` 의 선반 클릭 핸들러를 통째로 아래로 교체한다.

```js
el('shelfList').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;
  const id = button.dataset.id;
  if (state.unlocked.includes(id)) {
    addIngredient(id);
    return;
  }
  const spec = findIngredient(id);
  if (state.money < spec.unlockCost) {
    alert(`${spec.name} 해금에 ${spec.unlockCost}원이 필요해요. 지금은 ${state.money}원이에요.`);
    return;
  }
  if (!confirm(`${spec.name} 을 ${spec.unlockCost}원에 해금할까요?`)) return;
  state.money -= spec.unlockCost;
  state.unlocked.push(id);
  save();
  render();
});
```

- [ ] **Step 3: 정산과 시작에 저장·불러오기 연결**

`finishBtn` 핸들러에 `save()` 를 넣는다.

```js
el('finishBtn').addEventListener('click', async () => {
  const result = grade(state.order.items, state.bench, state.order.price);
  state.money += result.payout;
  state.orderNo += 1;
  save();
  await showResult(result);
  startOrder();
});
```

파일 맨 아래 `startOrder();` 를 아래로 바꾼다.

```js
load();
startOrder();
```

- [ ] **Step 4: 브라우저로 확인**

Run: `python -m http.server 8000` 후 `http://localhost:8000`
Expected 순서대로 확인한다.
1. 돈이 부족할 때 잠긴 재료를 누르면 부족하다는 안내가 뜨고 돈이 줄지 않는다.
2. 돈을 충분히 모은 뒤 해금하면 돈이 그만큼 줄고 자물쇠가 사라진다.
3. 해금 직후 몇 주문을 돌려 보면 해금한 재료가 주문서에 등장한다.
4. 새로고침해도 돈과 해금 목록이 그대로다.
5. 개발자 도구에서 `localStorage.clear()` 후 새로고침하면 처음 상태로 돌아간다.

- [ ] **Step 5: 밸런스 확인**

주문 10개 정도를 연달아 플레이하며 아래를 본다. 어긋나면 `src/scoring.js` 상단 상수와 `src/order.js` 의 `PRICE_MARKUP` 을 조정한다.

- 주문서를 제대로 읽고 성실히 만들면 별 3개가 나오는가. 계량 때문에 별 3개가 거의 불가능하면 `AMOUNT_TOLERANCE` 를 올린다.
- 대충 만들었는데 별 2개가 나오면 `STAR_THRESHOLDS` 를 올린다.
- 첫 해금(250원)까지 서너 주문이면 닿는가. 너무 멀면 `PRICE_MARKUP` 을 올린다.

조정한 값과 이유를 `context-notes.md` 에 적는다.

- [ ] **Step 6: 전체 테스트 재실행**

Run: `npm test`
Expected: PASS — 30 tests

- [ ] **Step 7: `checklist.md` 전 항목 체크 후 커밋**

```bash
git add src/game.js checklist.md context-notes.md
git commit -m "feat: 재료 해금과 localStorage 저장 추가"
```
