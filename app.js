/* ============================================================
 * 三国杀OL百科 · 交互逻辑
 * ============================================================ */

const MODES = ["排位", "斗地主", "军争"];
const DATA = window.SGS_DATA;

const els = {
  input: document.getElementById("searchInput"),
  suggest: document.getElementById("suggestList"),
  detail: document.getElementById("detailSection"),
  hot: document.getElementById("hotTags"),
};

let activeIndex = -1; // 联想列表当前高亮项
let currentMatches = [];

/* ---------- 工具函数 ---------- */

function byName(query) {
  const q = query.trim();
  if (!q) return DATA.slice();
  return DATA.filter((g) => g.name.includes(q));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function forceClass(force) {
  const map = { 蜀: "shu", 魏: "wei", 群: "qun", 吴: "wu", 神: "shen", 晋: "jin" };
  return map[force] || "qun";
}

function versionHp(general, version) {
  return version.hp || general.hp;
}

/* ---------- 热门标签 ---------- */

function renderHot() {
  els.hot.querySelectorAll(".hot-chip, .hot-note").forEach((c) => c.remove());
  DATA.slice(0, 8).forEach((g) => {
    const btn = document.createElement("button");
    btn.className = "hot-chip";
    btn.textContent = g.name;
    btn.addEventListener("click", () => {
      selectGeneral(g.id, g.versions[0].key);
    });
    els.hot.appendChild(btn);
  });

  const note = document.createElement("span");
  note.className = "hot-note";
  note.textContent = `共 ${DATA.length} 名武将 · 输入名称搜索更多`;
  els.hot.appendChild(note);
}

/* ---------- 联想下拉 ---------- */

function renderSuggest(query) {
  currentMatches = byName(query);
  activeIndex = -1;

  if (!query.trim()) {
    els.suggest.hidden = true;
    return;
  }

  if (currentMatches.length === 0) {
    els.suggest.innerHTML = '<div class="suggest-empty">未找到该武将</div>';
    els.suggest.hidden = false;
    return;
  }

  els.suggest.innerHTML = currentMatches
    .map(
      (g, i) => `
      <div class="suggest-item" data-index="${i}">
        <span class="suggest-name">${escapeHtml(g.name)}</span>
        <span class="suggest-meta">${g.force} · ${g.versions.map((v) => v.tag).join(" / ")}</span>
      </div>`
    )
    .join("");

  els.suggest.hidden = false;
}

function setActive(index) {
  const items = els.suggest.querySelectorAll(".suggest-item");
  items.forEach((el) => el.classList.remove("active"));
  if (index >= 0 && items[index]) {
    items[index].classList.add("active");
    items[index].scrollIntoView({ block: "nearest" });
  }
  activeIndex = index;
}

function hideSuggest() {
  els.suggest.hidden = true;
  activeIndex = -1;
}

/* ---------- 选中武将 ---------- */

function selectGeneral(id, versionKey) {
  const general = DATA.find((g) => g.id === id);
  if (!general) return;
  renderDetail(general, versionKey || general.versions[0].key);
  els.input.value = general.name;
  hideSuggest();
}

/* ---------- 渲染详情 ---------- */

function renderDetail(general, activeKey) {
  const active = general.versions.find((v) => v.key === activeKey) || general.versions[0];
  const hp = versionHp(general, active);
  const force = active.force || general.force;

  const versionTags = general.versions
    .map(
      (v) => `
      <button class="version-tag ${v.key === active.key ? "active" : ""}" data-key="${v.key}">
        ${v.tag}<span class="v-full">${v.name}</span>
      </button>`
    )
    .join("");

  const skills = active.skills
    .map((s, i) => {
      const typeHtml = s.type ? `<span class="skill-type">${escapeHtml(s.type)}</span>` : "";
      return `
      <div class="skill-card" style="animation-delay:${i * 90}ms">
        <div class="skill-head">
          <span class="skill-name">${escapeHtml(s.name)}</span>
          ${typeHtml}
        </div>
        <p class="skill-desc">${escapeHtml(s.desc)}</p>
      </div>`;
    })
    .join("");

  const modes = MODES.map((m) => {
    const rec = active.recommend.mode === m;
    return `
      <div class="mode-item ${rec ? "recommended" : ""}">
        <span class="tick">${rec ? "✓" : ""}</span>${m}
      </div>`;
  }).join("");

  els.detail.innerHTML = `
    <div class="detail-card">
      <div class="general-head">
        <div class="force-badge ${forceClass(force)}">${escapeHtml(force)}</div>
        <div class="general-title-wrap">
          <h2 class="general-name">${escapeHtml(general.name)}</h2>
          <div class="general-meta">
            <span>${escapeHtml(force)}势力</span>
            <span class="meta-sep">·</span>
            <span>${escapeHtml(general.gender)}</span>
            <span class="meta-sep">·</span>
            <span class="hp-dots">${'<i class="hp-dot"></i>'.repeat(hp)}</span>
          </div>
        </div>
      </div>

      <div class="version-row">${versionTags}</div>

      <div class="skills-list">${skills}</div>

      <div class="recommend-block">
        <div class="recommend-title">模式推荐 <span class="arrow">➤</span></div>
        <div class="mode-row">${modes}</div>
        <p class="recommend-reason">
          <strong>推荐「${active.recommend.mode}」</strong> —— ${escapeHtml(active.recommend.reason)}
        </p>
      </div>
    </div>`;

  // 版本切换事件
  els.detail.querySelectorAll(".version-tag").forEach((btn) => {
    btn.addEventListener("click", () => renderDetail(general, btn.dataset.key));
  });
}

/* ---------- 搜索框事件 ---------- */

els.input.addEventListener("input", (e) => {
  renderSuggest(e.target.value);
});

els.input.addEventListener("keydown", (e) => {
  if (els.suggest.hidden) {
    if (e.key === "Enter") {
      const g = currentMatches[0];
      if (g) selectGeneral(g.id);
    }
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActive((activeIndex + 1) % currentMatches.length);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setActive((activeIndex - 1 + currentMatches.length) % currentMatches.length);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const idx = activeIndex >= 0 ? activeIndex : 0;
    const g = currentMatches[idx];
    if (g) selectGeneral(g.id);
  } else if (e.key === "Escape") {
    hideSuggest();
  }
});

// 点击联想项
els.suggest.addEventListener("mousedown", (e) => {
  const item = e.target.closest(".suggest-item");
  if (!item) return;
  const g = currentMatches[Number(item.dataset.index)];
  if (g) selectGeneral(g.id);
});

// 点击空白处关闭联想
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box")) hideSuggest();
});

/* ---------- 初始化 ---------- */

renderHot();
selectGeneral("诸葛亮");
