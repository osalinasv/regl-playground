import REGL from 'regl'
import { mat4, vec3, vec4 } from 'gl-matrix'
import { gsap, Back, Quart } from 'gsap'

import { cubeGeometry, sphereGeometry, coneGeometry, Geometry } from './geometry'
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
  rotation?: Vector3
  scale?: Vector3
  color?: vec3
  opacity?: number
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

const uAmbientColor: vec4 = [251 / 255, 207 / 255, 232 / 255, 0.65]
const uLightColor: vec4 = [254 / 255, 243 / 255, 199 / 255, 0.9]
const uLightPos: vec3 = [5, 6, 3]

class Mesh implements Required<Omit<MeshOptions, 'geometry'>> {
  position: Vector3
  rotation: Vector3
  scale: Vector3
  color: vec3
  opacity: number

  vertices: vec3[]
  normals: vec3[]
  indices: vec3[]

  constructor(options: MeshOptions) {
    this.position = options.position || { x: 0, y: 0, z: 0 }
    this.rotation = options.rotation || { x: 0, y: 0, z: 0 }
    this.scale = options.scale || { x: 1, y: 1, z: 1 }
    this.color = options.color || [1, 0, 1]
    this.opacity = options.opacity || 1

    this.vertices = options.geometry.vertices
    this.normals = options.geometry.normals
    this.indices = options.geometry.indices
  }

  generateModelMatrix(): mat4 {
    let result = mat4.identity(mat4.create())
    result = mat4.translate(result, result, [this.position.x, this.position.y, this.position.z])
    result = mat4.rotateZ(result, result, this.rotation.z)
    result = mat4.rotateX(result, result, this.rotation.x)
    result = mat4.rotateY(result, result, this.rotation.y)
    result = mat4.scale(result, result, [this.scale.x, this.scale.y, this.scale.z])

    return result
  }

  generateMeshColor(): vec4 {
    return [this.color[0], this.color[1], this.color[2], this.opacity]
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
      uModel: this.generateModelMatrix,
    },
    uniforms: {
      uColor: this.generateMeshColor,
      uAmbientColor,
      uLightColor,
      uLightPos,
      uView: regl.context<ReglContext, 'uView'>('uView'),
      uProjection: regl.context<ReglContext, 'uProjection'>('uProjection'),
      uModel: regl.context<any, 'uModel'>('uModel'),
      uModelInv: function (context) {
        return mat4.transpose(mat4.create(), mat4.invert(mat4.create(), context.uModel))
      },
    },
    attributes: {
      aPosition: regl.this<Mesh, 'vertices'>('vertices'),
      aNormal: regl.this<Mesh, 'normals'>('normals'),
    },
    elements: regl.this<Mesh, 'indices'>('indices'),
  })
}

interface CameraProps {
  target: vec3
  eye: vec3
}

const setupCamera = regl<{}, {}, CameraProps, {}, ReglContext>({
  context: {
    uProjection: function (context: ReglContext) {
      return mat4.perspective(mat4.create(), Math.PI / 4, context.viewportWidth / context.viewportHeight, 0.1, 100.0)
    },
    uView: function (_: ReglContext, props: CameraProps) {
      return mat4.lookAt(mat4.create(), props.eye, props.target, [0, 1, 0])
    },
    eye: function (_: ReglContext, props: CameraProps) {
      return props.eye
    },
  },
})

const cone = new Mesh({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: Math.PI / 7, y: 0, z: Math.PI / -6 },
  geometry: coneGeometry(0.8, 1.25, 6),
  color: [253 / 255, 230 / 255, 138 / 255],
})

const cube = new Mesh({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: Math.PI / -6, y: 0, z: Math.PI / -2 },
  geometry: cubeGeometry(1),
  color: [21 / 255, 19 / 255, 20 / 255],
})

const sphere = new Mesh({
  position: { x: 0, y: 0, z: 0 },
  geometry: sphereGeometry(1.33),
  color: [226 / 255, 232 / 255, 240 / 255],
})

const meshes = [cone, cube, sphere]
const radius = 1.65

for (let index = 0; index < meshes.length; index++) {
  const mesh = meshes[index]

  const angle = (2 * Math.PI * index) / meshes.length
  const x = radius * Math.cos(angle)
  const y = radius * Math.sin(angle)

  mesh.position = { x, y, z: index * 0.125 }
}

const easeIn = gsap.timeline({ defaults: { duration: 1.2 } })
const ease = Back.easeOut.config(1.75)

easeIn.from(cone.position, { y: cone.position.y - 8, ease })
easeIn.from(cone, { opacity: 0 }, '<')
easeIn.from(cube.position, { y: cube.position.y - 8, ease }, '<+=0.25')
easeIn.from(cube, { opacity: 0 }, '<')
easeIn.from(sphere.position, { y: sphere.position.y - 8, ease }, '<+=0.25')
easeIn.from(sphere, { opacity: 0 }, '<')

gsap.ticker.add(function onReglFrame() {
  regl.poll()

  regl.clear({
    color: clearColor,
    depth: 1,
  })

  setupCamera({ eye: [0, 0.25, 10], target: [0, 0, 0] }, function onSetupCamera(context) {
    cone.rotation.y = -((0.0012 * context.tick) % (Math.PI * 2))
    cube.rotation.y = (0.0008 * context.tick) % (Math.PI * 2)

    meshes.forEach((mesh) =>
      mesh.draw({
        uView: context.uView,
        uProjection: context.uProjection,
      })
    )
  })

  regl._gl.flush()
})
