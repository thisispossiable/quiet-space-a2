(() => {
  "use strict";

  const scenarios = {
    phishing: {
      label: "A familiar-looking login",
      url: "https://campus-signin.example",
      task: "You followed a message asking you to sign in to a campus service. The address does not match the service in the message.",
      knownRisk: false,
      identityMismatch: true,
      uncertainSignal: false,
      evidence: [
        "Identity mismatch: the message claims campus.example, but the fixture address is campus-signin.example.",
        "The fixture describes an unsolicited sign-in request. No real credentials are requested.",
      ],
      reviewClears: false,
      preview: "A login-like placeholder",
    },
    malware: {
      label: "An unexpected download",
      url: "https://download-update.example",
      task: "A page asks you to download an update. The scenario includes a preassigned known-risk flag; no file will be downloaded.",
      knownRisk: true,
      identityMismatch: false,
      uncertainSignal: false,
      evidence: [
        "Known-risk flag: true in this authored scenario, not a live reputation lookup.",
        "The fixture describes an unexpected software download. No executable exists.",
      ],
      reviewClears: false,
      preview: "A download-like placeholder",
    },
    uncertain: {
      label: "A legitimate site, flagged",
      url: "https://archive-campus.example",
      task: "You need a library archive. A scripted reputation signal is out of date; the fixture's legitimate status is revealed through review.",
      knownRisk: false,
      identityMismatch: false,
      uncertainSignal: true,
      evidence: [
        "Uncertain reputation signal: the fixture contains a stale entry.",
        "No known-risk flag or identity mismatch is present. Uncertainty is not proof of harm.",
      ],
      reviewClears: true,
      preview: "Library archive: access restored",
    },
    benign: {
      label: "An ordinary library page",
      url: "https://library-campus.example",
      task: "You open a library catalogue. This fixture has no flagged signals, so an unnecessary warning would interrupt a legitimate task.",
      knownRisk: false,
      identityMismatch: false,
      uncertainSignal: false,
      evidence: [
        "Known-risk, identity-mismatch and uncertain-reputation fixture flags are all false.",
        "An absence of fixture flags is not a guarantee about real websites.",
      ],
      reviewClears: false,
      preview: "Library catalogue",
    },
  };

  const descriptions = {
    protective: "The system blocks flagged fixtures first. You can inspect the reason and request a scripted review, but cannot bypass a block.",
    guided: "A warning interrupts the simulated task, explains the concern, and leaves continuation to the user. It never opens a real site.",
  };
  const state = { scenario: "phishing", policy: "protective", decision: null, review: null, events: [] };
  const byId = (id) => document.getElementById(id);

  function decide(scenario, policy) {
    if (!scenario.knownRisk && !scenario.identityMismatch && !scenario.uncertainSignal) {
      return {
        kind: "allow",
        title: "No warning in this fixture",
        summary: "No authored risk signals were found. The simulated task can continue without an unnecessary warning. This is not a safety guarantee.",
        rule: "Fixture rule N1: no flags -> no warning under either policy.",
      };
    }
    if (policy === "guided") {
      return {
        kind: "warn",
        title: "Pause before continuing",
        summary: "The fixture contains a flagged signal. Inspect the reason or return to safety. This policy leaves the simulated risk decision to you.",
        rule: "Fixture rule G1: any flagged signal + guided choice -> warning with an internal-only continuation.",
      };
    }
    return {
      kind: "block",
      title: "Page blocked by default",
      summary: scenario.uncertainSignal
        ? "An uncertain signal paused this simulated task. It may be a false positive. You do not need to decide technical risk: request a scripted review or return to safety."
        : "A risk signal stopped this simulated task. The system takes the initial decision instead of asking you to override a technical warning.",
      rule: "Fixture rule P1: any flagged signal + protective default -> block with explanation and review, without bypass.",
    };
  }

  function record(action, outcome) {
    const event = {
      step: state.events.length + 1,
      scenario: state.scenario,
      policy: state.policy,
      action,
      outcome,
    };
    state.events.push(event);
    const item = document.createElement("li");
    const number = document.createElement("span");
    number.className = "event-number";
    number.textContent = String(event.step).padStart(2, "0");
    const detail = document.createElement("span");
    detail.textContent = `${scenarios[event.scenario].label} / ${event.policy} / ${action}: ${outcome}`;
    item.append(number, detail);
    byId("eventList").append(item);
    byId("emptyTrace").hidden = true;
    byId("exportButton").disabled = false;
  }

  function addAction(container, label, handler, primary = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `button ${primary ? "primary" : "secondary"}`;
    button.textContent = label;
    button.addEventListener("click", handler);
    container.append(button);
  }

  function clearDecision() {
    state.decision = null;
    state.review = null;
    for (const id of ["decisionPanel", "reviewPanel", "preview", "understandingPanel"]) {
      byId(id).hidden = true;
    }
    byId("idlePanel").hidden = false;
    byId("reasonDetails").open = false;
    byId("understandingForm").reset();
    byId("understandingFeedback").textContent = "";
    byId("statusLine").textContent = "Ready. Nothing has been evaluated.";
  }

  function showContext() {
    document.querySelectorAll("[data-scenario]").forEach((button) => {
      const selected = button.dataset.scenario === state.scenario;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    byId("policySelect").value = state.policy;
    byId("policyDescription").textContent = descriptions[state.policy];
    byId("simulatedUrl").textContent = scenarios[state.scenario].url;
    byId("scenarioTask").textContent = scenarios[state.scenario].task;
    clearDecision();
  }

  function returnToSafety() {
    byId("preview").hidden = true;
    byId("reviewPanel").hidden = true;
    byId("decisionTitle").textContent = "Returned to safety";
    byId("decisionSummary").textContent = "The simulated navigation has stopped. No external page was opened. Change the scenario or policy to try another path.";
    byId("decisionBadge").textContent = "SAFE RETURN";
    byId("decisionPanel").dataset.kind = "allow";
    byId("decisionActions").replaceChildren();
    byId("statusLine").textContent = "Returned to the safe starting point.";
    record("return-to-safety", "simulated navigation stopped");
    byId("decisionTitle").focus();
  }

  function openPreview(reviewed = false) {
    byId("previewTitle").textContent = scenarios[state.scenario].preview;
    byId("previewText").textContent = reviewed
      ? "The scripted review corrected this fixture's stale flag. The legitimate task can resume here inside the demonstration."
      : "This placeholder shows what continuation means in the prototype. It is not evidence that a real warning should be ignored.";
    byId("preview").hidden = false;
    byId("statusLine").textContent = "Internal placeholder opened. No network navigation.";
    record("open-preview", reviewed ? "reviewed fixture" : "internal simulation only");
  }

  function requestReview() {
    state.review = "pending";
    byId("preview").hidden = true;
    byId("decisionActions").replaceChildren();
    addAction(byId("decisionActions"), "Return to safety", returnToSafety, true);
    byId("reviewPanel").hidden = false;
    byId("reviewStatus").textContent = "Review requested - access is still paused";
    byId("reviewExplanation").textContent = "Requesting review does not itself clear a flag. In a deployed service a separate review process would be needed. Run the fixed outcome below to inspect this prototype's next state.";
    byId("reviewActions").replaceChildren();
    addAction(byId("reviewActions"), "Run scripted review", completeReview);
    byId("statusLine").textContent = "Simulated review pending. No request was sent.";
    record("request-review", "pending; not submitted to any service");
    byId("reviewStatus").focus();
  }

  function completeReview() {
    state.review = scenarios[state.scenario].reviewClears ? "cleared" : "upheld";
    byId("reviewActions").replaceChildren();
    if (state.review === "cleared") {
      byId("decisionTitle").textContent = "Review cleared this fixture";
      byId("decisionSummary").textContent = "The original protective decision has been corrected by the scripted review. You can resume this local task or return to safety. No real website has been verified.";
      byId("decisionBadge").textContent = "SCRIPTED CORRECTION";
      byId("decisionPanel").dataset.kind = "allow";
      byId("ruleExplanation").textContent = "Initial fixture rule P1 blocked the stale signal. Scripted review R1 clears this authored false-positive case; it is not live verification.";
      byId("reviewStatus").textContent = "False positive corrected - scripted outcome";
      byId("reviewExplanation").textContent = "The fixture's prewritten review identifies a stale reputation entry. The original decision was not proof of danger. Only this local placeholder is now available.";
      addAction(byId("reviewActions"), "Open reviewed simulation", () => openPreview(true), true);
    } else {
      byId("reviewStatus").textContent = "Block upheld - scripted outcome";
      byId("reviewExplanation").textContent = "The prewritten review retains the fixture's risk flag. Protective access remains blocked; return to safety instead. This is not an expert review of a real site.";
    }
    byId("statusLine").textContent = "Scripted review complete.";
    record("scripted-review", state.review);
    byId("reviewStatus").focus();
  }

  function evaluate() {
    clearDecision();
    state.decision = decide(scenarios[state.scenario], state.policy);
    const decision = state.decision;
    byId("idlePanel").hidden = true;
    byId("decisionPanel").hidden = false;
    byId("decisionPanel").dataset.kind = decision.kind;
    byId("decisionBadge").textContent = { allow: "NO FLAGGED SIGNALS", warn: "USER CHOICE", block: "SYSTEM DECISION" }[decision.kind];
    byId("decisionTitle").textContent = decision.title;
    byId("decisionSummary").textContent = decision.summary;
    byId("ruleExplanation").textContent = decision.rule;
    byId("evidenceList").replaceChildren();
    scenarios[state.scenario].evidence.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      byId("evidenceList").append(item);
    });
    const actions = byId("decisionActions");
    actions.replaceChildren();
    addAction(actions, "Return to safety", returnToSafety, decision.kind !== "allow");
    if (decision.kind === "warn") addAction(actions, "Continue in simulation", () => openPreview());
    if (decision.kind === "allow") addAction(actions, "Open simulated page", () => openPreview(), true);
    if (decision.kind !== "allow") addAction(actions, "Request a review", requestReview);
    byId("understandingPanel").hidden = decision.kind === "allow";
    byId("statusLine").textContent = `Decision: ${decision.kind}. ${state.policy === "protective" ? "Protective default" : "Guided user choice"}.`;
    record("evaluate", decision.kind);
    byId("decisionTitle").focus();
  }

  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      state.scenario = button.dataset.scenario;
      showContext();
    });
  });
  byId("policySelect").addEventListener("change", (event) => {
    state.policy = event.target.value;
    showContext();
  });
  byId("evaluateButton").addEventListener("click", evaluate);
  byId("understandingForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const answer = new FormData(event.currentTarget).get("understanding");
    if (!answer) {
      byId("understandingFeedback").textContent = "Choose an explanation first, or skip this optional question.";
      return;
    }
    const correct = answer === "fixture";
    byId("understandingFeedback").textContent = correct
      ? "Correct. The decision follows fixture rules, not proof of harm or user carelessness. Review can expose a false positive."
      : "Not quite. A warning does not prove carelessness, and no policy guarantees safety. These are scripted signals; inspect the reason or request a review.";
    record("understanding-check", correct ? "correct explanation selected" : "alternative explanation selected");
  });
  byId("resetButton").addEventListener("click", () => {
    state.scenario = "phishing";
    state.policy = "protective";
    state.events = [];
    byId("eventList").replaceChildren();
    byId("emptyTrace").hidden = false;
    byId("exportButton").disabled = true;
    showContext();
    byId("statusLine").textContent = "Demonstration reset. The local trace has been cleared.";
  });
  byId("exportButton").addEventListener("click", () => {
    const data = {
      simulation: true,
      notice: "Local scripted interactions only. Not participant research or a measure of security effectiveness.",
      events: state.events,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "safebrowse-local-trace.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  showContext();
})();
