import REGL from 'regl'
import type { mat4, vec3 } from 'gl-matrix'

export interface ReglContext extends REGL.DefaultContext {
  uProjection: mat4
  uView: mat4
  eye: vec3
}

export function createRegl(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
  })!

  const regl = REGL({
    canvas: canvas,
    gl: context,
  })

  return { regl, canvas, context }
}
