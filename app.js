import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD-2o5Jz0I0-aUxx_IxOeqmsgYHi9Mpxbk",
    authDomain: "first-project---tasks.firebaseapp.com",
    projectId: "first-project---tasks",
    storageBucket: "first-project---tasks.firebasestorage.app",
    messagingSenderId: "995559938504",
    appId: "1:995559938504:web:ae8ae3ea35ce54edbc88fd"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// --- State Management ---
// Default state
let state = {
    currentView: 'dashboard',
    currentFilter: null,
    taskViewFilter: 'all',
    tasks: [],
    activeTaskId: null,
    timerSettings: {
        focus: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60
    },
    timerState: {
        mode: 25, // current mode duration in minutes
        timeLeft: 25 * 60,
        isRunning: false,
        intervalId: null
    },
    stats: {
        sessionsCompleted: 0
    },
    goal: {
        dailyTasks: 5
    }
};

// --- DOM Elements ---
const DOM = {
    dateDisplay: document.getElementById('current-date'),

    // Tasks
    taskInput: document.getElementById('task-input'),
    taskDeadline: document.getElementById('task-deadline'),
    taskDuration: document.getElementById('task-duration'),
    taskPriority: document.getElementById('task-priority'),
    taskNotes: document.getElementById('task-notes'),
    toggleDetailsBtn: document.getElementById('toggle-details-btn'),
    taskDetailsInput: document.getElementById('task-details-input'),
    addTaskBtn: document.getElementById('add-task-btn'),
    taskList: document.getElementById('task-list'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    frogSlot: document.getElementById('frog-slot'),

    // Modal
    breakModal: document.getElementById('break-trigger-modal'),
    modalTaskName: document.getElementById('modal-task-name'),
    modalBtnYes: document.getElementById('modal-btn-yes'),
    modalBtnNo: document.getElementById('modal-btn-no'),

    // Progress
    progressText: document.getElementById('progress-text'),
    progressFill: document.getElementById('progress-fill'),
    progressSubtext: document.getElementById('progress-subtext'),

    // Timer
    timerDisplay: document.getElementById('timer-display'),
    timerToggleBtn: document.getElementById('timer-toggle'),
    timerToggleIcon: document.getElementById('timer-toggle-icon'),
    timerResetBtn: document.getElementById('timer-reset'),
    timerStatus: document.getElementById('timer-status'),
    timerProgressSvg: document.getElementById('timer-progress-svg'),
    timerModeBtns: document.querySelectorAll('.timer-mode-btn'),
    activeTaskDisplay: document.getElementById('active-task-display'),
    activeTaskName: document.getElementById('active-task-name'),
    clearActiveTaskBtn: document.getElementById('clear-active-task'),

    // Views
    navItems: document.querySelectorAll('.nav-item'),
    viewSections: document.querySelectorAll('.view-section'),
    viewDashboardCards: document.getElementById('view-dashboard-cards'),
    viewTaskSection: document.getElementById('view-task-section'),
    viewSettings: document.getElementById('view-settings'),

    // Settings View
    setFocus: document.getElementById('set-focus'),
    setShortBreak: document.getElementById('set-short-break'),
    setLongBreak: document.getElementById('set-long-break'),
    setDailyGoal: document.getElementById('set-daily-goal'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    settingsMsg: document.getElementById('settings-msg'),

    // Stats
    statSessions: document.getElementById('stat-sessions'),

    // Sprint 5: Task Detail Sidebar
    taskDetailSidebar: document.getElementById('task-detail-sidebar'),
    closeDetailBtn: document.getElementById('close-detail-btn'),
    detailTitle: document.getElementById('detail-title'),
    detailCreatedAt: document.getElementById('detail-created-at'),
    detailPriority: document.getElementById('detail-priority'),
    detailDeadline: document.getElementById('detail-deadline'),
    detailReminder: document.getElementById('detail-reminder'),
    detailDuration: document.getElementById('detail-duration'),
    detailTargetSessions: document.getElementById('detail-target-sessions'),
    detailNotes: document.getElementById('detail-notes'),
    sessionDots: document.getElementById('session-dots'),
    sessionCountText: document.getElementById('session-count-text'),
    subtaskList: document.getElementById('subtask-list'),
    subtaskInput: document.getElementById('subtask-input'),
    addSubtaskBtn: document.getElementById('add-subtask-btn'),
    saveDetailBtn: document.getElementById('save-detail-btn'),

    // Sprint 5: Smart Lists
    badgeToday: document.getElementById('badge-today'),
    badgeTomorrow: document.getElementById('badge-tomorrow'),
    badgeWeek: document.getElementById('badge-week'),
    badgePlanned: document.getElementById('badge-planned'),

    // Sprint 5: Quick-Add
    quickDateBtn: document.getElementById('quick-date-btn'),
    quickPriorityBtn: document.getElementById('quick-priority-btn'),
    quickDurationBtn: document.getElementById('quick-duration-btn'),
    quickPriorityIcon: document.getElementById('quick-priority-icon'),

    // Sprint 5: Time Budget
    timeBudgetDisplay: document.getElementById('time-budget-display'),

    // Focus Mode
    focusOverlay: document.getElementById('focus-mode-overlay'),
    exitFocusBtn: document.getElementById('exit-focus-mode'),
    focusTaskTitle: document.getElementById('focus-task-title'),
    focusPriorityBadge: document.getElementById('focus-priority-badge'),
    focusMetaDeadline: document.getElementById('focus-meta-deadline'),
    focusMetaDuration: document.getElementById('focus-meta-duration'),
    focusMetaSessions: document.getElementById('focus-meta-sessions'),
    focusNotesSection: document.getElementById('focus-notes-section'),
    focusNotesText: document.getElementById('focus-notes-text'),
    focusSubtasksSection: document.getElementById('focus-subtasks-section'),
    focusSubtaskList: document.getElementById('focus-subtask-list'),
    focusTimerDisplay: document.getElementById('focus-timer-display'),
    focusTimerProgress: document.getElementById('focus-timer-progress'),
    focusTimerToggle: document.getElementById('focus-timer-toggle'),
    focusTimerToggleIcon: document.getElementById('focus-timer-toggle-icon'),
    focusTimerReset: document.getElementById('focus-timer-reset'),
    focusTimerStatus: document.getElementById('focus-timer-status'),

    // Toasts
    toastContainer: document.getElementById('toast-container')
};

// --- Initialization ---
function init() {
    loadState();
    updateDateDisplay();
    DOM.filterBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.filter === (state.taskViewFilter || 'all'));
    });
    renderTasks();
    updateProgress();
    updateTimeBudget();
    updateSmartListCounts();
    renderTimer();
    renderActiveTask();
    renderStats();
    setupEventListeners();
    switchView(state.currentView);

    // Start reminder checking loop (every 10 seconds)
    setInterval(checkReminders, 10000);
}

// --- Local Storage & Cloud Sync ---
async function loadState() {
    let loadedFromServer = false;

    // First, try to load from Firestore if user is logged in
    if (auth.currentUser) {
        try {
            const docRef = doc(db, "users", auth.currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                state = { ...state, ...docSnap.data() };
                loadedFromServer = true;
            }
        } catch (error) {
            console.error("Error loading purely from cloud:", error);
        }
    }

    // Fallback to local storage if no server data found
    if (!loadedFromServer) {
        const savedState = localStorage.getItem('aetherState');
        if (savedState) {
            state = { ...state, ...JSON.parse(savedState) };
        }
    }

    // Reset timer if it was running when closed
    if (state.timerState.isRunning) {
        state.timerState.isRunning = false;
    }

    // Migrate old tasks and stats to new schema
    state.stats.sessionDates = state.stats.sessionDates || [];
    state.tasks = state.tasks.map(t => ({
        ...t,
        subtasks: t.subtasks || [],
        targetSessions: t.targetSessions || 0,
        completedSessions: t.completedSessions || 0,
        priority: t.priority || 'medium',
        duration: t.duration || 0,
        // retroactively assign completedAt if missing but task is completed
        completedAt: t.completedAt || (t.completed ? t.createdAt || new Date().toISOString() : null)
    }));

    // Once everything is loaded, re-render
    renderTasks();
    updateProgress();
    updateTimeBudget();
    updateSmartListCounts();
}

async function saveState() {
    const stateToSave = {
        ...state,
        timerState: { ...state.timerState, isRunning: false, intervalId: null } // don't save active intervals
    };

    // Save locally
    localStorage.setItem('aetherState', JSON.stringify(stateToSave));

    // Save to Cloud if logged in
    if (auth.currentUser) {
        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), stateToSave);
        } catch (error) {
            console.error("Error saving to cloud:", error);
        }
    }
}

// --- Date ---
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    DOM.dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
}

// --- Helpers ---
function formatRelativeDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// --- Task Management ---
function addTask(text, deadline, notes, duration, priority) {
    if (!text.trim()) return;

    const newTask = {
        id: Date.now().toString(),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        deadline: deadline || null,
        notes: notes ? notes.trim() : null,
        duration: duration ? parseInt(duration) : 0,
        priority: priority || 'medium',
        subtasks: [],
        targetSessions: 0,
        completedSessions: 0
    };

    state.tasks.unshift(newTask);
    saveState();
    renderTasks();
    updateProgress();
    updateTimeBudget();
    updateSmartListCounts();
}

function toggleTask(id) {
    state.tasks = state.tasks.map(task => {
        if (task.id === id) {
            const completed = !task.completed;
            return {
                ...task,
                completed,
                completedAt: completed ? new Date().toISOString() : null
            };
        }
        return task;
    });
    saveState();
    renderTasks();
    updateProgress();
    updateTimeBudget();
    updateSmartListCounts();
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(task => task.id !== id);
    saveState();
    renderTasks();
    updateProgress();
    updateTimeBudget();
    updateSmartListCounts();
}

function renderTasks() {
    DOM.taskList.innerHTML = '';
    DOM.frogSlot.innerHTML = '';

    // Apply smart filter if active
    let tasksToRender = state.tasks;
    if (state.currentFilter) {
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        switch (state.currentFilter) {
            case 'filter-today':
                tasksToRender = state.tasks.filter(t => t.deadline === todayStr);
                break;
            case 'filter-tomorrow':
                tasksToRender = state.tasks.filter(t => t.deadline === tomorrowStr);
                break;
            case 'filter-week':
                tasksToRender = state.tasks.filter(t => t.deadline && t.deadline >= todayStr && t.deadline <= weekEndStr);
                break;
            case 'filter-planned':
                tasksToRender = state.tasks.filter(t => t.deadline);
                break;
        }
    }

    // Apply Active/Done filter
    if (state.taskViewFilter === 'active') {
        tasksToRender = tasksToRender.filter(t => !t.completed);
    } else if (state.taskViewFilter === 'completed') {
        tasksToRender = tasksToRender.filter(t => t.completed);
    }

    if (tasksToRender.length === 0) {
        DOM.taskList.innerHTML = '<li class="task-item" style="justify-content:center;color:var(--text-secondary);font-style:italic;">No tasks yet. Enjoy your day!</li>';
        return;
    }

    // Identify Frog slot (first uncompleted High priority task)
    const frogTaskIndex = tasksToRender.findIndex(t => t.priority === 'high' && !t.completed);

    tasksToRender.forEach((task, index) => {
        const li = document.createElement('li');
        let classes = `task-item priority-${task.priority || 'medium'} ${task.completed ? 'completed' : ''}`;
        if (task.id === state.activeTaskId) {
            classes += ' task-active-pulse';
        }
        li.className = classes;

        let badgesHTML = '';
        if (task.deadline) {
            const todayStr = new Date().toISOString().split('T')[0];
            const isOverdue = task.deadline < todayStr && !task.completed;
            const isToday = task.deadline === todayStr && !task.completed;
            const badgeClass = isOverdue ? 'deadline-overdue' : (isToday ? 'deadline-soon' : '');
            badgesHTML += `<span class="task-badge ${badgeClass}"><i class="ph ph-calendar-blank"></i> ${formatRelativeDate(task.deadline)}</span>`;
        }
        if (task.duration) {
            badgesHTML += `<span class="task-badge"><i class="ph ph-hourglass-high"></i> ${task.duration}m</span>`;
        }
        if (task.subtasks && task.subtasks.length > 0) {
            const done = task.subtasks.filter(s => s.completed).length;
            badgesHTML += `<span class="task-badge"><i class="ph ph-list-checks"></i> ${done}/${task.subtasks.length}</span>`;
        }
        if (task.targetSessions > 0) {
            badgesHTML += `<span class="task-badge"><i class="ph ph-timer"></i> ${task.completedSessions || 0}/${task.targetSessions}</span>`;
        }
        if (task.notes) {
            badgesHTML += `<span class="task-badge" title="${escapeHTML(task.notes)}"><i class="ph ph-note"></i> Notes</span>`;
        }

        const focusHTML = !task.completed ? `<button class="task-btn focus-btn" onclick="setActiveTaskAndStart('${task.id}')" title="Play / Focus"><i class="ph-fill ph-play"></i></button>` : '';

        li.innerHTML = `
            <div class="task-content">
                <label class="checkbox-wrapper">
                    <input type="checkbox" onchange="toggleTask('${task.id}')" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="task-main" onclick="openTaskDetail('${task.id}')" style="cursor:pointer;">
                    <span class="task-text">${escapeHTML(task.text)}</span>
                    ${badgesHTML ? `<div class="task-meta">${badgesHTML}</div>` : ''}
                </div>
            </div>
            <div class="task-actions">
                ${focusHTML}
                <button class="task-btn delete-btn" onclick="deleteTask('${task.id}')" aria-label="Delete task">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `;

        if (index === frogTaskIndex && !state.currentFilter) {
            DOM.frogSlot.appendChild(li);
        } else {
            DOM.taskList.appendChild(li);
        }
    });
}

// --- Progress Management ---
function updateProgress() {
    // Determine total completed duration or task count
    const tasksWithDuration = state.tasks.filter(t => t.duration > 0);
    const useDuration = tasksWithDuration.length > 0;

    let progressVal = 0;
    let goalVal = 0;
    let unit = 'tasks';

    if (useDuration) {
        // Goal is based on sum of durations. 
        // Example logic: target 120 minutes (2 hours) of focused work per day
        goalVal = Math.max(state.goal.dailyTasks * 25, 1); // rough fallback: tasks * 25m
        progressVal = state.tasks.filter(t => t.completed).reduce((sum, t) => sum + t.duration, 0);
        unit = 'min';
    } else {
        goalVal = Math.max(state.tasks.length, state.goal.dailyTasks);
        progressVal = state.tasks.filter(t => t.completed).length;
    }

    let percentage = 0;
    if (goalVal > 0) {
        percentage = Math.round((progressVal / goalVal) * 100);
    }

    // Cap at 100% just in case
    percentage = Math.min(percentage, 100);

    DOM.progressText.textContent = `${percentage}%`;
    DOM.progressFill.style.width = `${percentage}%`;
    DOM.progressSubtext.textContent = `${progressVal} of ${goalVal} ${unit} completed`;

    if (percentage === 100 && completedTasks > 0) {
        DOM.progressFill.style.background = `linear-gradient(90deg, var(--success), #3fb950)`;
        DOM.progressText.style.color = `var(--success)`;
    } else {
        DOM.progressFill.style.background = `linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))`;
        DOM.progressText.style.color = `var(--accent-secondary)`;
    }
}

// --- Focus Timer ---
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function renderTimer() {
    updateTimerDisplay();
    DOM.timerModeBtns.forEach(btn => {
        if (parseInt(btn.dataset.time) === state.timerState.mode) {
            btn.classList.add('active');
            let label = btn.textContent.toLowerCase();
            if (label.includes('focus')) DOM.timerStatus.textContent = "Ready to focus!";
            else if (label.includes('break')) DOM.timerStatus.textContent = "Time to relax.";
        } else {
            btn.classList.remove('active');
        }
    });
}

function updateTimerDisplay() {
    DOM.timerDisplay.textContent = formatTime(state.timerState.timeLeft);
    document.title = `${formatTime(state.timerState.timeLeft)} - Aether`;

    // Update SVG Circle
    const totalDuration = state.timerState.mode * 60;
    const dashoffset = 283 - (state.timerState.timeLeft / totalDuration) * 283;
    DOM.timerProgressSvg.style.strokeDashoffset = dashoffset;

    // Sync Focus Mode overlay
    syncFocusTimerDisplay();
}

function setTimerMode(minutes) {
    pauseTimer();
    state.timerState.mode = minutes;
    state.timerState.timeLeft = minutes * 60;

    DOM.timerModeBtns.forEach(btn => {
        if (parseInt(btn.dataset.time) === minutes) {
            btn.classList.add('active');
            let label = btn.textContent.toLowerCase();
            if (label.includes('focus')) DOM.timerStatus.textContent = "Ready to focus!";
            else if (label.includes('break')) DOM.timerStatus.textContent = "Time to relax.";
        } else {
            btn.classList.remove('active');
        }
    });

    updateTimerDisplay();
    saveState();
}

function toggleTimer() {
    if (state.timerState.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (state.timerState.timeLeft <= 0) return;

    state.timerState.isRunning = true;
    DOM.timerToggleIcon.classList.remove('ph-play');
    DOM.timerToggleIcon.classList.add('ph-pause');
    DOM.timerStatus.textContent = "Focusing...";

    state.timerState.intervalId = setInterval(() => {
        state.timerState.timeLeft--;
        updateTimerDisplay();

        if (state.timerState.timeLeft <= 0) {
            timerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    state.timerState.isRunning = false;
    clearInterval(state.timerState.intervalId);
    DOM.timerToggleIcon.classList.remove('ph-pause');
    DOM.timerToggleIcon.classList.add('ph-play');
    if (state.timerState.timeLeft > 0) {
        DOM.timerStatus.textContent = "Paused";
    }
}

function resetTimer() {
    pauseTimer();
    state.timerState.timeLeft = state.timerState.mode * 60;
    updateTimerDisplay();
    DOM.timerStatus.textContent = "Ready!";
}

function timerComplete() {
    pauseTimer();
    DOM.timerStatus.textContent = "Session Complete!";

    if (state.timerState.mode >= 25) {
        state.stats.sessionsCompleted++;
        state.stats.sessionDates = state.stats.sessionDates || [];
        state.stats.sessionDates.push(new Date().toISOString());
        renderStats();

        // Increment task-specific session counter
        if (state.activeTaskId) {
            const task = state.tasks.find(t => t.id === state.activeTaskId);
            if (task) {
                task.completedSessions = (task.completedSessions || 0) + 1;
            }

            if (task && !task.completed) {
                DOM.modalTaskName.textContent = task.text;
                DOM.breakModal.classList.remove('hidden');
            } else {
                setTimerMode(state.timerSettings.shortBreak / 60);
            }
        } else {
            setTimerMode(state.timerSettings.shortBreak / 60);
        }

        saveState();
        renderTasks();
        playChime();
    } else {
        setTimerMode(state.timerSettings.focus / 60);
        playChime();
    }
}

function renderStats() {
    DOM.statSessions.textContent = state.stats.sessionsCompleted;
}

// --- Views & Navigation ---
function switchView(viewName) {
    if (!viewName) return;

    // Check if it's a smart filter
    if (viewName.startsWith('filter-')) {
        state.currentFilter = viewName;
        state.currentView = 'tasks';
    } else {
        state.currentFilter = null;
        state.currentView = viewName;
    }
    saveState();

    DOM.navItems.forEach(item => {
        const isActive = item.dataset.view === viewName ||
            (!viewName.startsWith('filter-') && item.dataset.view === state.currentView);
        item.classList.toggle('active', isActive);
    });

    DOM.viewSections.forEach(section => {
        section.classList.add('hidden');
    });

    const actualView = state.currentView;
    if (actualView === 'dashboard') {
        DOM.viewDashboardCards.classList.remove('hidden');
        DOM.viewTaskSection.classList.remove('hidden');
    } else if (actualView === 'tasks') {
        DOM.viewTaskSection.classList.remove('hidden');
    } else if (actualView === 'settings') {
        DOM.viewSettings.classList.remove('hidden');
        populateSettingsForm();
    }

    renderTasks();
}


// --- Settings View ---
function populateSettingsForm() {
    DOM.setFocus.value = state.timerSettings.focus / 60;
    DOM.setShortBreak.value = state.timerSettings.shortBreak / 60;
    DOM.setLongBreak.value = state.timerSettings.longBreak / 60;
    DOM.setDailyGoal.value = state.goal.dailyTasks;
}

function saveSettings() {
    state.timerSettings.focus = parseInt(DOM.setFocus.value) * 60;
    state.timerSettings.shortBreak = parseInt(DOM.setShortBreak.value) * 60;
    state.timerSettings.longBreak = parseInt(DOM.setLongBreak.value) * 60;
    state.goal.dailyTasks = parseInt(DOM.setDailyGoal.value);

    // Update timer shortcut buttons
    DOM.timerModeBtns[0].dataset.time = state.timerSettings.focus / 60;
    DOM.timerModeBtns[1].dataset.time = state.timerSettings.shortBreak / 60;
    DOM.timerModeBtns[2].dataset.time = state.timerSettings.longBreak / 60;

    saveState();
    updateProgress();

    DOM.settingsMsg.classList.remove('hidden');
    setTimeout(() => {
        DOM.settingsMsg.classList.add('hidden');
    }, 3000);

    // If timer stopped, refresh the mode
    if (!state.timerState.isRunning && !state.activeTaskId) {
        setTimerMode(state.timerSettings.focus / 60);
    }
}

// --- Audio ---
function playChime() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // Drop to A4

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
        console.log("Audio not supported or blocked");
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // Top Task Inputs
    DOM.toggleDetailsBtn.addEventListener('click', () => {
        DOM.taskDetailsInput.classList.toggle('hidden');
        DOM.toggleDetailsBtn.innerHTML = DOM.taskDetailsInput.classList.contains('hidden')
            ? '<i class="ph ph-caret-down"></i>'
            : '<i class="ph ph-caret-up"></i>';
    });

    // Task view filters (All, Active, Done)
    DOM.filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            DOM.filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.taskViewFilter = e.target.dataset.filter;
            saveState();
            renderTasks();
        });
    });

    const handleAddTask = () => {
        addTask(
            DOM.taskInput.value,
            DOM.taskDeadline.value,
            DOM.taskNotes.value,
            DOM.taskDuration.value,
            DOM.taskPriority.value
        );
        DOM.taskInput.value = '';
        DOM.taskDeadline.value = '';
        DOM.taskNotes.value = '';
        DOM.taskDuration.value = '';
        DOM.taskPriority.value = 'medium';
        DOM.taskDetailsInput.classList.add('hidden');
        DOM.toggleDetailsBtn.innerHTML = '<i class="ph ph-caret-down"></i>';
    };

    DOM.addTaskBtn.addEventListener('click', handleAddTask);

    DOM.taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });
    DOM.taskDeadline.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });
    DOM.taskNotes.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });

    // Timer Controls
    DOM.timerToggleBtn.addEventListener('click', toggleTimer);
    DOM.timerResetBtn.addEventListener('click', resetTimer);

    DOM.timerModeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const minutes = parseInt(e.target.dataset.time);
            setTimerMode(minutes);
        });
    });

    // Active task
    DOM.clearActiveTaskBtn.addEventListener('click', clearActiveTask);

    // Navigation Events
    DOM.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = e.currentTarget.dataset.view;
            switchView(viewName);
        });
    });

    // Settings
    DOM.saveSettingsBtn.addEventListener('click', saveSettings);

    // Modal
    DOM.modalBtnYes.addEventListener('click', () => {
        if (state.activeTaskId) {
            toggleTask(state.activeTaskId);
            clearActiveTask();
        }
        DOM.breakModal.classList.add('hidden');
        setTimerMode(state.timerSettings.shortBreak / 60);
        startTimer();
    });

    DOM.modalBtnNo.addEventListener('click', () => {
        DOM.breakModal.classList.add('hidden');
        setTimerMode(state.timerSettings.shortBreak / 60);
        startTimer();
    });

    // Sprint 5: Task Detail Sidebar
    DOM.closeDetailBtn.addEventListener('click', closeTaskDetail);
    DOM.saveDetailBtn.addEventListener('click', saveTaskDetail);
    DOM.addSubtaskBtn.addEventListener('click', () => {
        if (state._openDetailTaskId) {
            addSubtask(state._openDetailTaskId, DOM.subtaskInput.value);
            DOM.subtaskInput.value = '';
        }
    });
    DOM.subtaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && state._openDetailTaskId) {
            addSubtask(state._openDetailTaskId, DOM.subtaskInput.value);
            DOM.subtaskInput.value = '';
        }
    });

    // Sprint 5: Quick-Add Icons
    let quickPriorityState = 'medium';
    DOM.quickDateBtn.addEventListener('click', () => {
        DOM.quickDateBtn.classList.toggle('active');
        // Show/hide the date field specifically
        const dateFields = DOM.taskDetailsInput.querySelectorAll('.detail-field');
        if (DOM.quickDateBtn.classList.contains('active')) {
            DOM.taskDetailsInput.classList.remove('hidden');
        }
    });
    DOM.quickPriorityBtn.addEventListener('click', () => {
        // Cycle: medium -> high -> low -> medium
        const cycle = { medium: 'high', high: 'low', low: 'medium' };
        quickPriorityState = cycle[quickPriorityState];
        DOM.taskPriority.value = quickPriorityState;
        DOM.quickPriorityBtn.classList.toggle('active', quickPriorityState !== 'medium');
        const colors = { high: '#ff00ff', low: '#888', medium: '' };
        DOM.quickPriorityIcon.style.color = colors[quickPriorityState];
    });
    DOM.quickDurationBtn.addEventListener('click', () => {
        DOM.quickDurationBtn.classList.toggle('active');
        if (DOM.quickDurationBtn.classList.contains('active')) {
            DOM.taskDetailsInput.classList.remove('hidden');
        }
    });
}

// Active Task logic
function setActiveTaskAndStart(id) {
    setActiveTask(id);
    startTimer();
    enterFocusMode();
}

function setActiveTask(id) {
    state.activeTaskId = id;
    saveState();
    renderTasks(); // required for the pulse effect to apply immediately
    renderActiveTask();
    setTimerMode(state.timerSettings.focus / 60);
}

function clearActiveTask() {
    state.activeTaskId = null;
    saveState();
    renderActiveTask();
}

function renderActiveTask() {
    if (state.activeTaskId) {
        const task = state.tasks.find(t => t.id === state.activeTaskId);
        if (task && !task.completed) {
            DOM.activeTaskName.textContent = task.text;
            DOM.activeTaskDisplay.classList.remove('hidden');
            return;
        }
    }
    DOM.activeTaskDisplay.classList.add('hidden');
}

// Helper
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Global exposure for inline onclick handlers
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.setActiveTask = setActiveTask;
window.setActiveTaskAndStart = setActiveTaskAndStart;
window.openTaskDetail = openTaskDetail;
window.toggleSubtask = toggleSubtask;
window.deleteSubtask = deleteSubtask;

// ===== SPRINT 5: New Functions =====

// --- Task Detail Sidebar ---
function openTaskDetail(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    state._openDetailTaskId = taskId;
    DOM.detailTitle.value = task.text;

    // Set created date
    if (task.createdAt) {
        const date = new Date(task.createdAt);
        DOM.detailCreatedAt.textContent = `Created: ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        DOM.detailCreatedAt.textContent = `Created: Unknown`;
    }

    DOM.detailPriority.value = task.priority || 'medium';
    DOM.detailDeadline.value = task.deadline || '';
    DOM.detailReminder.value = task.reminderTime || '';
    DOM.detailDuration.value = task.duration || '';
    DOM.detailTargetSessions.value = task.targetSessions || '';
    DOM.detailNotes.value = task.notes || '';

    renderSessionDots(task);
    renderSubtasks(task);

    DOM.taskDetailSidebar.classList.remove('hidden');
}

function closeTaskDetail() {
    DOM.taskDetailSidebar.classList.add('hidden');
    state._openDetailTaskId = null;
}

function saveTaskDetail() {
    const task = state.tasks.find(t => t.id === state._openDetailTaskId);
    if (!task) return;

    task.text = DOM.detailTitle.value.trim() || task.text;
    task.priority = DOM.detailPriority.value;
    task.deadline = DOM.detailDeadline.value || null;

    // Handle reminder update
    if (task.reminderTime !== DOM.detailReminder.value) {
        task.reminderTime = DOM.detailReminder.value || null;
        task.reminderNotified = false; // Reset notification flag if time changes
    }

    task.duration = DOM.detailDuration.value ? parseInt(DOM.detailDuration.value) : 0;
    task.targetSessions = DOM.detailTargetSessions.value ? parseInt(DOM.detailTargetSessions.value) : 0;
    task.notes = DOM.detailNotes.value || null;

    saveState();
    renderTasks();
    updateProgress();
    updateTimeBudget();
    updateSmartListCounts();
    closeTaskDetail();
}

// --- Reminders & Toasts ---
function checkReminders() {
    if (!state.tasks || state.tasks.length === 0) return;

    const now = new Date();

    state.tasks.forEach(task => {
        if (!task.completed && task.reminderTime && !task.reminderNotified) {
            const reminderDate = new Date(task.reminderTime);
            if (now >= reminderDate) {
                showToast("Task Reminder", `It's time for: ${task.text}`);
                task.reminderNotified = true;
                saveState();
            }
        }
    });
}

function showToast(title, message) {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    toast.innerHTML = `
        <i class="ph-fill ph-bell-ringing toast-icon"></i>
        <div class="toast-content">
            <h4 class="toast-title">${escapeHTML(title)}</h4>
            <p class="toast-message">${escapeHTML(message)}</p>
        </div>
        <button class="toast-close"><i class="ph ph-x"></i></button>
    `;

    // Handle close button
    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300); // 300ms matches CSS animation
    };

    closeBtn.addEventListener('click', dismiss);

    // Auto remove after 6 seconds
    setTimeout(dismiss, 6000);

    DOM.toastContainer.appendChild(toast);

    // Play subtle chime just in case the system allows audio
    try { playChime(); } catch (e) { }
}

function renderSessionDots(task) {
    const target = task.targetSessions || 0;
    const completed = task.completedSessions || 0;
    let html = '';
    for (let i = 0; i < Math.max(target, completed); i++) {
        html += `<div class="session-dot ${i < completed ? 'completed' : ''}"></div>`;
    }
    DOM.sessionDots.innerHTML = html;
    DOM.sessionCountText.textContent = `${completed} / ${target} sessions`;
}

// --- Subtask CRUD ---
function renderSubtasks(task) {
    DOM.subtaskList.innerHTML = '';
    if (!task.subtasks) return;
    task.subtasks.forEach(sub => {
        const li = document.createElement('li');
        li.className = 'subtask-item';
        li.innerHTML = `
            <input type="checkbox" ${sub.completed ? 'checked' : ''} onchange="toggleSubtask('${task.id}', '${sub.id}')">
            <span class="subtask-text ${sub.completed ? 'done' : ''}">${escapeHTML(sub.text)}</span>
            <button class="subtask-delete" onclick="deleteSubtask('${task.id}', '${sub.id}')"><i class="ph ph-x"></i></button>
        `;
        DOM.subtaskList.appendChild(li);
    });
}

function addSubtask(taskId, text) {
    if (!text || !text.trim()) return;
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
        id: Date.now().toString(),
        text: text.trim(),
        completed: false
    });
    saveState();
    renderSubtasks(task);
    renderTasks();
}

function toggleSubtask(taskId, subtaskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (sub) sub.completed = !sub.completed;
    saveState();
    renderSubtasks(task);
    renderTasks();
}

function deleteSubtask(taskId, subtaskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    saveState();
    renderSubtasks(task);
    renderTasks();
}

// --- Time Budget ---
function updateTimeBudget() {
    const remaining = state.tasks
        .filter(t => !t.completed && t.duration > 0)
        .reduce((sum, t) => sum + t.duration, 0);
    const elapsed = state.tasks
        .filter(t => t.completed && t.duration > 0)
        .reduce((sum, t) => sum + t.duration, 0);

    let display = '';
    if (remaining >= 60) {
        display = `${Math.floor(remaining / 60)}h ${remaining % 60}m left`;
    } else {
        display = `${remaining}m left`;
    }
    DOM.timeBudgetDisplay.textContent = display;
}

// --- Smart List Counts ---
function updateSmartListCounts() {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const countToday = state.tasks.filter(t => t.deadline === todayStr && !t.completed).length;
    const countTomorrow = state.tasks.filter(t => t.deadline === tomorrowStr && !t.completed).length;
    const countWeek = state.tasks.filter(t => t.deadline && t.deadline >= todayStr && t.deadline <= weekEndStr && !t.completed).length;
    const countPlanned = state.tasks.filter(t => t.deadline && !t.completed).length;

    DOM.badgeToday.textContent = countToday;
    DOM.badgeTomorrow.textContent = countTomorrow;
    DOM.badgeWeek.textContent = countWeek;
    DOM.badgePlanned.textContent = countPlanned;
}

// ===== FIREBASE AUTHENTICATION LOGIC =====
let appInitialized = false;

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        document.getElementById('auth-modal-overlay').classList.add('hidden');
        document.getElementById('user-name-display').textContent = user.email.split('@')[0];
        if (!appInitialized) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
            appInitialized = true;
        }
    } else {
        // User is signed out
        document.getElementById('auth-modal-overlay').classList.remove('hidden');
        if (!appInitialized) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
            appInitialized = true;
        }
    }
});

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error-msg');
    const isSignUp = document.getElementById('auth-toggle-btn').textContent === 'Sign In';

    try {
        errorMsg.classList.add('hidden');
        if (isSignUp) {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');
    }
});

document.getElementById('auth-toggle-btn').addEventListener('click', (e) => {
    const isSignUp = e.target.textContent === 'Sign Up';
    document.getElementById('auth-title').textContent = isSignUp ? 'Create Account' : 'Welcome to Aether';
    document.getElementById('auth-subtitle').textContent = isSignUp ? 'Join to sync your tasks' : 'Sign in to sync your tasks';
    document.getElementById('auth-submit-btn').textContent = isSignUp ? 'Sign Up' : 'Sign In';
    document.getElementById('auth-toggle-text').textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
    e.target.textContent = isSignUp ? 'Sign In' : 'Sign Up';
    document.getElementById('auth-error-msg').classList.add('hidden');
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth);
});

// ===== FOCUS MODE =====

function enterFocusMode() {
    if (!state.activeTaskId) return;
    const task = state.tasks.find(t => t.id === state.activeTaskId);
    if (!task) return;

    // Populate task details
    DOM.focusTaskTitle.textContent = task.text;
    const priority = task.priority || 'medium';
    DOM.focusPriorityBadge.textContent = priority.toUpperCase();
    DOM.focusPriorityBadge.className = `focus-priority-badge priority-${priority}`;

    // Meta
    DOM.focusMetaDeadline.querySelector('span').textContent = task.deadline ? formatRelativeDate(task.deadline) : 'No deadline';
    DOM.focusMetaDuration.querySelector('span').textContent = task.duration ? `${task.duration}m` : '—';
    DOM.focusMetaSessions.querySelector('span').textContent = `${task.completedSessions || 0}/${task.targetSessions || 0} sessions`;

    // Notes
    if (task.notes) {
        DOM.focusNotesText.textContent = task.notes;
        DOM.focusNotesSection.style.display = '';
    } else {
        DOM.focusNotesSection.style.display = 'none';
    }

    // Subtasks
    DOM.focusSubtaskList.innerHTML = '';
    if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(sub => {
            const li = document.createElement('li');
            li.className = `focus-subtask-item ${sub.completed ? 'done' : ''}`;
            li.innerHTML = `
                <input type="checkbox" ${sub.completed ? 'checked' : ''} onchange="toggleSubtask('${task.id}', '${sub.id}'); syncFocusSubtasks();">
                <span>${escapeHTML(sub.text)}</span>
            `;
            DOM.focusSubtaskList.appendChild(li);
        });
        DOM.focusSubtasksSection.style.display = '';
    } else {
        DOM.focusSubtasksSection.style.display = 'none';
    }

    // Sync timer display
    syncFocusTimerDisplay();

    // Show overlay
    DOM.focusOverlay.classList.remove('hidden');
}

function exitFocusMode() {
    DOM.focusOverlay.classList.add('hidden');
}

function syncFocusTimerDisplay() {
    if (!DOM.focusTimerDisplay) return;
    const formatted = formatTime(state.timerState.timeLeft);
    DOM.focusTimerDisplay.textContent = formatted;

    // SVG ring
    const totalDuration = state.timerState.mode * 60;
    const progress = totalDuration > 0 ? (totalDuration - state.timerState.timeLeft) / totalDuration : 0;
    const circumference = 2 * Math.PI * 90; // r=90
    DOM.focusTimerProgress.style.strokeDasharray = circumference;
    DOM.focusTimerProgress.style.strokeDashoffset = circumference * (1 - progress);

    // Icon sync
    if (state.timerState.isRunning) {
        DOM.focusTimerToggleIcon.classList.remove('ph-play');
        DOM.focusTimerToggleIcon.classList.add('ph-pause');
    } else {
        DOM.focusTimerToggleIcon.classList.remove('ph-pause');
        DOM.focusTimerToggleIcon.classList.add('ph-play');
    }

    // Status sync
    DOM.focusTimerStatus.textContent = DOM.timerStatus.textContent;
}

function syncFocusSubtasks() {
    if (!state.activeTaskId) return;
    const task = state.tasks.find(t => t.id === state.activeTaskId);
    if (!task) return;
    // Re-render subtasks in focus mode
    DOM.focusSubtaskList.innerHTML = '';
    if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(sub => {
            const li = document.createElement('li');
            li.className = `focus-subtask-item ${sub.completed ? 'done' : ''}`;
            li.innerHTML = `
                <input type="checkbox" ${sub.completed ? 'checked' : ''} onchange="toggleSubtask('${task.id}', '${sub.id}'); syncFocusSubtasks();">
                <span>${escapeHTML(sub.text)}</span>
            `;
            DOM.focusSubtaskList.appendChild(li);
        });
    }
    DOM.focusMetaSessions.querySelector('span').textContent = `${task.completedSessions || 0}/${task.targetSessions || 0} sessions`;
}

window.syncFocusSubtasks = syncFocusSubtasks;

// Focus mode event listeners
DOM.exitFocusBtn.addEventListener('click', exitFocusMode);
DOM.focusTimerToggle.addEventListener('click', toggleTimer);
DOM.focusTimerReset.addEventListener('click', resetTimer);

// Expose functions to global scope for inline HTML handlers
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.setActiveTaskAndStart = setActiveTaskAndStart;
window.openTaskDetail = openTaskDetail;
window.toggleSubtask = toggleSubtask;
window.deleteSubtask = deleteSubtask;
