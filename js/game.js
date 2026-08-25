(() => {
  const STORAGE_KEY = "starcraftChallengeRecordsV1";
  const TIME_ATTACK_COUNT = 30;
  const SCORE_ATTACK_MS = 60_000;

  const state = {
    playMode: "practice",
    scopeKey: "rule",
    active: false,
    answered: 0,
    correct: 0,
    startedAt: 0,
    endedAt: 0,
    timerId: null,
    onTick: null,
    onFinish: null,
    lastResult: null
  };

  function loadRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function formatTime(ms) {
    return `${(Math.max(0, ms) / 1000).toFixed(1)}초`;
  }

  function clearTimer() {
    if (state.timerId) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function snapshot(now = Date.now()) {
    const end = state.active ? now : (state.endedAt || now);
    const elapsedMs = state.startedAt ? Math.max(0, end - state.startedAt) : 0;
    return {
      playMode: state.playMode,
      scopeKey: state.scopeKey,
      active: state.active,
      answered: state.answered,
      correct: state.correct,
      elapsedMs,
      remainingMs: state.playMode === "score" ? Math.max(0, SCORE_ATTACK_MS - elapsedMs) : null,
      targetCount: state.playMode === "time" ? TIME_ATTACK_COUNT : null
    };
  }

  function getRecord(scopeKey, playMode) {
    const records = loadRecords();
    return records[scopeKey]?.[playMode] || null;
  }

  function updateRecord(result) {
    if (!["time", "score"].includes(result.playMode)) {
      return { newRecord: false, record: null };
    }

    const records = loadRecords();
    const scopeRecords = records[result.scopeKey] || {};
    const previous = scopeRecords[result.playMode] || null;
    let better = false;

    if (result.playMode === "time") {
      better = !previous
        || result.correct > previous.correct
        || (result.correct === previous.correct && result.elapsedMs < previous.elapsedMs);
    } else {
      better = !previous || result.correct > previous.correct;
    }

    if (better) {
      const nextRecord = result.playMode === "time"
        ? { correct: result.correct, elapsedMs: result.elapsedMs }
        : { correct: result.correct };
      scopeRecords[result.playMode] = nextRecord;
      records[result.scopeKey] = scopeRecords;
      saveRecords(records);
      return { newRecord: true, record: nextRecord };
    }

    return { newRecord: false, record: previous };
  }

  function finish(reason = "complete") {
    if (!state.active) return state.lastResult;

    state.active = false;
    state.endedAt = Date.now();
    clearTimer();

    const snap = snapshot(state.endedAt);
    const result = {
      ...snap,
      reason
    };
    const recordResult = updateRecord(result);
    result.newRecord = recordResult.newRecord;
    result.bestRecord = recordResult.record;
    state.lastResult = result;

    const callback = state.onFinish;
    state.onFinish = null;
    if (callback) callback(result);
    return result;
  }

  function tick() {
    if (!state.active) return;
    const snap = snapshot();
    if (state.playMode === "score" && snap.remainingMs <= 0) {
      finish("time");
      return;
    }
    if (state.onTick) state.onTick(snap);
  }

  function start({ playMode, scopeKey, onTick, onFinish }) {
    abort();
    state.playMode = playMode;
    state.scopeKey = scopeKey;
    state.active = true;
    state.answered = 0;
    state.correct = 0;
    state.startedAt = Date.now();
    state.endedAt = 0;
    state.lastResult = null;
    state.onTick = onTick || null;
    state.onFinish = onFinish || null;
    state.timerId = window.setInterval(tick, 100);

    const snap = snapshot();
    if (state.onTick) state.onTick(snap);
    return snap;
  }

  function registerAnswer(correct) {
    if (!state.active) return { finished: false, snapshot: snapshot() };

    const beforeAnswer = snapshot();
    if (state.playMode === "score" && beforeAnswer.remainingMs <= 0) {
      const result = finish("time");
      return { finished: true, result };
    }

    state.answered += 1;
    if (correct) state.correct += 1;

    if (state.playMode === "time" && state.answered >= TIME_ATTACK_COUNT) {
      const result = finish("complete");
      return { finished: true, result };
    }

    const snap = snapshot();
    if (state.onTick) state.onTick(snap);
    return { finished: false, snapshot: snap };
  }

  function abort() {
    clearTimer();
    state.active = false;
    state.startedAt = 0;
    state.endedAt = 0;
    state.answered = 0;
    state.correct = 0;
    state.onTick = null;
    state.onFinish = null;
    state.lastResult = null;
  }

  function isActive() {
    return state.active;
  }

  function clearRecords() {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.SCGame = {
    TIME_ATTACK_COUNT,
    SCORE_ATTACK_MS,
    start,
    registerAnswer,
    abort,
    isActive,
    snapshot,
    getRecord,
    clearRecords,
    formatTime
  };
})();
