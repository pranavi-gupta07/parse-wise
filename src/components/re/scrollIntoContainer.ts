/**
 * Scroll an element into view inside its nearest scrollable ancestor only —
 * never scrolls the page itself (unlike element.scrollIntoView).
 */
export function scrollIntoContainer(el: HTMLElement | null, axis: 'y' | 'x' = 'y') {
  if (!el) return;
  let parent = el.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    const scrollable = axis === 'y' ? /(auto|scroll)/.test(style.overflowY) : /(auto|scroll)/.test(style.overflowX);
    if (scrollable && (axis === 'y' ? parent.scrollHeight > parent.clientHeight : parent.scrollWidth > parent.clientWidth)) break;
    parent = parent.parentElement;
  }
  if (!parent) return;
  const e = el.getBoundingClientRect();
  const p = parent.getBoundingClientRect();
  if (axis === 'y') {
    if (e.top < p.top + 28) parent.scrollTop -= p.top + 28 - e.top;
    else if (e.bottom > p.bottom) parent.scrollTop += e.bottom - p.bottom + 4;
  } else {
    parent.scrollLeft += e.left + e.width / 2 - (p.left + p.width / 2);
  }
}
