/**
 * Voice Contributor — Recorder
 * Phase 1: local recording, playback, re-record, download bundle
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

  const _CONTRIB_PREFIX = "VC";
  const _langNames = { mi: "M\u0101ori", en: "English", af: "Afrikaans" };

  /* ---------- DOM refs ---------- */
  const $ = (id) => document.getElementById(id);
  const langSel = $("lang-selector");
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

  /* ---------- init ---------- */
  function init() {
    _populateLanguages();
    langSel.addEventListener("change", _onLangChange);
    phraseSel.addEventListener("change", _onPhraseChange);
    btnRef.addEventListener("click", _playReference);
    btnRecord.addEventListener("click", _startRecording);
    btnStop.addEventListener("click", _stopRecording);
    btnPlay.addEventListener("click", _playRecording);
    btnReRecord.addEventListener("click", _resetRecording);
    btnDownload.addEventListener("click", _downloadBundle);
    consentCheck.addEventListener("change", _updateDownloadState);
    _setStatus("Choose a language to start", "info");
  }

  /* ---------- language / phrase ---------- */
  function _populateLanguages() {
    if (typeof DEFAULT_VOICE_PACKAGES === "undefined") return;
    Object.keys(DEFAULT_VOICE_PACKAGES).forEach((code) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = _langNames[code] || code.toUpperCase();
      langSel.appendChild(opt);
    });
  }

  function _onLangChange() {
    const lang = langSel.value;
    if (!lang) return;
    _resetRecording();
    phraseSel.innerHTML = '<option value="">Select phrase</option>';
    const sfs = typeof SURFACE_FORMS !== "undefined" ? SURFACE_FORMS : {};
    const matches = Object.values(sfs).filter((sf) => sf.lang === lang);
    matches.sort((a, b) => (a.text || "").localeCompare(b.text || ""));
    matches.forEach((sf) => {
      const en = sf.translations && sf.translations.en ? " — " + sf.translations.en : "";
      const opt = document.createElement("option");
      opt.value = sf.id;
      opt.textContent = (sf.text || sf.id) + en;
      phraseSel.appendChild(opt);
    });
    _setStatus(`${matches.length} phrases available for ${_langNames[lang] || lang}`, "info");
  }

  function _onPhraseChange() {
    const id = phraseSel.value;
    if (!id) {
      cardContainer.style.display = "none";
      welcome.style.display = "block";
      return;
    }
    welcome.style.display = "none";
    cardContainer.style.display = "block";
    const sf = typeof SURFACE_FORMS !== "undefined" ? SURFACE_FORMS[id] : null;
    if (!sf) return;
    phraseLang.textContent = _langNames[langSel.value] || langSel.value;
    phraseId.textContent = sf.id;
    phraseText.textContent = sf.text || sf.id;
    phraseTranslation.textContent = sf.translations ? (sf.translations.en || "") : "";
    phraseNotes.textContent = sf.notes || sf.context || "";
    _resetRecording();
    _setStatus("Click Record when ready", "info");
  }

  /* ---------- reference audio ---------- */
  function _playReference() {
    const sf = _getSelectedSurfaceForm();
    if (!sf) return;
    const text = sf.text || sf.id;
    const refs = sf.pronunciation && sf.pronunciation.audio_refs ? sf.pronunciation.audio_refs : [];
    const bestRef = refs.find((r) => r.quality !== "tts") || refs[0];
    if (bestRef) {
      _playNative(bestRef, text);
    } else {
      _tryTts(text, langSel.value);
    }
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
  function _getSelectedSurfaceForm() {
    const id = phraseSel.value;
    return typeof SURFACE_FORMS !== "undefined" ? SURFACE_FORMS[id] : null;
  }

  function _generateId() {
    _contributionCount++;
    const ts = Date.now().toString(36).toUpperCase();
    return `${_CONTRIB_PREFIX}_${ts}`;
  }

  function _buildYaml(contribId, sf) {
    const lang = langSel.value;
    const ext = _recordedBlob.type.includes("webm") ? "webm" : "wav";
    return `contribution:
  id: ${contribId}
  surface_form_id: ${sf.id}
  language: ${lang}
  text: ${sf.text || sf.id}
  translation_en: ${(sf.translations && sf.translations.en) || ""}
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
    const sf = _getSelectedSurfaceForm();
    if (!sf) return;
    const contribId = _generateId();
    const ext = _recordedBlob.type.includes("webm") ? "webm" : "wav";
    const yaml = _buildYaml(contribId, sf);

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

    _setStatus(`Contribution ${contribId} downloaded. Add these files to the review queue.`, "success");
  }

  /* ---------- helpers ---------- */
  function _setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "recording-status" + (type ? " " + type : "");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Recorder.init);
