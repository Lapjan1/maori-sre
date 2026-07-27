/**
 * Voice Contributor — Recorder
 * Phase 1: local recording, playback, re-record, download bundle
 * Supports: Words (surface forms), Phrases and Readings (from unified EXPERIENCES)
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
  let _queueItems = [];
  let _queueIndex = -1;

  const _CONTRIB_PREFIX = "VC";
  const _langNames = { mi: "Māori", en: "English", af: "Afrikaans" };

  /* ---------- DOM refs ---------- */
  const $ = (id) => document.getElementById(id);
  const modeSel = $("mode-selector");
  const langSel = $("lang-selector");
  const phraseSel = $("phrase-selector");
  const counter = $("counter");
  const welcome = $("welcome");
  const cardContainer = $("card-container");
  const phraseLang = $("phrase-lang");
  const phraseId = $("phrase-id");
  const phraseContext = $("phrase-context");
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
  const btnFolder = $("btn-folder");
  const folderPath = $("folder-path");
  let _dirHandle = null;
  let _dirName = "";

  /* ---------- init ---------- */
  function init() {
    _populateLanguages();
    _populateVoiceTypes();
    modeSel.addEventListener("change", _onModeChange);
    langSel.addEventListener("change", _onLangChange);
    phraseSel.addEventListener("change", _onPhraseChange);
    btnRef.addEventListener("click", _playReference);
    btnRecord.addEventListener("click", _startRecording);
    btnStop.addEventListener("click", _stopRecording);
    btnPlay.addEventListener("click", _playRecording);
    btnReRecord.addEventListener("click", _resetRecording);
    btnDownload.addEventListener("click", _downloadBundle);
    btnNext.addEventListener("click", _nextCard);
    btnFolder.addEventListener("click", _pickFolder);
    $("btn-jump-queue").addEventListener("click", _jumpToQueue);
    consentCheck.addEventListener("change", _updateDownloadState);
    _setStatus("Choose a mode and language to start", "info");
  }

  /* ---------- voice types ---------- */
  function _populateVoiceTypes() {
    const vt = typeof AudioCoverage !== "undefined" ? AudioCoverage.VOICE_TYPES : [];
    const labels = typeof AudioCoverage !== "undefined" ? AudioCoverage.VOICE_LABELS : {};
    const sel = $("voice-selector");
    sel.innerHTML = '<option value="male_adult">Male adult</option><option value="">All voices</option>';
    vt.forEach((v) => {
      if (v === "male_adult") return;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = labels[v] || v;
      sel.appendChild(opt);
    });
  }

  function _resolveVoiceType(raw) {
    return raw || "male_adult";
  }

  /* ---------- language support ---------- */
  function _populateLanguages() {
    if (typeof DEFAULT_VOICE_PACKAGES === "undefined") return;
    Object.keys(DEFAULT_VOICE_PACKAGES).forEach((code) => {
      if (code === "en") return;
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
    _loadItems(langSel.value);
    _setStatus("Switched to " + _currentMode + " mode", "info");
  }

  function _selectedVoiceType() {
    return _resolveVoiceType($("voice-selector").value);
  }

  function _onLangChange() {
    const lang = langSel.value;
    if (!lang) return;
    _resetRecording();
    phraseSel.innerHTML = '<option value="">Select phrase</option>';
    $("coverage-panel").style.display = "none";
    _refreshCoverage();
    _loadItems(lang);
  }

  function _loadItems(lang) {
    if (!lang) return;
    if (_currentMode === "words") {
      _loadWords(lang);
    } else if (_currentMode === "readings") {
      _loadReadings(lang);
    } else {
      _loadPhrases(lang);
    }
  }

  function _refreshCoverage() {
    const lang = langSel.value;
    if (!lang || typeof AudioCoverage === "undefined") return;
    const vt = $("voice-selector").value || null;
    const voiceType = vt || "male_adult";
    const missing = AudioCoverage.recordingQueue(lang, voiceType);
    const legacy = AudioCoverage.legacyQueue(lang, voiceType);
    const queue = missing.concat(legacy);
    _queueItems = queue;
    _queueIndex = -1;

    const panel = $("coverage-panel");
    const list = $("coverage-list");
    const stats = $("coverage-stats");
    const c = AudioCoverage.coverage(lang);
    var pctDisplay = Math.round((c.withAudio / Math.max(c.total, 1)) * 100);
    stats.textContent = c.withAudio + "/" + c.total + " (" + pctDisplay + "%)";
    if (!queue.length) {
      list.innerHTML = '<div class="coverage-empty">✓ All items recorded for this voice</div>';
      panel.style.display = "block";
      return;
    }
    const voiceLabel = vt ? (AudioCoverage.VOICE_LABELS[voiceType] || voiceType) : "any voice";
    list.innerHTML = "<h4>Need recording for " + voiceLabel + " (" + queue.length + ")</h4>";
    const ul = document.createElement("ul");
    ul.className = "queue-list";
    queue.slice(0, 50).forEach(function(item) {
      const li = document.createElement("li");
      li.textContent = item.text;
      li.dataset.entityId = item.entityId;
      li.dataset.sfId = item.surfaceFormId;
      li.addEventListener("click", function() {
        _selectQueueItem(item);
      });
      ul.appendChild(li);
    });
    list.appendChild(ul);
    if (queue.length > 50) {
      var more = document.createElement("p");
      more.className = "coverage-more";
      more.textContent = "+ " + (queue.length - 50) + " more";
      list.appendChild(more);
    }
    panel.style.display = "block";
  }

  function _selectQueueItem(item) {
    const sel = phraseSel;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === item.surfaceFormId || sel.options[i].textContent.indexOf(item.text) !== -1) {
        sel.selectedIndex = i;
        _onPhraseChange();
        break;
      }
    }
  }

  function _jumpToQueue() {
    _queueIndex++;
    if (_queueIndex >= _queueItems.length) _queueIndex = 0;
    if (_queueItems[_queueIndex]) {
      _selectQueueItem(_queueItems[_queueIndex]);
    }
  }

  /* Check if a surface form needs recording for the given voice type */
  function _needsRecording(sf, voiceType) {
    if (!sf || !sf.pronunciation || !sf.pronunciation.audio_refs) return true;
    var refs = sf.pronunciation.audio_refs.filter(function(r) { return r.quality !== "tts"; });
    if (!refs.length) return true;
    if (!voiceType) return false;
    return !refs.some(function(r) { return r.voice_type === voiceType; });
  }

  /* Check if an entity's surface form for a given language needs recording */
  function _entityNeedsRecording(entityId, lang, voiceType) {
    if (typeof SURFACE_FORM_INDEX === "undefined" || typeof SURFACE_FORMS === "undefined") return true;
    var sfId = SURFACE_FORM_INDEX[entityId] && SURFACE_FORM_INDEX[entityId][lang];
    if (!sfId) return true;
    return _needsRecording(SURFACE_FORMS[sfId], voiceType);
  }

  /* ---------- load words (surface forms) ---------- */
  function _loadWords(lang) {
    if (typeof SURFACE_FORMS === "undefined") return;
    var vt = _selectedVoiceType();
    var matches = Object.values(SURFACE_FORMS).filter(function(sf) {
      if (sf.lang !== lang) return false;
      if (!_needsRecording(sf, vt)) return false;
      /* Economy filter: skip PHRASE entities covered by PhraseComposer decomposition */
      if (typeof PhraseComposer !== "undefined" && PhraseComposer.hasComposition(sf.entity_id)) return false;
      return true;
    });
    matches.sort(function(a, b) { return (a.text || "").localeCompare(b.text || ""); });
    matches.forEach(function(sf) {
      var en = sf.translations && sf.translations.en ? " — " + sf.translations.en : "";
      var opt = document.createElement("option");
      opt.value = sf.id;
      opt.textContent = (sf.text || sf.id) + en;
      phraseSel.appendChild(opt);
    });
    _setStatus(matches.length + " words need recording for " + (_langNames[lang] || lang), "info");
  }

  /* ---------- load phrases (from unified EXPERIENCES) ---------- */
  function _loadPhrases(lang) {
    if (typeof EXPERIENCES === "undefined") return;
    var vt = _selectedVoiceType();
    const exps = EXPERIENCES;
    if (!exps.length) {
      _setStatus("No " + (_langNames[lang] || lang) + " phrases found", "info");
      return;
    }
    exps.forEach(function(exp) {
      if (!exp.entities || !exp.entities.length) return;
      var primaryEntity = exp.entities[0];
      var entityId = primaryEntity.entity_id || primaryEntity.id;
      if (!_entityNeedsRecording(entityId, lang, vt)) return;
      var label = _expTargetLabel(exp, lang);
      if (!label) return;
      var en = exp.title && exp.title.en ? " — " + exp.title.en : "";
      var opt = document.createElement("option");
      opt.value = exp.phrase_id || exp.id;
      opt.textContent = label + en;
      phraseSel.appendChild(opt);
    });
    if (phraseSel.options.length <= 1) {
      _setStatus("No " + (_langNames[lang] || lang) + " phrase labels found for this curriculum", "info");
    } else {
      _setStatus((phraseSel.options.length - 1) + " phrases need recording for " + (_langNames[lang] || lang), "info");
    }
  }

  /* ---------- load readings (full passages from unified EXPERIENCES) ---------- */
  function _loadReadings(lang) {
    if (typeof EXPERIENCES === "undefined") return;
    const exps = EXPERIENCES;
    if (!exps.length) {
      _setStatus("No " + (_langNames[lang] || lang) + " readings found", "info");
      return;
    }
    exps.forEach(function(exp) {
      var content = exp.content && (exp.content[lang] || exp.content["en"]);
      if (!content) return;
      var opt = document.createElement("option");
      opt.value = exp.phrase_id || exp.id;
      opt.textContent = (exp.title && exp.title[lang]) || (exp.title && exp.title["en"]) || exp.id;
      phraseSel.appendChild(opt);
    });
    _setStatus(exps.length + " readings available for " + (_langNames[lang] || lang), "info");
  }

  /* Return the target-language label for an experience's key phrase */
  function _expTargetLabel(exp, lang) {
    var title = exp.title && (exp.title[lang] || exp.title["en"]);
    var entityLabel = _expPrimaryEntityLabel(exp, lang);
    return entityLabel || title || exp.id;
  }

  /* Find the primary entity label in the target language */
  function _expPrimaryEntityLabel(exp, lang) {
    if (!exp.entities || !exp.entities.length) return null;
    var primary = exp.entities[0];
    var label = primary.label || {};
    return label[lang] || label["default"] || label["en"] || null;
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
      const sf = typeof SURFACE_FORMS !== "undefined" ? SURFACE_FORMS[id] : null;
      if (sf) {
        item = {
          id: sf.id,
          entity_id: sf.entity_id || "",
          text: sf.text || "",
          translation: sf.translations ? sf.translations.en || "" : "",
          notes: sf.context || "",
          source_course: "river_world",
          semantic_intent: "",
          type: "word",
          exp_id: "",
          exp_level: "",
          exp_type: "",
        };
      }
    } else {
      if (typeof EXPERIENCES === "undefined") return;
      const found = EXPERIENCES.find(function(e) { return (e.phrase_id || e.id) === id; });
      if (!found) return;
      const lang = langSel.value;
      const content = found.content && (found.content[lang] || found.content["en"]);
      const enContent = found.content && found.content["en"];
      if (_currentMode === "readings") {
        item = {
          id: found.phrase_id || found.id,
          entity_id: "",
          text: content || "",
          translation: enContent || "",
          notes: found.situation || "",
          source_course: "river_world",
          source_experience: found.id,
          semantic_intent: found.phrase_id || "",
          type: "passage",
          exp_id: found.id,
          exp_level: found.level || "",
          exp_type: found.type || "",
        };
      } else {
        var label = _expTargetLabel(found, lang);
        const enTitle = found.title && found.title.en ? found.title.en : "";
        item = {
          id: found.phrase_id || found.id,
          entity_id: "",
          text: label || content || "",
          translation: enTitle || enContent || "",
          notes: found.situation || "",
          source_course: "river_world",
          source_experience: found.id,
          semantic_intent: found.phrase_id || "",
          type: "phrase",
          exp_id: found.id,
          exp_level: found.level || "",
          exp_type: found.type || "",
        };
      }
    }
    if (!item) return;
    _currentItemMeta = item;

    phraseLang.textContent = _langNames[langSel.value] || langSel.value;
    phraseId.textContent = item.id;
    phraseContext.textContent = item.exp_id
      ? (item.exp_id + (item.exp_level ? " · Level " + item.exp_level : "") + (item.exp_type ? " · " + item.exp_type : ""))
      : (item.source_course || "");
    phraseText.textContent = item.text || item.id;
    phraseTranslation.textContent = _currentMode === "words"
      ? (item.translation || "")
      : (item.translation || "");
    phraseNotes.textContent = _currentMode === "words"
      ? (item.notes || "")
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
    var candidates = [];
    if (window.location.pathname.indexOf("/apps/") !== -1) {
      candidates.push("../river-world/" + basePath + ref.ref);
    } else {
      candidates.push("../" + basePath + ref.ref);
      candidates.push("../../apps/river-world/" + basePath + ref.ref);
    }
    candidates.push(basePath + ref.ref);
    _tryFetchAudio(candidates, 0, fallbackText, lang);
  }

  function _tryFetchAudio(paths, idx, fallbackText, lang) {
    if (idx >= paths.length) {
      _tryTts(fallbackText, lang);
      return;
    }
    fetch(paths[idx])
      .then(function(r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.arrayBuffer();
      })
      .then(function(buf) {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx.decodeAudioData(buf);
      })
      .then(function(decoded) {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
        var src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(ctx.destination);
        src.start(0);
        _setStatus("Playing reference...", "info");
      })
      .catch(function() {
        _tryFetchAudio(paths, idx + 1, fallbackText, lang);
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
    _setStatus("Recording complete: " + (blob.size / 1024).toFixed(0) + " KB", "success");
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
      timerEl.textContent = Math.floor(elapsed / 60) + ":" + String(elapsed % 60).padStart(2, "0");
    }, 200);
  }
  function _stopTimer() {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  }

  /* ---------- download ---------- */
  function _generateId() {
    _contributionCount++;
    const ts = Date.now().toString(36).toUpperCase();
    return _CONTRIB_PREFIX + "_" + ts;
  }

  function _buildYamlEntry(contribId, itemId) {
    const lang = langSel.value;
    const ext = _recordedBlob.type.includes("webm") ? "webm" : "wav";
    const text = phraseText.textContent;
    const translation = phraseTranslation.textContent;
    const mode = _currentMode;
    const meta = _currentItemMeta;
    const isPhrase = mode === "phrases";
    const isReading = mode === "readings";
    const yamlType = isReading ? "passage" : isPhrase ? "phrase" : "word";
    const correction = correctionField.value.trim();
    let prov = "";
    if (meta) {
      prov += "  entity_id: " + (meta.entity_id || "") + "\n";
      prov += "  source_course: " + (meta.source_course || "") + "\n";
      if (meta.exp_id) {
        prov += "  experience_id: " + meta.exp_id + "\n";
        prov += "  experience_level: " + (meta.exp_level || "") + "\n";
      }
      if (isPhrase || isReading) {
        prov += "  type: " + yamlType + "\n";
        prov += "  semantic_intent: " + (meta.semantic_intent || "") + "\n";
        prov += "  source_experience: " + (meta.source_experience || "") + "\n";
      }
    }
    const voiceType = $("voice-selector").value || "";
    let extra = "";
    if (correction) {
      extra += "  correction_suggested: " + correction + "\n";
    }
    return "  - id: " + contribId + "\n" +
      "    type: " + yamlType + "\n" +
      "    ref_id: " + itemId + "\n" +
      "    language: " + lang + "\n" +
      prov + extra +
      "    text: " + text + "\n" +
      "    translation_en: " + translation + "\n" +
      "    voice_type: " + voiceType + "\n" +
      "    recording:\n" +
      "      filename: audio/" + contribId + "." + ext + "\n" +
      "      format: " + _recordedBlob.type + "\n" +
      "      size_bytes: " + _recordedBlob.size + "\n" +
      "    speaker:\n" +
      "      name: " + (speakerName.value.trim() || "anonymous") + "\n" +
      "      native: " + (speakerNative.value || "unspecified") + "\n" +
      "      region: " + (speakerRegion.value.trim() || "") + "\n" +
      "      age_range: " + (speakerAge.value || "unspecified") + "\n" +
      "    consent:\n" +
      "      license: CC-BY-4.0\n" +
      "      confirmed: " + consentCheck.checked + "\n" +
      "    review:\n" +
      "      status: pending\n";
  }

  function _updateDownloadState() {
    btnDownload.disabled = !(_recordedBlob && consentCheck.checked);
  }

  /* Read existing manifest, return text or null */
  async function _readManifest(dirHandle) {
    try {
      var fh = await dirHandle.getFileHandle("contributions.yaml");
      var file = await fh.getFile();
      return await file.text();
    } catch (e) {
      return null;
    }
  }

  /* Write manifest text to the directory */
  async function _writeManifest(dirHandle, text) {
    var fh = await dirHandle.getFileHandle("contributions.yaml", { create: true });
    var writable = await fh.createWritable();
    await writable.write(text);
    await writable.close();
  }

  /* Get or create audio/ subdirectory handle */
  async function _getAudioDir(dirHandle) {
    return await dirHandle.getDirectoryHandle("audio", { create: true });
  }

  async function _downloadBundle() {
    if (!_recordedBlob) return;
    const itemId = phraseSel.value;
    if (!itemId) return;
    const contribId = _generateId();
    const ext = _recordedBlob.type.includes("webm") ? "webm" : "wav";
    const yamlEntry = _buildYamlEntry(contribId, itemId);

    yamlPreview.textContent = yamlEntry;
    bundlePreview.style.display = "block";

    const audioFilename = contribId + "." + ext;
    const audioBlob = _recordedBlob;

    if (_dirHandle) {
      /* Save to chosen donations directory: audio/ subdir + single manifest */
      try {
        var audioDir = await _getAudioDir(_dirHandle);
        await _saveFileHandle(audioDir, audioFilename, audioBlob);

        /* Read / update / write manifest */
        var existing = await _readManifest(_dirHandle);
        var manifest;
        if (existing && existing.trim().length > 0) {
          manifest = existing.trimEnd() + "\n" + yamlEntry;
        } else {
          manifest = "# Contributions manifest\n" +
            "# Generated by Voice Contributor\n" +
            "# License: CC-BY-4.0\n" +
            "contributions:\n" + yamlEntry;
        }
        await _writeManifest(_dirHandle, manifest);

        _setStatus("Donation saved: " + audioFilename + " (manifest updated)", "success");
        btnNext.style.display = "inline-block";
        return;
      } catch (err) {
        _setStatus("Save to donations folder failed: " + err.message + " — falling back to download", "error");
      }
    }

    /* Fallback: download individual files */
    var yamlBlob = new Blob(["contribution:\n" + yamlEntry], { type: "text/yaml;charset=utf-8" });
    _triggerDownload(audioFilename, audioBlob);
    _triggerDownload(contribId + ".yaml", yamlBlob);
    _setStatus("Contribution " + contribId + " downloaded to Downloads folder.", "success");
    btnNext.style.display = "inline-block";
  }

  /* Save a blob to a file within a directory handle */
  async function _saveFileHandle(dirHandle, filename, blob) {
    var fh = await dirHandle.getFileHandle(filename, { create: true });
    var writable = await fh.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  /* ---------- folder picker ---------- */
  async function _pickFolder() {
    if (!window.showDirectoryPicker) {
      return _setStatus("This browser doesn't support folder selection. Files will download normally.", "error");
    }
    try {
      _dirHandle = await window.showDirectoryPicker();
      _dirName = _dirHandle.name;
      folderPath.textContent = _dirName + "/audio/ + contributions.yaml";
      btnFolder.classList.add("active");
      _setStatus("Saving to: " + _dirName + "/ (audio/ + contributions.yaml)", "success");
    } catch (err) {
      if (err.name !== "AbortError") {
        _setStatus("Folder selection cancelled or failed", "error");
      }
    }
  }

  /* (deprecated — use _saveFileHandle) */

  function _triggerDownload(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
