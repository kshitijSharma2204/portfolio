# KITTI Semantic Segmentation: case study

- **Project:** project-3 · [/projects/kitti-semantic-segmentation/](https://kshitijsharma2204.github.io/portfolio/projects/kitti-semantic-segmentation/) · source: https://github.com/kshitijSharma2204/semantic-segmentation
- **Status:** `draft` (not on the site yet)
- **Code:** [semantic-segmentation/tree/6d4f23b35fc5429553e481372f9c38b816f4f2f2](https://github.com/kshitijSharma2204/semantic-segmentation/tree/6d4f23b35fc5429553e481372f9c38b816f4f2f2)
- **To publish:** check everything below against the code, sort out the notes, then set `"status": "approved"` for this entry in `src/data/case-studies.json`.
- **Preview:** `npm run preview:drafts`, then open the project page at http://127.0.0.1:4323/portfolio/

## Notes before publishing

- [ ] Re-score the saved checkpoints with the standard 19-class mIoU and record the number (with split and epoch) in the repo before publishing.

## Problem

Label every pixel of a KITTI street image with a class such as road, vehicle, building or vegetation.

## Approach

A UNet I wrote from scratch in PyTorch: a four-level encoder (64 to 512 channels, two 3×3 convolutions with batch norm per level) and a transposed-convolution decoder with skip connections. Images are resized to 256×512. The KITTI semantic training set is split 80/20 into training and validation, with augmentation on the training part only.

## Design decisions

### Augmentation for a small dataset

An Albumentations pipeline with horizontal flips, brightness and contrast changes, colour jitter, Gaussian blur and shift-scale-rotate, followed by ImageNet normalization.

Code: [semantic-segmentation/blob/6d4f23b35fc5429553e481372f9c38b816f4f2f2/kitti_dataset.py#L17-L25](https://github.com/kshitijSharma2204/semantic-segmentation/blob/6d4f23b35fc5429553e481372f9c38b816f4f2f2/kitti_dataset.py#L17-L25)

### Training and validation

Adam at 1e-3, batch size 12, cross-entropy that ignores unlabelled pixels (label 255), and mean IoU computed on the validation split.

Code: [semantic-segmentation/blob/6d4f23b35fc5429553e481372f9c38b816f4f2f2/train.py](https://github.com/kshitijSharma2204/semantic-segmentation/blob/6d4f23b35fc5429553e481372f9c38b816f4f2f2/train.py)

## Evaluation

_No measured results in the repo yet._

## Limitations

- Mean IoU is computed during training, but no result is recorded in the repository yet, so there's no accuracy number here.
- Validation uses part of the KITTI training images, not the official test server.

## How to reproduce

Put the KITTI semantics data under data/ as the README describes, then run python train.py and python inference.py.

---

_Generated from `src/data/case-studies.json` with `npm run case-studies:review`._
