// Records the README demo: media/demo.mp4, media/demo.gif, media/poster.png.
//
//   npm run record:demo     (from the repo root; builds the Pages version first)
//
// Needs Google Chrome installed (Playwright drives it via channel "chrome").
// Frames are captured with the CDP screencast at 2x and assembled by ffmpeg,
// which gives much sharper text than Playwright's built-in video recorder.
import { chromium } from 'playwright-core'
import ffmpegPath from 'ffmpeg-static'
import { preview } from 'vite'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const MEDIA = path.join(ROOT, 'media')
const PORT = 4179
const VIEWPORT = { width: 1280, height: 800 }
const SCALE = 2

const GIF_MAX_SECONDS = 8
const GIF_MAX_BYTES = 5 * 1024 * 1024

// Deterministic "human" timing, so re-recordings look alike.
let seed = 7
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
const between = (min, max) => min + rand() * (max - min)

async function main() {
  if (!fs.existsSync(path.join(ROOT, 'dist/index.html'))) {
    throw new Error('dist/ is missing — run `npm run build:pages` first (npm run record:demo does it).')
  }
  fs.mkdirSync(MEDIA, { recursive: true })
  const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tick-demo-'))

  const server = await preview({
    root: ROOT,
    base: '/tick/',
    logLevel: 'silent',
    preview: { port: PORT, strictPort: true },
  })

  // The screencast captures the real window, not the emulated viewport: size
  // the headless window to match and force 2x, or frames come out 1280×713 @1x.
  const browser = await chromium.launch({
    channel: 'chrome',
    args: [`--window-size=${VIEWPORT.width},${VIEWPORT.height}`, `--force-device-scale-factor=${SCALE}`],
  })
  try {
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE, colorScheme: 'dark' })
    await ctx.addInitScript({ path: path.join(HERE, 'cursor.js') })
    const page = await ctx.newPage()

    // ── Screencast capture ──────────────────────────────
    const frames = []  // { file, t }
    const cdp = await ctx.newCDPSession(page)
    cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
      const file = path.join(framesDir, `f${String(frames.length).padStart(5, '0')}.jpg`)
      fs.writeFileSync(file, Buffer.from(data, 'base64'))
      frames.push({ file, t: metadata.timestamp ?? Date.now() / 1000 })
      await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    })

    const marks = {}
    const mark = name => { marks[name] = Date.now() / 1000 }
    const pause = (min = 600, max = 1200) => page.waitForTimeout(between(min, max))

    // ── Cursor helpers ──────────────────────────────────
    let cursor = { x: 640, y: 420 }
    async function moveTo(x, y) {
      const ms = Math.round(Math.min(750, Math.max(280, Math.hypot(x - cursor.x, y - cursor.y) * 0.9)))
      await page.evaluate(([x, y, ms]) => window.__demoCursor?.move(x, y, ms), [x, y, ms])
      await page.mouse.move(x, y, { steps: 10 })  // real hover states
      await page.waitForTimeout(ms + 60)
      cursor = { x, y }
    }
    async function click(locator) {
      await locator.scrollIntoViewIfNeeded()
      const box = await locator.boundingBox()
      await moveTo(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2))
      await page.evaluate(() => window.__demoCursor?.click())
      await page.mouse.down()
      await page.waitForTimeout(70)
      await page.mouse.up()
    }
    async function scrollTo(y) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'smooth' }), y)
      await page.waitForTimeout(750)
    }
    const button = (name, exact = true) => page.getByRole('button', { name, exact })

    // ── Scenario ────────────────────────────────────────
    await page.goto(`http://localhost:${PORT}/tick/`)
    await page.getByText('Track your time, simply').waitFor()
    await cdp.send('Page.startScreencast', {
      format: 'jpeg', quality: 90,
      maxWidth: VIEWPORT.width * SCALE, maxHeight: VIEWPORT.height * SCALE,
    })
    await pause(900, 1100)

    // 1. Welcome → demo data
    await click(button('Load demo data'))
    await page.getByText('You are looking at demo data.').waitFor()
    await pause()
    await click(button('Dismiss'))
    await pause()

    // 2. Timer
    const desc = page.getByPlaceholder('What are you working on?')
    await click(desc)
    await desc.pressSequentially('Write release notes', { delay: 70 })
    await pause()
    const projectSelect = page.locator('select').first()
    await click(projectSelect)
    await projectSelect.selectOption({ label: 'Mobile app' })
    await pause()
    await click(button('▶ Start'))
    await page.waitForTimeout(2800)
    await click(button('■ Stop'))
    await pause(700, 900)
    const firstEntry = page.getByText('Write release notes').first()
    await scrollTo(await firstEntry.evaluate(el => el.getBoundingClientRect().top + scrollY - 420))
    await pause(1000, 1300)
    await scrollTo(0)

    // 3. Reports → Month → By day → Calendar
    await click(button('Reports'))
    await pause()
    await click(button('Month'))
    await pause()
    await click(button('↗ By day'))
    await pause(1200, 1500)
    await click(button('⊞ Calendar'))
    await pause()

    // 4. Previous month → busiest day → details
    const monthNav = button('‹')
    await scrollTo(await monthNav.evaluate(el => el.getBoundingClientRect().top + scrollY - 16))
    await click(monthNav)
    await pause(700, 900)
    mark('gifStart')
    await page.screenshot({ path: path.join(framesDir, 'poster@2x.png') })

    const day = await busiestDay(page)
    await click(page.getByRole('button', { name: new RegExp(`^\\S+ ${day}: `) }))
    await page.getByRole('dialog').waitFor()
    await pause(1300, 1500)
    const dialogBox = await page.getByRole('dialog').boundingBox()
    await moveTo(Math.round(dialogBox.x + dialogBox.width / 2), Math.round(dialogBox.y + dialogBox.height * 0.6))
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 70); await page.waitForTimeout(90) }
    await pause(800, 1000)
    await click(button('Close'))
    await page.waitForTimeout(500)
    mark('gifEnd')
    await pause()

    // 5. Theme: light and back
    await scrollTo(0)
    await click(page.getByTitle('Light theme', { exact: true }))
    await pause(1300, 1500)
    await click(page.getByTitle('Dark theme', { exact: true }))
    await pause(1100, 1300)

    await cdp.send('Page.stopScreencast')
    await ctx.close()

    encode(frames, marks, framesDir)
  } finally {
    await browser.close()
    await new Promise(r => server.httpServer.close(r))
    fs.rmSync(framesDir, { recursive: true, force: true })
  }
}

/** Day of the visible month with the most entries across 2+ projects. */
async function busiestDay(page) {
  const title = await page.locator('span.font-semibold.text-base').innerText()  // "October 2026"
  return page.evaluate(title => {
    const data = JSON.parse(localStorage.getItem('chronos-v1'))
    const [monthName, year] = title.split(' ')
    const month = new Date(`${monthName} 1, ${year}`).getMonth()
    const days = new Map()
    for (const e of data.entries) {
      const d = new Date(e.start)
      if (d.getMonth() !== month || d.getFullYear() !== +year) continue
      const k = d.getDate()
      if (!days.has(k)) days.set(k, { n: 0, projects: new Set() })
      days.get(k).n++
      days.get(k).projects.add(e.projectId)
    }
    return [...days.entries()]
      .filter(([, v]) => v.projects.size >= 2)
      .sort((a, b) => b[1].n - a[1].n || b[1].projects.size - a[1].projects.size)[0][0]
  }, title)
}

function ffmpeg(args) {
  execFileSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
}

function encode(frames, marks, dir) {
  // Screencast frames arrive only when the page changes; turn them into a
  // concat list with real durations, then resample to constant 30 fps.
  const t0 = frames[0].t
  const lines = ['ffconcat version 1.0']
  frames.forEach((f, i) => {
    const next = frames[i + 1]?.t ?? f.t + 1
    lines.push(`file '${f.file}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`)
  })
  lines.push(`file '${frames.at(-1).file}'`)
  const list = path.join(dir, 'frames.txt')
  fs.writeFileSync(list, lines.join('\n'))

  const mp4 = path.join(MEDIA, 'demo.mp4')
  ffmpeg([
    '-f', 'concat', '-safe', '0', '-i', list,
    '-vf', 'fps=30,scale=1280:-2:flags=lanczos,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
    '-movflags', '+faststart', '-an', mp4,
  ])

  // GIF: calendar → click a day → details → close, capped at 8 s.
  const start = Math.max(0, marks.gifStart - t0 - 0.3)
  const end = Math.min(marks.gifEnd - t0, start + GIF_MAX_SECONDS)
  const gif = path.join(MEDIA, 'demo.gif')
  for (const [fps, colors] of [[15, 256], [12, 192], [10, 128]]) {
    ffmpeg([
      '-ss', start.toFixed(2), '-t', (end - start).toFixed(2), '-i', mp4,
      '-vf', `fps=${fps},scale=800:-1:flags=lanczos,split[a][b];` +
        `[a]palettegen=max_colors=${colors}:stats_mode=diff[p];` +
        '[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
      gif,
    ])
    if (fs.statSync(gif).size < GIF_MAX_BYTES) break
  }

  ffmpeg(['-i', path.join(dir, 'poster@2x.png'), '-vf', 'scale=1280:-1:flags=lanczos', path.join(MEDIA, 'poster.png')])

  const size = f => `${(fs.statSync(path.join(MEDIA, f)).size / 1024 / 1024).toFixed(2)} MB`
  console.log(`frames: ${frames.length}, length: ${(frames.at(-1).t - t0).toFixed(1)} s`)
  console.log(`media/demo.mp4   ${size('demo.mp4')}`)
  console.log(`media/demo.gif   ${size('demo.gif')}  (${start.toFixed(1)}–${end.toFixed(1)} s)`)
  console.log(`media/poster.png ${size('poster.png')}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
