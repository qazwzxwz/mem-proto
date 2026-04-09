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

    // Header title + sub description — circle indicator stays static
    const titleMemEl = thMem ? thMem.querySelector('.f1-head-title') : null;
    const titleSepEl = thSep ? thSep.querySelector('.f1-head-title') : null;
    const titleMemData = snapshot(titleMemEl);
    const titleSepData = snapshot(titleSepEl);

    const subMemEl = thMem ? thMem.querySelector('.f1-head-sub') : null;
    const subSepEl = thSep ? thSep.querySelector('.f1-head-sub') : null;
    const subMemData = snapshot(subMemEl);
    const subSepData = snapshot(subSepEl);

    // Footer price spans — main price AND sub description animate
    const footTable = wrap.querySelector('.f1-table--foot');
    const footRow = footTable ? footTable.querySelector('tr') : null;
    const priceMemEl = footRow ? footRow.cells[1] && footRow.cells[1].querySelector('.f1-price-mem') : null;
    const priceSepEl = footRow ? footRow.cells[2] && footRow.cells[2].querySelector('.f1-price-sep') : null;
    const priceMemData = snapshot(priceMemEl);
    const priceSepData = snapshot(priceSepEl);

    const priceSubMemEl = footRow ? footRow.cells[1] && footRow.cells[1].querySelector('.f1-price-sub') : null;
    const priceSubSepEl = footRow ? footRow.cells[2] && footRow.cells[2].querySelector('.f1-price-sub') : null;
    const priceSubMemData = snapshot(priceSubMemEl);
    const priceSubSepData = snapshot(priceSubSepEl);

    function snapshot(el) {
      return {
        html: el ? el.innerHTML : '',
        text: el ? el.textContent.trim() : ''
      };
    }

    // Click handlers on both headers
    if (thSep) thSep.addEventListener('click', () => toggle());
    if (thMem) thMem.addEventListener('click', () => toggle());

    function toggle() {
      if (animating) return;
      animating = true;
      const toMem = !showingMem;
      showingMem = toMem;

      // Going back to Sep: снимаем --active у circleMem и убираем МЭМ-стиль
      // (красная заливка + линия) СРАЗУ, пока .f1-col-mem ещё видима.
      // Fade-out красного проигрывается параллельно со стиранием текста.
      if (!toMem) {
        if (circleMem) circleMem.classList.remove('f1-toggle-circle--active');
        wrap.classList.remove('f1-table-wrap--mem-styled');
      }

      // Get the visible cells (col 3 = "По отдельности" when showing sep, col 2 when showing МЭМ)
      const visibleColIdx = toMem ? 2 : 1; // currently visible column (0-indexed)
      const oldData = toMem ? sepData : memData;
      const newData = toMem ? memData : sepData;

      // Extra elements that animate alongside body rows:
      // - header title + sub (.f1-head-title / .f1-head-sub)
      // - footer main price + sub (.f1-price-mem|sep / .f1-price-sub)
      // Pack old/new pairs into a single list to keep erase/type flow compact
      const extras = [
        {
          oldEl: toMem ? titleSepEl : titleMemEl,
          newEl: toMem ? titleMemEl : titleSepEl,
          oldData: toMem ? titleSepData : titleMemData,
          newData: toMem ? titleMemData : titleSepData,
        },
        {
          oldEl: toMem ? subSepEl : subMemEl,
          newEl: toMem ? subMemEl : subSepEl,
          oldData: toMem ? subSepData : subMemData,
          newData: toMem ? subMemData : subSepData,
        },
        {
          oldEl: toMem ? priceSepEl : priceMemEl,
          newEl: toMem ? priceMemEl : priceSepEl,
          oldData: toMem ? priceSepData : priceMemData,
          newData: toMem ? priceMemData : priceSepData,
        },
        {
          oldEl: toMem ? priceSubSepEl : priceSubMemEl,
          newEl: toMem ? priceSubMemEl : priceSubSepEl,
          oldData: toMem ? priceSubSepData : priceSubMemData,
          newData: toMem ? priceSubMemData : priceSubSepData,
        },
      ];

      // Start erasing each cell simultaneously
      const cells = rows.map(r => r.cells[visibleColIdx]);
      const CHAR_DELAY = 18; // ms per character
      const PAUSE = 80; // pause between erase and type

      const erasePromises = cells.map((td, i) => {
        if (!td) return Promise.resolve();
        return animateErase(td, oldData[i].text, CHAR_DELAY);
      });
      // Header + footer extras erase in parallel with body
      const eraseExtras = extras.map(x =>
        x.oldEl ? animateErase(x.oldEl, x.oldData.text, CHAR_DELAY) : Promise.resolve()
      );

      Promise.all([...erasePromises, ...eraseExtras]).then(() => {
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

          // Clear new cells (body + all extras) so the original text
          // doesn't flash during PAUSE before typing starts
          newCells.forEach(td => { if (td) td.textContent = ''; });
          extras.forEach(x => { if (x.newEl) x.newEl.textContent = ''; });

          setTimeout(() => {
            const typePromises = newCells.map((td, i) => {
              if (!td) return Promise.resolve();
              return animateType(td, newData[i].text, newData[i].html, CHAR_DELAY);
            });
            const typeExtras = extras.map(x =>
              x.newEl
                ? animateType(x.newEl, x.newData.text, x.newData.html, CHAR_DELAY)
                : Promise.resolve()
            );

            Promise.all([...typePromises, ...typeExtras]).then(() => {
              // AFTER all typing is done — trigger the red fade-in on
              // the forward transition. Backward direction clears the
              // styled class at the very start of toggle() so the fade-out
              // runs while МЭМ column is still visible.
              if (toMem) {
                // Force reflow + rAF: МЭМ column only just unhid
                // (display:none → table-cell), and browsers can skip the
                // very first transition on freshly appeared elements.
                // Reading offsetHeight + waiting a frame guarantees the
                // initial state is committed before we flip the class.
                void wrap.offsetHeight;
                requestAnimationFrame(() => {
                  wrap.classList.add('f1-table-wrap--mem-styled');
                  if (circleMem) circleMem.classList.add('f1-toggle-circle--active');
                  animating = false;
                });
              } else {
                animating = false;
              }
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
