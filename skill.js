/* ============================================================
 * 三国杀OL百科 · 单技能查询逻辑
 * ============================================================ */

const DATA = window.SGS_DATA;

const els = {
  input: document.getElementById("skillInput"),
  suggest: document.getElementById("suggestList"),
  detail: document.getElementById("skillDetail"),
};

let activeIndex = -1;
let currentMatches = [];

/* ---------- 建立技能索引：技能名 -> 拥有者列表 ---------- */

const skillIndex = {};
DATA.forEach((g) => {
  g.versions.forEach((v) => {
    v.skills.forEach((s) => {
      if (!skillIndex[s.name]) skillIndex[s.name] = [];
      skillIndex[s.name].push({
        general: g.name,
        version: v.tag,
        force: v.force,
        type: s.type,
        desc: s.desc,
      });
    });
  });
});

const skillNames = Object.keys(skillIndex).sort();

/* ---------- 工具 ---------- */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ownerLabel(o) {
  // 神、魔武将的 general 已是完整名（含前缀），避免重复
  if (o.version === "神" || o.version === "魔") return o.general;
  return o.version + o.general;
}

/* ---------- 搜索联想 ---------- */

function renderSuggest(query) {
  currentMatches = query.trim()
    ? skillNames.filter((n) => n.includes(query.trim()))
    : [];
  activeIndex = -1;

  if (!query.trim()) {
    els.suggest.hidden = true;
    return;
  }
  if (currentMatches.length === 0) {
    els.suggest.innerHTML = '<div class="suggest-empty">未找到该技能</div>';
    els.suggest.hidden = false;
    return;
  }

  els.suggest.innerHTML = currentMatches
    .map(
      (n, i) => `
      <div class="suggest-item" data-index="${i}">
        <span class="suggest-name">${escapeHtml(n)}</span>
        <span class="suggest-meta">${skillIndex[n].length}名武将拥有</span>
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

/* ---------- 选中技能 ---------- */

function selectSkill(name) {
  renderDetail(name);
  els.input.value = name;
  hideSuggest();
}

/* ---------- 渲染详情 ---------- */

function renderDetail(name) {
  const owners = skillIndex[name];
  if (!owners) {
    els.detail.innerHTML = `
      <div class="empty-state">
        <div class="empty-mark">✦</div>
        <p>输入技能名，查询技能效果与拥有武将</p>
      </div>`;
    return;
  }

  // 按描述分组（不同版本可能描述不同）
  const groups = new Map();
  owners.forEach((o) => {
    if (!groups.has(o.desc)) groups.set(o.desc, []);
    groups.get(o.desc).push(o);
  });

  const type = owners.find((o) => o.type)?.type || "";
  const typeHtml = type ? `<span class="skill-type">${escapeHtml(type)}</span>` : "";

  const descBlocks = [...groups.entries()]
    .map(([desc, list], i) => {
      const chips = list
        .map((o) => `<span class="owner-chip">${escapeHtml(ownerLabel(o))}</span>`)
        .join("");
      return `
        <div class="skill-desc-block" style="animation-delay:${i * 90}ms">
          <p class="skill-desc">${escapeHtml(desc)}</p>
          <div class="skill-owners">
            <span class="skill-owners-label">拥有</span>
            ${chips}
          </div>
        </div>`;
    })
    .join("");

  els.detail.innerHTML = `
    <div class="detail-card">
      <div class="skill-title-head">
        <h2 class="skill-title-name">${escapeHtml(name)}</h2>
        ${typeHtml}
        <span class="skill-owner-count">${owners.length} 名武将拥有</span>
      </div>
      ${descBlocks}
    </div>`;
}

/* ---------- 事件 ---------- */

els.input.addEventListener("input", (e) => renderSuggest(e.target.value));

els.input.addEventListener("keydown", (e) => {
  if (els.suggest.hidden) {
    if (e.key === "Enter" && currentMatches[0]) selectSkill(currentMatches[0]);
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
    if (currentMatches[idx]) selectSkill(currentMatches[idx]);
  } else if (e.key === "Escape") {
    hideSuggest();
  }
});

els.suggest.addEventListener("mousedown", (e) => {
  const item = e.target.closest(".suggest-item");
  if (!item) return;
  const idx = Number(item.dataset.index);
  if (currentMatches[idx]) selectSkill(currentMatches[idx]);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box")) hideSuggest();
});

/* ---------- 初始化 ---------- */

renderDetail(""); // 初始为空态，不显示默认技能
