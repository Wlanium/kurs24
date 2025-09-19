// Quiz State
let quizType = null;
let quizQuestions = [];
let currentQuestionIndex = 0;
let quizCorrect = 0;
let quizIncorrect = 0;

// Quiz Elements
const quizSelection = document.querySelector('.quiz-selection');
const quizContainer = document.querySelector('.quiz-container');
const quizComplete = document.getElementById('quizComplete');
const backToQuizSelection = document.getElementById('backToQuizSelection');
const quizTypeTitle = document.getElementById('quizTypeTitle');
const currentQuestionEl = document.getElementById('currentQuestion');
const totalQuestionsEl = document.getElementById('totalQuestions');
const quizProgressFill = document.getElementById('quizProgressFill');
const quizPercentageEl = document.getElementById('quizPercentage');
const restartQuizBtn = document.getElementById('restartQuiz');
const quizQuestionText = document.getElementById('quizQuestionText');
const resultDetails = document.getElementById('resultDetails');

// Initialize Quiz
document.querySelectorAll('.quiz-type-card').forEach(card => {
    card.addEventListener('click', () => startQuiz(card.dataset.type));
});

backToQuizSelection.addEventListener('click', showQuizSelection);
restartQuizBtn.addEventListener('click', showQuizSelection);

function showQuizSelection() {
    quizSelection.classList.remove('hidden');
    quizContainer.classList.add('hidden');
    quizComplete.classList.add('hidden');
    resetQuizState();
}

function resetQuizState() {
    quizType = null;
    quizQuestions = [];
    currentQuestionIndex = 0;
    quizCorrect = 0;
    quizIncorrect = 0;
    updateQuizStats();
}

async function startQuiz(type) {
    quizType = type;
    quizSelection.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    
    // Set quiz title
    const titles = {
        'definition': 'Begriffe erkennen',
        'reverse': 'Begriff finden',
        'category': 'Kategorien zuordnen',
        'difficulty': 'Schwierigkeits-Quiz'
    };
    quizTypeTitle.textContent = titles[type];
    
    // Generate questions based on type
    await generateQuizQuestions(type);
    
    // Start quiz
    currentQuestionIndex = 0;
    totalQuestionsEl.textContent = quizQuestions.length;
    showQuestion();
}

async function generateQuizQuestions(type) {
    try {
        const response = await fetch('/api/begriffe');
        const allBegriffe = await response.json();
        
        // Shuffle array
        const shuffled = [...allBegriffe].sort(() => Math.random() - 0.5);
        
        // Generate 10 questions
        quizQuestions = [];
        const numQuestions = Math.min(10, shuffled.length);
        
        for (let i = 0; i < numQuestions; i++) {
            const begriff = shuffled[i];
            const otherBegriffe = shuffled.filter(b => b.id !== begriff.id);
            
            let question = {};
            
            switch (type) {
                case 'definition':
                    question = {
                        text: `Was bedeutet "${begriff.begriff}"?`,
                        correct: begriff.erklaerung,
                        answers: [
                            begriff.erklaerung,
                            ...otherBegriffe.slice(0, 3).map(b => b.erklaerung)
                        ].sort(() => Math.random() - 0.5),
                        details: {
                            begriff: begriff.begriff,
                            kategorie: begriff.kategorie,
                            beispiel: begriff.beispiel,
                            tipp: begriff.tipp
                        }
                    };
                    break;
                    
                case 'reverse':
                    question = {
                        text: `Welcher Begriff bedeutet: "${begriff.erklaerung}"?`,
                        correct: begriff.begriff,
                        answers: [
                            begriff.begriff,
                            ...otherBegriffe.slice(0, 3).map(b => b.begriff)
                        ].sort(() => Math.random() - 0.5),
                        details: {
                            begriff: begriff.begriff,
                            kategorie: begriff.kategorie,
                            beispiel: begriff.beispiel
                        }
                    };
                    break;
                    
                case 'category':
                    const categories = ['Einkaufen', 'Wohnen', 'Arbeit', 'Familie', 'Verträge Allgemein'];
                    question = {
                        text: `Zu welcher Kategorie gehört "${begriff.begriff}"?`,
                        correct: begriff.kategorie,
                        answers: categories.filter(c => c === begriff.kategorie || Math.random() > 0.5).slice(0, 4),
                        details: {
                            begriff: begriff.begriff,
                            erklaerung: begriff.erklaerung,
                            beispiel: begriff.beispiel
                        }
                    };
                    break;
                    
                case 'difficulty':
                    // Filter by difficulty for this type
                    const difficulty = ['leicht', 'mittel', 'schwer'][Math.floor(i / 3.5)];
                    const difficultyBegriffe = allBegriffe.filter(b => b.schwierigkeit === difficulty);
                    if (difficultyBegriffe.length > 0) {
                        const selectedBegriff = difficultyBegriffe[Math.floor(Math.random() * difficultyBegriffe.length)];
                        question = {
                            text: `[${difficulty.toUpperCase()}] Was bedeutet "${selectedBegriff.begriff}"?`,
                            correct: selectedBegriff.erklaerung,
                            answers: [
                                selectedBegriff.erklaerung,
                                ...otherBegriffe.slice(0, 3).map(b => b.erklaerung)
                            ].sort(() => Math.random() - 0.5),
                            details: {
                                begriff: selectedBegriff.begriff,
                                kategorie: selectedBegriff.kategorie,
                                schwierigkeit: selectedBegriff.schwierigkeit,
                                beispiel: selectedBegriff.beispiel
                            }
                        };
                    }
                    break;
            }
            
            if (question.text) {
                quizQuestions.push(question);
            }
        }
    } catch (error) {
        console.error('Fehler beim Generieren der Quiz-Fragen:', error);
    }
}

function showQuestion() {
    if (currentQuestionIndex >= quizQuestions.length) {
        showQuizComplete();
        return;
    }
    
    const question = quizQuestions[currentQuestionIndex];
    currentQuestionEl.textContent = currentQuestionIndex + 1;
    quizQuestionText.textContent = question.text;
    
    // Update progress
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
    quizProgressFill.style.width = `${progress}%`;
    
    // Render answers
    quizAnswers.innerHTML = '';
    quizResult.classList.add('hidden');
    
    question.answers.forEach((answer, index) => {
        const answerEl = document.createElement('div');
        answerEl.className = 'quiz-answer';
        answerEl.textContent = answer;
        answerEl.onclick = () => selectQuizAnswer(answer, answerEl, question);
        quizAnswers.appendChild(answerEl);
    });
}

function selectQuizAnswer(selectedAnswer, answerEl, question) {
    const isCorrect = selectedAnswer === question.correct;
    
    // Disable all answers
    const allAnswers = document.querySelectorAll('.quiz-answer');
    allAnswers.forEach(el => {
        el.onclick = null;
        if (el.textContent === question.correct) {
            el.classList.add('correct');
        } else if (el === answerEl && !isCorrect) {
            el.classList.add('wrong');
        }
    });
    
    // Update score
    if (isCorrect) {
        quizCorrect++;
        resultText.textContent = 'Richtig! 🎉';
        quizResult.className = 'quiz-result correct';
    } else {
        quizIncorrect++;
        resultText.textContent = 'Leider falsch.';
        quizResult.className = 'quiz-result wrong';
    }
    
    // Show details
    if (question.details) {
        let detailsHTML = '<h4>Details:</h4><ul>';
        Object.entries(question.details).forEach(([key, value]) => {
            if (value) {
                const labels = {
                    begriff: 'Begriff',
                    erklaerung: 'Erklärung',
                    kategorie: 'Kategorie',
                    beispiel: 'Beispiel',
                    tipp: 'Tipp',
                    schwierigkeit: 'Schwierigkeit'
                };
                detailsHTML += `<li><strong>${labels[key] || key}:</strong> ${value}</li>`;
            }
        });
        detailsHTML += '</ul>';
        resultDetails.innerHTML = detailsHTML;
    }
    
    updateQuizStats();
    quizResult.classList.remove('hidden');
}

function updateQuizStats() {
    quizScoreEl.textContent = quizCorrect;
    quizWrongEl.textContent = quizIncorrect;
    
    const total = quizCorrect + quizIncorrect;
    const percentage = total > 0 ? Math.round((quizCorrect / total) * 100) : 0;
    quizPercentageEl.textContent = `${percentage}%`;
}

function showQuizComplete() {
    quizContainer.classList.add('hidden');
    quizComplete.classList.remove('hidden');
    
    const total = quizQuestions.length;
    const percentage = Math.round((quizCorrect / total) * 100);
    
    document.getElementById('finalPercentage').textContent = `${percentage}%`;
    document.getElementById('finalCorrect').textContent = quizCorrect;
    document.getElementById('finalTotal').textContent = total;
    
    // Color based on score
    const scoreCircle = document.querySelector('.score-circle');
    if (percentage >= 80) {
        scoreCircle.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (percentage >= 60) {
        scoreCircle.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else {
        scoreCircle.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    }
}

// Next question handler
nextQuizBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    showQuestion();
});