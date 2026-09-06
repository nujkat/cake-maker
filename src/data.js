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
