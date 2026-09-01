# Gujarat Cyber Vision --- Sentinel Shield 2.4

## Hackathon Compliance, Gap Analysis & Runtime Verification Specification

> **Purpose:** This document converts the current architecture document
> into a submission-ready implementation and verification specification
> aligned with the supplied Sentinel hackathon stream requirements.
>
> **Important:** A feature is marked **IMPLEMENTED** only when the
> current architecture document explicitly describes it. A feature
> marked **REQUIRED / MISSING** is a requirement that must still be
> implemented or runtime-tested. A checkbox must not be marked PASS
> merely because code is described in the architecture.

------------------------------------------------------------------------

# 1. Compliance Status

## 1.1 Current assessment

The existing architecture document describes a strong
ingestion/AI/dashboard architecture, including RTSP over TCP, PTS
timing, reconnect backoff, `/api/ingest`, mixed codecs, YOLOv8 +
ByteTrack, ANPR, alerts and a dashboard.

However, the previous document's statement **"Hackathon Submission
Checklist (100% Passed)"** is not sufficient evidence of runtime
verification. The checklist records implementation claims, but does not
provide test logs, measured results, controlled fault injection, or
pass/fail evidence.

Therefore:

  Area                             Current status
  -------------------------------- -------------------------------------
  RTSP over TCP configuration      IMPLEMENTED / VERIFY
  PTS-based timing                 IMPLEMENTED / VERIFY
  FPS-independent timing           REQUIRED VERIFICATION
  Arrival-time independence        REQUIRED VERIFICATION
  Irregular frame-gap handling     MISSING TEST
  Automatic reconnect              IMPLEMENTED / VERIFY
  Exponential backoff              IMPLEMENTED / VERIFY
  Decoder warning tolerance        CLAIMED / RUNTIME TEST REQUIRED
  `/api/ingest` catalogue          IMPLEMENTED / VERIFY
  Per-camera properties            IMPLEMENTED / VERIFY
  Mixed H.264/H.265                CLAIMED / RUNTIME TEST REQUIRED
  Mixed resolutions                CLAIMED / RUNTIME TEST REQUIRED
  Scene discontinuity recovery     MISSING TEST / IMPLEMENTATION CHECK
  Live-only processing             REQUIRED VERIFICATION
  No publishing to gateway         REQUIRED VERIFICATION
  Load pacing / camera lifecycle   REQUIRED
  Evidence-based test report       MISSING
  End-to-end acceptance suite      MISSING

------------------------------------------------------------------------

# 2. Exact Stream Behaviour Requirements

The system SHALL satisfy the following requirements.

## 2.1 RTSP transport

### Requirement

Every RTSP client must force RTSP over TCP.

### Required behaviour

-   Set the RTSP transport to TCP.
-   Do not rely on UDP as the default.
-   Do not silently fall back to UDP.
-   If the RTSP endpoint cannot be consumed because port 8554 is
    unavailable, use the permitted HLS playback fallback where
    applicable.
-   Record the selected transport in diagnostics.

### Current implementation

The architecture specifies:

``` python
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
```

### Verification

**TC-01 --- RTSP TCP Enforcement**

Expected: - RTSP connection succeeds using TCP. - No UDP transport is
selected. - The client remains functional across NAT/firewall conditions
where TCP is available.

Evidence: - FFmpeg/OpenCV connection log. - Transport configuration
log. - Successful frame reception.

PASS criteria: - TCP is explicitly configured. - Stream receives valid
frames. - No UDP fallback occurs.

------------------------------------------------------------------------

# 3. Timing Requirements

## 3.1 Never trust reported FPS

The application must NOT use `CAP_PROP_FPS` as the authoritative source
for elapsed time.

Forbidden:

``` python
fps = cap.get(cv2.CAP_PROP_FPS)
speed = pixels_per_frame * fps
```

or equivalent logic.

### Required replacement

Use timestamps/PTS:

``` python
pts_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
delta_t = (pts_ms - previous_pts_ms) / 1000.0
```

All motion, dwell, velocity and time-derived calculations must use
actual elapsed PTS.

------------------------------------------------------------------------

## 3.2 Never use frame arrival time

The application must not calculate motion timing from:

``` python
time.time()
datetime.now()
time.perf_counter()
```

at the instant a frame arrives.

These may be used for: - logging, - health monitoring, - watchdog
timers, - reconnect scheduling,

but not as the media timeline for tracking or motion calculations.

### TC-02 --- PTS Timing Independence

Test: 1. Connect to a stream. 2. Record PTS for every frame. 3. Record
local arrival time separately. 4. Artificially delay frame processing.
5. Compare tracker/motion calculations.

Expected: - Motion timing remains based on PTS. - Processing delays do
not alter calculated object velocity/dwell time.

PASS: - All media-time calculations trace back to PTS/RTP timestamps.

------------------------------------------------------------------------

# 4. GOP Join / Buffered Frames Requirement

When a client connects, the gateway may replay buffered frames around a
GOP/keyframe.

Therefore: - Initial frames may arrive faster than real time. - Arrival
rate must not be interpreted as media time. - The first frames after
connection must not generate impossible velocities solely because they
arrived rapidly.

### TC-03 --- GOP Burst Join

Test: 1. Connect to a stream. 2. Record the first 2 seconds of frames.
3. Compare arrival intervals with PTS intervals. 4. Feed frames to
ByteTrack/motion logic.

Expected: - Tracker uses PTS deltas. - No velocity spike is caused by
fast arrival. - Pipeline does not reject the stream because of the
initial burst.

PASS: - No impossible speed is produced solely by connection-time
buffering.

------------------------------------------------------------------------

# 5. Variable Frame Rate / Irregular Gaps

The system must not assume constant frame intervals.

### Required behaviour

-   Accept non-uniform PTS deltas.
-   Do not crash when frames are delayed.
-   Do not treat every large inter-frame gap as a disconnect.
-   Motion models must use actual elapsed PTS.
-   A configurable health timeout may detect genuine stream loss, but
    this must be independent from normal variable frame spacing.

### TC-04 --- Irregular Frame Gaps

Test sequence:

``` text
Frame 1: PTS 0.000
Frame 2: PTS 0.033
Frame 3: PTS 0.066
Frame 4: PTS 0.200
Frame 5: PTS 0.233
Frame 6: PTS 0.500
Frame 7: PTS 0.533
```

Expected: - Pipeline continues. - No false disconnect. - Tracker uses
the actual delta for each pair.

PASS: - No crash, stall, tracker corruption or false reconnect.

------------------------------------------------------------------------

# 6. Reconnect Requirements

Feeds may restart and the application must reconnect automatically.

## Required backoff

Minimum expected strategy:

``` text
2s
4s
8s
16s
30s
30s
...
```

Maximum backoff: approximately 30 seconds.

### Forbidden

``` python
while not connected:
    connect()
```

with no delay.

### TC-05 --- Feed Restart

Test: 1. Start a healthy stream. 2. Confirm frame reception. 3.
Stop/restart the feed. 4. Observe reconnect behaviour.

Expected: - Capture failure is detected. - Existing worker state is
handled safely. - Reconnect starts automatically. - Backoff increases. -
Backoff is capped around 30 seconds. - Stream resumes after source
recovery.

Evidence: - Timestamped reconnect logs.

Required log format:

``` text
[10:00:00] STREAM_LOST camera=CAM-001
[10:00:02] RECONNECT_ATTEMPT camera=CAM-001 attempt=1
[10:00:06] RECONNECT_ATTEMPT camera=CAM-001 attempt=2
[10:00:14] RECONNECT_ATTEMPT camera=CAM-001 attempt=3
[10:00:30] STREAM_RESTORED camera=CAM-001
```

PASS: - No tight reconnect loop. - Stream recovers automatically.

------------------------------------------------------------------------

# 7. Decoder Warning Requirements

The evaluation grid contains H.264 and H.265.

At a mid-stream join, decoder warnings may appear before the first
usable IDR/keyframe.

Examples include:

``` text
Error constructing the frame RPS
Could not find ref with POC
```

These warnings must not automatically terminate the stream pipeline.

### Required behaviour

-   Log decoder warnings.
-   Continue decoding.
-   Wait for a usable keyframe/IDR.
-   Resume normal processing.
-   Reconnect only when the stream is genuinely unavailable.

### TC-06 --- Mid-stream Decoder Join

Test: 1. Attach to an active H.264 stream. 2. Attach to an active H.265
stream. 3. Start at a non-keyframe point if possible. 4. Record decoder
output.

Expected: - Initial warnings may be logged. - Pipeline remains alive. -
Valid frames begin processing after keyframe/IDR. - No reconnect loop
caused only by decoder warnings.

PASS: - Warning is non-fatal. - First valid frame is eventually
processed.

------------------------------------------------------------------------

# 8. `/api/ingest` Requirement

The camera catalogue must be read dynamically from:

``` text
GET /api/ingest
```

The system must not hard-code the evaluation camera list.

## Required per-camera information

At minimum consume the catalogue information made available by the
gateway, including: - camera ID - codec - resolution -
endpoint/protocol - RTSP endpoint - WebRTC WHEP endpoint where
provided - HLS endpoint where provided

### TC-07 --- Catalogue Synchronization

Test: 1. Request `/api/ingest`. 2. Parse the response. 3. Validate
camera records. 4. Select a camera dynamically. 5. Open the selected
endpoint.

Expected: - Camera list is generated from the API response. - No
manually maintained evaluation-camera list is required. - Per-camera
codec/resolution is retained.

PASS: - Dynamic catalogue drives stream selection.

------------------------------------------------------------------------

# 9. Mixed Codec Requirement

The system must handle both:

``` text
H.264
H.265
```

without requiring one global codec assumption.

### Required architecture

Each camera session must retain its own:

``` text
codec
resolution
endpoint
transport
decoder configuration
buffer sizing
```

### TC-08 --- Mixed Codec Matrix

  Test   Codec                         Expected
  ------ ----------------------------- ----------
  8.1    H.264                         PASS
  8.2    H.265                         PASS
  8.3    H.264 → H.265 camera switch   PASS
  8.4    H.265 → H.264 camera switch   PASS

PASS: - Both codecs decode. - No process-wide codec assumption breaks
another camera.

------------------------------------------------------------------------

# 10. Mixed Resolution Requirement

The application must not assume one global frame shape.

Example test matrix:

  Resolution                       Expected
  -------------------------------- ----------
  640×480                          PASS
  1280×720                         PASS
  1920×1080                        PASS
  Other catalogue-provided sizes   PASS

### Required behaviour

-   Read resolution from `/api/ingest`.
-   Allocate/resize processing resources appropriately.
-   Do not force every camera into one unsafe fixed tensor/frame buffer.
-   Inference preprocessing may resize frames to the model's expected
    input, while preserving source metadata.

### TC-09 --- Mixed Resolution Test

Connect to cameras with at least three different resolutions.

Expected: - All streams decode. - No array-shape exceptions. - No
corrupted frames. - Dashboard correctly identifies source resolution.

------------------------------------------------------------------------

# 11. Scene Discontinuity Requirement

The stream is continuous but loops.

At the loop point, the scene may abruptly change.

This must be treated similarly to a camera reboot/hard cut.

## Required state recovery

After a discontinuity: - stale object tracks must not live
indefinitely; - tracker state must recover; - stale license-plate
associations must expire; - re-identification state must be reset or
aged appropriately; - background state must recover if background
modelling is used; - alerts must not be duplicated because of stale
state.

### TC-10 --- Scene Discontinuity

Test: 1. Run one camera continuously. 2. Capture the loop/cut point. 3.
Observe tracking before and after the cut. 4. Inspect track IDs and
cached plate associations.

Expected: - Pipeline remains alive. - Old tracks are
terminated/recovered. - New scene objects receive valid tracking
state. - No stale plate is attached to a new vehicle. - No duplicate
alert storm occurs.

PASS: - Scene transition is handled without crash or persistent state
corruption.

------------------------------------------------------------------------

# 12. Live-Only Consumption Requirement

The evaluation explicitly exercises live streams.

The implementation must be designed around live capture.

## Forbidden as an evaluation strategy

-   Downloading the gateway footage.
-   Building the solution around pre-recorded copies of the evaluation
    streams.
-   Treating `/stream/<id>` as a normal downloadable file.
-   Using a local recording as a substitute for live ingestion.

### TC-11 --- Live Capture

Test: 1. Start application. 2. Connect directly to a live evaluation
endpoint. 3. Confirm frames are consumed continuously. 4. Stop the
source. 5. Confirm the application detects the live interruption.

PASS: - Application works without requiring a downloaded copy.

------------------------------------------------------------------------

# 13. Consume-Only Gateway Requirement

The application must consume streams only.

It must NOT: - publish a stream to the gateway; - push media to gateway
endpoints; - invoke gateway control APIs; - modify gateway state.

### TC-12 --- No Publish / No Control

Review: - HTTP methods. - Network requests. - RTSP connection
direction. - Gateway API calls.

Expected: - Only catalogue/allowed read operations are performed. - No
publish/write/control request is generated.

PASS: - Network trace confirms consume-only behaviour.

------------------------------------------------------------------------

# 14. Load Pacing Requirement

Each connected client receives its own stream copy.

Therefore the application must not open all cameras unnecessarily.

## Required behaviour

-   Connect only to cameras currently required for processing.
-   Close captures when processing is stopped.
-   Release decoder resources.
-   Release worker threads.
-   Release OpenCV captures.
-   Avoid repeatedly opening/closing the same camera in a tight loop.

### TC-13 --- Camera Lifecycle

Test: 1. Open camera A. 2. Process it. 3. Close camera A. 4. Verify
resources are released. 5. Open camera B. 6. Repeat multiple times.

PASS: - No file descriptor/resource leak. - No growing thread count. -
No growing decoder count. - Closed cameras no longer receive processing
resources.

------------------------------------------------------------------------

# 15. Multi-Thread Pipeline Requirements

The architecture currently describes:

``` text
Thread 1 → Frame Capture
Thread 2 → AI Inference
Thread 3 → JPEG/Web Delivery
```

This is appropriate, but the implementation must be tested for queue
pressure.

## Required safeguards

-   bounded queues;
-   frame dropping policy when inference is slower than capture;
-   no unbounded memory growth;
-   graceful shutdown;
-   worker exception isolation;
-   camera-specific state.

### TC-14 --- Backpressure

Artificially slow AI inference.

Expected: - Capture thread does not allocate unlimited frames. - Memory
remains bounded. - Latest/appropriate frames continue processing. - Web
output remains responsive.

------------------------------------------------------------------------

# 16. AI Detection Requirements

Current architecture specifies YOLOv8 Nano and ByteTrack.

Required vehicle classes include: - car - motorcycle - truck - bus

Pedestrian detection is also described.

### TC-15 --- Detection

Test: - Vehicle enters frame. - Detector identifies object. - Bounding
box is generated. - Tracker creates track ID.

PASS: - Detection and tracking operate without breaking the stream
pipeline.

------------------------------------------------------------------------

# 17. ByteTrack Requirements

The tracker must: - maintain IDs across normal frames; - use PTS-aware
timing where motion prediction is time-dependent; - recover after
temporary missed frames; - recover after scene discontinuity; - expire
stale tracks.

### TC-16 --- Tracking Continuity

Test: 1. Vehicle enters frame. 2. Vehicle remains visible. 3. Vehicle is
briefly occluded. 4. Vehicle reappears.

Expected: - Tracker behaves consistently. - Track state does not explode
into unlimited IDs.

------------------------------------------------------------------------

# 18. ANPR Requirements

The current architecture describes EasyOCR and per-track plate caching.

Required safeguards:

-   OCR should not run unnecessarily on every frame.
-   OCR results must be associated with the correct track.
-   Low-confidence plate reads must not immediately create a critical
    alert.
-   Plate normalization must be deterministic.
-   Cached plate data must expire when the track disappears or the
    camera scene changes.

### TC-17 --- ANPR Stability

Test: - Same vehicle appears across multiple frames. - OCR produces
several reads.

Expected: - OCR cache reduces repeated OCR work. - Normalized plate
remains consistent. - Temporary OCR errors do not immediately overwrite
a reliable result.

------------------------------------------------------------------------

# 19. Watchlist Matching Requirements

The architecture currently describes simulated synchronization with
VAHAN, eGujCop, SARTHI and NAFIS.

For a hackathon demo, the implementation must clearly distinguish:

``` text
REAL GOVERNMENT INTEGRATION
vs.
SIMULATED / MOCK INTEGRATION
```

Do not present a simulated database as a live official connection unless
the required official API access is actually available.

### TC-18 --- Watchlist Match

Test: 1. Insert a controlled demo plate into the approved test
watchlist. 2. Detect the same normalized plate. 3. Trigger matching.

Expected: - Exact match is found. - Alert is generated once. - Incident
is stored. - Dashboard updates.

------------------------------------------------------------------------

# 20. Alert Engine Requirements

Current architecture describes: - `CRITICAL_RED` - incident record -
nearest PCR assignment - toll barricade notification -
`/api/alerts/live`

Required improvements:

-   unique alert ID;
-   timestamp;
-   camera ID;
-   track ID;
-   normalized plate;
-   confidence;
-   source;
-   match type;
-   alert severity;
-   deduplication window;
-   acknowledgement state.

### TC-19 --- Alert Deduplication

Same plate remains visible for 20 seconds.

Expected: - System does not create hundreds of identical critical
alerts. - A configurable deduplication window is applied.

------------------------------------------------------------------------

# 21. API Verification

Required API smoke tests:

``` text
GET  /api/ingest
GET  /api/stats
GET  /api/video_feed
GET  /api/watchlist
GET  /api/alerts/live
POST /api/gateway/connect
```

For each endpoint record: - HTTP status; - response schema; - latency; -
authentication requirement; - failure behaviour.

### TC-20 --- API Smoke Suite

PASS requires all required endpoints to return expected responses
without crashing the backend.

------------------------------------------------------------------------

# 22. Authentication & Security Gaps

The current architecture claims JWT authentication and officer roles.

Before submission verify:

-   password is not hard-coded in production;
-   default demo credentials are removed or clearly labelled demo-only;
-   passwords are hashed;
-   JWT expiry is configured;
-   invalid JWT is rejected;
-   unauthorized users cannot access protected endpoints;
-   secrets are stored in environment variables;
-   CORS is restricted appropriately;
-   API errors do not expose secrets.

### TC-21 --- Authentication

Tests: 1. Valid login. 2. Invalid password. 3. Missing token. 4. Expired
token. 5. Invalid token. 6. Unauthorized role.

Expected: - Access control works correctly.

------------------------------------------------------------------------

# 23. Dashboard Requirements

The current dashboard describes: - analytics; - camera grid; - GPS
hubs; - GIS map; - vehicle inventory; - plate search; - evidence
vault; - alert log; - stolen vehicle registry; - blacklist hotspot map.

These should be tested as user-visible functions rather than only being
listed in the architecture.

### TC-22 --- Dashboard Smoke Test

Verify: - login; - camera catalogue; - camera selection; - live
stream; - AI overlay; - vehicle table; - plate search; - alert
display; - alert history; - map; - API status.

------------------------------------------------------------------------

# 24. Performance Verification

The architecture claims 30+ FPS and a 30--60 FPS stream engine.

These claims require measured evidence.

Do not use:

``` text
CAP_PROP_FPS
```

as proof of actual delivered FPS.

Measure:

``` text
processed_frames / measured_PTS_interval
```

and separately report: - capture FPS; - decode FPS; - inference FPS; -
output FPS; - end-to-end latency; - dropped frames; - CPU usage; - RAM
usage; - GPU usage if applicable.

### TC-23 --- Real FPS

Run for at least a defined measurement window.

Record:

``` text
Camera ID
Codec
Resolution
PTS start
PTS end
Frames processed
Dropped frames
Measured FPS
Inference FPS
Output FPS
```

PASS: - Measurements are based on actual observed frames/timestamps.

------------------------------------------------------------------------

# 25. Stability / Soak Test

### TC-24 --- Long-Running Stream

Run a camera for an extended test period.

Monitor: - memory; - CPU; - thread count; - reconnect count; - frame
drops; - exceptions; - queue size; - tracker count.

PASS: - No progressive memory leak. - No unbounded queue growth. - No
repeated reconnect loop. - No fatal worker crash.

------------------------------------------------------------------------

# 26. Failure Injection Matrix

The final submission must include controlled failure tests.

  Failure                              Expected result
  ------------------------------------ ---------------------------
  RTSP temporarily unavailable         Backoff + reconnect
  Network delay                        Pipeline remains stable
  Frame gap                            No false crash
  Decoder warning                      Warning logged, not fatal
  H.264 source                         Decodes
  H.265 source                         Decodes
  Resolution change/source variation   Per-camera handling
  Scene cut                            State recovery
  OCR failure                          Stream continues
  Detector exception                   Worker isolated
  API temporary failure                Graceful error
  Camera close                         Resources released
  Backend restart                      Services recover

------------------------------------------------------------------------

# 27. Logging Requirements

Every stream should have structured logs.

Recommended fields:

``` text
timestamp
camera_id
event
codec
resolution
pts
arrival_time
frame_number
track_count
inference_ms
queue_size
reconnect_attempt
error
```

Example:

``` text
2026-09-01T10:00:02
camera=CAM-10001
event=FRAME
codec=H264
resolution=1920x1080
pts=12540.33
tracks=4
inference_ms=18.2
queue_size=2
```

------------------------------------------------------------------------

# 28. Required Test Evidence Directory

Create:

``` text
tests/
├── test_rtsp_tcp.md
├── test_pts_timing.md
├── test_gop_join.md
├── test_frame_gaps.md
├── test_reconnect.md
├── test_decoder_warnings.md
├── test_ingest_catalogue.md
├── test_mixed_codecs.md
├── test_mixed_resolutions.md
├── test_scene_discontinuity.md
├── test_live_only.md
├── test_consume_only.md
├── test_load_pacing.md
├── test_backpressure.md
├── test_detection.md
├── test_tracking.md
├── test_anpr.md
├── test_watchlist.md
├── test_alerts.md
├── test_api.md
├── test_auth.md
├── test_dashboard.md
├── test_performance.md
└── test_soak.md
```

Store logs/screenshots separately:

``` text
tests/evidence/
├── rtsp/
├── timing/
├── reconnect/
├── decoder/
├── codecs/
├── resolution/
├── discontinuity/
├── performance/
└── dashboard/
```

------------------------------------------------------------------------

# 29. Final Acceptance Matrix

Do not use `[x]` until runtime evidence exists.

  -------------------------------------------------------------------------------------
  ID         Requirement          Implementation  Runtime Test      Evidence Final
  ---------- ---------------- ------------------ ------------- ------------- ----------
  TC-01      RTSP TCP                        YES      REQUIRED      REQUIRED PENDING

  TC-02      PTS timing              YES/CLAIMED      REQUIRED      REQUIRED PENDING

  TC-03      GOP burst                   PARTIAL      REQUIRED      REQUIRED PENDING
             handling                                                        

  TC-04      Variable frame         MISSING TEST      REQUIRED      REQUIRED PENDING
             gaps                                                            

  TC-05      Reconnect               YES/CLAIMED      REQUIRED      REQUIRED PENDING
             backoff                                                         

  TC-06      Decoder warning             CLAIMED      REQUIRED      REQUIRED PENDING
             tolerance                                                       

  TC-07      `/api/ingest`                   YES      REQUIRED      REQUIRED PENDING

  TC-08      Mixed                       CLAIMED      REQUIRED      REQUIRED PENDING
             H.264/H.265                                                     

  TC-09      Mixed                       CLAIMED      REQUIRED      REQUIRED PENDING
             resolutions                                                     

  TC-10      Scene                       MISSING      REQUIRED      REQUIRED PENDING
             discontinuity                                                   

  TC-11      Live-only                  REQUIRED      REQUIRED      REQUIRED PENDING

  TC-12      Consume-only               REQUIRED      REQUIRED      REQUIRED PENDING

  TC-13      Load pacing                REQUIRED      REQUIRED      REQUIRED PENDING

  TC-14      Backpressure               REQUIRED      REQUIRED      REQUIRED PENDING

  TC-15      Detection                       YES      REQUIRED      REQUIRED PENDING

  TC-16      Tracking                        YES      REQUIRED      REQUIRED PENDING

  TC-17      ANPR                            YES      REQUIRED      REQUIRED PENDING

  TC-18      Watchlist          SIMULATED/VERIFY      REQUIRED      REQUIRED PENDING

  TC-19      Alert                      REQUIRED      REQUIRED      REQUIRED PENDING
             deduplication                                                   

  TC-20      API smoke                       YES      REQUIRED      REQUIRED PENDING

  TC-21      Authentication                  YES      REQUIRED      REQUIRED PENDING

  TC-22      Dashboard                       YES      REQUIRED      REQUIRED PENDING

  TC-23      Real FPS                    CLAIMED      REQUIRED      REQUIRED PENDING

  TC-24      Soak/stability              MISSING      REQUIRED      REQUIRED PENDING
  -------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 30. Implementation Priority

## P0 --- Must complete before evaluation

1.  RTSP TCP enforcement verification.
2.  PTS-only timing verification.
3.  Remove any FPS/arrival-time dependency.
4.  Irregular frame-gap handling.
5.  Reconnect + exponential backoff test.
6.  Decoder-warning tolerance.
7.  Dynamic `/api/ingest`.
8.  H.264/H.265 validation.
9.  Mixed-resolution validation.
10. Scene discontinuity recovery.
11. Live-only capture validation.
12. Consume-only gateway validation.

## P1 --- Required for robust demo

13. Bounded frame queues.
14. Backpressure/drop policy.
15. Camera resource lifecycle.
16. ANPR confidence handling.
17. Plate cache expiry.
18. Alert deduplication.
19. Structured logging.
20. API smoke tests.
21. Authentication tests.
22. Performance measurement.

## P2 --- Quality improvements

23. Long-running soak test.
24. Failure-injection suite.
25. Automated regression tests.
26. Evidence collection automation.
27. Dashboard health indicators.
28. Per-camera diagnostics.

------------------------------------------------------------------------

# 31. Definition of Done

The project is **NOT submission-ready** merely because the architecture
checklist contains `[x]`.

The project is submission-ready only when:

``` text
Every mandatory requirement
        ↓
has an implementation
        ↓
has a reproducible runtime test
        ↓
has recorded evidence
        ↓
has PASS criteria
        ↓
has a final PASS result
```

## Final rule

Use this status model:

``` text
IMPLEMENTED  = Code/architecture exists
TESTED       = Test was actually executed
PASS         = Expected result observed
EVIDENCE     = Log/screenshot/measurement exists
VERIFIED     = IMPLEMENTED + TESTED + PASS + EVIDENCE
```

Only **VERIFIED** items may be marked `[x]` in the final submission
checklist.

------------------------------------------------------------------------

# 32. Final Submission Checklist

``` text
[ ] RTSP TCP verified
[ ] No CAP_PROP_FPS timing dependency
[ ] No frame-arrival timing dependency
[ ] PTS deltas verified
[ ] GOP join burst verified
[ ] Variable frame gaps verified
[ ] Reconnect verified
[ ] Backoff 2s → 30s verified
[ ] Decoder warnings non-fatal
[ ] /api/ingest dynamically consumed
[ ] Per-camera codec consumed
[ ] Per-camera resolution consumed
[ ] H.264 verified
[ ] H.265 verified
[ ] Mixed resolutions verified
[ ] Scene discontinuity verified
[ ] Live-only processing verified
[ ] No gateway publishing verified
[ ] No gateway control API usage verified
[ ] Camera lifecycle/resource release verified
[ ] Bounded queue verified
[ ] Backpressure verified
[ ] Detection verified
[ ] Tracking verified
[ ] ANPR verified
[ ] Plate cache expiry verified
[ ] Watchlist matching verified
[ ] Alert deduplication verified
[ ] API smoke tests passed
[ ] Authentication tests passed
[ ] Dashboard smoke tests passed
[ ] Actual FPS measured
[ ] Latency measured
[ ] Frame drops measured
[ ] Soak test passed
[ ] Evidence archived
[ ] Final compliance matrix signed off
```

# 33. Final Submission Statement

> **Sentinel Shield 2.4 is considered fully compliant only after all
> mandatory runtime tests in this document are executed against the
> evaluation environment and each result is supported by reproducible
> evidence.**

The architecture document currently supports the existence of
RTSP-over-TCP configuration, PTS timing, reconnect backoff, dynamic
`/api/ingest`, mixed-codec intent, AI processing and the dashboard
architecture. It does **not by itself prove runtime verification of
every requirement**.

Therefore, this document deliberately uses **PENDING** rather than
falsely claiming 100% verification.
