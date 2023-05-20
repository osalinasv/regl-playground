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

export function coneGeometry(
  radiusBottom = 1,
  height = 1,
  radialSegments = 32,
  heightSegments = 1,
  thetaStart = 0,
  thetaLength = Math.PI * 2
): Geometry {
  const radiusTop = 0
  radialSegments = Math.floor(radialSegments)
  heightSegments = Math.floor(heightSegments)

  // buffers
  const indices: vec3[] = []
  const vertices: vec3[] = []
  const normals: vec3[] = []

  // helper variables
  const indexArray: number[][] = []
  const halfHeight = height / 2

  let index = 0

  // generate geometry
  generateTorso()
  generateCap(false)

  // build geometry
  function generateTorso() {
    let normal = vec3.create()
    let vertex = vec3.create()

    // this will be used to calculate the normal
    const slope = (radiusBottom - radiusTop) / height

    // generate vertices, normals and uvs
    for (let y = 0; y <= heightSegments; y++) {
      const indexRow = []
      const v = y / heightSegments

      // calculate the radius of the current row
      const radius = v * (radiusBottom - radiusTop) + radiusTop

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments
        const theta = u * thetaLength + thetaStart

        const sinTheta = Math.sin(theta)
        const cosTheta = Math.cos(theta)

        // vertex
        vertex[0] = radius * sinTheta
        vertex[1] = -v * height + halfHeight
        vertex[2] = radius * cosTheta
        vertices.push([vertex[0], vertex[1], vertex[2]])

        // normal
        normal = vec3.normalize(normal, [sinTheta, slope, cosTheta])
        normals.push([normal[0], normal[1], normal[2]])

        // save index of vertex in respective row
        indexRow.push(index++)
      }

      // now save vertices of the row in our index array
      indexArray.push(indexRow)
    }

    // generate indices
    for (let x = 0; x < radialSegments; x++) {
      for (let y = 0; y < heightSegments; y++) {
        // we use the index array to access the correct indices

        const a = indexArray[y][x]
        const b = indexArray[y + 1][x]
        const c = indexArray[y + 1][x + 1]
        const d = indexArray[y][x + 1]

        // faces
        indices.push([a, b, d])
        indices.push([b, c, d])
      }
    }
  }

  function generateCap(top: boolean) {
    // save the index of the first center vertex
    const centerIndexStart = index
    const vertex = vec3.create()

    const radius = top === true ? radiusTop : radiusBottom
    const sign = top === true ? 1 : -1

    // first we generate the center vertex data of the cap.
    // because the geometry needs one set of uvs per face,
    // we must generate a center vertex per face/segment

    for (let x = 1; x <= radialSegments; x++) {
      // vertex
      vertices.push([0, halfHeight * sign, 0])
      // normal
      normals.push([0, sign, 0])

      index++
    }

    // save the index of the last center vertex
    const centerIndexEnd = index

    // now we generate the surrounding vertices, normals and uvs

    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments
      const theta = u * thetaLength + thetaStart

      const cosTheta = Math.cos(theta)
      const sinTheta = Math.sin(theta)

      // vertex

      vertex[0] = radius * sinTheta
      vertex[1] = halfHeight * sign
      vertex[2] = radius * cosTheta
      vertices.push([vertex[0], vertex[1], vertex[2]])

      // normal
      normals.push([0, sign, 0])

      index++
    }

    // generate indices
    for (let x = 0; x < radialSegments; x++) {
      const c = centerIndexStart + x
      const i = centerIndexEnd + x

      if (top === true) {
        // face top
        indices.push([i, i + 1, c])
      } else {
        // face bottom
        indices.push([i + 1, i, c])
      }
    }
  }

  return { vertices, indices, normals }
}
