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

**Production workflow (recommended):**
1. Native-speaker translator writes the narration text per video in a new file, e.g. `scripts/narration-texts/lg.json`:
   ```json
   {
     "A1": "Tukusanyukidde ku muzannyo gw'okusuubira. ...",
     "A2": "...",
     "B2": "..."
   }
   ```
2. Create a variant generation script `scripts/generate-narration-lg.sh` (copy of `generate-narration.sh`) that reads from that JSON and passes each entry to ElevenLabs.
3. The existing Mapendo voice (`dOqxOZEisn8SiUH1dPCC`) speaks Luganda and Bemba natively because we use the `eleven_multilingual_v2` model. No new voice needed — the same performer carries across languages.
4. Run with `LANG_CODE=lg ELEVENLABS_API_KEY=... ./scripts/generate-narration-lg.sh`.

**Alternative (higher quality):** hire a voice actor native to the target language. Deliver MP3s named as above into the matching folder. Same filenames → drop-in.

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
