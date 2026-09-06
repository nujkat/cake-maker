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
  secondsLeft: 0,
  deadline: 0,
  tick: null,
};

// 브라우저에서는 매 프레임, Node 테스트에서는 대략 60fps 로 흉내 낸다.
const nextFrame = globalThis.requestAnimationFrame ?? ((fn) => setTimeout(fn, 16));
const cancelFrame = globalThis.cancelAnimationFrame ?? clearTimeout;

const SAVE_KEY = 'cake-maker-save';
const HURRY_SECONDS = 5; // 남은 시간이 이 아래로 내려가면 빨갛게 강조한다
const WARN_RATIO = 0.4; // 남은 비율이 이 아래로 내려가면 막대가 주황이 된다

// 돈과 해금 목록만 저장한다. 진행 중이던 주문은 새로고침하면 버린다.
function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ money: state.money, unlocked: state.unlocked }));
}

function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    // 저장된 뒤 카탈로그에서 사라진 재료가 있어도 게임이 깨지지 않게 걸러 낸다
    const kept = (saved.unlocked ?? STARTING_UNLOCKED).filter((id) =>
      INGREDIENTS.some((spec) => spec.id === id)
    );
    // 시작 재료는 무료이므로 항상 있어야 한다. 저장분과 합쳐 createOrder 가 요구하는
    // "최소 한 장의 시트" 불변조건을 보장한다.
    const unlocked = [...new Set([...STARTING_UNLOCKED, ...kept])];
    state.money = Number(saved.money) || 0;
    state.unlocked = unlocked;
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }
}

const el = (id) => document.getElementById(id);

function startOrder() {
  state.order = createOrder(state.unlocked);
  state.bench = [];
  state.secondsLeft = state.order.seconds;
  render();
  startClock();
}

function stopClock() {
  cancelFrame(state.tick);
  state.tick = null;
}

// 시계는 계량 슬라이더가 열려 있는 동안에도 계속 간다.
// 멈추면 슬라이더를 연 채로 무한정 생각할 수 있어 압박이 사라진다.
function startClock() {
  stopClock();
  state.deadline = performance.now() + state.order.seconds * 1000;
  tickClock();
}

// 막대와 숫자를 모두 실제 경과 시간에서 그린다.
// 틱 횟수로 그리면 setInterval 이 밀린 만큼 벽시계와 어긋나고,
// CSS transition 으로 그리면 막대가 목표 폭까지 기어가느라 늘 한 박자 늦는다.
function tickClock() {
  const msLeft = state.deadline - performance.now();
  state.secondsLeft = Math.max(0, Math.ceil(msLeft / 1000));
  renderClock(Math.max(0, msLeft) / (state.order.seconds * 1000));
  if (msLeft <= 0) {
    finish(true);
    return;
  }
  state.tick = nextFrame(tickClock);
}

function describe(item) {
  const spec = findIngredient(item.id);
  return typeof item.amount === 'number' ? `${spec.name} ${item.amount}${spec.unit}` : spec.name;
}

function renderTopbar() {
  el('money').textContent = state.money.toLocaleString('ko-KR');
  el('orderNo').textContent = state.orderNo;
}

function renderClock(ratio) {
  const left = state.secondsLeft;
  el('timeLeft').textContent = left;
  el('timer').classList.toggle('hurry', left <= HURRY_SECONDS);
  el('clockFill').style.width = `${ratio * 100}%`;
  el('clock').classList.toggle('warn', ratio <= WARN_RATIO && left > HURRY_SECONDS);
  el('clock').classList.toggle('hurry', left <= HURRY_SECONDS);
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
    const right = unlocked ? `${spec.price.toLocaleString('ko-KR')}원` : `🔒 ${spec.unlockCost.toLocaleString('ko-KR')}원`;
    return `<li class="${unlocked ? '' : 'locked'}">
      <button type="button" data-id="${spec.id}">
        <span class="label"><span class="swatch" style="background:${spec.color}"></span>${spec.name}</span>
        <span>${right}</span>
      </button></li>`;
  }).join('');
}

function render() {
  renderTopbar();
  renderClock(state.order ? state.secondsLeft / state.order.seconds : 1);
  renderOrder();
  renderBench();
  renderShelf();
}

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

function showResult(result, timedOut) {
  return new Promise((resolve) => {
    const axes = Object.entries(result.axes)
      .filter(([, score]) => score !== null)
      .map(([name, score]) => `<div>${AXIS_LABEL[name]} <b>${dots(score)}</b></div>`)
      .join('');
    const comment = timedOut
      ? '시간이 다 됐어요.'
      : result.weakest
        ? AXIS_COMMENT[result.weakest]
        : '완벽해요. 딱 주문한 그대로예요.';

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
    dialog.returnValue = ''; // 재사용되는 다이얼로그라 이전 호출의 'ok' 가 남아있을 수 있다
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
  if (state.unlocked.includes(id)) {
    addIngredient(id);
    return;
  }
  const spec = findIngredient(id);
  if (state.money < spec.unlockCost) {
    alert(`${spec.name} 해금에 ${spec.unlockCost.toLocaleString('ko-KR')}원이 필요해요. 지금은 ${state.money.toLocaleString('ko-KR')}원이에요.`);
    return;
  }
  if (!confirm(`${spec.name} 을 ${spec.unlockCost.toLocaleString('ko-KR')}원에 해금할까요?`)) return;
  state.money -= spec.unlockCost;
  state.unlocked.push(id);
  save();
  render();
});

el('benchList').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-remove]');
  if (!button) return;
  state.bench.splice(Number(button.dataset.remove), 1);
  renderBench();
});

// 완성 버튼과 시간 종료가 같은 경로를 쓴다. 시간이 끝나도 담긴 그대로 채점될 뿐이다.
async function finish(timedOut) {
  stopClock();
  // 계량 슬라이더가 열린 채 시간이 끝나면 먼저 닫는다. 그 재료는 담기지 않는다.
  const amountDialog = el('amountDialog');
  if (amountDialog.open) amountDialog.close();

  const result = grade(state.order.items, state.bench, state.order.price);
  state.money += result.payout;
  state.orderNo += 1;
  save();
  await showResult(result, timedOut);
  startOrder();
}

el('finishBtn').addEventListener('click', () => finish(false));

load();
startOrder();
