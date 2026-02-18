// ============================================
// إعدادات Supabase
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
let currentUser = null;
let currentSummaryLang = 'ar';

let score = {
    total: 0,
    correct: 0,
    wrong: 0
};

// ============================================
// العناصر
// ============================================
const heroSection = document.getElementById('heroSection');
const lesenSection = document.getElementById('lesenSection');
const hörenSection = document.getElementById('hörenSection');
const questionsSection = document.getElementById('questionsSection');
const resultsSection = document.getElementById('resultsSection');

// الأزرار
const startLesenBtn = document.getElementById('startLesenBtn');
const startHörenBtn = document.getElementById('startHörenBtn');
const backToHomeFromLesen = document.getElementById('backToHomeFromLesen');
const backToHomeFromHören = document.getElementById('backToHomeFromHören');
const backToStoriesBtn = document.getElementById('backToStoriesBtn');
const moreStoriesBtn = document.getElementById('moreStoriesBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const nextBtn = document.getElementById('nextBtn');

// الشبكات
const lesenStoriesGrid = document.getElementById('lesenStoriesGrid');

// عناصر الأسئلة
const currentStoryTitle = document.getElementById('currentStoryTitle');
const currentCategoryBadge = document.getElementById('currentCategoryBadge');
const summaryContent = document.getElementById('summaryContent');
const questionTextContainer = document.getElementById('questionTextContainer');
const optionR = document.querySelector('.option-r');
const optionF = document.querySelector('.option-f');
const feedbackContainer = document.getElementById('feedbackContainer');
const feedbackMessage = document.getElementById('feedbackMessage');
const feedbackIcon = document.getElementById('feedbackIcon');

// عناصر الترقيم
const currentQuestionNumber = document.getElementById('currentQuestionNumber');
const totalQuestionsSpan = document.getElementById('totalQuestions');
const progressBar = document.getElementById('progressBar');

// عناصر النتائج
const finalScore = document.getElementById('finalScore');
const finalTotal = document.getElementById('finalTotal');
const correctCount = document.getElementById('correctCount');
const wrongCount = document.getElementById('wrongCount');
const pointsEarned = document.getElementById('pointsEarned');
const statusBadge = document.getElementById('statusBadge');

// عناصر تسجيل الدخول
const showLoginBtn = document.getElementById('showLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const welcomeMessage = document.getElementById('welcomeMessage');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const visitorCountSpan = document.getElementById('visitorCount');
const toastMessage = document.getElementById('toastMessage');
const toastNotification = document.getElementById('toastNotification');

// ============================================
// دوال مساعدة
// ============================================
function showToast(msg, type = 'info') {
    toastMessage.textContent = msg;
    toastNotification.classList.add('show');
    setTimeout(() => toastNotification.classList.remove('show'), 3000);
}

async function updateVisitorCount() {
    try {
        const res = await fetch('https://api.countapi.xyz/hit/deutsch-rawad/visits');
        const data = await res.json();
        visitorCountSpan.textContent = data.value.toLocaleString();
    } catch {
        visitorCountSpan.textContent = '1000+';
    }
}

// ============================================
// دوال المستخدم
// ============================================
async function checkUserStatus() {
    const saved = localStorage.getItem('deutsch_user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('username', currentUser.username)
                .eq('is_active', true)
                .single();
            
            if (data) {
                showLoginBtn.style.display = 'none';
                logoutBtn.style.display = 'block';
                welcomeMessage.style.display = 'block';
                welcomeMessage.innerHTML = `👋 مرحباً ${currentUser.username}! أنت الآن تشاهد المحتوى الكامل`;
            } else {
                logout();
            }
        } catch {
            logout();
        }
    } else {
        showLoginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        welcomeMessage.style.display = 'none';
    }
    if (storiesData.length) displayLesenStories();
}

window.handleManualLogin = async function() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    if (!username || !password) {
        showToast('الرجاء إدخال البيانات');
        return;
    }
    
    try {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .eq('is_active', true)
            .single();
        
        if (data) {
            currentUser = { id: data.id, username: data.username };
            localStorage.setItem('deutsch_user', JSON.stringify(currentUser));
            closeLoginModal();
            checkUserStatus();
            showToast(`مرحباً ${username}!`, 'success');
        } else {
            showToast('بيانات غير صحيحة', 'error');
        }
    } catch {
        showToast('خطأ في تسجيل الدخول', 'error');
    }
}

window.closeLoginModal = () => loginModal.style.display = 'none';

function logout() {
    currentUser = null;
    localStorage.removeItem('deutsch_user');
    checkUserStatus();
    showToast('تم تسجيل الخروج');
}

// ============================================
// تحميل القصص
// ============================================
async function loadStories() {
    try {
        const res = await fetch('questions.json');
        storiesData = await res.json();
        await checkUserStatus();
        displayLesenStories();
    } catch (error) {
        console.error(error);
        showToast('خطأ في تحميل القصص');
    }
}

// ============================================
// عرض القصص
// ============================================
function displayLesenStories() {
    lesenStoriesGrid.innerHTML = '';
    const lesenStories = storiesData.filter(s => !s.title.includes('Hör'));
    
    lesenStories.forEach((story, index) => {
        const card = document.createElement('div');
        card.className = 'story-card';
        
        const isPaid = index < 5;
        
        if (isPaid && !currentUser) {
            card.classList.add('paid-story');
            card.innerHTML = `
                <i class="fas fa-lock"></i>
                <h3>${story.title}</h3>
                <p>${story.questions.length} أسئلة</p>
                <span class="story-badge" style="background:#f97373">للمشتركين فقط</span>
            `;
            card.onclick = () => showToast('هذه القصة للمشتركين فقط');
        } else {
            card.innerHTML = `
                <i class="fas fa-${getIcon(story.title)}"></i>
                <h3>${story.title}</h3>
                <p>${story.questions.length} أسئلة</p>
                <span class="story-badge">مجاني</span>
            `;
            card.onclick = () => selectStory(story, index);
        }
        
        lesenStoriesGrid.appendChild(card);
    });
}

function getIcon(title) {
    const t = title.toLowerCase();
    if (t.includes('nachbarin')) return 'people-arrows';
    if (t.includes('wald')) return 'tree';
    if (t.includes('handy')) return 'mobile-alt';
    if (t.includes('fahrrad')) return 'bicycle';
    return 'book-open';
}

// ============================================
// اختيار قصة
// ============================================
function selectStory(story, index) {
    currentStory = story;
    currentQuestionIndex = 0;
    
    score = {
        total: story.questions.length,
        correct: 0,
        wrong: 0
    };
    
    currentStoryTitle.textContent = story.title;
    currentCategoryBadge.innerHTML = '<i class="fas fa-book-open"></i> قراءة';
    totalQuestionsSpan.textContent = story.questions.length;
    
    displaySummary(story);
    
    heroSection.style.display = 'none';
    lesenSection.style.display = 'none';
    questionsSection.style.display = 'block';
    
    displayQuestion();
}

function displaySummary(story) {
    if (!story.summary_ar && !story.summary_de) {
        document.getElementById('summarySection').style.display = 'none';
        return;
    }
    document.getElementById('summarySection').style.display = 'block';
    summaryContent.textContent = story.summary_ar || story.summary_de || '';
}

// ============================================
// عرض السؤال
// ============================================
function displayQuestion() {
    if (!currentStory) return;
    
    const q = currentStory.questions[currentQuestionIndex];
    const text = q.texts[Math.floor(Math.random() * q.texts.length)];
    
    questionTextContainer.innerHTML = `<p>${text}</p>`;
    currentQuestionNumber.textContent = currentQuestionIndex + 1;
    
    optionR.disabled = false;
    optionF.disabled = false;
    optionR.classList.remove('selected-r');
    optionF.classList.remove('selected-f');
    nextBtn.disabled = true;
    feedbackContainer.style.display = 'none';
    
    progressBar.style.width = ((currentQuestionIndex) / currentStory.questions.length * 100) + '%';
}

// ============================================
// التحقق من الإجابة
// ============================================
function checkAnswer(selected) {
    if (!currentStory) return;
    
    const q = currentStory.questions[currentQuestionIndex];
    const correct = selected === q.answer;
    
    optionR.disabled = true;
    optionF.disabled = true;
    
    if (selected === 'R') optionR.classList.add('selected-r');
    else optionF.classList.add('selected-f');
    
    feedbackContainer.style.display = 'flex';
    
    if (correct) {
        feedbackContainer.className = 'feedback-container correct';
        feedbackIcon.innerHTML = '✓';
        feedbackMessage.textContent = 'إجابة صحيحة! 🎉';
        score.correct++;
    } else {
        feedbackContainer.className = 'feedback-container wrong';
        feedbackIcon.innerHTML = '✗';
        feedbackMessage.textContent = `خطأ. الإجابة الصحيحة: ${q.answer === 'R' ? 'Richtig' : 'Falsch'}`;
        score.wrong++;
    }
    
    nextBtn.disabled = false;
}

// ============================================
// السؤال التالي
// ============================================
function nextQuestion() {
    if (currentQuestionIndex < currentStory.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        finishStory();
    }
}

// ============================================
// إنهاء القصة
// ============================================
function finishStory() {
    const percent = (score.correct / score.total) * 100;
    const passed = percent >= 60;
    
    statusBadge.textContent = passed ? 'ناجح ✓' : 'راسب ✗';
    statusBadge.className = `status-badge ${passed ? 'status-pass' : 'status-fail'}`;
    
    finalScore.textContent = score.correct;
    finalTotal.textContent = score.total;
    correctCount.textContent = score.correct;
    wrongCount.textContent = score.wrong;
    pointsEarned.textContent = score.correct * 10;
    
    questionsSection.style.display = 'none';
    resultsSection.style.display = 'block';
    progressBar.style.width = '100%';
}

// ============================================
// العودة
// ============================================
function backToStories() {
    questionsSection.style.display = 'none';
    resultsSection.style.display = 'none';
    lesenSection.style.display = 'block';
    progressBar.style.width = '0%';
}

function tryAgain() {
    if (currentStory) {
        currentQuestionIndex = 0;
        score.correct = 0;
        score.wrong = 0;
        resultsSection.style.display = 'none';
        questionsSection.style.display = 'block';
        displayQuestion();
    }
}

// ============================================
// أحداث النقر
// ============================================
startLesenBtn.onclick = () => {
    heroSection.style.display = 'none';
    lesenSection.style.display = 'block';
};

startHörenBtn.onclick = () => {
    showToast('قريباً...');
};

backToHomeFromLesen.onclick = () => {
    heroSection.style.display = 'block';
    lesenSection.style.display = 'none';
};

backToHomeFromHören.onclick = () => {
    heroSection.style.display = 'block';
    hörenSection.style.display = 'none';
};

backToStoriesBtn.onclick = backToStories;
moreStoriesBtn.onclick = backToStories;
tryAgainBtn.onclick = tryAgain;

optionR.onclick = () => checkAnswer('R');
optionF.onclick = () => checkAnswer('F');
nextBtn.onclick = nextQuestion;

showLoginBtn.onclick = () => loginModal.style.display = 'flex';
logoutBtn.onclick = logout;

// إغلاق النافذة
window.onclick = (e) => {
    if (e.target === loginModal) closeLoginModal();
};

// أزرار التبويب
document.querySelectorAll('.summary-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.summary-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSummaryLang = btn.dataset.lang;
        if (currentStory) {
            summaryContent.textContent = currentSummaryLang === 'ar' 
                ? (currentStory.summary_ar || currentStory.summary_de)
                : (currentStory.summary_de || currentStory.summary_ar);
        }
    };
});

// ============================================
// بدء التطبيق
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadStories();
    updateVisitorCount();
});