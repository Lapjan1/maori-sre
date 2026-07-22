/**
 * Co-Sense — Main Application
 */
const App = (() => {
  let _currentIndex = 0;
  let _panelALang = "en";
  let _panelBLang = "af";
  let _experiences = [];
  let _reviewMode = false;
  let _activeCurriculum = "river_world";

  const REVIEW_KEY = "river_world_pass1";
  const CURRICULUM_KEY = "river_world_curriculum";

  function _getCurriculumName() {
    if (_activeCurriculum === "wife_core_20") return "Wife's Core 20";
    return "River World";
  }

  function init() {
    _experiences = window.EXPERIENCES || [];
    if (!_experiences.length) {
      document.getElementById("app").innerHTML =
        '<p style="padding:2rem;text-align:center;">No experiences found.</p>';
      return;
    }
    Audio.init();
    _restoreLang();
    _restoreCurriculum();
    const header = document.querySelector(".sidebar-header");
    if (header) header.textContent = _getCurriculumName();
    _populateVoicePackages();
    _renderExperienceList();
    _showExperience(0);
    Session.log("app_started", { totalExperiences: _experiences.length, curriculum: _activeCurriculum });
  }

  function _restoreCurriculum() {
    try {
      const saved = localStorage.getItem(CURRICULUM_KEY);
      if (saved === "wife_core_20" && typeof CORE_20 !== "undefined") {
        _activeCurriculum = "wife_core_20";
        _experiences = CORE_20;
      }
    } catch (e) { /* ignore */ }
  }

  function _switchCurriculum(name) {
    if (name === "wife_core_20" && typeof CORE_20 !== "undefined") {
      _activeCurriculum = "wife_core_20";
      _experiences = CORE_20;
      _currentIndex = 0;
    } else {
      _activeCurriculum = "river_world";
      _experiences = window.EXPERIENCES || [];
      _currentIndex = 0;
    }
    try { localStorage.setItem(CURRICULUM_KEY, _activeCurriculum); } catch (e) { /* ignore */ }
    _reviewMode = false;
    const header = document.querySelector(".sidebar-header");
    if (header) header.textContent = _getCurriculumName();
    _renderExperienceList();
    _showExperience(0);
    Session.log("curriculum_changed", { curriculum: _activeCurriculum });
  }

  function _restoreLang() {
    try {
      const saved = localStorage.getItem("river_world_lang");
      if (saved) _panelALang = saved;
      const savedB = localStorage.getItem("river_world_lang_b");
      if (savedB) _panelBLang = savedB;
    } catch (e) { /* ignore */ }
  }

  function _saveLang() {
    try { localStorage.setItem("river_world_lang", _panelALang); } catch (e) { /* ignore */ }
    try { localStorage.setItem("river_world_lang_b", _panelBLang); } catch (e) { /* ignore */ }
  }

  function setPanelALang(lang) {
    _panelALang = lang;
    _saveLang();
    const sel = document.getElementById("lang-selector-a");
    if (sel) sel.value = lang;
    _showExperience(_currentIndex);
    Session.log("panel_a_lang_changed", { lang });
  }

  function setPanelBLang(lang) {
    _panelBLang = lang;
    _saveLang();
    const sel = document.getElementById("lang-selector-b");
    if (sel) sel.value = lang;
    _showExperience(_currentIndex);
    Session.log("panel_b_lang_changed", { lang });
  }

  function swapLangs() {
    const tmp = _panelALang;
    _panelALang = _panelBLang;
    _panelBLang = tmp;
    _saveLang();
    const selA = document.getElementById("lang-selector-a");
    const selB = document.getElementById("lang-selector-b");
    if (selA) selA.value = _panelALang;
    if (selB) selB.value = _panelBLang;
    _showExperience(_currentIndex);
    Session.log("langs_swapped", { panelA: _panelALang, panelB: _panelBLang });
  }

  function _populateVoicePackages() {
    ["a", "b"].forEach((side) => {
      const sel = document.getElementById("voice-selector-" + side);
      if (!sel) return;
      const lang = side === "a" ? _panelALang : _panelBLang;
      sel.innerHTML = "";
      const pkgs = Audio.getAvailablePackages(lang);
      if (pkgs.length <= 1) {
        sel.style.display = "none";
        return;
      }
      sel.style.display = "";
      const current = Audio.getVoicePackage(lang);
      pkgs.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name;
        if (p.id === current) opt.selected = true;
        sel.appendChild(opt);
      });
    });
  }

  function _showExperience(index) {
    if (index < 0 || index >= _experiences.length) return;
    _currentIndex = index;
    const exp = _experiences[index];
    const app = document.getElementById("app");
    app.innerHTML = _renderExperience(exp);
    app.scrollTop = 0;
    Session.log("experience_opened", {
      experience_id: exp.id,
      type: exp.type,
      level: exp.level,
      langA: _panelALang,
      langB: _panelBLang,
    });
  }

  function _renderTopPanel(exp, lang) {
    const content = exp.content[lang] || exp.content["en"] || "";
    const sentences = content.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
    const hasAudio = "speechSynthesis" in window;
    const langName = { en: "English", mi: "Māori", af: "Afrikaans" }[lang] || lang;

    return `
      <div class="panel panel-top">
        <div class="panel-header">
          <span class="panel-lang">${langName}</span>
          <div class="panel-audio-bar">
            ${hasAudio ? sentences.map((s, i) =>
              `<button class="btn-audio" data-text="${_escape(s)}" data-lang="${lang}" data-phrase-id="${i === sentences.length - 1 ? _escape(exp.phrase_id || "") : ""}" data-paragraph-id="${_escape(exp.id || exp.phrase_id || "")}" title="Listen">\u25B6 ${i === sentences.length - 1 ? "Native" : "Listen"}</button>`
            ).join("") : ""}
          </div>
        </div>
        <div class="panel-content">
          ${sentences.map((s, i) =>
            `<p class="sentence${i === sentences.length - 1 ? " sentence-key" : ""}">${_escape(s)}</p>`
          ).join("")}
        </div>
        <div class="panel-word-breakdown">
          ${_renderWordChips(sentences.join(" "), exp.entities, lang, _panelBLang)}
        </div>
        <div id="word-detail" class="word-detail hidden">
          <div class="word-detail-inner"></div>
        </div>
        ${exp.situation
          ? `<div class="panel-situation">${_escape(exp.situation[lang] || exp.situation.en || "")}</div>`
          : ""}
      </div>`;
  }

  function _renderWordChips(text, entities, langA, langB) {
    if (!entities || !entities.length) return "";
    text = text.replace(/\n/g, " ");
    const chips = [];
    let pos = 0;
    const sorted = entities
      .map((e) => ({ id: e.entity_id || e.id, label: _entityLabel(e, "default"), e }))
      .filter((p) => p.label.length > 1)
      .sort((a, b) => b.label.length - a.label.length);

    while (pos < text.length) {
      let found = null;
      for (const p of sorted) {
        if (pos + p.label.length > text.length) continue;
        const slice = text.slice(pos, pos + p.label.length);
        if (slice.toLowerCase() === p.label.toLowerCase()) {
          const next = text[pos + p.label.length] || " ";
          const prev = text[pos - 1] || " ";
          const wl = /[a-zāēīōū]/i;
          if (!wl.test(prev) && !wl.test(next)) { found = p; break; }
        }
      }
      if (found) {
        chips.push(found.id);
        pos += found.label.length;
      } else {
        pos++;
      }
    }

    const seen = new Set();
    const langCode = { en: "EN", mi: "MI", af: "AF" };
    const renderOne = (id, lang) => {
      const e = entities.find((x) => (x.entity_id || x.id) === id);
      if (!e) return "";
      const label = _entityLabel(e, lang);
      if (!label) return "";
      return `<button class="word-chip lang-${_escape(lang)}" data-entity="${_escape(id)}" data-lang="${_escape(lang)}"><span class="chip-lang">${langCode[lang] || lang}</span> ${_escape(label)}</button>`;
    };

    const tags = [];
    chips.forEach((id) => {
      if (seen.has(id)) return;
      seen.add(id);
      tags.push(renderOne(id, langA));
      if (langB && langB !== langA) {
        tags.push(renderOne(id, langB));
      }
    });
    return `<div class="word-chips">${tags.filter(Boolean).join(" ")}</div>`;
  }

  function _renderParallelPanel(exp, langA, langB) {
    const contentA = exp.content[langA] || exp.content["en"] || "";
    const contentB = exp.content[langB] || exp.content["en"] || "";
    const hasAudio = "speechSynthesis" in window;
    const langNameA = { en: "English", mi: "Māori", af: "Afrikaans" }[langA] || langA;
    const langNameB = { en: "English", mi: "Māori", af: "Afrikaans" }[langB] || langB;
    const linesA = contentA.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const linesB = contentB.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const keyTextA = linesA[linesA.length - 1] || contentA;
    const keyTextB = linesB[linesB.length - 1] || contentB;
    const displayTextA = contentA.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    const displayTextB = contentB.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    return `
      <div class="panel panel-bottom">
        <div class="panel-header">
          <span class="panel-lang">${langNameA} &middot; ${langNameB}</span>
          <div class="panel-audio-bar">
            ${hasAudio
              ? `<button class="btn-audio" data-text="${_escape(keyTextA)}" data-lang="${langA}" data-phrase-id="${_escape(exp.phrase_id || "")}" title="Listen">\u25B6 ${langNameA}</button>`
              : ""}
            ${hasAudio
              ? `<button class="btn-audio" data-text="${_escape(keyTextB)}" data-lang="${langB}" data-phrase-id="${_escape(exp.phrase_id || "")}" title="Listen">\u25B6 ${langNameB}</button>`
              : ""}
            ${hasAudio
              ? `<button class="btn-audio-seq" data-langa="${langA}" data-langb="${langB}" data-texta="${_escape(keyTextA)}" data-textb="${_escape(keyTextB)}" data-phrase-id="${_escape(exp.phrase_id || "")}" title="Listen to both">\u25B6 Both</button>`
              : ""}
          </div>
        </div>
        <div class="parallel-content">
          <div class="parallel-block">
            <span class="parallel-lang-label">${langNameA}</span>
            <div class="parallel-text">${_escape(displayTextA)}</div>
          </div>
          <div class="parallel-block">
            <span class="parallel-lang-label">${langNameB}</span>
            <div class="parallel-text">${_escape(displayTextB)}</div>
          </div>
        </div>
      </div>`;
  }

  function _highlightEntities(text, entities, lang) {
    if (!entities || !entities.length || !text) return _escape(text);
    text = text.replace(/\n/g, " ");
    const patterns = entities
      .map((e, idx) => {
        const label = _entityLabel(e, lang);
        return { label, id: e.entity_id || e.id, idx: idx % 10 };
      })
      .filter((p) => p.label.length > 1)
      .sort((a, b) => b.label.length - a.label.length);

    let result = "";
    let pos = 0;
    while (pos < text.length) {
      let best = null;
      for (const p of patterns) {
        const pl = p.label.length;
        if (pos + pl > text.length) continue;
        const slice = text.slice(pos, pos + pl);
        if (slice.toLowerCase() === p.label.toLowerCase()) {
          const next = text[pos + pl] || " ";
          const prev = text[pos - 1] || " ";
          const wordLike = /[a-zāēīōū]/i;
          if (!wordLike.test(prev) && !wordLike.test(next)) {
            best = p;
            break;
          }
        }
      }
      if (best) {
        result += `<span class="hl hl-${best.idx}" data-entity="${_escape(best.id)}">${_escape(text.slice(pos, pos + best.label.length))}</span>`;
        pos += best.label.length;
      } else {
        result += _escape(text[pos]);
        pos++;
      }
    }
    return result;
  }

  function _renderWordDetail(entityId, lang) {
    const exp = _experiences[_currentIndex];
    if (!exp) return "";
    const e = exp.entities.find((x) => (x.entity_id || x.id) === entityId);
    if (!e) return "";

    const sf = _lookupSurfaceForm(entityId, lang);
    const pron = sf?.pronunciation;
    const word = _entityLabel(e, lang);
    const meaning = _entityLabel(e, "en");
    const category = e.category;
    const catLabel = {
      PERSON: "Person / being", ACTION: "Action / movement", THING: "Object / thing",
      STATE: "State / feeling", PHRASE: "Phrase / expression", CONCEPT: "Concept / idea"
    }[category] || category;

    const otherLang = lang === "en" ? null : (_panelBLang === lang ? _panelALang : _panelBLang);
    const otherWord = otherLang ? _entityLabel(e, otherLang) : null;
    const otherLangName = otherLang ? ({ en: "English", mi: "Māori", af: "Afrikaans" }[otherLang] || otherLang) : null;

    return `
      <div class="wd-word">${_escape(word)}</div>
      <div class="wd-row"><span class="wd-label">Meaning</span><span class="wd-value">${_escape(meaning)}</span></div>
      <div class="wd-row"><span class="wd-label">Type</span><span class="wd-value">${catLabel}</span></div>
      ${pron?.ipa ? `<div class="wd-row"><span class="wd-label">Pronunciation</span><span class="wd-value">${_escape(pron.ipa)}</span></div>` : ""}
      ${pron?.syllables?.length ? `<div class="wd-row"><span class="wd-label">Syllables</span><span class="wd-value">${_escape(pron.syllables.join(" · "))}</span></div>` : ""}
      ${otherWord ? `<div class="wd-row"><span class="wd-label">${otherLangName}</span><span class="wd-value">${_escape(otherWord)}</span></div>` : ""}
      <button class="btn-audio wd-audio" data-text="${_escape(word)}" data-lang="${lang}" title="Listen">\u25B6 Listen</button>
    `;
  }

  function _escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function _renderExperience(exp) {
    const typeLabel = exp.type.charAt(0).toUpperCase() + exp.type.slice(1);
    return `
      <div class="exp-header">
        <span class="exp-type">${typeLabel} · Level ${exp.level}</span>
        <span class="exp-id">${exp.id}</span>
      </div>
      <h1 class="exp-title">${_escape(exp.title["en"] || exp.id)}</h1>
      <div class="dual-panel">
        ${_renderTopPanel(exp, _panelALang)}
        ${_renderParallelPanel(exp, _panelALang, _panelBLang)}
      </div>
      <div class="exp-nav">
        <button class="btn btn-secondary" id="btn-prev" ${_currentIndex === 0 ? "disabled" : ""}>
          \u2190 Previous
        </button>
        <span class="exp-counter">${_currentIndex + 1} / ${_experiences.length}</span>
        <button class="btn btn-primary" id="btn-next" ${_currentIndex >= _experiences.length - 1 ? "disabled" : ""}>
          Next \u2192
        </button>
      </div>
    `;
  }

  function _renderSentenceChips(sentence, entities, lang) {
    if (!entities || !entities.length) return _escape(sentence);
    const labelMap = {};
    entities.forEach(e => {
      const id = e.entity_id || e.id;
      const label = _entityLabel(e, lang);
      if (label && !/\s/.test(label)) {
        labelMap[label.toLowerCase()] = { id, label };
      }
    });
    if (!Object.keys(labelMap).length) return _escape(sentence);

    const tokens = sentence.split(/(\s+)/);
    return tokens.map(t => {
      if (t.trim() === "") return t;
      const key = t.replace(/^[^\wāēīōūĀĒĪŌŪ']+|[^\wāēīōūĀĒĪŌŪ']+$/g, "").toLowerCase();
      const info = labelMap[key];
      if (info) {
        return `<button class="word-chip" data-entity="${_escape(info.id)}" data-lang="${_escape(lang)}">${_escape(t)}</button>`;
      }
      return _escape(t);
    }).join("");
  }

  function _renderExperienceList() {
    const container = document.getElementById("exp-list");
    let html = `<div class="curriculum-switcher">`;
    html += `<button class="curriculum-btn ${_activeCurriculum === "river_world" ? "active" : ""}" data-curriculum="river_world">River World</button>`;
    html += `<button class="curriculum-btn ${_activeCurriculum === "wife_core_20" ? "active" : ""}" data-curriculum="wife_core_20">Wife's Core 20</button>`;
    html += `<div class="curriculum-label">${_escape(_getCurriculumName())} · ${_experiences.length} items</div>`;
    html += `</div>`;
    html += `<div class="exp-list-scroll">`;
    html += _experiences
      .map(
        (exp, i) => `
      <button class="exp-list-item ${i === _currentIndex && !_reviewMode ? "active" : ""}"
              data-index="${i}">
        <span class="exp-list-title">${_escape(exp.title["en"] || exp.id)}</span>
        <span class="exp-list-type">${exp.type} · Level ${exp.level}</span>
      </button>`
      )
      .join("");
    html += `</div>`;
    html += `<hr class="sidebar-divider">`;
    html += `<button class="sidebar-review ${_reviewMode ? "active" : ""}" data-action="review">Pass 1 Review</button>`;
    container.innerHTML = html;
  }

  // --- Pass 1 Review mode ---

  const REVIEW_DATA = [
    { id: "VISIT_001", title: "Before the Journey", scenario: "At home in South Africa, packing. Thinking about the trip ahead.", phrases: [
      ["Kei te haere au ki Aotearoa", "I am going to New Zealand"],
      ["He taonga tēnei mō te whānau", "This is a gift for the family"],
      ["Kei te koa au", "I am excited"]
    ]},
    { id: "VISIT_002", title: "Arrival", scenario: "Arriving at the airport. Being greeted by family.", rehearsal: "Family says \"Kia ora! Haere mai!\" then asks \"Kei te pēhea koe?\"", phrases: [
      ["Kia ora", "Hello / greetings"],
      ["Kei te pēhea koe?", "How are you?"],
      ["Kei te pai", "I am well"],
      ["Haere mai", "Welcome / come here"]
    ]},
    { id: "VISIT_003", title: "Meeting the Family", scenario: "Being introduced to family members at the house.", rehearsal: "Someone asks \"Nō hea koe?\" and you introduce yourself.", phrases: [
      ["Ko [name] tōku ingoa", "My name is [name]"],
      ["Nō hea koe?", "Where are you from?"],
      ["Nō Āwherika ki te Tonga ahau", "I am from South Africa"],
      ["Ko wai tēnei?", "Who is this?"],
      ["Tēnā koutou", "Greetings to you all"]
    ]},
    { id: "VISIT_004", title: "At the House", scenario: "Being shown around the family home.", rehearsal: "You need the bathroom. Your host is showing you around.", phrases: [
      ["Kei hea te wharepaku?", "Where is the bathroom?"],
      ["He whare ātaahua", "A beautiful house"],
      ["Noho mai", "Please sit / stay"],
      ["Kei te hiamoe au", "I am sleepy"]
    ]},
    { id: "VISIT_005", title: "Food and Drink", scenario: "Family meal. Being offered food and drink.", rehearsal: "Someone offers you food. You are thirsty.", phrases: [
      ["Kei te hiakai au", "I am hungry"],
      ["Kei te matewai au", "I am thirsty"],
      ["He wai, koa", "Some water, please"],
      ["Kia ora mō te kai", "Thank you for the food"],
      ["He kai, koa", "Some food, please"],
      ["Tēnā kōrua", "Please help yourselves"]
    ]},
    { id: "VISIT_006", title: "The Weather", scenario: "Looking outside. Commenting on the weather.", rehearsal: "Someone says \"Pēhea te huarere?\" It is raining.", phrases: [
      ["Kei te ua", "It is raining"],
      ["He rā paki", "A fine day"],
      ["Kei te wera", "It is hot"],
      ["Kei te mātao", "It is cold"],
      ["Pēhea te huarere?", "How is the weather?"]
    ]},
    { id: "VISIT_007", title: "Going Out", scenario: "Going to the local shops or marae.", rehearsal: "Someone invites you to go to the shop.", phrases: [
      ["Haere tāua", "Let's go (you and me)"],
      ["Kei hea te toa?", "Where is the shop?"],
      ["Hoko kai", "Buy food"],
      ["Haere ki te marae", "Go to the marae"]
    ]},
    { id: "VISIT_008", title: "Beach and Sea", scenario: "A day trip to the beach.", rehearsal: "You arrive at the beach and see the ocean.", phrases: [
      ["Kei te haere tāua ki te one", "We are going to the beach"],
      ["He ātaahua te moana", "The sea is beautiful"],
      ["Kauhoe tāua", "Let's swim"],
      ["Auē, he makariri te wai!", "Oh, the water is cold!"]
    ]},
    { id: "VISIT_009", title: "Family Gathering", scenario: "A larger family gathering with extended whānau.", rehearsal: "You are at a gathering with extended family.", phrases: [
      ["Huihui tātou", "Let us gather"],
      ["Kōrero mai", "Speak to me / tell me"],
      ["Waiata tātou", "Let's sing"],
      ["He nui te whānau", "The family is big"],
      ["Aroha nui", "Much love"]
    ]},
    { id: "VISIT_010", title: "Social Conversation", scenario: "Sitting around the table, having casual conversation.", rehearsal: "At the table, someone asks about your trip.", phrases: [
      ["Kei te pēhea tō haerenga?", "How is your trip?"],
      ["He reka", "It is delicious"],
      ["Nō hea koe?", "Where are you from?"],
      ["E hia ō tau?", "How old are you?"],
      ["He pai te kai", "The food is good"]
    ]},
    { id: "VISIT_011", title: "Thanking", scenario: "The end of a visit. Expressing gratitude.", rehearsal: "Before leaving, you want to thank your hosts properly.", phrases: [
      ["Kia ora mō tō manaaki", "Thank you for your hospitality"],
      ["Kia ora mō te kai", "Thank you for the food"],
      ["He whare ātaahua", "Beautiful home"],
      ["He whānau atawhai", "Kind family"]
    ]},
    { id: "VISIT_012", title: "Goodbye", scenario: "Leaving. Saying goodbye to family.", rehearsal: "You are leaving. Your family says \"Haere rā.\"", phrases: [
      ["Haere rā", "Goodbye (to those staying)"],
      ["E noho rā", "Goodbye (to those leaving)"],
      ["Ka hoki mai au", "I will return"],
      ["Ka tangī au", "I will miss you / I will cry"],
      ["Aroha nui", "Much love"],
      ["Kia kaha", "Be strong"]
    ]}
  ];

  function _reviewUid(expId, idx) { return expId + "_" + idx; }

  function _loadReview() {
    try { return JSON.parse(localStorage.getItem(REVIEW_KEY)) || {}; } catch(e) { return {}; }
  }

  function _saveReview(state) {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(state));
  }

  function _reviewDone(state) {
    let n = 0;
    REVIEW_DATA.forEach(e => e.phrases.forEach((_, i) => { if (state[_reviewUid(e.id, i)]) n++; }));
    return n;
  }

  function _renderReview() {
    const state = _loadReview();
    const total = REVIEW_DATA.reduce((s, e) => s + e.phrases.length, 0);
    const done = _reviewDone(state);
    let html = `<div class="review-section">`;
    html += `<div class="review-toolbar">`;
    html += `<button class="btn-back" data-action="back-to-exp">Back to Lessons</button>`;
    html += `<button class="btn-export" data-action="export-review">Export</button>`;
    html += `<button class="btn-reset" data-action="reset-review">Reset</button>`;
    html += `<span class="review-progress">${done} / ${total}</span>`;
    html += `</div>`;
    html += `<h2>Pass 1 Review</h2>`;
    html += `<p class="hdr">Mark each phrase: <b>S</b> (want to say) &middot; <b>R</b> (recognise) &middot; <b>X</b> (explore/understand)</p>`;

    REVIEW_DATA.forEach(exp => {
      html += `<div class="review-exp">`;
      html += `<h3>${_escape(exp.title)}</h3>`;
      html += `<p class="scenario">${_escape(exp.scenario)}</p>`;
      html += `<table class="review-table">`;
      exp.phrases.forEach((p, i) => {
        const id = _reviewUid(exp.id, i);
        const val = state[id] || "";
        html += `<tr><td><div class="rg">`;
        ["S","R","X"].forEach(v => {
          const ch = val === v ? " checked" : "";
          html += `<input type="radio" name="${id}" id="${id}_${v}" value="${v}"${ch} data-review="${id}" data-v="${v}">`;
          html += `<label data-v="${v}" for="${id}_${v}">${v}</label>`;
        });
        html += `</div></td><td><b>${_escape(p[0])}</b></td><td>${_escape(p[1])}</td></tr>`;
      });
      html += `</table>`;
      if (exp.rehearsal) {
        const rk = exp.id + "_rehearsal";
        const rv = state[rk] || "";
        html += `<div class="review-rehearsal"><p class="q">${_escape(exp.rehearsal)}</p>`;
        html += `<p style="font-weight:600;margin-top:4px">Could you handle this?</p>`;
        html += `<div class="yn">`;
        ["Yes","Not sure"].forEach(v => {
          const ch = rv === v ? " checked" : "";
          html += `<label><input type="radio" name="${rk}" value="${v}"${ch} data-review="${rk}" data-v="${v}"> ${v}</label>`;
        });
        html += `</div></div>`;
      }
      html += `</div>`;
    });

    const fr = state["_finalReady"] || "";
    html += `<div class="review-footer">`;
    html += `<h3>Final Check</h3>`;
    html += `<p>If you had to navigate a visit using only the phrases you marked <b>S</b>, would you feel ready?</p>`;
    html += `<div class="rr">`;
    ["yes","partial","no"].forEach(v => {
      const labels = {yes:"Yes, mostly", partial:"Partially", no:"No, I need more"};
      const ch = fr === v ? " checked" : "";
      html += `<label><input type="radio" name="_finalReady" value="${v}"${ch} data-review="_finalReady" data-v="${v}"> ${labels[v]}</label>`;
    });
    html += `</div>`;
    html += `<p style="margin-top:10px;font-weight:600">What is the ONE thing you most want to say that isn't on this list?</p>`;
    html += `<textarea id="review-missing" rows="2" placeholder="Type here...">${_escape(state["_missingPhrase"] || "")}</textarea>`;
    html += `<p style="font-weight:600">Any other notes:</p>`;
    html += `<textarea id="review-notes" rows="3" placeholder="Type here...">${_escape(state["_otherNotes"] || "")}</textarea>`;
    html += `</div></div>`;
    return html;
  }

  function _enterReview() {
    _reviewMode = true;
    document.getElementById("app").innerHTML = _renderReview();
    document.getElementById("sidebar").classList.remove("open");
    _renderExperienceList();
  }

  function _exitReview() {
    _reviewMode = false;
    _showExperience(_currentIndex);
    _renderExperienceList();
  }

  function _exportReview() {
    _saveReviewNow();
    const state = _loadReview();
    const result = {
      exportedAt: new Date().toISOString(),
      responses: {},
      rehearsalChecks: {},
      finalReady: state["_finalReady"] || "",
      missingPhrase: state["_missingPhrase"] || "",
      otherNotes: state["_otherNotes"] || ""
    };
    REVIEW_DATA.forEach(exp => {
      exp.phrases.forEach((p, i) => {
        const id = _reviewUid(exp.id, i);
        result.responses[id] = {
          phrase: p[0], english: p[1], experience: exp.title,
          choice: state[id] || null
        };
      });
      if (exp.rehearsal) {
        const rk = exp.id + "_rehearsal";
        result.rehearsalChecks[rk] = {
          experience: exp.title, check: exp.rehearsal,
          answer: state[rk] || null
        };
      }
    });
    const blob = new Blob([JSON.stringify(result, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pass1-results.json";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _saveReviewNow() {
    const state = _loadReview();
    document.querySelectorAll("[data-review]").forEach(el => {
      if (el.type === "radio" && el.checked) {
        state[el.name] = el.value;
      }
    });
    ["review-missing", "review-notes"].forEach(id => {
      const el = document.getElementById(id);
      if (el) state[id === "review-missing" ? "_missingPhrase" : "_otherNotes"] = el.value;
    });
    _saveReview(state);
  }

  function _escape(s) {
    if (typeof s !== "string") return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function _entityLabel(e, lang) {
    return e.label[lang] || e.label["default"] || e.id;
  }

  function _lookupSurfaceForm(entityId, lang) {
    if (typeof SURFACE_FORMS === "undefined") return null;
    const sfId = SURFACE_FORM_INDEX?.[entityId]?.[lang];
    return sfId ? SURFACE_FORMS[sfId] : null;
  }

  // --- Event delegation ---

  document.addEventListener("click", (e) => {
    // Audio buttons
    if (e.target.classList.contains("btn-audio")) {
      const text = e.target.dataset.text;
      const lang = e.target.dataset.lang;
      const phraseId = e.target.dataset.phraseId;
      if (text) {
        Audio.speak(text, lang, null, phraseId);
        Session.log("audio_played", { text, lang, phraseId, experience_id: _experiences[_currentIndex]?.id });
      }
      return;
    }

    // Entity audio buttons (with native recording fallback)
    if (e.target.classList.contains("btn-audio-sm")) {
      const entityId = e.target.dataset.entity;
      const lang = e.target.dataset.lang;
      if (entityId) {
        const sf = _lookupSurfaceForm(entityId, lang);
        const text = sf?.text || entityId;
        Audio.speak(text, lang, entityId);
        Session.log("audio_played", { text, lang, entityId, experience_id: _experiences[_currentIndex]?.id });
      }
      return;
    }

    // Word chips — show detail and play audio
    if (e.target.classList.contains("word-chip")) {
      const entityId = e.target.dataset.entity;
      const lang = e.target.dataset.lang;
      if (entityId) {
        const detail = document.getElementById("word-detail");
        if (detail) {
          detail.classList.remove("hidden");
          const inner = detail.querySelector(".word-detail-inner");
          if (inner) inner.innerHTML = _renderWordDetail(entityId, lang);
        }
        const sf = _lookupSurfaceForm(entityId, lang);
        const text = sf?.text || entityId;
        Audio.speak(text, lang, entityId);
        Session.log("audio_played", { text, lang, entityId, experience_id: _experiences[_currentIndex]?.id });
      }
      return;
    }

    // Play both sequence
    if (e.target.classList.contains("btn-audio-seq")) {
      const langA = e.target.dataset.langa;
      const langB = e.target.dataset.langb;
      const textA = e.target.dataset.texta;
      const textB = e.target.dataset.textb;
      const phraseId = e.target.dataset.phraseId;
      if (textA && textB) {
        Audio.speak(textA, langA, null, phraseId);
        setTimeout(() => {
          Audio.speak(textB, langB, null, phraseId);
        }, 800);
        Session.log("audio_played", { text: textA + " | " + textB, lang: langA + "/" + langB, phraseId, experience_id: _experiences[_currentIndex]?.id });
      }
      return;
    }

    // Navigation
    if (e.target.id === "btn-next") {
      if (_currentIndex < _experiences.length - 1) {
        _showExperience(_currentIndex + 1);
        _updateList();
      }
      return;
    }
    if (e.target.id === "btn-prev") {
      if (_currentIndex > 0) {
        _showExperience(_currentIndex - 1);
        _updateList();
      }
      return;
    }

    // Swap languages
    if (e.target.id === "swap-langs") {
      swapLangs();
      return;
    }

    // Curriculum switcher
    if (e.target.classList.contains("curriculum-btn")) {
      _switchCurriculum(e.target.dataset.curriculum);
      return;
    }

    // Review sidebar button
    if (e.target.classList.contains("sidebar-review")) {
      _enterReview();
      return;
    }

    // Review: back to lessons
    if (e.target.dataset.action === "back-to-exp") {
      _saveReviewNow();
      _exitReview();
      return;
    }

    // Review: export
    if (e.target.dataset.action === "export-review") {
      _exportReview();
      return;
    }

    // Review: reset
    if (e.target.dataset.action === "reset-review") {
      if (!confirm("Reset all your Pass 1 answers?")) return;
      localStorage.removeItem(REVIEW_KEY);
      document.getElementById("app").innerHTML = _renderReview();
      return;
    }

    // Review: radio change (delegated via click on label for mobile)
    if (e.target.dataset.review) {
      _saveReviewNow();
      const state = _loadReview();
      const total = REVIEW_DATA.reduce((s, e) => s + e.phrases.length, 0);
      const done = _reviewDone(state);
      const prog = document.querySelector(".review-progress");
      if (prog) prog.textContent = done + " / " + total;
      return;
    }

    // Experience list items
    const item = e.target.closest(".exp-list-item");
    if (item) {
      const idx = parseInt(item.dataset.index, 10);
      if (!isNaN(idx)) {
        _reviewMode = false;
        _showExperience(idx);
        _updateList();
        document.getElementById("sidebar").classList.remove("open");
      }
      return;
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "lang-selector-a") {
      setPanelALang(e.target.value);
    }
    if (e.target.id === "lang-selector-b") {
      setPanelBLang(e.target.value);
    }
    if (e.target.id === "voice-selector-a") {
      Audio.setVoicePackage(_panelALang, e.target.value);
      Session.log("voice_package_changed", { lang: _panelALang, package: e.target.value });
    }
    if (e.target.id === "voice-selector-b") {
      Audio.setVoicePackage(_panelBLang, e.target.value);
      Session.log("voice_package_changed", { lang: _panelBLang, package: e.target.value });
    }
    // Review textareas
    if (e.target.id === "review-missing" || e.target.id === "review-notes") {
      _saveReviewNow();
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "review-missing" || e.target.id === "review-notes") {
      _saveReviewNow();
    }
  });

  function _updateList() {
    document.querySelectorAll(".exp-list-item").forEach((el, i) => {
      el.classList.toggle("active", !_reviewMode && i === _currentIndex);
    });
    const rb = document.querySelector(".sidebar-review");
    if (rb) rb.classList.toggle("active", _reviewMode);
  }

  // Sidebar toggle
  document.addEventListener("click", (e) => {
    if (e.target.id === "menu-toggle" || e.target.closest("#menu-toggle")) {
      document.getElementById("sidebar").classList.toggle("open");
    }
    if (e.target.id === "sidebar-overlay") {
      document.getElementById("sidebar").classList.remove("open");
    }
  });

  return { init, setPanelALang, setPanelBLang, swapLangs };
})();

document.addEventListener("DOMContentLoaded", () => App.init());
