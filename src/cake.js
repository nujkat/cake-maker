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
    y = Math.max(y - height, 4);
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
    const cy = Math.max(y - 9 - Math.floor(i / perRow) * 15, 4);
    parts.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="${spec.color}" stroke="rgba(0,0,0,.15)" />`);
  });

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="100%" role="img" aria-label="만드는 중인 케익">${parts.join('')}</svg>`;
}
