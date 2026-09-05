/**
 * MammoAI — Main Application Controller & View Orchestrator
 */

import { calculateAssessment, MODEL_CONFIG } from './model.js';
import { 
  generateDynamicExplanation, 
  getResultMeaning, 
  getRecommendedAction, 
  generateDoctorQuestions 
} from './explanation.js';
import { 
  EDUCATIONAL_ARTICLES, 
  MYTH_FACT_QUESTIONS, 
  getRecommendedArticles 
} from './education.js';
import { getChatbotResponse, MEDICAL_SAFETY_DISCLAIMER_ANSWER } from './chatbot.js';

// Central Application State
const state = {
  activeView: 'home',
  currentAssessmentStep: 1,
  formInputs: {
    ageCategory: '',
    lump: '',
    density: '',
    calcification: ''
  },
  assessment: null, // Populated after calculation
  chatHistory: [
    {
      sender: 'assistant',
      text: "Hello! I am your **MammoAI Companion**. I'm here to explain mammogram terminology, discuss screening concepts, or help you understand your educational assessment. What would you like to explore?",
      isSafetyNotice: false
    }
  ],
  quiz: {
    currentIndex: 0,
    score: 0,
    answers: {},
    completed: false
  },
  followUpChecklist: {
    reviewReport: false,
    discussDoctor: false,
    prepQuestions: false,
    followSchedule: false
  },
  demoModeOpen: false
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadStoredState();
  setupNavigation();
  setupAssessmentForm();
  setupChatbot();
  setupLearnSection();
  setupChecklist();
  setupDemoMode();
  setupGlobalEvents();
  renderCurrentView();
});

/* ==========================================================================
   State Persistence
   ========================================================================== */
function loadStoredState() {
  try {
    const savedAssessment = localStorage.getItem('mammoai_assessment');
    if (savedAssessment) {
      state.assessment = JSON.parse(savedAssessment);
      state.formInputs = {
        ageCategory: state.assessment.ageCategory,
        lump: state.assessment.lump,
        density: state.assessment.density,
        calcification: state.assessment.calcification
      };
    }
    const savedChecklist = localStorage.getItem('mammoai_checklist');
    if (savedChecklist) {
      state.followUpChecklist = JSON.parse(savedChecklist);
    }
  } catch (e) {
    console.warn("Storage access notice:", e);
  }
}

function saveAssessmentToStorage() {
  try {
    if (state.assessment) {
      localStorage.setItem('mammoai_assessment', JSON.stringify(state.assessment));
    }
  } catch (e) {}
}

export function clearUserAssessment() {
  state.assessment = null;
  state.formInputs = { ageCategory: '', lump: '', density: '', calcification: '' };
  state.currentAssessmentStep = 1;
  try {
    localStorage.removeItem('mammoai_assessment');
  } catch (e) {}
  renderAssessmentForm();
  renderResultsView();
  renderRecommendedLearning();
  navigateTo('home');
  showToast("Assessment data successfully cleared.");
}

/* ==========================================================================
   Navigation & View Routing
   ========================================================================== */
function setupNavigation() {
  const navLinks = document.querySelectorAll('[data-navigate]');
  navLinks.forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = el.getAttribute('data-navigate');
      navigateTo(targetView);
      // Close mobile menu if open
      const mobileNav = document.getElementById('mobile-nav');
      if (mobileNav) mobileNav.classList.remove('open');
    });
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
      state.activeView = e.state.view;
      renderCurrentView();
    }
  });
}

export function navigateTo(viewName) {
  state.activeView = viewName;
  window.history.pushState({ view: viewName }, '', `#${viewName}`);
  renderCurrentView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentView() {
  const views = document.querySelectorAll('.view-section');
  views.forEach(v => v.classList.remove('active-view'));

  const activeElem = document.getElementById(`view-${state.activeView}`);
  if (activeElem) {
    activeElem.classList.add('active-view');
  } else {
    // Fallback to home
    document.getElementById('view-home')?.classList.add('active-view');
  }

  // Update navbar links active styling
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-navigate') === state.activeView) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Refresh view specific components
  if (state.activeView === 'results') {
    renderResultsView();
  } else if (state.activeView === 'learn') {
    renderRecommendedLearning();
  } else if (state.activeView === 'assess') {
    renderAssessmentForm();
  }
}

/* ==========================================================================
   Assessment Step Wizard & Engine Execution
   ========================================================================== */
function setupAssessmentForm() {
  // Option selection buttons
  document.querySelectorAll('.indicator-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const stepKey = btn.getAttribute('data-step-key');
      const value = btn.getAttribute('data-value');
      
      // Update form state
      state.formInputs[stepKey] = value;
      
      // Update visual active state in step card
      const parent = btn.closest('.step-options-grid');
      parent.querySelectorAll('.indicator-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Enable the continue button for current step
      updateStepButtons();
    });
  });

  // Next / Back buttons
  document.getElementById('btn-step-next')?.addEventListener('click', () => {
    if (state.currentAssessmentStep < 4) {
      state.currentAssessmentStep++;
      renderAssessmentForm();
    } else {
      // Step 4 complete -> Run Analysis
      runAssessmentAnalysis();
    }
  });

  document.getElementById('btn-step-back')?.addEventListener('click', () => {
    if (state.currentAssessmentStep > 1) {
      state.currentAssessmentStep--;
      renderAssessmentForm();
    }
  });
}

function renderAssessmentForm() {
  // Update step indicator tabs
  for (let i = 1; i <= 4; i++) {
    const stepTab = document.getElementById(`step-indicator-${i}`);
    if (!stepTab) continue;
    stepTab.classList.remove('active', 'completed');
    if (i === state.currentAssessmentStep) {
      stepTab.classList.add('active');
    } else if (i < state.currentAssessmentStep) {
      stepTab.classList.add('completed');
    }
  }

  // Show only current step card
  for (let i = 1; i <= 4; i++) {
    const stepCard = document.getElementById(`step-card-${i}`);
    if (!stepCard) continue;
    stepCard.style.display = (i === state.currentAssessmentStep) ? 'block' : 'none';
  }

  // Restore selected radio states
  const currentKey = getStepKey(state.currentAssessmentStep);
  const selectedVal = state.formInputs[currentKey];
  const stepCard = document.getElementById(`step-card-${state.currentAssessmentStep}`);
  if (stepCard) {
    stepCard.querySelectorAll('.indicator-option').forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('data-value') === selectedVal);
    });
  }

  // Back button visibility
  const backBtn = document.getElementById('btn-step-back');
  if (backBtn) {
    backBtn.style.visibility = (state.currentAssessmentStep === 1) ? 'hidden' : 'visible';
  }

  // Next button label
  const nextBtn = document.getElementById('btn-step-next');
  if (nextBtn) {
    nextBtn.innerHTML = (state.currentAssessmentStep === 4)
      ? 'Analyze My Results →'
      : 'Continue →';
  }

  updateStepButtons();
}

function getStepKey(stepIndex) {
  switch(stepIndex) {
    case 1: return 'ageCategory';
    case 2: return 'lump';
    case 3: return 'density';
    case 4: return 'calcification';
    default: return '';
  }
}

function updateStepButtons() {
  const currentKey = getStepKey(state.currentAssessmentStep);
  const nextBtn = document.getElementById('btn-step-next');
  if (nextBtn) {
    const isAnswered = Boolean(state.formInputs[currentKey]);
    nextBtn.disabled = !isAnswered;
  }
}

/**
 * Runs the smooth 4-phase sequential analysis animation
 */
function runAssessmentAnalysis() {
  navigateTo('analyzing');

  const step1 = document.getElementById('analysis-phase-1');
  const step2 = document.getElementById('analysis-phase-2');
  const step3 = document.getElementById('analysis-phase-3');
  const step4 = document.getElementById('analysis-phase-4');
  const stepFinal = document.getElementById('analysis-phase-final');

  const phases = [step1, step2, step3, step4, stepFinal];
  phases.forEach(p => { if (p) { p.classList.remove('active', 'done'); } });

  // Calculate assessment data
  state.assessment = calculateAssessment(state.formInputs);
  saveAssessmentToStorage();

  // Sequential timer sequence
  setTimeout(() => {
    step1?.classList.add('active');
  }, 200);

  setTimeout(() => {
    step1?.classList.remove('active');
    step1?.classList.add('done');
    step2?.classList.add('active');
  }, 1000);

  setTimeout(() => {
    step2?.classList.remove('active');
    step2?.classList.add('done');
    step3?.classList.add('active');
  }, 1800);

  setTimeout(() => {
    step3?.classList.remove('active');
    step3?.classList.add('done');
    step4?.classList.add('active');
  }, 2500);

  setTimeout(() => {
    step4?.classList.remove('active');
    step4?.classList.add('done');
    stepFinal?.classList.add('active');
  }, 3200);

  setTimeout(() => {
    navigateTo('results');
  }, 3900);
}

/* ==========================================================================
   Results & Dynamic Explanation Rendering
   ========================================================================== */
function renderResultsView() {
  const resultsContainer = document.getElementById('results-content');
  const emptyState = document.getElementById('results-empty-state');

  if (!state.assessment) {
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (resultsContainer) resultsContainer.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  const { category, badgeColor, icon, factors } = state.assessment;

  // 1. Result Concern Card
  const badgeElem = document.getElementById('result-category-badge');
  if (badgeElem) {
    badgeElem.className = `concern-badge badge-${badgeColor}`;
    badgeElem.innerHTML = `<span class="badge-icon">${icon}</span> <span class="badge-label">${category}</span>`;
  }

  // 2. Factors Considered cards
  const factorsGrid = document.getElementById('result-factors-grid');
  if (factorsGrid) {
    factorsGrid.innerHTML = factors.map(f => `
      <div class="factor-summary-card">
        <div class="factor-meta">
          <span class="factor-name">${f.title}</span>
          <span class="factor-influence-pill pill-${f.influence.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${f.influence}</span>
        </div>
        <div class="factor-answer">${f.answer}</div>
      </div>
    `).join('');
  }

  // 3. Dynamic explanation text
  const explanationText = document.getElementById('dynamic-explanation-text');
  if (explanationText) {
    explanationText.innerHTML = generateDynamicExplanation(state.assessment).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  // 4. Factor-by-factor breakdown list
  const factorBreakdownContainer = document.getElementById('factor-breakdown-list');
  if (factorBreakdownContainer) {
    factorBreakdownContainer.innerHTML = factors.map(f => `
      <div class="factor-detail-item">
        <div class="factor-detail-header">
          <div class="factor-detail-title">
            <strong>${f.title}</strong>
            <span class="factor-user-answer">Your answer: <em>${f.answer}</em></span>
          </div>
          <span class="factor-influence-pill pill-${f.influence.toLowerCase().replace(/[^a-z0-9]/g, '-')}">
            Model Influence: ${f.influence}
          </span>
        </div>
        <p class="factor-detail-desc">${f.educationalSummary}</p>
        <div class="factor-bar-wrapper">
          <div class="factor-bar-track">
            <div class="factor-bar-fill" style="width: ${f.percent}%"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 5. Result Meaning & Next Steps
  const meaning = getResultMeaning(category);
  const meaningBody = document.getElementById('result-meaning-body');
  if (meaningBody) {
    meaningBody.textContent = meaning.body;
  }

  const action = getRecommendedAction(category);
  const actionTitle = document.getElementById('recommended-action-title');
  const actionDesc = document.getElementById('recommended-action-desc');
  const actionSteps = document.getElementById('recommended-action-steps');

  if (actionTitle) actionTitle.textContent = action.title;
  if (actionDesc) actionDesc.textContent = action.action;
  if (actionSteps) {
    actionSteps.innerHTML = action.steps.map(s => `<li>${s}</li>`).join('');
  }

  // 6. Doctor Questions Generator
  renderDoctorQuestions();
}

function renderDoctorQuestions() {
  if (!state.assessment) return;
  const questions = generateDoctorQuestions(state.assessment);
  const listElem = document.getElementById('doctor-questions-list');
  if (listElem) {
    listElem.innerHTML = questions.map(q => `
      <li class="doctor-question-item">
        <span class="question-check">○</span>
        <span class="question-text">${q}</span>
      </li>
    `).join('');
  }

  // Setup Copy Button
  const copyBtn = document.getElementById('btn-copy-questions');
  if (copyBtn) {
    copyBtn.onclick = () => {
      const textToCopy = questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n');
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Questions copied to clipboard!");
        copyBtn.textContent = "✓ Questions Copied!";
        setTimeout(() => {
          copyBtn.textContent = "📋 Copy Questions";
        }, 2500);
      }).catch(() => {
        showToast("Press Ctrl+C to copy selected text.");
      });
    };
  }
}

/* ==========================================================================
   Chatbot Companion Controller
   ========================================================================== */
function setupChatbot() {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const promptPills = document.querySelectorAll('.prompt-pill');

  chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput?.value.trim();
    if (!query) return;
    sendMessage(query);
    if (chatInput) chatInput.value = '';
  });

  promptPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const prompt = pill.getAttribute('data-prompt');
      if (prompt) {
        sendMessage(prompt);
      }
    });
  });
}

function sendMessage(userText) {
  // Push user message
  state.chatHistory.push({
    sender: 'user',
    text: userText,
    isSafetyNotice: false
  });
  renderChatHistory();

  // Simulate subtle AI typing pause
  const chatContainer = document.getElementById('chat-messages');
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'chat-message assistant-message typing';
  typingIndicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  chatContainer?.appendChild(typingIndicator);
  chatContainer?.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });

  setTimeout(() => {
    typingIndicator.remove();
    const response = getChatbotResponse(userText, state.assessment);
    state.chatHistory.push({
      sender: 'assistant',
      text: response.reply,
      isSafetyNotice: response.isSafetyNotice
    });
    renderChatHistory();
  }, 450);
}

function renderChatHistory() {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  container.innerHTML = state.chatHistory.map(msg => `
    <div class="chat-message ${msg.sender}-message ${msg.isSafetyNotice ? 'safety-alert-message' : ''}">
      <div class="message-sender-tag">${msg.sender === 'user' ? 'You' : 'MammoAI Companion'}</div>
      <div class="message-bubble">
        ${formatMarkdown(msg.text)}
      </div>
    </div>
  `).join('');

  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
}

function formatMarkdown(text) {
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n•/g, '<br>•')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n([0-9]+\.)/g, '<br>$1');
  return formatted;
}

/* ==========================================================================
   Learn Section, Articles & Interactive Quiz
   ========================================================================== */
function setupLearnSection() {
  renderArticlesList(EDUCATIONAL_ARTICLES);

  // Search filter
  const searchInput = document.getElementById('library-search-input');
  searchInput?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderArticlesList(EDUCATIONAL_ARTICLES);
      return;
    }
    const filtered = EDUCATIONAL_ARTICLES.filter(art => 
      art.title.toLowerCase().includes(term) ||
      art.summary.toLowerCase().includes(term) ||
      art.tags.some(t => t.toLowerCase().includes(term))
    );
    renderArticlesList(filtered);
  });

  // Myth vs Fact Quiz Setup
  setupMythFactQuiz();
}

function renderArticlesList(articles) {
  const container = document.getElementById('learning-articles-grid');
  if (!container) return;

  if (articles.length === 0) {
    container.innerHTML = `<p class="no-results-text">No articles found matching your query. Try searching for "density", "lump", or "calcifications".</p>`;
    return;
  }

  container.innerHTML = articles.map(art => `
    <div class="educational-card" id="card-${art.id}">
      <div class="card-category-pill">${art.category} • ${art.readTime}</div>
      <h3 class="card-title">${art.title}</h3>
      <p class="card-summary">${art.summary}</p>
      <button class="btn-expand-article" data-article-id="${art.id}">Read Guide ↓</button>
      <div class="article-full-content" id="content-${art.id}" style="display: none;">
        ${art.content}
      </div>
    </div>
  `).join('');

  // Attach expand toggles
  container.querySelectorAll('.btn-expand-article').forEach(btn => {
    btn.addEventListener('click', () => {
      const artId = btn.getAttribute('data-article-id');
      const contentElem = document.getElementById(`content-${artId}`);
      if (contentElem) {
        const isShown = contentElem.style.display === 'block';
        contentElem.style.display = isShown ? 'none' : 'block';
        btn.textContent = isShown ? 'Read Guide ↓' : 'Collapse Guide ↑';
      }
    });
  });
}

function renderRecommendedLearning() {
  const recContainer = document.getElementById('recommended-articles-wrapper');
  if (!recContainer) return;

  const recs = getRecommendedArticles(state.assessment);
  if (!state.assessment) {
    recContainer.innerHTML = `
      <div class="recommended-banner">
        <p>💡 Complete an assessment to see personalized reading recommendations based on your reported density, mass, or calcifications.</p>
        <button class="btn-secondary" data-navigate="assess">Take Assessment →</button>
      </div>
    `;
    recContainer.querySelector('button')?.addEventListener('click', () => navigateTo('assess'));
    return;
  }

  recContainer.innerHTML = `
    <div class="personalized-rec-header">
      <h4>Recommended based on your ${state.assessment.category} indicators:</h4>
    </div>
    <div class="recommended-cards-grid">
      ${recs.map(art => `
        <div class="rec-mini-card" data-jump-article="${art.id}">
          <span class="rec-category">${art.category}</span>
          <h5>${art.title}</h5>
          <p>${art.summary}</p>
          <span class="rec-link">Explore Topic →</span>
        </div>
      `).join('')}
    </div>
  `;

  recContainer.querySelectorAll('.rec-mini-card').forEach(card => {
    card.addEventListener('click', () => {
      const artId = card.getAttribute('data-jump-article');
      const targetCard = document.getElementById(`card-${artId}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const contentElem = document.getElementById(`content-${artId}`);
        const btn = targetCard.querySelector('.btn-expand-article');
        if (contentElem && btn) {
          contentElem.style.display = 'block';
          btn.textContent = 'Collapse Guide ↑';
        }
      }
    });
  });
}

function setupMythFactQuiz() {
  state.quiz.currentIndex = 0;
  state.quiz.score = 0;
  state.quiz.completed = false;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const quizBox = document.getElementById('myth-fact-box');
  if (!quizBox) return;

  const currentQ = MYTH_FACT_QUESTIONS[state.quiz.currentIndex];

  if (!currentQ) {
    // Quiz finished
    quizBox.innerHTML = `
      <div class="quiz-complete-card">
        <h3>🎉 Quiz Complete!</h3>
        <p class="quiz-score-badge">You got <strong>${state.quiz.score} / ${MYTH_FACT_QUESTIONS.length}</strong> correct!</p>
        <p>You've taken a wonderful step toward understanding breast health and screening facts.</p>
        <button class="btn-primary" id="btn-restart-quiz">Restart Quiz</button>
      </div>
    `;
    document.getElementById('btn-restart-quiz')?.addEventListener('click', () => {
      setupMythFactQuiz();
    });
    return;
  }

  quizBox.innerHTML = `
    <div class="quiz-header">
      <span class="quiz-progress">Question ${state.quiz.currentIndex + 1} of ${MYTH_FACT_QUESTIONS.length}</span>
      <span class="quiz-score">Score: ${state.quiz.score}</span>
    </div>
    <div class="quiz-question-statement">
      "${currentQ.statement}"
    </div>
    <div class="quiz-actions" id="quiz-btn-group">
      <button class="btn-quiz btn-myth" id="btn-answer-myth">MYTH</button>
      <button class="btn-quiz btn-fact" id="btn-answer-fact">FACT</button>
    </div>
    <div class="quiz-feedback-box" id="quiz-feedback" style="display: none;"></div>
  `;

  document.getElementById('btn-answer-myth')?.addEventListener('click', () => handleQuizAnswer(false));
  document.getElementById('btn-answer-fact')?.addEventListener('click', () => handleQuizAnswer(true));
}

function handleQuizAnswer(userChoseFact) {
  const currentQ = MYTH_FACT_QUESTIONS[state.quiz.currentIndex];
  const isCorrect = (userChoseFact === currentQ.isFact);

  if (isCorrect) state.quiz.score++;

  const feedbackBox = document.getElementById('quiz-feedback');
  const btnGroup = document.getElementById('quiz-btn-group');
  if (btnGroup) btnGroup.style.display = 'none';

  if (feedbackBox) {
    feedbackBox.style.display = 'block';
    feedbackBox.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackBox.innerHTML = `
      <div class="feedback-badge">${isCorrect ? '✓ Correct!' : '✗ Not quite!'}</div>
      <p class="feedback-explanation">${currentQ.explanation}</p>
      <button class="btn-primary" id="btn-next-question">
        ${state.quiz.currentIndex + 1 < MYTH_FACT_QUESTIONS.length ? 'Next Question →' : 'View Final Score →'}
      </button>
    `;

    document.getElementById('btn-next-question')?.addEventListener('click', () => {
      state.quiz.currentIndex++;
      renderQuizQuestion();
    });
  }
}

/* ==========================================================================
   Follow-Up Checklist
   ========================================================================== */
function setupChecklist() {
  const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
  checkboxes.forEach(cb => {
    const key = cb.getAttribute('data-checklist-key');
    if (key && state.followUpChecklist[key]) {
      cb.checked = true;
    }
    cb.addEventListener('change', () => {
      if (key) {
        state.followUpChecklist[key] = cb.checked;
        try {
          localStorage.setItem('mammoai_checklist', JSON.stringify(state.followUpChecklist));
        } catch (e) {}
      }
    });
  });
}

/* ==========================================================================
   Competition Demo Mode
   ========================================================================== */
function setupDemoMode() {
  const demoToggle = document.getElementById('toggle-demo-mode');
  const demoModal = document.getElementById('demo-scenarios-modal');
  const closeDemoModal = document.getElementById('btn-close-demo-modal');

  demoToggle?.addEventListener('click', () => {
    demoModal?.classList.add('active');
  });

  closeDemoModal?.addEventListener('click', () => {
    demoModal?.classList.remove('active');
  });

  // Demo scenarios
  document.querySelectorAll('[data-demo-scenario]').forEach(btn => {
    btn.addEventListener('click', () => {
      const scenario = btn.getAttribute('data-demo-scenario');
      loadDemoScenario(scenario);
      demoModal?.classList.remove('active');
    });
  });
}

function loadDemoScenario(scenarioNumber) {
  if (scenarioNumber === '1') {
    // Low Baseline
    state.formInputs = {
      ageCategory: '40–49',
      lump: 'No',
      density: 'Low / fatty',
      calcification: 'No'
    };
  } else if (scenarioNumber === '2') {
    // Moderate: Dense Tissue + Calcifications
    state.formInputs = {
      ageCategory: '50–59',
      lump: 'No',
      density: 'Heterogeneously dense',
      calcification: 'Yes'
    };
  } else if (scenarioNumber === '3') {
    // Higher: Lump + Extremely Dense
    state.formInputs = {
      ageCategory: '60+',
      lump: 'Yes',
      density: 'Extremely dense',
      calcification: 'Yes'
    };
  }

  state.currentAssessmentStep = 4;
  showToast(`Loaded Demonstration Scenario ${scenarioNumber}`);
  runAssessmentAnalysis();
}

/* ==========================================================================
   Educational Tooltip Dialogs & Global Listeners
   ========================================================================== */
function setupGlobalEvents() {
  // Tooltip / Modal handlers for question info (ⓘ)
  const infoButtons = document.querySelectorAll('.btn-question-info');
  const infoModal = document.getElementById('info-modal');
  const infoModalTitle = document.getElementById('info-modal-title');
  const infoModalBody = document.getElementById('info-modal-body');
  const infoModalClose = document.getElementById('info-modal-close');

  const questionExplanations = {
    ageCategory: {
      title: "Why does age matter?",
      body: "Breast cancer incidence statistically rises with age. Clinical screening recommendations (such as starting regular mammograms in your 40s and continuing through your 70s) are established around age-based evidence. In our prototype, age is one demographic indicator considered alongside physical findings."
    },
    lump: {
      title: "What does lump or mass mean?",
      body: "A lump or mass refers to an identifiable focal density or palpable area in breast tissue. While a reported lump is the primary physical sign evaluated, roughly 80% of breast lumps turn out to be harmless, fluid-filled cysts or benign fibroadenomas. Any new lump should always be evaluated with targeted diagnostic imaging."
    },
    density: {
      title: "What is breast tissue density?",
      body: "Breast density compares the amount of fibrous and glandular tissue against fatty tissue on a mammogram. Dense tissue appears white on X-rays, which can mask small abnormalities that also appear white. Dense breasts are very common (nearly 50% of screening individuals) and are a normal anatomical feature, not cancer."
    },
    calcification: {
      title: "What are calcifications?",
      body: "Calcifications are microscopic calcium deposits in breast tissue. Macrocalcifications are large and almost always benign (caused by aging or old trauma). Microcalcifications are tiny specks; while usually non-cancerous, specific clustered patterns may warrant magnified views to verify."
    }
  };

  infoButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const topic = btn.getAttribute('data-info-topic');
      const data = questionExplanations[topic];
      if (data && infoModal && infoModalTitle && infoModalBody) {
        infoModalTitle.textContent = data.title;
        infoModalBody.textContent = data.body;
        infoModal.classList.add('active');
      }
    });
  });

  infoModalClose?.addEventListener('click', () => {
    infoModal?.classList.remove('active');
  });

  // Modal backdrop click to close
  window.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal?.classList.remove('active');
    const demoModal = document.getElementById('demo-scenarios-modal');
    if (e.target === demoModal) demoModal?.classList.remove('active');
  });

  // Clear data button
  document.getElementById('btn-clear-assessment')?.addEventListener('click', () => {
    if (confirm("Clear your current assessment and inputs from this browser?")) {
      clearUserAssessment();
    }
  });

  // Expandable transparent AI logic toggle
  const toggleAiLogicBtn = document.getElementById('btn-toggle-ai-logic');
  const aiLogicContent = document.getElementById('transparent-ai-logic-details');
  toggleAiLogicBtn?.addEventListener('click', () => {
    const isVisible = aiLogicContent?.style.display === 'block';
    if (aiLogicContent) aiLogicContent.style.display = isVisible ? 'none' : 'block';
    if (toggleAiLogicBtn) {
      toggleAiLogicBtn.innerHTML = isVisible 
        ? '🧠 How did MammoAI reach this result? <span class="arrow">↓</span>'
        : '🧠 How did MammoAI reach this result? <span class="arrow">↑</span>';
    }
  });
}

function showToast(message) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}
