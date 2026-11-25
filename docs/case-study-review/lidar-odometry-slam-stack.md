# Case study review — LiDAR Odometry & SLAM Stack

- **Project:** project-1 · [/projects/lidar-odometry-slam-stack/](https://kshitijsharma2204.github.io/portfolio/projects/lidar-odometry-slam-stack/) · source: https://github.com/kshitijSharma2204/cpp_slam_stack
- **Status:** `draft` — not shown on the public site
- **Evidence snapshot:** [Repository at review time (branch slam_stack)](https://github.com/kshitijSharma2204/cpp_slam_stack/tree/00a7257c8af625ac6c4d591172b5216db253a3ba)
- **To publish:** confirm every statement below is accurate and publishable, resolve the review notes, then change `"status": "draft"` to `"approved"` for this entry in `src/data/case-studies.json`.
- **Preview locally:** `npm run preview:drafts`, then open the project page at http://127.0.0.1:4323/portfolio/

## Review notes (owner decision needed)

- [ ] The site title says "SLAM Stack", while the repository describes the current system as pure odometry (no loop closure). Consider a title such as "LiDAR Odometry Stack" or keep the title and rely on the limitations section.
- [ ] The existing site description mentions "a persistent thread pool": confirmed in Odometry.cpp.

## Problem

Estimate a vehicle's trajectory from KITTI Velodyne scans alone, with the software structured like a live sensor system: scans replayed at their original capture timing, bounded memory between stages, and the estimate evaluated against ground truth.

## Approach

A producer thread loads a KITTI raw drive and releases scans at their original capture spacing into a fixed-capacity queue. A consumer thread filters each scan, removes motion distortion using OXTS velocity, and registers it against a running voxel map with KISS-ICP-style scan-to-map ICP. Poses are written in KITTI format, evaluated with relative pose error, and can be replayed live in an Open3D viewer.

### Data flow

1. **KITTI replay** — DataLoader reads Velodyne and OXTS frames; ReplayClock/ReplayScheduler pace scans by original capture timestamps. (`src/kitti/, src/replay/`)
2. **Bounded queue** — Fixed-capacity, thread-safe queue; the producer blocks when the consumer falls behind. (`src/pipeline/BoundedQueue.hpp`)
3. **Preprocess** — Reject invalid returns, range filter, voxel downsample. (`src/preprocessor/`)
4. **Deskew** — Re-express each point at a single instant using OXTS velocity over its capture offset. (`src/deskew/Deskew.cpp`)
5. **Scan-to-map ICP** — Constant-velocity initial guess, adaptive correspondence threshold, robust Gauss–Newton against a voxel hash map. (`src/odometry/`)
6. **Evaluate / visualize** — KITTI-format trajectory, relative pose error vs. ground truth, Open3D playback. (`src/evaluation/, apps/`)

## Engineering decisions

### Back-pressure instead of buffering

Stages are connected by a fixed-capacity queue. When odometry falls behind, the reader blocks rather than accumulating scans in memory, which keeps memory use bounded on long drives.

Evidence: [Thread-safe, capacity-bounded queue; push blocks while full](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/src/pipeline/BoundedQueue.hpp)

### Prediction and an adaptive correspondence threshold

Each scan starts ICP from a constant-velocity prediction (the last relative motion applied again). The correspondence distance is three times an adaptive threshold, itself three times the RMS of recent model deviations above a floor, so matching tightens when motion is well predicted.

Evidence: [Constant-velocity prediction; max correspondence distance = 3 × kappa](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/src/odometry/Odometry.cpp#L246-L253) · [Threshold = 3·sqrt(mean squared deviation)](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/src/odometry/AdaptiveThreshold.cpp)

### Robust Gauss–Newton on a persistent thread pool

Nearest-neighbour search and normal-equation accumulation are split across a fixed worker pool that is reused every iteration, with per-thread partial results so no locking is needed. Residuals are down-weighted with a robust kernel, and each step is solved with an LDLT decomposition (up to 500 iterations, 1e-4 convergence).

Evidence: [ThreadPool, parallel correspondences, solveGaussNewton, ICP loop](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/src/odometry/Odometry.cpp#L21-L217)

### Strict build and test discipline

C++20 with -Wall -Wextra -Wpedantic -Werror, unit and integration tests for every module (GoogleTest/CTest), AddressSanitizer, UndefinedBehaviorSanitizer and ThreadSanitizer presets, and a CI workflow.

Evidence: [Warnings as errors, C++20](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/CMakeLists.txt) · [14 unit/integration test files](https://github.com/kshitijSharma2204/cpp_slam_stack/tree/00a7257c8af625ac6c4d591172b5216db253a3ba/tests)

## Evaluation

| Metric | Value | Unit | Protocol | Evidence |
|---|---|---|---|---|
| Mean relative translation error | 0.0319 | m per scan | KITTI sequence 00, 4,541 evaluated poses (4,544 scans processed, 0 load failures); relative pose error between consecutive scans vs. KITTI odometry ground truth converted to the Velodyne frame. Reported in the repository README; not re-run for this page. | [cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00) |
| RMSE relative translation error | 0.0406 | m per scan | Same run as above. | [cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00) |
| Mean relative rotation error | 0.11 | deg per scan | Same run as above (README table: 0.110326°; the per-step error plot's recomputation shows 0.1090°). | [cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00) |

## Limitations

- Pure LiDAR odometry: no loop closure or back-end optimization, so error accumulates with distance travelled.
- The map inherits the same drift; on loops this shows as ghosting where the return pass does not overlay the first.
- No absolute correction (GPS/RTK or map matching) bounds the drift.
- Evaluated on one sequence (KITTI 00). The largest error spike is at scan 2, where ICP starts from a zero-motion guess; smaller spikes line up with sharp turns.

## Next steps

- Loop closure with a pose-graph back end
- IMU fusion via an error-state Kalman filter
- Absolute correction (GPS/RTK or map-relative localization)
- Multi-sequence regression benchmark
- Export of the accumulated map

## Reproducibility

Build with the CMake presets (clang, C++20, Ninja), point src/config/dataset_config.json at a local KITTI raw-data copy, then run run_odometry with --gt and --calib to print the metrics. See the repository Quickstart.

---

_Generated from `src/data/case-studies.json` by `npm run case-studies:review`._
