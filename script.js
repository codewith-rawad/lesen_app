// ============================================
// الإعدادات الأساسية لـ Supabase
// ============================================
const supabaseUrl = 'https://qrznwrvfjacoepegjpov.supabase.co'
const supabaseKey = 'sb_publishable_tXBsW2vyhWPGngkq6PP4sg_kMVP4Olx'
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// المتغيرات العامة
// ============================================
let storiesData = [];
let currentStory = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let currentCategory = 'lesen';
let currentTeil = 1;
let currentUser = null; // المستخدم الحالي

let score = {
    total: 0,
    correct: 0,
    wrong: 0
};

let totalScore = 0;
let completedStories = 0;
let streakCount = 0;

// ============================================
// DOM Elemente
// ============================================
const homePage = document.getElementById('homePage');
const heroSection = document.getElementById('heroSection');
const lesenSection = document.getElementById('lesenSection');
const hörenSection = document.getElementById('hörenSection');
const questionsSection = document.getElementById('questionsSection');
const resultsSection = document.getElementById('resultsSection');

const startLesenBtn = document.getElementById('startLesenBtn');
const startHörenBtn = document.getElementById('startHörenBtn');
const backToHomeFromLesen = document.getElementById('backToHomeFromLesen');
const backToHomeFromHören = document.getElementById('backToHomeFromHören');
const backToStoriesBtn = document.getElementById('backToStoriesBtn');
const moreStoriesBtn = document.getElementById('moreStoriesBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');

const lesenStoriesGrid = document.getElementById('lesenStoriesGrid');
const hörenStoriesGrid = document.getElementById('hörenStoriesGrid');

const currentStoryTitle = document.getElementById('currentStoryTitle');
const currentCategoryBadge = document.getElementById('currentCategoryBadge');
const summarySection = document.getElementById('summarySection');
const summaryContent = document.getElementById('summaryContent');
const currentQuestionNumber = document.getElementById('currentQuestionNumber');
const totalQuestions = document.getElementById('totalQuestions');
const questionTextContainer = document.getElementById('questionTextContainer');
const optionR = document.querySelector('.option-r');
const optionF = document.querySelector('.option-f');
const nextBtn = document.getElementById('nextBtn');
const feedbackContainer = document.getElementById('feedbackContainer');
const feedbackIcon = document.getElementById('feedbackIcon');
const feedbackMessage = document.getElementById('feedbackMessage');

const progressBar = document.getElementById('progressBar');
const totalScoreSpan = document.getElementById('totalScore');
const completedCountSpan = document.getElementById('completedCount');
const streakCountSpan = document.getElementById('streakCount');

const finalScore = document.getElementById('finalScore');
const finalTotal = document.getElementById('finalTotal');
const correctCount = document.getElementById('correctCount');
const wrongCount = document.getElementById('wrongCount');
const pointsEarned = document.getElementById('pointsEarned');
const resultsSubtitle = document.getElementById('resultsSubtitle');
const statusBadge = document.getElementById('statusBadge');

const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');

// عناصر تسجيل الدخول
const showLoginBtn = document.getElementById('showLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const welcomeMessage = document.getElementById('welcomeMessage');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');

// ============================================
// دوال Supabase والتسجيل
// ============================================

// التحقق من حالة المستخدم عند تحميل الصفحة
async function checkUserStatus() {
    const savedUser = localStorage.getItem('deutsch_user');
    
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            
            // تحقق إذا المستخدم لسا موجود بقاعدة البيانات
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', currentUser.username)
                .eq('is_active', true)
                .single();
            
            if (user) {
                // المستخدم صحيح
                showLoginBtn.style.display = 'none';
                logoutBtn.style.display = 'block';
                welcomeMessage.style.display = 'block';
                welcomeMessage.innerHTML = '<i class="fas fa-star"></i> مرحباً ' + currentUser.username + '! أنت الآن تشاهد المحتوى الكامل';
            } else {
                // المستخدم غير صحيح
                logout();
            }
        } catch (e) {
            logout();
        }
    } else {
        showLoginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        welcomeMessage.style.display = 'none';
    }
    
    // أعد عرض القصص حسب صلاحية المستخدم
    if (storiesData.length > 0) {
        displayLesenStories();
    }
}

// دالة تسجيل الدخول اليدوي
async function handleManualLogin() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    if (!username || !password) {
        showToast('الرجاء إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }
    
    showToast('جاري تسجيل الدخول...', 'info');
    
    try {
        // ابحث عن المستخدم في جدول users
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .eq('is_active', true)
            .single();
        
        if (error) throw error;
        
        if (user) {
            // دخول ناجح
            currentUser = {
                id: user.id,
                username: user.username
            };
            
            localStorage.setItem('deutsch_user', JSON.stringify(currentUser));
            
            closeLoginModal();
            checkUserStatus();
            showToast('مرحباً ' + username + '! تم تسجيل الدخول بنجاح', 'success');
            
            // أعد تحميل القصص
            if (storiesData.length > 0) {
                displayLesenStories();
            }
        } else {
            showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('حدث خطأ في تسجيل الدخول', 'error');
    }
}

// دالة تسجيل الخروج
function logout() {
    currentUser = null;
    localStorage.removeItem('deutsch_user');
    showLoginBtn.style.display = 'block';
    logoutBtn.style.display = 'none';
    welcomeMessage.style.display = 'none';
    closeLoginModal();
    showToast('تم تسجيل الخروج', 'info');
    
    // أعد تحميل القصص (المجانية فقط)
    if (storiesData.length > 0) {
        displayLesenStories();
    }
}

// فتح نافذة تسجيل الدخول
function showLoginModal() {
    loginModal.style.display = 'flex';
    loginUsername.value = '';
    loginPassword.value = '';
}

// إغلاق نافذة تسجيل الدخول
function closeLoginModal() {
    loginModal.style.display = 'none';
}

// ============================================
// بقية دوال التطبيق (مع تعديل عرض القصص)
// ============================================

// Besucherzähler
const visitorCountSpan = document.getElementById('visitorCount');
const VISITOR_NAMESPACE = 'deutsch-mit-rawad';
const VISITOR_KEY = 'global-besuche';

async function updateVisitorCount() {
    if (!visitorCountSpan) return;
    try {
        const res = await fetch(`https://api.countapi.xyz/hit/${encodeURIComponent(VISITOR_NAMESPACE)}/${encodeURIComponent(VISITOR_KEY)}`);
        if (!res.ok) throw new Error('Netzwerkfehler');
        const data = await res.json();
        if (typeof data.value === 'number') {
            visitorCountSpan.textContent = data.value.toLocaleString('de-DE');
        } else {
            visitorCountSpan.textContent = '-';
        }
    } catch (e) {
        visitorCountSpan.textContent = '-';
    }
}

// Lade Geschichten aus JSON
async function loadStories() {
    showLoading();
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Daten');
        }
        storiesData = await response.json();
        hideLoading();
        
        // تحقق من حالة المستخدم أولاً
        await checkUserStatus();
        
        displayLesenStories();
        updateStats();
        loadSavedProgress();
    } catch (error) {
        console.error('Fehler:', error);
        showError('Daten konnten nicht geladen werden. Bitte aktualisiere die Seite.');
    }
}

// Lade gespeicherten Fortschritt
function loadSavedProgress() {
    completedStories = 0;
    storiesData.forEach((_, index) => {
        if (localStorage.getItem(`story_${index}_completed`) === 'true') {
            completedStories++;
        }
    });
    
    totalScore = parseInt(localStorage.getItem('totalScore')) || 0;
    streakCount = parseInt(localStorage.getItem('streakCount')) || 0;
    
    updateStats();
}

// Zeige Ladeanimation
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.id = 'loadingSpinner';
    loadingDiv.innerHTML = '<div class="loading-spinner"></div><p style="margin-top: 20px;">Lade Geschichten...</p>';
    lesenStoriesGrid.parentNode.insertBefore(loadingDiv, lesenStoriesGrid);
}

function hideLoading() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.remove();
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    lesenStoriesGrid.parentNode.insertBefore(errorDiv, lesenStoriesGrid);
}

// Zeige Toast-Benachrichtigung
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toastNotification.className = `toast-notification show ${type}`;
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000);
}

// Aktualisiere Statistiken
function updateStats() {
    const totalStories = storiesData.length;

    if (totalScoreSpan) {
        totalScoreSpan.textContent = totalScore;
    }
    if (completedCountSpan) {
        completedCountSpan.textContent = `${completedStories}/${totalStories}`;
    }
    if (streakCountSpan) {
        streakCountSpan.textContent = streakCount;
    }
    
    const progressPercentage = (completedStories / totalStories) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    
    // Speichere Fortschritt
    localStorage.setItem('totalScore', totalScore);
    localStorage.setItem('streakCount', streakCount);
}

function getIconForStory(story) {
    const title = (story.title || '').toLowerCase();

    if (title.includes('nachbarin')) return 'fa-people-arrows';
    if (title.includes('wald')) return 'fa-tree';
    if (title.includes('handy')) return 'fa-mobile-alt';
    if (title.includes('fahrrad')) return 'fa-bicycle';
    if (title.includes('freundin') && !title.includes('steffi')) return 'fa-user-friends';
    if (title.includes('steffi')) return 'fa-user-tie';
    if (title.includes('japan')) return 'fa-flag';
    if (title.includes('praktikum')) return 'fa-chalkboard-teacher';
    if (title.includes('gepäck') || title.includes('koffer')) return 'fa-suitcase-rolling';
    if (title.includes('umzug')) return 'fa-truck-moving';
    if (title.includes('reise') && title.includes('mexiko')) return 'fa-globe-americas';
    if (title.includes('reise')) return 'fa-route';
    if (title.includes('sprache')) return 'fa-language';
    if (title.includes('kleidung')) return 'fa-tshirt';
    if (title.includes('mann') && title.includes('frau')) return 'fa-heart-broken';

    return 'fa-book-open';
}

// Zeige Lesen Geschichten (معدلة لعرض المحتوى حسب المستخدم)
function displayLesenStories() {
    lesenStoriesGrid.innerHTML = '';
    
    // Filtere nur Lesen Geschichten (Teil 1)
    const lesenStories = storiesData.filter(story => 
        !story.title.includes('Hör') && !story.title.includes('Audio')
    );
    
    // أول 5 قصص رح تكون مدفوعة
    lesenStories.forEach((story, index) => {
        const storyCard = document.createElement('div');
        storyCard.className = 'story-card';
        storyCard.setAttribute('data-index', index);
        
        const iconClass = getIconForStory(story);
        const isCompleted = localStorage.getItem(`story_${index}_completed`) === 'true';
        
        // تحديد إذا القصة مدفوعة (أول 5 قصص)
        const isPaid = index < 5; // أول 5 قصص مدفوعة
        
        // إذا كانت القصة مدفوعة والمستخدم غير مسجل، نخفيها
        if (isPaid && !currentUser) {
            storyCard.classList.add('paid-story');
            storyCard.innerHTML = `
                <i class="fas fa-lock story-icon" style="color: #f97373;"></i>
                <h3>${story.title}</h3>
                <p>${story.questions.length} Fragen</p>
                <div class="story-meta">
                    <span class="story-badge" style="background: #f97373;">مشتركين فقط</span>
                    <span class="story-status ${isCompleted ? 'completed' : ''}"></span>
                </div>
            `;
            
            // منع النقر على القصة
            storyCard.style.cursor = 'not-allowed';
            storyCard.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('هذه القصة متاحة فقط للمشتركين', 'error');
            });
        } else {
            // قصة مجانية أو المستخدم مسجل
            storyCard.innerHTML = `
                <i class="fas ${iconClass} story-icon"></i>
                <h3>${story.title}</h3>
                <p>${story.questions.length} Fragen</p>
                <div class="story-meta">
                    <span class="story-badge">Teil 1</span>
                    <span class="story-status ${isCompleted ? 'completed' : ''}"></span>
                </div>
            `;
            
            storyCard.addEventListener('click', () => selectStory(story, 'Lesen', index));
        }
        
        lesenStoriesGrid.appendChild(storyCard);
    });
    
    // Zeige Coming Soon für weitere Teile
    for (let i = 2; i <= 5; i++) {
        const comingCard = document.createElement('div');
        comingCard.className = 'story-card coming-soon';
        comingCard.innerHTML = `
            <i class="fas fa-clock story-icon"></i>
            <h3>Teil ${i} · Bald verfügbar</h3>
            <p>In Entwicklung</p>
            <div class="story-badge">Coming Soon</div>
        `;
        lesenStoriesGrid.appendChild(comingCard);
    }
}

// Wähle eine Geschichte
function selectStory(story, category, index) {
    currentStory = story;
    currentCategory = category;
    currentQuestionIndex = 0;
    userAnswers = [];
    
    score = {
        total: story.questions.length,
        correct: 0,
        wrong: 0
    };
    
    currentStoryTitle.textContent = story.title;
    currentCategoryBadge.innerHTML = `<i class="fas fa-${category === 'Lesen' ? 'book-open' : 'headphones'}"></i> ${category} · Teil 1`;
    totalQuestions.textContent = story.questions.length;
    
    // Zeige ملخص القصة mit Sprachwahl
    displaySummary(story);
    
    // Verstecke alle Sektionen
    heroSection.style.display = 'none';
    lesenSection.style.display = 'none';
    hörenSection.style.display = 'none';
    resultsSection.style.display = 'none';
    
    // Zeige Fragen-Sektion
    questionsSection.style.display = 'block';
    
    displayQuestion();
}

// ملخص القصة مع اختيار اللغة
let currentSummaryLang = 'ar';

function displaySummary(story) {
    if (!summarySection || !summaryContent) return;
    
    const hasSummary = story.summary_ar || story.summary_de;
    if (!hasSummary) {
        summarySection.style.display = 'none';
        return;
    }
    
    summarySection.style.display = 'block';
    
    document.querySelectorAll('.summary-lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentSummaryLang);
    });
    
    summaryContent.classList.add('summary-fade');
    setTimeout(() => {
        const text = currentSummaryLang === 'ar' 
            ? (story.summary_ar || story.summary_de || '') 
            : (story.summary_de || story.summary_ar || '');
        
        summaryContent.textContent = text;
        summaryContent.dir = currentSummaryLang === 'ar' ? 'rtl' : 'ltr';
        summaryContent.classList.remove('summary-fade');
    }, 150);
}

// Zeige aktuelle Frage
function displayQuestion() {
    if (!currentStory) return;
    
    const question = currentStory.questions[currentQuestionIndex];
    const randomText = question.texts[Math.floor(Math.random() * question.texts.length)];
    
    questionTextContainer.innerHTML = `<p class="question-text">"${randomText}"</p>`;
    currentQuestionNumber.textContent = currentQuestionIndex + 1;
    
    // Reset buttons
    optionR.classList.remove('selected-r');
    optionF.classList.remove('selected-f');
    optionR.disabled = false;
    optionF.disabled = false;
    nextBtn.disabled = true;
    feedbackContainer.style.display = 'none';
    
    updateProgress();
}

// Aktualisiere Fortschrittsbalken
function updateProgress() {
    const progress = (currentQuestionIndex / currentStory.questions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// Prüfe Antwort
function checkAnswer(selectedAnswer) {
    if (!currentStory) return;
    
    const question = currentStory.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.answer;
    
    optionR.disabled = true;
    optionF.disabled = true;
    
    if (selectedAnswer === 'R') {
        optionR.classList.add('selected-r');
    } else {
        optionF.classList.add('selected-f');
    }
    
    feedbackContainer.style.display = 'flex';
    
    if (isCorrect) {
        feedbackContainer.className = 'feedback-container correct';
        feedbackIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        score.correct++;
        totalScore += 10;
        
        const emojis = ['🎉', '🌟', '👏', '💪', '⭐'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        feedbackMessage.textContent = `✓ Richtig! ${randomEmoji}`;
    } else {
        feedbackContainer.className = 'feedback-container wrong';
        feedbackIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
        feedbackMessage.textContent = `✗ Falsch. Die richtige Antwort ist: ${question.answer === 'R' ? 'Richtig' : 'Falsch'}`;
        score.wrong++;
    }
    
    userAnswers.push({
        question: question,
        selected: selectedAnswer,
        correct: isCorrect
    });
    
    updateStats();
    nextBtn.disabled = false;
}

// Nächste Frage
function nextQuestion() {
    if (currentQuestionIndex < currentStory.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        finishStory();
    }
}

// Geschichte beenden
function finishStory() {
    const storyIndex = storiesData.findIndex(s => s.title === currentStory.title);
    if (storyIndex !== -1) {
        localStorage.setItem(`story_${storyIndex}_completed`, 'true');
    }
    
    completedStories++;
    
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem('lastActive');
    
    if (lastActive === today) {
        // Schon heute aktiv
    } else if (lastActive === new Date(Date.now() - 86400000).toDateString()) {
        streakCount++;
    } else {
        streakCount = 1;
    }
    localStorage.setItem('lastActive', today);
    
    const percentage = (score.correct / score.total) * 100;
    const isPassed = percentage >= 60;
    
    if (statusBadge) {
        statusBadge.textContent = isPassed ? 'ناجح ✓' : 'راسب ✗';
        statusBadge.className = 'status-badge ' + (isPassed ? 'status-pass' : 'status-fail');
    }
    
    if (percentage === 100) {
        resultsSubtitle.textContent = 'Perfekt! Alle Antworten richtig! 🏆';
        showToast('🎉 Fantastisch! 100% richtig!', 'success');
    } else if (percentage >= 70) {
        resultsSubtitle.textContent = 'Gut gemacht! Weiter so! 💪';
    } else if (isPassed) {
        resultsSubtitle.textContent = 'Geschafft! Übung macht den Meister! 🚀';
    } else {
        resultsSubtitle.textContent = 'Übung macht den Meister! Versuch es nochmal! 💪';
    }
    
    finalScore.textContent = score.correct;
    finalTotal.textContent = score.total;
    correctCount.textContent = score.correct;
    wrongCount.textContent = score.wrong;
    pointsEarned.textContent = score.correct * 10;
    
    questionsSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    progressBar.style.width = '100%';
    updateStats();
}

// Zurück zu den Geschichten
function backToStories() {
    heroSection.style.display = 'none';
    lesenSection.style.display = 'block';
    hörenSection.style.display = 'none';
    questionsSection.style.display = 'none';
    resultsSection.style.display = 'none';
    
    progressBar.style.width = '0%';
}

// Nochmal versuchen
function tryAgain() {
    if (currentStory) {
        currentQuestionIndex = 0;
        userAnswers = [];
        score = {
            total: currentStory.questions.length,
            correct: 0,
            wrong: 0
        };
        
        resultsSection.style.display = 'none';
        questionsSection.style.display = 'block';
        
        displayQuestion();
    }
}

// ============================================
// Event Listener
// ============================================

startLesenBtn.addEventListener('click', () => {
    heroSection.style.display = 'none';
    lesenSection.style.display = 'block';
    currentCategory = 'lesen';
});

startHörenBtn.addEventListener('click', () => {
    heroSection.style.display = 'none';
    hörenSection.style.display = 'block';
    currentCategory = 'hören';
    showToast('🎧 Hörverstehen kommt bald! Bleib dran!', 'info');
});

backToHomeFromLesen.addEventListener('click', () => {
    heroSection.style.display = 'block';
    lesenSection.style.display = 'none';
});

backToHomeFromHören.addEventListener('click', () => {
    heroSection.style.display = 'block';
    hörenSection.style.display = 'none';
});

backToStoriesBtn.addEventListener('click', backToStories);
moreStoriesBtn.addEventListener('click', backToStories);
tryAgainBtn.addEventListener('click', tryAgain);

// تبديل لغة الملخص
document.querySelectorAll('.summary-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentSummaryLang = btn.dataset.lang;
        if (currentStory) displaySummary(currentStory);
    });
});

optionR.addEventListener('click', () => checkAnswer('R'));
optionF.addEventListener('click', () => checkAnswer('F'));
nextBtn.addEventListener('click', nextQuestion);

// أحداث تسجيل الدخول
showLoginBtn.addEventListener('click', showLoginModal);
logoutBtn.addEventListener('click', logout);

// إغلاق النافذة عند الضغط خارجها
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        closeLoginModal();
    }
});

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if (questionsSection.style.display === 'block') {
        if (e.key.toLowerCase() === 'r') {
            if (!optionR.disabled) checkAnswer('R');
        } else if (e.key.toLowerCase() === 'f') {
            if (!optionF.disabled) checkAnswer('F');
        } else if (e.key === 'Enter') {
            if (!nextBtn.disabled) nextQuestion();
        }
    }
});

// Teil-Indikatoren
document.querySelectorAll('.teil').forEach((teil, index) => {
    teil.addEventListener('click', () => {
        if (teil.classList.contains('active')) return;
        showToast(`Teil ${index + 1} kommt bald! 🚀`, 'info');
    });
});

// Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
    window.handleManualLogin = handleManualLogin;
    window.closeLoginModal = closeLoginModal;
    
    await loadStories();
    updateVisitorCount();
    
    setTimeout(() => {
        showToast('👋 Willkommen bei Deutsch mit Rawad!', 'info');
    }, 1000);
    
    const lastActive = localStorage.getItem('lastActive');
    const today = new Date().toDateString();
    
    if (lastActive && lastActive !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastActive !== yesterday) {
            streakCount = 0;
        }
    }
});