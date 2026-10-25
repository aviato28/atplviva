# ATPL Viva study PWA
Static, offline-capable (service worker) flashcard + learn app. Content lives in `content.json`.

Deploy: Cloudflare Pages → connect this repo, no build command, output dir `/`. Open on phone → Share → Add to Home Screen (works offline after first load).

Local: `python3 -m http.server` and open localhost:8000.

## Roadmap
1. [x] App shell: topics, Learn chunks, flashcards (Leitner, 3 boxes), Viva random mode, offline, progress saved on-device
2. [ ] Receive PDF → extract text by chapter
3. [ ] Convert each chapter to `content.json`: short note chunks + viva-style Q&A (with "why" explanations)
4. [ ] Push, deploy to Cloudflare Pages, test on phone
5. [ ] Study order: Learn chunks → Cards per topic → final Viva mode run-through
