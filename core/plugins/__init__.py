# SRE Plugin System
#
# The compiler uses a plugin architecture for optional or swappable components:
#
#   embedding/   — Vector embedding generation (optional)
#   storage/     — Runtime graph persistence backends
#   tts/         — Text-to-speech (Piper, Coqui, etc.)
#   stt/         — Speech-to-text (Whisper, etc.)
#   lesson/      — Lesson progression strategies
#
# Plugins implement the interfaces defined in their __init__.py files.
# The compiler discovers plugins at build time via entry points or config.
