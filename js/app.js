(function () {
  "use strict";

  const THEME_KEY = "verbgame-theme";
  const FORM_NAMES = {
    base: "forma base",
    past: "pasado simple",
    participle: "participio pasado"
  };

  const FORM_KEYS = ["base", "past", "participle"];

  function normalize(s) {
    return String(s || "").trim().toLowerCase();
  }

  function checkFormSimple(verb, formKey, userAnswer) {
    const val = verb[formKey];
    const altKey =
      formKey === "past" ? "pastAlt" : formKey === "participle" ? "participleAlt" : null;
    const a = normalize(userAnswer);
    if (normalize(val) === a) return { ok: true };
    if (altKey && verb[altKey])
      for (let i = 0; i < verb[altKey].length; i++)
        if (normalize(verb[altKey][i]) === a) return { ok: true };
    const expected = [val].concat(verb[altKey] || []).filter(Boolean).join(" o ");
    return { ok: false, expected };
  }

  function expectedDisplay(verb, formKey) {
    const main = verb[formKey];
    const altKey =
      formKey === "past" ? "pastAlt" : formKey === "participle" ? "participleAlt" : null;
    if (altKey && verb[altKey] && verb[altKey].length)
      return [main].concat(verb[altKey]).join(" o ");
    return main;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(function (el) {
      el.classList.toggle("active", el.id === id);
    });
  }

  function showEndOverlay(score, total) {
    document.getElementById("end-score").textContent =
      "Puntuación: " + score + " / " + total;
    document.getElementById("end-overlay").classList.remove("hidden");
  }

  function hideEndOverlay() {
    document.getElementById("end-overlay").classList.add("hidden");
  }

  document.getElementById("end-to-menu").addEventListener("click", function () {
    hideEndOverlay();
    showScreen("mode-screen");
  });

  function getTheme() {
    return (
      localStorage.getItem(THEME_KEY) ||
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    );
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    var btn = document.getElementById("theme-toggle");
    var icon = btn.querySelector(".theme-icon");
    var label = btn.querySelector(".theme-label");
    if (theme === "light") {
      icon.textContent = "☀️";
      label.textContent = "Tema claro";
      btn.setAttribute("title", "Cambiar a tema oscuro");
    } else {
      icon.textContent = "🌙";
      label.textContent = "Tema oscuro";
      btn.setAttribute("title", "Cambiar a tema claro");
    }
  }

  function toggleTheme() {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  }

  setTheme(getTheme());
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  // --- Modo 1 ---
  let deckOne = [];
  let indexOne = 0;
  let currentVerbOne = null;
  let currentFormOne = null;
  let correctOne = 0;

  function showModeOneNext() {
    document.getElementById("next-one").classList.remove("hidden");
    document.getElementById("actions-one").classList.add("hidden");
  }

  function hideModeOneNext() {
    document.getElementById("next-one").classList.add("hidden");
    document.getElementById("actions-one").classList.remove("hidden");
  }

  function setInputStateOne(state) {
    var input = document.getElementById("answer-one");
    var icon = document.getElementById("icon-one");
    input.classList.remove("is-correct", "is-error", "shake");
    icon.classList.remove("show-ok", "show-bad");
    void input.offsetWidth;
    if (state === "correct") {
      input.classList.add("is-correct");
      icon.classList.add("show-ok");
      icon.textContent = "✓";
      input.disabled = true;
    } else if (state === "error") {
      input.classList.add("is-error");
      icon.classList.add("show-bad");
      icon.textContent = "✕";
      input.disabled = false;
      input.classList.add("shake");
    } else {
      icon.textContent = "";
      input.disabled = false;
    }
  }

  document.getElementById("answer-one").addEventListener("input", function () {
    var input = document.getElementById("answer-one");
    if (input.classList.contains("is-error")) {
      setInputStateOne("reset");
      var f = document.getElementById("feedback-one");
      f.textContent = "";
      f.classList.remove("is-error", "is-success");
    }
  });

  function resetModeOneUI() {
    var fb = document.getElementById("feedback-one");
    fb.textContent = "";
    fb.classList.remove("is-error", "is-success");
    hideModeOneNext();
    setInputStateOne("reset");
    document.getElementById("answer-one").value = "";
  }

  function startModeOne() {
    deckOne = shuffle(VERBS);
    indexOne = 0;
    correctOne = 0;
    showScreen("game-one-form");
    resetModeOneUI();
    document.getElementById("total-one").textContent = String(deckOne.length);
    nextQuestionOne();
  }

  function nextQuestionOne() {
    var total = deckOne.length;
    document.getElementById("score-one").textContent = String(correctOne);

    if (indexOne >= total) {
      showEndOverlay(correctOne, total);
      return;
    }

    resetModeOneUI();
    currentVerbOne = deckOne[indexOne];
    currentFormOne = FORM_KEYS[Math.floor(Math.random() * 3)];
    document.getElementById("question-text-one").textContent =
      '¿Cómo se escribe "' + currentVerbOne.spanish + '" en ' + FORM_NAMES[currentFormOne] + "?";
    document.getElementById("answer-one").focus();
  }

  function checkOne() {
    var input = document.getElementById("answer-one");
    var feedback = document.getElementById("feedback-one");
    var answer = input.value.trim();

    if (!answer) {
      feedback.textContent = "Escribe una respuesta.";
      feedback.classList.remove("is-success");
      feedback.classList.add("is-error");
      setInputStateOne("reset");
      input.classList.add("shake");
      return;
    }

    var result = checkFormSimple(currentVerbOne, currentFormOne, answer);
    var verbSpanish = currentVerbOne.spanish;

    if (result.ok) {
      correctOne++;
      document.getElementById("score-one").textContent = String(correctOne);
      feedback.textContent = "¡Correcto! " + verbSpanish + " → " + currentVerbOne[currentFormOne];
      feedback.classList.remove("is-error");
      feedback.classList.add("is-success");
      setInputStateOne("correct");
      showModeOneNext();
    } else {
      feedback.textContent = "Incorrecto. Inténtalo de nuevo.";
      feedback.classList.remove("is-success");
      feedback.classList.add("is-error");
      setInputStateOne("error");
    }
  }

  function showAnswerOne() {
    var expected = expectedDisplay(currentVerbOne, currentFormOne);
    setInputStateOne("correct");
    document.getElementById("answer-one").value = expected.split(" o ")[0];
    document.getElementById("feedback-one").textContent = "";
    document.getElementById("feedback-one").classList.remove("is-error", "is-success");
    showModeOneNext();
  }

  document.getElementById("next-one").addEventListener("click", function () {
    indexOne++;
    nextQuestionOne();
  });

  document.getElementById("mode-one-form").addEventListener("click", startModeOne);
  document.getElementById("back-one").addEventListener("click", function () {
    showScreen("mode-screen");
  });
  document.getElementById("show-answer-one").addEventListener("click", showAnswerOne);
  document.getElementById("check-one").addEventListener("click", checkOne);
  document.getElementById("answer-one").addEventListener("keydown", function (e) {
    if (e.key === "Enter") checkOne();
  });

  // --- Modo 3 formas ---
  let deckThree = [];
  let indexThree = 0;
  let currentVerbThree = null;
  let correctThree = 0;
  var locked = { base: false, past: false, participle: false };

  function showModeThreeNext() {
    document.getElementById("next-three").classList.remove("hidden");
    document.getElementById("actions-three").classList.add("hidden");
  }

  function hideModeThreeNext() {
    document.getElementById("next-three").classList.add("hidden");
    document.getElementById("actions-three").classList.remove("hidden");
  }

  function setFieldState(id, state, message) {
    var input = document.getElementById(id);
    var icon = document.querySelector('[data-icon-for="' + id + '"]');
    var fb = document.querySelector('[data-feedback-for="' + id + '"]');
    input.classList.remove("is-correct", "is-error", "shake");
    if (icon) {
      icon.classList.remove("show-ok", "show-bad");
      icon.textContent = "";
    }
    void input.offsetWidth;
    if (message) fb.textContent = message;
    else fb.textContent = "";

    if (state === "correct") {
      input.classList.add("is-correct");
      if (icon) {
        icon.classList.add("show-ok");
        icon.textContent = "✓";
      }
      input.disabled = true;
      input.readOnly = true;
    } else if (state === "error") {
      input.classList.add("is-error");
      if (icon) {
        icon.classList.add("show-bad");
        icon.textContent = "✕";
      }
      input.disabled = false;
      input.readOnly = false;
      input.classList.add("shake");
    } else {
      input.disabled = false;
      input.readOnly = false;
    }
  }

  function resetModeThreeFields() {
    locked = { base: false, past: false, participle: false };
    ["answer-base", "answer-past", "answer-participle"].forEach(function (id) {
      var input = document.getElementById(id);
      input.value = "";
      input.classList.remove("is-correct", "is-error", "shake");
      input.disabled = false;
      input.readOnly = false;
      var icon = document.querySelector('[data-icon-for="' + id + '"]');
      if (icon) {
        icon.classList.remove("show-ok", "show-bad");
        icon.textContent = "";
      }
      document.querySelector('[data-feedback-for="' + id + '"]').textContent = "";
    });
    hideModeThreeNext();
  }

  function startModeThree() {
    deckThree = shuffle(VERBS);
    indexThree = 0;
    correctThree = 0;
    showScreen("game-three-forms");
    document.getElementById("total-three").textContent = String(deckThree.length);
    resetModeThreeFields();
    nextQuestionThree();
  }

  function nextQuestionThree() {
    var total = deckThree.length;
    document.getElementById("score-three").textContent = String(correctThree);

    if (indexThree >= total) {
      showEndOverlay(correctThree, total);
      return;
    }

    resetModeThreeFields();
    currentVerbThree = deckThree[indexThree];
    document.getElementById("question-text-three").textContent =
      'Escribe el verbo "' + currentVerbThree.spanish + '" en sus 3 formas:';
    document.getElementById("answer-base").focus();
  }

  function checkThree() {
    var ids = ["answer-base", "answer-past", "answer-participle"];
    var keys = ["base", "past", "participle"];
    var v = currentVerbThree;

    ids.forEach(function (fid) {
      var el = document.querySelector('[data-feedback-for="' + fid + '"]');
      if (el) el.textContent = "";
    });

    var anyEmpty = false;
    var firstEmpty = null;
    for (var i = 0; i < keys.length; i++) {
      if (locked[keys[i]]) continue;
      if (!document.getElementById(ids[i]).value.trim()) {
        anyEmpty = true;
        if (!firstEmpty) firstEmpty = ids[i];
      }
    }

    if (anyEmpty) {
      if (firstEmpty)
        document.querySelector('[data-feedback-for="' + firstEmpty + '"]').textContent =
          "Completa este campo.";
      return;
    }

    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var id = ids[k];
      if (locked[key]) continue;

      var userVal = document.getElementById(id).value;
      var res = checkFormSimple(v, key, userVal);
      if (res.ok) {
        locked[key] = true;
        setFieldState(id, "correct", "");
      } else {
        setFieldState(id, "error", "");
      }
    }

    if (locked.base && locked.past && locked.participle) {
      correctThree++;
      document.getElementById("score-three").textContent = String(correctThree);
      document.getElementById("question-text-three").classList.add("flash-success");
      setTimeout(function () {
        document.getElementById("question-text-three").classList.remove("flash-success");
      }, 900);
      showModeThreeNext();
    }
  }

  function showAnswerThree() {
    var v = currentVerbThree;
    document.getElementById("answer-base").value = v.base;
    document.getElementById("answer-past").value = v.past;
    document.getElementById("answer-participle").value = expectedDisplay(v, "participle").split(" o ")[0];

    locked = { base: true, past: true, participle: true };
    setFieldState("answer-base", "correct", "");
    setFieldState("answer-past", "correct", "");
    setFieldState("answer-participle", "correct", "");
    document.querySelector('[data-feedback-for="answer-base"]').textContent = "";
    document.querySelector('[data-feedback-for="answer-past"]').textContent = "";
    document.querySelector('[data-feedback-for="answer-participle"]').textContent = "";
    showModeThreeNext();
  }

  document.getElementById("next-three").addEventListener("click", function () {
    indexThree++;
    nextQuestionThree();
  });

  document.getElementById("mode-three-forms").addEventListener("click", startModeThree);
  document.getElementById("back-three").addEventListener("click", function () {
    showScreen("mode-screen");
  });
  document.getElementById("show-answer-three").addEventListener("click", showAnswerThree);
  document.getElementById("check-three").addEventListener("click", checkThree);

  var threeIds = ["answer-base", "answer-past", "answer-participle"];
  var threeKeys = { "answer-base": "base", "answer-past": "past", "answer-participle": "participle" };
  threeIds.forEach(function (id) {
    document.getElementById(id).addEventListener("keydown", function (e) {
      if (e.key === "Enter") checkThree();
    });
    document.getElementById(id).addEventListener("input", function () {
      var k = threeKeys[id];
      if (locked[k]) return;
      var inp = document.getElementById(id);
      if (inp.classList.contains("is-error")) {
        inp.classList.remove("is-error", "shake");
        document.querySelector('[data-feedback-for="' + id + '"]').textContent = "";
        var ic = document.querySelector('[data-icon-for="' + id + '"]');
        if (ic) {
          ic.classList.remove("show-bad");
          ic.textContent = "";
        }
      }
    });
  });
})();
