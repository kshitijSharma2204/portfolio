# LiDAR Odometry & SLAM Stack: case study

- **Project:** project-1 · [/projects/lidar-odometry-slam-stack/](https://kshitijsharma2204.github.io/portfolio/projects/lidar-odometry-slam-stack/) · source: https://github.com/kshitijSharma2204/cpp_slam_stack
- **Status:** `draft` (not on the site yet)
- **Code:** [Repository at the time of writing (branch slam_stack)](https://github.com/kshitijSharma2204/cpp_slam_stack/tree/00a7257c8af625ac6c4d591172b5216db253a3ba)
- **To publish:** check everything below against the code, sort out the notes, then set `"status": "approved"` for this entry in `src/data/case-studies.json`.
- **Preview:** `npm run preview:drafts`, then open the project page at http://127.0.0.1:4323/portfolio/

## Notes before publishing

- [ ] Title says SLAM but there's no loop closure yet. Publish this once loop closure is in and add ATE and drift numbers next to the RPE ones.
- [ ] The rotation error plot recomputes 0.1090° while the README table says 0.110326°. Use one source.

## Problem

Work out a car's trajectory from KITTI Velodyne scans alone, with the code structured like a live sensor system: scans replayed at the timing they were captured, bounded memory between stages, and the result checked against ground truth.

## Approach

A producer thread loads a KITTI raw drive and releases the scans into a fixed-size queue at their original spacing. A consumer thread filters each scan, removes motion distortion using the OXTS velocity, and registers it against a running voxel map with KISS-ICP-style scan-to-map ICP. Poses are written in KITTI format, scored with relative pose error, and can be replayed live in an Open3D viewer.

### Data flow

1. **KITTI replay**: DataLoader reads the Velodyne and OXTS frames; ReplayClock and ReplayScheduler release scans at their original capture times. (`src/kitti/, src/replay/`)
2. **Bounded queue**: Fixed-size, thread-safe queue. The producer blocks when the consumer falls behind. (`src/pipeline/BoundedQueue.hpp`)
3. **Preprocess**: Drop invalid returns, range filter, voxel downsample. (`src/preprocessor/`)
4. **Deskew**: Move every point to a single instant using the OXTS velocity and the point's capture offset. (`src/deskew/Deskew.cpp`)
5. **Scan-to-map ICP**: Constant-velocity initial guess, adaptive correspondence threshold, robust Gauss-Newton against a voxel hash map. (`src/odometry/`)
6. **Evaluate and view**: KITTI-format trajectory, relative pose error against ground truth, Open3D playback. (`src/evaluation/, apps/`)

## Design decisions

### Back-pressure instead of buffering

The stages are joined by a fixed-size queue. When odometry falls behind, the reader blocks instead of piling scans up in memory, so memory stays bounded on long drives.

Code: [Thread-safe bounded queue; push blocks while full](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/src/pipeline/BoundedQueue.hpp)

### Prediction and an adaptive correspondence threshold

ICP for each scan starts from a constant-velocity prediction, which just applies the last relative motion again. The correspondence distance is three times an adaptive threshold, and that threshold is three times the RMS of recent model deviations (with a floor), so matching gets tighter when the motion is well predicted.

Code: [Constant-velocity prediction; max correspondence distance = 3 × kappa](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/src/odometry/Odometry.cpp#L246-L253) · [Threshold = 3·sqrt(mean squared deviation)](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/src/odometry/AdaptiveThreshold.cpp)

### Robust Gauss-Newton on a thread pool

Nearest-neighbour search and building the normal equations are split across a fixed pool of workers that is reused every iteration. Each thread keeps its own partial sums, so nothing needs a lock. Residuals go through a robust kernel, and each step is solved with an LDLT decomposition (up to 500 iterations, 1e-4 convergence).

Code: [ThreadPool, parallel correspondences, solveGaussNewton, ICP loop](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/src/odometry/Odometry.cpp#L21-L217)

### Strict build and tests

C++20 with -Wall -Wextra -Wpedantic -Werror, unit and integration tests for every module (GoogleTest and CTest), AddressSanitizer, UndefinedBehaviorSanitizer and ThreadSanitizer presets, and a CI workflow.

Code: [Warnings as errors, C++20](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/CMakeLists.txt) · [14 unit and integration test files](https://github.com/kshitijSharma2204/cpp_slam_stack/tree/00a7257c8af625ac6c4d591172b5216db253a3ba/tests)

## Evaluation

| Metric | Value | Unit | How it was measured | Source |
|---|---|---|---|---|
| Mean relative translation error | 0.0319 | m per scan | KITTI sequence 00, 4,541 evaluated poses (4,544 scans processed, none failed to load). Relative pose error between consecutive scans against KITTI odometry ground truth, converted to the Velodyne frame. Numbers are from the repository README. | [cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00) |
| RMSE relative translation error | 0.0406 | m per scan | KITTI sequence 00, 4,541 evaluated poses (4,544 scans processed, none failed to load). Relative pose error between consecutive scans against KITTI odometry ground truth, converted to the Velodyne frame. Numbers are from the repository README. | [cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00) |
| Mean relative rotation error | 0.11 | deg per scan | KITTI sequence 00, 4,541 evaluated poses (4,544 scans processed, none failed to load). Relative pose error between consecutive scans against KITTI odometry ground truth, converted to the Velodyne frame. Numbers are from the repository README. | [cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00](https://github.com/kshitijSharma2204/cpp_slam_stack/blob/00a7257c8af625ac6c4d591172b5216db253a3ba/README.md#sequence-00) |

## Limitations

- This is odometry only. There's no loop closure or back-end optimization yet, so error grows with distance travelled.
- The map drifts along with the trajectory. On loops you can see ghosting where the second pass doesn't line up with the first.
- Nothing absolute (GPS/RTK or map matching) corrects the drift.
- Only tested on one sequence (KITTI 00). The biggest error spike is at scan 2, where ICP starts from a zero-motion guess; the smaller ones line up with sharp turns.

## Next steps

- Loop closure with a pose-graph back end
- IMU fusion with an error-state Kalman filter
- Absolute correction from GPS/RTK or a prior map
- Benchmarks on more KITTI sequences
- Exporting the accumulated map

## How to reproduce

Build with the CMake presets (clang, C++20, Ninja), point src/config/dataset_config.json at a local copy of the KITTI raw data, then run run_odometry with --gt and --calib to print the metrics. The repository Quickstart has the details.

---

_Generated from `src/data/case-studies.json` with `npm run case-studies:review`._
