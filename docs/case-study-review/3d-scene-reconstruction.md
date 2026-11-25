# Case study review — 3D Scene Reconstruction

- **Project:** project-2 · [/projects/3d-scene-reconstruction/](https://kshitijsharma2204.github.io/portfolio/projects/3d-scene-reconstruction/) · source: https://github.com/kshitijSharma2204/NERF-Project
- **Status:** `draft` — not shown on the public site
- **Evidence snapshot:** [NERF-Project/tree/132b96e638fdeddc420d37adb6ce1d89e6fcecad](https://github.com/kshitijSharma2204/NERF-Project/tree/132b96e638fdeddc420d37adb6ce1d89e6fcecad)
- **To publish:** confirm every statement below is accurate and publishable, resolve the review notes, then change `"status": "draft"` to `"approved"` for this entry in `src/data/case-studies.json`.
- **Preview locally:** `npm run preview:drafts`, then open the project page at http://127.0.0.1:4323/portfolio/

## Review notes (owner decision needed)

- [ ] The site description also describes a Structure-from-Motion pipeline (SIFT, RANSAC, PnP, bundle adjustment). The linked repository contains only the NeRF implementation. Provide the SfM repository/report before any SfM content is added, or confirm it should stay as-is.
- [ ] Gallery images reconstruction_01–04 on the site could not be matched to files in the repository, so their captions remain generic.

## Problem

Synthesize new, photorealistic views of a scene from a set of posed 2D images.

## Approach

A PyTorch implementation of NeRF (Mildenhall et al., 2020) trained on the synthetic LEGO scene at 400×400. Positionally encoded 3D positions and viewing directions feed a coarse and a fine MLP (8 layers, 256 units, skip connection at layer 4). Pixels are rendered by volume rendering along camera rays, with 64 stratified coarse samples plus 128 importance samples drawn from the coarse weights.

## Engineering decisions

### Hierarchical sampling

The coarse network's density weights define a distribution along each ray; 128 extra samples are drawn from it so the fine network spends capacity near surfaces.

Evidence: [sample_pdf, render_rays](https://github.com/kshitijSharma2204/NERF-Project/blob/132b96e638fdeddc420d37adb6ce1d89e6fcecad/scripts/render_rays.py) · [coarse 64 / fine 128 depth samples](https://github.com/kshitijSharma2204/NERF-Project/blob/132b96e638fdeddc420d37adb6ce1d89e6fcecad/configs/synthetic_lego.yaml)

### Training setup

Adam (learning rate 5e-4), 1,024 random rays per step, photometric MSE on both coarse and fine outputs, configured for up to 300,000 steps with resumable checkpoints and TensorBoard logging.

Evidence: [NERF-Project/blob/132b96e638fdeddc420d37adb6ce1d89e6fcecad/scripts/train.py](https://github.com/kshitijSharma2204/NERF-Project/blob/132b96e638fdeddc420d37adb6ce1d89e6fcecad/scripts/train.py)

## Evaluation

_No recorded, verifiable metrics in the repository — none will be published._

## Limitations

- Synthetic, object-centric scene with known camera poses.
- No quantitative image-quality metrics (PSNR/SSIM) are recorded in the repository, so none are reported here.

## Reproducibility

run_lego.sh trains (resuming from the last checkpoint), renders the test split and encodes a video; requires a CUDA-capable GPU.

---

_Generated from `src/data/case-studies.json` by `npm run case-studies:review`._
