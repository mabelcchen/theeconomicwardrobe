// The Economic Wardrobe — Editor + Spread Navigator

// ── Edit banner: only visible with ?edit=<password> in the URL ─
const EDIT_PASSWORD = 'wardrobe2024'; // change this to whatever you want
const params = new URLSearchParams(window.location.search);
if (params.get('edit') !== EDIT_PASSWORD) {
  document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('editBanner');
    if (banner) banner.style.display = 'none';
  });
}

// ── Spread navigation — horizontal slide ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const spreads = document.querySelectorAll('.mag-spread');
  const dots    = document.querySelectorAll('.mag-dot');
  const prev    = document.getElementById('magPrev');
  const next    = document.getElementById('magNext');
  let current   = 0;
  let turning   = false;
  const DURATION = 550;
  const EASING   = 'cubic-bezier(0.77, 0, 0.175, 1)';

  function goTo(n, direction) {
    if (turning || n === current) return;
    turning = true;

    const out = spreads[current];
    const inn = spreads[n];
    const fwd = direction === 'next';

    // Incoming starts off-screen left or right
    inn.style.cssText = `display:grid; position:absolute; inset:0; width:100%; z-index:3; transform:translateX(${fwd ? '100%' : '-100%'});`;
    out.style.cssText = `display:grid; position:absolute; inset:0; width:100%; z-index:2;`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inn.style.transition = `transform ${DURATION}ms ${EASING}`;
        inn.style.transform  = 'translateX(0)';
        out.style.transition = `transform ${DURATION}ms ${EASING}`;
        out.style.transform  = `translateX(${fwd ? '-100%' : '100%'})`;
      });
    });

    setTimeout(() => {
      out.style.cssText = '';
      out.classList.remove('active');
      inn.style.cssText = '';
      inn.classList.add('active');

      dots[current]?.classList.remove('active');
      current = n;
      dots[current]?.classList.add('active');
      prev.classList.toggle('hidden', current === 0);
      next.classList.toggle('hidden', current === spreads.length - 1);
      turning = false;
    }, DURATION + 40);
  }

  prev?.addEventListener('click', () => { if (current > 0) goTo(current - 1, 'prev'); });
  next?.addEventListener('click', () => { if (current < spreads.length - 1) goTo(current + 1, 'next'); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    if (i !== current) goTo(i, i > current ? 'next' : 'prev');
  }));

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && current < spreads.length - 1) goTo(current + 1, 'next');
    if (e.key === 'ArrowLeft'  && current > 0)                  goTo(current - 1, 'prev');
  });

  // Init
  prev.classList.add('hidden');
  spreads[0].classList.add('active');
  dots[0]?.classList.add('active');
});

// ── Editing toggle ─────────────────────────────────────────────
function toggleEdit() {
  const body    = document.body;
  const btn     = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const fields  = document.querySelectorAll('.editable');
  const active  = body.classList.toggle('editing-mode');

  fields.forEach(el => { el.contentEditable = active ? 'true' : 'false'; });
  btn.textContent = active ? 'Done Editing' : 'Enable Editing';
  btn.classList.toggle('active', active);
  if (saveBtn) saveBtn.style.display = active ? 'inline-block' : 'none';
}

// ── Save to file ────────────────────────────────────────────────
async function saveToFile() {
  const saveBtn = document.getElementById('saveBtn');
  const fields  = document.querySelectorAll('.editable[data-save-id]');
  const payload = {};

  fields.forEach(el => {
    payload[el.dataset.saveId] = el.innerHTML;
  });

  saveBtn.textContent = 'Saving…';
  saveBtn.disabled = true;

  try {
    const res = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: EDIT_PASSWORD,
        file:     window.location.pathname.replace(/^\//, '') || 'index.html',
        fields:   payload
      })
    });

    const data = await res.json();
    if (res.ok) {
      saveBtn.textContent = '✓ Saved!';
      setTimeout(() => { saveBtn.textContent = 'Save'; saveBtn.disabled = false; }, 2000);
    } else {
      saveBtn.textContent = 'Error — try again';
      saveBtn.disabled = false;
    }
  } catch (e) {
    saveBtn.textContent = 'Error — is server.py running?';
    saveBtn.disabled = false;
    setTimeout(() => { saveBtn.textContent = 'Save'; saveBtn.disabled = false; }, 3000);
  }
}
