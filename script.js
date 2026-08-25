/* ==========================================================================
   Shivaya Student OS — Interactive Core Logic & Web Audio Synthesizer
   ========================================================================== */

// --- 1. Global State Management & LocalStorage ---
const AppState = {
  tasks: JSON.parse(localStorage.getItem('shivaya_kanban_tasks')) || [
    { id: 1, title: 'Calculus: Problem Set 3', subject: 'Mathematics', priority: 'High', date: '2026-09-02', status: 'todo' },
    { id: 2, title: 'Neural Networks Architecture review', subject: 'Computer Science', priority: 'Medium', date: '2026-09-05', status: 'progress' },
    { id: 3, title: 'Read Thermodynamics Chapter 4', subject: 'Physics', priority: 'Low', date: '2026-09-01', status: 'done' }
  ],
  flashcards: JSON.parse(localStorage.getItem('shivaya_flashcards')) || [
    { q: "What is Bayes' Theorem?", a: "P(A|B) = [P(B|A) · P(A)] / P(B) — calculates the conditional probability of event A given event B." },
    { q: "What is the time complexity of QuickSort average vs worst case?", a: "Average: O(n log n), Worst: O(n²) when the pivot chosen is consistently the extreme element." },
    { q: "Define Heisenberg's Uncertainty Principle.", a: "It is fundamentally impossible to simultaneously measure the exact position and momentum of a subatomic particle (Δx · Δp ≥ ℏ/2)." }
  ],
  notes: localStorage.getItem('shivaya_scratchpad_notes') || '',
  noteTitle: localStorage.getItem('shivaya_scratchpad_title') || 'Midterm Revision Notes',
  examDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  focusMinutesToday: parseInt(localStorage.getItem('shivaya_focus_today')) || 45,
  calCurrentMonth: new Date().getMonth(),
  calCurrentYear: new Date().getFullYear()
};

// --- 2. Navigation & Tab Switching ---
const navButtons = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const pageTitleEl = document.getElementById('current-page-title');

navButtons.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
});

function switchTab(tabId) {
  navButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
  tabPanes.forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
  
  const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  if (activeBtn) pageTitleEl.innerText = activeBtn.querySelector('span').innerText;
  
  if (tabId === 'calendar') renderCalendar();
  if (tabId === 'kanban') renderKanban();
  if (tabId === 'flashcards') renderFlashcard();
}

// Mobile sidebar toggle
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('mobile-open');
});

// Live Clock
setInterval(() => {
  const d = new Date();
  document.getElementById('live-clock').innerText = d.toLocaleTimeString('en-US', { hour12: false });
}, 1000);

// --- 3. Interactive Calendar & Google Calendar Event Creator ---
function renderCalendar() {
  const daysContainer = document.getElementById('calendar-days');
  const monthTitle = document.getElementById('cal-month-year');
  if (!daysContainer) return;

  const year = AppState.calCurrentYear;
  const month = AppState.calCurrentMonth;
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  monthTitle.innerText = `${monthNames[month]} ${year}`;
  daysContainer.innerHTML = '';

  // Empty previous month padding
  for (let i = 0; i < firstDayIndex; i++) {
    daysContainer.innerHTML += `<div class="cal-day-cell text-muted" style="opacity:0.3;"></div>`;
  }

  const today = new Date();
  for (let day = 1; day <= totalDays; day++) {
    const isToday = (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year);
    
    // Check if task exists on this date
    const dateStr = `${year}-${(month+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const taskOnDay = AppState.tasks.find(t => t.date === dateStr);

    daysContainer.innerHTML += `
      <div class="cal-day-cell ${isToday ? 'today' : ''}" onclick="selectCalDay('${dateStr}')">
        <strong>${day}</strong>
        ${taskOnDay ? `<div class="cal-event-pill">${taskOnDay.title}</div>` : ''}
      </div>
    `;
  }
}

function changeMonth(delta) {
  AppState.calCurrentMonth += delta;
  if (AppState.calCurrentMonth < 0) { AppState.calCurrentMonth = 11; AppState.calCurrentYear--; }
  if (AppState.calCurrentMonth > 11) { AppState.calCurrentMonth = 0; AppState.calCurrentYear++; }
  renderCalendar();
}

function selectCalDay(dateStr) {
  document.getElementById('gcal-ev-start').value = `${dateStr}T09:00`;
  document.getElementById('gcal-ev-end').value = `${dateStr}T11:00`;
}

// Google Calendar Sync Form Handler
document.getElementById('gcal-quick-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = encodeURIComponent(document.getElementById('gcal-ev-title').value);
  const notes = encodeURIComponent(document.getElementById('gcal-ev-notes').value);
  const start = new Date(document.getElementById('gcal-ev-start').value).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const end = new Date(document.getElementById('gcal-ev-end').value).toISOString().replace(/-|:|\.\d\d\d/g, "");

  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${notes}`;
  window.open(gcalUrl, '_blank');
});

// --- 4. Kanban Assignment Board ---
function renderKanban() {
  const todoCol = document.getElementById('kanban-todo');
  const progressCol = document.getElementById('kanban-progress');
  const doneCol = document.getElementById('kanban-done');
  const subjectFilter = document.getElementById('kanban-filter-subject').value;

  todoCol.innerHTML = '';
  progressCol.innerHTML = '';
  doneCol.innerHTML = '';

  const filtered = AppState.tasks.filter(t => subjectFilter === 'ALL' || t.subject === subjectFilter);

  filtered.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
      <div class="task-card-header">
        <span class="task-subject-tag">${task.subject}</span>
        <span style="font-size:11px; color:${task.priority === 'High' ? 'var(--rose)' : 'var(--amber)'}">${task.priority}</span>
      </div>
      <h4 style="font-size:14px; margin-bottom:4px;">${task.title}</h4>
      <div class="task-actions">
        <span class="text-muted"><i class="fa-regular fa-calendar"></i> ${task.date}</span>
        <div>
          ${task.status !== 'todo' ? `<button class="btn-icon" onclick="moveTask(${task.id}, 'prev')"><i class="fa-solid fa-arrow-left"></i></button>` : ''}
          ${task.status !== 'done' ? `<button class="btn-icon" onclick="moveTask(${task.id}, 'next')"><i class="fa-solid fa-arrow-right"></i></button>` : ''}
          <button class="btn-icon" style="color:var(--rose);" onclick="deleteTask(${task.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;

    if (task.status === 'todo') todoCol.appendChild(card);
    else if (task.status === 'progress') progressCol.appendChild(card);
    else if (task.status === 'done') doneCol.appendChild(card);
  });

  // Update counts
  document.getElementById('count-todo').innerText = AppState.tasks.filter(t => t.status === 'todo').length;
  document.getElementById('count-progress').innerText = AppState.tasks.filter(t => t.status === 'progress').length;
  document.getElementById('count-done').innerText = AppState.tasks.filter(t => t.status === 'done').length;
  document.getElementById('dash-task-count').innerText = AppState.tasks.filter(t => t.status !== 'done').length;

  renderDashboardTasks();
}

function moveTask(id, dir) {
  const task = AppState.tasks.find(t => t.id === id);
  if (!task) return;
  if (dir === 'next') {
    if (task.status === 'todo') task.status = 'progress';
    else if (task.status === 'progress') task.status = 'done';
  } else {
    if (task.status === 'done') task.status = 'progress';
    else if (task.status === 'progress') task.status = 'todo';
  }
  localStorage.setItem('shivaya_kanban_tasks', JSON.stringify(AppState.tasks));
  renderKanban();
}

function deleteTask(id) {
  AppState.tasks = AppState.tasks.filter(t => t.id !== id);
  localStorage.setItem('shivaya_kanban_tasks', JSON.stringify(AppState.tasks));
  renderKanban();
}

function handleCreateTask(e) {
  e.preventDefault();
  const newTask = {
    id: Date.now(),
    title: document.getElementById('modal-task-title').value,
    subject: document.getElementById('modal-task-subject').value,
    priority: document.getElementById('modal-task-priority').value,
    date: document.getElementById('modal-task-date').value,
    status: 'todo'
  };
  AppState.tasks.push(newTask);
  localStorage.setItem('shivaya_kanban_tasks', JSON.stringify(AppState.tasks));
  closeAllModals();
  renderKanban();
}

function renderDashboardTasks() {
  const dashList = document.getElementById('dash-quick-tasks');
  if (!dashList) return;
  dashList.innerHTML = '';
  
  const pending = AppState.tasks.filter(t => t.status !== 'done').slice(0, 3);
  if (pending.length === 0) {
    dashList.innerHTML = `<p class="text-muted text-sm" style="padding:10px;">All caught up! No urgent tasks.</p>`;
    return;
  }

  pending.forEach(t => {
    dashList.innerHTML += `
      <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-color); font-size:13px;">
        <div><strong>${t.title}</strong> <span class="text-muted">(${t.subject})</span></div>
        <span class="text-amber">${t.date}</span>
      </div>
    `;
  });
}

// --- 5. AI Study Studio & Interactive Quiz Engine ---
const aiModeTabs = document.querySelectorAll('.ai-tab-btn');
const aiViews = document.querySelectorAll('.ai-view');

aiModeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    aiModeTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const mode = tab.getAttribute('data-aimode');
    aiViews.forEach(v => v.classList.toggle('active', v.id === `ai-view-${mode}`));
  });
});

function sendAiMessage() {
  const input = document.getElementById('chat-prompt-input');
  const text = input.value.trim();
  if (!text) return;

  const thread = document.getElementById('chat-thread');
  thread.innerHTML += `
    <div class="chat-bubble user">
      <div class="bubble-body">${text}</div>
    </div>
  `;
  input.value = '';
  thread.scrollTop = thread.scrollHeight;

  setTimeout(() => {
    const aiAnswer = getSmartAiResponse(text);
    thread.innerHTML += `
      <div class="chat-bubble ai">
        <div class="bubble-header"><i class="fa-solid fa-brain"></i> Shivaya Copilot</div>
        <div class="bubble-body">${aiAnswer}</div>
      </div>
    `;
    thread.scrollTop = thread.scrollHeight;
  }, 400);
}

function getSmartAiResponse(q) {
  const lower = q.toLowerCase();
  if (lower.includes('bayes')) {
    return "<strong>Bayes' Theorem</strong> updates the probability for a hypothesis as more evidence becomes available.<br><br><code>P(A|B) = [P(B|A) · P(A)] / P(B)</code><br><em>Intuition:</em> If a rare disease test is 99% accurate, your actual probability of having it given a positive test depends heavily on the base rate in the general population.";
  }
  if (lower.includes('heisenberg') || lower.includes('uncertainty')) {
    return "<strong>Heisenberg's Uncertainty Principle:</strong><br>At quantum scales, wave-particle duality means observing a particle requires hitting it with a photon, altering its momentum. Hence, precision in position precision reduces momentum precision.";
  }
  return `💡 <strong>Core Breakdown of "${q}"</strong>:<br>1. <em>Fundamental Definition:</em> Key underlying theory.<br>2. <em>Formula / Mechanism:</em> How variables interact.<br>3. <em>Exam Application:</em> Always state edge cases or assumptions first!`;
}

function quickAiAsk(query) {
  switchTab('ai-studio');
  document.querySelector('[data-aimode="chat"]').click();
  document.getElementById('chat-prompt-input').value = query;
  sendAiMessage();
}

function solveFromDash() {
  const val = document.getElementById('dash-quick-ai-query').value.trim();
  if (val) quickAiAsk(val);
}

// Interactive Quiz Engine
function generateInteractiveQuiz() {
  const topic = document.getElementById('quiz-topic-input').value || "Physics Mechanics";
  const container = document.getElementById('quiz-container');
  
  container.innerHTML = `
    <div class="panel" style="margin-top:16px;">
      <h4 style="margin-bottom:12px;">Quiz: ${topic}</h4>
      
      <div style="margin-bottom:14px;">
        <p style="margin-bottom:8px;"><strong>1. What happens to the kinetic energy of an object if its velocity is doubled?</strong></p>
        <button class="btn btn-secondary w-100" style="text-align:left; margin-bottom:6px;" onclick="checkAnswer(this, false)">A) It remains the same</button>
        <button class="btn btn-secondary w-100" style="text-align:left; margin-bottom:6px;" onclick="checkAnswer(this, false)">B) It doubles (2x)</button>
        <button class="btn btn-secondary w-100" style="text-align:left; margin-bottom:6px;" onclick="checkAnswer(this, true)">C) It quadruples (4x) [KE = 1/2 m v²]</button>
      </div>
    </div>
  `;
}

window.checkAnswer = function(btn, isCorrect) {
  if (isCorrect) {
    btn.style.background = "var(--emerald)";
    btn.style.color = "#fff";
    alert("🎉 Correct! KE = 1/2 · m · v², so squaring (2v) yields 4x.");
  } else {
    btn.style.background = "var(--rose)";
    btn.style.color = "#fff";
    alert("❌ Not quite. Remember velocity is squared in the Kinetic Energy formula.");
  }
};

function summarizeNotes() {
  const raw = document.getElementById('notes-raw-input').value;
  const out = document.getElementById('summarizer-output');
  if (!raw) return;

  out.style.display = 'block';
  out.innerHTML = `
    <h4 style="color:var(--primary); margin-bottom:8px;"><i class="fa-solid fa-bolt"></i> Synthesized Key Takeaways:</h4>
    <ul style="padding-left:20px; line-height:1.8;">
      <li><strong>Core Theme:</strong> ${raw.slice(0, 40)}...</li>
      <li><strong>Key Mechanism:</strong> Primary principles extracted and condensed.</li>
      <li><strong>Review Focus:</strong> Test yourself on these definitions for 10 minutes tomorrow morning.</li>
    </ul>
  `;
}

function saveApiKey() {
  const key = document.getElementById('user-custom-api-key').value.trim();
  if (key) {
    localStorage.setItem('shivaya_user_api_key', key);
    document.getElementById('api-key-status').style.display = 'block';
  }
}

// --- 6. Flashcards 3D Recall Tool ---
let fcIdx = 0;
function renderFlashcard() {
  if (AppState.flashcards.length === 0) return;
  const card = AppState.flashcards[fcIdx];
  document.getElementById('fc-front-text').innerText = card.q;
  document.getElementById('fc-back-text').innerText = card.a;
  document.getElementById('fc-counter').innerText = `Card ${fcIdx + 1} of ${AppState.flashcards.length}`;
  document.getElementById('flashcard-element').classList.remove('flipped');
}

function flipFlashcard() {
  document.getElementById('flashcard-element').classList.toggle('flipped');
}

function navigateFlashcard(delta) {
  fcIdx = (fcIdx + delta + AppState.flashcards.length) % AppState.flashcards.length;
  renderFlashcard();
}

// --- 7. Pomodoro & Web Audio Synthesizer (Zero External MP3s!) ---
let pomoDuration = 25 * 60;
let pomoRemaining = 25 * 60;
let pomoInterval = null;

function setPomoMode(mins, btn) {
  document.querySelectorAll('.pomo-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  clearInterval(pomoInterval);
  pomoInterval = null;
  document.getElementById('pomo-play-btn').innerHTML = '<i class="fa-solid fa-play"></i> Start Session';
  pomoDuration = mins * 60;
  pomoRemaining = pomoDuration;
  updatePomoDisplay();
}

function updatePomoDisplay() {
  const m = Math.floor(pomoRemaining / 60).toString().padStart(2, '0');
  const s = (pomoRemaining % 60).toString().padStart(2, '0');
  document.getElementById('pomo-timer-text').innerText = `${m}:${s}`;
}

function togglePomodoro() {
  const btn = document.getElementById('pomo-play-btn');
  if (pomoInterval) {
    clearInterval(pomoInterval);
    pomoInterval = null;
    btn.innerHTML = '<i class="fa-solid fa-play"></i> Resume Session';
  } else {
    btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    pomoInterval = setInterval(() => {
      if (pomoRemaining > 0) {
        pomoRemaining--;
        updatePomoDisplay();
      } else {
        clearInterval(pomoInterval);
        pomoInterval = null;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Start Session';
        AppState.focusMinutesToday += Math.round(pomoDuration / 60);
        localStorage.setItem('shivaya_focus_today', AppState.focusMinutesToday);
        document.getElementById('dash-focus-total').innerText = `${AppState.focusMinutesToday} mins`;
        alert("🎉 Pomodoro session finished! Take a breath.");
      }
    }, 1000);
  }
}

function resetPomodoro() {
  clearInterval(pomoInterval);
  pomoInterval = null;
  document.getElementById('pomo-play-btn').innerHTML = '<i class="fa-solid fa-play"></i> Start Session';
  pomoRemaining = pomoDuration;
  updatePomoDisplay();
}

// Real-time Web Audio API Generator (Binaural & Noise)
let audioCtx = null;
let activeNoiseNode = null;

function toggleSound(type) {
  if (activeNoiseNode) {
    stopAmbientSound();
    return;
  }

  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  if (type === 'binaural') {
    // 40Hz Gamma Beat (200Hz Left, 240Hz Right)
    const oscL = audioCtx.createOscillator();
    const oscR = audioCtx.createOscillator();
    const merger = audioCtx.createChannelMerger(2);
    const gain = audioCtx.createGain();
    
    oscL.frequency.value = 200;
    oscR.frequency.value = 240;
    gain.gain.value = 0.08;

    oscL.connect(merger, 0, 0);
    oscR.connect(merger, 0, 1);
    merger.connect(gain);
    gain.connect(audioCtx.destination);

    oscL.start();
    oscR.start();
    activeNoiseNode = { stop: () => { oscL.stop(); oscR.stop(); } };
    document.getElementById('active-sound-name').innerText = "40Hz Gamma Beats";
  } else {
    // White / Pink Noise Buffer
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.05;
    whiteNoise.connect(gain);
    gain.connect(audioCtx.destination);
    whiteNoise.start();

    activeNoiseNode = whiteNoise;
    document.getElementById('active-sound-name').innerText = "Focus White Noise";
  }

  document.querySelectorAll('.sound-card').forEach(c => c.classList.remove('active'));
  document.getElementById(`sound-card-${type}`).classList.add('active');
  document.getElementById('ambient-badge').style.display = 'flex';
}

function stopAmbientSound() {
  if (activeNoiseNode) {
    activeNoiseNode.stop();
    activeNoiseNode = null;
  }
  document.querySelectorAll('.sound-card').forEach(c => c.classList.remove('active'));
  document.getElementById('ambient-badge').style.display = 'none';
}

// --- 8. Notes Scratchpad ---
const noteText = document.getElementById('note-textarea');
const noteTitle = document.getElementById('note-title');
if (noteText && noteTitle) {
  noteText.value = AppState.notes;
  noteTitle.value = AppState.noteTitle;

  noteText.addEventListener('input', () => {
    localStorage.setItem('shivaya_scratchpad_notes', noteText.value);
    updateNoteStats();
  });
  noteTitle.addEventListener('input', () => {
    localStorage.setItem('shivaya_scratchpad_title', noteTitle.value);
  });
}

function updateNoteStats() {
  const words = noteText.value.trim().split(/\s+/).filter(w => w.length > 0).length;
  document.getElementById('word-count-badge').innerText = `${words} words`;
}

function exportNotes() {
  const blob = new Blob([`${noteTitle.value}\n\n${noteText.value}`], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${noteTitle.value || 'Study_Notes'}.txt`;
  a.click();
}

// --- 9. GPA & Target Exam Predictor ---
function addGpaRow() {
  const container = document.getElementById('gpa-rows-container');
  const row = document.createElement('div');
  row.className = 'gpa-row';
  row.innerHTML = `
    <input type="text" placeholder="Course Name" value="Subject" />
    <input type="number" class="gpa-cred" value="3" min="1" max="6" />
    <select class="gpa-grd">
      <option value="4.0">A (4.0)</option>
      <option value="3.7">A- (3.7)</option>
      <option value="3.3">B+ (3.3)</option>
      <option value="3.0">B (3.0)</option>
      <option value="2.0">C (2.0)</option>
      <option value="0.0">F (0.0)</option>
    </select>
    <button class="btn-icon" style="color:var(--rose);" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>
  `;
  container.appendChild(row);
}

function calculateGPA() {
  const creds = document.querySelectorAll('.gpa-cred');
  const grds = document.querySelectorAll('.gpa-grd');
  let pts = 0, totalCreds = 0;

  for (let i = 0; i < creds.length; i++) {
    const c = parseFloat(creds[i].value) || 0;
    const g = parseFloat(grds[i].value) || 0;
    totalCreds += c;
    pts += c * g;
  }
  const res = totalCreds > 0 ? (pts / totalCreds).toFixed(2) : '4.00';
  document.getElementById('final-gpa-score').innerText = res;
}

function calculateTargetExamMark() {
  const current = parseFloat(document.getElementById('pred-current-mark').value);
  const examWeight = parseFloat(document.getElementById('pred-exam-weight').value) / 100;
  const target = parseFloat(document.getElementById('pred-target-mark').value);

  // Target = (Current * (1 - Weight)) + (FinalExam * Weight)
  const currentWeight = 1 - examWeight;
  const required = (target - (current * currentWeight)) / examWeight;

  const box = document.getElementById('pred-result-box');
  const val = document.getElementById('pred-result-val');
  box.style.display = 'block';
  val.innerText = `${required.toFixed(1)}%`;
  val.style.color = required > 100 ? "var(--rose)" : "var(--emerald)";
}

// --- 10. Command Palette & Modals ---
function openCommandPalette() { document.getElementById('cmd-modal').classList.add('active'); document.getElementById('cmd-input').focus(); }
function openNewTaskModal() { document.getElementById('task-modal').classList.add('active'); }
function closeAllModals() { document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active')); }
function closeModalsOnBackdrop(e) { if (e.target.classList.contains('modal-backdrop')) closeAllModals(); }

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCommandPalette();
  }
  if (e.key === 'Escape') closeAllModals();
});

function execCommand(tabId) {
  closeAllModals();
  switchTab(tabId);
}

// --- Initialize App ---
window.addEventListener('DOMContentLoaded', () => {
  renderKanban();
  renderCalendar();
  renderFlashcard();
  updateNoteStats();
  for (let i = 0; i < 3; i++) addGpaRow();

  // Set exam countdown diff
  const diffDays = Math.ceil((AppState.examDate - new Date()) / (1000 * 60 * 60 * 24));
  document.getElementById('dash-exam-countdown').innerText = `${diffDays} Days`;
  document.getElementById('dash-focus-total').innerText = `${AppState.focusMinutesToday} mins`;
});
