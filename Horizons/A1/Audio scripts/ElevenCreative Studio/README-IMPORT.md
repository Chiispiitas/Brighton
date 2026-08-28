ELEVENCREATIVE STUDIO IMPORT NOTES

Import only the `.txt` track files in this folder.

The `.txt` files contain only spoken text plus supported `<break time="..." />` tags. They intentionally contain no speaker names, track titles, production notes, or other visible metadata because Studio may narrate visible text.

For multi-speaker tracks, use `VOICE MAP.md` after import to assign voices by paragraph number. Do not import `VOICE MAP.md`.

Recommended model: Multilingual v2 when exact break-tag pauses matter.

Pause use:
- 0.3–0.5 s: normal conversational turn or thinking space.
- 0.7–1.0 s: separation between listening items.
- 1.2–1.5 s: new interview or scene.
- Break tags are used selectively. Normal punctuation carries most of the rhythm.

Studio also lets you adjust timing directly between paragraphs and individual sentences on the timeline. Use the timeline if a final pause needs exact adjustment after generation.
