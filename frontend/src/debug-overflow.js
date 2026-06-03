// Runtime debug helpers for finding elements wider than viewport
// Usage in browser console (dev only):
//   window.toggleOverflowDebug()       // toggles visual outlines
//   window.findOverflowingElements()   // returns array of offending nodes

function toggleOutlineClass() {
  const el = document.documentElement || document.body;
  el.classList.toggle('debug-overflow');
}

function clearHighlights() {
  document.querySelectorAll('.overflow-highlight').forEach((el) => {
    el.classList.remove('overflow-highlight');
  });
}

function findOverflowingElements() {
  clearHighlights();
  const vw = document.documentElement.clientWidth;
  const els = Array.from(document.querySelectorAll('*'));
  const offenders = [];
  els.forEach((el) => {
    try {
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      if (w > vw + 1) {
        offenders.push({
          node: el,
          width: w,
          selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
        });
        el.classList.add('overflow-highlight');
      }
    } catch (e) {
      // ignore cross-origin or hidden elements
    }
  });
  // scroll to first offender for quick inspection
  if (offenders.length > 0 && offenders[0].node && typeof offenders[0].node.scrollIntoView === 'function') {
    offenders[0].node.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  return offenders;
}

function listOverflowingElementsConsole() {
  const offenders = findOverflowingElements();
  if (offenders.length === 0) {
    console.info('No overflowing elements found.');
    return offenders;
  }
  console.table(offenders.map(o => ({ selector: o.selector, width: o.width })));
  console.log('Offending nodes are highlighted with class .overflow-highlight');
  return offenders;
}

window.toggleOverflowDebug = toggleOutlineClass;
window.findOverflowingElements = listOverflowingElementsConsole;

// Optionally auto-enable in development environment (uncomment if desired)
// if (import.meta.env && import.meta.env.DEV) toggleOutlineClass();

export {};
