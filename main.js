// Плагин sidebar (как в Jira): кнопка в шапке, левее имени сессии. Нажал — список спрятан,
// при наведении на кнопку выезжает поверх ленты и держится, пока мышь над ним; нажал ещё раз — снова закреплён.
// Клавиша [ — то же. Выбор помним в браузере (hubx.sidebar). На узком экране (список — отдельный вид) кнопки нет.
const KEY = "hubx.sidebar";
const HIDE_AFTER = 300;   // мс: мышь ушла со списка и кнопки — спрятать
const root = document.documentElement;
let hideTimer = null;

const off = () => root.classList.contains("sbx-off");
function set(collapsed) {
  root.classList.toggle("sbx-off", collapsed);
  root.classList.remove("sbx-peek");
  try { localStorage.setItem(KEY, collapsed ? "off" : "on"); } catch { /* без памяти */ }
  btn.title = collapsed ? "Закрепить список сессий  [" : "Скрыть список сессий  [";
  btn.setAttribute("aria-label", btn.title);
  btn.setAttribute("aria-expanded", String(!collapsed));
}
function peek(on) {
  clearTimeout(hideTimer);
  if (on) { if (off()) root.classList.add("sbx-peek"); return; }
  hideTimer = setTimeout(() => root.classList.remove("sbx-peek"), HIDE_AFTER);
}

const btn = document.createElement("button");
btn.type = "button";
btn.className = "sbx-btn";
btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>';
btn.addEventListener("click", () => set(!off()));
btn.addEventListener("mouseenter", () => peek(true));
btn.addEventListener("mouseleave", () => peek(false));

// выехавший список лежит поверх кнопки в шапке — в нём своя такая же кнопка «закрепить»
const pin = btn.cloneNode(true);
pin.classList.add("sbx-pin");
pin.title = "Закрепить список сессий  [";
pin.setAttribute("aria-label", pin.title);
pin.addEventListener("click", () => set(false));

// шапку страница строит заново на каждой перерисовке — ставим кнопку снова, первой перед именем
function attach() {
  const app = document.getElementById("app");
  const head = document.querySelector("main .head");
  if (head && btn.parentNode !== head) head.insertBefore(btn, head.querySelector(":scope > h2") || head.firstChild);
  const aside = app && app.querySelector(":scope > aside");
  if (aside && pin.parentNode !== aside) aside.append(pin);
  if (aside && !aside.dataset.sbx) {
    aside.dataset.sbx = "1";
    aside.addEventListener("mouseenter", () => peek(true));
    aside.addEventListener("mouseleave", () => peek(false));
  }
}

export default function register(hub) {
  hub.addStyle("sidebar.css");
  let saved = "on";
  try { saved = localStorage.getItem(KEY) || "on"; } catch { /* нет */ }
  set(saved === "off");
  attach();
  new MutationObserver(attach).observe(document.getElementById("app") || document.body, { childList: true, subtree: true });
  addEventListener("keydown", (e) => {
    if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    set(!off());
  });
}
