
const message = document.querySelector("#message");
const navLinks = document.querySelector("#navLinks");

document.querySelectorAll(".category").forEach(function(button) {
  button.addEventListener("click", function() {
    message.textContent =
      "คุณเลือกหมวดหมู่: " + button.dataset.category;
  });
});

document.querySelector("#shopBtn").addEventListener("click", function() {
  document.querySelector("#categories").scrollIntoView({
    behavior: "smooth"
  });
});

document.querySelector("#menuBtn").addEventListener("click", function() {
  navLinks.classList.toggle("show-menu");
});
