(() => {
  const { UNITS } = window.SC_DATA;
  const { $, typeBadge, raceBadge, sizeBadge } = window.SC_UI;

  let raceFilter = "all";

  function renderUnits() {
    const query = $("#unitSearch").value.trim().toLowerCase();
    const filtered = UNITS.filter(unit => {
      const raceOk = raceFilter === "all" || unit.race === raceFilter;
      const text = `${unit.ko} ${unit.en}`.toLowerCase();
      return raceOk && (!query || text.includes(query));
    });

    const grid = $("#unitGrid");
    grid.innerHTML = filtered.map(unit => `
      <article class="unit-card">
        <div class="unit-top">
          <div>
            <div class="unit-name">${unit.ko}</div>
            <div class="unit-en">${unit.en}</div>
          </div>
          ${raceBadge(unit.race)}
        </div>
        <div class="unit-meta">
          ${sizeBadge(unit.size)}
          ${unit.shield ? '<span class="badge badge-protoss">실드 보유</span>' : ''}
        </div>
        <div class="attack-line">
          <span>지상 공격</span>
          <span>${unit.ground ? typeBadge(unit.ground) : "없음"}</span>
        </div>
        <div class="attack-line">
          <span>공중 공격</span>
          <span>${unit.air ? typeBadge(unit.air) : "없음"}</span>
        </div>
      </article>
    `).join("");

    if (!filtered.length) {
      grid.innerHTML = '<div class="feedback">조건에 맞는 유닛이 없습니다.</div>';
    }
  }

  function init() {
    document.querySelectorAll(".race-filter").forEach(button => {
      button.addEventListener("click", () => {
        raceFilter = button.dataset.race;
        document.querySelectorAll(".race-filter").forEach(item => {
          item.classList.toggle("active", item === button);
        });
        renderUnits();
      });
    });

    $("#unitSearch").addEventListener("input", renderUnits);
    renderUnits();
  }

  window.SCCatalog = { init };
})();
