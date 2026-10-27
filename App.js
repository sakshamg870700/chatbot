const engine = new FAQEngine(FAQS);
const log = document.getElementById("log");
const input = document.getElementById("input");
const chips = document.getElementById("chips");
const form = document.getElementById("form");
 
function addMessage(text, who, source) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  if (source) {
    const s = document.createElement("span");
    s.className = "src";
    s.textContent = source;
    div.appendChild(s);
  }
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}
 
function addSuggestions(list) {
  if (!list.length) return;
  const row = document.createElement("div");
  row.className = "chips inline";
  list.forEach(q => row.appendChild(makeChip(q)));
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}
 
function makeChip(q) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = q;
  b.addEventListener("click", () => ask(q));
  return b;
}
 
function ask(text) {
  chips.hidden = true;
  addMessage(text, "user");
  const r = engine.ask(text);
  addMessage(r.answer, "bot", r.matched ? "Matched FAQ: " + r.matched : null);
  addSuggestions(r.suggestions);
}
 
form.addEventListener("submit", e => {
  e.preventDefault();
  const t = input.value.trim();
  if (!t) return;
  input.value = "";
  ask(t);
});
 
FAQS.slice(0, 5).forEach(f => chips.appendChild(makeChip(f.question)));
addMessage("Hi! What can I help you with?", "bot");
 