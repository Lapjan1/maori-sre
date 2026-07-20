"""
Text-to-Speech Plugin Interface

TTS plugins generate pronunciation audio for surface forms.
Default: Piper TTS (lightweight, CPU-friendly, offline).

Usage:
  plugin = load_plugin("tts", "piper")
  plugin.synthesize("wai", "mi", "/audio/mi/THING_001.wav")
"""

from typing import Optional


class TTSPlugin:
    """Base interface for text-to-speech."""

    @property
    def name(self) -> str:
        raise NotImplementedError

    @property
    def offline(self) -> bool:
        """Whether this TTS works without internet."""
        raise NotImplementedError

    def synthesize(self, text: str, language: str, output_path: str,
                   voice: Optional[str] = None) -> str:
        """
        Generate audio for text.
        
        Args:
            text: Text to synthesize
            language: Language code (e.g., 'mi', 'en')
            output_path: Where to write the audio file
            voice: Optional voice/model identifier
        
        Returns:
            Path to the generated audio file
        """
        raise NotImplementedError

    def voices_for(self, language: str) -> list:
        """List available voices for a language."""
        raise NotImplementedError
