(function () {
  var button = document.getElementById("theme");
  if (!button) return;
  var sun = button.querySelector('[data-show]');
  var moon = button.querySelectorAll(".icon-swap")[1];
  function paint() {
    var light = !document.documentElement.classList.contains("dark");
    button.setAttribute("aria-pressed", light ? "true" : "false");
    if (sun) sun.setAttribute("data-show", light ? "true" : "false");
    if (moon) moon.setAttribute("data-show", light ? "false" : "true");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", light ? "#ffffff" : "#0a0a0a");
  }
  paint();
  button.addEventListener("click", function () {
    var nextLight = document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", !nextLight);
    try { localStorage.setItem("wv-theme", nextLight ? "light" : "dark"); } catch (e) {}
    paint();
  });
})();
