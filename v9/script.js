const options = {
  // static after start
  dotsNumber: 100,

  // can be edited live
  _move: true,
  get move() {
    return this._move
  },
  set move(value) {
    this._move = value
    this.restart()
  },
  restart() {
    return "replace with method triggering animation again"
  },
  velocity: 1,

  attract: {
    distance: 300,
    intensity: 0.005,
  },
  repulse: {
    distance: 80,
    intensity: 0.015,
  },
  maxNeighboors: 10,
  margin: -50,
  showDots: false,
  showOwnConnections: false,
  dotSize: 5,
  triangle: {
    altering: 0.5,
    colorAmplification: 2,
  },

  _background: "multicolor",

  get background() {
    return this._background
  },

  set background(value) {
    this._background = value
    this.setBackground(value)
  },
  setBackground() {
    return "replace with method triggering bg change"
  },
}

class Dot {
  constructor(surface, connections, triangles, options) {
    this.id = Math.random().toString()
    this.x = Math.round(Math.random() * surface.width)
    this.y = Math.round(Math.random() * surface.height)
    this.vx = Math.random() - 0.5
    this.vy = Math.random() - 0.5
    this.surface = surface
    this.neighboors = []
    this.ownConnections = []
    this.allConnections = connections
    this.allTriangles = triangles
    this.options = options
  }

  move() {
    const { velocity, margin } = this.options
    this.x += this.vx * velocity
    this.y += this.vy * velocity

    if (this.x - margin < 0) {
      this.vx = Math.max(Math.abs(this.vx), 0.5)
    } else if (this.x + margin > this.surface.width) {
      this.vx = Math.min(-Math.abs(this.vx), -0.5)
    }

    if (this.y - margin < 0) {
      this.vy = Math.max(Math.abs(this.vy), 0.5)
    } else if (this.y + margin > this.surface.height) {
      this.vy = Math.min(-Math.abs(this.vy), -0.5)
    }
  }

  findNeighboors(dots) {
    const nearDots = []
    for (let dot of dots) {
      if (dot === this) continue
      const distance = getDistance(this, dot)
      const angle = getAngle(this, dot)

      if (nearDots.length < options.maxNeighboors) {
        nearDots.push({ distance, dot, angle })
        nearDots.sort((a, b) => a.distance - b.distance)
        continue
      }
      const distanceLeastNearDot = nearDots[nearDots.length - 1].distance
      if (distance < distanceLeastNearDot) {
        nearDots.push({ distance, dot, angle })
        nearDots.sort((a, b) => a.distance - b.distance)
        nearDots.pop()
      }
    }
    this.neighboors = nearDots
  }

  isIntersecting(dot) {
    for (let line of this.allConnections) {
      const intersect = doIntersect(this, dot, line[0], line[1])
      if (intersect) {
        return true
      }
    }
    return false
  }

  group() {
    this.visited = true

    const orderedByAngle = [...this.neighboors].sort(
      (a, b) => b.angle - a.angle
    )

    //draw line to neighboors
    for (let neighboor of orderedByAngle) {
      if (!this.isIntersecting(neighboor.dot)) {
        this.allConnections.add([this, neighboor.dot])
        this.ownConnections.push(neighboor.dot)
      }
    }

    // draw lines / triangles between neighboors
    for (let i = 0; i < orderedByAngle.length; i++) {
      const from = orderedByAngle[i]
      const nextIndex = (i + 1) % orderedByAngle.length
      const to = orderedByAngle[nextIndex]

      let collide = false

      for (let line of this.allConnections) {
        const intersect =
          doIntersect(from.dot, to.dot, line[0], line[1]) ||
          doIntersect(this, to.dot, line[0], line[1]) ||
          doIntersect(this, from.dot, line[0], line[1])

        if (intersect) {
          collide = true
          break
        }
      }

      if (!collide) {
        this.allConnections.add([to.dot, from.dot])
        this.allTriangles.add([this, to.dot, from.dot])
      }
    }

    // repeat process to neighboors
    for (let neighboor of this.neighboors) {
      if (neighboor.dot.visited) continue
      neighboor.dot.group()
    }
  }

  clean() {
    this.ownConnections = []
    this.visited = false
  }

  direction(dot) {
    const dx = dot.x - this.x
    const dy = dot.y - this.y
    const distance = getDistance(this, dot)
    return [dx / distance, dy / distance]
  }

  attract(dot) {
    const intensity = options.attract.intensity
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
    const intensity = options.repulse.intensity
    const [dx, dy] = this.direction(dot)
    this.vx -= dx * intensity
    this.vy -= dy * intensity

    const squrSum = this.vx ** 2 + this.vy ** 2
    if (squrSum > 1) {
      this.vx /= squrSum
      this.vy /= squrSum
    }
  }

  interact() {
    for (let connection of this.ownConnections) {
      const distance = getDistance(this, connection)

      if (distance < options.repulse.distance) {
        this.repulse(connection)
      }

      if (distance > options.attract.distance) {
        this.attract(connection)
      }
    }
  }
}

class SetOfDotCollections {
  constructor(collectionSize, options) {
    this._collectionSize = collectionSize
    this._set = []
    this._register = {}
    this.options = options
  }

  add(co) {
    if (co.length !== this._collectionSize)
      throw new Error(
        `The collection ${co} doesn't contain ${this._collectionSize} elements`
      )
    co.sort((a, b) => b.id - a.id)
    const hash = co.map((c) => c.id).join("")

    co.hash = hash

    const noEntry = !this._register[hash]
    if (noEntry) {
      this._register[hash] = 1
      this._set.push(co)
    } else {
      this._register[hash] = Math.min(this._register[hash] + 1, 100)
    }
  }

  getIntensity(hash) {
    return this._register[hash] / (100 / this.options.colorAmplification)
  }

  clean() {
    this._set = []
    this._register = {}
  }

  alter() {
    this._set.forEach((co) => {
      this._register[co.hash] -= this.options.altering
    })
    this._set = this._set.filter((co) => this._register[co.hash] > 0)
  }

  get length() {
    return this._set.length
  }

  [Symbol.iterator]() {
    const localThis = this
    return {
      current: 0,
      last: localThis._set.length - 1,

      next() {
        if (this.current <= this.last) {
          return { done: false, value: localThis._set[this.current++] }
        } else {
          return { done: true }
        }
      },
    }
  }
}

class Swarm {
  constructor(options, drawer) {
    this.dots = []
    this.connections = new SetOfDotCollections(2)
    this.triangles = new SetOfDotCollections(3, options.triangle)

    for (let i = 0; i < options.dotsNumber; i++) {
      this.dots.push(
        new Dot(drawer.canvas, this.connections, this.triangles, options)
      )
    }
    this.options = options
    this.drawer = drawer
  }

  animate() {
    const start = performance.now()
    this.drawer.clear()
    this.dots.forEach((dot) => dot.move(this.dots))
    this.dots.forEach((dot) => dot.findNeighboors(this.dots))

    this.dots[0].group()

    for (let t of this.triangles) {
      const intensity = this.triangles.getIntensity(t.hash)
      const args = [...t, intensity]
      this.drawer.drawTriangle(...args)
    }
    if (options.showDots) {
      this.dots.forEach((dot) =>
        this.drawer.drawDot(dot, undefined, options.dotSize)
      )
    }
    if (options.showOwnConnections) {
      this.dots.forEach((dot) =>
        dot.ownConnections.forEach((co) => this.drawer.drawLine(dot, co))
      )
    }

    this.dots.forEach((dot) => dot.interact())
    this.dots.forEach((dot) => dot.clean())
    this.connections.clean()
    this.triangles.alter()
    const elapsed = Math.round(performance.now() - start)
    //console.log("Time for one iteration:", elapsed , "ms")

    if (options.move) requestAnimationFrame(this.animate.bind(this))
  }
}

class CanvasDrawer {
  constructor(canvasSelector, backgroundCanvasSelector, bgColor) {
    this.canvas = document.querySelector(canvasSelector)
    this.context = this.canvas.getContext("2d")
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight

    this.canvas.addEventListener("click", () => {
      if (move) swarm.animate()
      console.log(move)
    })
    window.addEventListener("resize", () => {
      this.canvas.width = window.innerWidth
      this.canvas.height = window.innerHeight
    })

    this.bgCanvas = document.querySelector(
      backgroundCanvasSelector || "#background"
    )
    this.bgContext = this.bgCanvas.getContext("2d")
    this.setBackground(bgColor)
  }

  setBackground(bgColor) {
    if (bgColor === "multicolor") {
      const length = this.bgCanvas.width
      const myImageData = this.bgContext.createImageData(length, length)
      const data = myImageData.data
      const line = length * 4

      for (let i = 0; i < data.length; i += 4) {
        data[i] = ((i % line) / line) * 255 // red
        data[i + 1] = 255 - ((i % line) / line) * 255 // green
        data[i + 2] = (Math.floor(i / line) / length) * 255 // blue
        data[i + 3] = 255 // transparency
      }

      this.bgContext.putImageData(myImageData, 0, 0)
    } else {
      this.bgContext.beginPath()
      this.bgContext.fillStyle = bgColor
      this.bgContext.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.width)
    }
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  drawDot(dot, color, size) {
    if (size === undefined) {
      size = 8
    }
    this.context.fillStyle = color || "black"
    this.context.fillRect(dot.x - size / 2, dot.y - size / 2, size, size)
  }

  drawLine(from, to, color) {
    this.context.fillStyle = color || "black"
    this.context.beginPath()
    this.context.moveTo(from.x, from.y)
    this.context.lineTo(to.x, to.y)
    this.context.stroke()
  }

  drawTriangle(dot1, dot2, dot3, intensity) {
    this.context.fillStyle = `rgba(
      ${(dot1.x / this.canvas.width) * 255},
      ${(1 - dot2.x / this.canvas.width) * 255},
      ${(dot3.y / this.canvas.width) * 255},
      ${intensity})`

    this.context.beginPath()
    this.context.moveTo(dot1.x, dot1.y)
    this.context.lineTo(dot2.x, dot2.y)
    this.context.lineTo(dot3.x, dot3.y)
    this.context.fill()
  }

  drawAngle(start, end, color) {
    if (preventDraw) return

    this.context.beginPath()
    this.context.arc(this.x, this.y, 22, start, end)
    this.context.fillStyle = color || "grey"
    this.context.lineTo(this.x, this.y)
    this.context.fill()
    this.context.closePath()
  }
}

const drawer = new CanvasDrawer(
  "#mon_canvas",
  "#background",
  options.background
)
const swarm = new Swarm(options, drawer)

options.restart = () => swarm.animate()
options.setBackground = (color) => drawer.setBackground(color)

swarm.animate()
