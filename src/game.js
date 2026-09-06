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
    alert(`${spec.name} 해금에 ${spec.unlockCost}원이 필요해요. 지금은 ${state.money}원이에요.`);
    return;
  }
  if (!confirm(`${spec.name} 을 ${spec.unlockCost}원에 해금할까요?`)) return;
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

el('finishBtn').addEventListener('click', async () => {
  const result = grade(state.order.items, state.bench, state.order.price);
  state.money += result.payout;
  state.orderNo += 1;
  save();
  await showResult(result);
  startOrder();
});

load();
startOrder();
