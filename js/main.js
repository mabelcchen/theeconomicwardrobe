// The Economic Wardrobe — main.js

// Highlight active nav link based on current page
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.main-nav a');
  links.forEach(link => {
    if (link.href === window.location.href) {
      link.style.color = '#1a1a1a';
      link.style.fontWeight = '600';
    }
  });
});
