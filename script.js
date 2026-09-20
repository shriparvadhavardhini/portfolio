/* =========================================================
   SHRI — portfolio script (vanilla JS, no libraries)
   1. Helpers            2. Theme toggle
   3. Loading screen      4. Navigation
   5. Scroll progress + reveal
   6. Custom cursor      7. Character parallax
   8. 3D card tilt       9. Particles
   10. Project modal      11. Misc
   ========================================================= */

(function () {
  'use strict';

  /* ---------- 1. HELPERS ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const isTouch = window.matchMedia('(hover: none)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  $('#year').textContent = new Date().getFullYear();

  /* ---------- 2. THEME TOGGLE ---------- */
  const THEME_KEY = 'shri-theme';
  const root = document.documentElement;
  const themeToggle = $('#themeToggle');

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
      themeToggle.classList.toggle('is-light', theme === 'light');
    }
  }

  // the initial theme was already applied pre-paint by the inline script in
  // <head> (to avoid a flash); this just makes sure the toggle icon/label match.
  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* storage unavailable */ }
    });
  }

  /* ---------- 3. LOADING SCREEN ---------- */
  const loader = $('#loader');
  const loaderBar = $('#loaderBar');
  let pct = 0;

  const tick = setInterval(() => {
    pct = Math.min(100, pct + Math.random() * 18 + 8);
    loaderBar.style.width = pct + '%';
    if (pct >= 100) clearInterval(tick);
  }, 110);

  function hideLoader() {
    loaderBar.style.width = '100%';
    clearInterval(tick);
    setTimeout(() => loader.classList.add('is-done'), 300);
  }
  window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 2000); // safety net so it never hangs

  /* ---------- 4. NAVIGATION ---------- */
  const nav       = $('#nav');
  const navLinks  = $('#navLinks');
  const burger    = $('#burger');
  const links     = $$('#navLinks a');

  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });

  links.forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  // active section indicator
  const sections = $$('section[id]');
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)
      );
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => navObserver.observe(s));

  /* ---------- 5. SCROLL PROGRESS + REVEAL ---------- */
  const progress = $('#progress');

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    nav.classList.toggle('is-stuck', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((e, i) => {
      if (!e.isIntersecting) return;
      setTimeout(() => e.target.classList.add('is-in'), i * 90);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- 6. CUSTOM CURSOR (desktop only) ---------- */
  const dot  = $('#cursorDot');
  const ring = $('#cursorRing');

  if (isTouch || reduced) {
    document.body.classList.add('no-cursor');
  } else {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    (function loop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      dot.style.transform  = `translate(${mx}px, ${my}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();

    $$('a, button, .card, .project, .social__card, .character').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-big'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-big'));
    });
  }

  /* ---------- 7. CHARACTER PARALLAX ---------- */
  const character = $('#character');
  const stage     = $('#heroStage');
  const depthEls  = $$('[data-depth]');

  if (character && !isTouch && !reduced) {
    let tx = 0, ty = 0, cx = 0, cy = 0, scrollShift = 0, curShift = 0;

    window.addEventListener('mousemove', e => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 .. 1
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('scroll', () => {
      scrollShift = Math.min(window.scrollY * 0.08, 70);
    }, { passive: true });

    (function animate() {
      cx = lerp(cx, tx, 0.07);
      cy = lerp(cy, ty, 0.07);
      curShift = lerp(curShift, scrollShift, 0.08);

      character.style.transform =
        `translate3d(${cx * 16}px, ${cy * 10 + curShift}px, 0)` +
        ` rotateY(${cx * 7}deg) rotateX(${-cy * 4}deg)`;

      depthEls.forEach(el => {
        const d = parseFloat(el.dataset.depth) || 0.05;
        el.style.transform = `translate3d(${-cx * d * 260}px, ${-cy * d * 180}px, 0)`;
      });

      requestAnimationFrame(animate);
    })();

    // gentle hover lift on the character itself
    stage.addEventListener('mouseenter', () => { character.style.scale = '1.03'; });
    stage.addEventListener('mouseleave', () => { character.style.scale = '1'; });
  }

  /* ---------- 8. 3D CARD TILT ---------- */
  if (!isTouch && !reduced) {
    $$('[data-tilt]').forEach(card => {
      let raf = null;

      card.style.transition = 'transform .5s cubic-bezier(.22,.8,.28,1)';

      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width  - 0.5;
        const py = (e.clientY - r.top)  / r.height - 0.5;

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transition = 'transform .12s linear';
          card.style.transform =
            `perspective(900px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg) translateZ(14px)`;
        });
      });

      card.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transition = 'transform .6s cubic-bezier(.22,.8,.28,1)';
        card.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateZ(0)';
      });
    });
  }

  /* ---------- 9. PARTICLES (hero canvas) ---------- */
  const canvas = $('#particles');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    let w, h, dots = [];

    function size() {
      const r = canvas.getBoundingClientRect();
      w = canvas.width  = r.width;
      h = canvas.height = r.height;
      const count = Math.min(70, Math.round(w / 22));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.5,
        vy: -(Math.random() * 0.24 + 0.06),
        vx: (Math.random() - 0.5) * 0.14,
        a: Math.random() * 0.5 + 0.15
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      dots.forEach(d => {
        d.y += d.vy; d.x += d.vx;
        if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,196,0,${d.a})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    size();
    draw();
    window.addEventListener('resize', size);
  }

  /* ---------- 10. PROJECT MODAL ---------- */
  /* Edit project details here. */
  const PROJECTS = {
    priorityx: {
      title: 'PriorityX',
      image: 'assets/project1.jpg',
      desc: 'A product ordering site that sorts deliveries by how urgent they are, not by who clicked first. Customers set a priority when they order, and the dashboard re-sequences the queue in real time so critical items move to the front.',
      tech: ['HTML', 'CSS', 'JavaScript', 'Python Flask'],
      features: [
        'Priority-based ordering queue with live re-sorting',
        'Customer dashboard for tracking order status',
        'Admin view for managing and reassigning deliveries',
        'Responsive layout that works down to 375px'
      ],
      link: 'https://github.com/your-username/priorityx'
    },
    mediflow: {
      title: 'MediFlow',
      image: 'assets/project2.jpg',
      desc: 'A healthcare appointment booking interface designed around one goal: let a patient find a doctor, pick a slot and confirm in under a minute. The visual language is deliberately quiet — clinics are stressful enough.',
      tech: ['HTML', 'CSS', 'JavaScript', 'Python Flask', 'SQLite'],
      features: [
        'Doctor search with speciality and availability filters',
        'Calendar slot picker with double-booking protection',
        'Appointment history stored in SQLite',
        'Clear confirmation and cancellation flows'
      ],
      link: 'https://github.com/your-username/mediflow'
    },
    portfolio: {
      title: 'Creative portfolio',
      image: 'assets/project3.jpg',
      desc: 'This site. A character-led 3D portfolio built with nothing but HTML, CSS and vanilla JavaScript — no frameworks, no build step. Every effect is hand-written: the tilt, the parallax, the particle field and the modal you are reading now.',
      tech: ['HTML', 'CSS', 'JavaScript'],
      features: [
        'Mouse-driven character parallax with smooth easing',
        'Cursor-following 3D tilt on every card',
        'IntersectionObserver scroll reveals and active nav state',
        'Fully responsive from 1920px down to 375px',
        'Reduced-motion support for accessibility'
      ],
      link: 'https://github.com/your-username/portfolio'
    }
  };

  const modal     = $('#modal');
  const modalImg  = $('#modalImg');
  const modalTags = $('#modalTags');
  const modalFeat = $('#modalFeatures');
  let lastFocused = null;

  function openModal(key) {
    const p = PROJECTS[key];
    if (!p) return;

    lastFocused = document.activeElement;
    $('#modalTitle').textContent = p.title;
    $('#modalDesc').textContent  = p.desc;
    modalImg.src = p.image;
    modalImg.alt = p.title + ' preview';
    modalTags.innerHTML = p.tech.map(t => `<li>${t}</li>`).join('');
    modalFeat.innerHTML = p.features.map(f => `<li>${f}</li>`).join('');
    $('#modalLink').href = p.link;

    modal.hidden = false;
    document.body.classList.add('is-locked');
    $('.modal__close').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocused) lastFocused.focus();
  }

  $$('.project').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.project));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.project); }
    });
  });

  $$('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  /* ---------- 11. MISC ---------- */
  // smooth scroll fallback for browsers without CSS scroll-behavior
  if (!('scrollBehavior' in document.documentElement.style)) {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = $(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 70 });
      });
    });
  }

  // small floating character near the projects section
  const peek = $('#projectsPeek');
  if (peek && !reduced) {
    window.addEventListener('scroll', () => {
      const r = peek.parentElement.getBoundingClientRect();
      const t = Math.max(-1, Math.min(1, r.top / window.innerHeight));
      peek.style.transform = `translateY(${t * 40}px)`;
    }, { passive: true });
  }
})();
