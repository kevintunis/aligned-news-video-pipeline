/**
 * render.mjs
 * Renders aligned-news-motion-graphics to MP4 using Puppeteer + FFmpeg.
 *
 * Strategy: intercept requestAnimationFrame before React loads so we control
 * the clock. Then tick frame-by-frame, screenshot each frame, pipe to FFmpeg.
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FPS = 30;           // 30fps is standard for broadcast; 60fps doubles render time
const DURATION = 18.5;    // seconds (matches Stage duration prop)
const WIDTH = 1920;
const HEIGHT = 1080;
const OUTPUT = path.join(__dirname, 'aligned-news-broadcast.mp4');
const HTML_PATH = path.join(__dirname, 'motion-graphics-extracted', 'Aligned News Broadcast.html');

const TOTAL_FRAMES = Math.ceil(DURATION * FPS);

async function render() {
  console.log(`Rendering ${TOTAL_FRAMES} frames at ${FPS}fps (${DURATION}s) → ${path.basename(OUTPUT)}`);

  // ── Launch FFmpeg, reading PNG frames from stdin ──────────────────────────
  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-framerate', String(FPS),
    '-i', 'pipe:0',
    '-vf', `scale=${WIDTH}:${HEIGHT}`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    OUTPUT,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  ffmpeg.on('error', (err) => { console.error('FFmpeg error:', err); process.exit(1); });

  // ── Launch Puppeteer ──────────────────────────────────────────────────────
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--window-size=${WIDTH},${HEIGHT}`,
      '--disable-web-security',          // allow local file cross-origin
      '--allow-file-access-from-files',
      '--font-render-hinting=none',
      '--disable-gpu-vsync',
      '--run-all-compositor-stages-before-draw',
    ],
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  // Intercept RAF *before* any page scripts execute
  await page.evaluateOnNewDocument(() => {
    window.__rafQueue = new Map();
    window.__rafId = 0;
    window.__renderTime = 0; // milliseconds

    // Freeze real performance.now() and Date.now() to our fake clock
    const _perf = performance.now.bind(performance);
    performance.now = () => window.__renderTime;
    Date.now = () => window.__renderTime;

    window.requestAnimationFrame = (cb) => {
      const id = ++window.__rafId;
      window.__rafQueue.set(id, cb);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      window.__rafQueue.delete(id);
    };

    // Call this to advance one frame
    window.__tickFrame = (timeMs) => {
      window.__renderTime = timeMs;
      const cbs = [...window.__rafQueue.values()];
      window.__rafQueue.clear();
      for (const cb of cbs) {
        try { cb(timeMs); } catch(e) { console.error('RAF cb error:', e); }
      }
    };
  });

  // Load the HTML (file:// URL for local asset access)
  const fileUrl = 'file:///' + HTML_PATH.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for React to mount
  await page.waitForFunction(() => document.getElementById('root')?.childElementCount > 0, { timeout: 10000 });

  // Give fonts a moment to load
  await new Promise(r => setTimeout(r, 500));

  // ── Frame loop ────────────────────────────────────────────────────────────
  const msPerFrame = 1000 / FPS;

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const timeMs = frame * msPerFrame;

    // Tick the RAF clock — may need multiple ticks if React schedules follow-up RAFs
    await page.evaluate((t) => {
      window.__tickFrame(t);
    }, timeMs);

    // Let React flush (microtask + one event loop tick)
    await page.evaluate(() => new Promise(r => setTimeout(r, 0)));

    // Second tick to catch any RAF-chained re-renders
    await page.evaluate((t) => {
      window.__tickFrame(t);
    }, timeMs);

    await page.evaluate(() => new Promise(r => setTimeout(r, 0)));

    // Screenshot the canvas element (the 1920×1080 stage div, not the wrapper)
    const canvas = await page.$('[style*="box-shadow"]');
    let pngBuffer;
    if (canvas) {
      const box = await canvas.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        pngBuffer = await page.screenshot({
          clip: { x: box.x, y: box.y, width: box.width, height: box.height },
          type: 'png',
        });
      }
    }

    if (!pngBuffer) {
      pngBuffer = await page.screenshot({ type: 'png' });
    }

    // Write PNG frame to FFmpeg stdin
    ffmpeg.stdin.write(pngBuffer);

    if (frame % FPS === 0) {
      const sec = Math.round(timeMs / 1000);
      process.stdout.write(`  Frame ${frame}/${TOTAL_FRAMES} (${sec}s)\n`);
    }
  }

  // ── Finish ────────────────────────────────────────────────────────────────
  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  await browser.close();
  console.log(`\nDone! → ${OUTPUT}`);
}

render().catch((err) => {
  console.error(err);
  process.exit(1);
});
