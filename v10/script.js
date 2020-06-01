const surface = 1000
const pointsNumber = 100

const options = {
  maxDist: 300,
  speed: 0.5,
  attractIntensity: 0.0005,
  repulseIntensity: 0.002,
  repulseThreshold: 0.4,
  attractThreshold: 0.9,
}



const opt = new Options(options)

const dots = []
const canvas = document.querySelector("canvas")
canvas.width = canvas.height = surface
const gl = canvas.getContext("webgl")
let u_Points
let verticesCount

const mouse = { x: 0, y: 0 }

document.onmousemove = function (e) {
  mouse.x = e.pageX
  mouse.y = surface - e.pageY
}

function getNormalizedDotCoordinates() {
  const result = []
  result.push(mouse.x / surface, mouse.y / surface)
  dots.forEach((dot) => result.push(dot.x / surface, dot.y / surface))

  return result
}

class Dot {
  constructor(surface) {
    this.x = Math.round(Math.random() * surface)
    this.y = Math.round(Math.random() * surface)
    this.vx = Math.random() - 0.5
    this.vy = Math.random() - 0.5
    this.size = 3
    this.surface = surface
  }

  move() {
    this.x += this.vx * options.speed
    this.y += this.vy * options.speed

    if (this.x < 0 || this.x > this.surface) {
      this.vx *= -1
    }
    if (this.y < 0 || this.y > this.surface) {
      this.vy *= -1
    }
    this.connect()
  }

  direction(dot) {
    const dx = dot.x - this.x
    const dy = dot.y - this.y
    const distance = getDistance(this, dot)
    return [dx / distance, dy / distance]
  }

  attract(dot) {
    const intensity = options.attractIntensity
    const [dx, dy] = this.direction(dot)
    this.vx += dx * intensity
    this.vy += dy * intensity

    const squrSum = this.vx ** 2 + this.vy ** 2
    if (squrSum > 1) {
      this.vx /= squrSum
      this.vy /= squrSum
    }
  }

  repulse(dot) {
    const intensity = options.repulseIntensity
    const [dx, dy] = this.direction(dot)
    this.vx -= dx * intensity
    this.vy -= dy * intensity

    const squrSum = this.vx ** 2 + this.vy ** 2
    if (squrSum > 1) {
      this.vx /= squrSum
      this.vy /= squrSum
    }
  }

  connect() {
    const maxDist = options.maxDist
    for (let dot of dots) {
      if (dot === this) {
        continue
      }

      const distance = getDistance(this, dot)

      if (distance > maxDist) {
        continue
      }

      if (distance < maxDist * options.repulseThreshold) {
        this.repulse(dot)
      }

      if (distance > maxDist * options.attractThreshold) {
        this.attract(dot)
      }
    }
  }
}

function getDistance(from, to) {
  return Math.sqrt(Math.pow(to.y - from.y, 2) + Math.pow(to.x - from.x, 2))
}

function setup() {
  for (let i = 0; i < pointsNumber; i++) {
    dots.push(new Dot(surface))
  }

  const vertexShader = `
attribute vec4 a_Position;

void main() {
    gl_Position = a_Position;
}
`

  const fragmentShader = `
precision mediump float;
uniform vec4 u_Color;
uniform vec2 u_Points[${pointsNumber}];

void main() {
    vec2 coord = gl_FragCoord.xy / ${surface}.;
    const int pointsCount = ${pointsNumber};
    vec2 points[pointsCount];

    float dSqur = 9999.;
    for (int i = 0; i< pointsCount ; i++) {
      float dtemp =  pow(coord.x - u_Points[i].x, 2.) + pow(coord.y - u_Points[i].y, 2.);
      dSqur = min(dSqur, dtemp);
    }
    float d = sqrt(dSqur)*15.;

    gl_FragColor = vec4(vec3(0., d/2., d), 1.);   
}
`

  initShaders(gl, vertexShader, fragmentShader)

  const u_Color = gl.getUniformLocation(gl.program, "u_Color")
  gl.uniform4f(u_Color, 0.0, 1.0, 0.0, 1.0)

  u_Points = gl.getUniformLocation(gl.program, "u_Points")
  gl.uniform2fv(u_Points, new Float32Array(getNormalizedDotCoordinates()))

  verticesCount = initVertexBuffers(gl)

  gl.clearColor(0.0, 0.0, 0.0, 0.0)

  function initVertexBuffers(gl) {
    var vertices = new Float32Array([
      -1,
      1,
      -1.0,
      -1.0,
      1.0,
      -1.0,
      -1,
      1,
      1.0,
      1.0,
      1.0,
      -1.0,
    ])
    var n = 6 // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer()

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    // Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    var a_Position = gl.getAttribLocation(gl.program, "a_Position")

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0)

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position)

    return n
  }
}

function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, verticesCount)
}

function update() {
  dots.forEach((dot) => dot.move())
  const movingPoints = getNormalizedDotCoordinates()
  gl.uniform2fv(u_Points, new Float32Array(movingPoints))
}

function animate() {
  update()
  draw()
  requestAnimationFrame(animate)
}

setup()
animate()
