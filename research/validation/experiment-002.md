# Experiment 002: Computational Reproducibility

## Question
Is the SRE compiler deterministic? Does the same source always produce
the same runtime graph?

## Method
Hash-based reproducibility test across environments.

## Prerequisites
A standalone compiler executable (does not yet exist — the current
"compiler" is a manual authoring process that writes JS bundles
directly). This experiment cannot run until the compiler is built.

## Protocol

### Environment A (primary)
- OS: Windows 11
- Node.js 20.x
- Git commit HASH_A

### Environment B (secondary)
- OS: Linux (Ubuntu 24.04)
- Node.js 20.x
- Git commit HASH_A (same commit)

### Steps
1. `git clone <repo> && git checkout HASH_A`
2. `cd compiler && npm ci`
3. `npm run build`
4. `sha256sum output/* > artifacts.sha256`
5. Repeat on Environment B.
6. Compare `artifacts.sha256` files.

## Success criteria
- Bit-identical output on both environments.
- Any change to source produces different hashes.
- Same source always produces same hashes (test 3 times).

## Current status
**BLOCKED** — requires compiler implementation.
