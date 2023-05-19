import REGL from 'regl'
import { mat4, vec3, vec4 } from 'gl-matrix'

import { cubeGeometry, sphereGeometry, Geometry } from './geometry'
import { createRegl, ReglContext } from './regl'

const { regl } = createRegl('#regl-canvas')
const clearColor: REGL.Vec4 = [0, 0, 0, 0]

type Vector3 = {
  x: number
  y: number
  z: number
}

type MeshOptions = {
  position?: Vector3
  scale?: Vector3
  color?: vec4
  geometry: Geometry
}

interface MeshContext {
  uModel: mat4
}

interface MeshUniforms {
  uColor: vec4
  uAmbientColor: vec4
  uLightColor: vec4
  uLightPos: vec3
  uView: mat4
  uProjection: mat4
  uModel: mat4
  uModelInv: mat4
}

class Mesh implements Required<Omit<MeshOptions, 'geometry'>> {
  position: Vector3
  scale: Vector3
  color: vec4

  vertices: vec3[]
  normals: vec3[]
  indices: vec3[]

  constructor(options: MeshOptions) {
    this.position = options.position || { x: 0, y: 0, z: 0 }
    this.scale = options.scale || { x: 1, y: 1, z: 1 }
    this.color = options.color || [1, 0, 1, 1]

    this.vertices = options.geometry.vertices
    this.normals = options.geometry.normals
    this.indices = options.geometry.indices
  }

  draw = regl<MeshUniforms, {}, {}, MeshContext, ReglContext>({
    frag: `
    precision mediump float;

    uniform vec4 uColor, uAmbientColor, uLightColor;
    uniform vec3 uLightPos;
    varying vec3 fragNormal, fragPos;

    void main () {
      vec3 norm = normalize(fragNormal);
      vec3 dir = normalize(uLightPos - fragPos);

      float diff = max(dot(norm, dir), 0.0);
      vec3 diffuse = diff * uLightColor.rgb * uLightColor.a;

      vec3 ambient = uAmbientColor.rgb * uAmbientColor.a;
      gl_FragColor = vec4(ambient + diffuse, 1.0) * uColor;
    }`,
    vert: `
    precision mediump float;

    uniform mat4 uProjection, uView, uModel, uModelInv;
    attribute vec3 aPosition, aNormal;
    varying vec3 fragNormal, fragPos;

    void main () {
      gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
      fragPos = vec3(uModel * vec4(aPosition, 1.0));
      fragNormal = mat3(uModelInv) * aNormal;
    }`,
    frontFace: 'ccw',
    cull: {
      enable: true,
      face: 'back',
    },
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 1,
        dstRGB: 'one minus src alpha',
        dstAlpha: 1,
      },
      equation: {
        rgb: 'add',
        alpha: 'add',
      },
      color: clearColor,
    },
    context: {
      uModel: ({ tick }: ReglContext) => {
        const t = 0.01 * tick

        let result = mat4.identity(mat4.create())
        result = mat4.translate(result, result, [this.position.x, this.position.y, this.position.z])
        result = mat4.rotate(result, result, t, [0, 1, 0])
        result = mat4.scale(result, result, [this.scale.x, this.scale.y, this.scale.z])

        return result
      },
    },
    uniforms: {
      uColor: () => this.color,
      uAmbientColor: [251 / 255, 207 / 255, 232 / 255, 0.65],
      uLightColor: [254 / 255, 243 / 255, 199 / 255, 0.9],
      uLightPos: [5, 6, 4],
      uView: (context) => context.uView,
      uProjection: (context) => context.uProjection,
      uModel: (context) => context.uModel,
      uModelInv: (context) => {
        return mat4.transpose(mat4.create(), mat4.invert(mat4.create(), context.uModel))
      },
    },
    attributes: {
      aPosition: () => this.vertices,
      aNormal: () => this.normals,
    },
    elements: () => this.indices,
  })
}

interface CameraProps {
  target: vec3
  eye: vec3
}

const setupCamera = regl<{}, {}, CameraProps, {}, ReglContext>({
  context: {
    uProjection: (context: ReglContext) => {
      return mat4.perspective(mat4.create(), Math.PI / 4, context.viewportWidth / context.viewportHeight, 0.1, 100.0)
    },
    uView: (_: ReglContext, props: CameraProps) => {
      return mat4.lookAt(mat4.create(), props.eye, props.target, [0, 1, 0])
    },
    eye: (_: ReglContext, props: CameraProps) => {
      return props.eye
    },
  },
})

const cube = new Mesh({
  position: { x: 0, y: 0, z: 2 },
  geometry: cubeGeometry(1),
  color: [21 / 255, 19 / 255, 20 / 255, 1],
})

const sphere = new Mesh({
  position: { x: 0, y: 0, z: 0 },
  geometry: sphereGeometry(1),
  color: [226 / 255, 232 / 255, 240 / 255, 1],
})

regl.frame(() => {
  regl.clear({
    color: clearColor,
    depth: 1,
  })

  setupCamera({ eye: [0, 3, 10], target: [0, 0, 0] }, function (context) {
    cube.draw({
      uView: context.uView,
      uProjection: context.uProjection,
    })
    sphere.draw({
      uView: context.uView,
      uProjection: context.uProjection,
    })
  })
})
