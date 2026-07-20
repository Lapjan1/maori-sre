/**
 * River World — Main Application
 */
const App = (() => {
  let _currentIndex = 0;
  let _currentLang = "en";
  let _experiences = [];

  function init() {
    _experiences = window.EXPERIENCES || [];
    if (!_experiences.length) {
      document.getElementById("app").innerHTML =
        '<p style="padding:2rem;text-align:center;">No experiences found.</p>';
      return;
    }
    Audio.init();
    _restoreLang();
    _populateVoicePackages();
    _renderExperienceList();
    _showExperience(0);
    Session.log("app_started", { totalExperiences: _experiences.length });
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
                ? `<button class="btn-audio" data-text="${_escape(s)}" data-lang="${_currentLang}" title="Listen">\u25B6</button>`
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
    container.innerHTML = _experiences
      .map(
        (exp, i) => `
      <button class="exp-list-item ${i === _currentIndex ? "active" : ""}"
              data-index="${i}">
        <span class="exp-list-title">${_escape(exp.title["en"] || exp.id)}</span>
        <span class="exp-list-type">${exp.type} · Level ${exp.level}</span>
      </button>`
      )
      .join("");
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
      if (text) {
        Audio.speak(text, lang);
        Session.log("audio_played", { text, lang, experience_id: _experiences[_currentIndex]?.id });
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

    // Experience list items
    const item = e.target.closest(".exp-list-item");
    if (item) {
      const idx = parseInt(item.dataset.index, 10);
      if (!isNaN(idx)) {
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
  });

  function _updateList() {
    const items = document.querySelectorAll(".exp-list-item");
    items.forEach((el, i) => {
      el.classList.toggle("active", i === _currentIndex);
    });
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
