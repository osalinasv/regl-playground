import { vec3 } from 'gl-matrix'

export type Geometry = {
  vertices: vec3[]
  normals: vec3[]
  indices: vec3[]
}

export function cubeGeometry(size: number): Geometry {
  const vertices = generateCubePositions(size)
  const indices = generateCubeindices()
  const normals = generateCubeNormals()

  return { vertices, indices, normals }
}

function generateCubePositions(size: number): vec3[] {
  const halfSize = size / 2
  const vertices: vec3[] = [
    // Front face
    [-halfSize, -halfSize, halfSize],
    [halfSize, -halfSize, halfSize],
    [halfSize, halfSize, halfSize],
    [-halfSize, halfSize, halfSize],

    // Right face
    [halfSize, -halfSize, halfSize],
    [halfSize, -halfSize, -halfSize],
    [halfSize, halfSize, -halfSize],
    [halfSize, halfSize, halfSize],

    // Back face
    [halfSize, -halfSize, -halfSize],
    [-halfSize, -halfSize, -halfSize],
    [-halfSize, halfSize, -halfSize],
    [halfSize, halfSize, -halfSize],

    // Left face
    [-halfSize, -halfSize, -halfSize],
    [-halfSize, -halfSize, halfSize],
    [-halfSize, halfSize, halfSize],
    [-halfSize, halfSize, -halfSize],

    // Top face
    [-halfSize, halfSize, halfSize],
    [halfSize, halfSize, halfSize],
    [halfSize, halfSize, -halfSize],
    [-halfSize, halfSize, -halfSize],

    // Bottom face
    [-halfSize, -halfSize, -halfSize],
    [halfSize, -halfSize, -halfSize],
    [halfSize, -halfSize, halfSize],
    [-halfSize, -halfSize, halfSize],
  ]

  return vertices
}

function generateCubeindices(): vec3[] {
  const indices: vec3[] = [
    // Front face
    [0, 1, 2],
    [2, 3, 0],

    // Right face
    [4, 5, 6],
    [6, 7, 4],

    // Back face
    [8, 9, 10],
    [10, 11, 8],

    // Left face
    [12, 13, 14],
    [14, 15, 12],

    // Top face
    [16, 17, 18],
    [18, 19, 16],

    // Bottom face
    [20, 21, 22],
    [22, 23, 20],
  ]

  return indices
}

function generateCubeNormals(): vec3[] {
  const normals: vec3[] = [
    // Front face
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],

    // Right face
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],

    // Back face
    [0, 0, -1],
    [0, 0, -1],
    [0, 0, -1],
    [0, 0, -1],

    // Left face
    [-1, 0, 0],
    [-1, 0, 0],
    [-1, 0, 0],
    [-1, 0, 0],

    // Top face
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],

    // Bottom face
    [0, -1, 0],
    [0, -1, 0],
    [0, -1, 0],
    [0, -1, 0],
  ]

  return normals
}

export function sphereGeometry(radius: number, widthSegments = 32, heightSegments = 16): Geometry {
  widthSegments = Math.max(3, Math.floor(widthSegments))
  heightSegments = Math.max(2, Math.floor(heightSegments))

  const phiStart = 0
  const phiLength = Math.PI * 2
  const thetaStart = 0
  const thetaLength = Math.PI
  const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI)

  const indices: vec3[] = []
  const vertices: vec3[] = []
  const normals: vec3[] = []

  let index = 0
  const grid = []

  let vertex = vec3.create()
  let normal = vec3.create()

  for (let iy = 0; iy <= heightSegments; iy++) {
    const verticesRow = []
    const v = iy / heightSegments

    for (let ix = 0; ix <= widthSegments; ix++) {
      const u = ix / widthSegments

      // vertex
      vertex[0] = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength)
      vertex[1] = radius * Math.cos(thetaStart + v * thetaLength)
      vertex[2] = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength)

      vertices.push([vertex[0], vertex[1], vertex[2]])

      // normal
      normal = vec3.normalize(normal, vertex)
      normals.push([normal[0], normal[1], normal[2]])

      verticesRow.push(index++)
    }

    grid.push(verticesRow)
  }

  // indices
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = grid[iy][ix + 1]
      const b = grid[iy][ix]
      const c = grid[iy + 1][ix]
      const d = grid[iy + 1][ix + 1]

      if (iy !== 0 || thetaStart > 0) indices.push([a, b, d])
      if (iy !== heightSegments - 1 || thetaEnd < Math.PI) indices.push([b, c, d])
    }
  }

  return { vertices, indices, normals }
}
