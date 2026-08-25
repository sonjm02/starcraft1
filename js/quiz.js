(() => {
  const {
    DAMAGE_TYPES,
    SIZE_LABEL,
    AIR_UNIT_KEYS,
    UNITS,
    ATTACKERS,
    QUIZ_OPTIONS
  } = window.SC_DATA;
  const { $, percent, typeBadge, raceBadge, sizeBadge } = window.SC_UI;
  const Knowledge = window.SCKnowledge;
  const Game = window.SCGame;

  const MATCHUPS = {
    tvt: ["terran", "terran"],
    tvp: ["terran", "protoss"],
    tvz: ["terran", "zerg"],
    pvp: ["protoss", "protoss"],
    pvz: ["protoss", "zerg"],
    zvz: ["zerg", "zerg"]
  };

  const PLAY_MODES = ["practice", "time", "score"];
  const storedMatchup = localStorage.getItem("starcraftQuizMatchup");
  const storedKnowledgeRace = localStorage.getItem("starcraftKnowledgeRace");
  const storedKnowledgeTopic = localStorage.getItem("starcraftKnowledgeTopic");
  const storedPlayMode = localStorage.getItem("starcraftPlayMode");

  const state = {
    mode: "rule",
    playMode: PLAY_MODES.includes(storedPlayMode) ? storedPlayMode : "practice",
    matchup: MATCHUPS[storedMatchup] ? storedMatchup : "tvp",
    knowledgeRace: ["terran", "protoss", "zerg"].includes(storedKnowledgeRace) ? storedKnowledgeRace : "terran",
    knowledgeTopic: ["mixed", "attack", "size"].includes(storedKnowledgeTopic) ? storedKnowledgeTopic : "mixed",
    current: null,
    answered: false,
    total: Number(localStorage.getItem("starcraftQuizTotal") || 0),
    correct: Number(localStorage.getItem("starcraftQuizCorrect") || 0),
    streak: Number(localStorage.getItem("starcraftQuizStreak") || 0),
    wrongQueue: JSON.parse(localStorage.getItem("starcraftQuizWrongQueue") || "[]")
  };

  let pendingNextTimer = null;

  const randomItem = list => list[Math.floor(Math.random() * list.length)];
  const modifier = (damageType, size) => DAMAGE_TYPES[damageType][size];
  const unitByKey = key => UNITS.find(unit => unit.key === key);
  const isAirUnit = unit => AIR_UNIT_KEYS.has(unit.key);

  function makeRuleQuestion() {
    const damageType = randomItem(Object.keys(DAMAGE_TYPES));
    const size = randomItem(Object.keys(SIZE_LABEL));
    return { mode: "rule", damageType, size, answer: modifier(damageType, size) };
  }

  function matchupDirections(matchupKey) {
    const [raceA, raceB] = MATCHUPS[matchupKey];
    if (raceA === raceB) return [[raceA, raceB]];
    return [[raceA, raceB], [raceB, raceA]];
  }

  function makeUnitQuestion() {
    const candidates = [];

    matchupDirections(state.matchup).forEach(([attackerRace, defenderRace]) => {
      ATTACKERS.filter(unit => unit.race === attackerRace).forEach(attacker => {
        const attacks = [];
        if (attacker.ground) attacks.push({ target: "ground", type: attacker.ground });
        if (attacker.air) attacks.push({ target: "air", type: attacker.air });

        attacks.forEach(attack => {
          UNITS.filter(unit => {
            if (unit.race !== defenderRace) return false;
            return attack.target === "air" ? isAirUnit(unit) : !isAirUnit(unit);
          }).forEach(defender => {
            candidates.push({
              mode: "unit",
              matchup: state.matchup,
              attackerKey: attacker.key,
              defenderKey: defender.key,
              target: attack.target,
              damageType: attack.type,
              size: defender.size,
              answer: modifier(attack.type, defender.size)
            });
          });
        });
      });
    });

    return randomItem(candidates);
  }

  function makeKnowledgeQuestion() {
    return Knowledge.makeQuestion(state.knowledgeRace, state.knowledgeTopic);
  }

  function makeQuestion(mode = state.mode) {
    if (mode === "rule") return makeRuleQuestion();
    if (mode === "unit") return makeUnitQuestion();
    return makeKnowledgeQuestion();
  }

  function currentScopeKey() {
    if (state.mode === "rule") return "rule";
    if (state.mode === "unit") return `unit:${state.matchup}`;
    return `knowledge:${state.knowledgeRace}:${state.knowledgeTopic}`;
  }

  function cancelNextQuestion() {
    if (pendingNextTimer) {
      window.clearTimeout(pendingNextTimer);
      pendingNextTimer = null;
    }
  }

  function setSetupDisabled(disabled) {
    document.querySelectorAll(".tab, .matchup-btn, .knowledge-btn, .play-mode-btn").forEach(button => {
      button.disabled = disabled;
    });
  }

  function syncActionButtons() {
    const challenge = state.playMode !== "practice";
    $("#nextBtn").hidden = challenge;
    $("#wrongBtn").hidden = challenge;
    $("#resetBtn").disabled = Game.isActive();
  }

  function syncControls() {
    document.querySelectorAll(".tab").forEach(button => {
      button.classList.toggle("active", button.dataset.mode === state.mode);
    });

    $("#matchupControls").hidden = state.mode !== "unit";
    $("#knowledgeControls").hidden = state.mode !== "knowledge";
    $("#challengePanel").hidden = state.playMode === "practice";

    document.querySelectorAll(".matchup-btn").forEach(button => {
      button.classList.toggle("active", button.dataset.matchup === state.matchup);
    });

    document.querySelectorAll(".knowledge-race-btn").forEach(button => {
      button.classList.toggle("active", button.dataset.knowledgeRace === state.knowledgeRace);
    });

    document.querySelectorAll(".knowledge-topic-btn").forEach(button => {
      button.classList.toggle("active", button.dataset.knowledgeTopic === state.knowledgeTopic);
    });

    document.querySelectorAll(".play-mode-btn").forEach(button => {
      button.classList.toggle("active", button.dataset.playMode === state.playMode);
    });

    $(".quiz-card").classList.toggle("challenge-active", Game.isActive());
    setSetupDisabled(Game.isActive());
    syncActionButtons();
  }

  function optionsFor(question) {
    return question.mode === "knowledge" ? Knowledge.optionsFor(question) : QUIZ_OPTIONS;
  }

  function renderQuestion(question) {
    state.current = question;
    state.answered = false;

    if (question.mode === "rule") {
      $("#questionText").textContent = `${DAMAGE_TYPES[question.damageType].ko} 공격이 ${SIZE_LABEL[question.size]} 유닛의 HP에 주는 피해 배율은?`;
      $("#questionBadges").innerHTML = `${typeBadge(question.damageType)}<span class="arrow">→</span>${sizeBadge(question.size)}`;
    } else if (question.mode === "unit") {
      const attacker = unitByKey(question.attackerKey);
      const defender = unitByKey(question.defenderKey);
      const targetText = question.target === "air" ? "대공 공격" : "지상 공격";
      const shieldText = defender.shield ? " (실드 소진 후 HP 기준)" : "";

      $("#questionText").textContent = `${attacker.ko}의 ${targetText}이 ${defender.ko}${shieldText}에게 주는 크기 보정은?`;
      $("#questionBadges").innerHTML = [
        raceBadge(attacker.race),
        `<span class="badge badge-unit">${attacker.ko}</span>`,
        '<span class="arrow">→</span>',
        raceBadge(defender.race),
        `<span class="badge badge-unit">${defender.ko}</span>`
      ].join("");
    } else {
      $("#questionText").textContent = Knowledge.promptFor(question);
      $("#questionBadges").innerHTML = Knowledge.badgesFor(question);
    }

    $("#answers").innerHTML = optionsFor(question).map(option => `
      <button class="answer" type="button" data-value="${option.value}">
        <strong>${option.label}</strong>
        <small>${option.desc}</small>
      </button>
    `).join("");

    const feedback = $("#feedback");
    feedback.className = "feedback";
    feedback.textContent = state.playMode === "practice"
      ? "정답을 고르면 바로 해설이 표시됩니다."
      : "빠르게 정답을 선택하세요.";

    document.querySelectorAll(".answer").forEach(button => {
      button.addEventListener("click", () => checkAnswer(button.dataset.value, button));
    });
  }

  function explain(question) {
    if (question.mode === "rule") {
      return `${DAMAGE_TYPES[question.damageType].ko}은 ${SIZE_LABEL[question.size]} 유닛에게 ${percent(question.answer)} 피해를 줍니다.`;
    }

    if (question.mode === "knowledge") {
      return Knowledge.explain(question);
    }

    const attacker = unitByKey(question.attackerKey);
    const defender = unitByKey(question.defenderKey);
    return `${attacker.ko}의 해당 공격은 ${DAMAGE_TYPES[question.damageType].ko}, ${defender.ko}은 ${SIZE_LABEL[defender.size]}이므로 HP에는 ${percent(question.answer)}가 적용됩니다.${defender.shield ? " 단, 남아 있는 프로토스 실드에는 100%가 적용됩니다." : ""}`;
  }

  function answerLabel(question) {
    if (question.mode === "knowledge") return Knowledge.answerLabel(question);
    return percent(question.answer);
  }

  function saveStats() {
    localStorage.setItem("starcraftQuizTotal", String(state.total));
    localStorage.setItem("starcraftQuizCorrect", String(state.correct));
    localStorage.setItem("starcraftQuizStreak", String(state.streak));
    localStorage.setItem("starcraftQuizWrongQueue", JSON.stringify(state.wrongQueue.slice(0, 40)));
    localStorage.setItem("starcraftQuizMatchup", state.matchup);
    localStorage.setItem("starcraftKnowledgeRace", state.knowledgeRace);
    localStorage.setItem("starcraftKnowledgeTopic", state.knowledgeTopic);
    localStorage.setItem("starcraftPlayMode", state.playMode);
  }

  function updateStats() {
    $("#totalCount").textContent = state.total;
    $("#accuracy").textContent = state.total ? `${Math.round(state.correct / state.total * 100)}%` : "0%";
    $("#streak").textContent = state.streak;
  }

  function celebrate(sourceEl) {
    const rect = sourceEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const layer = document.createElement("div");
    layer.className = "celebration-layer";
    const pieces = ["✓", "★", "✦", "⚡"];

    for (let i = 0; i < 12; i += 1) {
      const piece = document.createElement("span");
      piece.className = "celebration-piece";
      piece.textContent = pieces[i % pieces.length];
      const angle = Math.PI * 2 * i / 12;
      const distance = 50 + Math.random() * 52;
      piece.style.setProperty("--x", `${x}px`);
      piece.style.setProperty("--y", `${y}px`);
      piece.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      piece.style.setProperty("--dy", `${Math.sin(angle) * distance - 12}px`);
      piece.style.setProperty("--rot", `${Math.round(-100 + Math.random() * 200)}deg`);
      piece.style.setProperty("--delay", `${Math.random() * 65}ms`);
      piece.style.setProperty("--size", `${17 + Math.random() * 10}px`);
      layer.appendChild(piece);
    }

    document.body.appendChild(layer);
    window.setTimeout(() => layer.remove(), 760);
  }

  function recordText(playMode = state.playMode) {
    const record = Game.getRecord(currentScopeKey(), playMode);
    if (!record) return "기록 없음";
    if (playMode === "time") {
      return `${record.correct}/30 · ${Game.formatTime(record.elapsedMs)}`;
    }
    return `${record.correct}점`;
  }

  function updateChallengeRecord() {
    if (state.playMode === "practice") return;
    $("#challengeRecord").textContent = recordText();
  }

  function updateChallengeHud(snap) {
    if (state.playMode === "time") {
      $("#challengePrimaryLabel").textContent = "진행";
      $("#challengePrimary").textContent = `${Math.min(snap.answered, Game.TIME_ATTACK_COUNT)}/${Game.TIME_ATTACK_COUNT}`;
      $("#challengeClockLabel").textContent = "시간";
      $("#challengeClock").textContent = Game.formatTime(snap.elapsedMs);
    } else {
      $("#challengePrimaryLabel").textContent = "풀이";
      $("#challengePrimary").textContent = `${snap.answered}문제`;
      $("#challengeClockLabel").textContent = "남은 시간";
      $("#challengeClock").textContent = Game.formatTime(snap.remainingMs ?? Game.SCORE_ATTACK_MS);
    }
    $("#challengeCorrect").textContent = snap.correct;
  }

  function showChallengeReady() {
    cancelNextQuestion();
    Game.abort();
    state.current = null;
    state.answered = false;

    const readySnap = {
      answered: 0,
      correct: 0,
      elapsedMs: 0,
      remainingMs: Game.SCORE_ATTACK_MS
    };
    updateChallengeHud(readySnap);
    updateChallengeRecord();

    $("#questionText").textContent = state.playMode === "time"
      ? "30문제 타임어택을 시작할 준비가 됐습니다."
      : "60초 스코어어택을 시작할 준비가 됐습니다.";
    $("#questionBadges").innerHTML = "";
    $("#answers").innerHTML = "";

    const feedback = $("#feedback");
    feedback.className = "feedback";
    feedback.textContent = state.playMode === "time"
      ? "30문제를 모두 풀면 종료됩니다. 정답 수가 높은 기록이 우선이고, 동점이면 더 빠른 시간이 신기록입니다."
      : "60초 동안 최대한 많은 정답을 맞히면 됩니다. 최고 정답 수가 신기록으로 저장됩니다.";

    $("#challengeStartBtn").disabled = false;
    $("#challengeStartBtn").textContent = "게임 시작";
    syncControls();
  }

  function finishChallenge(result) {
    cancelNextQuestion();
    state.answered = true;
    document.querySelectorAll(".answer").forEach(button => {
      button.disabled = true;
    });

    updateChallengeHud(result);
    updateChallengeRecord();
    syncControls();

    $("#challengeStartBtn").disabled = false;
    $("#challengeStartBtn").textContent = "다시 시작";

    const feedback = $("#feedback");
    feedback.className = result.newRecord ? "feedback good" : "feedback";
    const recordPrefix = result.newRecord ? "신기록! " : "";

    if (result.playMode === "time") {
      feedback.textContent = `${recordPrefix}30문제 완료 · ${result.correct}/30 정답 · ${Game.formatTime(result.elapsedMs)}`;
    } else {
      feedback.textContent = `${recordPrefix}60초 종료 · ${result.correct}점 · ${result.answered}문제 풀이`;
    }
  }

  function startChallenge() {
    if (state.playMode === "practice" || Game.isActive()) return;

    cancelNextQuestion();
    Game.start({
      playMode: state.playMode,
      scopeKey: currentScopeKey(),
      onTick: updateChallengeHud,
      onFinish: finishChallenge
    });

    $("#challengeStartBtn").disabled = true;
    $("#challengeStartBtn").textContent = "진행 중";
    syncControls();
    renderQuestion(makeQuestion());
  }

  function checkAnswer(selected, selectedButton) {
    if (state.answered) return;
    if (state.playMode !== "practice" && !Game.isActive()) return;
    state.answered = true;

    const question = state.current;
    const correct = selected === String(question.answer);
    const feedback = $("#feedback");
    state.total += 1;

    if (correct) {
      state.correct += 1;
      state.streak += 1;
    } else {
      state.streak = 0;
      state.wrongQueue.unshift(question);
    }

    document.querySelectorAll(".answer").forEach(button => {
      button.disabled = true;
      if (button.dataset.value === String(question.answer)) button.classList.add("correct");
      if (button === selectedButton && !correct) button.classList.add("wrong");
    });

    saveStats();
    updateStats();

    if (state.playMode === "practice") {
      if (correct) {
        feedback.className = "feedback good";
        feedback.textContent = `정답입니다. ${explain(question)}`;
        celebrate(selectedButton);
        pendingNextTimer = window.setTimeout(() => {
          pendingNextTimer = null;
          renderQuestion(makeQuestion());
        }, 420);
      } else {
        feedback.className = "feedback bad";
        feedback.textContent = `아쉽습니다. 정답은 ${answerLabel(question)}입니다. ${explain(question)}`;
      }
      return;
    }

    feedback.className = correct ? "feedback good" : "feedback bad";
    feedback.textContent = correct ? "정답!" : `오답 · 정답은 ${answerLabel(question)}`;

    const progress = Game.registerAnswer(correct);
    if (progress.finished || !Game.isActive()) return;

    pendingNextTimer = window.setTimeout(() => {
      pendingNextTimer = null;
      if (Game.isActive()) renderQuestion(makeQuestion());
    }, correct ? 140 : 280);
  }

  function prepareCurrentMode() {
    cancelNextQuestion();
    if (state.playMode === "practice") {
      Game.abort();
      syncControls();
      renderQuestion(makeQuestion());
    } else {
      showChallengeReady();
    }
  }

  function setMode(mode) {
    if (!["rule", "unit", "knowledge"].includes(mode) || Game.isActive()) return;
    state.mode = mode;
    saveStats();
    syncControls();
    prepareCurrentMode();
  }

  function setMatchup(matchup) {
    if (!MATCHUPS[matchup] || Game.isActive()) return;
    state.matchup = matchup;
    saveStats();
    syncControls();
    prepareCurrentMode();
  }

  function setKnowledgeRace(race) {
    if (!["terran", "protoss", "zerg"].includes(race) || Game.isActive()) return;
    state.knowledgeRace = race;
    saveStats();
    syncControls();
    prepareCurrentMode();
  }

  function setKnowledgeTopic(topic) {
    if (!["mixed", "attack", "size"].includes(topic) || Game.isActive()) return;
    state.knowledgeTopic = topic;
    saveStats();
    syncControls();
    prepareCurrentMode();
  }

  function setPlayMode(playMode) {
    if (!PLAY_MODES.includes(playMode) || Game.isActive()) return;
    state.playMode = playMode;
    saveStats();
    syncControls();
    prepareCurrentMode();
  }

  function reviewWrong() {
    const feedback = $("#feedback");
    if (!state.wrongQueue.length) {
      feedback.className = "feedback";
      feedback.textContent = "아직 다시 풀 틀린 문제가 없습니다.";
      return;
    }

    const question = state.wrongQueue.shift();
    state.mode = question.mode;

    if (question.mode === "unit" && MATCHUPS[question.matchup]) {
      state.matchup = question.matchup;
    }

    if (question.mode === "knowledge") {
      if (["terran", "protoss", "zerg"].includes(question.knowledgeRace)) {
        state.knowledgeRace = question.knowledgeRace;
      }
      if (["mixed", "attack", "size"].includes(question.knowledgeScopeTopic)) {
        state.knowledgeTopic = question.knowledgeScopeTopic;
      }
    }

    syncControls();
    saveStats();
    renderQuestion(question);
  }

  function resetStats() {
    const ok = confirm("푼 문제 수, 정답률, 연속 정답, 틀린 문제와 타임/스코어 어택 최고 기록을 모두 초기화할까요?");
    if (!ok) return;

    cancelNextQuestion();
    Game.abort();
    Game.clearRecords();
    state.total = 0;
    state.correct = 0;
    state.streak = 0;
    state.wrongQueue = [];
    saveStats();
    updateStats();
    syncControls();

    if (state.playMode === "practice") {
      $("#feedback").className = "feedback";
      $("#feedback").textContent = "기록을 초기화했습니다.";
    } else {
      showChallengeReady();
      $("#feedback").textContent = "기록을 초기화했습니다. 게임 시작을 누르면 새 기록에 도전합니다.";
    }
  }

  function init() {
    document.querySelectorAll(".tab").forEach(button => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });
    document.querySelectorAll(".matchup-btn").forEach(button => {
      button.addEventListener("click", () => setMatchup(button.dataset.matchup));
    });
    document.querySelectorAll(".knowledge-race-btn").forEach(button => {
      button.addEventListener("click", () => setKnowledgeRace(button.dataset.knowledgeRace));
    });
    document.querySelectorAll(".knowledge-topic-btn").forEach(button => {
      button.addEventListener("click", () => setKnowledgeTopic(button.dataset.knowledgeTopic));
    });
    document.querySelectorAll(".play-mode-btn").forEach(button => {
      button.addEventListener("click", () => setPlayMode(button.dataset.playMode));
    });

    $("#challengeStartBtn").addEventListener("click", startChallenge);
    $("#nextBtn").addEventListener("click", () => renderQuestion(makeQuestion()));
    $("#wrongBtn").addEventListener("click", reviewWrong);
    $("#resetBtn").addEventListener("click", resetStats);

    syncControls();
    updateStats();
    prepareCurrentMode();
  }

  window.SCQuiz = { init };
})();
