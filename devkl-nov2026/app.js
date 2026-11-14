(function () {
  "use strict";

  const NISAB_MYR = 29000; // Illustrative 85g gold nisab threshold in MYR

  const TIER_META = {
    cash: { name: "Cash Shield Plan", rate: 0.036, defaultGoalName: "My 6-Month Rainy Day Cushion" },
    balanced: { name: "Balanced Sukuk Plan", rate: 0.058, defaultGoalName: "First Home / Milestone Fund" },
    growth: { name: "Ethical Growth Plan", rate: 0.078, defaultGoalName: "Long-Term Halal Wealth" }
  };

  function formatRM(value) {
    return "RM " + Math.round(value).toLocaleString("en-MY");
  }

  /* ----------------------------------------------------------
   * 1. Plain English vs. Shariah Structure Jargon Toggle
   * ---------------------------------------------------------- */
  const plainBtn = document.getElementById("mode-plain-btn");
  const shariahBtn = document.getElementById("mode-shariah-btn");
  const translatableNodes = document.querySelectorAll("[data-plain][data-shariah]");

  function setLanguageMode(mode) {
    const isPlain = mode === "plain";
    plainBtn.classList.toggle("active", isPlain);
    plainBtn.setAttribute("aria-pressed", String(isPlain));
    shariahBtn.classList.toggle("active", !isPlain);
    shariahBtn.setAttribute("aria-pressed", String(!isPlain));

    translatableNodes.forEach((node) => {
      node.textContent = isPlain
        ? node.getAttribute("data-plain")
        : node.getAttribute("data-shariah");
    });
  }

  plainBtn?.addEventListener("click", () => setLanguageMode("plain"));
  shariahBtn?.addEventListener("click", () => setLanguageMode("shariah"));

  /* ----------------------------------------------------------
   * 2. Interactive Halal Goal & Zakat Calculator
   * ---------------------------------------------------------- */
  const initialSlider = document.getElementById("initial-slider");
  const monthlySlider = document.getElementById("monthly-slider");
  const yearsSlider = document.getElementById("years-slider");
  const zakatToggle = document.getElementById("zakat-toggle");
  const tierButtons = document.querySelectorAll(".tier-btn");

  const initialOutput = document.getElementById("initial-output");
  const monthlyOutput = document.getElementById("monthly-output");
  const yearsOutput = document.getElementById("years-output");

  const projectedTotalEl = document.getElementById("projected-total");
  const gainVsIdleEl = document.getElementById("gain-vs-idle");
  const barMizanLabel = document.getElementById("bar-mizan-label");
  const barIdleLabel = document.getElementById("bar-idle-label");
  const barPrincipal = document.getElementById("bar-principal");
  const barProfit = document.getElementById("bar-profit");
  const barIdle = document.getElementById("bar-idle");
  const legendDeposits = document.getElementById("legend-deposits");
  const legendProfit = document.getElementById("legend-profit");
  const zakatCallout = document.getElementById("zakat-callout");
  const zakatAmountEl = document.getElementById("zakat-amount");
  const zakatNoteEl = document.getElementById("zakat-note");

  const modalRecapText = document.getElementById("modal-recap-text");
  const starterGoalInput = document.getElementById("starter-goal-name");

  let activeTier = "cash";

  function selectTier(tierKey) {
    if (!TIER_META[tierKey]) return;
    activeTier = tierKey;
    tierButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tier === tierKey);
    });
    if (starterGoalInput) {
      starterGoalInput.value = TIER_META[tierKey].defaultGoalName;
    }
    updateCalculator();
  }

  function updateCalculator() {
    const initial = Number(initialSlider.value);
    const monthly = Number(monthlySlider.value);
    const years = Number(yearsSlider.value);
    const annualRate = TIER_META[activeTier].rate;
    const monthlyRate = annualRate / 12;
    const months = years * 12;

    initialOutput.textContent = formatRM(initial);
    monthlyOutput.textContent = formatRM(monthly) + " / mo";
    yearsOutput.textContent = years === 1 ? "1 year" : years + " years";

    const totalDeposits = initial + monthly * months;

    // Monthly compounding for initial lump sum + end-of-month contributions
    let futureValue = initial * Math.pow(1 + monthlyRate, months);
    if (monthlyRate > 0) {
      futureValue += monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    } else {
      futureValue += monthly * months;
    }

    const projectedProfit = Math.max(0, futureValue - totalDeposits);

    projectedTotalEl.textContent = formatRM(futureValue);
    gainVsIdleEl.textContent = "+" + formatRM(projectedProfit) + " halal return";
    barMizanLabel.textContent = formatRM(futureValue);
    barIdleLabel.textContent = formatRM(totalDeposits);
    legendDeposits.textContent = formatRM(totalDeposits);
    legendProfit.textContent = formatRM(projectedProfit);

    // Relative widths (Mizan total = 100%)
    const principalPct = futureValue > 0 ? (totalDeposits / futureValue) * 100 : 100;
    const profitPct = Math.max(0, 100 - principalPct);

    barPrincipal.style.width = principalPct.toFixed(1) + "%";
    barProfit.style.width = profitPct.toFixed(1) + "%";
    barIdle.style.width = principalPct.toFixed(1) + "%";

    // Zakat estimation
    if (!zakatToggle.checked) {
      zakatCallout.hidden = true;
    } else {
      zakatCallout.hidden = false;
      if (futureValue >= NISAB_MYR) {
        const estZakat = futureValue * 0.025;
        zakatAmountEl.textContent = formatRM(estZakat) + " / yr (2.5% above nisab)";
        zakatNoteEl.textContent =
          "Exceeds estimated RM 29,000 gold nisab. Mizan prepares a 1-click Zakat receipt summary.";
      } else {
        zakatAmountEl.textContent = "RM 0 (Below ~RM 29,000 gold nisab)";
        zakatNoteEl.textContent =
          "Mizan alerts you only once your halal savings remain above nisab for 1 lunar year.";
      }
    }

    // Keep onboarding modal summary synced
    if (modalRecapText) {
      modalRecapText.textContent =
        TIER_META[activeTier].name +
        " • " +
        formatRM(monthly) +
        "/mo over " +
        years +
        (years === 1 ? " yr" : " yrs") +
        " (Projected " +
        formatRM(futureValue) +
        ")";
    }
  }

  tierButtons.forEach((btn) => {
    btn.addEventListener("click", () => selectTier(btn.dataset.tier));
  });

  [initialSlider, monthlySlider, yearsSlider, zakatToggle].forEach((input) => {
    input?.addEventListener("input", updateCalculator);
    input?.addEventListener("change", updateCalculator);
  });

  /* ----------------------------------------------------------
   * 3. 30-Second Relevance Quiz (Honest Fit Engine)
   * ---------------------------------------------------------- */
  const quizForm = document.getElementById("relevance-quiz-form");
  const verdictBox = document.getElementById("quiz-verdict");
  const verdictBadge = document.getElementById("verdict-badge");
  const verdictPlanName = document.getElementById("verdict-plan-name");
  const verdictSummary = document.getElementById("verdict-summary");
  const applyQuizBtn = document.getElementById("apply-quiz-to-calc");

  let currentQuizRecommendation = {
    tier: "cash",
    initial: 500,
    monthly: 150,
    years: 2
  };

  function evaluateQuiz() {
    if (!quizForm) return;
    const data = new FormData(quizForm);
    const priority = data.get("priority") || "emergency";
    const experience = data.get("experience") || "beginner";
    const budget = Number(data.get("budget") || 150);

    // Honest mismatch case: Day-trading / short-term speculation
    if (priority === "trading") {
      verdictBox.classList.add("not-ideal");
      verdictBadge.className = "verdict-badge match-low";
      verdictBadge.textContent = "Honest Answer: Partial Fit Only";
      verdictPlanName.textContent = "Mizan does not offer day-trading";
      verdictSummary.textContent =
        "We want to save your time: Mizan isn't a stock-picking broker. However, active traders often still keep their 3–6 month emergency cash in our riba-free Cash Shield (~3.6% p.a.) so idle cash stays protected.";
      applyQuizBtn.textContent = "Preview Cash Shield anyway →";
      currentQuizRecommendation = {
        tier: "cash",
        initial: budget * 4,
        monthly: budget,
        years: 2
      };
      return;
    }

    verdictBox.classList.remove("not-ideal");
    verdictBadge.className = "verdict-badge match-high";
    verdictBadge.textContent = "Strong Fit for You";
    applyQuizBtn.textContent = "Simulate this plan →";

    if (priority === "emergency") {
      const init = experience === "beginner" ? 200 : 1500;
      verdictPlanName.textContent = "Recommended: Cash Shield Plan";
      verdictSummary.textContent =
        "Perfect starting point. Build a calm, riba-free safety net at " +
        formatRM(budget) +
        "/month with ~3.6% p.a. profit-sharing and 1-day withdrawals whenever life happens.";
      currentQuizRecommendation = {
        tier: "cash",
        initial: init,
        monthly: budget,
        years: 2
      };
    } else if (priority === "milestone") {
      const init = experience === "beginner" ? 500 : 3000;
      verdictPlanName.textContent = "Recommended: Balanced Sukuk Plan";
      verdictSummary.textContent =
        "Great match for a 2–5 year target like a home deposit, wedding, or Umrah. Combines steady Sukuk income with screened ethical equities at " +
        formatRM(budget) +
        "/month.";
      currentQuizRecommendation = {
        tier: "balanced",
        initial: init,
        monthly: budget,
        years: 4
      };
    } else {
      const init = experience === "confident" ? 5000 : 1000;
      verdictPlanName.textContent = "Recommended: Ethical Growth Plan";
      verdictSummary.textContent =
        "Ideal for 5+ year wealth building. Your " +
        formatRM(budget) +
        "/month is invested automatically across globally screened Shariah companies with automated Zakat tracking.";
      currentQuizRecommendation = {
        tier: "growth",
        initial: init,
        monthly: budget,
        years: 10
      };
    }
  }

  quizForm?.addEventListener("change", evaluateQuiz);

  applyQuizBtn?.addEventListener("click", () => {
    const rec = currentQuizRecommendation;
    initialSlider.value = String(rec.initial);
    monthlySlider.value = String(rec.monthly);
    yearsSlider.value = String(rec.years);
    selectTier(rec.tier);

    const calcPanel = document.getElementById("calculator-panel");
    calcPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  /* ----------------------------------------------------------
   * 4. Persona Card Quick-Load Buttons
   * ---------------------------------------------------------- */
  const PERSONA_PRESETS = {
    starter: { priority: "emergency", experience: "beginner", budget: "150", initial: 200, monthly: 150, years: 2, tier: "cash" },
    milestone: { priority: "milestone", experience: "some", budget: "500", initial: 3000, monthly: 500, years: 5, tier: "balanced" },
    ethical: { priority: "wealth", experience: "confident", budget: "1200", initial: 5000, monthly: 1200, years: 10, tier: "growth" }
  };

  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = PERSONA_PRESETS[btn.dataset.preset];
      if (!preset) return;

      const pInput = quizForm?.querySelector(`input[name="priority"][value="${preset.priority}"]`);
      const eInput = quizForm?.querySelector(`input[name="experience"][value="${preset.experience}"]`);
      const bInput = quizForm?.querySelector(`input[name="budget"][value="${preset.budget}"]`);
      if (pInput) pInput.checked = true;
      if (eInput) eInput.checked = true;
      if (bInput) bInput.checked = true;

      evaluateQuiz();

      initialSlider.value = String(preset.initial);
      monthlySlider.value = String(preset.monthly);
      yearsSlider.value = String(preset.years);
      selectTier(preset.tier);

      document.getElementById("relevance-check")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ----------------------------------------------------------
   * 5. Accessible Modals & Guided Next-Steps Flows
   * ---------------------------------------------------------- */
  let lastFocusedTrigger = null;

  function openModal(modalId, triggerEl) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    lastFocusedTrigger = triggerEl || document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const closeBtn = modal.querySelector("[data-close-modal]");
    closeBtn?.focus();
  }

  function closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach((modal) => {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    });
    document.body.style.overflow = "";
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
      lastFocusedTrigger.focus();
    }
  }

  document.querySelectorAll("[data-open-modal]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openModal(trigger.getAttribute("data-open-modal"), trigger);
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        closeAllModals();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });

  document.getElementById("switch-sample-to-start")?.addEventListener("click", () => {
    closeAllModals();
    openModal("start-modal");
  });

  document.getElementById("switch-guide-to-start")?.addEventListener("click", () => {
    closeAllModals();
    openModal("start-modal");
  });

  // Handle QuickStart Roadmap Form
  const quickStartForm = document.getElementById("QuickStartForm");
  const quickStartSuccess = document.getElementById("quickstart-success");
  const quickStartMsg = document.getElementById("quickstart-success-msg");

  quickStartForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const goalTitle = starterGoalInput?.value.trim() || "Halal Savings Plan";
    const email = document.getElementById("starter-email")?.value.trim() || "your inbox";

    quickStartForm.hidden = true;
    quickStartSuccess.hidden = false;
    quickStartMsg.textContent =
      'Saved "' +
      goalTitle +
      '" (' +
      TIER_META[activeTier].name +
      ") and sent a copy to " +
      email +
      ". Take your time — you can start with RM 50 whenever you are ready.";
  });

  // Initial render
  evaluateQuiz();
  updateCalculator();
})();
