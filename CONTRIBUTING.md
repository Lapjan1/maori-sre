# Contributing

Different people contribute in different ways. Here is how you can help,
whatever your background.

## I want to add a new language

1. Create a directory under `languages/` for your language (e.g.
   `languages/swahili/`).
2. Define entities and surface forms in `surface_forms.yaml`. See the
   Māori or Afrikaans packages for the format.
3. Record or source audio files and create a voice package.
4. Translate existing experiences into your language.
5. Run the compiler to validate everything links correctly.

You do not need to modify any engine code. Languages are data.

## I want to record audio

Great. Voice packages are independent of the language data.

1. Record each word or phrase as a clean MP3 or WAV file.
2. Create a voice package manifest (`voice_package.yaml`). See
   `languages/mi/voices/mi_teaka_v1/` for an example.
3. Add the audio references to the surface forms.
4. Choose a license for your recordings.

If you are recording for a language that already has a voice package,
you can create an alternative package. The compiler supports multiple
packages per language and will rank them by quality and provenance.

## I found an error

Open an issue with:

- What is wrong (incorrect translation, broken audio, wrong IPA, ...)
- Where it is (entity ID, surface form ID, file path)
- What the correct value should be, if you know it

If you know YAML, you can submit a pull request directly.

## I want to write stories

Experiences are YAML files under `experiences/`.

1. Pick an entity set (things, people, actions, states).
2. Write a short narrative using those entities.
3. Provide translations for each supported language.
4. Define interactions so the app can highlight audio and actions.

See `experiences/river_world/` for examples.

## I want to build an app

The compiled runtime graph (`output/` or `runtime/`) is plain JSON/JS.
You can consume it from:

- A web application (fetch the JS bundles as module scripts)
- A mobile app (embed the JSON data)
- A desktop app
- A command-line tool

You do not need the SRE compiler to build an app. You only need the
compiled output.

If you want to extend the compiler or build custom output formats,
the compiler is in `core/compiler/` and is Apache 2.0 licensed.

## I want to contribute to the engine

### What needs help

- **Inference rules** — new INF rules to derive edges automatically
- **Validation** — stricter checks for surface form completeness
- **Compiler plugins** — TTS, STT, embedding, storage
- **Formal verification** — invariants, cardinality, graph properties
- **Tests** — golden test cases, property-based testing
- **Documentation** — tutorials, examples, architecture diagrams
- **Application polish** — UI, accessibility, performance

### Getting started

```bash
git clone https://github.com/Lapjan1/maori-sre.git
cd maori-sre
pip install -e .
sre validate core/canonical/examples/
sre build core/canonical/examples/ --out output/
```

### Pull request guidelines

- One logical change per PR.
- Include tests for new inference rules or compiler features.
- Preserve backward compatibility unless explicitly breaking.
- Do not commit language data without provenance metadata.
- Do not commit audio files without license information.

## Code of conduct

Be respectful. This project involves cultural knowledge. Contributors
work with languages that may be endangered or sacred to their
communities. Treat linguistic data and its contributors with care.

## Licensing

By contributing code to this repository, you agree to license your
contributions under the Apache 2.0 license (see LICENSE).

Language data contributions (YAML files, translations, audio) retain
whatever license you assign to them. The project does not claim
ownership of your language data.
