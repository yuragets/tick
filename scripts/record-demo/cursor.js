// Injected via addInitScript: a visible fake cursor for screen recordings
// (headless browsers don't render the real one). Driven from record.mjs via
// window.__demoCursor.move(x, y, ms) and window.__demoCursor.click().
(() => {
  // Arrow tip offset inside the SVG, so (x, y) is where the tip points.
  const TIP_X = 4
  const TIP_Y = 3
  let el = null
  let pos = { x: 640, y: 420 }

  function install() {
    if (document.getElementById('__demo-cursor')) return
    el = document.createElement('div')
    el.id = '__demo-cursor'
    el.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 24 24">' +
      '<path d="M4 3l14.5 9-6.4 1.3 3.8 7.1-2.7 1.4-3.8-7.1L4.5 19z" ' +
      'fill="#fff" stroke="#16181d" stroke-width="1.5" stroke-linejoin="round"/></svg>'
    Object.assign(el.style, {
      position: 'fixed', left: '0', top: '0', zIndex: '2147483647',
      pointerEvents: 'none', willChange: 'transform',
      filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.45))',
    })
    place(0)
    // On <html>, so React re-renders of #root never remove it.
    document.documentElement.appendChild(el)
  }

  function place(ms, scale = 1) {
    el.style.transition = `transform ${ms}ms cubic-bezier(.45,.05,.25,1)`
    el.style.transform = `translate(${pos.x - TIP_X}px, ${pos.y - TIP_Y}px) scale(${scale})`
  }

  window.__demoCursor = {
    move(x, y, ms) {
      pos = { x, y }
      place(ms)
    },
    click() {
      place(90, 0.82)
      setTimeout(() => place(120), 110)
      const ring = document.createElement('div')
      Object.assign(ring.style, {
        position: 'fixed', left: `${pos.x - 18}px`, top: `${pos.y - 18}px`,
        width: '36px', height: '36px', borderRadius: '50%',
        border: '2px solid rgba(110,168,254,.9)', background: 'rgba(110,168,254,.18)',
        zIndex: '2147483646', pointerEvents: 'none',
      })
      document.documentElement.appendChild(ring)
      ring.animate(
        [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.3)', opacity: 0 }],
        { duration: 450, easing: 'ease-out' },
      ).onfinish = () => ring.remove()
    },
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install)
  else install()
})()
