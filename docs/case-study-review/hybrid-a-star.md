# Hybrid A*: case study

- **Project:** project-5 · [/projects/hybrid-a-star/](https://kshitijsharma2204.github.io/portfolio/projects/hybrid-a-star/) · source: https://github.com/kshitijSharma2204/hybrid_astar
- **Status:** `draft` (not on the site yet)
- **Code:** [hybrid_astar/tree/15d8cc18f59d3156b22edb8256697087486574f3](https://github.com/kshitijSharma2204/hybrid_astar/tree/15d8cc18f59d3156b22edb8256697087486574f3)
- **To publish:** check everything below against the code, sort out the notes, then set `"status": "approved"` for this entry in `src/data/case-studies.json`.
- **Preview:** `npm run preview:drafts`, then open the project page at http://127.0.0.1:4323/portfolio/

## Notes before publishing

- [ ] Rewrite against the new commit once Reeds-Shepp, smoothing and parameter loading are in. The site description already mentions smoothing and Reeds-Shepp.

## Problem

Plan smooth, collision-free paths for a car-like vehicle on an occupancy grid. Plain grid A* gives paths a car can't follow, because a car can't turn on the spot.

## Approach

A ROS 2 package with three nodes. A Python node publishes the map, start and goal. A C++ node runs Hybrid A* over continuous (x, y, heading) states, binned by heading, expanding forward and reverse motion primitives from a bicycle model. A second Python node animates the planned path.

### Data flow

1. **Environment**: env_publisher.py publishes /map, /start and /goal. (`scripts/env_publisher.py`)
2. **Heuristic**: Dijkstra flood fill over the grid from the goal, so the cost-to-go accounts for obstacles. (`src/planner.cpp (buildHeuristic)`)
3. **Search**: Expand motion primitives (2.5 m wheelbase, 0.45 rad max steer, 1 m steps) forwards and in reverse, checking for collisions at sub-steps along each primitive. (`src/planner.cpp`)
4. **Output**: Publish /planned_path; path_viz.py animates it. (`src/hybrid_astar_node.cpp, scripts/path_viz.py`)

## Design decisions

### Cost terms that favour drivable paths

Edge costs penalize reversing, switching direction, steering hard and changing the steering angle. That pushes the search towards smooth forward motion while still allowing reverse moves like parking.

Code: [kReverseCost, kDirectionChange, kSteerAngleCost, kSteerAngleChange](https://github.com/kshitijSharma2204/hybrid_astar/blob/15d8cc18f59d3156b22edb8256697087486574f3/include/hybrid_astar/planner.hpp#L50-L54)

### A heuristic that knows about obstacles

A Dijkstra flood fill from the goal gives a cost-to-go that goes around obstacles, instead of plain straight-line distance.

Code: [hybrid_astar/blob/15d8cc18f59d3156b22edb8256697087486574f3/src/planner.cpp#L225-L260](https://github.com/kshitijSharma2204/hybrid_astar/blob/15d8cc18f59d3156b22edb8256697087486574f3/src/planner.cpp#L225-L260)

## Evaluation

_No measured results in the repo yet._

## Limitations

- Shown on one synthetic map; there are no runtime or success-rate numbers yet.
- config/params.yaml is never loaded, so the planner runs with the constants in planner.hpp (kReverseCost = 10.0 rather than the YAML's reverse_penalty of 1.5).

## Next steps

- Reeds-Shepp analytic expansion to the goal pose (declared in the planner but not implemented yet)
- Path smoothing
- Load params.yaml at runtime
- Use the obstacle k-d tree for collision checks
- Benchmarks on more maps

## How to reproduce

Build with colcon on ROS 2 Humble with OMPL installed, then run: ros2 launch hybrid_astar astar_viz_launch.py

---

_Generated from `src/data/case-studies.json` with `npm run case-studies:review`._
