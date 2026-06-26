/* ============================================================
   云的身体 v2 · 开场仿 AI 聊天框（复用旧站逻辑，未改算法）
   输入问题→AI 打字回答这次的能耗/用水估算（查表+长度系数，标注"估算值"）。
   ============================================================ */
const MICRO_WH = 0.3; // 微波炉转 1 秒 ≈ 0.3 Wh

function classify(text) {
  if (/视频|短片|影片|短视频/.test(text)) return "video";
  if (/图片|图像|画一|插画|海报|配图|生成图|一张图/.test(text)) return "image";
  if (/邮件|文章|作文|文案|报告|信|稿|总结|翻译|写[一个]*[封篇段]?/.test(text)) return "text";
  return "simple";
}
function estimate(text) {
  const base = {
    simple: { wh: 0.3, ml: 10 },
    text: { wh: 0.45, ml: 519 },
    image: { wh: 1.5, ml: 23 },
    video: { wh: 380, ml: 1200 },
  }[classify(text)];
  const f = Math.min(1.6, 1 + Math.max(0, text.length - 15) / 120);
  return { type: classify(text), wh: base.wh * f, ml: base.ml * f, micro: (base.wh * f) / MICRO_WH, bottles: (base.ml * f) / 519 };
}
const fmtWh = (v) => (v < 10 ? (Math.round(v * 100) / 100).toString() : Math.round(v).toLocaleString());
const fmtMl = (v) => (v < 100 ? Math.round(v) : Math.round(v / 10) * 10);
function fmtTime(sec) {
  if (sec < 90) return `${Math.max(1, Math.round(sec))} 秒`;
  const m = sec / 60;
  return `${m < 10 ? m.toFixed(1) : Math.round(m)} 分钟`;
}
function reply(text) {
  const e = estimate(text);
  const wh = fmtWh(e.wh), t = fmtTime(e.micro);
  if (e.type === "video") {
    return `你要的这段视频，代价要大得多：大约 ${wh} 瓦时电，相当于让微波炉转 ${t}。复杂任务可以是一次简单问答的成百上千倍。（估算值）\n\n往下滑，看看这些"微不足道"加起来是什么。`;
  }
  if (e.type === "image") {
    return `生成这张图，大约要消耗 ${wh} 瓦时——相当于微波炉转 ${t}，再蒸发掉约 ${fmtMl(e.ml)} 毫升冷却水。（估算值）\n\n而这只是开始。往下滑。`;
  }
  const water = e.ml >= 100
    ? `，再用掉约 ${fmtMl(e.ml)} 毫升水来冷却——差不多 ${e.bottles < 1.2 ? "一" : e.bottles.toFixed(1)} 瓶矿泉水`
    : "，顺带蒸发掉一小口冷却水";
  return `回答你这句话，大约要消耗 ${wh} 瓦时电——相当于让微波炉转 ${t}${water}。（估算值）\n\n听起来微不足道？可把它乘以全世界每天几十亿次提问……往下滑，我带你看。`;
}

function initChat() {
  const form = document.getElementById("chatForm");
  if (!form) return;
  const input = document.getElementById("chatInput");
  const send = document.getElementById("chatSend");
  const chips = document.getElementById("chatChips");
  const answer = document.getElementById("chatAnswer");
  const answerText = document.getElementById("answerText");
  const heroScroll = document.getElementById("heroScroll");
  const s1 = document.getElementById("s1");
  let typing = null;

  function setSendState() { send.disabled = input.value.trim() === ""; }
  setSendState();
  function autoGrow() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 96) + "px"; }

  function typeOut(str) {
    if (typing) clearTimeout(typing);
    answer.hidden = false;
    answerText.innerHTML = '<span class="cursor"></span>';
    const cursor = answerText.querySelector(".cursor");
    const node = document.createTextNode("");
    answerText.insertBefore(node, cursor);
    let i = 0;
    (function step() {
      if (i < str.length) {
        node.textContent += str[i++];
        const d = /[，。、—…\n]/.test(str[i - 1]) ? 90 : 22;
        typing = setTimeout(step, d);
      } else { setTimeout(() => cursor && cursor.remove(), 1200); }
    })();
  }
  function ask(text) {
    const q = (text || "").trim(); if (!q) return;
    typeOut(reply(q));
    answer.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });
  input.addEventListener("input", () => { setSendState(); autoGrow(); });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-q]"); if (!b) return;
    input.value = b.dataset.q; setSendState(); autoGrow(); ask(b.dataset.q);
  });
  if (heroScroll && s1) heroScroll.addEventListener("click", () => s1.scrollIntoView({ behavior: "smooth", block: "start" }));
  if (location.hash === "#demo") setTimeout(() => ask("帮我写一封一百字的邮件"), 200); // 截图用
}
document.addEventListener("DOMContentLoaded", initChat);
