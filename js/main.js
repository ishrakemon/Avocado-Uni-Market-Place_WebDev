// ============================================
// AVOCADO - Main Module
// General utilities and helper functions used across all pages
// ============================================

// Listen for clicks anywhere on the page
document.addEventListener('click', function(event) {
  // If user clicks outside a modal (on the dark background), close it
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
});

// Listen for keyboard presses
document.addEventListener('keydown', function(event) {
  // If user presses Escape key, close all open modals
  if (event.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(modal => {
      modal.classList.remove('active');
    });
  }
});

// Run different code depending on which page user is on
function initPageSpecificScripts() {
  // Get the current page URL
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('marketplace.html')) {
    // Run marketplace-specific code here
  } else if (currentPage.includes('quad.html')) {
    // Run Q&A page-specific code here
  } else if (currentPage.includes('dorm-alerts.html')) {
    // Run dorm alerts page-specific code here
  } else if (currentPage.includes('messages.html')) {
    // Run messages page-specific code here
  }
}

// Run initialization code when page is fully loaded
document.addEventListener('DOMContentLoaded', initPageSpecificScripts);

// Convert number to US dollar format (e.g., $25.99)
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Convert date string to readable format (e.g., "Jan 28, 2026")
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Utility: Truncate text
function truncateText(text, length) {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

// Utility: Debounce function
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Service Worker registration for PWA (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Service worker registration would go here
  });
}

console.log('Avocado Platform Initialized');
