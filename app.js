/* ── Nav ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('solid', window.scrollY > 60);
}, { passive: true });

/* ── Mobile menu ── */
const hamburger   = document.querySelector('.nav-hamburger');
const mobileMenu  = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');

hamburger.addEventListener('click', () => { mobileMenu.hidden = false; });
mobileClose.addEventListener('click', () => { mobileMenu.hidden = true; });
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => { mobileMenu.hidden = true; });
});

/* ── Build product grid ── */
const grid = document.getElementById('shopGrid');

PRODUCTS.forEach((p, i) => {
  const item = document.createElement('div');
  item.className = 'item';
  item.innerHTML = `
    <div class="item-img-wrap img-wrap">
      <img src="${p.image}" alt="${p.name}" loading="${i < 3 ? 'eager' : 'lazy'}"
           onerror="this.closest('.item-img-wrap').classList.add('no-img'); this.remove();" />
    </div>
    <div class="item-info">
      <p class="item-name">${p.name}</p>
      <p class="item-price">${p.price}</p>
    </div>
  `;
  item.addEventListener('click', () => openLightbox(i));
  grid.appendChild(item);
});

/* ── Lightbox ── */
const lightbox = document.getElementById('lightbox');
const lbImg    = document.getElementById('lbImg');
const lbName   = document.getElementById('lbName');
const lbPrice  = document.getElementById('lbPrice');
const lbDesc   = document.getElementById('lbDesc');
const lbDims   = document.getElementById('lbDims');
const lbCta    = document.getElementById('lbCta');
const lbClose  = document.getElementById('lbClose');
const lbPrev   = document.getElementById('lbPrev');
const lbNext   = document.getElementById('lbNext');
let current = 0;

function openLightbox(index) {
  current = index;
  renderLightbox();
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
}

function renderLightbox() {
  const p = PRODUCTS[current];
  lbImg.src = p.image;
  lbImg.alt = p.name;
  lbName.textContent  = p.name;
  lbPrice.textContent = p.price;
  lbDesc.textContent  = p.description;
  lbDims.textContent  = p.dimensions;
  lbCta.href = '#contact';
}

lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

lbPrev.addEventListener('click', e => {
  e.stopPropagation();
  current = (current - 1 + PRODUCTS.length) % PRODUCTS.length;
  renderLightbox();
});
lbNext.addEventListener('click', e => {
  e.stopPropagation();
  current = (current + 1) % PRODUCTS.length;
  renderLightbox();
});

document.addEventListener('keydown', e => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') { current = (current - 1 + PRODUCTS.length) % PRODUCTS.length; renderLightbox(); }
  if (e.key === 'ArrowRight') { current = (current + 1) % PRODUCTS.length; renderLightbox(); }
});

lbCta.addEventListener('click', closeLightbox);

/* ── Contact form ── */
const form        = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = form.querySelector('.submit-btn');
  btn.textContent = 'sending...';
  btn.disabled = true;

  const data = Object.fromEntries(new FormData(form));

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      form.hidden = true;
      formSuccess.hidden = false;
    } else throw new Error();
  } catch {
    const subject = encodeURIComponent(`Madey Design — ${data.interest || 'Inquiry'}`);
    const body    = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`);
    window.location.href = `mailto:hello@madey.com?subject=${subject}&body=${body}`;
    btn.textContent = 'send →';
    btn.disabled = false;
  }
});

/* ── Scroll reveal ── */
const reveal = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.style.opacity = '1';
    e.target.style.transform = 'translateY(0)';
    reveal.unobserve(e.target);
  });
}, { threshold: 0.06 });

document.querySelectorAll('.about, .contact-inner').forEach(el => {
  el.style.cssText += 'opacity:0;transform:translateY(20px);transition:opacity 600ms ease,transform 600ms ease;';
  reveal.observe(el);
});
