(() => {
  const { DAMAGE_TYPES, SIZE_LABEL, RACE_LABEL, UNITS } = window.SC_DATA;
  const { raceBadge } = window.SC_UI;

  const ATTACK_OPTIONS = [
    { value: "normal", label: "일반형", desc: "Normal" },
    { value: "concussive", label: "진동형", desc: "Concussive" },
    { value: "explosive", label: "폭발형", desc: "Explosive" },
    { value: "none", label: "공격 없음", desc: "기본 무기 없음" }
  ];

  const SIZE_OPTIONS = [
    { value: "small", label: "소형", desc: "Small" },
    { value: "medium", label: "중형", desc: "Medium" },
    { value: "large", label: "대형", desc: "Large" }
  ];

  const randomItem = list => list[Math.floor(Math.random() * list.length)];
  const unitByKey = key => UNITS.find(unit => unit.key === key);

  function makeQuestion(race, scopeTopic = "mixed") {
    const raceUnits = UNITS.filter(unit => unit.race === race);
    const topic = scopeTopic === "mixed" ? randomItem(["attack", "size"]) : scopeTopic;
    const unit = randomItem(raceUnits);

    if (topic === "size") {
      return {
        mode: "knowledge",
        knowledgeRace: race,
        knowledgeScopeTopic: scopeTopic,
        knowledgeTopic: "size",
        unitKey: unit.key,
        answer: unit.size
      };
    }

    const targets = [];
    if (unit.ground) targets.push("ground");
    if (unit.air) targets.push("air");

    if (!targets.length) {
      return {
        mode: "knowledge",
        knowledgeRace: race,
        knowledgeScopeTopic: scopeTopic,
        knowledgeTopic: "attack",
        unitKey: unit.key,
        attackTarget: "none",
        answer: "none"
      };
    }

    const attackTarget = randomItem(targets);
    return {
      mode: "knowledge",
      knowledgeRace: race,
      knowledgeScopeTopic: scopeTopic,
      knowledgeTopic: "attack",
      unitKey: unit.key,
      attackTarget,
      answer: unit[attackTarget]
    };
  }

  function promptFor(question) {
    const unit = unitByKey(question.unitKey);
    if (question.knowledgeTopic === "size") {
      return `${unit.ko}의 유닛 크기는?`;
    }

    if (question.attackTarget === "none") {
      return `${unit.ko}의 기본 무기 공격 형태는?`;
    }

    const targetText = question.attackTarget === "air" ? "대공 공격" : "지상 공격";
    return `${unit.ko}의 ${targetText} 형태는?`;
  }

  function badgesFor(question) {
    const unit = unitByKey(question.unitKey);
    const topicLabel = question.knowledgeTopic === "size" ? "유닛 크기" : "공격 형태";
    return [
      raceBadge(unit.race),
      `<span class="badge badge-unit">${unit.ko}</span>`,
      `<span class="badge badge-quiz-topic">${topicLabel}</span>`
    ].join("");
  }

  function optionsFor(question) {
    return question.knowledgeTopic === "size" ? SIZE_OPTIONS : ATTACK_OPTIONS;
  }

  function answerLabel(question) {
    if (question.knowledgeTopic === "size") return SIZE_LABEL[question.answer];
    if (question.answer === "none") return "공격 없음";
    return DAMAGE_TYPES[question.answer].ko;
  }

  function explain(question) {
    const unit = unitByKey(question.unitKey);

    if (question.knowledgeTopic === "size") {
      return `${unit.ko}은 ${SIZE_LABEL[unit.size]} 유닛입니다.`;
    }

    if (question.answer === "none") {
      return `${unit.ko}은 기본 무기 공격이 없는 유닛입니다.`;
    }

    const targetText = question.attackTarget === "air" ? "대공 공격" : "지상 공격";
    return `${unit.ko}의 ${targetText}은 ${DAMAGE_TYPES[question.answer].ko}입니다.`;
  }

  window.SCKnowledge = {
    RACE_LABEL,
    makeQuestion,
    promptFor,
    badgesFor,
    optionsFor,
    answerLabel,
    explain
  };
})();
