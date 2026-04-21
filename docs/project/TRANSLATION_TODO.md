# Translation TODO — Luganda (lg) & Bemba (bem)

Both languages are wired into the app infrastructure but need real translations for field deployment.

## What to translate

### 1. UI strings — `src/i18n/lg.json` and `src/i18n/bem.json`

Current status: placeholder drafts (flagged `_status: "DRAFT"` inside each file). A native speaker must review and replace them. Any key not present in `lg.json`/`bem.json` **transparently falls back to English** — that's intentional, it keeps the app working while translations land incrementally.

Minimum set to translate for a participant-usable experience:
- `welcome.*`
- `language.*`
- `decision.plant`, `decision.confirm.*`
- `weather.good`, `weather.bad`
- `videoOffer.title`, `videoOffer.learn`, `videoOffer.proceed`
- `summary.next`, `summary.title`
- `survey.title`, `survey.submit`
- `completion.*`
- All `video.*.caption.*` keys (captions appear while videos play)

Keys to leave in English (enumerator-only):
- `enumerator.*`, `admin.*`

### 2. Video narration MP3s — `public/audio/lg/videos/` and `public/audio/bem/videos/`

One MP3 per video, named `A1.mp3 … A7B.mp3, B1.mp3, B2.mp3`. Missing files cause the VideoPlayer to fall back to English narration automatically (a `video_narration_fallback` event is logged so we can see in analytics which videos weren't localized).

**Production workflow (as of dev branch, 2026-04-21):**

1. The English source text lives at `investment-game/scripts/narration-texts/en.json`. Keys: `A1, A2, A3, A4, A5, A6, A7A, A7B, B1, B2`.
2. A Luganda template already exists at `investment-game/scripts/narration-texts/lg.json` with the same keys and placeholder values marked `[NEEDS_TRANSLATION]`.
3. Native-speaker translator opens `lg.json`, replaces each placeholder with the Luganda rendering. Remove the `[NEEDS_TRANSLATION]` marker entirely.
4. Second native speaker reviews for accuracy + field register (rural Ugandan farmers, not urban Kampala). Update `_meta.status` from `"template"` to `"production"` when both reviews pass.
5. PI signs off on final text (research-integrity gate).
6. Run `LANG_CODE=lg BACKEND=elevenlabs ./scripts/generate-narration.sh` from `investment-game/`. The script:
   - Refuses to run if any scene still contains `[NEEDS_TRANSLATION]` (safety against shipping wrong-language audio)
   - Uses Mapendo voice by default (eleven_multilingual_v2 supports Luganda natively)
   - Can use a different voice per language if `ELEVENLABS_VOICE_ID_LG` is set in `.env.local` — see `.env.example`
7. Native speaker listens to generated MP3s; iterate on voice choice if pronunciation needs work (this is D2 territory in [ROADMAP_DEV.md](ROADMAP_DEV.md)).
8. Generated files land in `public/audio/lg/videos/` and ship with the next build.

**Same workflow applies to Bemba** — `cp lg.json bem.json`, set `_meta.language="bem"`, translator fills in.

**Alternative (higher quality):** hire a native voice actor and deliver MP3s with the correct filenames directly into `public/audio/<lang>/videos/`. Bypasses ElevenLabs entirely.

## Character budget

Each language adds ~3,400 characters of TTS. On ElevenLabs Starter (30k/mo) you can generate EN + LG + BEM in one month with ~20k headroom for iteration.

## Testing a translation

1. Replace `src/i18n/lg.json` strings.
2. Drop MP3s into `public/audio/lg/videos/`.
3. `npm run dev`, run through Welcome → EnumeratorSetup (pick Uganda) → Language = Luganda.
4. Check that captions and narration both speak Luganda.
5. Check that **missing** keys fall back to English (not the raw key name).

## Research-integrity rules for translators

- **Do not change any numbers** in narration (10 tokens, 2 tokens, 30 tokens, etc.). The research depends on these exact values being communicated identically across languages.
- **Keep the neutral framing** of insurance in B1 and B2. Do not add persuasive language — these videos are research instruments, not marketing.
- **Pace matters.** Mapendo + `eleven_multilingual_v2` reads at ~140 wpm. If your translated text is substantially longer than English (some Bantu languages are), the visual scenes auto-scale to match audio duration via VideoPlayer's time-scaling, but caption windows may feel tight. Test in-app.
