# azkar-status

A Claude Code mod that replaces the "working" status line (e.g. `Creating notes.md`) with a short dhikr, so the time spent waiting is spent in remembrance of Allah.

بدل ما تبص على كلام تقني وانت مستني Claude يشتغل، السطر يعرض ذكر قصير.

## Install

At the prompt of a Claude Code session:

```
/plugin install azkar-status --marketplace mushroom220/azkar-status
```

Answer `y` to add the marketplace, then pick a scope. From a shell:

```bash
claude plugin install azkar-status --marketplace mushroom220/azkar-status
```

## What it does

- Fetches adhkar from [nawafalqari/ayah](https://github.com/nawafalqari/ayah) (`src/data/adkar.json`), caches them locally and refreshes once a day.
- Shows only short adhkar (under 60 visible letters, tashkeel not counted), verbatim: never edited, shortened or invented.
- Picks at random, a new one every 10 seconds, never the same one twice in a row.
- Offline with no cache: falls back to a small built-in list. The line is never empty and never shows an error.
- Arabic is laid out right to left with Unicode isolates; no visible character is added.
- Shown in the Claude desktop app and VS Code. Terminals are left unchanged, since most cannot shape Arabic.
