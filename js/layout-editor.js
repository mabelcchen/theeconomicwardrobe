// The Economic Wardrobe — Free Layout Editor
// Drag, resize and reposition any element on the magazine pages.

(function () {

  let layoutActive = false;
  let selected     = null;
  let dragState    = null;  // { el, startX, startY, origLeft, origTop }
  let resizeState  = null;  // { el, startX, startY, origW, origH }

  // ── Public API ──────────────────────────────────────────────
  window.initLayoutEditor  = initLayout;
  window.exitLayoutEditor  = exitLayout;

  // ── Init: freeze each page half and make elements draggable ─
  function initLayout() {
    if (layoutActive) return;
    layoutActive = true;

    document.querySelectorAll('.mag-page-left, .mag-page-right').forEach(page => {
      // Lock the page height so it doesn't collapse when children go absolute
      const h = page.getBoundingClientRect().height;
      page.style.minHeight = h + 'px';
      page.style.position  = 'relative';

      // Convert each direct and nested editable + image block
      const targets = page.querySelectorAll(
        '.editable, .img-placeholder--page, .img-placeholder--inline, ' +
        '.img-placeholder--closing, .img-placeholder--mag-wide, ' +
        '.page-img, .spread1-title-overlay, .spread3-caption, ' +
        '.mag-pull-quote, .spread2-pullquote, .spread3-pullquote, ' +
        '.lede, .byline-block, .body-col, .inline-img-wrap, .closing-img'
      );

      targets.forEach(el => {
        // Skip elements already wrapped / already absolute
        if (el.dataset.layoutManaged) return;
        if (getComputedStyle(el).position === 'absolute') return;

        // Capture current position relative to the page container
        const pageRect = page.getBoundingClientRect();
        const elRect   = el.getBoundingClientRect();

        const leftPct = ((elRect.left - pageRect.left) / pageRect.width  * 100).toFixed(2);
        const topPct  = ((elRect.top  - pageRect.top)  / pageRect.height * 100).toFixed(2);
        const wPct    = (elRect.width                  / pageRect.width  * 100).toFixed(2);

        el.style.position = 'absolute';
        el.style.left     = leftPct + '%';
        el.style.top      = topPct  + '%';
        el.style.width    = wPct    + '%';
        el.style.margin   = '0';
        el.style.zIndex   = '1';
        el.dataset.layoutManaged = '1';

        addDragHandle(el, page);
        addResizeHandle(el);
      });
    });

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('mousemove', onDocMouseMove);
    document.addEventListener('mouseup',   onDocMouseUp);

    showLayoutHint();
  }

  function exitLayout() {
    if (!layoutActive) return;
    layoutActive = false;
    deselect();

    document.querySelectorAll('[data-layout-managed]').forEach(el => {
      // Remove handles
      el.querySelectorAll('.layout-drag-handle, .layout-resize-handle').forEach(h => h.remove());
      delete el.dataset.layoutManaged;
    });

    document.removeEventListener('mousedown', onDocMouseDown);
    document.removeEventListener('mousemove', onDocMouseMove);
    document.removeEventListener('mouseup',   onDocMouseUp);

    hideLayoutHint();
  }

  // ── Drag handle (top-left grip) ──────────────────────────────
  function addDragHandle(el, page) {
    const handle = document.createElement('div');
    handle.className = 'layout-drag-handle';
    handle.title = 'Drag to move';
    handle.innerHTML = '⠿';
    el.appendChild(handle);

    handle.addEventListener('mousedown', e => {
      e.stopPropagation();
      e.preventDefault();
      select(el);

      const pageRect = page.getBoundingClientRect();
      dragState = {
        el,
        page,
        pageRect,
        startX:   e.clientX,
        startY:   e.clientY,
        origLeft: parseFloat(el.style.left),
        origTop:  parseFloat(el.style.top),
      };
    });
  }

  // ── Resize handle (bottom-right corner) ─────────────────────
  function addResizeHandle(el) {
    const handle = document.createElement('div');
    handle.className = 'layout-resize-handle';
    handle.title = 'Drag to resize';
    el.appendChild(handle);

    handle.addEventListener('mousedown', e => {
      e.stopPropagation();
      e.preventDefault();
      select(el);

      const pageEl   = el.closest('.mag-page-left, .mag-page-right');
      const pageRect = pageEl.getBoundingClientRect();
      resizeState = {
        el,
        pageRect,
        startX: e.clientX,
        startY: e.clientY,
        origW:  parseFloat(el.style.width),
        origH:  el.getBoundingClientRect().height,
      };
    });
  }

  // ── Mouse move: handle drag and resize ──────────────────────
  function onDocMouseMove(e) {
    if (dragState) {
      const { el, pageRect, startX, startY, origLeft, origTop } = dragState;
      const dx = (e.clientX - startX) / pageRect.width  * 100;
      const dy = (e.clientY - startY) / pageRect.height * 100;
      el.style.left = (origLeft + dx).toFixed(2) + '%';
      el.style.top  = (origTop  + dy).toFixed(2) + '%';
    }

    if (resizeState) {
      const { el, pageRect, startX, startY, origW, origH } = resizeState;
      const dx = (e.clientX - startX) / pageRect.width  * 100;
      const dy = (e.clientY - startY) / pageRect.height * 100;
      const newW = Math.max(5, origW + dx);
      const newH = Math.max(20, origH + dy);
      el.style.width  = newW.toFixed(2) + '%';
      el.style.height = newH.toFixed(2) + 'px';
    }
  }

  function onDocMouseUp() {
    dragState   = null;
    resizeState = null;
  }

  // ── Selection ────────────────────────────────────────────────
  function onDocMouseDown(e) {
    if (!layoutActive) return;
    const el = e.target.closest('[data-layout-managed]');
    if (el) { select(el); return; }
    // Clicked outside any managed element
    if (!e.target.closest('.layout-drag-handle, .layout-resize-handle')) {
      deselect();
    }
  }

  function select(el) {
    deselect();
    selected = el;
    el.classList.add('layout-selected');
  }

  function deselect() {
    if (selected) selected.classList.remove('layout-selected');
    selected = null;
  }

  // ── Hint bar ─────────────────────────────────────────────────
  function showLayoutHint() {
    let hint = document.getElementById('layoutHint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'layoutHint';
      hint.innerHTML = '⠿ Drag the grip to move &nbsp;|&nbsp; ◢ Drag the corner to resize &nbsp;|&nbsp; Click text to edit';
      document.getElementById('editBanner')?.after(hint);
    }
    hint.style.display = 'block';
  }

  function hideLayoutHint() {
    const hint = document.getElementById('layoutHint');
    if (hint) hint.style.display = 'none';
  }

})();
