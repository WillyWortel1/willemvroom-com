# Prone foil · first release: prone / surf foil

Static, local-first video inspection app. No backend, API key, payment or video upload.
Core modules and model assets are identical on the NL and EN sites. `index.html` chooses
`nl` or `en`; all UI/status/error/content strings live in `copy.mjs`.
Run `python3 tools/sync-foilcoach.py /path/to/willemvroom-com` from the NL repository
to reproduce the English page. Never edit the English core independently.

## Architecture

Two designs considered: server-side video analysis versus on-device static analysis.
On-device was chosen for privacy, no credentials/costs, compatibility with the existing
GitHub Pages sites. Browser handles decoding; independent IMAGE inference avoids temporal tracker history across retries; MediaPipe handles pose detection; pure
`analysis.mjs` owns confidence, angles and checkpoint selection; `app.mjs` owns one
session, cancellable generation tokens and the UI. Old jobs cannot write to new sessions.
No library controls the DOM and no third-party service receives user media.

- `measure(pose, width, height, camera)`: visible torso, side-view 2D knee angle.
- `checkpoints(frames)`: four chronological visible samples (not phase recognition).
- `nearest(frames, t)`: overlay permitted only close to sampled timestamps.
- `copy.mjs`: localized content, prone goals and four editable phase labels.
- `sync-foilcoach.py`: shared source -> English render, identical behavioral assets.

## Runtime and boundaries

Vendored `@mediapipe/tasks-vision@0.10.22-rc.20250304`, SIMD + non-SIMD WASM.
Google's official Pose Landmarker Lite float16 model version 1:
https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
MediaPipe Apache-2.0 license retained in `vendor/LICENSE.txt`.
CPU delegate avoids requiring WebGL. First analysis downloads ~16MB of runtime/model
from this site. Main-thread inference yields between frames. Maximum 30s at 3 fps.
No automatic board tracking, depth, force/foot pressure, speed or skill score.
Visibility threshold .65 is a tracking quality gate, not a coaching target.
Angles use actual image aspect ratio, never normalized x/y as if pixels were square.
Only fixed-side view + standing phases expose angles. Left/right comparisons stay separate.
Moving-camera/paddling clips support skeleton and manual visual inspection.
Four initial moments are time-distributed visible frames, not automatically detected
paddling or pump phases: users adjust each checkpoint. Multiple visible riders are not
supported; frame one rider. Video format support depends on the browser decoder.
General drills are separate from measured observations and link to opened source pages.

## Verification

`node --test foilcoach/analysis.test.mjs` tests geometry, confidence gating,
missing poses, camera restriction, nearest frame bounds, checkpoints and both languages.
`node --check foilcoach/app.mjs` checks entry syntax.
Native MediaPipe smoke test with this exact model on the private local X reference
(golf, NOT foil validation): 8/10 sampled frames detected a pose with visible torso.
No reference footage is included in this repository.
Browser model loading, file upload, resize/overlay registration, video controls,
cancellation/re-upload, no-person input, format failure and 390/1280 responsive checks
must be performed in a real browser before release. Native model test does NOT prove
the WASM/browser pipeline or foil-specific tracking. No claim of foil-coaching validation.

## Sources and API references

- https://www.akdurablesupplyco.com/news/pump-foiling-101/ — prone pump motion, setup-specific cadence
- https://caseyaus.com/courses/surf-foil/ — wave riding versus connecting waves by pumping
- https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js — official API reference

## Manual QA

1. Choose MP4; play/pause, scrub, .25/.5/1 speed. Run a 3-second side-view passage.
2. Verify progress and actual skeleton; scrub/checkpoints overlay same person at same time.
3. Set checkpoint to current frame; compare same-leg angle delta. Export JSON.
4. Cancel mid-analysis, upload another file mid-job, retry; no stale images/results.
5. Blank video -> no visible rider; moving view -> no knee angles. Paddling -> no knee angles.
6. Invalid file / unsupported codec -> useful error; block model -> manual mode, no fake AI.
7. Check NL/EN text, keyboard, 390px/1280px layout and dark mode.

## Revision 2: complete prone review

- User-selected rider ROI: pointer drag or accessible percentage bounds. Coordinates
  remap from cropped model input to the full original video; resolution is not invented.
- Partial skeletons without an acceptable torso are suppressed, including thumbnails.
- Independent IMAGE inference on a canvas sample removes cross-run temporal tracking
  state. Native repeated-pixel test: 3 runs × 4 frames, maximum landmark delta 0.
  Browser repeatability still requires checking; prior browser VIDEO runs differed.
- Re-upload clears time, ROI, results, rider review/stance/direction, camera view and speed.
- Optional 2D torso/elbow/hip/nose relationships use only supported views/visible points.
  They do not infer gaze, foot pressure, foil geometry or height above water.
- Six-stage rider-confirmed review covers water, wave, start, feet, loading, hips,
  torso, arms/hands, head, flight, pumping and energy. Selected priorities may link
  to actual editable checkpoints. Personal plans are explicitly user-confirmed,
  not automatic technique diagnoses.
- Full Josh Ku reference review is organized in a collapsible bilingual library.
  Equipment preferences and advanced ideas are separated from beginner practice.
- URL remains /foilcoach/ on both sites; exact visible name is Prone foil.
- Josh Ku source contains a large presenter and distant surfer. It is NOT training
  data or proof of valid on-water pose measurement. Native full-frame crop: 41 poses,
  zero accepted torso/knee samples. Cropping removes competing people, not lost detail.

Tests: `node --test foilcoach/*.test.mjs`. Final browser QA must cover the new ROI,
manual review/plan/export, suppressed wrong-person skeleton, repeatability and mobile.

## Final QA refinements

- Automatic suggestions require four distinct reliable timestamps. Sparse observations
  do not duplicate one timestamp into four purported manoeuvre phases. Manual moments
  remain independently placeable.
- Summary ranges cover all sampled frames, not only four checkpoints. Metric-specific
  sample counts are displayed and exported; a missing checkpoint value is not a claim
  that the entire passage was unmeasurable.
- JSON includes the actual generated plan, localized rendered text, action/source,
  confirmed priority, linked evidence and provenance; manual-only export is tested.
- Tight ROI guidance explicitly asks for generous full-body, hand and foot margins.
- Available prone QA exports used different vertical ROI bounds (NL y=.12514,h=.52607;
  EN y=.06242,h=.68794). Their 1/42 vs 0/42 accepted-frame result is not an identical-input
  determinism comparison. Full-frame golf exports were identical across repeated NL/EN runs.
- Static responsive audit: min-width:0 on nested grid/flex content, wrapping long
  measurement/plan text, 700px single-column breakpoint, contained horizontally
  scrollable tabs, 44px controls. Actual 390px browser testing has NOT been performed.

DOM regression test (jsdom dev dependency, not used by the app):
`JSDOM_MODULE=/absolute/path/to/jsdom/lib/api.js node tools/test-foilcoach-dom.mjs`
Tests both localizations, plan evidence/provenance, review reset, actual app initialization
         and manual-only JSON export containing the generated plan.
