// Dozenten Dashboard JavaScript
class CourseManager {
    constructor() {
        this.sessions = [];
        this.currentSession = 0;
        this.completedSessions = new Set(JSON.parse(localStorage.getItem('completedSessions') || '[]'));
        this.sessionNotes = JSON.parse(localStorage.getItem('sessionNotes') || '{}');
        this.globalNotes = localStorage.getItem('globalNotes') || '';
        this.timer = null;
        this.timerMinutes = 45;
        this.timerSeconds = 0;
        this.timerRunning = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadSessions();
        this.updateProgress();
    }
    
    initializeElements() {
        // Progress elements
        this.totalProgressEl = document.getElementById('totalProgress');
        this.activeSessionEl = document.getElementById('activeSession');
        this.completedSessionsEl = document.getElementById('completedSessions');
        this.currentSessionDisplayEl = document.getElementById('currentSessionDisplay');
        
        // Navigation
        this.prevSessionBtn = document.getElementById('prevSession');
        this.nextSessionBtn = document.getElementById('nextSession');
        
        // Timer
        this.timerModal = document.getElementById('timerModal');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerSession = document.getElementById('timerSession');
        this.startTimerBtn = document.getElementById('startTimer');
        this.pauseTimerBtn = document.getElementById('pauseTimer');
        this.resetTimerBtn = document.getElementById('resetTimer');
        this.closeTimerBtn = document.getElementById('closeTimer');
        
        // Notes
        this.globalNotesEl = document.getElementById('globalNotes');
        this.globalNotesEl.value = this.globalNotes;
    }
    
    setupEventListeners() {
        // Navigation
        this.prevSessionBtn.addEventListener('click', () => this.previousSession());
        this.nextSessionBtn.addEventListener('click', () => this.nextSession());
        
        // Session controls
        document.addEventListener('click', (e) => {
            const session = e.target.closest('.session');
            const sessionNumber = session?.dataset.session;
            
            if (e.target.closest('.start-btn')) {
                this.startSession(parseInt(sessionNumber));
            } else if (e.target.closest('.timer-btn')) {
                this.openTimer(parseInt(sessionNumber));
            } else if (e.target.closest('.complete-btn')) {
                this.toggleSessionComplete(parseInt(sessionNumber));
            } else if (e.target.closest('.session-header')) {
                this.toggleSessionExpanded(session);
            }
        });
        
        // Timer controls
        this.startTimerBtn.addEventListener('click', () => this.startTimer());
        this.pauseTimerBtn.addEventListener('click', () => this.pauseTimer());
        this.resetTimerBtn.addEventListener('click', () => this.resetTimer());
        this.closeTimerBtn.addEventListener('click', () => this.closeTimer());
        
        // Timer presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                this.setTimer(minutes, 0);
            });
        });
        
        // Notes saving
        document.querySelector('.save-notes-btn').addEventListener('click', () => this.saveNotes());
        
        // Auto-save notes
        this.globalNotesEl.addEventListener('input', () => {
            this.globalNotes = this.globalNotesEl.value;
            localStorage.setItem('globalNotes', this.globalNotes);
        });
        
        // Session notes auto-save
        document.addEventListener('input', (e) => {
            if (e.target.matches('.session-notes textarea')) {
                const session = e.target.closest('.session');
                const sessionNumber = session?.dataset.session;
                if (sessionNumber) {
                    this.sessionNotes[sessionNumber] = e.target.value;
                    localStorage.setItem('sessionNotes', JSON.stringify(this.sessionNotes));
                }
            }
        });
        
        // Reset progress
        document.getElementById('resetProgress').addEventListener('click', () => this.resetProgress());
        
        // Presentation mode
        document.getElementById('presentationMode').addEventListener('click', () => this.togglePresentationMode());
    }
    
    loadSessions() {
        this.sessions = Array.from(document.querySelectorAll('.session')).map((el, index) => ({
            element: el,
            number: parseInt(el.dataset.session),
            title: el.querySelector('.session-title').textContent,
            completed: this.completedSessions.has(parseInt(el.dataset.session))
        }));
        
        // Load session notes
        this.sessions.forEach(session => {
            const noteTextarea = session.element.querySelector('.session-notes textarea');
            if (noteTextarea && this.sessionNotes[session.number]) {
                noteTextarea.value = this.sessionNotes[session.number];
            }
        });
        
        // Update session states
        this.updateSessionStates();
    }
    
    updateSessionStates() {
        this.sessions.forEach(session => {
            if (session.completed) {
                session.element.classList.add('completed');
            } else {
                session.element.classList.remove('completed');
            }
            
            if (session.number === this.currentSession) {
                session.element.classList.add('active');
            } else {
                session.element.classList.remove('active');
            }
        });
    }
    
    updateProgress() {
        const totalSessions = this.sessions.length;
        const completed = this.completedSessions.size;
        const progressPercentage = totalSessions > 0 ? Math.round((completed / totalSessions) * 100) : 0;
        
        this.totalProgressEl.textContent = `${progressPercentage}%`;
        this.activeSessionEl.textContent = this.currentSession || '-';
        this.completedSessionsEl.textContent = `${completed}/${totalSessions}`;
        
        // Update day progress bars
        document.querySelectorAll('.day-card').forEach(dayCard => {
            const daySessions = dayCard.querySelectorAll('.session');
            const dayCompleted = Array.from(daySessions).filter(session => 
                this.completedSessions.has(parseInt(session.dataset.session))
            ).length;
            
            const dayProgressFill = dayCard.querySelector('.progress-fill');
            const dayProgressText = dayCard.querySelector('.progress-text');
            const dayProgressPercentage = (dayCompleted / daySessions.length) * 100;
            
            dayProgressFill.style.width = `${dayProgressPercentage}%`;
            dayProgressText.textContent = `${dayCompleted}/${daySessions.length}`;
        });
        
        // Update navigation
        this.updateNavigation();
    }
    
    updateNavigation() {
        const currentSessionTitle = this.sessions.find(s => s.number === this.currentSession)?.title || 'Einheit auswählen';
        this.currentSessionDisplayEl.textContent = `Einheit ${this.currentSession}: ${currentSessionTitle}`;
        
        this.prevSessionBtn.disabled = this.currentSession <= 1;
        this.nextSessionBtn.disabled = this.currentSession >= this.sessions.length;
    }
    
    startSession(sessionNumber) {
        this.currentSession = sessionNumber;
        this.updateSessionStates();
        this.updateProgress();
        
        // Scroll to session
        const sessionElement = document.querySelector(`[data-session="${sessionNumber}"]`);
        if (sessionElement) {
            sessionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.toggleSessionExpanded(sessionElement, true);
        }
        
        this.showNotification(`Einheit ${sessionNumber} gestartet`, 'info');
    }
    
    toggleSessionComplete(sessionNumber) {
        if (this.completedSessions.has(sessionNumber)) {
            this.completedSessions.delete(sessionNumber);
            this.showNotification(`Einheit ${sessionNumber} als unvollständig markiert`, 'warning');
        } else {
            this.completedSessions.add(sessionNumber);
            this.showNotification(`Einheit ${sessionNumber} abgeschlossen!`, 'success');
        }
        
        localStorage.setItem('completedSessions', JSON.stringify([...this.completedSessions]));
        this.updateSessionStates();
        this.updateProgress();
    }
    
    toggleSessionExpanded(sessionElement, forceExpand = null) {
        const isExpanded = sessionElement.classList.contains('expanded');
        
        if (forceExpand === true || (!isExpanded && forceExpand !== false)) {
            sessionElement.classList.add('expanded');
        } else {
            sessionElement.classList.remove('expanded');
        }
    }
    
    previousSession() {
        if (this.currentSession > 1) {
            this.startSession(this.currentSession - 1);
        }
    }
    
    nextSession() {
        if (this.currentSession < this.sessions.length) {
            this.startSession(this.currentSession + 1);
        }
    }
    
    // Timer Functions
    openTimer(sessionNumber = null) {
        if (sessionNumber) {
            this.currentSession = sessionNumber;
            const session = this.sessions.find(s => s.number === sessionNumber);
            this.timerSession.textContent = `Einheit ${sessionNumber}: ${session?.title || ''}`;
        }
        
        this.timerModal.classList.remove('hidden');
        this.updateTimerDisplay();
    }
    
    closeTimer() {
        this.timerModal.classList.add('hidden');
        this.pauseTimer();
    }
    
    setTimer(minutes, seconds = 0) {
        this.timerMinutes = minutes;
        this.timerSeconds = seconds;
        this.updateTimerDisplay();
    }
    
    updateTimerDisplay() {
        const minutes = String(this.timerMinutes).padStart(2, '0');
        const seconds = String(this.timerSeconds).padStart(2, '0');
        this.timerDisplay.textContent = `${minutes}:${seconds}`;
        
        // Update document title when timer is running
        if (this.timerRunning) {
            document.title = `${minutes}:${seconds} - Dozenten Dashboard`;
        } else {
            document.title = 'Dozenten Dashboard - IHK Privatrecht';
        }
    }
    
    startTimer() {
        if (!this.timerRunning) {
            this.timerRunning = true;
            this.timer = setInterval(() => {
                if (this.timerSeconds > 0) {
                    this.timerSeconds--;
                } else if (this.timerMinutes > 0) {
                    this.timerMinutes--;
                    this.timerSeconds = 59;
                } else {
                    // Timer finished
                    this.pauseTimer();
                    this.showNotification('Zeit abgelaufen!', 'warning');
                    this.playTimerSound();
                    return;
                }
                this.updateTimerDisplay();
            }, 1000);
            
            this.startTimerBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        } else {
            this.pauseTimer();
        }
    }
    
    pauseTimer() {
        this.timerRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.startTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        document.title = 'Dozenten Dashboard - IHK Privatrecht';
    }
    
    resetTimer() {
        this.pauseTimer();
        this.setTimer(45, 0);
    }
    
    playTimerSound() {
        // Create audio notification
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGk4Chpl3/Xz');
        audio.play().catch(() => {}); // Ignore errors if audio is blocked
    }
    
    // Utility Functions
    saveNotes() {
        localStorage.setItem('globalNotes', this.globalNotes);
        localStorage.setItem('sessionNotes', JSON.stringify(this.sessionNotes));
        this.showNotification('Notizen gespeichert!', 'success');
    }
    
    resetProgress() {
        if (confirm('Wirklich den gesamten Kursfortschritt zurücksetzen?')) {
            this.completedSessions.clear();
            this.currentSession = 0;
            localStorage.removeItem('completedSessions');
            this.updateSessionStates();
            this.updateProgress();
            this.showNotification('Fortschritt zurückgesetzt', 'info');
        }
    }
    
    togglePresentationMode() {
        if (document.documentElement.requestFullscreen) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        }
        this.showNotification('Präsentationsmodus umgeschaltet', 'info');
    }
    
    exportProgress() {
        const data = {
            completedSessions: [...this.completedSessions],
            currentSession: this.currentSession,
            sessionNotes: this.sessionNotes,
            globalNotes: this.globalNotes,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kurs-fortschritt-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Fortschritt exportiert!', 'success');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Participant Progress Management
class ParticipantProgressManager {
    constructor() {
        this.participants = [];
        this.loadParticipantProgress();
    }
    
    async loadParticipantProgress() {
        try {
            const response = await fetch('/api/dozent/progress');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.participants = data.users;
                    this.renderParticipantOverview();
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden der Teilnehmer-Fortschritte:', error);
        }
    }
    
    renderParticipantOverview() {
        // Create or update participants section
        let participantsSection = document.getElementById('participantsSection');
        if (!participantsSection) {
            participantsSection = document.createElement('div');
            participantsSection.id = 'participantsSection';
            participantsSection.className = 'tool-section';
            participantsSection.innerHTML = `
                <h3><i class="fas fa-users"></i> Teilnehmer-Fortschritte</h3>
                <div id="participantsList"></div>
            `;
            
            // Insert after instructor tools
            const instructorTools = document.querySelector('.instructor-tools');
            if (instructorTools) {
                instructorTools.after(participantsSection);
            }
        }
        
        const participantsList = document.getElementById('participantsList');
        if (!participantsList) return;
        
        if (this.participants.length === 0) {
            participantsList.innerHTML = '<p class="no-participants">Noch keine Teilnehmer registriert.</p>';
            return;
        }
        
        participantsList.innerHTML = `
            <div class="participants-summary">
                <div class="summary-stats">
                    <span><strong>${this.participants.length}</strong> Teilnehmer</span>
                    <span><strong>${this.getAverageProgress()}%</strong> Durchschnittlicher Fortschritt</span>
                    <span><strong>${this.getActiveParticipants()}</strong> Aktive Teilnehmer</span>
                </div>
            </div>
            <div class="participants-grid">
                ${this.participants.map(participant => this.renderParticipantCard(participant)).join('')}
            </div>
        `;
        
        // Add click handlers for participant cards
        participantsList.querySelectorAll('.participant-card').forEach(card => {
            card.addEventListener('click', () => {
                const userId = parseInt(card.dataset.userId);
                this.showParticipantDetails(userId);
            });
        });
    }
    
    renderParticipantCard(participant) {
        const lastActivity = participant.last_activity 
            ? new Date(participant.last_activity).toLocaleDateString('de-DE')
            : 'Nie';
            
        return `
            <div class="participant-card" data-user-id="${participant.user_id}">
                <div class="participant-header">
                    <div class="participant-name">${participant.username}</div>
                    <div class="participant-progress">${participant.progress_percentage}%</div>
                </div>
                <div class="participant-stats">
                    <div class="stat">
                        <span class="stat-label">Gelernt:</span>
                        <span class="stat-value">${participant.learned_terms}/30</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Quiz-Genauigkeit:</span>
                        <span class="stat-value">${participant.quiz_accuracy}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Letzte Aktivität:</span>
                        <span class="stat-value">${lastActivity}</span>
                    </div>
                </div>
                <div class="progress-bar-small">
                    <div class="progress-fill-small" style="width: ${participant.progress_percentage}%"></div>
                </div>
            </div>
        `;
    }
    
    async showParticipantDetails(userId) {
        try {
            const response = await fetch(`/api/dozent/user/${userId}/progress`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.renderParticipantModal(data);
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden der Teilnehmer-Details:', error);
        }
    }
    
    renderParticipantModal(data) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('participantModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'participantModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        const categoriesMap = {};
        data.progress.forEach(item => {
            if (!categoriesMap[item.kategorie]) {
                categoriesMap[item.kategorie] = [];
            }
            categoriesMap[item.kategorie].push(item);
        });
        
        modal.innerHTML = `
            <div class="modal-content participant-modal-content">
                <div class="modal-header">
                    <h3>Fortschritt: ${data.user.username}</h3>
                    <button class="modal-close" onclick="document.getElementById('participantModal').classList.add('hidden')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="participant-overview">
                        <div class="overview-stats">
                            <div class="overview-stat">
                                <span class="stat-label">E-Mail:</span>
                                <span class="stat-value">${data.user.email || 'Nicht angegeben'}</span>
                            </div>
                            <div class="overview-stat">
                                <span class="stat-label">Registriert:</span>
                                <span class="stat-value">${new Date(data.user.created_at).toLocaleDateString('de-DE')}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${Object.keys(categoriesMap).map(kategorie => `
                        <div class="category-section">
                            <h4 class="category-title">${kategorie}</h4>
                            <div class="terms-grid">
                                ${categoriesMap[kategorie].map(term => `
                                    <div class="term-card ${term.learned ? 'learned' : ''}">
                                        <div class="term-name">${term.begriff}</div>
                                        <div class="term-stats">
                                            ${term.learned ? '<i class="fas fa-check-circle learned-icon"></i>' : '<i class="fas fa-circle not-learned-icon"></i>'}
                                            ${term.quiz_attempts > 0 ? `<span class="quiz-stats">${term.quiz_correct}/${term.quiz_attempts} (${term.quiz_accuracy}%)</span>` : '<span class="no-quiz">Kein Quiz</span>'}
                                        </div>
                                        ${term.notes ? `<div class="term-notes">📝 ${term.notes}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }
    
    getAverageProgress() {
        if (this.participants.length === 0) return 0;
        const total = this.participants.reduce((sum, p) => sum + p.progress_percentage, 0);
        return Math.round(total / this.participants.length);
    }
    
    getActiveParticipants() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return this.participants.filter(p => 
            p.last_activity && new Date(p.last_activity) > oneWeekAgo
        ).length;
    }
}

// Global Functions
function openQuizMode() {
    window.open('/teilnehmer?mode=quiz', '_blank');
}

function toggleTimer() {
    courseManager.openTimer();
}

function exportProgress() {
    courseManager.exportProgress();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.courseManager = new CourseManager();
    window.participantManager = new ParticipantProgressManager();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    courseManager.saveNotes();
                    break;
                case 't':
                    e.preventDefault();
                    courseManager.openTimer();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    courseManager.previousSession();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    courseManager.nextSession();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            courseManager.closeTimer();
        }
    });
    
    // Add notification styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 15px 20px;
                box-shadow: var(--shadow-lg);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 9999;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
                max-width: 300px;
            }
            
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification-success {
                border-left: 4px solid var(--success-color);
                color: var(--success-color);
            }
            
            .notification-warning {
                border-left: 4px solid var(--warning-color);
                color: var(--warning-color);
            }
            
            .notification-info {
                border-left: 4px solid var(--primary-color);
                color: var(--primary-color);
            }
        `;
        document.head.appendChild(style);
    }
});