/* ==========================================================
   Shivaya Student Hub — Interactive Logic & Features
   ========================================================== */

// --- 1. Tab Switching & Initialization ---
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchTab(item.getAttribute('data-tab'));
  });
});

function switchTab(tabId) {
  navItems.forEach(i => i.classList.toggle('active', i.getAttribute('data-tab') === tabId));
  tabContents.forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
}

// Set Today Date & Live Clock
function initClocks() {
  const dateEl = document.getElementById('today-date');
  const timeEl = document.getElementById('current-time');
  
  function update() {
    const now = new Date();
    dateEl.innerText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    timeEl.innerText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  update();
  setInterval(update, 1000);
}
initClocks();

// --- 2. Google Calendar Direct Sync Event Generator ---
const gcalForm = document.getElementById('gcal-form');
if (gcalForm) {
  // Set default datetime values
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('gcal-start').value = now.toISOString().slice(0, 16);
  
  const end = new Date(now.getTime() + 60 * 60000);
  document.getElementById('gcal-end').value = end.toISOString().slice(0, 16);

  gcalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = encodeURIComponent(document.getElementById('gcal-title').value);
    const desc = encodeURIComponent(document.getElementById('gcal-desc').value);
    const loc = encodeURIComponent(document.getElementById('gcal-loc').value);
    
    // Format dates to ISO format without hyphens/colons (YYYYMMDDTHHMMSSZ)
    const startDate = new Date(document.getElementById('gcal-start').value).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(document.getElementById('gcal-end').value).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${desc}&location=${loc}`;
    window.open(gcalUrl, '_blank');
  });
}

// --- 3. AI Study Copilot / Chatbot ---
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatBox = document.getElementById('chat-box');
const clearChatBtn = document.getElementById('clear-chat-btn');

const studyResponses = {
  "photosynthesis": "🌱 **Photosynthesis Summary**:\nThe process by which plants turn sunlight, water, and CO2 into oxygen and glucose.\n• **Formula**: 6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂\n• Occurs inside chloroplasts using chlorophyll.",
  "derivatives": "📐 **Calculus Derivatives Cheat Sheet**:\n1. Power Rule: d/dx(xⁿ) = n·xⁿ⁻¹\n2. Product Rule: (fg)' = f'g + fg'\n3. Quotient Rule: (f/g)' = (f'g - fg') / g²\n4. Chain Rule: d/dx[f(g(x))] = f'(g(x))·g'(x)",
  "study plan": "🎯 **3-Step High-Retention Study Plan**:\n1. **Active Recall**: Don't just re-read notes; test yourself with flashcards without looking.\n2. **Pomodoro Sprints**: 25 min deep focus + 5 min break.\n3. **Feynman Technique**: Explain the concept simply in your own words as if teaching a beginner.",
  "quiz": "📝 **Quick Quiz**:\n1. What is the powerhouse of the cell? (Mitochondria)\n2. What is the derivative of sin(x)? (cos(x))\n3. Which gas do plants absorb? (Carbon Dioxide)\n\nReply with what topic you'd like a full custom quiz on!"
};

function addChatMessage(text, sender = 'user') {
  const msg = document.createElement('div');
  msg.className = `msg msg-${sender}`;
  msg.innerHTML = `
    <div class="avatar"><i class="fa-solid ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i></div>
    <div class="bubble">${text.replace(/\n/g, '<br>')}</div>
  `;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function generateAIResponse(userText) {
  const lower = userText.toLowerCase();
  
  // Look for predefined subject keywords
  for (const [key, response] of Object.entries(studyResponses)) {
    if (lower.includes(key)) {
      return response;
    }
  }

  // Fallback intelligent study helper response
  return `💡 **Study Tip on "${userText}"**:\nBreak this down into 3 sub-concepts:\n1. **Definitions & Core Principle**: Understand the fundamental terms.\n2. **Practical Applications**: Why does this matter in real exams or real life?\n3. **Self-Quiz**: Formulate 2 practice problems on this to master it!`;
}

if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    addChatMessage(query, 'user');
    chatInput.value = '';

    // Show simulated AI thinking
    setTimeout(() => {
      const reply = generateAIResponse(query);
      addChatMessage(reply, 'ai');
    }, 600);
  });
}

function sendPreset(text) {
  switchTab('ai-tutor');
  chatInput.value = text;
  chatForm.dispatchEvent(new Event('submit'));
}

function quickPrompt(text) {
  switchTab('ai-tutor');
  chatInput.value = text;
  chatForm.dispatchEvent(new Event('submit'));
}

if (clearChatBtn) {
  clearChatBtn.addEventListener('click', () => {
    chatBox.innerHTML = `
      <div class="msg msg-ai">
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="bubble">Chat history cleared. How can I help you study today?</div>
      </div>
    `;
  });
}

// Quick AI input in dashboard
const dashAiBtn = document.getElementById('dash-ai-btn');
const dashAiInput = document.getElementById('dash-ai-input');
if (dashAiBtn && dashAiInput) {
  dashAiBtn.addEventListener('click', () => {
    const val = dashAiInput.value.trim();
    if (val) {
      sendPreset(val);
      dashAiInput.value = '';
    }
  });
}

// --- 4. Task & Assignment Manager (LocalStorage) ---
const taskForm = document.getElementById('task-form');
const taskContainer = document.getElementById('task-container');
const taskCountBadge = document.getElementById('task-count-badge');
const dashPendingTasks = document.getElementById('dash-pending-tasks');

let tasks = JSON.parse(localStorage.getItem('shivaya_tasks')) || [
  { id: 1, title: 'Calculus Assignment 4', subject: 'Math', priority: 'High', date: '2026-09-01', done: false },
  { id: 2, title: 'Read Chemistry Chapter 5', subject: 'Science', priority: 'Medium', date: '2026-09-03', done: false }
];

function saveAndRenderTasks() {
  localStorage.setItem('shivaya_tasks', JSON.stringify(tasks));
  taskContainer.innerHTML = '';
  
  const pending = tasks.filter(t => !t.done).length;
  taskCountBadge.innerText = `${pending} pending`;
  if (dashPendingTasks) dashPendingTasks.innerText = pending;

  if (tasks.length === 0) {
    taskContainer.innerHTML = '<p class="text-muted" style="text-align:center; padding: 12px;">No assignments found! Add one above.</p>';
    return;
  }

  tasks.forEach(t => {
    const item = document.createElement('div');
    item.className = `task-item ${t.done ? 'completed' : ''}`;
    item.innerHTML = `
      <div class="task-left">
        <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id})" />
        <span class="task-text">${t.title}</span>
        <span class="task-tag">${t.subject}</span>
        <span class="task-tag priority-${t.priority}">${t.priority}</span>
        ${t.date ? `<span class="text-muted" style="font-size:12px;">📅 ${t.date}</span>` : ''}
      </div>
      <button class="btn-sm" style="color:#ef4444;" onclick="deleteTask(${t.id})"><i class="fa-solid fa-trash"></i></button>
    `;
    taskContainer.appendChild(item);
  });
}

if (taskForm) {
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    const subject = document.getElementById('task-subject').value;
    const priority = document.getElementById('task-priority').value;
    const date = document.getElementById('task-date').value;

    tasks.push({ id: Date.now(), title, subject, priority, date, done: false });
    taskForm.reset();
    saveAndRenderTasks();
  });
}

window.toggleTask = function(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveAndRenderTasks();
};

window.deleteTask = function(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveAndRenderTasks();
};

saveAndRenderTasks();

// --- 5. Pomodoro Focus Timer ---
let pomoDuration = 25 * 60;
let pomoRemaining = 25 * 60;
let pomoInterval = null;
let totalFocusMinutes = 0;

const pomoDisplay = document.getElementById('pomo-display');
const pomoStartBtn = document.getElementById('pomo-start-btn');
const pomoResetBtn = document.getElementById('pomo-reset-btn');
const pomoModes = document.querySelectorAll('.pomo-mode');
const dashFocusTime = document.getElementById('dash-focus-time');

function updatePomoDisplay() {
  const m = Math.floor(pomoRemaining / 60).toString().padStart(2, '0');
  const s = (pomoRemaining % 60).toString().padStart(2, '0');
  pomoDisplay.innerText = `${m}:${s}`;
}

pomoModes.forEach(btn => {
  btn.addEventListener('click', () => {
    pomoModes.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    clearInterval(pomoInterval);
    pomoInterval = null;
    pomoStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    pomoDuration = parseInt(btn.getAttribute('data-time')) * 60;
    pomoRemaining = pomoDuration;
    updatePomoDisplay();
  });
});

pomoStartBtn.addEventListener('click', () => {
  if (pomoInterval) {
    // Pause
    clearInterval(pomoInterval);
    pomoInterval = null;
    pomoStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
  } else {
    // Start
    pomoStartBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    pomoInterval = setInterval(() => {
      if (pomoRemaining > 0) {
        pomoRemaining--;
        updatePomoDisplay();
      } else {
        clearInterval(pomoInterval);
        pomoInterval = null;
        pomoStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        totalFocusMinutes += Math.round(pomoDuration / 60);
        if (dashFocusTime) dashFocusTime.innerText = `${totalFocusMinutes} min`;
        alert("🎉 Focus session completed! Take a break.");
      }
    }, 1000);
  }
});

pomoResetBtn.addEventListener('click', () => {
  clearInterval(pomoInterval);
  pomoInterval = null;
  pomoStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
  pomoRemaining = pomoDuration;
  updatePomoDisplay();
});

// --- 6. Exam Countdown Timer ---
let examTargetDate = new Date();
examTargetDate.setDate(examTargetDate.getDate() + 7); // Default 7 days from now

function updateCountdown() {
  const now = new Date();
  const diff = examTargetDate - now;

  if (diff <= 0) {
    document.getElementById('cd-days').innerText = "00";
    document.getElementById('cd-hours').innerText = "00";
    document.getElementById('cd-mins').innerText = "00";
    document.getElementById('cd-secs').innerText = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  document.getElementById('cd-days').innerText = days.toString().padStart(2, '0');
  document.getElementById('cd-hours').innerText = hours.toString().padStart(2, '0');
  document.getElementById('cd-mins').innerText = mins.toString().padStart(2, '0');
  document.getElementById('cd-secs').innerText = secs.toString().padStart(2, '0');
  
  const dashExam = document.getElementById('dash-exam-days');
  if (dashExam) dashExam.innerText = `${days} Days`;
}
setInterval(updateCountdown, 1000);
updateCountdown();

document.getElementById('edit-exam-btn').addEventListener('click', () => {
  const newTitle = prompt("Enter exam name:", "Midterm Exam");
  const days = prompt("How many days until this exam?", "7");
  if (newTitle) document.getElementById('exam-title').innerText = newTitle;
  if (days && !isNaN(days)) {
    examTargetDate = new Date();
    examTargetDate.setDate(examTargetDate.getDate() + parseInt(days));
    updateCountdown();
  }
});

// --- 7. Flashcards & Recall Tool ---
const flashcards = [
  { q: "What is Newton's First Law of Motion?", a: "An object remains at rest or in uniform motion unless acted upon by a net external force." },
  { q: "What is the powerhouse organelle of the cell?", a: "The Mitochondria (produces ATP)." },
  { q: "What is Euler's Formula in complex analysis?", a: "e^(i·x) = cos(x) + i·sin(x)" },
  { q: "What is the Big-O time complexity of Binary Search?", a: "O(log n)" }
];

let fcIndex = 0;
const studyCard = document.getElementById('study-card');
const fcQuestion = document.getElementById('fc-question');
const fcAnswer = document.getElementById('fc-answer');

window.flipCard = function() {
  studyCard.classList.toggle('flipped');
};

window.nextCard = function(step) {
  studyCard.classList.remove('flipped');
  fcIndex = (fcIndex + step + flashcards.length) % flashcards.length;
  setTimeout(() => {
    fcQuestion.innerText = flashcards[fcIndex].q;
    fcAnswer.innerText = flashcards[fcIndex].a;
  }, 200);
};

// --- 8. GPA Calculator ---
const addCourseBtn = document.getElementById('add-course-btn');
const courseList = document.getElementById('course-list');
const calcGpaBtn = document.getElementById('calc-gpa-btn');
const finalGpa = document.getElementById('final-gpa');

if (addCourseBtn) {
  addCourseBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'course-row';
    row.innerHTML = `
      <input type="text" placeholder="Course Name" class="course-name" />
      <input type="number" placeholder="Credits" value="3" min="1" max="10" class="course-credits" />
      <select class="course-grade">
        <option value="4.0">A (4.0)</option>
        <option value="3.7">A- (3.7)</option>
        <option value="3.3">B+ (3.3)</option>
        <option value="3.0">B (3.0)</option>
        <option value="2.7">B- (2.7)</option>
        <option value="2.0">C (2.0)</option>
        <option value="0.0">F (0.0)</option>
      </select>
    `;
    courseList.appendChild(row);
  });
}

if (calcGpaBtn) {
  calcGpaBtn.addEventListener('click', () => {
    const credits = document.querySelectorAll('.course-credits');
    const grades = document.querySelectorAll('.course-grade');
    
    let totalPoints = 0;
    let totalCredits = 0;

    for (let i = 0; i < credits.length; i++) {
      const cred = parseFloat(credits[i].value) || 0;
      const gr = parseFloat(grades[i].value) || 0;
      totalCredits += cred;
      totalPoints += cred * gr;
    }

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    finalGpa.innerText = gpa;
  });
}
