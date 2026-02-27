# WildLens Architecture Notes (MVP -> Production)

## 1) Product Goal
Build a mobile app that captures animal photos, identifies animals/species, and stores sightings in a user memory book/log.

Primary near-term MVP requirement:
- Photo capture and animal detection after click
- Fast user feedback
- Collect high-quality labeled data for future custom model training

---

## 2) Two Approaches We Compared

### A. Repo-Style Cloud Approach (FaunaDex-like)
Pipeline:
1. App captures photo
2. Upload to backend (`/upload`)
3. Backend uses cloud services for classification
4. Backend stores result in DB
5. Frontend shows detected animal/species and updated log

Pros:
- Fastest to build and ship
- Low ML complexity
- Good for early validation with ~100 users

Cons:
- Network dependent
- Usually not <1s on mobile networks
- Ongoing per-request API costs
- Lower consistency vs custom trained model

### B. Custom On-Device Model Approach (WildLens plan)
Pipeline:
1. Build labeled dataset (frames + bounding boxes)
2. Fine-tune lightweight detector (e.g., EfficientDet-Lite / YOLO small)
3. Export model (`.tflite`)
4. Run detection on device in real time
5. Optional second-stage species classifier

Pros:
- Low latency (can hit <1s)
- Offline capable
- Better privacy
- Better cost at scale

Cons:
- Harder to build
- Requires data + labeling + training/eval pipeline
- Slower initial time-to-market

---

## 3) Recommendation for MVP
Use **cloud-first now**, then migrate to on-device model later.

Why:
- Fast launch and iteration
- Can collect real user images + corrections
- Build training dataset from real-world cases

Transition strategy:
1. Launch cloud-based classification
2. Collect user-confirmed/corrected labels
3. Train custom model offline
4. Replace cloud inference once model quality and speed targets are met

---

## 4) Suggested MVP Architecture (Cloud-First)

### 4.1 Client Flow
1. User captures photo
2. App sends image to backend
3. Backend returns:
   - predicted animal/species
   - confidence score
   - optional bbox/label metadata
4. App shows prediction + confirmation popup:
   - `Correct`
   - `Wrong` (user selects corrected label)
5. App updates memory book/log

### 4.2 Backend Data to Store Per Capture
- image URI/path
- predicted label
- confidence
- user-confirmed label (ground truth when provided)
- correction flag (`is_corrected`)
- timestamp
- optional location bucket
- optional device/app version

This dataset becomes training data for future model.

### 4.3 Critical Addition
Add an **admin review queue** for corrected labels before using them in training to reduce noisy/malicious annotations.

---

## 5) Cost Summary (Cloud Approach)

## Google Vision (per photo in current FaunaDex-like flow)
Current pipeline uses two features per photo:
1. Object Localization
2. Label Detection

So per photo usage ~= 2 units.

Approx paid rate after free tier:
- Label Detection: ~$1.50 / 1000
- Object Localization: ~$2.25 / 1000
- Combined: **~$3.75 / 1000 photos**

Free tier:
- 1000 units/month per feature

## OpenAI Embeddings
For short label text, embedding cost per photo is typically very small (far below 1 cent), often negligible compared to Vision cost.

## Infrastructure
- Backend hosting + DB + storage add additional monthly costs depending on traffic.

---

## 6) Latency Expectations

Cloud approach on 4G (end-to-end):
- Fast 4G: ~2-4s
- Typical 4G: ~4-9s
- Weak 4G: 10s+

Conclusion:
- Cloud approach is generally **not reliable for <1s requirement**.

For <1s target:
- Prefer on-device model inference (TFLite/Core ML)

---

## 7) Data Requirements to Replace Cloud with Own Model

Approx dataset targets:

### Single species detector (e.g., deer)
- Minimum: 1k-2k labeled images
- Better: 3k-8k

### Two similar species (e.g., polar vs brown bear)
- Minimum: 1.5k-3k per class
- Better: 5k+ per class

### Multi-species (10-20 species)
- Minimum: 1k+ per species
- Better: 3k-10k per species

Also collect hard negatives (no animal / confusers):
- Target 30-50% of samples

---

## 8) Model Switch Criteria (Cloud -> On-device)
Do not use only one metric like "95% accuracy".

Use all of:
1. Precision/recall per critical class
2. Stable performance on hard conditions
3. On-device latency <1s on target phones
4. Pilot rollout stability (10% -> 50% -> 100%)

---

## 9) Geo-Aware Future Idea: Animal Packs
Planned next-phase concept:
- Installable/removable region-based packs
- Species priors by location/season
- Faster and more accurate local ranking

Pack concept can include:
- species label map
- compact model/head/index
- geo-prior data
- version metadata

Inference idea:
- vision score x geo prior

Not required for current MVP; good phase-2 roadmap.

---

## 10) External Reference: Seek by iNaturalist
High-level pattern:
- Uses on-device vision model + geo model for ranking
- Built from iNaturalist observation ecosystem

This validates the geo-aware, on-device direction for later versions.

---

## 11) Practical Final Plan
1. Build and launch cloud-first MVP quickly
2. Add user confirmation/correction popup immediately
3. Store structured prediction + correction data
4. Train custom on-device model in parallel
5. Migrate to on-device inference when quality + latency targets are met
6. Keep cloud fallback for low-confidence edge cases

