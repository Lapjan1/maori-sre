/**
 * Session — Event-sourced learner session log.
 *
 * Every interaction is an immutable event stored in localStorage.
 * Events can be replayed to derive progress, time, confidence, etc.
 *
 * Schema:
 *   { type, timestamp, experience_id, lang, detail }
 */
const Session = (() => {
  const KEY = "river_world_session";
  const _events = [];

  // Load persisted events on init
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) _events.push(...JSON.parse(saved));
  } catch (e) { /* ignore */ }

  function _save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(_events));
    } catch (e) { /* storage full or unavailable */ }
  }

  function log(type, data = {}) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      ...data,
    };
    _events.push(event);
    _save();
    return event;
  }

  function getAll() {
    return [..._events];
  }

  function clear() {
    _events.length = 0;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  function exportJSON() {
    return JSON.stringify(_events, null, 2);
  }

  function summary() {
    const byType = {};
    for (const e of _events) {
      byType[e.type] = (byType[e.type] || 0) + 1;
    }
    return {
      total: _events.length,
      byType,
      firstEvent: _events[0]?.timestamp,
      lastEvent: _events[_events.length - 1]?.timestamp,
    };
  }

  return { log, getAll, clear, exportJSON, summary };
})();
