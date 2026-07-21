/**
 * Voice Contributor — Recorder
 * Phase 1: local recording, playback, re-record, download bundle
 * Supports: Words (surface forms) and Phrases (full sentences from courses)
 */
const Recorder = (() => {
  /* ---------- state ---------- */
  let _mediaRecorder = null;
  let _audioChunks = [];
  let _recordedBlob = null;
  let _recordedUrl = null;
  let _startTime = 0;
  let _timerInterval = null;
  let _contributionCount = 0;
  let _currentMode = "words";
  let _currentItemMeta = null;

  const _CONTRIB_PREFIX = "VC";
  const _langNames = { mi: "M\u0101ori", en: "English", af: "Afrikaans" };

  /* ---------- DOM refs ---------- */
  const $ = (id) => document.getElementById(id);
  const modeSel = $("mode-selector");
  const langSel = $("lang-selector");
  const sourceSel = $("source-selector");
  const phraseSel = $("phrase-selector");
  const counter = $("counter");
  const welcome = $("welcome");
  const cardContainer = $("card-container");
  const phraseLang = $("phrase-lang");
  const phraseId = $("phrase-id");
  const phraseText = $("phrase-text");
  const phraseTranslation = $("phrase-translation");
  const phraseNotes = $("phrase-notes");
  const btnRef = $("btn-reference");
  const btnRecord = $("btn-record");
  const btnStop = $("btn-stop");
  const btnPlay = $("btn-play");
  const btnReRecord = $("btn-rerecord");
  const btnDownload = $("btn-download");
  const timerEl = $("timer");
  const statusEl = $("status");
  const metaSection = $("metadata-section");
  const speakerName = $("speaker-name");
  const speakerNative = $("speaker-native");
  const speakerRegion = $("speaker-region");
  const speakerAge = $("speaker-age");
  const consentCheck = $("consent-check");
  const bundlePreview = $("bundle-preview");
  const yamlPreview = $("yaml-preview");
  const correctionSection = $("correction-section");
  const correctionField = $("correction-field");
  const btnNext = $("btn-next");

  /* ---------- init ---------- */
  function init() {
    _populateLanguages();
    modeSel.addEventListener("change", _onModeChange);
    langSel.addEventListener("change", _onLangChange);
    sourceSel.addEventListener("change", _onSourceChange);
    phraseSel.addEventListener("change", _onPhraseChange);
    btnRef.addEventListener("click", _playReference);
    btnRecord.addEventListener("click", _startRecording);
    btnStop.addEventListener("click", _stopRecording);
    btnPlay.addEventListener("click", _playRecording);
    btnReRecord.addEventListener("click", _resetRecording);
    btnDownload.addEventListener("click", _downloadBundle);
    btnNext.addEventListener("click", _nextCard);
    consentCheck.addEventListener("change", _updateDownloadState);
    _setStatus("Choose a mode and language to start", "info");
  }

  /* ---------- language / mode ---------- */
  function _populateLanguages() {
    if (typeof DEFAULT_VOICE_PACKAGES === "undefined") return;
    Object.keys(DEFAULT_VOICE_PACKAGES).forEach((code) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = _langNames[code] || code.toUpperCase();
      langSel.appendChild(opt);
    });
  }

  function _onModeChange() {
    _currentMode = modeSel.value;
    _resetRecording();
    _currentItemMeta = null;
    phraseSel.innerHTML = '<option value="">Select phrase</option>';
    welcome.style.display = "block";
    cardContainer.style.display = "none";
    sourceSel.style.display = _currentMode === "phrases" ? "inline-block" : "none";
    if (_currentMode === "phrases") {
      _populateSources();
    }
    _setStatus(`Switched to ${_currentMode} mode`, "info");
  }

  function _populateSources() {
    sourceSel.innerHTML = '<option value="">Select course</option>';
    if (typeof EXPERIENCES !== "undefined") {
      const opt = document.createElement("option");
      opt.value = "river_world";
      opt.textContent = "River World";
      sourceSel.appendChild(opt);
    }
    if (typeof CORE_20 !== "undefined") {
      const opt = document.createElement("option");
      opt.value = "wife_core_20";
      opt.textContent = "Wife's Core 20";
      sourceSel.appendChild(opt);
    }
    if (typeof AF_PHRASES !== "undefined") {
      const opt = document.createElement("option");
      opt.value = "af_phrases";
      opt.textContent = "Afrikaans Phrases";
      sourceSel.appendChild(opt);
    }
  }

  function _onLangChange() {
    const lang = langSel.value;
    if (!lang) return;
    _resetRecording();
    phraseSel.innerHTML = '<option value="">Select phrase</option>';
    if (_currentMode === "words") {
      _loadWords(lang);
    } else {
      _loadPhrases(lang);
    }
  }

  function _onSourceChange() {
    const lang = langSel.value;
    if (!lang) return;
    _loadPhrases(lang);
  }

  /* ---------- load words (surface forms) ---------- */
  function _loadWords(lang) {
    const sfs = typeof SURFACE_FORMS !== "undefined" ? SURFACE_FORMS : {};
    const matches = Object.values(sfs).filter((sf) => sf.lang === lang);
    matches.sort((a, b) => (a.text || "").localeCompare(b.text || ""));
    matches.forEach((sf) => {
      const en = sf.translations && sf.translations.en ? " \u2014 " + sf.translations.en : "";
      const opt = document.createElement("option");
      opt.value = sf.id;
      opt.textContent = (sf.text || sf.id) + en;
      phraseSel.appendChild(opt);
    });
    _setStatus(`${matches.length} words available for ${_langNames[lang] || lang}`, "info");
  }

  /* ---------- load phrases (from courses) ---------- */
  function _loadPhrases(lang) {
    const source = sourceSel.value;
    let phrases = [];
    if (source === "river_world" && typeof EXPERIENCES !== "undefined") {
      phrases = _extractPhrases(EXPERIENCES, lang, source);
    } else if (source === "wife_core_20" && typeof CORE_20 !== "undefined") {
      phrases = _extractPhrases(CORE_20, lang, source);
    } else if (source === "af_phrases" && typeof AF_PHRASES !== "undefined") {
      phrases = AF_PHRASES.filter(function(p) { return p.lang === lang; }).map(function(p) {
        return { id: p.id, text: p.text, translation: p.translation_en, source_experience: p.id, source_course: "af_phrases", semantic_intent: p.intent || "" };
      });
    }
    if (!phrases.length) {
      _setStatus(`No ${_langNames[lang] || lang} phrases found for this course`, "info");
      return;
    }
    phrases.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.text + (p.translation ? " \u2014 " + p.translation : "");
      phraseSel.appendChild(opt);
    });
    _setStatus(`${phrases.length} phrases available for ${_langNames[lang] || lang}`, "info");
  }

  function _extractPhrases(experiences, lang, sourceId) {
    const result = [];
    experiences.forEach((exp) => {
      const content = exp.content && (exp.content[lang] || exp.content["en"]);
      const enContent = exp.content && exp.content["en"];
      if (!content) return;
      const lines = content.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      const enLines = enContent ? enContent.split("\n").map((l) => l.trim()).filter((l) => l.length > 0) : [];
      const keyPhrase = lines[lines.length - 1] || content;
      const enPhrase = enLines[enLines.length - 1] || enContent || "";
      result.push({
        id: exp.phrase_id || exp.id,
        text: keyPhrase,
        translation: enPhrase,
        source_experience: exp.id,
        source_course: sourceId,
        semantic_intent: exp.phrase_id || "",
      });
    });
    return result;
  }

  /* ---------- show selected item ---------- */
  function _onPhraseChange() {
    const id = phraseSel.value;
    if (!id) {
      cardContainer.style.display = "none";
      welcome.style.display = "block";
      return;
    }
    welcome.style.display = "none";
    cardContainer.style.display = "block";

    let item = null;
    if (_currentMode === "words") {
      item = typeof SURFACE_FORMS !== "undefined" ? SURFACE_FORMS[id] : null;
    } else {
      const source = sourceSel.value;
      let items = [];
      if (source === "wife_core_20" && typeof CORE_20 !== "undefined") {
        items = CORE_20;
      } else if (source === "af_phrases" && typeof AF_PHRASES !== "undefined") {
        items = AF_PHRASES;
      } else if (typeof EXPERIENCES !== "undefined") {
        items = EXPERIENCES;
      }
      const found = items.find((e) => (e.phrase_id || e.id) === id);
      if (found) {
        if (source === "af_phrases") {
          item = {
            id: found.id,
            text: found.text,
            translation: found.translation_en || "",
            notes: found.situation || "",
            source_course: "af_phrases",
            source_experience: found.id,
            semantic_intent: found.intent || "",
          };
        } else {
          const lang = langSel.value;
          const content = found.content && (found.content[lang] || found.content["en"]);
          const enContent = found.content && found.content["en"];
          const lines = content ? content.split("\n").map((l) => l.trim()).filter((l) => l.length > 0) : [];
          const enLines = enContent ? enContent.split("\n").map((l) => l.trim()).filter((l) => l.length > 0) : [];
          item = {
            id: found.phrase_id || found.id,
            text: lines[lines.length - 1] || content || "",
            translation: enLines[enLines.length - 1] || enContent || "",
            notes: found.situation || "",
            source_course: source,
            source_experience: found.id,
            semantic_intent: found.phrase_id || "",
          };
        }
      }
    }
    if (!item) return;
    _currentItemMeta = item;

    phraseLang.textContent = _langNames[langSel.value] || langSel.value;
    phraseId.textContent = item.id;
    phraseText.textContent = item.text || item.id;
    phraseTranslation.textContent = _currentMode === "words"
      ? (item.translations ? item.translations.en || "" : "")
      : (item.translation || "");
    phraseNotes.textContent = _currentMode === "words"
      ? (item.notes || item.context || "")
      : (item.notes || "");
    correctionSection.style.display = _currentMode === "words" ? "block" : "none";
    correctionField.value = "";
    _resetRecording();
    _setStatus("Click Record when ready", "info");
  }

  /* ---------- reference audio ---------- */
  function _playReference() {
    const text = phraseText.textContent;
    if (!text) return;
    if (_currentMode === "words") {
      const sfId = phraseSel.value;
      const sf = typeof SURFACE_FORMS !== "undefined" ? SURFACE_FORMS[sfId] : null;
      const refs = sf && sf.pronunciation && sf.pronunciation.audio_refs ? sf.pronunciation.audio_refs : [];
      const bestRef = refs.find((r) => r.quality !== "tts") || refs[0];
      if (bestRef) {
        _playNative(bestRef, text);
        return;
      }
    }
    _tryTts(text, langSel.value);
  }

  function _playNative(ref, fallbackText) {
    const lang = langSel.value;
    const pkgId = ref.package;
    const pkg = typeof VOICE_PACKAGES !== "undefined" ? VOICE_PACKAGES[pkgId] : null;
    const basePath = pkg ? pkg.base_path : "audio/";
    const fullPath = "../../apps/river-world/" + basePath + ref.ref;
    fetch(fullPath)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.arrayBuffer();
      })
      .then((buf) => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx.decodeAudioData(buf);
      })
      .then((decoded) => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(ctx.destination);
        src.start(0);
        _setStatus("Playing reference...", "info");
      })
      .catch(() => {
        _tryTts(fallbackText, lang);
      });
  }

  function _tryTts(text, lang) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const map = { mi: "mi-NZ", en: "en-US", af: "af-ZA" };
      u.lang = map[lang] || lang;
      u.rate = 0.9;
      speechSynthesis.speak(u);
      _setStatus("Playing reference (TTS)...", "info");
    } else {
      _setStatus("No audio available for this phrase", "error");
    }
  }

  /* ---------- recording ---------- */
  async function _startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return _setStatus("Recording not supported in this browser", "error");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      _audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      _mediaRecorder = new MediaRecorder(stream, { mimeType });
      _mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) _audioChunks.push(e.data);
      };
      _mediaRecorder.onstop = _onRecordingComplete;
      _mediaRecorder.start();
      _startTime = Date.now();
      _startTimer();
      btnRecord.style.display = "none";
      btnStop.style.display = "inline-block";
      btnRecord.classList.add("recording");
      _setStatus("Recording...", "info");
    } catch (err) {
      _setStatus("Microphone access denied. Please allow microphone access.", "error");
    }
  }

  function _stopRecording() {
    if (_mediaRecorder && _mediaRecorder.state !== "inactive") {
      _mediaRecorder.stop();
      _mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    }
    _stopTimer();
    btnStop.style.display = "none";
    btnRecord.classList.remove("recording");
  }

  function _onRecordingComplete() {
    const blob = new Blob(_audioChunks, { type: _mediaRecorder.mimeType });
    _recordedBlob = blob;
    _recordedUrl = URL.createObjectURL(blob);
    btnRecord.style.display = "none";
    btnPlay.style.display = "inline-block";
    btnReRecord.style.display = "inline-block";
    metaSection.style.display = "block";
    _setStatus(`Recording complete: ${(blob.size / 1024).toFixed(0)} KB`, "success");
    _updateDownloadState();
  }

  function _resetRecording() {
    _stopTimer();
    if (_mediaRecorder && _mediaRecorder.state !== "inactive") {
      _mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      _mediaRecorder.stop();
    }
    if (_recordedUrl) { URL.revokeObjectURL(_recordedUrl); _recordedUrl = null; }
    _recordedBlob = null;
    _audioChunks = [];
    btnRecord.style.display = "inline-block";
    btnStop.style.display = "none";
    btnPlay.style.display = "none";
    btnReRecord.style.display = "none";
    btnRecord.classList.remove("recording");
    metaSection.style.display = "none";
    bundlePreview.style.display = "none";
    btnNext.style.display = "none";
    btnDownload.disabled = true;
  }

  function _playRecording() {
    if (!_recordedUrl) return;
    const audio = new Audio(_recordedUrl);
    audio.play();
    _setStatus("Playing your recording...", "info");
    audio.onended = () => _setStatus("", "");
  }

  /* ---------- timer ---------- */
  function _startTimer() {
    _stopTimer();
    _timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - _startTime) / 1000);
      timerEl.textContent = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
    }, 200);
  }
  function _stopTimer() {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  }

  /* ---------- download ---------- */
  function _generateId() {
    _contributionCount++;
    const ts = Date.now().toString(36).toUpperCase();
    return `${_CONTRIB_PREFIX}_${ts}`;
  }

  function _buildYaml(contribId, itemId) {
    const lang = langSel.value;
    const ext = _recordedBlob.type.includes("webm") ? "webm" : "wav";
    const text = phraseText.textContent;
    const translation = phraseTranslation.textContent;
    const mode = _currentMode;
    const meta = _currentItemMeta;
    const isPhrase = mode === "phrases";
    const correction = correctionField.value.trim();
    let prov = "";
    if (isPhrase && meta) {
      prov = `  type: phrase
  semantic_intent: ${meta.semantic_intent || ""}
  source_course: ${meta.source_course || ""}
  source_experience: ${meta.source_experience || ""}
`;
    }
    let extra = "";
    if (correction) {
      extra = `  correction_suggested: ${correction}
`;
    }
    return `contribution:
  id: ${contribId}
  type: ${isPhrase ? "phrase" : "word"}
  ref_id: ${itemId}
  language: ${lang}
${prov}${extra}  text: ${text}
  translation_en: ${translation}
  recording:
    filename: ${contribId}.${ext}
    format: ${_recordedBlob.type}
    size_bytes: ${_recordedBlob.size}
  speaker:
    name: ${speakerName.value.trim() || "anonymous"}
    native: ${speakerNative.value || "unspecified"}
    region: ${speakerRegion.value.trim() || ""}
    age_range: ${speakerAge.value || "unspecified"}
  consent:
    license: CC-BY-4.0
    confirmed: ${consentCheck.checked}
  review:
    status: pending
`;
  }

  function _updateDownloadState() {
    btnDownload.disabled = !(_recordedBlob && consentCheck.checked);
  }

  function _downloadBundle() {
    if (!_recordedBlob) return;
    const itemId = phraseSel.value;
    if (!itemId) return;
    const contribId = _generateId();
    const ext = _recordedBlob.type.includes("webm") ? "webm" : "wav";
    const yaml = _buildYaml(contribId, itemId);

    yamlPreview.textContent = yaml;
    bundlePreview.style.display = "block";

    const audioLink = document.createElement("a");
    audioLink.href = _recordedUrl;
    audioLink.download = `${contribId}.${ext}`;
    audioLink.click();

    const yamlBlob = new Blob([yaml], { type: "text/yaml;charset=utf-8" });
    const yamlUrl = URL.createObjectURL(yamlBlob);
    const yamlLink = document.createElement("a");
    yamlLink.href = yamlUrl;
    yamlLink.download = `${contribId}.yaml`;
    yamlLink.click();
    URL.revokeObjectURL(yamlUrl);

    btnNext.style.display = "inline-block";
    _setStatus(`Contribution ${contribId} downloaded.`, "success");
  }

  function _nextCard() {
    const opts = phraseSel.querySelectorAll("option");
    const currentIdx = phraseSel.selectedIndex;
    if (currentIdx < opts.length - 1) {
      phraseSel.selectedIndex = currentIdx + 1;
    } else {
      phraseSel.selectedIndex = 0;
    }
    btnNext.style.display = "none";
    bundlePreview.style.display = "none";
    _onPhraseChange();
  }

  /* ---------- helpers ---------- */
  function _setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = "recording-status" + (type ? " " + type : "");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Recorder.init);
