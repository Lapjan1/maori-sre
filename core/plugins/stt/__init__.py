"""
Speech-to-Text Plugin Interface

STT plugins transcribe spoken audio into text.
Default: faster-whisper (local, free, accurate).

Usage:
  plugin = load_plugin("stt", "whisper")
  text = plugin.transcribe("/audio/recording.wav", "mi")
"""

from typing import Optional


class STTPlugin:
    """Base interface for speech-to-text."""

    @property
    def name(self) -> str:
        raise NotImplementedError

    @property
    def offline(self) -> bool:
        """Whether this STT works without internet."""
        raise NotImplementedError

    def transcribe(self, audio_path: str, language: Optional[str] = None,
                   model_size: str = "base") -> dict:
        """
        Transcribe audio to text.
        
        Args:
            audio_path: Path to audio file
            language: Optional language code hint
            model_size: Model size (tiny, base, small, medium, large)
        
        Returns:
            {"text": ..., "confidence": ..., "segments": [...]}
        """
        raise NotImplementedError

    def compare_pronunciation(self, expected: str, actual_audio: str,
                              language: str) -> dict:
        """
        Compare expected pronunciation against spoken audio.
        
        Returns:
            {"similarity": 0.0-1.0, "expected": ..., "recognized": ...,
             "mistakes": [...]}
        """
        raise NotImplementedError
