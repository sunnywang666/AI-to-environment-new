/* scrollytelling 引擎：step 进视口中线 → 点亮文字 + 切换该章 sticky 图区显示的图表 */
(function () {
  const steps = document.querySelectorAll(".scrolly .step");
  if (!steps.length) return;

  function activate(step) {
    const scrolly = step.closest(".scrolly");
    scrolly.querySelectorAll(".step").forEach((s) => s.classList.toggle("is-active", s === step));
    const g = scrolly.querySelector(".scrolly__graphic");
    if (!g) return;
    const chart = step.dataset.chart;
    if (chart) {
      g.dataset.chart = chart;
      // 切换该图区里匹配的 panel
      g.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-on", p.dataset.chart === chart));
      g.dispatchEvent(new CustomEvent("chartchange", { detail: chart }));
    }
  }

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) activate(e.target); }),
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );
  steps.forEach((s) => io.observe(s));

  // 初始：每章第一个 panel 点亮
  document.querySelectorAll(".scrolly__graphic").forEach((g) => {
    const first = g.querySelector(".panel");
    if (first) first.classList.add("is-on");
  });
})();
