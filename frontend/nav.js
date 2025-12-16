// Navigation functionality for Supplier, Buyer, Analytics
// - Highlights active nav link based on current path
// - Provides click handlers (progressive enhancement)

(function(){
  function setActive() {
    const path = location.pathname.replace(/\/?$/, '');
    const links = document.querySelectorAll('header nav a');
    links.forEach(a => {
      const href = a.getAttribute('href');
      const normalized = (href || '').replace(/\/?$/, '');
      const isActive = normalized === path || (path === '' && normalized === '/');
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function attachHandlers() {
    const links = document.querySelectorAll('header nav a');
    links.forEach(a => {
      a.addEventListener('click', (e) => {
        // Let normal navigation occur; this is here if we later want SPA behavior
        // For now, ensure proper highlighting after navigation
      });
    });
  }

  window.initNav = function initNav(){
    setActive();
    attachHandlers();
  };

  // Auto-init when DOM is ready, but allow explicit calls too
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
