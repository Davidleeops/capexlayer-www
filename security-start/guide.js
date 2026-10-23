'use strict';
const storageKey = 'capexlayer-security-start-v1';
const boxes = [...document.querySelectorAll('[data-step]')];
const notes = [...document.querySelectorAll('textarea')];
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
for (const box of boxes) box.checked = saved.steps?.includes(box.dataset.step) || false;
for (const note of notes) note.value = saved.notes?.[note.id] || '';
function snapshot() { return { steps: boxes.filter(b => b.checked).map(b => b.dataset.step), notes: Object.fromEntries(notes.map(n => [n.id, n.value])) }; }
function update() {
  const state = snapshot();
  document.getElementById('progress').textContent = `${state.steps.length} of 6 steps checked`;
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
}
for (const box of boxes) box.addEventListener('change', update);
for (const note of notes) note.addEventListener('input', update);
document.getElementById('reset').addEventListener('click', () => {
  if (!window.confirm('Clear this browser checklist and its notes?')) return;
  for (const box of boxes) box.checked = false;
  for (const note of notes) note.value = '';
  update();
});
document.getElementById('print').addEventListener('click', () => window.print());
document.getElementById('copy').addEventListener('click', async () => {
  const status = document.getElementById('copy-status');
  try { await navigator.clipboard.writeText(document.querySelector('#prompt code').textContent); status.textContent = 'Review request copied.'; }
  catch { status.textContent = 'Copy is unavailable. Select the request above and copy it manually.'; }
});
document.getElementById('export').addEventListener('click', () => {
  const state = snapshot();
  const text = ['Website security review checklist', 'Guide: https://capexlayer.com/security-start/', '', ...boxes.map(b => `${b.checked ? '[x]' : '[ ]'} ${b.parentElement.textContent.trim()}`), '', 'Inventory:', state.notes['inventory-notes'], '', 'Next action:', state.notes['next-action'], '', 'Checklist completion is not proof of a secure system.'].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'website-security-checklist.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
update();
