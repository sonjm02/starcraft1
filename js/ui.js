(() => {
  const { DAMAGE_TYPES, SIZE_LABEL, RACE_LABEL } = window.SC_DATA;

  const $ = selector => document.querySelector(selector);
  const percent = value => `${Math.round(value * 100)}%`;
  const typeBadge = type => `<span class="badge badge-${type}">${DAMAGE_TYPES[type].ko}</span>`;
  const raceBadge = race => `<span class="badge badge-${race}">${RACE_LABEL[race]}</span>`;
  const sizeBadge = size => `<span class="badge badge-size">${SIZE_LABEL[size]}</span>`;

  window.SC_UI = { $, percent, typeBadge, raceBadge, sizeBadge };
})();
