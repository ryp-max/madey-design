/* ── Nav scroll state ── */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Mobile menu ── */
const hamburger = document.querySelector('.nav-hamburger');
const navLinks  = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

/* ── Render product grid ── */
const grid = document.getElementById('productGrid');

PRODUCTS.forEach(p => {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-card-img">
      <img src="${p.image}" alt="${p.name}" loading="lazy"
           onerror="this.closest('.product-card-img').classList.add('placeholder'); this.remove();" />
    </div>
    <div class="product-card-body">
      <p class="product-card-category">${p.category}</p>
      <h3 class="product-card-name">${p.name}</h3>
      <p class="product-card-price">${p.price}</p>
    </div>
  `;
  card.addEventListener('click', () => openModal(p));
  grid.appendChild(card);
});

/* ── Modal ── */
const overlay    = document.getElementById('modalOverlay');
const modalImg   = document.getElementById('modalImg');
const modalCat   = document.getElementById('modalCategory');
const modalName  = document.getElementById('modalName');
const modalPrice = document.getElementById('modalPrice');
const modalDesc  = document.getElementById('modalDesc');
const modalDims  = document.getElementById('modalDims');
const modalCta   = document.getElementById('modalCta');
const closeBtn   = document.getElementById('modalClose');

function openModal(p) {
  modalImg.src = p.image;
  modalImg.alt = p.name;
  modalImg.closest('.modal-image-wrap').classList.remove('placeholder');
  modalCat.textContent   = p.category;
  modalName.textContent  = p.name;
  modalPrice.textContent = p.price;
  modalDesc.textContent  = p.description;
  modalDims.textContent  = p.dimensions;
  modalCta.href = `#contact`;

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  closeBtn.focus();
}

function closeModal() {
  overlay.hidden = true;
  document.body.style.overflow = '';
}

closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ── Contact form ── */
const form        = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = form.querySelector('button[type=submit]');
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
    } else {
      throw new Error('not ok');
    }
  } catch {
    // Fallback: open mailto
    const subject = encodeURIComponent(`Madey Design inquiry — ${data.interest || 'General'}`);
    const body    = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`);
    window.location.href = `mailto:hello@madey.com?subject=${subject}&body=${body}`;
    btn.textContent = 'send message';
    btn.disabled = false;
  }
});

/* ── Scroll reveal ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.product-card, .about-inner, .contact-inner').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 500ms ease, transform 500ms ease';
  observer.observe(el);
});
