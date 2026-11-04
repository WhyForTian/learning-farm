/* =========================================================
   学习农场 · Learning Farm
   Data, rendering and small farming rituals
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "learning-farm:v2";
  const LEGACY_STORAGE_KEY = "learning-farm:v1";
  const LOG_PAGE_SIZE = 5;
  const MONTHS_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const MONTHS_CN = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

  const SPRITE_STYLES = {
    vine: { label: "藤蔓", accent: "#5c943b", wash: "#e8f2d7" },
    flower: { label: "花朵", accent: "#c97c95", wash: "#f8e8ed" },
    mushroom: { label: "蘑菇", accent: "#d38a45", wash: "#f8ead8" },
    wheat: { label: "麦穗", accent: "#b99431", wash: "#f6efd6" },
    tree: { label: "小树", accent: "#6a9b4a", wash: "#e9f2dc" },
    clover: { label: "四叶草", accent: "#748bba", wash: "#e8edf7" }
  };

  const ACHIEVEMENTS = [
    {
      id: "first-seed",
      title: "初次播种",
      tone: "badge-green",
      icon: "sprout",
      test: (ctx) => ctx.stats.harvests >= 1,
      note: (ctx) => (ctx.stats.harvests > 0 ? `已留下 ${ctx.stats.harvests} 条记录` : "等待第一条学习记录")
    },
    {
      id: "seven-days",
      title: "七日不断更",
      tone: "badge-orange",
      icon: "fire",
      test: (ctx) => ctx.stats.longestStreak >= 7,
      note: (ctx) => `最长连续 ${ctx.stats.longestStreak} 天 / 7 天`
    },
    {
      id: "hundred-hours",
      title: "百小时农夫",
      tone: "badge-blue",
      icon: "clock",
      test: (ctx) => ctx.stats.hours >= 100,
      note: (ctx) => `${formatHours(ctx.stats.hours)} / 100 小时`
    },
    {
      id: "breakthrough",
      title: "一次突破",
      tone: "badge-pink",
      icon: "flag",
      test: (ctx) => ctx.breakthroughs >= 1,
      note: (ctx) => (ctx.breakthroughs > 0 ? `记录下 ${ctx.breakthroughs} 次突破` : "记录一次「突破」状态")
    },
    {
      id: "mastered-crop",
      title: "满级作物",
      tone: "badge-gold",
      icon: "crown",
      test: (ctx) => ctx.maxProgress >= 100,
      note: (ctx) => `最高生长进度 ${ctx.maxProgress}% / 100%`
    },
    {
      id: "four-seasons",
      title: "四季全勤",
      tone: "badge-green",
      icon: "calendar",
      test: (ctx) => ctx.stats.longestStreak >= 120,
      note: (ctx) => `最长连续 ${ctx.stats.longestStreak} 天 / 120 天`
    }
  ];
  /* Pixel sprites: one character = one pixel. */
  const SPRITE_PALETTES = {
    ".": null,
    g: "#4d8534",
    G: "#76b149",
    L: "#a2d269",
    d: "#345f26",
    p: "#e78fa5",
    P: "#ffc7d3",
    y: "#f4c64b",
    o: "#d48a33",
    r: "#c85c43",
    R: "#ea896b",
    b: "#76502f",
    B: "#a37142",
    w: "#fff1c9",
    k: "#3e2b1d",
    u: "#68aec7",
    U: "#b6e3eb",
    v: "#8f7dbb",
    V: "#c5b5df",
    s: "#a1b768",
    S: "#d2e29a"
  };

  const SPRITES = {
    vine: [
      "................",
      ".......gg.......",
      "......gGGg......",
      "......gLLg......",
      "..gg..gGGg..gg..",
      ".gGGg.gGGg.gGGg.",
      "..gGgggGGgggGg..",
      "...gGGGLLGGGg...",
      "....gGGGGGGg....",
      ".....gGGGGg.....",
      "......gGGg......",
      "..g...gGGg...g..",
      ".gGg..gGGg..gGg.",
      "..gGg.gGGg.gGg..",
      "...gGggGGggGg...",
      "....gg....gg...."
    ],
    flower: [
      "................",
      ".......y........",
      "......yYy.......",
      ".....yYPYy......",
      "....yYYPYYy.....",
      ".....yYPYy......",
      "......yYy.......",
      "..g....y....g...",
      ".gGg...g...gGg..",
      "..gGg..g..gGg...",
      "...gGg.g.gGg....",
      "....gGgggGg.....",
      ".....gGGGg......",
      "......gGg.......",
      "....g.g.g.g.....",
      ".....g...g......"
    ],
    mushroom: [
      "................",
      "................",
      "....rrrrrr......",
      "..rrRRRRRRrr....",
      ".rRRwRRRRwRRr...",
      ".rRRRRwwRRRRr...",
      ".rRwRRRRRRwRr...",
      ".rrRRRRRRRRrr...",
      "..rrrrrrrrrr....",
      ".....bBBb.......",
      ".....bBBb.......",
      ".....bBBb.......",
      "....g.bBBb.g....",
      "...gGgbBBbGg....",
      "....ggbBBbgg....",
      ".....bbbbbb....."
    ],
    wheat: [
      "................",
      "....y.....y.....",
      "...yYy...yYy....",
      "...yYy...yYy....",
      "....y.y..y......",
      "....y.yYy.y.....",
      "..g.yyYyyy.g....",
      "...gyYyYyYyg....",
      "....yYyYyYy.....",
      "....g.y.y.g.....",
      "..g...y.y...g...",
      "...g..y.y..g....",
      "....g.y.y.g.....",
      "......y.y.......",
      "......g.g.......",
      ".....bbbbb......"
    ],
    tree: [
      "....GGpGGG......",
      "...GGGGGGGpG....",
      "..GGgGGGGgGG....",
      ".GGGGGgGGGGGG...",
      ".GgGGGGGGGGgG...",
      "..GGGGggGGGG....",
      "...GGGGGGGG.....",
      ".....bBBb.......",
      ".....bBBb.......",
      "..g..bBBb..g....",
      ".gGg.bBBb.gGg...",
      "..gGgbBBbgGg....",
      "...g.bBBb.g.....",
      ".....bBBb.......",
      "....bbBBbb......",
      "...bbbbbbbb....."
    ],
    clover: [
      "................",
      "...u.......u....",
      "..uUu.....uUu...",
      "...u.......u....",
      "................",
      "..g...g.g...g...",
      ".gGg.gGGGg.gGg..",
      "..gGggGgGggGg...",
      "...gGGgGgGGg....",
      "....gGgGgGg.....",
      ".....gGGGg......",
      "......gGg.......",
      "......gGg.......",
      ".....g.g.g......",
      "....g...g.......",
      "................"
    ]
  };

  const els = {
    cropGrid: document.getElementById("crop-grid"),
    cropCount: document.getElementById("crop-count"),
    clearSkillFilter: document.getElementById("clear-skill-filter"),
    journalFilters: document.getElementById("journal-filters"),
    journalCount: document.getElementById("journal-count"),
    timeline: document.getElementById("timeline"),
    loadMore: document.getElementById("load-more"),
    dialog: document.getElementById("record-dialog"),
    form: document.getElementById("record-form"),
    titleInput: document.getElementById("record-title"),
    skillSelect: document.getElementById("record-skill"),
    hoursInput: document.getElementById("record-hours"),
    dateInput: document.getElementById("record-date"),
    noteInput: document.getElementById("record-note"),
    noteCount: document.getElementById("note-count"),
    titleError: document.getElementById("title-error"),
    skillDialog: document.getElementById("skill-dialog"),
    skillForm: document.getElementById("skill-form"),
    skillNameInput: document.getElementById("skill-name"),
    skillCropInput: document.getElementById("skill-crop"),
    skillDescriptionInput: document.getElementById("skill-description"),
    skillNameError: document.getElementById("skill-name-error"),
    spriteOptions: document.getElementById("sprite-options"),
    chartBars: document.getElementById("chart-bars"),
    chartTotal: document.getElementById("chart-total"),
    chartEmpty: document.getElementById("chart-empty"),
    bestDay: document.getElementById("best-day"),
    weekCount: document.getElementById("week-count"),
    badgeGrid: document.getElementById("badge-grid"),
    badgeCount: document.getElementById("badge-count"),
    barnNote: document.getElementById("barn-note-text"),
    todayLabel: document.getElementById("today-label"),
    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toast-message"),
    menuToggle: document.querySelector(".menu-toggle"),
    siteNav: document.getElementById("site-nav"),
    confettiLayer: document.getElementById("confetti-layer")
  };

  let state = loadState();
  let activeCropFilter = "all";
  let activeSkillFilter = "all";
  let visibleLogCount = LOG_PAGE_SIZE;
  let lastAddedId = null;
  let toastTimer = null;
  let pendingRecordAfterSkill = false;

  /* =========================================================
     Boot
     ========================================================= */

  function init() {
    setDateLabels();
    renderSpriteOptions();
    populateSkillSelect();
    bindEvents();
    renderAll();
    observeReveals();
    updateActiveNav();
  }

  function renderAll() {
    populateSkillSelect();
    renderStats();
    renderCrops();
    renderJournalFilters();
    renderJournal();
    renderChart();
    renderAchievements();
    const startLabel = document.getElementById("start-card-label");
    if (startLabel) {
      startLabel.textContent = state.skills.length > 0 ? "再开垦一块田" : "开垦第一块田";
    }
    observeReveals();
  }

  /* =========================================================
     State
     ========================================================= */

  function createEmptyState() {
    return {
      version: 2,
      createdAt: new Date().toISOString(),
      skills: [],
      records: []
    };
  }

  function removeLegacySample() {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      /* Storage may be unavailable; the page still works for the session. */
    }
  }

  function loadState() {
    removeLegacySample();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createEmptyState();

      const saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.records) || !Array.isArray(saved.skills)) {
        return createEmptyState();
      }

      const skills = saved.skills.map(normalizeSkill).filter(Boolean);
      const skillIds = new Set(skills.map((skill) => skill.id));
      const records = saved.records
        .map(normalizeRecord)
        .filter((record) => record && skillIds.has(record.skillId));

      return {
        version: 2,
        createdAt: saved.createdAt || new Date().toISOString(),
        skills,
        records
      };
    } catch (error) {
      return createEmptyState();
    }
  }

  function normalizeSkill(skill) {
    if (!skill || typeof skill.name !== "string" || !skill.name.trim()) return null;
    const sprite = SPRITES[skill.sprite] ? skill.sprite : "flower";
    const style = SPRITE_STYLES[sprite];
    return {
      id: String(skill.id || uid("field")),
      name: skill.name.trim().slice(0, 20),
      crop: String(skill.crop || "学习苗").trim().slice(0, 12) || "学习苗",
      latin: "LEARNING FIELD",
      description: String(skill.description || "一块正在慢慢长大的学习田。").trim().slice(0, 80),
      sprite,
      accent: skill.accent || style.accent,
      wash: skill.wash || style.wash,
      createdAt: skill.createdAt || new Date().toISOString()
    };
  }

  function normalizeRecord(record) {
    if (!record || !record.title || !record.date || !record.skillId) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(record.date))) return null;
    const hours = Number(record.hours);
    if (!Number.isFinite(hours) || hours <= 0) return null;
    const mood = ["专注", "突破", "复习"].includes(record.mood) ? record.mood : "专注";
    return {
      id: String(record.id || uid("rec")),
      date: String(record.date),
      skillId: String(record.skillId),
      title: String(record.title).trim().slice(0, 60),
      note: String(record.note || "").trim().slice(0, 180),
      hours: Math.min(hours, 24),
      mood,
      createdAt: record.createdAt || new Date().toISOString()
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      return false;
    }
  }

  /* =========================================================
     Helpers
     ========================================================= */

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatHours(value) {
    const number = Number(value) || 0;
    return Number.isInteger(number) ? String(number) : number.toFixed(1);
  }

  function roundHours(value) {
    return Math.round((Number(value) || 0) * 10) / 10;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function localDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function todayISO() {
    return localDateISO(new Date());
  }

  function parseISODate(value) {
    const parts = String(value).split("-").map(Number);
    return {
      year: parts[0],
      month: parts[1] || 1,
      day: parts[2] || 1
    };
  }

  function dateNumber(value) {
    const date = parseISODate(value);
    return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / 86400000);
  }

  function getISOWeek(date) {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNumber = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    return Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  }

  function seasonForDate(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return { phrase: "春日", short: "春", en: "SPRING" };
    if (month >= 5 && month <= 7) return { phrase: "夏日", short: "夏", en: "SUMMER" };
    if (month >= 8 && month <= 10) return { phrase: "秋日", short: "秋", en: "AUTUMN" };
    return { phrase: "冬日", short: "冬", en: "WINTER" };
  }

  function currentWeekDates() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const offset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }

  function getSkill(skillId) {
    return state.skills.find((skill) => skill.id === skillId) || {
      id: "other",
      name: "其他",
      crop: "野花",
      accent: "#7d8d65",
      wash: "#eef0e3"
    };
  }

  function sortedRecords() {
    return [...state.records].sort((a, b) => {
      const dateCompare = String(b.date).localeCompare(String(a.date));
      if (dateCompare !== 0) return dateCompare;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
  }

  function getFilteredRecords() {
    const records = sortedRecords();
    if (activeSkillFilter === "all") return records;
    return records.filter((record) => record.skillId === activeSkillFilter);
  }

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function setTextById(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  /* =========================================================
     Date labels
     ========================================================= */

  function setDateLabels() {
    const now = new Date();
    const season = seasonForDate(now);
    const week = getISOWeek(now);

    if (els.todayLabel) {
      els.todayLabel.textContent = `${MONTHS_CN[now.getMonth()]}${now.getDate()}日`;
    }

    setTextById("season-label", season.phrase);
    setTextById("week-label", String(week));
    setTextById("scene-season", season.short);
    setTextById("scene-season-en", season.en);
    setTextById("scene-week", String(week));
    setTextById("harvest-week", String(week));

    const stampSeason = document.querySelector(".almanac-stamp span");
    if (stampSeason) stampSeason.textContent = season.phrase;

    if (els.dateInput) {
      els.dateInput.max = todayISO();
      if (!els.dateInput.value) els.dateInput.value = todayISO();
    }
  }

  /* =========================================================
     Skills / crops
     ========================================================= */

  function spriteSVG(name) {
    const rows = SPRITES[name] || SPRITES.flower;
    let rects = "";
    rows.forEach((row, y) => {
      [...row].forEach((char, x) => {
        const color = SPRITE_PALETTES[char];
        if (color) {
          rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
        }
      });
    });
    return `<svg class="crop-sprite" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
  }

  function hydrateSkills() {
    const latestBySkill = new Map();
    sortedRecords().forEach((record) => {
      if (!latestBySkill.has(record.skillId)) latestBySkill.set(record.skillId, record);
    });

    return state.skills.map((skill) => {
      const skillRecords = state.records.filter((record) => record.skillId === skill.id);
      const hours = roundHours(skillRecords.reduce((total, record) => total + Number(record.hours || 0), 0));
      const progress = clamp(Math.round(hours * 2.5), 0, 100);
      const level = progress > 0 ? Math.min(10, Math.max(1, Math.ceil(progress / 10))) : 0;
      const status = progress >= 100 ? "mastered" : progress > 0 ? "growing" : "empty";
      return {
        ...skill,
        hours,
        harvests: skillRecords.length,
        progress,
        level,
        status,
        latest: latestBySkill.get(skill.id) || null
      };
    });
  }

  function renderCrops() {
    if (!els.cropGrid) return;

    const skills = hydrateSkills();
    if (els.cropCount) els.cropCount.textContent = String(skills.length);

    if (skills.length === 0) {
      els.cropGrid.innerHTML = `
        <div class="crop-empty-state reveal">
          <div class="empty-field-icon" aria-hidden="true">
            <svg class="icon"><use href="#i-sprout"/></svg>
          </div>
          <p class="eyebrow">EMPTY FIELD · 尚未开垦</p>
          <h3>你的第一块田，想种点什么？</h3>
          <p>从真正想学的方向开始。这里的每一块田、每一条记录，都由你亲手种下。</p>
          <button class="btn btn-primary" type="button" data-open-skill>
            <svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>
            开垦第一块田
          </button>
          <small>没有示例技能，也没有替你编好的进度。</small>
        </div>
      `;
      setCropFilterDisabled(true);
      observeReveals();
      return;
    }

    setCropFilterDisabled(false);
    const cards = skills
      .map((skill, index) => {
        const latest = skill.latest;
        const statusText = skill.status === "mastered" ? "已丰收" : skill.status === "growing" ? "生长中" : "待播种";
        const levelText = skill.level > 0 ? `LV.${skill.level}` : "NEW";
        return `
          <article
            class="crop-card reveal${activeSkillFilter === skill.id ? " is-selected" : ""}"
            style="--accent:${skill.accent};--wash:${skill.wash};--delay:${(index * 0.045).toFixed(2)}s"
            data-skill="${escapeHTML(skill.id)}"
            data-status="${skill.status}"
            tabindex="0"
            role="button"
            aria-pressed="${activeSkillFilter === skill.id ? "true" : "false"}"
            aria-label="查看${escapeHTML(skill.name)}的收获记录"
          >
            <div class="crop-top">
              <span class="crop-level">${levelText}</span>
              <span class="crop-status">${statusText}</span>
            </div>
            <div class="crop-main">
              <div class="crop-sprite-wrap">${spriteSVG(skill.sprite)}</div>
              <div>
                <p class="crop-type">LEARNING FIELD / ${escapeHTML(skill.name)}</p>
                <h3>${escapeHTML(skill.crop)}</h3>
                <p class="crop-desc">${escapeHTML(skill.description)}</p>
              </div>
            </div>
            <div class="crop-latest${latest ? "" : " is-empty"}">
              <span class="crop-latest-label">最近收获</span>
              <p${latest ? ` title="${escapeHTML(latest.title)}"` : ""}>${latest ? escapeHTML(latest.title) : "等待第一笔收获"}</p>
            </div>
            <div class="growth">
              <div class="growth-label">
                <span>生长进度</span>
                <strong>${skill.progress}%</strong>
              </div>
              <div class="progress-track" role="progressbar" aria-label="${escapeHTML(skill.crop)}生长进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${skill.progress}">
                <span class="progress-fill" style="--progress:${skill.progress}%;width:${skill.progress}%"></span>
              </div>
            </div>
            <div class="crop-meta">
              <span><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg>${formatHours(skill.hours)} h</span>
              <span><svg class="icon" aria-hidden="true"><use href="#i-basket"/></svg>${skill.harvests} 次收获</span>
              <span class="crop-link">看记录 <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></span>
            </div>
          </article>
        `;
      })
      .join("");

    const addCard = `
      <button class="add-crop-card reveal" type="button" data-open-skill style="--delay:${(skills.length * 0.045).toFixed(2)}s">
        <span class="add-crop-icon" aria-hidden="true"><svg class="icon"><use href="#i-plus"/></svg></span>
        <strong>开垦一块新田</strong>
        <span>再种一个真正想学的方向</span>
      </button>
    `;

    els.cropGrid.innerHTML = cards + addCard;
    applyCropFilter();
    observeReveals();
  }

  function setCropFilterDisabled(disabled) {
    document.querySelectorAll("[data-crop-filter]").forEach((button) => {
      button.disabled = disabled;
    });
  }

  function applyCropFilter() {
    if (!els.cropGrid || state.skills.length === 0) return;
    const cards = [...els.cropGrid.querySelectorAll(".crop-card")];
    let visible = 0;

    cards.forEach((card) => {
      const status = card.dataset.status;
      const show =
        activeCropFilter === "all" ||
        (activeCropFilter === "growing" && status === "growing") ||
        (activeCropFilter === "mastered" && status === "mastered");
      card.classList.toggle("is-hidden", !show);
      if (show) visible += 1;
    });

    const addCard = els.cropGrid.querySelector(".add-crop-card");
    if (addCard) addCard.classList.toggle("is-hidden", activeCropFilter !== "all");

    let emptyNode = els.cropGrid.querySelector(".crop-filter-empty");
    if (visible === 0) {
      if (!emptyNode) {
        emptyNode = document.createElement("div");
        emptyNode.className = "crop-filter-empty";
        emptyNode.innerHTML = "这个筛选下还没有作物。<br><span>换一个筛选，或者开垦一块新的田。</span>";
        els.cropGrid.appendChild(emptyNode);
      }
      emptyNode.hidden = false;
    } else if (emptyNode) {
      emptyNode.remove();
    }
  }

  function resetCropFilterButtons() {
    document.querySelectorAll("[data-crop-filter]").forEach((button) => {
      const isAll = button.dataset.cropFilter === "all";
      button.classList.toggle("is-active", isAll);
      button.setAttribute("aria-pressed", String(isAll));
    });
    applyCropFilter();
  }

  function selectSkill(skillId) {
    const skill = getSkill(skillId);
    if (!skill) return;

    if (activeSkillFilter === skillId) {
      clearSkillFilter();
      return;
    }

    activeSkillFilter = skillId;
    visibleLogCount = 99;
    document.querySelectorAll(".crop-card").forEach((card) => {
      const selected = card.dataset.skill === skillId;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    els.clearSkillFilter?.classList.remove("is-hidden");
    renderJournalFilters();
    renderJournal();

    const journal = document.getElementById("journal");
    if (journal) {
      journal.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start"
      });
    }
    showToast(`正在查看「${skill.name}」这块田的收获`);
  }

  function clearSkillFilter() {
    activeSkillFilter = "all";
    visibleLogCount = LOG_PAGE_SIZE;
    document.querySelectorAll(".crop-card").forEach((card) => {
      card.classList.remove("is-selected");
      card.setAttribute("aria-pressed", "false");
    });
    els.clearSkillFilter?.classList.add("is-hidden");
    renderJournalFilters();
    renderJournal();
  }

  /* =========================================================
     Stats
     ========================================================= */

  function computeStreaks(records) {
    const days = [...new Set(records.map((record) => dateNumber(record.date)))].sort((a, b) => a - b);
    if (days.length === 0) return { current: 0, longest: 0 };

    let longest = 1;
    let run = 1;
    for (let index = 1; index < days.length; index += 1) {
      if (days[index] - days[index - 1] === 1) {
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 1;
      }
    }

    const today = dateNumber(todayISO());
    const latest = days[days.length - 1];
    let current = 0;
    if (latest === today || latest === today - 1) {
      current = 1;
      for (let index = days.length - 1; index > 0; index -= 1) {
        if (days[index] - days[index - 1] === 1) current += 1;
        else break;
      }
    }

    return { current, longest };
  }

  function computeStats() {
    const records = state.records;
    const hours = roundHours(records.reduce((total, record) => total + Number(record.hours || 0), 0));
    const harvests = records.length;
    const level = 1 + Math.floor(harvests / 8);
    const nextLevelAt = level * 8;
    const streaks = computeStreaks(records);
    const today = dateNumber(todayISO());
    const cutoff = today - 29;
    const monthHarvests = records.filter((record) => {
      const day = dateNumber(record.date);
      return day >= cutoff && day <= today;
    }).length;

    return {
      hours,
      harvests,
      level,
      nextLevelAt,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      monthHarvests
    };
  }

  function renderStats() {
    const stats = computeStats();
    setText('[data-stat="streak"]', String(stats.currentStreak));
    setText('[data-stat="hours"]', formatHours(stats.hours));
    setText('[data-stat="harvests"]', String(stats.harvests));
    setText('[data-stat="level"]', String(stats.level));
    setText('[data-stat="scene-level"]', String(stats.level));
    setText('[data-stat="hero-records"]', String(stats.harvests).padStart(3, "0"));

    const streakNote = document.querySelector('[data-stat-note="streak"]');
    if (streakNote) {
      streakNote.textContent = stats.longestStreak > 0
        ? `最长记录 ${stats.longestStreak} 天`
        : "从第一颗种子开始";
    }

    const monthNote = document.querySelector('[data-stat-note="month"]');
    if (monthNote) {
      monthNote.textContent = `近 30 天收获 ${stats.monthHarvests} 项`;
    }

    const levelNote = document.querySelector('[data-stat-note="level"]');
    if (levelNote) {
      const remaining = Math.max(0, stats.nextLevelAt - stats.harvests);
      levelNote.textContent = stats.harvests === 0
        ? "再收获 8 项，升到 Lv.2"
        : remaining > 0
          ? `距离 Lv.${stats.level + 1} 还差 ${remaining} 项收获`
          : "新的等级已经点亮";
    }
  }

  /* =========================================================
     Chart
     ========================================================= */

  function renderChart() {
    if (!els.chartBars || !els.chartTotal) return;
    const weekDates = currentWeekDates();
    const weekKeys = weekDates.map(localDateISO);
    const dailyHours = weekKeys.map((key) =>
      roundHours(state.records
        .filter((record) => record.date === key)
        .reduce((total, record) => total + Number(record.hours || 0), 0))
    );
    const weekRecords = state.records.filter((record) => weekKeys.includes(record.date));
    const total = roundHours(dailyHours.reduce((sum, hours) => sum + hours, 0));
    const maxDaily = Math.max(5, ...dailyHours);
    const bestValue = Math.max(...dailyHours);
    const bestIndex = bestValue > 0 ? dailyHours.indexOf(bestValue) : -1;

    els.chartBars.innerHTML = dailyHours
      .map((hours, index) => {
        const percent = hours > 0 ? Math.max(8, Math.round((hours / maxDaily) * 100)) : 0;
        const isBest = bestIndex === index;
        const trackStyle = hours > 0 ? `--value:${percent}` : "height:0;min-height:0";
        return `
          <div class="chart-col${isBest ? " is-best" : ""}">
            <span class="bar-value">${hours > 0 ? formatHours(hours) : "—"}</span>
            <div class="bar-track" style="${trackStyle}"><span class="bar"></span></div>
            <span class="bar-label">${WEEKDAYS[index]}</span>
          </div>
        `;
      })
      .join("");

    els.chartTotal.innerHTML = `${formatHours(total)}<span>h</span>`;
    if (els.chartEmpty) els.chartEmpty.hidden = total > 0;
    document.querySelector(".chart")?.classList.toggle("is-empty", total === 0);

    if (els.bestDay) {
      els.bestDay.textContent = bestIndex >= 0
        ? `周${WEEKDAYS[bestIndex]} · ${formatHours(dailyHours[bestIndex])} 小时`
        : "暂无记录";
    }
    if (els.weekCount) {
      els.weekCount.textContent = `${weekRecords.length} 条收获`;
    }
  }

  /* =========================================================
     Achievements
     ========================================================= */

  function renderAchievements() {
    if (!els.badgeGrid) return;
    const stats = computeStats();
    const skills = hydrateSkills();
    const ctx = {
      stats,
      skills,
      breakthroughs: state.records.filter((record) => record.mood === "突破").length,
      maxProgress: skills.reduce((max, skill) => Math.max(max, skill.progress), 0)
    };

    let unlockedCount = 0;
    els.badgeGrid.innerHTML = ACHIEVEMENTS.map((badge) => {
      const unlocked = badge.test(ctx);
      if (unlocked) unlockedCount += 1;
      const medalClass = unlocked ? badge.tone : "badge-locked";
      const icon = unlocked ? badge.icon : "lock";
      return `
        <div class="badge-item${unlocked ? "" : " is-locked"}">
          <span class="badge-medal ${medalClass}">
            <svg class="icon" aria-hidden="true"><use href="#i-${icon}"/></svg>
          </span>
          <span class="badge-copy"><strong>${escapeHTML(badge.title)}</strong><small>${escapeHTML(badge.note(ctx))}</small></span>
        </div>
      `;
    }).join("");

    if (els.badgeCount) els.badgeCount.textContent = String(unlockedCount);

    if (els.barnNote) {
      if (stats.harvests === 0) {
        els.barnNote.textContent = "完成第一次收获，就能点亮第一枚勋章。";
      } else {
        const remaining = Math.max(0, stats.nextLevelAt - stats.harvests);
        els.barnNote.textContent = remaining > 0
          ? `再收获 ${remaining} 项，农场就能升到 Lv.${stats.level + 1}。`
          : "农场正在生长，继续记录吧。";
      }
    }
  }

  /* =========================================================
     Journal
     ========================================================= */

  function renderJournalFilters() {
    if (!els.journalFilters) return;
    const filters = [
      { id: "all", label: "全部" },
      ...state.skills.map((skill) => ({ id: skill.id, label: skill.name }))
    ];

    els.journalFilters.innerHTML = filters
      .map(
        (filter) => `
        <button class="filter-chip${activeSkillFilter === filter.id ? " is-active" : ""}" type="button" data-filter="${escapeHTML(filter.id)}" aria-pressed="${activeSkillFilter === filter.id ? "true" : "false"}">
          ${escapeHTML(filter.label)}
        </button>
      `
      )
      .join("");
  }

  function renderJournal() {
    if (!els.timeline) return;
    const filtered = getFilteredRecords();
    const visible = filtered.slice(0, visibleLogCount);

    if (filtered.length === 0) {
      const noSkills = state.skills.length === 0;
      const isEmptyFarm = state.records.length === 0;
      const emptyTitle = noSkills
        ? "农场还是一张白纸"
        : isEmptyFarm
          ? "这块田还在等第一颗种子"
          : "这块田还没有收获";
      const emptyCopy = noSkills
        ? "先开垦一块学习田，再记录第一笔真正属于你的收获。"
        : activeSkillFilter === "all"
          ? "记录一次今天的学习，让这片土地开始生长。"
          : "这个方向还没有记录，记下第一笔就会出现在这里。";
      const action = noSkills
        ? `<button class="btn btn-secondary" type="button" data-open-skill>
             <svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>
             开垦第一块田
           </button>`
        : `<button class="btn btn-secondary" type="button" data-open-record>
             <svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>
             记录第一笔收获
           </button>`;

      els.timeline.innerHTML = `
        <div class="timeline-empty">
          <div class="empty-sprout"><svg class="icon" aria-hidden="true"><use href="#i-sprout"/></svg></div>
          <h3>${emptyTitle}</h3>
          <p>${emptyCopy}</p>
          ${action}
        </div>
      `;
    } else {
      els.timeline.innerHTML = visible.map((record) => renderLogItem(record)).join("");
    }

    if (els.journalCount) {
      if (activeSkillFilter === "all") {
        els.journalCount.textContent = `共 ${filtered.length} 条记录`;
      } else {
        els.journalCount.textContent = `「${getSkill(activeSkillFilter).name}」· ${filtered.length} 条`;
      }
    }

    if (els.loadMore) {
      const remaining = filtered.length - visible.length;
      els.loadMore.hidden = remaining <= 0;
      if (remaining > 0) {
        els.loadMore.innerHTML = `
          <span>展开全部记录（还剩 ${remaining} 条）</span>
          <svg class="icon" aria-hidden="true"><use href="#i-chevron"/></svg>
        `;
      }
    }

    observeReveals();
  }

  function renderLogItem(record) {
    const skill = getSkill(record.skillId);
    const date = parseISODate(record.date);
    const monthName = MONTHS_EN[(date.month || 1) - 1] || "???";
    const dateLabel = `${date.year}.${String(date.month).padStart(2, "0")}.${String(date.day).padStart(2, "0")}`;
    const note = record.note ? `<p class="log-note">${escapeHTML(record.note)}</p>` : "";
    const isNew = record.id === lastAddedId ? " is-new" : "";

    return `
      <div class="log-item reveal${isNew}" style="--accent:${skill.accent};--wash:${skill.wash}">
        <div class="log-date" aria-hidden="true">
          <strong>${String(date.day).padStart(2, "0")}</strong>
          <span>${monthName}</span>
        </div>
        <div class="log-marker" aria-hidden="true"><span class="log-dot"></span></div>
        <article class="log-card">
          <div class="log-top">
            <span class="log-tag">${escapeHTML(skill.name)}</span>
            <time class="log-date-label" datetime="${escapeHTML(record.date)}">${dateLabel}</time>
          </div>
          <h3>${escapeHTML(record.title)}</h3>
          ${note}
          <div class="log-meta">
            <span><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg>${formatHours(record.hours)} 小时</span>
            <span><svg class="icon" aria-hidden="true"><use href="#i-sprout"/></svg>${escapeHTML(skill.crop)}</span>
            <span class="log-mood">${escapeHTML(record.mood || "专注")}</span>
          </div>
        </article>
      </div>
    `;
  }

  function handleJournalFilter(filterId) {
    activeSkillFilter = filterId;
    visibleLogCount = filterId === "all" ? LOG_PAGE_SIZE : 99;
    document.querySelectorAll(".crop-card").forEach((card) => {
      const selected = filterId !== "all" && card.dataset.skill === filterId;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    if (filterId === "all") {
      els.clearSkillFilter?.classList.add("is-hidden");
    } else {
      els.clearSkillFilter?.classList.remove("is-hidden");
    }
    renderJournalFilters();
    renderJournal();
  }

  /* =========================================================
     Add record
     ========================================================= */

  function populateSkillSelect() {
    if (!els.skillSelect) return;
    els.skillSelect.disabled = state.skills.length === 0;
    els.skillSelect.innerHTML = state.skills
      .map((skill) => `<option value="${escapeHTML(skill.id)}">${escapeHTML(skill.crop)} · ${escapeHTML(skill.name)}</option>`)
      .join("");
  }

  function openDialog() {
    if (state.skills.length === 0) {
      pendingRecordAfterSkill = true;
      showToast("先开垦一块学习田，才能记录收获");
      openSkillDialog();
      return;
    }

    if (!els.dialog || els.dialog.open) return;
    clearTitleError();
    populateSkillSelect();
    if (activeSkillFilter !== "all" && state.skills.some((skill) => skill.id === activeSkillFilter)) {
      els.skillSelect.value = activeSkillFilter;
    }
    if (els.dateInput && !els.dateInput.value) els.dateInput.value = todayISO();
    els.dialog.showModal();
    syncDialogBodyClass();
    window.setTimeout(() => els.titleInput?.focus(), 90);
  }

  function closeDialog() {
    if (!els.dialog || !els.dialog.open) return;
    els.dialog.close();
    syncDialogBodyClass();
  }

  function clearTitleError() {
    els.titleInput?.closest(".form-field")?.classList.remove("has-error");
    if (els.titleError) els.titleError.textContent = "";
  }

  function validateForm() {
    clearTitleError();
    const title = els.titleInput?.value.trim() || "";
    const hours = Number(els.hoursInput?.value);
    const skillId = els.skillSelect?.value || "";

    if (!title) {
      els.titleInput?.closest(".form-field")?.classList.add("has-error");
      if (els.titleError) els.titleError.textContent = "先给这次收获取个名字吧。";
      els.titleInput?.focus();
      return null;
    }

    if (!state.skills.some((skill) => skill.id === skillId)) {
      showToast("请选择一块已经开垦好的学习田");
      return null;
    }

    if (!Number.isFinite(hours) || hours < 0.5 || hours > 24) {
      if (els.hoursInput) {
        els.hoursInput.setCustomValidity("学习时长需要在 0.5 到 24 小时之间。");
        els.hoursInput.reportValidity();
        window.setTimeout(() => els.hoursInput?.setCustomValidity(""), 350);
      }
      return null;
    }

    const date = els.dateInput?.value || todayISO();
    if (dateNumber(date) > dateNumber(todayISO())) {
      if (els.dateInput) {
        els.dateInput.setCustomValidity("收获日期不能晚于今天。");
        els.dateInput.reportValidity();
        window.setTimeout(() => els.dateInput?.setCustomValidity(""), 350);
      }
      return null;
    }

    return {
      title,
      hours,
      skillId,
      date,
      note: els.noteInput?.value.trim() || "",
      mood: document.querySelector('input[name="mood"]:checked')?.value || "专注"
    };
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const values = validateForm();
    if (!values) return;

    const now = new Date();
    const record = {
      id: uid("rec"),
      date: values.date,
      skillId: values.skillId,
      title: values.title,
      note: values.note,
      hours: values.hours,
      mood: values.mood,
      createdAt: now.toISOString()
    };

    state.records.unshift(record);
    const saved = saveState();
    activeSkillFilter = "all";
    activeCropFilter = "all";
    visibleLogCount = LOG_PAGE_SIZE;
    lastAddedId = record.id;
    resetCropFilterButtons();

    renderAll();
    updateActiveNav();
    els.form?.reset();
    if (els.dateInput) {
      els.dateInput.value = todayISO();
      els.dateInput.setCustomValidity("");
    }
    if (els.noteCount) els.noteCount.textContent = "0";
    closeDialog();
    showToast(
      saved
        ? `「${record.title}」已收进谷仓 · +${formatHours(values.hours)}h`
        : "已记录在当前页面，但浏览器未允许本地保存，请先导出备份"
    );
    burstConfetti();

    window.setTimeout(() => {
      if (lastAddedId === record.id) {
        lastAddedId = null;
        document.querySelector(".log-item.is-new")?.classList.remove("is-new");
      }
    }, 1600);
  }

  /* =========================================================
     Skill dialog
     ========================================================= */

  function renderSpriteOptions() {
    if (!els.spriteOptions) return;
    els.spriteOptions.innerHTML = Object.entries(SPRITE_STYLES)
      .map(([id, style], index) => `
        <label class="sprite-choice">
          <input type="radio" name="sprite" value="${id}"${index === 0 ? " checked" : ""}>
          <span class="sprite-choice-inner">
            ${spriteSVG(id)}
            <strong>${escapeHTML(style.label)}</strong>
          </span>
        </label>
      `)
      .join("");
  }

  function openSkillDialog() {
    if (!els.skillDialog || els.skillDialog.open) return;
    if (els.dialog?.open) closeDialog();
    clearSkillError();
    els.skillDialog.showModal();
    syncDialogBodyClass();
    window.setTimeout(() => els.skillNameInput?.focus(), 90);
  }

  function closeSkillDialog() {
    if (!els.skillDialog || !els.skillDialog.open) return;
    els.skillDialog.close();
    syncDialogBodyClass();
  }

  function syncDialogBodyClass() {
    const anyOpen = Boolean(els.dialog?.open || els.skillDialog?.open);
    document.body.classList.toggle("dialog-open", anyOpen);
  }

  function clearSkillError() {
    els.skillNameInput?.closest(".form-field")?.classList.remove("has-error");
    if (els.skillNameError) els.skillNameError.textContent = "";
  }

  function validateSkillForm() {
    clearSkillError();
    const name = els.skillNameInput?.value.trim() || "";
    if (!name) {
      els.skillNameInput?.closest(".form-field")?.classList.add("has-error");
      if (els.skillNameError) els.skillNameError.textContent = "给这块田起个名字吧。";
      els.skillNameInput?.focus();
      return null;
    }
    if (state.skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      els.skillNameInput?.closest(".form-field")?.classList.add("has-error");
      if (els.skillNameError) els.skillNameError.textContent = "这块田已经开垦过了，换一个名字吧。";
      els.skillNameInput?.focus();
      return null;
    }

    const sprite = document.querySelector('input[name="sprite"]:checked')?.value || "vine";
    const style = SPRITE_STYLES[sprite] || SPRITE_STYLES.vine;
    return {
      name,
      crop: els.skillCropInput?.value.trim() || "学习苗",
      description: els.skillDescriptionInput?.value.trim() || "一块刚刚开垦、等待第一笔收获的学习田。",
      sprite,
      accent: style.accent,
      wash: style.wash
    };
  }

  function handleSkillSubmit(event) {
    event.preventDefault();
    const values = validateSkillForm();
    if (!values) return;

    const skill = {
      id: uid("field"),
      name: values.name,
      crop: values.crop,
      latin: "LEARNING FIELD",
      description: values.description,
      sprite: values.sprite,
      accent: values.accent,
      wash: values.wash,
      createdAt: new Date().toISOString()
    };

    state.skills.push(skill);
    const saved = saveState();
    const shouldContinue = pendingRecordAfterSkill;
    pendingRecordAfterSkill = false;
    activeSkillFilter = "all";
    activeCropFilter = "all";
    closeSkillDialog();
    renderAll();
    resetCropFilterButtons();

    showToast(
      saved
        ? `「${skill.name}」已开垦，可以种下第一笔收获了`
        : "学习田已创建，但浏览器未允许本地保存"
    );

    if (shouldContinue) {
      window.setTimeout(() => {
        openDialog();
        if (els.skillSelect) els.skillSelect.value = skill.id;
      }, 180);
    }
  }

  /* =========================================================
     Events
     ========================================================= */

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const recordButton = event.target.closest("[data-open-record]");
      if (recordButton) {
        openDialog();
        return;
      }
      const skillButton = event.target.closest("[data-open-skill]");
      if (skillButton) {
        pendingRecordAfterSkill = false;
        openSkillDialog();
      }
    });

    document.getElementById("dialog-close")?.addEventListener("click", closeDialog);
    document.getElementById("dialog-cancel")?.addEventListener("click", closeDialog);
    els.dialog?.addEventListener("close", syncDialogBodyClass);
    els.dialog?.addEventListener("click", (event) => {
      if (event.target === els.dialog) closeDialog();
    });

    document.getElementById("skill-dialog-close")?.addEventListener("click", closeSkillDialog);
    document.getElementById("skill-dialog-cancel")?.addEventListener("click", closeSkillDialog);
    els.skillDialog?.addEventListener("close", () => {
      syncDialogBodyClass();
      pendingRecordAfterSkill = false;
      clearSkillError();
      els.skillForm?.reset();
    });
    els.skillDialog?.addEventListener("click", (event) => {
      if (event.target === els.skillDialog) closeSkillDialog();
    });

    els.form?.addEventListener("submit", handleFormSubmit);
    els.skillForm?.addEventListener("submit", handleSkillSubmit);
    els.titleInput?.addEventListener("input", clearTitleError);
    els.skillNameInput?.addEventListener("input", clearSkillError);
    els.noteInput?.addEventListener("input", () => {
      if (els.noteCount) els.noteCount.textContent = String(els.noteInput.value.length);
    });
    els.hoursInput?.addEventListener("input", () => els.hoursInput.setCustomValidity(""));
    els.dateInput?.addEventListener("input", () => els.dateInput.setCustomValidity(""));

    document.querySelectorAll("[data-crop-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        activeCropFilter = button.dataset.cropFilter || "all";
        document.querySelectorAll("[data-crop-filter]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", active ? "true" : "false");
        });
        applyCropFilter();
      });
    });

    els.cropGrid?.addEventListener("click", (event) => {
      if (event.target.closest("[data-open-skill]")) return;
      const card = event.target.closest(".crop-card");
      if (card) selectSkill(card.dataset.skill);
    });

    els.cropGrid?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest(".crop-card");
      if (!card) return;
      event.preventDefault();
      selectSkill(card.dataset.skill);
    });

    els.journalFilters?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (button) handleJournalFilter(button.dataset.filter);
    });

    els.clearSkillFilter?.addEventListener("click", clearSkillFilter);

    els.loadMore?.addEventListener("click", () => {
      visibleLogCount = getFilteredRecords().length;
      renderJournal();
    });

    els.menuToggle?.addEventListener("click", () => {
      const isOpen = els.siteNav?.classList.toggle("is-open") || false;
      els.menuToggle.setAttribute("aria-expanded", String(isOpen));
      els.menuToggle.setAttribute("aria-label", isOpen ? "关闭导航菜单" : "打开导航菜单");
    });

    els.siteNav?.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      closeMobileNav();
    });

    document.addEventListener("click", (event) => {
      if (!els.siteNav?.classList.contains("is-open")) return;
      if (event.target.closest(".site-header")) return;
      closeMobileNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobileNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMobileNav();
    });

    document.getElementById("export-data")?.addEventListener("click", exportData);

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          updateActiveNav();
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  function closeMobileNav() {
    els.siteNav?.classList.remove("is-open");
    els.menuToggle?.setAttribute("aria-expanded", "false");
    els.menuToggle?.setAttribute("aria-label", "打开导航菜单");
  }

  /* =========================================================
     Navigation
     ========================================================= */

  function updateActiveNav() {
    const sections = ["home", "crops", "harvest", "journal"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    let currentId = "home";
    const marker = window.scrollY + 180;
    sections.forEach((section) => {
      if (marker >= section.offsetTop) currentId = section.id;
    });

    document.querySelectorAll(".nav-link").forEach((link) => {
      const target = link.getAttribute("href")?.replace("#", "");
      link.classList.toggle("is-active", target === currentId);
    });
  }

  /* =========================================================
     Export
     ========================================================= */

  function exportData() {
    if (state.skills.length === 0 && state.records.length === 0) {
      showToast("农场还是空的，先种下第一笔再导出吧");
      return;
    }

    const payload = {
      app: "学习农场",
      exportedAt: new Date().toISOString(),
      state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `learning-farm-backup-${todayISO()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
    showToast("农场档案已导出，记得收好这份备份");
  }

  /* =========================================================
     Toast / confetti
     ========================================================= */

  function showToast(message) {
    if (!els.toast || !els.toastMessage) return;
    els.toastMessage.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 3400);
  }

  function burstConfetti() {
    if (prefersReducedMotion() || !els.confettiLayer) return;
    const colors = ["#f3c44f", "#8ec45f", "#df9847", "#68a9bc", "#df95a9", "#fff1c9"];
    for (let index = 0; index < 22; index += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = "50%";
      piece.style.top = "50%";
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 420}px`);
      piece.style.setProperty("--dy", `${-60 - Math.random() * 230}px`);
      piece.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
      piece.style.animationDelay = `${Math.random() * 0.08}s`;
      els.confettiLayer.appendChild(piece);
      window.setTimeout(() => piece.remove(), 1350);
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* =========================================================
     Reveal on scroll
     ========================================================= */

  const revealObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            });
          },
          { rootMargin: "0px 0px -35px 0px", threshold: 0.07 }
        )
      : null;

  function observeReveals() {
    const nodes = document.querySelectorAll(".reveal:not(.is-visible)");
    if (!revealObserver) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    nodes.forEach((node) => revealObserver.observe(node));
  }

  init();
})();
