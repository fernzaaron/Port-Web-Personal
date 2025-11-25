// Smooth scroll for internal links
document.querySelectorAll('a[href^=\"#\"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');
if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close nav on resize to large screens
  window.addEventListener('resize', () => {
    if (window.innerWidth > 800 && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// subtle parallax for background on mousemove (only when reduced motion not set)
if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const root = document.documentElement;
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    const w = window.innerWidth, h = window.innerHeight;
    mouseX = (e.clientX / w) - 0.5;
    mouseY = (e.clientY / h) - 0.5;
    // apply a small transform to body pseudo elements via CSS variables
    root.style.setProperty('--mx', (mouseX * 6).toFixed(2) + 'px');
    root.style.setProperty('--my', (mouseY * 6).toFixed(2) + 'px');
  });
  // reset on leave
  window.addEventListener('mouseleave', () => { root.style.setProperty('--mx', '0px'); root.style.setProperty('--my', '0px'); });
}

// Entrance animations: stagger elements on first load
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function animateOnLoad() {
  if (prefersReducedMotion()) return;

  const seq = [];
  // Elements to animate, ordered
  const heroLeft = document.querySelector('.hero-left');
  const heroRight = document.querySelector('.hero-right');
  const brand = document.querySelector('.brand');
  const sideLinks = Array.from(document.querySelectorAll('.side-links a'));
  const projectCards = Array.from(document.querySelectorAll('.project-card'));
  const footerCols = Array.from(document.querySelectorAll('.footer .col'));
  const nav = document.querySelector('.nav');
  const navLinks = Array.from(document.querySelectorAll('.links a'));
  const sections = Array.from(document.querySelectorAll('.section'));
  const headings = Array.from(document.querySelectorAll('.section h2, .hero h1'));
  const heroImg = document.querySelector('.hero-img');
  const blobs = Array.from(document.querySelectorAll('.bg-anim .blob'));

  // Order: brand -> nav -> side links -> hero content -> hero image -> sections/headings -> project cards -> footer
  if (brand) seq.push(brand);
  if (nav) seq.push(nav);
  seq.push(...navLinks.slice(0, 6));
  seq.push(...sideLinks);
  if (heroLeft) seq.push(heroLeft);
  if (heroRight) seq.push(heroRight);
  if (heroImg) seq.push(heroImg);
  seq.push(...headings.slice(0, 8));
  seq.push(...sections.slice(0, 8));
  seq.push(...projectCards.slice(0, 8)); // limit for perf
  seq.push(...footerCols);
  // subtle pop for blobs
  seq.push(...blobs.slice(0, 4));

  // Add initial class so CSS sets initial transform/opacity
  seq.forEach(el => el && el.classList.add('will-animate'));

  // Stagger applying the active class using requestAnimationFrame for smoother paint timing
  seq.forEach((el, i) => {
    if (!el) return;
    const delay = 100 + i * 70; // tighter stagger for smoother flow
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        el.classList.add('animate-in');
        el.classList.remove('will-animate');
      });
    }, delay);
  });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  window.setTimeout(animateOnLoad, 120);
} else {
  document.addEventListener('DOMContentLoaded', () => window.setTimeout(animateOnLoad, 120));
}

/* Chat widget behavior (client-side, mock assistant with navigation commands) */
(function(){
  console.log('[chat-widget] initializing');
  const widget = document.querySelector('.chat-widget');
  if (!widget) {
    console.log('[chat-widget] no widget found on this page');
    return;
  }
  const toggle = widget.querySelector('.chat-toggle');
  const panel = widget.querySelector('.chat-panel');
  const messages = widget.querySelector('.chat-messages');
  const input = widget.querySelector('.chat-input');
  const send = widget.querySelector('.chat-send');

  function pushMessage(text, role='assistant'){
    const el = document.createElement('div');
    el.className = 'chat-message ' + (role==='user' ? 'user' : 'assistant');
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function mockReply(userText){
    const txt = (userText||'').trim().toLowerCase();
    // simple command parsing
    if (!txt) return pushMessage("Please type a question or command. Try 'Go to Projects' or 'Help'.");
    if (txt.includes('help')){
      return pushMessage("Commands: 'Go to Projects', 'Go Home', 'Show Projects', 'Open GitHub', 'Contact'.");
    }
    if (txt.includes('go to projects') || txt.includes('go projects') || txt.includes('open projects')){
      pushMessage('Opening Projects page...');
      window.setTimeout(()=> window.location.href = '/projects', 600);
      return;
    }
    if (txt.includes('show projects')){
      pushMessage('Scrolling to projects on this page...');
      const el = document.getElementById('projects');
      if (el) setTimeout(()=> el.scrollIntoView({behavior:'smooth'}), 400);
      return;
    }
    if (txt.includes('go home') || txt === 'home' || txt.includes('go to home')){
      pushMessage('Taking you home...');
      window.setTimeout(()=> window.location.href = '/', 600);
      return;
    }
    if (txt.includes('open github') || txt.includes('github')){
      pushMessage('Opening GitHub profile...');
      window.open('https://github.com/fernzaaron', '_blank');
      return;
    }
    // fallback canned responses
    pushMessage("I can help navigate this site. Try 'Help' to see commands, or ask about projects.");
  }

  toggle.addEventListener('click', ()=>{
    const open = widget.classList.toggle('open');
    panel.setAttribute('aria-hidden', String(!open));
    if (open) { input.focus(); }
  });

  send.addEventListener('click', ()=>{
    const val = input.value.trim();
    if (!val) return;
    pushMessage(val, 'user');
    input.value = '';
    // small typing delay
    setTimeout(()=> mockReply(val), 450);
  });

  input.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') { e.preventDefault(); send.click(); }
  });

  // ephemeral welcome message
  setTimeout(()=> pushMessage('Hi — I can help navigate the site. Try typing "Help".'), 900);
})();

/* Scroll reveal and parallax on scroll */
(function(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // IntersectionObserver for reveal-on-scroll elements
  const revealEls = Array.from(document.querySelectorAll('.reveal-on-scroll'));
  if (revealEls.length) {
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => obs.observe(el));
  }

  // Parallax: elements with [data-parallax] and background blobs
  const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
  const blobs = Array.from(document.querySelectorAll('.bg-anim .blob'));

  let ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      const scrollY = window.scrollY || window.pageYOffset;
      const vh = window.innerHeight;

      // Update parallax elements
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
        const rect = el.getBoundingClientRect();
        // distance from viewport center
        const offset = (rect.top + rect.height/2) - (vh/2);
        const translate = -offset * speed;
        el.style.setProperty('--parallax', `${translate.toFixed(2)}px`);
      });

      // subtle blob movement on scroll for depth
      blobs.forEach((b, i) => {
        const factor = 0.03 + (i * 0.015);
        const t = (scrollY * factor).toFixed(2);
        b.style.transform = `translateY(${t}px) scale(1)`;
      });

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // initial tick
  onScroll();
})();
