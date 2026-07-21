/**
 * River World — Main Application
 */
const App = (() => {
  let _currentIndex = 0;
  let _currentLang = "en";
  let _experiences = [];
  let _reviewMode = false;
  let _activeCurriculum = "river_world";

  const REVIEW_KEY = "river_world_pass1";
  const CURRICULUM_KEY = "river_world_curriculum";

  function _getCurriculumName() {
    return _activeCurriculum === "wife_core_20" ? "Wife's Course" : "River World";
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
      if (saved) _currentLang = saved;
    } catch (e) { /* ignore */ }
  }

  function _saveLang() {
    try { localStorage.setItem("river_world_lang", _currentLang); } catch (e) { /* ignore */ }
  }

  function setLang(lang) {
    _currentLang = lang;
    _saveLang();
    document.getElementById("lang-selector").value = lang;
    _populateVoicePackages();
    _showExperience(_currentIndex);
    Session.log("language_changed", { lang });
  }

  function _populateVoicePackages() {
    const sel = document.getElementById("voice-selector");
    if (!sel) return;
    sel.innerHTML = "";
    const pkgs = Audio.getAvailablePackages(_currentLang);
    if (pkgs.length <= 1) {
      sel.style.display = "none";
      return;
    }
    sel.style.display = "";
    const current = Audio.getVoicePackage(_currentLang);
    pkgs.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      if (p.id === current) opt.selected = true;
      sel.appendChild(opt);
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
      lang: _currentLang,
    });
  }

  function _renderExperience(exp) {
    const title = exp.title[_currentLang] || exp.title["en"] || exp.id;
    const content = exp.content[_currentLang] || exp.content["en"] || "";
    const enContent = exp.content["en"] || "";
    const typeLabel = exp.type.charAt(0).toUpperCase() + exp.type.slice(1);

    const sentences = content
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const enSentences = enContent
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const hasAudio = "speechSynthesis" in window;

    return `
      <div class="exp-header">
        <span class="exp-type">${typeLabel} · Level ${exp.level}</span>
        <span class="exp-id">${exp.id}</span>
      </div>
      <h1 class="exp-title">${_escape(title)}</h1>
      ${exp.situation
        ? `<div class="exp-situation">${_escape(exp.situation[_currentLang] || exp.situation.en || exp.situation)}</div>`
        : ""}
      <div class="exp-content">
        ${sentences
          .map(
            (s, i) => `
          <div class="sentence-row">
            <p class="sentence">${_renderSentenceChips(s, exp.entities, _currentLang)}</p>
            <div class="sentence-meta">
              ${enSentences[i] && _currentLang !== "en"
                ? `<span class="sentence-en">${_escape(enSentences[i])}</span>`
                : ""}
              ${hasAudio
                ? `<button class="btn-audio" data-text="${_escape(s)}" data-lang="${_currentLang}" data-phrase-id="${_escape(exp.phrase_id || "")}" title="Listen">\u25B6</button>`
                : ""}
            </div>
          </div>`
          )
          .join("")}
      </div>
      <div class="exp-entities">
        <h3>Words in this experience</h3>
        <div class="entity-grid">
          ${exp.entities
            .map(
              (e) => {
                const sf = _lookupSurfaceForm(e.entity_id || e.id, _currentLang);
                const pron = sf?.pronunciation;
                return `
            <div class="entity-card">
              <span class="entity-label">${_escape(_entityLabel(e, _currentLang))}</span>
              <span class="entity-cat">${e.category}</span>
              ${_currentLang !== "en"
                ? `<span class="entity-en">${_escape(_entityLabel(e, "en"))}</span>`
                : ""}
              ${_currentLang === "en" && e.label["mi"]
                ? `<span class="entity-native">mi: ${_escape(e.label["mi"])}</span>`
                : ""}
              ${_currentLang === "en" && e.label["af"]
                ? `<span class="entity-native">af: ${_escape(e.label["af"])}</span>`
                : ""}
              ${pron?.ipa ? `<span class="entity-ipa">${_escape(pron.ipa)}</span>` : ""}
              ${pron?.syllables?.length ? `<span class="entity-syllables">${_escape(pron.syllables.join(" · "))}</span>` : ""}
              ${pron?.audio_refs?.length
                ? `<button class="btn-audio-sm" data-entity="${_escape(e.entity_id || e.id)}" data-lang="${_currentLang}" title="Listen">\u25B6</button>`
                : ""}
            </div>`;
              }
            )
            .join("")}
        </div>
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
    if (_activeCurriculum !== "river_world") {
      html += `<div class="curriculum-label">${_escape(_getCurriculumName())} · ${_experiences.length} items</div>`;
    }
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
    if (_activeCurriculum === "river_world") {
      html += `<hr class="sidebar-divider">`;
      html += `<button class="sidebar-review ${_reviewMode ? "active" : ""}" data-action="review">Pass 1 Review</button>`;
    }
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

    // Inline word chips — same as entity audio
    if (e.target.classList.contains("word-chip")) {
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
    if (e.target.id === "lang-selector") {
      setLang(e.target.value);
    }
    if (e.target.id === "voice-selector") {
      Audio.setVoicePackage(_currentLang, e.target.value);
      Session.log("voice_package_changed", { lang: _currentLang, package: e.target.value });
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

  return { init, setLang };
})();

document.addEventListener("DOMContentLoaded", () => App.init());
