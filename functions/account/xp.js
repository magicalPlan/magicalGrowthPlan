/* 경험치 곡선. 클라 js/common/formula.js · data/game.js XP_* 와 같게 둔다. */
const XP_BASE = 40, XP_STEP = 10, XP_BEND = 20, XP_BEND_DIV = 4;

function xpSqSum(m) {
  m = Math.floor(Number(m) || 0);
  if (m <= 0) return 0;
  return Math.round((m * (m + 1) * (2 * m + 1) / 6 - ((m + 1) >> 1)) / 4);
}
function xpAt(lv) {
  const n = Math.max(1, Number(lv) || 1) - 1;
  const lin = XP_BASE * n + XP_STEP * n * (n - 1) / 2;
  const bend = XP_BEND, div = XP_BEND_DIV, m = n - bend;
  if (!(m > 0)) return lin;
  if (div === 4) return lin + xpSqSum(m);
  let s = 0;
  for (let i = 1; i <= m; i++) s += Math.floor(i * i / div);
  return lin + s;
}
function lvOf(ex) {
  ex = Math.max(0, Number(ex) || 0);
  let L = 1;
  while (L < 9999 && xpAt(L + 1) <= ex) L++;
  return L;
}

module.exports = {xpAt, lvOf, XP_BASE, XP_STEP};
