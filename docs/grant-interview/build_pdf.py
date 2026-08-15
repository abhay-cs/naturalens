#!/usr/bin/env python3
"""Build NaturaLens Grant Interview Tech Brief PDF."""

from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).with_name("NaturaLens_Grant_Interview_Tech_Brief.pdf")

# Brand-adjacent palette from packages/design/tokens.json (black/white chrome)
INK = (0, 0, 0)
MUTED = (102, 102, 102)
CAPTION = (153, 153, 153)
RULE = (229, 229, 229)
SOFT = (245, 245, 245)
ACCENT = (47, 107, 79)  # success green -- used sparingly for section marks


class Brief(FPDF):
    def __init__(self):
        super().__init__(format="Letter", unit="mm")
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(18, 16, 18)

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*CAPTION)
        self.cell(0, 5, "NaturaLens  |  Grant Interview Tech Brief", align="L")
        self.ln(2)
        self.set_draw_color(*RULE)
        self.set_line_width(0.2)
        self.line(self.l_margin, self.get_y(), self.l_margin + self.epw, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(*RULE)
        self.line(self.l_margin, self.get_y(), self.l_margin + self.epw, self.get_y())
        self.ln(2)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*CAPTION)
        self.cell(0, 5, f"Confidential interview prep  |  Page {self.page_no()}", align="C")

    def _left(self):
        self.set_x(self.l_margin)

    def h1(self, text: str):
        self._left()
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*INK)
        self.multi_cell(0, 8, text)
        self.ln(2)

    def h2(self, text: str):
        self.ln(2)
        if self.get_y() > 250:
            self.add_page()
        self.set_fill_color(*SOFT)
        self.set_draw_color(*RULE)
        y = self.get_y()
        self.rect(self.l_margin, y, self.epw, 9, style="F")
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*ACCENT)
        self.set_xy(self.l_margin + 2, y + 1.5)
        self.cell(self.epw - 4, 6, text)
        self.set_y(y + 10)
        self._left()

    def h3(self, text: str):
        self.ln(1)
        self._left()
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*INK)
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def body(self, text: str):
        self._left()
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(*INK)
        self.multi_cell(0, 5, text)
        self.ln(1.5)

    def muted(self, text: str):
        self._left()
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*MUTED)
        self.multi_cell(0, 4.8, text)
        self.ln(1)

    def bullet(self, text: str, indent: float = 4):
        self.set_x(self.l_margin + indent)
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(*INK)
        bullet_w = 4
        self.cell(bullet_w, 5, "-")
        # remaining width inside content box
        self.multi_cell(self.epw - indent - bullet_w, 5, text)

    def qa(self, q: str, a: str):
        self.ln(1)
        if self.get_y() > 245:
            self.add_page()
        self._left()
        self.set_font("Helvetica", "B", 9.5)
        self.set_text_color(*INK)
        self.multi_cell(0, 5, f"Q: {q}")
        self._left()
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(*MUTED)
        self.multi_cell(0, 5, f"A: {a}")
        self.ln(1.5)

    def kv_table(self, rows: list[tuple[str, str]], col1: float = 52):
        self.set_draw_color(*RULE)
        for i, (k, v) in enumerate(rows):
            if self.get_y() > 255:
                self.add_page()
            y0 = self.get_y()
            self.set_xy(self.l_margin, y0)
            self.set_font("Helvetica", "B", 9)
            self.set_text_color(*INK)
            self.multi_cell(col1, 5, k)
            y1 = self.get_y()
            self.set_xy(self.l_margin + col1, y0)
            self.set_font("Helvetica", "", 9)
            self.set_text_color(*MUTED)
            self.multi_cell(self.epw - col1, 5, v)
            y2 = self.get_y()
            self.set_y(max(y1, y2) + 1)
            self._left()
            if i < len(rows) - 1:
                self.set_draw_color(*RULE)
                self.line(self.l_margin, self.get_y(), self.l_margin + self.epw, self.get_y())
                self.ln(2)


def ensure_space(pdf: Brief, need_mm: float = 40):
    """Start a new page only if the remaining space is too tight for a section."""
    # usable bottom ~ letter height 279.4 - bottom margin ~18 - footer
    if pdf.get_y() > 279.4 - 18 - need_mm:
        pdf.add_page()


def build():
    pdf = Brief()
    pdf.add_page()

    # Cover
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(*INK)
    pdf.ln(18)
    pdf._left()
    pdf.multi_cell(0, 12, "NaturaLens")
    pdf._left()
    pdf.set_font("Helvetica", "", 14)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(0, 8, "Grant Interview Tech Brief")
    pdf.ln(4)
    pdf.set_draw_color(*ACCENT)
    pdf.set_line_width(0.8)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 52, pdf.get_y())
    pdf.ln(8)
    pdf._left()
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*INK)
    pdf.multi_cell(
        0,
        5.5,
        "One-pager answers and deeper tech notes for grant / fellowship interviews. "
        "Derived from the shipping product, architecture docs, and ML labeling pipeline "
        "in the NaturaLens monorepo.",
    )
    pdf.ln(4)
    pdf._left()
    pdf.kv_table(
        [
            ("Product", "Global wildlife recognition -- photo in, species name + log out"),
            ("Status", "Mobile MVP shipping; landing + waitlist live; labeling + training loop live"),
            ("Stack", "Expo / React Native, Gemini API, Next.js, Cloudflare Workers / D1 / R2"),
            ("ML path", "Cloud-first now -> custom on-device detector (TFLite) when quality bar met"),
            ("License", "MIT"),
            ("Repo", "github.com/abhay-cs/naturalens"),
            ("Audience", "Founders / technical interviewees -- talk tech without drowning in jargon"),
        ]
    )

    # ------------------------------------------------------------------
    pdf.add_page()
    pdf.h1("1. Elevator -- what to say in 60 seconds")
    pdf.body(
        "NaturaLens is a mobile wildlife recognition app. Point your phone at an animal; "
        "we name the species, show confidence and a short species card (habitat, diet, "
        "IUCN status), and keep a personal log of finds. Today identification runs in the "
        "cloud via Google Gemini. We deliberately ship cloud-first so we can validate the "
        "product loop and collect real photos + corrections for a custom on-device model. "
        "In parallel we already run an internal labeling product and a polar-bear detector "
        "training pipeline aimed at offline, low-latency field use."
    )
    pdf.muted(
        "Soundbite: 'Cloud to learn fast; on-device to scale privately, cheaply, and offline.'"
    )

    # ------------------------------------------------------------------
    pdf.h2("2. Problem, users, impact (grant framing)")
    pdf.bullet(
        "Problem: Field ID of wildlife is slow, expert-gated, or locked behind heavy apps. "
        "Many tools need accounts, maps, or continuous connectivity -- poor fit for quick "
        "citizen science and field education."
    )
    pdf.bullet(
        "Users: Curious outdoors people, students, educators, and eventually researchers "
        "who need a lightweight capture -> identify -> log loop on a phone."
    )
    pdf.bullet(
        "Impact angle: Lower the barrier to species awareness; route interest toward "
        "conservation literacy (IUCN status rides with every ID); build a path to "
        "privacy-preserving, offline recognition for remote / low-connectivity regions."
    )
    pdf.bullet(
        "Why tech matters for the grant: Grants fund capability -- not just a UI. Our "
        "architecture is explicitly designed to convert usage into labeled training data "
        "and then into an owned on-device model (cost, latency, privacy, offline)."
    )

    # ------------------------------------------------------------------
    pdf.h2("3. What exists today vs roadmap")
    pdf.h3("Shipped / working")
    pdf.kv_table(
        [
            ("Mobile app", "Expo SDK 54 MVP: capture -> identify -> save -> revisit/delete"),
            ("Identification", "Gemini 3.1 Flash-Lite, structured JSON, ~1.5-2s typical"),
            ("Local history", "AsyncStorage metadata + document-dir photos/thumbs"),
            ("Landing / waitlist", "Next.js on Cloudflare Workers + D1 (naturalens-waitlist)"),
            ("Labeler (Skim)", "Internal tool at skim.naturalens.ca -- upload, box, review, runs"),
            ("Training loop", "SSDLite320 MobileNetV3 -> metrics / preds / TFLite via Colab + R2"),
            ("Design system", "Shared tokens (Outfit + Archivo, B/W chrome) in packages/design"),
        ]
    )
    pdf.h3("Not started (placeholders in monorepo)")
    pdf.bullet("services/api -- own backend (auth, sightings, species DB, key proxy)")
    pdf.bullet("services/inference -- hosted custom model serving")
    pdf.bullet("tools/data-pipeline -- GBIF / IUCN species DB compilation")
    pdf.bullet("Full multi-species production model + Expo custom-dev-client TFLite runtime")

    # ------------------------------------------------------------------
    pdf.h2("4. System architecture (interview diagram in words)")
    pdf.body(
        "MVP path (what users touch): Expo app -> resize photo to 1024px JPEG -> Gemini "
        "Interactions API with JSON schema -> {isAnimal, label, confidence, description, "
        "habitat, diet, conservationStatus} -> optional save to on-device history."
    )
    pdf.body(
        "Learning path (what builds the moat): Labeler Worker (Cloudflare) stores images in "
        "R2 and labels in D1 -> Create immutable training run (manifest on R2) -> Colab trains "
        "SSDLite -> uploads metrics/predictions/TFLite -> UI review of failures -> re-label."
    )
    pdf.body(
        "Target production path: App -> our API (key stays server-side) -> cloud model OR "
        "on-device TFLite with cloud fallback for low confidence; geotagged finds; species "
        "enrichment from GBIF/IUCN; optional regional 'animal packs'."
    )
    pdf.muted(
        "Honest constraint: Expo Go cannot load a custom TFLite native module -- on-device "
        "inference requires a custom development build. That is why Gemini ships first."
    )

    # ------------------------------------------------------------------
    pdf.h2("5. Tech stack cheat sheet")
    pdf.kv_table(
        [
            ("Mobile", "React Native 0.81, React 19, Expo 54, TypeScript, expo-camera"),
            ("ID model (prod MVP)", "gemini-3.1-flash-lite; thinking=minimal; schema-constrained"),
            ("Persistence", "AsyncStorage (versioned key) + expo-file-system document dir"),
            ("Web / marketing", "Next.js 16, Tailwind 4, Framer Motion, Cloudflare Workers"),
            ("Waitlist DB", "Cloudflare D1 (naturalens-waitlist)"),
            ("Labeler", "Cloudflare Worker + D1 (naturalens-labels) + R2 (naturalens-data)"),
            ("Auth (labeler)", "Email+PIN or Cloudflare Access; Colab uses TRAIN_TOKEN"),
            ("Training", "PyTorch torchvision SSDLite320 MobileNetV3-Large; Colab T4 GPU"),
            ("Export targets", "ONNX + TFLite (float16 via onnx2tf when available)"),
            ("Monorepo", "apps / services / models / tools / packages / docs / infra"),
        ],
        col1=48,
    )

    # ------------------------------------------------------------------
    ensure_space(pdf, 50)
    pdf.h1("6. Identification pipeline -- decisions interviewers probe")
    pdf.qa(
        "Why Gemini instead of your own model?",
        "Speed to learn. A custom detector needs thousands of labeled images, an eval "
        "harness, and a custom Expo build. Gemini lets us ship the product loop now and "
        "collect real-world photos + corrections as training fuel.",
    )
    pdf.qa(
        "Why flash-lite specifically?",
        "Measured ~1.5s vs ~7-18s for larger flash on the same test images, with the same "
        "species answers. Naming an animal does not need a big reasoning model.",
    )
    pdf.qa(
        "Why 1024px uploads?",
        "Gemini tokenizes images in fixed tiles -- shrinking to 512px cost detail without "
        "saving tokens or latency. 1024px was the sweet spot we measured.",
    )
    pdf.qa(
        "How do you stop non-animals becoming 'species'?",
        "Schema includes isAnimal. Without that guard, the model will happily label a chair "
        "with confidence 1. Non-animal returns an empty list and the UI says 'No animal here'.",
    )
    pdf.qa(
        "Is confidence calibrated?",
        "No -- it is self-reported by the model, clamped to [0,1]. Treat as a UI hint, not a "
        "probability. Calibrated scores come with our own trained model + holdout eval.",
    )
    pdf.qa(
        "Why put species facts on the same call?",
        "Measured median 1454ms -> 1681ms (~230ms / 16%) for four extra fields. Worth it vs "
        "a second round-trip. Older finds without info backfill lazily via a text-only call.",
    )
    pdf.qa(
        "Where does the API key live?",
        "In the client today (EXPO_PUBLIC_* is inlined). Restricted in AI Studio, not treated "
        "as a secret. Next hard step: proxy via services/api so the key never ships.",
    )

    # ------------------------------------------------------------------
    pdf.h2("7. Data, labeling, and the polar-bear training loop")
    pdf.body(
        "We built Skim (apps/labeler) as an internal upload / label / train-review app, "
        "focused first on a one-class polar bear detector -- a concrete path from photos to "
        "a TFLite model without waiting on a full multi-species dataset."
    )
    pdf.bullet(
        "Storage: images + run artifacts on R2 (naturalens-data); boxes/review/runs on D1."
    )
    pdf.bullet(
        "Integrity: content-hash (sha256) primary keys; optimistic concurrency (version -> 409); "
        "append-only label_history; EXIF orientation normalized at upload."
    )
    pdf.bullet(
        "Runs: Create training run freezes an immutable runs/<id>/manifest.json on R2."
    )
    pdf.bullet(
        "Train: Colab notebook pulls snapshot, trains SSDLite, uploads metrics/preds/tflite, "
        "callbacks Worker status (TRAIN_TOKEN)."
    )
    pdf.bullet(
        "Cost control: hard internal caps at 80% of R2 free tier (storage / Class A / Class B) "
        "so the workflow cannot silently overage -- uploads/runs return HTTP 429 at cap."
    )
    pdf.bullet(
        "Local split used historically: 44 train / 20 val (models/data/split.json) until a "
        "run overrides via R2 manifest."
    )
    pdf.h3("Dataset size targets (to replace cloud broadly)")
    pdf.kv_table(
        [
            ("Single species (e.g. deer)", "Min 1k-2k labeled; better 3k-8k"),
            ("Two similar species", "Min 1.5k-3k per class; better 5k+"),
            ("10-20 species", "Min 1k+ each; better 3k-10k each"),
            ("Hard negatives", "Target 30-50% of samples (no animal / confusers)"),
        ],
        col1=55,
    )

    # ------------------------------------------------------------------
    pdf.h2("8. Cost & latency -- numbers to have ready")
    pdf.h3("Latency")
    pdf.bullet("Our Gemini path: tuned from ~9s down to ~2s (model + size + thinking budget).")
    pdf.bullet(
        "Generic cloud Vision-style on 4G: often 2-9s+ end-to-end -- unreliable for a <1s UX."
    )
    pdf.bullet(
        "<1s / offline goal: on-device TFLite / Core ML. Cloud stays as fallback for hard cases."
    )
    pdf.h3("Cloud cost reference (architecture notes -- Vision-like baseline)")
    pdf.bullet(
        "Illustrative Vision combo (~object localization + labels): ~$3.75 / 1000 photos "
        "after free tier. Embeddings for short labels are usually negligible."
    )
    pdf.bullet(
        "Gemini free tier is usable for MVP/dev; rate limits (429) are a normal user-facing "
        "outcome if someone hammers the shutter -- we map that to clear copy."
    )
    pdf.bullet(
        "Strategic point: per-call cloud cost grows linearly with users; on-device flips that "
        "to mostly fixed training + distribution cost."
    )

    # ------------------------------------------------------------------
    ensure_space(pdf, 45)
    pdf.h1("9. Switch criteria -- cloud -> on-device")
    pdf.body("Do not claim '95% accuracy' as the only bar. Interview answer:")
    pdf.bullet("Precision / recall per critical class (not just overall accuracy)")
    pdf.bullet("Stable performance on hard conditions (lighting, distance, clutter)")
    pdf.bullet("On-device latency <1s on target phones")
    pdf.bullet("Staged pilot rollout (e.g. 10% -> 50% -> 100%) with cloud fallback")
    pdf.bullet("Admin review of user corrections before training (noise / abuse filter)")

    # ------------------------------------------------------------------
    pdf.h2("10. Competitive / prior art (know Seek)")
    pdf.body(
        "Seek by iNaturalist validates the endgame pattern: on-device vision + geo ranking, "
        "fed by a large observation ecosystem. We are not claiming to out-data them today. "
        "Our wedge is a fast personal capture->log product, cloud-first, with an explicit "
        "path to owned models and regional packs (species map + compact head + geo priors)."
    )
    pdf.muted(
        "Differentiation talking points: simpler consumer loop; conservation status in-product; "
        "owned labeling/training pipeline; MIT-licensed codebase; privacy/offline as design goals."
    )

    # ------------------------------------------------------------------
    pdf.h2("11. Privacy, safety, ethics")
    pdf.bullet(
        "MVP stores finds only on-device -- no accounts, no sync, no location by design "
        "(note: location cannot be backfilled later for old finds)."
    )
    pdf.bullet(
        "Photos sent to Gemini for ID today -- disclose network dependency and third-party "
        "processing in interviews / privacy copy."
    )
    pdf.bullet(
        "On-device future reduces raw photo egress; cloud fallback can be confidence-gated."
    )
    pdf.bullet(
        "Labeler is internal, authenticated; training data should prefer consented / owned "
        "field photos and reviewed labels."
    )
    pdf.bullet(
        "Conservation status is schema-enum constrained; unknown -> Data Deficient rather "
        "than inventing a confident IUCN category."
    )

    # ------------------------------------------------------------------
    pdf.h2("12. Risks & mitigations (grant panels love this)")
    pdf.kv_table(
        [
            ("API key in client", "Restrict key; next: proxy via services/api"),
            ("No offline field use yet", "Roadmap to TFLite; cloud is interim"),
            ("Uncalibrated confidence", "Clamp + UI as hint; own model + eval later"),
            ("Label noise / abuse", "Admin review queue; append-only history; versioning"),
            ("Cloud cost at scale", "On-device migration + regional packs"),
            ("Expo Go TFLite limit", "Custom dev client when model ready"),
            ("Infra free-tier blowup", "R2 hard caps at 80%; D1-only run lists"),
            ("No automated tests yet", "Acknowledged gap; CI typechecks mobile on main"),
        ],
        col1=52,
    )

    # ------------------------------------------------------------------
    pdf.h2("13. Roadmap talking track")
    pdf.bullet("Now: tighten MVP, proxy Gemini, geotag + map, export history")
    pdf.bullet("Next: species DB enrichment (GBIF/IUCN); grow labeled sets beyond polar bear")
    pdf.bullet(
        "Later: multi-species on-device model; animal packs (region priors); cloud fallback"
    )
    pdf.bullet(
        "Always: corrections -> reviewed labels -> retrain -> evaluate -> gradual rollout"
    )

    # ------------------------------------------------------------------
    ensure_space(pdf, 55)
    pdf.h1("14. Rapid-fire Q&A bank")
    pdf.qa(
        "What is innovative here?",
        "Not 'another classifier' alone -- the closed loop: consumer ID product that funds "
        "a labeled real-world dataset, plus an operational labeling/training stack already "
        "running toward offline models.",
    )
    pdf.qa(
        "Why a monorepo?",
        "Small team, atomic PRs across app + ML + docs, one clone for onboarding "
        "(ADR 001). Boundaries: apps / services / models / tools.",
    )
    pdf.qa(
        "Open source?",
        "MIT. Easy for collaborators and academic partners; still compatible with hosted "
        "services and future sustainability models.",
    )
    pdf.qa(
        "Who is on the critical path technically?",
        "Mobile product loop (Expo), identification quality/UX, labeling throughput, and "
        "the train->eval->export path to TFLite. Backend API is the next production hardening step.",
    )
    pdf.qa(
        "What would grant funding unlock?",
        "Concrete uses: expand labeled datasets across species/regions; GPU/time for "
        "training & eval; build services/api + inference; ship custom on-device builds; "
        "GBIF/IUCN enrichment; field pilots with educators/partners.",
    )
    pdf.qa(
        "How do you measure success?",
        "Product: successful IDs, save rate, retention of history use. ML: per-class P/R, "
        "hard-case stability, on-device latency, pilot error rates vs cloud. Ops: labeling "
        "throughput and reviewed-correction volume.",
    )
    pdf.qa(
        "Why polar bear first for custom ML?",
        "One-class detector is a tractable vertical slice -- proves upload->label->train->TFLite "
        "end-to-end before multi-species complexity. Field-photo focused; transferable pipeline.",
    )
    pdf.qa(
        "What about maps / location?",
        "Intentionally out of MVP. Planned next. Important honesty: finds saved before "
        "location ships will never get backfilled coordinates.",
    )
    pdf.qa(
        "Live video detection?",
        "Out of MVP. One photo on button press -- the frozen still is what was analyzed. "
        "Live detection returns with on-device models.",
    )
    pdf.qa(
        "How is this not just wrapping Gemini?",
        "Gemini is the current inference backend. Product UX, persistence, species card "
        "design, error handling, and -- critically -- the labeling + training pipeline that "
        "makes Gemini replaceable are the durable work.",
    )

    # ------------------------------------------------------------------
    pdf.h2("15. Component status snapshot")
    pdf.kv_table(
        [
            ("apps/mobile", "MVP -- identify + local history"),
            ("apps/web", "Built -- landing + D1 waitlist on Workers"),
            ("apps/labeler", "Built -- Skim labeling / runs / Colab loop"),
            ("services/api", "Not started (placeholder)"),
            ("services/inference", "Not started (placeholder)"),
            ("models/training", "SSDLite polar-bear pipeline + Colab"),
            ("models/evaluation", "Placeholder README -- metrics emitted by training"),
            ("tools/data-pipeline", "Not started (GBIF/IUCN planned)"),
            ("infra/", "Not started (Docker/IaC planned)"),
        ],
        col1=48,
    )

    # ------------------------------------------------------------------
    pdf.h2("16. Glossary (say it cleanly)")
    pdf.kv_table(
        [
            ("Expo Go", "Scan-QR RN runtime; cannot add custom native ML modules"),
            ("TFLite", "TensorFlow Lite -- mobile on-device inference format"),
            ("SSDLite", "Lightweight single-shot detector; our current train target"),
            ("D1 / R2", "Cloudflare SQL DB / object storage used by web + labeler"),
            ("GBIF", "Global Biodiversity Information Facility -- occurrence/taxonomy data"),
            ("IUCN", "Red List conservation categories we surface in-product"),
            ("mAP", "mean Average Precision -- detection quality metric on val set"),
            ("Animal pack", "Future region pack: labels + compact model/index + geo priors"),
        ],
        col1=36,
    )

    # ------------------------------------------------------------------
    pdf.h2("17. Closing line")
    pdf.body(
        "NaturaLens ships a real capture->identify->log product today, while building the "
        "data and training machinery to own recognition tomorrow -- private, offline-capable, "
        "and cost-stable at scale. Grant support accelerates the hard part: data, models, "
        "and the production backend that turns a strong MVP into durable infrastructure."
    )
    pdf.ln(4)
    pdf.muted(
        "Sources in-repo: README.md, docs/DESIGN.md, docs/Architecture_Notes.md, "
        "docs/adr/001-monorepo.md, apps/*/README.md, models/training/README.md. "
        "Regenerate this PDF: python3 docs/grant-interview/build_pdf.py"
    )

    pdf.output(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
