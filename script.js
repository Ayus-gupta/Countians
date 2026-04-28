
let lastColors = {};
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTick(frequency = 800, duration = 0.05) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "square"; // sharper tick (try "sine" for soft)
  osc.frequency.value = frequency;

  gain.gain.value = 0.1; // volume control

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}


let targetDate = null;
let lastValues = {};

// ======================
// 📦 STORAGE KEYS
// ======================
const EVENT_KEY = "event";
const HISTORY_KEY = "history";

// ======================
// ➕ ADD EVENT
// ======================
function addEvent() {
  const name = eventName.value;
  const date = eventDate.value;
  const time = eventTime.value || "00:00";
  audioCtx.resume();
  if (!name || !date) return alert("Fill details");

  const newEvent = {
    name,
    targetDate: new Date(`${date}T${time}`)
  };
  tickSound.play().then(() => tickSound.pause()).catch(()=>{});
  // 🔹 SAVE OLD EVENT → HISTORY
  const oldEvent = JSON.parse(localStorage.getItem(EVENT_KEY));
  if (oldEvent) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

    history.unshift(oldEvent); // latest first
    history = history.slice(0, 10); // limit

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  // SAVE NEW EVENT
  localStorage.setItem(EVENT_KEY, JSON.stringify(newEvent));

  loadEvent(newEvent);
}

// ======================
// 📥 LOAD EVENT
// ======================
function loadEvent(data) {
  targetDate = new Date(data.targetDate);
  eventTitle.innerText = data.name;

  inputSection.style.display = "none";
  timerSection.classList.remove("hidden");

  renderHistory(); // 🔥 ensure history always visible
}

// ======================
// 🔄 RESET
// ======================
function resetApp() {
  localStorage.removeItem(EVENT_KEY);
  location.href = location.pathname;
}
function toggleHistory() {
  const history = JSON.parse(localStorage.getItem("history")) || [];

  if (history.length === 0) {
    alert("No history available");
    return;
  }

  historyMode = !historyMode;

  if (historyMode) {
    historyIndex = 0;
    loadEvent(history[historyIndex]);
    document.getElementById("historyNav").classList.remove("hidden");
  } else {
    const current = JSON.parse(localStorage.getItem("event"));
    if (current) loadEvent(current);

    document.getElementById("historyNav").classList.add("hidden");
  }
}

function prevHistory() {
  const history = JSON.parse(localStorage.getItem("history")) || [];

  if (historyIndex < history.length - 1) {
    historyIndex++;
    loadEvent(history[historyIndex]);
  }
}

function nextHistory() {
  const history = JSON.parse(localStorage.getItem("history")) || [];

  if (historyIndex > 0) {
    historyIndex--;
    loadEvent(history[historyIndex]);
  }
}
// ======================
// 🔗 SHARE
// ======================
function shareEvent() {
  const data = JSON.parse(localStorage.getItem(EVENT_KEY));
  if (!data) return;

  const url = `${location.origin}${location.pathname}?name=${encodeURIComponent(data.name)}&time=${data.targetDate}`;

  navigator.clipboard.writeText(url);
  alert("Link copied!");
}

// ======================
// 🌐 LOAD FROM URL
// ======================
const params = new URLSearchParams(location.search);
const tickSound = new Audio("sounds/tick.mp3");
tickSound.volume = 0.3; // adjust

if (params.get("time")) {
  loadEvent({
    name: params.get("name"),
    targetDate: params.get("time")
  });
} else {
  const saved = JSON.parse(localStorage.getItem(EVENT_KEY));
  if (saved) loadEvent(saved);
}

// ======================
// 📜 HISTORY RENDER
// ======================
function renderHistory() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  const container = document.getElementById("historyList");

  if (!container) return;

  container.innerHTML = "";

  history.forEach((e, i) => {
    const div = document.createElement("div");
    div.className = "history-item";

    const date = new Date(e.targetDate).toLocaleString();

    div.innerHTML = `
      <strong>${e.name}</strong><br>
      <small>${date}</small>
    `;

    // CLICK → LOAD AGAIN
    div.onclick = () => {
      localStorage.setItem(EVENT_KEY, JSON.stringify(e));
      loadEvent(e);
    };

    container.appendChild(div);
  });
}

// ======================
// 🔢 CREATE BOXES (ANIMATION)
// ======================
function createBoxes(val, key) {
  val = String(val).padStart(2, "0");

  return val.split("").map((digit, i) => {
    const id = `${key}-${i}`;
    const changed = lastValues[id] != digit;

    lastValues[id] = digit;

    return `<div class="box ${changed ? "change" : ""}">${digit}</div>`;
  }).join("");
}

// ======================
// ⏳ TIMER UPDATE
// ======================
function updateTimer() {
  if (!targetDate) return;

  let diff = targetDate - new Date();

  if (diff <= 0) {
    timer.innerHTML = "Expired";
    return;
  }

  let s = Math.floor(diff / 1000);

  let y = Math.floor(s / (365*24*60*60));
  s %= (365*24*60*60);

  let mo = Math.floor(s / (30*24*60*60));
  s %= (30*24*60*60);

  let d = Math.floor(s / (24*60*60));
  s %= (24*60*60);

  let h = Math.floor(s / 3600);
  s %= 3600;

  let m = Math.floor(s / 60);
  let sec = s % 60;
  if (lastValues["sec"] !== sec) {
    playTick();
  }

lastValues["sec"] = sec;

  lastValues["sec"] = sec;
  let html = "";

  function seg(val, label, key, show=true) {
    if (!show) return;

    html += `
      <div class="segment">
        <div class="group">${createBoxes(val, key)}</div>
        <div class="label">${label}</div>
      </div>
      ${label !== "Sec" ? '<div class="colon">:</div>' : ''}
    `;
  }

  if (y > 0) seg(y, "Years", "y");
  if (mo > 0 || y > 0) seg(mo, "Months", "mo");
  if (d > 0 || mo > 0 || y > 0) seg(d, "Days", "d");

  seg(h, "Hours", "h");
  seg(m, "Min", "m");
  seg(sec, "Sec", "s");

  timer.innerHTML = html;
}

setInterval(updateTimer, 1000);

// ======================
// 🎨 THEME
// ======================
themeSelect.addEventListener("change", () => {
  document.body.className = themeSelect.value;
  localStorage.setItem("theme", themeSelect.value);
});

const savedTheme = localStorage.getItem("theme") || "terracotta";
document.body.className = savedTheme;
themeSelect.value = savedTheme;

// ======================
// 🚀 INIT
// ======================
renderHistory();

