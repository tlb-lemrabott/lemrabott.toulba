document.addEventListener("DOMContentLoaded", () => {
  const listItems = document.querySelectorAll(".profile .card ul li");
  listItems.forEach((li, index) => {
    li.style.animationDelay = `${index * 0.15}s`;
  });
});


document.querySelectorAll('.profile img').forEach(img => {
  img.addEventListener('load', () => {
    img.classList.add('loaded');
  });
});
