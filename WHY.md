# Why the SRE exists

## Languages are not dictionaries

A dictionary lists words. But language is not a list of words. Language
is how a community describes shared experience.

When a child learns their first language, they do not memorise a
dictionary. They watch, they imitate, they make connections. They learn
that *this* (pointing at water) is called *wai* in one context and
*water* in another. They learn that you can drink it, swim in it, fall
into it. They learn that water exists in rivers and rain and cups and
tears.

Software that treats language as a flat list of word pairs
(water → wai, wai → water) misses almost everything that makes
language work.

## What existing software gets wrong

Most language-learning and documentation tools model one thing:

- **Words** (dictionaries, flashcards, phrasebooks)
- **Grammar** (textbooks, reference grammars, conjugation tables)
- **Audio** (recordings, pronunciation guides)
- **Stories** (readers, graded readers)

Each is stored separately. A linguist documenting a language keeps
word lists in one file, recordings on a hard drive, grammar notes in a
notebook, and stories in a text document. These never connect to each
other.

A revitalisation community that wants an app must either:

1. Pay a company to build something custom, giving up control of their
   data.
2. String together a dozen disconnected open-source tools and maintain
   the integrations themselves.
3. Accept that only vocabulary drilling is available, not actual
   learning experiences.

None of these are acceptable for languages with few speakers and
limited time.

## What the SRE does differently

The SRE starts with a question:

> What is there, and what can happen?

It models entities (things, people, animals, places), their
affordances (what they do, what can be done to them), and the
interactions that connect them. Then it maps those semantic
structures into surface forms (words and phrases in any language),
pronunciations, audio recordings, and narratives.

The result is not a dictionary. It is a **semantic model** of a small
world, expressed in as many languages as a community can provide.

## Why this matters for endangered languages

There are roughly 7,000 languages in the world. Around half are
endangered. A language disappears every few weeks.

Most endangered-language projects face the same bottleneck:

- A few fluent speakers (often elderly)
- Limited time to document
- Limited technical resources
- No budget for custom software

The SRE does not require a large corpus. It does not require machine
learning. It does not require a server. It requires one person who
knows the language well enough to model entities and write sentences.

From that minimal input, it produces:

- A structured semantic lexicon
- Pronunciation guides with audio
- Learning experiences (stories, dialogues, observations)
- An offline app that anyone in the community can use

The app costs nothing to run. It works without internet. It respects
community ownership of data through layered licensing.

## What success looks like

An elder records 300 words. A linguist adds grammar. The community
contributes stories. Children use a phone app.

Nothing in the engine changes. Only the language package grows.

---

The SRE does not aim to replace existing documentation tools. It aims
to connect what those tools leave disconnected: meaning, form, sound,
story, and learning.

That connection is what makes a language learnable — not as a list of
vocabulary, but as a living system of shared experience.
