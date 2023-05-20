import REGL from 'regl'
import { mat4, vec3 } from 'gl-matrix'

export interface ReglContext extends REGL.DefaultContext {
  uProjection: mat4
  uView: mat4
  eye: vec3
}

export function createRegl(selector: string) {
  const canvas = document.querySelector<HTMLCanvasElement>(selector)!
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
  })!

  const regl = REGL({
    canvas: canvas,
    gl: context,
    onDone(_, regl) {
      if (regl) handleResize(regl, canvas)
    },
  })

  return { regl, canvas }
}

function handleResize(regl: REGL.Regl, canvas: HTMLCanvasElement) {
  const onResize = throttle(() => {
    const { clientWidth, clientHeight } = canvas
    canvas.width = clientWidth
    canvas.height = clientHeight

    regl._refresh()
    regl._gl.viewport(0, 0, clientWidth, clientHeight)
    regl._refresh()
  })

  onResize()
  window.addEventListener('resize', onResize)
}

function throttle(fn: Function, wait: number = 300) {
  let inThrottle: boolean
  let lastFn: ReturnType<typeof setTimeout>
  let lastTime: number

  return function (this: any) {
    const context = this
    const args = arguments

    if (!inThrottle) {
      fn.apply(context, args)
      lastTime = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFn)
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= wait) {
          fn.apply(context, args)
          lastTime = Date.now()
        }
      }, Math.max(wait - (Date.now() - lastTime), 0))
    }
  }
}
