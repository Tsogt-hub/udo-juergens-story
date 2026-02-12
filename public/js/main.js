// ============================================
// Die Udo Jürgens Story - Frontend JavaScript
// Professionelle Animationen & Interaktionen
// ============================================

(function () {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================
  // Debounce utility
  // ============================================
  function debounce(fn, delay) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  // ============================================
  // Mobile Navigation
  // ============================================
  function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', function () {
        const isOpen = navMenu.classList.contains('active');
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', !isOpen);
        navToggle.setAttribute('aria-label', isOpen ? 'Menü öffnen' : 'Menü schließen');
      });

      // Close menu when clicking a link
      navMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navMenu.classList.remove('active');
          navToggle.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.setAttribute('aria-label', 'Menü öffnen');
        });
      });

      // Close menu on Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
          navToggle.classList.remove('active');
          navToggle.focus();
        }
      });
    }
  }

  // ============================================
  // Navbar Scroll Effects (shrink + shadow)
  // ============================================
  function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let lastScroll = 0;
    let ticking = false;

    function updateNavbar() {
      const scrollY = window.scrollY;

      if (scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      if (scrollY > 200) {
        navbar.classList.add('shrink');
      } else {
        navbar.classList.remove('shrink');
      }

      lastScroll = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    }, { passive: true });
  }

  // ============================================
  // Hero Parallax Effect
  // ============================================
  function initParallax() {
    if (prefersReducedMotion) return;

    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;

    let ticking = false;

    function updateParallax() {
      const scrollY = window.scrollY;
      const heroHeight = document.querySelector('.hero').offsetHeight;

      if (scrollY <= heroHeight) {
        const translate = scrollY * 0.3;
        heroBg.style.transform = 'translate3d(0, ' + translate + 'px, 0)';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // ============================================
  // Scroll Reveal Animations
  // ============================================
  function initScrollReveal() {
    if (prefersReducedMotion) {
      // Show all elements immediately
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  // ============================================
  // Auto-apply reveal classes to elements
  // ============================================
  function applyRevealClasses() {
    // Section titles and dividers
    document.querySelectorAll('.section-title, .section-subtitle').forEach(function (el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
      }
    });

    document.querySelectorAll('.divider').forEach(function (el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal', 'reveal-scale');
      }
    });

    // About section
    document.querySelectorAll('.about-image, .artist-image-large').forEach(function (el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal', 'reveal-left');
      }
    });

    document.querySelectorAll('.about-text, .artist-bio').forEach(function (el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal', 'reveal-right');
      }
    });

    // Cards and list items with stagger
    var cardGroups = [
      '.termine-grid',
      '.kritiken-grid',
      '.gallery-grid',
      '.termine-list'
    ];

    cardGroups.forEach(function (selector) {
      var container = document.querySelector(selector);
      if (!container) return;
      container.classList.add('stagger-children');

      var children = container.children;
      for (var i = 0; i < children.length; i++) {
        if (!children[i].classList.contains('reveal')) {
          children[i].classList.add('reveal');
          children[i].style.setProperty('--stagger-index', i);
        }
      }
    });

    // Kontakt sections
    document.querySelectorAll('.kontakt-info').forEach(function (el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal', 'reveal-left');
      }
    });

    document.querySelectorAll('.kontakt-form-wrapper').forEach(function (el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal', 'reveal-right');
      }
    });

    // Presse content
    document.querySelectorAll('.presse-content').forEach(function (el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
      }
    });
  }

  // ============================================
  // Flash Messages
  // ============================================
  function initFlashMessages() {
    document.querySelectorAll('.flash').forEach(function (flash) {
      setTimeout(function () {
        flash.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        flash.style.opacity = '0';
        flash.style.transform = 'translateY(-15px)';
        setTimeout(function () {
          if (flash.parentNode) flash.remove();
        }, 400);
      }, 5000);
    });
  }

  // ============================================
  // Lightbox with Focus Trap & Keyboard Nav
  // ============================================
  let previousFocus = null;

  window.openLightbox = function (src) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    if (!lightbox || !img) return;

    previousFocus = document.activeElement;
    img.src = src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus close button
    const closeBtn = lightbox.querySelector('.lightbox-close');
    if (closeBtn) {
      setTimeout(function () { closeBtn.focus(); }, 100);
    }

    // Announce to screen readers
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Bildansicht vergrößert');
  };

  window.closeLightbox = function () {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    lightbox.classList.remove('active');
    document.body.style.overflow = '';

    // Return focus
    if (previousFocus) {
      previousFocus.focus();
      previousFocus = null;
    }
  };

  // Lightbox keyboard handling
  document.addEventListener('keydown', function (e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') {
      closeLightbox();
    }

    // Focus trap inside lightbox
    if (e.key === 'Tab') {
      const closeBtn = lightbox.querySelector('.lightbox-close');
      if (closeBtn) {
        e.preventDefault();
        closeBtn.focus();
      }
    }
  });

  // ============================================
  // Smooth page load
  // ============================================
  function initPageTransition() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.4s ease';

    requestAnimationFrame(function () {
      document.body.style.opacity = '1';
    });
  }

  // ============================================
  // Initialize everything
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    initPageTransition();
    initNavigation();
    initNavbarScroll();
    initParallax();
    applyRevealClasses();
    initScrollReveal();
    initFlashMessages();
  });

})();
