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
