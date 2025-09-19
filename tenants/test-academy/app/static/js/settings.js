// Settings State
let selectedLanguages = JSON.parse(localStorage.getItem('selectedLanguages') || '["en", "ar", "tr"]');
let darkMode = JSON.parse(localStorage.getItem('darkMode') || 'false');
let animationsEnabled = JSON.parse(localStorage.getItem('animationsEnabled') || 'true');
let defaultTargetLanguage = localStorage.getItem('defaultTargetLanguage') || 'en';

// Translation cache for live translations
let translationCache = new Map();

// Top 20 Migrantensprachen in Deutschland
const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
    { code: 'ar', name: 'Arabisch', flag: '🇸🇦', native: 'العربية' },
    { code: 'tr', name: 'Türkisch', flag: '🇹🇷', native: 'Türkçe' },
    { code: 'ru', name: 'Russisch', flag: '🇷🇺', native: 'Русский' },
    { code: 'pl', name: 'Polnisch', flag: '🇵🇱', native: 'Polski' },
    { code: 'it', name: 'Italienisch', flag: '🇮🇹', native: 'Italiano' },
    { code: 'fr', name: 'Französisch', flag: '🇫🇷', native: 'Français' },
    { code: 'es', name: 'Spanisch', flag: '🇪🇸', native: 'Español' },
    { code: 'pt', name: 'Portugiesisch', flag: '🇵🇹', native: 'Português' },
    { code: 'nl', name: 'Niederländisch', flag: '🇳🇱', native: 'Nederlands' },
    { code: 'fa', name: 'Persisch', flag: '🇮🇷', native: 'فارسی' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰', native: 'اردو' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
    { code: 'zh', name: 'Chinesisch', flag: '🇨🇳', native: '中文' },
    { code: 'vi', name: 'Vietnamesisch', flag: '🇻🇳', native: 'Tiếng Việt' },
    { code: 'th', name: 'Thailändisch', flag: '🇹🇭', native: 'ไทย' },
    { code: 'ro', name: 'Rumänisch', flag: '🇷🇴', native: 'Română' },
    { code: 'bg', name: 'Bulgarisch', flag: '🇧🇬', native: 'Български' },
    { code: 'hr', name: 'Kroatisch', flag: '🇭🇷', native: 'Hrvatski' },
    { code: 'sr', name: 'Serbisch', flag: '🇷🇸', native: 'Српски' },
    { code: 'sq', name: 'Albanisch', flag: '🇦🇱', native: 'Shqip' },
    { code: 'hu', name: 'Ungarisch', flag: '🇭🇺', native: 'Magyar' },
    { code: 'cs', name: 'Tschechisch', flag: '🇨🇿', native: 'Čeština' },
    { code: 'sk', name: 'Slowakisch', flag: '🇸🇰', native: 'Slovenčina' }
];

// Settings Elements - defensive loading
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsClose = document.getElementById('settingsClose');
const languageGrid = document.getElementById('languageGrid');
const selectAllLanguages = document.getElementById('selectAllLanguages');
const deselectAllLanguages = document.getElementById('deselectAllLanguages');
const saveSettings = document.getElementById('saveSettings');
const darkModeCheckbox = document.getElementById('darkMode');
const animationsCheckbox = document.getElementById('animationsEnabled');
const defaultTargetLanguageSelect = document.getElementById('defaultTargetLanguage');

// Initialize Settings
document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
    setupSettingsListeners();
    renderLanguageGrid();
    applySettings();
});

function setupSettingsListeners() {
    settingsBtn.addEventListener('click', openSettings);
    settingsClose.addEventListener('click', closeSettings);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettings();
    });
    
    selectAllLanguages.addEventListener('click', selectAllLanguagesFunc);
    deselectAllLanguages.addEventListener('click', deselectAllLanguagesFunc);
    saveSettings.addEventListener('click', saveSettingsFunc);
    
    darkModeCheckbox.addEventListener('change', (e) => {
        darkMode = e.target.checked;
        applyDarkMode();
    });
    
    animationsCheckbox.addEventListener('change', (e) => {
        animationsEnabled = e.target.checked;
        applyAnimations();
    });
    
    if (defaultTargetLanguageSelect) {
        defaultTargetLanguageSelect.addEventListener('change', (e) => {
            defaultTargetLanguage = e.target.value;
        });
    }
}

function initializeSettings() {
    darkModeCheckbox.checked = darkMode;
    animationsCheckbox.checked = animationsEnabled;
    if (defaultTargetLanguageSelect) {
        defaultTargetLanguageSelect.value = defaultTargetLanguage;
    }
}

function openSettings() {
    settingsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderLanguageGrid();
}

function closeSettings() {
    settingsModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function renderLanguageGrid() {
    languageGrid.innerHTML = '';
    
    languages.forEach(lang => {
        const languageItem = document.createElement('div');
        languageItem.className = `language-item ${selectedLanguages.includes(lang.code) ? 'active' : ''}`;
        
        languageItem.innerHTML = `
            <input type="checkbox" id="lang-${lang.code}" ${selectedLanguages.includes(lang.code) ? 'checked' : ''}>
            <span class="language-flag">${lang.flag}</span>
            <span class="language-name">${lang.name}</span>
            <span class="language-code">${lang.code}</span>
        `;
        
        // Click handler
        languageItem.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                const checkbox = languageItem.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
        
        // Checkbox handler
        const checkbox = languageItem.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (!selectedLanguages.includes(lang.code)) {
                    selectedLanguages.push(lang.code);
                }
                languageItem.classList.add('active');
            } else {
                selectedLanguages = selectedLanguages.filter(code => code !== lang.code);
                languageItem.classList.remove('active');
            }
            
            // Prevent having no languages selected
            if (selectedLanguages.length === 0) {
                selectedLanguages.push('en');
                renderLanguageGrid(); // Re-render to show English as selected
            }
        });
        
        languageGrid.appendChild(languageItem);
    });
}

function selectAllLanguagesFunc() {
    selectedLanguages = languages.map(lang => lang.code);
    renderLanguageGrid();
}

function deselectAllLanguagesFunc() {
    selectedLanguages = ['en']; // Keep at least English
    renderLanguageGrid();
}

function saveSettingsFunc() {
    // Save to localStorage
    localStorage.setItem('selectedLanguages', JSON.stringify(selectedLanguages));
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    localStorage.setItem('animationsEnabled', JSON.stringify(animationsEnabled));
    localStorage.setItem('defaultTargetLanguage', defaultTargetLanguage);
    
    // Apply settings
    applySettings();
    
    // Close modal
    closeSettings();
    
    // Show success message
    showNotification('Einstellungen gespeichert!', 'success');
    
    // Update modal translations if it's open
    if (!begriffModal.classList.contains('hidden')) {
        updateModalTranslations();
    }
}

function applySettings() {
    applyDarkMode();
    applyAnimations();
}

function applyDarkMode() {
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function applyAnimations() {
    if (animationsEnabled) {
        document.body.classList.remove('no-animations');
    } else {
        document.body.classList.add('no-animations');
    }
}

async function updateModalTranslations() {
    const currentBegriff = window.currentModalBegriff;
    if (!currentBegriff) return;
    
    const translationsContainer = document.querySelector('.translations');
    if (!translationsContainer) return;
    
    translationsContainer.innerHTML = '';
    
    // Show only selected languages
    for (const langCode of selectedLanguages) {
        const language = languages.find(l => l.code === langCode);
        if (!language) continue;
        
        // Create translation element with loading state
        const translationEl = document.createElement('div');
        translationEl.className = 'translation';
        translationEl.innerHTML = `
            <span class="lang">${language.flag}</span>
            <div class="translation-content">
                <div class="translation-text">Übersetze...</div>
                <div class="translation-label">${language.native}</div>
            </div>
        `;
        
        translationsContainer.appendChild(translationEl);
        
        // Get translation and update element
        try {
            const translation = await getTranslationForLanguage(currentBegriff, langCode);
            const textEl = translationEl.querySelector('.translation-text');
            textEl.textContent = translation;
        } catch (error) {
            console.error('Translation error:', error);
            const textEl = translationEl.querySelector('.translation-text');
            textEl.textContent = getPlaceholderTranslation(langCode, currentBegriff.begriff);
        }
    }
}

// Live translation function using MyMemory API
async function translateText(text, fromLang, toLang) {
    // Create cache key
    const cacheKey = `${fromLang}-${toLang}-${text}`;
    
    // Check cache first
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }
    
    try {
        // Use MyMemory Translation API (free alternative to Google Translate)
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`);
        const data = await response.json();
        
        let translation = data.responseData.translatedText;
        
        // Store in cache
        translationCache.set(cacheKey, translation);
        
        return translation;
    } catch (error) {
        console.log('Translation failed:', error);
        return text; // Return original text if translation fails
    }
}

async function getTranslationForLanguage(begriff, langCode) {
    // For German, return original content
    if (langCode === 'de') {
        return begriff.begriff;
    }
    
    // For other languages, use live translation
    try {
        return await translateText(begriff.begriff, 'de', langCode);
    } catch (error) {
        console.error('Translation error:', error);
        return getPlaceholderTranslation(langCode, begriff.begriff);
    }
}

function getPlaceholderTranslation(langCode, begriff) {
    const placeholders = {
        'ru': 'Пока недоступно',
        'pl': 'Obecnie niedostępne', 
        'it': 'Non disponibile',
        'fr': 'Pas disponible',
        'es': 'No disponible',
        'pt': 'Não disponível',
        'nl': 'Niet beschikbaar',
        'fa': 'در دسترس نیست',
        'ur': 'دستیاب نہیں',
        'hi': 'उपलब्ध नहीं',
        'zh': '暂不可用',
        'vi': 'Không có sẵn',
        'th': 'ไม่พร้อมใช้งาน',
        'ro': 'Nu este disponibil',
        'bg': 'Не е налично',
        'hr': 'Nije dostupno',
        'sr': 'Није доступно',
        'sq': 'Nuk është i disponueshëm',
        'hu': 'Nem elérhető',
        'cs': 'Není k dispozici',
        'sk': 'Nie je k dispozícii'
    };
    
    return placeholders[langCode] || 'Not available';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
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

// Export functions for use in other scripts
window.settingsManager = {
    getSelectedLanguages: () => selectedLanguages,
    getDefaultTargetLanguage: () => defaultTargetLanguage,
    updateModalTranslations,
    getTranslationForLanguage
};