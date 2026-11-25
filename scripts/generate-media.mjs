// Generates optimized derivatives of ORIGINAL project media. Originals in public/assets are never modified.
//
//   posters  : public/media/posters/<id>-{640,1280}.webp   (still frame of the card/hero image)
//   og       : public/media/og/<id>.jpg                   (1200x630 share image, letterboxed, never cropped)
//   video    : public/media/video/<id>.{mp4,webm}          (only when the original is an animated GIF)
//   gallery  : public/media/gallery/<name>-1200.webp       (for every image in a project's `images` array)
//
// Writes src/data/media.json with dimensions + byte sizes so pages can set width/height and label downloads.
// Requires ffmpeg/ffprobe on PATH. Run with: npm run media   (add --force to regenerate existing files)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pub = join(root, 'public');
const force = process.argv.includes('--force');
// --only=project-7,project-10 forces regeneration for just those projects
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
const { projects } = JSON.parse(readFileSync(join(root, 'src/data/projects.json'), 'utf8'));
const presentation = JSON.parse(readFileSync(join(root, 'src/data/presentation.json'), 'utf8'));

for (const d of ['posters', 'og', 'video', 'gallery']) mkdirSync(join(pub, 'media', d), { recursive: true });

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });
const probe = (file) => {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file,
  ]).toString();
  const j = JSON.parse(out);
  return { width: j.streams[0].width, height: j.streams[0].height, duration: Number(j.format?.duration) || 0 };
};
const size = (rel) => statSync(join(pub, rel)).size;
let current = '';
const make = (rel, fn) => {
  if (force || only.includes(current) || !existsSync(join(pub, rel))) {
    fn(join(pub, rel));
    console.log('  wrote', rel);
  }
  return rel;
};
// Scale to fit inside a box, never upscale, keep even dimensions (required by yuv420p encoders).
const fit = (w, h) => `scale='min(${w},iw)':'min(${h},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;

const manifest = { projects: {}, gallery: {} };

for (const p of projects) {
  current = p.id;
  const pres = presentation.projects[p.id];
  const src = join(pub, p.image);
  const info = probe(src);
  const isGif = extname(p.image).toLowerCase() === '.gif';
  const t = isGif ? (pres.posterTime ?? info.duration * 0.5) : 0;
  const seek = isGif ? ['-ss', String(t)] : [];
  console.log(p.id, basename(p.image), `${info.width}x${info.height}`, isGif ? `${info.duration}s` : '');

  const posters = {};
  for (const w of [640, 1280]) {
    posters[w] = make(`media/posters/${p.id}-${w}.webp`, (out) =>
      ff([...seek, '-i', src, '-frames:v', '1', '-vf', `scale='min(${w},iw)':-2`, '-c:v', 'libwebp', '-quality', '80', out]));
  }
  const pInfo = probe(join(pub, posters[1280]));

  const og = make(`media/og/${p.id}.jpg`, (out) =>
    ff([...seek, '-i', src, '-frames:v', '1', '-vf',
      `scale=1200:630:force_original_aspect_ratio=decrease,pad=1200:630:(ow-iw)/2:(oh-ih)/2:color=0x0B1120`,
      '-q:v', '3', out]));

  let video = null;
  if (isGif) {
    const mp4 = make(`media/video/${p.id}.mp4`, (out) =>
      ff(['-i', src, '-vf', fit(960, 960), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '28',
        '-preset', 'slow', '-movflags', '+faststart', '-an', out]));
    const webm = make(`media/video/${p.id}.webm`, (out) =>
      ff(['-i', src, '-vf', fit(960, 960), '-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0',
        '-row-mt', '1', '-an', out]));
    const vInfo = probe(join(pub, mp4));
    video = { mp4: `/${mp4}`, webm: `/${webm}`, width: vInfo.width, height: vInfo.height,
      duration: Math.round(info.duration * 10) / 10, mp4Bytes: size(mp4), webmBytes: size(webm) };
  }

  manifest.projects[p.id] = {
    original: { path: p.image, width: info.width, height: info.height, bytes: statSync(src).size, animated: isGif },
    poster: { 640: `/${posters[640]}`, 1280: `/${posters[1280]}`, width: pInfo.width, height: pInfo.height,
      bytes640: size(posters[640]), bytes1280: size(posters[1280]) },
    og: `/${og}`,
    video,
  };

  for (const img of p.images) {
    if (manifest.gallery[img]) continue;
    const gsrc = join(pub, img);
    const name = basename(img, extname(img));
    const out = make(`media/gallery/${name}-1200.webp`, (o) =>
      ff(['-i', gsrc, '-frames:v', '1', '-vf', `scale='min(1200,iw)':-2`, '-c:v', 'libwebp', '-quality', '82', o]));
    const gi = probe(join(pub, out));
    manifest.gallery[img] = { src: `/${out}`, width: gi.width, height: gi.height, bytes: size(out),
      originalBytes: statSync(gsrc).size };
  }
}

// Skill icons listed in public/assets/skills/skills-manifest.json → 128px-tall WebP derivatives.
mkdirSync(join(pub, 'media', 'skills'), { recursive: true });
manifest.skills = {};
const skillFiles = JSON.parse(readFileSync(join(pub, 'assets/skills/skills-manifest.json'), 'utf8'));
current = 'skills';
for (const file of skillFiles) {
  const name = file.replace(/\.(png|jpe?g|svg)$/i, '').toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '-');
  const out = make(`media/skills/${name}.webp`, (o) => {
    const input = join(pub, 'assets/skills', file);
    try {
      ff(['-i', input, '-frames:v', '1', '-vf', `scale=-2:'min(128,ih)'`, '-c:v', 'libwebp', '-quality', '85', o]);
    } catch {
      // Some originals (e.g. "ROS 2.png") have chunks ffmpeg rejects; Pillow decodes them fine.
      execFileSync('python3', ['-I', '-c',
        'import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGBA");h=min(128,im.height);' +
        'im.resize((round(im.width*h/im.height),h),Image.LANCZOS).save(sys.argv[2],"WEBP",quality=85)', input, o]);
    }
  });
  const si = probe(join(pub, out));
  manifest.skills[file] = { src: `/${out}`, width: si.width, height: si.height };
}

writeFileSync(join(root, 'src/data/media.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Wrote src/data/media.json');
