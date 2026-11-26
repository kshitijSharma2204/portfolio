# 3D Scene Reconstruction: case study

- **Project:** project-2 · [/projects/3d-scene-reconstruction/](https://kshitijsharma2204.github.io/portfolio/projects/3d-scene-reconstruction/) · source: https://github.com/kshitijSharma2204/NERF-Project
- **Status:** `approved` (on the site)
- **Code:** [NERF-Project/tree/550811fc3eb69d689c1605c00ff161d474c4ecc0](https://github.com/kshitijSharma2204/NERF-Project/tree/550811fc3eb69d689c1605c00ff161d474c4ecc0)
- **To publish:** check everything below against the code, sort out the notes, then set `"status": "approved"` for this entry in `src/data/case-studies.json`.
- **Preview:** `npm run preview:drafts`, then open the project page at http://127.0.0.1:4323/portfolio/

## Notes before publishing

- [ ] The project description also covers the SfM pipeline, which lives in a separate repo (SfM-CV) that isn't linked yet. Link it here once its PnP/BA fixes are done.

## Problem

Given photos of an object taken from known camera positions, render it from viewpoints that were never photographed.

## Approach

This is my PyTorch implementation of NeRF (Mildenhall et al., 2020), trained on the Blender LEGO scene at 400×400. Each 3D point and viewing direction is positionally encoded and passed to two MLPs, a coarse one and a fine one (8 layers, 256 units, skip connection at layer 4). A pixel's colour comes from volume rendering along its camera ray: 64 stratified samples for the coarse network, then 128 more placed where the coarse network found density. I first trained it on a cloud A100 and later lost that model. The version here has the fixes described below and was retrained from scratch for 200,000 steps on my laptop's 6 GB RTX 3060, entirely in fp32.

### Data flow

1. **Load data**: Training images are loaded as RGBA and composited onto white, the same background the renderer assumes. They stay on the GPU. (`scripts/data_loader.py`)
2. **Sample rays**: 1,024 random pixels per step. For the first 500 steps they only come from the central 50% of each image. (`scripts/train.py`)
3. **Coarse pass**: 64 stratified samples per ray. Samples in cells the occupancy grid marks as empty skip the MLP. (`scripts/render_rays.py, scripts/occupancy.py`)
4. **Fine pass**: 128 extra samples drawn from the coarse weights, merged with the coarse ones and run through the fine MLP. (`scripts/render_rays.py`)
5. **Optimize**: MSE on both the coarse and fine colours. Adam at 5e-4, decaying by 10× over 500,000 steps. (`scripts/train.py`)
6. **Evaluate**: Deterministic renders of all 200 test views, scored with PSNR and SSIM. (`scripts/evaluate.py, scripts/metrics.py`)

## Design decisions

### Hierarchical sampling

The coarse network's weights along each ray act as a probability distribution, and the 128 fine samples are drawn from it, so the fine network spends its effort near surfaces. The fine sample positions are detached, as in the paper. My first version didn't do this, which let gradients from the fine network leak into the coarse one.

Code: [sample_pdf](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/scripts/render_rays.py#L27-L50) · [Fine samples drawn from detached weights](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/scripts/render_rays.py#L118-L120)

### Skipping empty space with an occupancy grid

I wrote a 128³ occupancy grid over the cube [-1.5, 1.5]³. Every 16 steps it queries the coarse network's density and keeps a decaying maximum of each cell's opacity. Samples that land in empty cells skip both MLPs. In a 5,000-step test with everything else the same, the grid cut the time per step from 223 ms to 93 ms and ended at the same validation PSNR (23.19 dB with and without it), skipping about two thirds of all samples.

Code: [OccupancyGrid](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/scripts/occupancy.py#L15-L90) · [Grid on/off comparison](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/README.md#occupancy-grid-ablation)

### Keeping early training from collapsing

Short fp32 runs sometimes collapsed into a plain white image: the fine MLP's raw density went negative everywhere, so its ReLU passed no gradient and it never recovered. Two tricks from the paper and nerf-pytorch fixed it. One is a 500-step warm-up that samples only the middle of each image. The other is Gaussian noise (std 1.0) added to the raw density during training. With only the warm-up, one of three seeds still collapsed. With both, all three trained normally.

Code: [Centre-crop sampling](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/scripts/train.py#L43-L58) · [precrop_iters, raw_noise_std](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/configs/synthetic_lego.yaml)

### A fair background and repeatable scores

The first version's loader threw away the alpha channel, so it trained on black backgrounds while the renderer composited onto white. Now the ground truth is composited onto white as well. For evaluation, rendering has no jitter and the fine samples are placed deterministically, so scoring the same checkpoint twice gives exactly the same numbers.

Code: [RGBA load and white compositing](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/scripts/data_loader.py#L8-L27) · [Deterministic evaluation](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/scripts/evaluate.py)

### Training that survives interruptions

A 7.5-hour run on a laptop needs to survive interruptions. Each checkpoint stores both models, the Adam state, the learning-rate schedule, the step, every RNG state, the config, the git commit and the occupancy grid. Checkpoints are written atomically, the newest three are kept, and --resume continues exactly where training stopped.

Code: [NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/scripts/checkpoint.py](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/scripts/checkpoint.py)

## Evaluation

| Metric | Value | Unit | How it was measured | Source |
|---|---|---|---|---|
| Mean PSNR | 31.2 | dB | All 200 test views of the Blender LEGO scene at 400×400. Each view is rendered deterministically, saved as an 8-bit PNG and scored against the ground truth composited onto white. PSNR is −10·log10(MSE) on RGB values in [0, 1]. SSIM uses an 11×11 Gaussian window with σ = 1.5, averaged over the RGB channels. The standard deviation across views is 1.35 dB for PSNR and 0.0051 for SSIM. I never used the test views for any decision during development; only three validation views were used for that. | [NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/docs/RESULTS.md](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/docs/RESULTS.md) · [NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/outputs/v2/eval/metrics.json](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/outputs/v2/eval/metrics.json) |
| Mean SSIM | 0.9615 | unitless (0 to 1) | All 200 test views of the Blender LEGO scene at 400×400. Each view is rendered deterministically, saved as an 8-bit PNG and scored against the ground truth composited onto white. PSNR is −10·log10(MSE) on RGB values in [0, 1]. SSIM uses an 11×11 Gaussian window with σ = 1.5, averaged over the RGB channels. The standard deviation across views is 1.35 dB for PSNR and 0.0051 for SSIM. I never used the test views for any decision during development; only three validation views were used for that. | [NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/docs/RESULTS.md](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/docs/RESULTS.md) · [NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/outputs/v2/eval/metrics.json](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/outputs/v2/eval/metrics.json) |
| Worst single view (PSNR) | 27.73 | dB | All 200 test views of the Blender LEGO scene at 400×400. Each view is rendered deterministically, saved as an 8-bit PNG and scored against the ground truth composited onto white. PSNR is −10·log10(MSE) on RGB values in [0, 1]. SSIM uses an 11×11 Gaussian window with σ = 1.5, averaged over the RGB channels. The standard deviation across views is 1.35 dB for PSNR and 0.0051 for SSIM. I never used the test views for any decision during development; only three validation views were used for that. | [NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/outputs/v2/eval/metrics.json](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/outputs/v2/eval/metrics.json) |
| Best single view (PSNR) | 33.4 | dB | All 200 test views of the Blender LEGO scene at 400×400. Each view is rendered deterministically, saved as an 8-bit PNG and scored against the ground truth composited onto white. PSNR is −10·log10(MSE) on RGB values in [0, 1]. SSIM uses an 11×11 Gaussian window with σ = 1.5, averaged over the RGB channels. The standard deviation across views is 1.35 dB for PSNR and 0.0051 for SSIM. I never used the test views for any decision during development; only three validation views were used for that. | [NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/outputs/v2/eval/metrics.json](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/outputs/v2/eval/metrics.json) |
| Training time for 200,000 steps | 7.48 | hours | One uninterrupted run of ./run_lego.sh training.max_steps=200000 at commit 5df01d3, on an RTX 3060 Laptop GPU (6 GB) in fp32 with TF32 off. The time includes 40 validation passes and the checkpoint saves. | [NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/docs/RESULTS.md](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/docs/RESULTS.md) |
| Peak GPU memory while training | 2.97 | GiB | One uninterrupted run of ./run_lego.sh training.max_steps=200000 at commit 5df01d3, on an RTX 3060 Laptop GPU (6 GB) in fp32 with TF32 off. The time includes 40 validation passes and the checkpoint saves. | [NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/docs/RESULTS.md](https://github.com/kshitijSharma2204/NERF-Project/blob/550811fc3eb69d689c1605c00ff161d474c4ecc0/docs/RESULTS.md) |

## Limitations

- One synthetic, object-centred scene with known camera poses. I haven't tried real photos yet.
- Trained and scored at 400×400, half the resolution used in the NeRF paper, so these numbers can't be compared directly with published results.
- Validation PSNR was still slowly rising at 200,000 steps (31.46 dB at the last check), so the model hasn't fully converged.
- Rendering is slow: about 6 seconds per 400×400 image on the laptop GPU.
- The first model's 29.90 dB isn't comparable with these numbers. That model is lost, so it could only be scored on four saved views against a black background.

## Next steps

- Train for longer, since validation PSNR hadn't levelled off
- Compare against Instant-NGP and 3D Gaussian Splatting on the same split, metrics and GPU

## How to reproduce

Put the Blender LEGO data in data/synthetic/lego/ and run ./run_lego.sh training.max_steps=200000. It trains, scores all 200 test views into outputs/v2/eval/metrics.json and renders the fly-around video. On a 6 GB laptop GPU it takes about 7.5 hours. docs/RESULTS.md in the repository has the unrounded numbers and the full scoring method.

---

_Generated from `src/data/case-studies.json` with `npm run case-studies:review`._
