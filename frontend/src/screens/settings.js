import { h } from '../ui/dom.js';
export async function render(root) { root.append(h('div', { class: 'as-empty' }, 'Скоро')); return 'settings'; }
