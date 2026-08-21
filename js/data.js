(() => {
  const DAMAGE_TYPES = {
    normal: { ko: "일반형", small: 1, medium: 1, large: 1 },
    concussive: { ko: "진동형", small: 1, medium: 0.5, large: 0.25 },
    explosive: { ko: "폭발형", small: 0.5, medium: 0.75, large: 1 }
  };

  const SIZE_LABEL = { small: "소형", medium: "중형", large: "대형" };
  const RACE_LABEL = { terran: "테란", zerg: "저그", protoss: "프로토스" };

  const AIR_UNIT_KEYS = new Set([
    "wraith", "dropship", "sciencevessel", "valkyrie", "battlecruiser",
    "mutalisk", "scourge", "queen", "overlord", "guardian", "devourer",
    "observer", "shuttle", "scout", "corsair", "arbiter", "carrier"
  ]);

  const UNITS = [
    { race: "terran", key: "scv", ko: "SCV", en: "SCV", size: "small", ground: "normal" },
    { race: "terran", key: "marine", ko: "마린", en: "Marine", size: "small", ground: "normal", air: "normal" },
    { race: "terran", key: "firebat", ko: "파이어뱃", en: "Firebat", size: "small", ground: "concussive" },
    { race: "terran", key: "ghost", ko: "고스트", en: "Ghost", size: "small", ground: "concussive", air: "concussive" },
    { race: "terran", key: "medic", ko: "메딕", en: "Medic", size: "small" },
    { race: "terran", key: "vulture", ko: "벌처", en: "Vulture", size: "medium", ground: "concussive" },
    { race: "terran", key: "spidermine", ko: "스파이더 마인", en: "Spider Mine", size: "small", ground: "explosive" },
    { race: "terran", key: "siegetank", ko: "시즈 탱크", en: "Siege Tank", size: "large", ground: "explosive" },
    { race: "terran", key: "goliath", ko: "골리앗", en: "Goliath", size: "large", ground: "normal", air: "explosive" },
    { race: "terran", key: "wraith", ko: "레이스", en: "Wraith", size: "large", ground: "normal", air: "explosive" },
    { race: "terran", key: "dropship", ko: "드랍십", en: "Dropship", size: "large" },
    { race: "terran", key: "sciencevessel", ko: "사이언스 베슬", en: "Science Vessel", size: "large" },
    { race: "terran", key: "valkyrie", ko: "발키리", en: "Valkyrie", size: "large", air: "explosive" },
    { race: "terran", key: "battlecruiser", ko: "배틀크루저", en: "Battlecruiser", size: "large", ground: "normal", air: "normal" },

    { race: "zerg", key: "drone", ko: "드론", en: "Drone", size: "small", ground: "normal" },
    { race: "zerg", key: "zergling", ko: "저글링", en: "Zergling", size: "small", ground: "normal" },
    { race: "zerg", key: "hydralisk", ko: "히드라리스크", en: "Hydralisk", size: "medium", ground: "explosive", air: "explosive" },
    { race: "zerg", key: "lurker", ko: "러커", en: "Lurker", size: "medium", ground: "normal" },
    { race: "zerg", key: "mutalisk", ko: "뮤탈리스크", en: "Mutalisk", size: "small", ground: "normal", air: "normal" },
    { race: "zerg", key: "scourge", ko: "스커지", en: "Scourge", size: "small", air: "normal" },
    { race: "zerg", key: "queen", ko: "퀸", en: "Queen", size: "medium" },
    { race: "zerg", key: "defiler", ko: "디파일러", en: "Defiler", size: "medium" },
    { race: "zerg", key: "overlord", ko: "오버로드", en: "Overlord", size: "large" },
    { race: "zerg", key: "ultralisk", ko: "울트라리스크", en: "Ultralisk", size: "large", ground: "normal" },
    { race: "zerg", key: "guardian", ko: "가디언", en: "Guardian", size: "large", ground: "normal" },
    { race: "zerg", key: "devourer", ko: "디바우러", en: "Devourer", size: "large", air: "explosive" },
    { race: "zerg", key: "infestedterran", ko: "인페스티드 테란", en: "Infested Terran", size: "small", ground: "explosive" },

    { race: "protoss", key: "probe", ko: "프로브", en: "Probe", size: "small", ground: "normal", shield: true },
    { race: "protoss", key: "zealot", ko: "질럿", en: "Zealot", size: "small", ground: "normal", shield: true },
    { race: "protoss", key: "dragoon", ko: "드라군", en: "Dragoon", size: "large", ground: "explosive", air: "explosive", shield: true },
    { race: "protoss", key: "hightemplar", ko: "하이 템플러", en: "High Templar", size: "small", shield: true },
    { race: "protoss", key: "darktemplar", ko: "다크 템플러", en: "Dark Templar", size: "small", ground: "normal", shield: true },
    { race: "protoss", key: "archon", ko: "아콘", en: "Archon", size: "large", ground: "normal", air: "normal", shield: true },
    { race: "protoss", key: "darkarchon", ko: "다크 아콘", en: "Dark Archon", size: "large", shield: true },
    { race: "protoss", key: "reaver", ko: "리버", en: "Reaver", size: "large", ground: "normal", shield: true },
    { race: "protoss", key: "observer", ko: "옵저버", en: "Observer", size: "small", shield: true },
    { race: "protoss", key: "shuttle", ko: "셔틀", en: "Shuttle", size: "large", shield: true },
    { race: "protoss", key: "scout", ko: "스카웃", en: "Scout", size: "large", ground: "normal", air: "explosive", shield: true },
    { race: "protoss", key: "corsair", ko: "커세어", en: "Corsair", size: "medium", air: "explosive", shield: true },
    { race: "protoss", key: "arbiter", ko: "아비터", en: "Arbiter", size: "large", ground: "explosive", air: "explosive", shield: true },
    { race: "protoss", key: "carrier", ko: "캐리어", en: "Carrier", size: "large", ground: "normal", air: "normal", shield: true }
  ];

  const QUIZ_OPTIONS = [
    { value: 0.25, label: "25%", desc: "x0.25" },
    { value: 0.5, label: "50%", desc: "x0.5" },
    { value: 0.75, label: "75%", desc: "x0.75" },
    { value: 1, label: "100%", desc: "x1" }
  ];

  window.SC_DATA = {
    DAMAGE_TYPES,
    SIZE_LABEL,
    RACE_LABEL,
    AIR_UNIT_KEYS,
    UNITS,
    ATTACKERS: UNITS.filter(unit => unit.ground || unit.air),
    QUIZ_OPTIONS
  };
})();
