# Case study review — Hybrid A*

- **Project:** project-5 · [/projects/hybrid-a-star/](https://kshitijsharma2204.github.io/portfolio/projects/hybrid-a-star/) · source: https://github.com/kshitijSharma2204/hybrid_astar
- **Status:** `draft` — not shown on the public site
- **Evidence snapshot:** [hybrid_astar/tree/15d8cc18f59d3156b22edb8256697087486574f3](https://github.com/kshitijSharma2204/hybrid_astar/tree/15d8cc18f59d3156b22edb8256697087486574f3)
- **To publish:** confirm every statement below is accurate and publishable, resolve the review notes, then change `"status": "draft"` to `"approved"` for this entry in `src/data/case-studies.json`.
- **Preview locally:** `npm run preview:drafts`, then open the project page at http://127.0.0.1:4323/portfolio/

## Review notes (owner decision needed)

- [ ] Confirm the reverse-cost parameter discrepancy before publishing the limitations wording.

## Problem

Plan smooth, collision-free paths for a car-like vehicle on an occupancy grid. Plain grid A* produces paths the vehicle cannot follow, because a car cannot turn in place.

## Approach

A ROS 2 package: a Python node publishes the map, start and goal; a C++ node runs Hybrid A* over continuous (x, y, heading) states, binned by heading, expanding forward and reverse motion primitives from a bicycle model; a Python node animates the planned path.

### Data flow

1. **Environment** — env_publisher.py publishes /map, /start and /goal. (`scripts/env_publisher.py`)
2. **Heuristic** — Grid Dijkstra flood fill from the goal, so the cost-to-go accounts for obstacles. (`src/planner.cpp (buildHeuristic)`)
3. **Search** — Expand motion primitives (wheelbase 2.5 m, max steer 0.45 rad, 1 m steps) forward and reverse, with sub-step collision checks against a k-d tree of obstacles. (`src/planner.cpp, config/params.yaml`)
4. **Analytic expansion** — Try an exact Reeds–Shepp connection to the goal pose using OMPL. (`src/planner.cpp (tryReedsSheppConnect)`)
5. **Output** — Publish /planned_path; path_viz.py animates it. (`src/hybrid_astar_node.cpp, scripts/path_viz.py`)

## Engineering decisions

### Cost terms that shape drivable paths

Edge costs penalize reversing, changes of direction, steering magnitude and steering changes, favouring smooth forward motion while still allowing reverse manoeuvres such as parking.

Evidence: [kReverseCost, kDirectionChange, kSteerAngleCost, kSteerAngleChange](https://github.com/kshitijSharma2204/hybrid_astar/blob/15d8cc18f59d3156b22edb8256697087486574f3/include/hybrid_astar/planner.hpp#L50-L54)

### Obstacle-aware heuristic

A Dijkstra flood fill from the goal over the grid gives a cost-to-go that respects obstacles, rather than straight-line distance.

Evidence: [hybrid_astar/blob/15d8cc18f59d3156b22edb8256697087486574f3/src/planner.cpp#L225-L260](https://github.com/kshitijSharma2204/hybrid_astar/blob/15d8cc18f59d3156b22edb8256697087486574f3/src/planner.cpp#L225-L260)

## Evaluation

_No recorded, verifiable metrics in the repository — none will be published._

## Limitations

- Demonstrated on a published synthetic map; no runtime or success-rate benchmarks are recorded.
- config/params.yaml sets reverse_penalty to 1.5, while the planner header defines kReverseCost = 10.0; which value applies should be confirmed.

## Reproducibility

Build with colcon on ROS 2 Humble with OMPL installed, then run: ros2 launch hybrid_astar astar_viz_launch.py

---

_Generated from `src/data/case-studies.json` by `npm run case-studies:review`._
