# Case study review — KITTI Semantic Segmentation

- **Project:** project-3 · [/projects/kitti-semantic-segmentation/](https://kshitijsharma2204.github.io/portfolio/projects/kitti-semantic-segmentation/) · source: https://github.com/kshitijSharma2204/semantic-segmentation
- **Status:** `draft` — not shown on the public site
- **Evidence snapshot:** [semantic-segmentation/tree/6d4f23b35fc5429553e481372f9c38b816f4f2f2](https://github.com/kshitijSharma2204/semantic-segmentation/tree/6d4f23b35fc5429553e481372f9c38b816f4f2f2)
- **To publish:** confirm every statement below is accurate and publishable, resolve the review notes, then change `"status": "draft"` to `"approved"` for this entry in `src/data/case-studies.json`.
- **Preview locally:** `npm run preview:drafts`, then open the project page at http://127.0.0.1:4323/portfolio/

## Review notes (owner decision needed)

- [ ] The current site description says the model "achieves robust performance"; no metric in the repository supports this. If a logged validation mIoU exists, it could be added with its split and epoch.

## Problem

Label every pixel of KITTI street-scene images with a semantic class (road, vehicle, building, vegetation and so on) for driving-scene understanding.

## Approach

A UNet written from scratch in PyTorch: a four-level encoder (64→512 channels, double 3×3 convolutions with batch norm) and a transposed-convolution decoder with skip connections. Images are resized to 256×512; the KITTI semantic training set is split 80/20 into training and validation, with augmentation applied to the training split only.

## Engineering decisions

### Augmentation for a small dataset

Albumentations pipeline: horizontal flip, brightness/contrast, colour jitter, Gaussian blur and shift-scale-rotate, followed by ImageNet normalization.

Evidence: [semantic-segmentation/blob/6d4f23b35fc5429553e481372f9c38b816f4f2f2/kitti_dataset.py#L17-L25](https://github.com/kshitijSharma2204/semantic-segmentation/blob/6d4f23b35fc5429553e481372f9c38b816f4f2f2/kitti_dataset.py#L17-L25)

### Training and validation

Adam (learning rate 1e-3), batch size 12, cross-entropy ignoring unlabeled pixels (label 255), with mean IoU computed on the validation split.

Evidence: [semantic-segmentation/blob/6d4f23b35fc5429553e481372f9c38b816f4f2f2/train.py](https://github.com/kshitijSharma2204/semantic-segmentation/blob/6d4f23b35fc5429553e481372f9c38b816f4f2f2/train.py)

## Evaluation

_No recorded, verifiable metrics in the repository — none will be published._

## Limitations

- Mean IoU is computed during training, but no recorded value is in the repository, so no accuracy figure is reported here.
- Validation uses a split of the KITTI training images rather than the official test server.

## Reproducibility

Place the KITTI semantics data under data/ as described in the README, then run python train.py and python inference.py.

---

_Generated from `src/data/case-studies.json` by `npm run case-studies:review`._
