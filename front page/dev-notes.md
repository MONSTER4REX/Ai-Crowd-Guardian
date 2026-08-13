# Dev notes — AI Crowd Guardian (debug state)

## Current bug being fixed
The F1 car renders UPSIDE DOWN (wheels pointing up, body below). Debug:
- Added green sphere at carRef.local (0, 0.7, 0) → it appears ABOVE the car, near cockpit.
- So carRef's +Y points UP correctly. The car GEOMETRY itself must be flipped.
- Hypothesis: the suspension useFrame writes `bodyRef.current.position.y` inside F1Car — fine, no flip.
- REAL cause likely: the car parts were modeled with +Y up but the parent group... wait — the wheels (torusGeometry rotated [0,0,PI/2]) — torus is in XY plane; rotated PI/2 around Z puts it vertical (YZ plane) — a wheel standing upright = its "up" direction is +X. If the whole car appears wheels-up, maybe the car appears rotated 180 about X... but green marker is above. Hmm — looking again at screenshot: wheels are at TOP of car body and rear wing at bottom-left. The yellow nose points lower-left. This looks like the car rolled 180°.
- Next try: check if F1Car's useFrame suspension y-oscillation combined with... no.
- New theory: the car looks inverted because we view it from below the ground plane?? Camera y=2.2, ground at y=-0.01. No.
- Try: mirror car geometry by wrapping with scale={[1,-1,1]}... that would flip +Y. Actually if geometry appears flipped on Y, applying scale={[1,-1,1]} on the F1Car group would make wheels point down. Do that.

## Key facts
- Stack: React 19 + Vite + three 0.185 + @react-three/fiber 9 + drei, Tailwind 4, dark theme default.
- Files: components/3d/{StoryScene,F1Car,Track,CrowdParticles}.tsx, components/storyboard/{Storyboard,StoryOverlay,TelemetryHUD,ProductSections}.tsx, components/ui/Navbar.tsx, hooks/useStoryboardScroll.ts, data/{track,venue}.ts, pages/Home.tsx.
- Colors: bg #0A0A0D, surface #16161B, border #2A2A32, brand #E4002B, safe #2ECC71, monitor #F5C518, intervention #FF8C42, critical #FF3B30. Fonts: Titillium Web headings, Inter body, JetBrains Mono telemetry.
- Track curve in client/src/data/track.ts; car at (-14,0,9) start, ends right side.
- Storyboard section height 500vh desktop / 380vh mobile, sticky canvas.
- PRD car references: user wants Red Bull RB19 style (dark navy + yellow nose + red accents) as the storytelling car. (McLaren silver-red also in reference image.)
- Brief file: /home/ubuntu/upload/pasted_content.txt (full storyboard spec).

## Remaining TODO
- Fix car upright orientation
- Tune camera journey (currently CAM_START (-17,2.2,14.2) lookAt (-14,0.5,9); end (4,30,34))
- Verify scroll progress drives car, camera pull-away, car shrinks, track reveal
- Product sections PREDICT/UNDERSTAND/REROUTE/ACT done but not verified visually
- Check browser console logs for runtime errors
- Final screenshots pass + checkpoint + deliver

## Update (18:05)
- Car orientation FINAL state: yaw = atan2(tangent.x, tangent.z) + PI, rotation.set(0,yaw,0), position.y = carPos.y + 0.29 (wheels radius offset so car rests on ground). Verified working.
- Mirror experiment removed from F1Car.tsx (no mirror prop).
- Camera start: (-18.5, 1.4, 13.4) looking at (-14, 0.55, 9.6). End: (4, 30, 34) lookAt (8, 0, -6).
- Current screenshot shows car correctly upright, wheels on ground. Opening frame now reads as car rear-three-quarter view from behind. 
- Still TODO: verify scroll drives car along curve (check by screenshots at progress points — can't easily; trust logic), tune story overlays visibility, check console logs, full-page screenshots, checkpoint, deliver.
- The scene still looks flat/dark; could add horizon glow, but acceptable for now; focus on completing overlays + product sections check.

## Verified (18:10)
- CSS classes (micro-label, acg-panel, font-display, font-telemetry, text-brand-red) all exist in index.css. Fonts loaded in index.html. No console errors.
- ProductSections: PREDICT / UNDERSTAND / REROUTE / ACT sections + footer CTA verified complete; MonacoMap SVG with safe/highlight modes; decision timeline; bottleneck factors bars.
- StoryOverlay windows: 0→0.08 hero, 0.26→0.36 racing line, 0.38→0.5 crowd flow, 0.56→0.68 predict, 0.7→0.82 twin, 0.86→1.0 brand reveal + CTA. Scroll hint 0→0.05.
- TelemetryHUD desktop-only panels: system status 0.42→0.56, route metrics 0.5→0.66, gate B 0.64→0.78.
- useStoryboardScroll: derives progress from #acg-storyboard rect, RAF throttled, resize-aware, phase product when scrolled past.
- CrowdParticles: 90 instanced spheres drifting on curve, reveal-driven opacity — fine.
- Track.tsx: reveals line via rebuilt geometry per frame (useFrame + reveal), DoubleSide ground, grid helper.

## Remaining polish
1. Mobile check screenshot (375x812) — Storyboard height 380vh mobile, simpler camera.
2. The hero frame: car reads small/distant in default 1280x720 viewport? last shot was fine. Consider adding subtle horizontal light streak / glow at horizon.
3. Verify full-page screenshot renders product sections (already captured — looked good: sections render with panels).
4. Checkpoint then deliver.

## ROOT CAUSE FOUND (mobile white slab)
The "white slab" artifact on mobile was the CrowdParticles instancedMesh: 90 default instance matrices stacked at origin (sphereGeometry r=1, white #F5F5F7 basic material) rendered before reveal ramp — appearing as one huge white sphere behind the car. Fixed in CrowdParticles.tsx with a useEffect that initializes all instances at (0,-200,0) scale 0.001.

## RESTORE NEEDED (cleanup after isolation)
StoryScene.tsx currently has test changes that must be reverted once fixed:
1. Fog line commented out: `{/* Fog disabled temporarily for mobile artifact isolation */} {/* <fog attach="fog" args={["#0a0a0d", 26, 85]} /> */}` → restore active fog.
2. Track disabled: `{false && <Track reveal={trackReveal} flowMode={flowMode} />}` → restore `<Track reveal={trackReveal} flowMode={flowMode} />`.
3. Ground disabled on mobile: `<Ground withGrid={!isMobile} enabled={!isMobile} />` → restore `<Ground />` (grid only desktop optional; keep enabled).
(Enabled/withGrid props on Ground are harmless; can keep or remove.)

## Other verified facts
- Dev server URL: http://localhost:3000
- Desktop (1280x720) renders perfectly: car upright, dark scene, navbar, product sections.
- StoryOverlay/TelemetryHUD/ProductSections all verified working.
- Next: restore, verify mobile again, then desktop full check, checkpoint, deliver.

## Latest diagnosis (18:15)
Full-page screenshot capture likely scrolls into the storyboard mid-journey: at progress > ~0.28 particleReveal > 0 and CrowdParticles useFrame places 90 white (#F5F5F7) dots along the track curve near the camera — a dense white cloud reading as the "slab" in mobile full-viewport shots. Desktop full-page shots earlier also showed dark ground, but the sticky viewport screenshot at p=0 desktop didn't show the slab because camera at desktop p=0 doesn't face the particle cluster the same way.

Evidence: my green debug sphere at (0,0.5,0) scale 18 in particles useEffect did NOT appear in screenshots — because the screenshot is captured at progress where useFrame overwrites all 90 instance matrices each frame (my init is overwritten every frame once reveal > 0.005). So I cannot easily see one debug dot; instead I should verify by setting COUNT=2 and see if cloud thins, or check screenshot tool scrolls to section.

Key facts:
- CrowdParticles useFrame: travel = (t*0.06 + seeds) % 1 across FULL curve, size = reveal*(0.055+...), scale*18, opacity = reveal*1.6. At reveal=1: 90 dots of radius ~1 spread over whole track. Near the camera start point they form white cluster.
- Particles only visible p>0.28; the mobile screenshots may capture AFTER auto-scroll or the sticky viewport at a scrolled offset.
- Dev URL: http://localhost:3000
- Remaining mobile fix: check screenshot capture scroll position, and verify mobile at true p=0.

## RESOLVED (18:18)
Mobile slab root cause CONFIRMED: CrowdParticles instanced mesh. Fixed by: staggered seeds spread dots along the full curve (never pile up), COUNT 90→40, dot scale factor 18→3, opacity capped 0.45. All debug test values reverted (ground #0c0c10 scale 60, particle color #F5F5F7). Mobile frame now shows discrete drifting dots along the red thread — correct look. Desktop opening frame verified clean earlier.

## Cleanup still needed after debug (regardless of cause)
1. CrowdParticles.tsx: remove the debug green sphere branch (i===0). Restore clean init at (0,-200,0) scale 0.001.
2. Track.tsx ground color: restore #0c0c10 (currently #5b00e8 purple test), scale back to 60 (currently 12 test).
3. Track.tsx: consider removing DoubleSide entirely (already removed), keep z-fight fix (grid at -0.06).
4. StoryScene.tsx lighting: keep reduced values (ambient 0.35, dir 1.6, point 14/8) — they're good.
5. Verify desktop + mobile, checkpoint, deliver.

## Full-page review findings (18:19)
The full-page desktop capture reveals two issues:
1. A huge black dead zone between the sticky storyboard (300vh-ish) and the product sections — the product sections don't start until ~65% of the page. The storyboard section is 500vh on desktop; the product sections begin after it. This is by design (scroll story first) but creates long emptiness in a full-page thumbnail. Not a bug for real usage — users scroll. But the reviewer notes "long uncaptioned darkness". Mitigation: add faint background story labels/track-context to the storyboard DOM layer across the whole scroll range, and ensure the sticky 3D canvas stays in viewport so the scroll is never empty while scrolling.
2. Style review asks: sharper F1 car precision, stronger red-thread motif, technical typography (already Titillium), stronger brand wordmark, continuous SEE→PREDICT→EXPLAIN→REROUTE→ACT narrative.

## Plan for one holistic polish pass (then checkpoint + deliver)
1. StoryOverlay: add chapter markers (small mono labels at right edge: 01 THE RACE / 02 RACING LINE / 03 CROWD FLOW / 04 PREDICT / 05 DIGITAL TWIN / 06 GUARDIAN) visible through the whole scroll so the dark stretch always has context.
2. Red thread motif: add a persistent vertical red progress line connecting hero → CTA (a thin fixed left-edge line filling with progress), and carry the red accent into product section numbers.
3. Typography: ensure all headings use Titillium Web uppercase with letterspacing; check ProductSections headings.
4. Car: add sharper livery touches (white/red sponsor-style stripe panels, sharper sidepod geometry, small number "1" decal) — keep primitive-based but more precise proportions.
5. Wordmark: make navbar wordmark larger with a distinctive flag mark.

## Polish pass status (18:20)
- DONE: chapter rail added to StoryOverlay (right-edge rail, 6 chapters, red progress line, mono labels, hidden md:right-8). TS check passes.
- TODO next in this pass:
  1. Sharpen F1 car livery in F1Car.tsx (add number-1 decal, sharper sidepod angles, white sponsor stripe accents, keep primitives).
  2. Navbar wordmark: bigger + flag mark (check client/src/components/ui/Navbar.tsx).
  3. ProductSections headings: ensure uppercase technical look w/ red chapter numbers (check headings already use font-display uppercase; add red 01-04 index marks if missing).
  4. Final screenshots desktop+mobile, then checkpoint + deliver (first delivery checkpoint = ONLY ONE).
- Style review amendments accepted: technical motorsport typography, red thread as system motif, car reads premium. ideas.md exists at project root — may append Style Decisions.
- IMPORTANT: no second request_style_review allowed in this cycle (one trusted review per checkpoint).
- Console log shows a stale 18:16 Babel parser error — predated the syntax fix; tsc now 0 errors. Confirm no NEW console errors before deliver.

## NEW REQUEST (after first delivery, checkpoint a884dc6f)
User: single page — REMOVE the 4 separate product sections (Predict/Understand/Reroute/Act rendered below storyboard) and MOVE their MAIN details into the 6 scroll chapters of the storyboard. Each chapter must show ONLY its own info, nothing from other sections. Also remove "unnecessary details already present". Chapter 6 (Guardian) must not show everything — a small final beat only.

Key mapping plan (story chapter → product detail):
- 02 Racing line (p ~0.26–0.38): no product info (pure analogy) — maybe keep minimal.
- 03 Crowd flow (p ~0.42): add line: "Live sensing — cameras/counters feed a live crowd model" (Understand detail).
- 04 Predict (p ~0.56–0.68): the "Congestion in 6 minutes" card — Gate B, risk 82, T-06:12, critical status + risk-factor list (Understand + Predict).
- 05 Digital twin (p ~0.72): the reroute cards (+566/+186s comparison, route map) + decision timeline.
- 06 Guardian (p ~0.88): minimal brand + CTA only; audit-log detail removed from separate section.
- Remove ProductSections usage from Home.tsx / drop product page sections; keep only a footer CTA inside chapter 06.

Files involved:
- client/src/pages/Home.tsx — renders Storyboard + ProductSections (remove ProductSections)
- client/src/components/storyboard/StoryOverlay.tsx — per-chapter DOM text (add detail cards per chapter window)
- client/src/components/storyboard/StoryScene.tsx — 3D camera/story, keep
- client/src/components/storyboard/ProductSections.tsx — can delete; keep maybe a minimal TelemetryHUD? HUD stays.
- Chapter windows currently: scene01 0.0–0.08, racing line 0.26–0.36, crowd flow 0.38–0.5, predict 0.56–0.68, digital twin 0.7–0.82, guardian 0.86–1.0.

Note: deployed already at demo environment — user published from UI.

## Product detail content to migrate (from ProductSections.tsx lines 170–352)
1. PREDICT card: Gate B, risk 82/100, T−06:12, ▲ CRITICAL; line "Reactive → Predictive".
2. UNDERSTAND: bottleneck factors (BOTTLENECK_FACTORS, labels+% + progress bars from top of file); MonacoMap SVG (function ~line 120, props highlightSafe).
3. REROUTE: two panels — Current route +0 sec ▲ HIGH CROWD EXPOSURE (red); Recommended route +18 sec ✓ −63% CROWD EXPOSURE (green); MonacoMap highlightSafe.
4. ACT: decision timeline list (DECISION_TIMELINE, times + events + signals: monitor/intervention/resolved with SIGNAL_COLORS) in an acg-panel.
5. Footer CTA: "See → Predict → Explain → Reroute → Act" + "AI Crowd Guardian" + "Request the demo" button.

## How to integrate into StoryOverlay chapters (per user request: each chapter shows ONLY its own info)
- Chapter 03 Crowd flow (0.38–0.5): add "LIVE SENSING" micro-label + short line about sensing feeding the model (from UNDERSTAND intro idea, minimal).
- Chapter 04 Predict (0.56–0.68): add the 4 stat mini-panels (Gate B, 82/100, T−06:12, CRITICAL) + bottleneck factor bars under the heading. These are the MAIN details of Predict+Understand.
- Chapter 05 Digital twin (0.7–0.82): add reroute comparison (+0 vs +18 sec, exposure) — the map SVG is heavy; include MonacoMap highlightSafe here as the "digital twin" visual. Decision timeline → keep OUT (cut as "already covered"/unnecessary) OR move small? User said remove unnecessary that are already present; timeline is unique → add small version in ch05 or ch06? Keep in ch05 timeline panel (compact).
- Chapter 06 Guardian (0.86–1.0): keep headline + CTA button only, NO other info.
- Keep chapters 01/02 analogy-only.
- Remove ProductSections from Home.tsx, delete ProductSections.tsx.
- Note MonacoMap, BOTTLENECK_FACTORS, DECISION_TIMELINE, SIGNAL_COLORS defined in ProductSections.tsx — move definitions into a new data file client/src/data/insights.ts before deletion.
- Storyboard sticky height stays (500vh desktop); phase logic in useStoryboardScroll "product" phase no longer used — fine to leave.
- Chapter rail already shows 01..06, good.

## Current task state (2026-08-13 18:50)
User request 3: Remove OLD information from 6 sections; only project details per section; exactly 1 info block per section; current info disappears and is replaced by the next section's info when scrolling.

DONE: Rewrote StoryOverlay.tsx with infoWindow() non-overlapping windows:
- 01 The idea [0.0, 0.17): headline + one-liner product pitch (bottom-left)
- 02 How it works [0.17, 0.34): reactive-too-late + SEE→PREDICT pipeline (right)
- 03 Data [0.34, 0.51): live sensing panel + 32 cameras / 8 gates / 1s update (right)
- 04 Predict [0.51, 0.68): Gate B 82/100 T−06:12 CRITICAL + bottleneck factors (left)
- 05 Digital twin [0.68, 0.85): reroute comparison + MonacoMap (right, bottom)
- 06 Guardian [0.85, 1.0]: brand headline + Request demo CTA (left)
- CHAPTERS rail updated: "The idea / How it works / Data / Predict / Digital twin / Guardian" at ats 0.0/0.17/0.34/0.51/0.68/0.85

Old content removed: "Every crowd has a flow", "A race car knows its line", "A crowd needs one too", "Don't wait for congestion", "The line becomes intelligence" analogy headings + duplicated racing metaphors.

Observation from screenshots: opening frame (p=0) shows car + rail but the 01 text block does NOT render in capture — probably the capture happens at a scrolled state OR the intro camera phase hides it (StoryScene cameraIntro ~1.5s). The /#acg-storyboard shot is a scrolled state (dark, car centered).
NOTE: previous session showed info text rendering fine at p=0 (e.g., "Every crowd has a flow" was visible). Difference now: capture tool may scroll page instantly; screenshot at "/" earlier showed rail + car but no scene text — check sceneRamp windows: scene 01 style = infoWindow(p,0,0.17) → at p=0 sceneRamp(0,0,0.06)=0 → OPACITY ZERO at exact p=0! That's why text missing at top. Need smaller fade (0.01) or start ramp from 0 with quick rise. Previous overlay used windowStyle(p,0.0,0.08) with sceneRamp(0,0,0.08)=0 too... but earlier screenshots DID show text at start. Because cameraIntro fade? Earlier version sceneRamp in scene 01 was (0.0,0.08) also zero at p=0... hmm earlier opening screenshot showed text. Maybe because page load scroll offset. Fix anyway: use fade=0.03 for first window and ensure at p=0 text is visible (ramp from a=0: t=0 at p<=a... sceneRamp returns 0 when p<=a; at p=0 exactly, t=0). The old version's screenshots captured with scroll offset > 0. Simplest robust fix: clamp p>=0.001 via Math.max in windowStyle, or change infoWindow to t = sceneRamp(p, start, start+fade) - ... and for start===0 accept p>=0. Use p' = Math.max(p, 1e-6) * ... Actually easier: shift first window: sceneRamp(p, 0, 0.04). At p=0 still 0. OK just special-case: if p >= start, include a tiny base: t = sceneRamp(p, start, start+fade); fine—user scrolling from top will immediately see it. But screenshot at exact p=0 shows nothing. Acceptable? Better: make the initial state show scene 01 via clamp: p0 = Math.max(p, 0.001) only for computing infoWindow. Simplest edit: const p0 = p || 1e-6; use p0 in all infoWindow calls.
Also cameraIntro in StoryScene lasts ~1.5s fading out overlay? No—scene text overlay is DOM, cameraIntro only animates camera. Text was visible at p=0 in earlier sessions... it worked. So issue is only the capture tool at exact offset 0. Not a real bug but harmless to fix.

## 2026-08-13 18:51 — text visibility still unresolved
- z-20 on StoryOverlay root did NOT make the 01 text appear in screenshots.
- The 3D scene at top renders fine (car, particles, rail); only DOM info text blocks missing.
- Earlier (pre-rewrite) the overlay text DID render at top — the difference: old used `windowStyle(p, 0.0, 0.08)` which returns opacity 0 at p=0 too... but screenshots showed text. So this capture behavior is consistent: the capture tool may capture at exactly scroll=0 where opacity=0, OR there is a black intro overlay in StoryScene.tsx (cameraIntro / introFade that covers the viewport for the first seconds). CHECK StoryScene for an intro mask (e.g., a full-screen div fading black, or cameraIntro lerp that keeps scene dark).
- Next diagnostic: make infoWindow ALWAYS return opacity 1 (constant style {opacity:1}) — if text then appears in screenshot → problem is window math/timing; if still invisible → an intro mask or viewport capture offset is hiding it.
- Also note mobile height 380vh / desktop 500vh; at top rect.top=0 → traveled=0 → p=0.

## 2026-08-13 18:53 — diagnosis in progress
Desktop capture with opacity:1 on scenes 01+02 DID show both text blocks (desktop render confirmed). Mobile captures taken after still show no text at top. Two possibilities: (a) those mobile captures raced the HMR commit, or (b) mobile has a real issue (e.g., overlay hidden by something mobile-only). Next: take one more mobile capture; if text appears → timing only, done. If still missing → check Home.tsx for mobile-only overlay suppression.
