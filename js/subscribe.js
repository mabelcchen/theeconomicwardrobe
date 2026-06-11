document.addEventListener('DOMContentLoaded', () => {

  const style = document.createElement('style');
  style.textContent = `
    #subscribeModal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      align-items: center;
      justify-content: center;
    }
    #subscribeModal.open { display: flex; }

    .sub-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(5px);
    }

    .sub-card {
      position: relative;
      background: #f5f0e8;
      width: 400px;
      max-width: 90vw;
      padding: 52px 44px 44px;
      text-align: center;
      box-shadow: 0 32px 80px rgba(0,0,0,0.5);
      animation: subFadeIn 0.3s ease;
    }

    @keyframes subFadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .sub-close {
      position: absolute;
      top: 14px; right: 18px;
      background: none;
      border: none;
      font-size: 1.3rem;
      color: #aaa;
      cursor: pointer;
      line-height: 1;
    }
    .sub-close:hover { color: #111; }

    .sub-eyebrow {
      font-family: 'Inter', sans-serif;
      font-size: 0.58rem;
      font-weight: 400;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 12px;
    }

    .sub-heading {
      font-family: 'Playfair Display', serif;
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1.2;
      color: #111;
      margin-bottom: 14px;
    }

    .sub-body {
      font-family: 'Playfair Display', serif;
      font-size: 0.85rem;
      line-height: 1.7;
      color: #666;
      margin-bottom: 26px;
    }

    .sub-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .sub-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #ccc;
      background: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      color: #111;
      outline: none;
      box-sizing: border-box;
    }
    .sub-input:focus { border-color: #111; }

    .sub-btn {
      width: 100%;
      padding: 13px;
      background: #111;
      color: #f5f0e8;
      border: none;
      font-family: 'Inter', sans-serif;
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      cursor: pointer;
    }
    .sub-btn:hover { background: #333; }

    .sub-note {
      margin-top: 14px;
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 0.82rem;
      color: #888;
      opacity: 0;
      transition: opacity 0.4s;
      min-height: 1.2em;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.id = 'subscribeModal';
  modal.innerHTML = `
    <div class="sub-backdrop"></div>
    <div class="sub-card">
      <button class="sub-close" aria-label="Close">&times;</button>
      <p class="sub-eyebrow">The Economic Wardrobe</p>
      <h2 class="sub-heading">History repeats.<br>So be ready.</h2>
      
      <form class="sub-form" onsubmit="handleSubscribe(event)">
        <input class="sub-input" type="email" placeholder="your@email.com" required />
        <button class="sub-btn" type="submit">Notify me</button>
      </form>
      <p class="sub-note" id="subNote"></p>
    </div>
  `;
  document.body.appendChild(modal);

  document.querySelectorAll('a').forEach(a => {
    if (a.textContent.trim().toLowerCase() === 'subscribe') {
      a.href = '#';
      a.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('subscribeModal').classList.add('open');
      });
    }
  });

  modal.querySelector('.sub-backdrop').addEventListener('click', closeModal);
  modal.querySelector('.sub-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});

function closeModal() {
  const m = document.getElementById('subscribeModal');
  if (m) m.classList.remove('open');
}

async function handleSubscribe(e) {
  e.preventDefault();
  const note = document.getElementById('subNote');
  const input = document.querySelector('.sub-input');
  const btn = document.querySelector('.sub-btn');

  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    const res = await fetch('https://formspree.io/f/mwvjnbvd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: input.value })
    });

    if (res.ok) {
      note.textContent = "You're on the list. We'll be in touch.";
      note.style.opacity = '1';
      setTimeout(closeModal, 2400);
    } else {
      note.textContent = "Something went wrong. Try again.";
      note.style.opacity = '1';
      btn.textContent = 'Notify me';
      btn.disabled = false;
    }
  } catch {
    note.textContent = "Something went wrong. Try again.";
    note.style.opacity = '1';
    btn.textContent = 'Notify me';
    btn.disabled = false;
  }
}
