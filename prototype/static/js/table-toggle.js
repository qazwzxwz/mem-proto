/**
 * table-toggle.js
 * Mobile comparison table: typewriter erase/type toggle between
 * "По отдельности" and "МЭМ" columns.
 *
 * On ≤768px only one data column is visible.
 * Tapping the column header triggers:
 *   1. Backspace-erase each cell's text (char by char)
 *   2. Type new text (char by char)
 *   3. AFTER typing completes → apply МЭМ/default style
 */

export function init() {
  const wrap = document.getElementById('f1-wrap');
  if (!wrap) return;

  const mql = window.matchMedia('(max-width: 768px)');
  if (!mql.matches) {
    mql.addEventListener('change', () => { if (mql.matches) setup(); });
    return;
  }
  setup();

  function setup() {
    let showingMem = false;
    let animating = false;

    // Collect all body rows (skip category rows)
    const bodyTable = wrap.querySelector('.f1-table--body');
    if (!bodyTable) return;
    const rows = [...bodyTable.querySelectorAll('tbody tr:not(.f1-category)')];

    // Store original HTML for both columns (col index 1 = МЭМ, 2 = По отдельности)
    const memData = rows.map(r => {
      const td = r.cells[1];
      return { html: td ? td.innerHTML : '', text: td ? td.textContent.trim() : '' };
    });
    const sepData = rows.map(r => {
      const td = r.cells[2];
      return { html: td ? td.innerHTML : '', text: td ? td.textContent.trim() : '' };
    });

    // Header cells
    const thMem = wrap.querySelector('.f1-col-mem');
    const thSep = wrap.querySelector('.f1-col-separate');
    const circleMem = thMem ? thMem.querySelector('.f1-toggle-circle') : null;
    const circleSep = thSep ? thSep.querySelector('.f1-toggle-circle') : null;

    // Click handlers on both headers
    if (thSep) thSep.addEventListener('click', () => toggle());
    if (thMem) thMem.addEventListener('click', () => toggle());

    function toggle() {
      if (animating) return;
      animating = true;
      const toMem = !showingMem;
      showingMem = toMem;

      // Get the visible cells (col 3 = "По отдельности" when showing sep, col 2 when showing МЭМ)
      const visibleColIdx = toMem ? 2 : 1; // currently visible column (0-indexed)
      const oldData = toMem ? sepData : memData;
      const newData = toMem ? memData : sepData;

      // Start erasing each cell simultaneously
      const cells = rows.map(r => r.cells[visibleColIdx]);
      const CHAR_DELAY = 18; // ms per character
      const PAUSE = 80; // pause between erase and type

      let maxEraseTime = 0;
      const erasePromises = cells.map((td, i) => {
        if (!td) return Promise.resolve();
        const oldText = oldData[i].text;
        const eraseTime = oldText.length * CHAR_DELAY;
        if (eraseTime > maxEraseTime) maxEraseTime = eraseTime;
        return animateErase(td, oldText, CHAR_DELAY);
      });

      Promise.all(erasePromises).then(() => {
        // Switch columns in DOM
        if (toMem) {
          wrap.classList.add('f1-table-wrap--mem');
        } else {
          wrap.classList.remove('f1-table-wrap--mem');
        }

        // Wait a tick for DOM to update column visibility
        requestAnimationFrame(() => {
          const newColIdx = toMem ? 1 : 2;
          const newCells = rows.map(r => r.cells[newColIdx]);

          // Clear new cells, then type in
          newCells.forEach((td, i) => {
            if (td) {
              td.textContent = '';
              td.classList.remove('f1-cell-mem');
            }
          });

          setTimeout(() => {
            const typePromises = newCells.map((td, i) => {
              if (!td) return Promise.resolve();
              return animateType(td, newData[i].text, newData[i].html, CHAR_DELAY);
            });

            Promise.all(typePromises).then(() => {
              // AFTER all typing is done — apply style
              if (toMem) {
                newCells.forEach(td => { if (td) td.classList.add('f1-cell-mem'); });
                if (circleMem) circleMem.classList.add('f1-toggle-circle--active');
                if (circleSep) circleSep.classList.remove('f1-toggle-circle--active');
              } else {
                newCells.forEach(td => { if (td) td.classList.remove('f1-cell-mem'); });
                if (circleSep) circleSep.classList.add('f1-toggle-circle--active');
                if (circleMem) circleMem.classList.remove('f1-toggle-circle--active');
              }
              animating = false;
            });
          }, PAUSE);
        });
      });
    }
  }
}

/**
 * Erase text char by char from right to left (backspace effect)
 */
function animateErase(td, text, delay) {
  return new Promise(resolve => {
    let len = text.length;
    if (len === 0) { td.textContent = ''; resolve(); return; }

    td.textContent = text;
    const timer = setInterval(() => {
      len--;
      if (len <= 0) {
        td.textContent = '';
        clearInterval(timer);
        resolve();
      } else {
        td.textContent = text.slice(0, len);
      }
    }, delay);
  });
}

/**
 * Type text char by char from left to right (typewriter effect)
 * When done, restore original innerHTML (with icons/strong/etc.)
 */
function animateType(td, text, fullHtml, delay) {
  return new Promise(resolve => {
    if (!text || text.length === 0) {
      td.innerHTML = fullHtml;
      resolve();
      return;
    }

    let idx = 0;
    td.textContent = '';
    const timer = setInterval(() => {
      idx++;
      if (idx >= text.length) {
        clearInterval(timer);
        // Restore full HTML with icons/formatting
        td.innerHTML = fullHtml;
        resolve();
      } else {
        td.textContent = text.slice(0, idx);
      }
    }, delay);
  });
}
