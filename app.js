const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const stressRange = document.querySelector("#stressRange");
const stressValue = document.querySelector("#stressValue");
const checkInButton = document.querySelector("#checkInButton");
const resetButton = document.querySelector("#resetButton");
const exerciseCard = document.querySelector("#exerciseCard");
const exerciseTitle = document.querySelector("#exerciseTitle");
const exerciseText = document.querySelector("#exerciseText");
const exerciseButton = document.querySelector("#exerciseButton");

const state = {
  emotion: null,
  stress: 5,
  action: null,
  exerciseTimer: null,
};

const storageKey = "jingxin-check-in";

function saveState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      emotion: state.emotion,
      stress: state.stress,
      action: state.action,
    }),
  );
}

function addMessage(text, role = "assistant") {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = text;
  chatLog.append(message);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function selectChoice(containerSelector, attribute, value) {
  document.querySelectorAll(containerSelector).forEach((button) => {
    const selected = button.getAttribute(attribute) === value;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function getSafetyResponse(message) {
  const riskPatterns =
    /(want to die|do not want to live|don't want to live|end my life|kill myself|suicide|hurt myself|self-harm|no reason to live)/i;

  if (riskPatterns.test(message)) {
    return {
      crisis: true,
      text:
        "I am concerned by those words. This prototype cannot provide emergency support. Please contact local emergency services or a crisis support service, or a trusted person who can stay with you.\n\nIf it is safe, move away from anything that could cause harm and go to a place where another person is present.",
    };
  }

  return null;
}

function getRuleBasedReply({ emotion, stress, action, message }) {
  if (message) {
    const safety = getSafetyResponse(message);
    if (safety) return safety;
  }

  if (stress >= 8) {
    if (action === "Breathe") {
      return {
        text:
          "Your stress appears to be high. Start with one small action: inhale for 4 seconds, pause for 2, and exhale for 6, repeating four times. Then write down one next step you can control.",
      };
    }
    if (action === "Task") {
      return {
        text:
          "Do not try to handle everything at once. Choose the most urgent item and shrink it into a five-minute task. After completing it, decide whether to continue.",
      };
    }
    return {
      text:
        "Your stress appears to be high. Pause before doing more: have some water and relax your shoulders. If this continues to affect sleep or daily life, consider speaking to someone you trust or a professional.",
    };
  }

  if (stress >= 5) {
    if (emotion === "Frustrated" || emotion === "Anxious") {
      return {
        text:
          "Tension or frustration may narrow attention. Try a three-minute walk or slow breathing, then write down the most concrete worry.",
      };
    }
    return {
      text:
        "Try a short break: leave the screen for five minutes, stretch, and reassess your stress level.",
    };
  }

  if (emotion === "Calm") {
    return {
      text:
        "Your state appears calm. Note what is helping you feel settled so you can try it again if stress rises.",
    };
  }

  return {
    text:
      "Check whether your body needs water, food, rest or a quieter location. Look after one need at a time, then decide the next step.",
  };
}

function configureExercise(action) {
  exerciseCard.hidden = false;

  if (action === "Breathe") {
    exerciseTitle.textContent = "Slow breathing";
    exerciseText.textContent = "Inhale for 4 seconds, pause for 2, and exhale for 6.";
  } else if (action === "Rest") {
    exerciseTitle.textContent = "Short break";
    exerciseText.textContent = "Leave the screen, relax your shoulders, and notice three things around you.";
  } else {
    exerciseTitle.textContent = "Break down a task";
    exerciseText.textContent = "Choose one item and reduce it to a step you can begin in five minutes.";
  }

  exerciseButton.textContent = "Start timer";
  window.clearInterval(state.exerciseTimer);
  state.exerciseTimer = null;
}

function startExercise() {
  if (state.exerciseTimer) {
    window.clearInterval(state.exerciseTimer);
    state.exerciseTimer = null;
    exerciseButton.textContent = "Start timer";
    return;
  }

  let remaining = 180;
  exerciseButton.textContent = `${remaining} seconds remaining`;

  state.exerciseTimer = window.setInterval(() => {
    remaining -= 1;
    exerciseButton.textContent =
      remaining > 0 ? `${remaining} seconds remaining` : "Exercise complete";

    if (remaining <= 0) {
      window.clearInterval(state.exerciseTimer);
      state.exerciseTimer = null;
    }
  }, 1000);
}

document.querySelectorAll("[data-emotion]").forEach((button) => {
  button.addEventListener("click", () => {
    state.emotion = button.dataset.emotion;
    selectChoice("[data-emotion]", "data-emotion", state.emotion);
  });
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    state.action = button.dataset.action;
    selectChoice("[data-action]", "data-action", state.action);
  });
});

stressRange.addEventListener("input", () => {
  state.stress = Number(stressRange.value);
  stressValue.textContent = String(state.stress);
});

checkInButton.addEventListener("click", () => {
  if (!state.emotion) {
    addMessage("Please select a feeling first so the system can apply its visible rules.", "assistant");
    return;
  }

  saveState();
  const reply = getRuleBasedReply({
    emotion: state.emotion,
    stress: state.stress,
    action: state.action,
  });
  addMessage(
    `Quick check-in: ${state.emotion}, stress ${state.stress}/10.\n\n${reply.text}`,
  );

  if (state.action) configureExercise(state.action);
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  messageInput.value = "";

  const reply = getRuleBasedReply({
    emotion: state.emotion,
    stress: state.stress,
    action: state.action,
    message,
  });
  addMessage(reply.text);
});

exerciseButton.addEventListener("click", startExercise);

resetButton.addEventListener("click", () => {
  state.emotion = null;
  state.stress = 5;
  state.action = null;
  state.exerciseTimer && window.clearInterval(state.exerciseTimer);
  state.exerciseTimer = null;

  stressRange.value = "5";
  stressValue.textContent = "5";
  exerciseCard.hidden = true;
  chatLog.replaceChildren();
  localStorage.removeItem(storageKey);

  document.querySelectorAll(".choice-grid button").forEach((button) => {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  });
  addMessage("This session has been cleared. Describe how you feel or complete the quick check-in.");
});

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return;

    if (saved.emotion) {
      state.emotion = saved.emotion;
      selectChoice("[data-emotion]", "data-emotion", state.emotion);
    }
    if (saved.action) {
      state.action = saved.action;
      selectChoice("[data-action]", "data-action", state.action);
    }
    if (Number.isFinite(saved.stress)) {
      state.stress = saved.stress;
      stressRange.value = String(saved.stress);
      stressValue.textContent = String(saved.stress);
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
}

restoreState();
addMessage("Hello. I will listen to your description, then offer low-risk and optional suggestions. You do not need to share anything you prefer not to.");
