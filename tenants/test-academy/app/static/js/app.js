// App State
let begriffe = [];
let kategorien = [];
let currentQuiz = null;
let quizScore = 0;
let quizWrong = 0;
let learnedTerms = JSON.parse(localStorage.getItem('learnedTerms') || '[]');
let userProgress = {};
let isLoggedIn = false;

// DOM Elements
const begriffeGrid = document.getElementById('begriffeGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const studyMode = document.getElementById('studyMode');
const quizMode = document.getElementById('quizMode');
const studySection = document.getElementById('studySection');
const quizSection = document.getElementById('quizSection');
const begriffModal = document.getElementById('begriffModal');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Modal Elements
const modalClose = document.getElementById('modalClose');
const modalTerm = document.getElementById('modalTerm');
const modalCategory = document.getElementById('modalCategory');
const modalExplanation = document.getElementById('modalExplanation');
const modalExample = document.getElementById('modalExample');
const modalTip = document.getElementById('modalTip');
const modalEnglish = document.getElementById('modalEnglish');
const modalArabic = document.getElementById('modalArabic');
const modalTurkish = document.getElementById('modalTurkish');
const toggleLearned = document.getElementById('toggleLearned');

// Quiz Elements
const quizTerm = document.getElementById('quizTerm');
const quizAnswers = document.getElementById('quizAnswers');
const quizResult = document.getElementById('quizResult');
const resultText = document.getElementById('resultText');
const nextQuizBtn = document.getElementById('nextQuizBtn');
const quizScoreEl = document.getElementById('quizScore');
const quizWrongEl = document.getElementById('quizWrong');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadBegriffe();
    loadKategorien();
    setupEventListeners();
    updateProgress();
});

// Event Listeners
function setupEventListeners() {
    // Search and Filter
    searchInput.addEventListener('input', filterBegriffe);
    categoryFilter.addEventListener('change', filterBegriffe);
    
    // Mode Toggle
    studyMode.addEventListener('click', () => switchMode('study'));
    quizMode.addEventListener('click', () => switchMode('quiz'));
    
    // Modal
    modalClose.addEventListener('click', closeModal);
    begriffModal.addEventListener('click', (e) => {
        if (e.target === begriffModal) closeModal();
    });
    
    // Toggle Learned
    toggleLearned.addEventListener('click', toggleLearnedStatus);
    
    // Quiz
    nextQuizBtn.addEventListener('click', loadQuiz);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// Load Data
async function loadBegriffe() {
    try {
        const response = await fetch('/api/begriffe');
        begriffe = await response.json();
        renderBegriffe(begriffe);
    } catch (error) {
        console.error('Fehler beim Laden der Begriffe:', error);
        showToast('Fehler beim Laden der Begriffe', 'is-danger');
    }
}

async function loadKategorien() {
    try {
        const response = await fetch('/api/kategorien');
        kategorien = await response.json();
        renderKategorien();
    } catch (error) {
        console.error('Fehler beim Laden der Kategorien:', error);
        showToast('Fehler beim Laden der Kategorien', 'is-danger');
    }
}

// Helper function for Bulma Toast notifications
function showToast(message, type = 'is-info', duration = 4000) {
    if (typeof bulmaToast !== 'undefined') {
        bulmaToast.toast({
            message: message,
            type: type,
            duration: duration,
            position: 'top-right',
            dismissible: true,
            pauseOnHover: true,
            animate: { in: 'fadeIn', out: 'fadeOut' }
        });
    } else {
        // Fallback for when Bulma Toast is not available
        console.log(`${type}: ${message}`);
    }
}

// Render Functions
function renderBegriffe(begriffeToRender) {
    begriffeGrid.innerHTML = '<div class="begriffe-wall"></div>';
    const wall = begriffeGrid.querySelector('.begriffe-wall');
    
    begriffeToRender.forEach((begriff, index) => {
        const card = createBegriffCard(begriff);
        // Add slight delay for staggered animation
        setTimeout(() => {
            card.style.opacity = '0';
            wall.appendChild(card);
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            }, 50);
        }, index * 30);
    });
}

function createBegriffCard(begriff) {
    const card = document.createElement('div');
    card.className = `begriff-card ${learnedTerms.includes(begriff.id) ? 'learned' : ''}`;
    card.onclick = () => openModal(begriff);
    
    const categoryClass = begriff.kategorie.toLowerCase().replace(/\s+/g, '-').replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue');
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-term">${begriff.begriff}</div>
            <span class="card-category ${categoryClass}">${begriff.kategorie}</span>
        </div>
        <div class="card-body">
            <div class="card-explanation">${begriff.erklaerung}</div>
            <div class="card-difficulty difficulty-${begriff.schwierigkeit}">${begriff.schwierigkeit}</div>
        </div>
    `;
    
    return card;
}

function renderKategorien() {
    categoryFilter.innerHTML = '<option value="">Alle Kategorien</option>';
    
    kategorien.forEach(kategorie => {
        const option = document.createElement('option');
        option.value = kategorie;
        option.textContent = kategorie;
        categoryFilter.appendChild(option);
    });
}

// Filter and Search
async function filterBegriffe() {
    const search = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    
    try {
        let url = '/api/begriffe?';
        const params = new URLSearchParams();
        
        if (search) params.append('search', search);
        if (category) params.append('kategorie', category);
        
        const response = await fetch(url + params.toString());
        const filteredBegriffe = await response.json();
        renderBegriffe(filteredBegriffe);
    } catch (error) {
        console.error('Fehler beim Filtern:', error);
    }
}

// Mode Switching
function switchMode(mode) {
    if (mode === 'study') {
        studyMode.classList.add('active');
        quizMode.classList.remove('active');
        studySection.classList.remove('hidden');
        quizSection.classList.add('hidden');
    } else {
        quizMode.classList.add('active');
        studyMode.classList.remove('active');
        quizSection.classList.remove('hidden');
        studySection.classList.add('hidden');
        // Show quiz selection instead of starting quiz directly
        if (typeof showQuizSelection === 'function') {
            showQuizSelection();
        }
    }
}

// Modal Functions
function openModal(begriff) {
    // Store current begriff for settings updates
    window.currentModalBegriff = begriff;
    
    modalTerm.textContent = begriff.begriff;
    modalCategory.textContent = begriff.kategorie;
    modalCategory.className = `modal-category ${begriff.kategorie.toLowerCase().replace(/\s+/g, '-').replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')}`;
    modalExplanation.textContent = begriff.erklaerung;
    modalExample.textContent = begriff.beispiel;
    modalTip.textContent = begriff.tipp || 'Kein Tipp verfügbar';
    
    // Update translations based on selected languages
    updateModalTranslations(); // Fire and forget - translations will load async
    
    // Update button state
    const isLearned = learnedTerms.includes(begriff.id);
    toggleLearned.dataset.begriffId = begriff.id;
    toggleLearned.innerHTML = isLearned 
        ? '<i class="fas fa-times"></i> Als ungelernt markieren'
        : '<i class="fas fa-check"></i> Als gelernt markieren';
    toggleLearned.className = isLearned ? 'btn btn-success learned' : 'btn btn-success';
    
    begriffModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

async function updateModalTranslations() {
    // Use settings manager if available
    if (window.settingsManager) {
        await window.settingsManager.updateModalTranslations();
    } else {
        // Fallback to original translations
        const translationsContainer = document.getElementById('modalTranslations');
        translationsContainer.innerHTML = `
            <div class="translation">
                <span class="lang">🇬🇧</span>
                <div class="translation-content">
                    <div class="translation-text">${window.currentModalBegriff?.englisch || 'Not available'}</div>
                    <div class="translation-label">English</div>
                </div>
            </div>
            <div class="translation">
                <span class="lang">🇸🇦</span>
                <div class="translation-content">
                    <div class="translation-text">${window.currentModalBegriff?.arabisch || 'غير متوفر'}</div>
                    <div class="translation-label">العربية</div>
                </div>
            </div>
            <div class="translation">
                <span class="lang">🇹🇷</span>
                <div class="translation-content">
                    <div class="translation-text">${window.currentModalBegriff?.tuerkisch || 'Mevcut değil'}</div>
                    <div class="translation-label">Türkçe</div>
                </div>
            </div>
        `;
    }
}

function closeModal() {
    begriffModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function toggleLearnedStatus() {
    const begriffId = parseInt(toggleLearned.dataset.begriffId);
    const isLearned = learnedTerms.includes(begriffId);
    const newLearnedStatus = !isLearned;
    
    await saveProgress(begriffId, newLearnedStatus);
    updateProgress();
    renderBegriffe(begriffe); // Re-render to update visual state
    
    // Show success toast
    const message = newLearnedStatus ? 'Begriff als gelernt markiert!' : 'Begriff als ungelernt markiert';
    showToast(message, 'is-success', 2000);
    
    closeModal();
}

function updateProgress() {
    const totalTerms = 30; // Assuming 30 terms total
    const learnedCount = learnedTerms.length;
    const percentage = (learnedCount / totalTerms) * 100;
    
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${learnedCount} von ${totalTerms} Begriffen gelernt`;
}

// Quiz Functions
async function loadQuiz() {
    try {
        const response = await fetch('/api/quiz');
        currentQuiz = await response.json();
        renderQuiz();
    } catch (error) {
        console.error('Fehler beim Laden des Quiz:', error);
    }
}

function renderQuiz() {
    quizTerm.textContent = currentQuiz.begriff;
    quizAnswers.innerHTML = '';
    quizResult.classList.add('hidden');
    
    currentQuiz.answers.forEach((answer, index) => {
        const answerEl = document.createElement('div');
        answerEl.className = 'quiz-answer';
        answerEl.textContent = answer;
        answerEl.onclick = () => selectAnswer(answer, answerEl);
        quizAnswers.appendChild(answerEl);
    });
}

async function selectAnswer(selectedAnswer, answerEl) {
    const isCorrect = selectedAnswer === currentQuiz.correct_answer;
    
    // Find the Begriff ID for this quiz question
    const begriff = begriffe.find(b => b.begriff === currentQuiz.begriff);
    if (begriff && isLoggedIn) {
        await saveQuizProgress(begriff.id, isCorrect);
    }
    
    // Disable all answers
    const allAnswers = document.querySelectorAll('.quiz-answer');
    allAnswers.forEach(el => {
        el.onclick = null;
        if (el.textContent === currentQuiz.correct_answer) {
            el.classList.add('correct');
        } else if (el === answerEl && !isCorrect) {
            el.classList.add('wrong');
        }
    });
    
    // Update score and show toast feedback
    if (isCorrect) {
        quizScore++;
        quizScoreEl.textContent = quizScore;
        resultText.textContent = 'Richtig! Gut gemacht!';
        quizResult.className = 'quiz-result correct';
        showToast('Richtig! 🎉', 'is-success', 2000);
    } else {
        quizWrong++;
        quizWrongEl.textContent = quizWrong;
        resultText.textContent = `Falsch. Die richtige Antwort ist: "${currentQuiz.correct_answer}"`;
        quizResult.className = 'quiz-result wrong';
        showToast(`Falsch! Die richtige Antwort war: "${currentQuiz.correct_answer}"`, 'is-warning', 4000);
    }
    
    quizResult.classList.remove('hidden');
}

// Progress and Login Functions
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/progress');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                isLoggedIn = true;
                userProgress = {};
                data.progress.forEach(item => {
                    userProgress[item.begriff_id] = item;
                    if (item.learned) {
                        learnedTerms.push(item.begriff_id);
                    }
                });
                // Don't override with localStorage if we have database data
                learnedTerms = [...new Set(learnedTerms)]; // Remove duplicates
                
                // Set user's preferred language as default if not already set
                if (data.preferred_language) {
                    window.userPreferredLanguage = data.preferred_language;
                    if (!localStorage.getItem('selectedLanguages')) {
                        const defaultLanguages = [data.preferred_language, 'en'].filter((lang, index, arr) => arr.indexOf(lang) === index);
                        localStorage.setItem('selectedLanguages', JSON.stringify(defaultLanguages));
                        showToast(`Ihre bevorzugte Sprache ${getLanguageName(data.preferred_language)} wurde als Standard gesetzt`, 'is-info', 3000);
                    }
                }
            }
        } else {
            isLoggedIn = false;
            // Use localStorage for guest users
        }
    } catch (error) {
        console.error('Fehler beim Prüfen des Login-Status:', error);
        isLoggedIn = false;
    }
}

async function saveProgress(begriffId, learned, notes = '') {
    if (!isLoggedIn) {
        // No guest access - redirect to login
        window.location.href = '/';
        return;
    }
    
    try {
        const response = await fetch(`/api/progress/begriff/${begriffId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ learned, notes })
        });
        
        if (response.ok) {
            // Update local state
            if (!userProgress[begriffId]) {
                userProgress[begriffId] = { begriff_id: begriffId };
            }
            userProgress[begriffId].learned = learned;
            userProgress[begriffId].notes = notes;
            
            // Update learnedTerms array
            const isInArray = learnedTerms.includes(begriffId);
            if (learned && !isInArray) {
                learnedTerms.push(begriffId);
            } else if (!learned && isInArray) {
                learnedTerms = learnedTerms.filter(id => id !== begriffId);
            }
        }
    } catch (error) {
        console.error('Fehler beim Speichern des Fortschritts:', error);
    }
}

async function saveQuizProgress(begriffId, correct) {
    if (!isLoggedIn) {
        return; // Quiz progress only saved for logged-in users
    }
    
    try {
        const response = await fetch('/api/progress/quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ begriff_id: begriffId, correct })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (!userProgress[begriffId]) {
                userProgress[begriffId] = { begriff_id: begriffId };
            }
            userProgress[begriffId].quiz_attempts = data.attempts;
            userProgress[begriffId].quiz_correct = data.correct;
        }
    } catch (error) {
        console.error('Fehler beim Speichern des Quiz-Fortschritts:', error);
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getLanguageName(langCode) {
    const languages = {
        'en': '🇬🇧 English',
        'ar': '🇸🇦 العربية',
        'tr': '🇹🇷 Türkçe',
        'ru': '🇷🇺 Русский',
        'pl': '🇵🇱 Polski',
        'it': '🇮🇹 Italiano',
        'fr': '🇫🇷 Français',
        'es': '🇪🇸 Español'
    };
    return languages[langCode] || langCode;
}

// Add debounced search
searchInput.addEventListener('input', debounce(filterBegriffe, 300));