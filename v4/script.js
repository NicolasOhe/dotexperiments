const canvas = document.getElementById("mon_canvas")
const context = canvas.getContext("2d")

const length = 700
const maxDist = 100
const dotsNumber = 30
const dotSize = 8
const maxConnections = 2

canvas.width = length
canvas.height = length
canvas.style.width = length / 1 + "px"
canvas.style.height = length / 1 + "px"

class Dot {
  constructor(length) {
    this.x = Math.round(Math.random() * length)
    this.y = Math.round(Math.random() * length)
    this.vx = Math.random() - 0.5
    this.vy = Math.random() - 0.5
    this.size = dotSize
    this.neighboors = []
    this.connections = []
  }

  move(dots) {
    this.x += this.vx
    this.y += this.vy

    if (this.x < 0 || this.x > length) {
      this.vx *= -1
    }
    if (this.y < 0 || this.y > length) {
      this.vy *= -1
    }

    this.drawDot("black")
  }

  drawDot(color) {
    context.fillStyle = color || "black"
    context.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    )
  }

  drawLine(target) {
    context.beginPath()
    context.moveTo(this.x, this.y)
    context.lineTo(target.x, target.y)
    context.stroke()
  }

  findNeighboors(dots) {

    const limit = 10
    const nearDots = []
    for (let dot of dots) {
      if (dot === this) continue
      const distance = getDistance(this, dot)
      
      if (nearDots.length < limit) {
        nearDots.push([distance, dot])
        nearDots.sort((a, b) => a[0] - b[0])
        continue
      }
      const distanceLeastNearDot = nearDots[nearDots.length - 1][0]
      if (distance < distanceLeastNearDot) {
        nearDots.push([distance, dot])
        nearDots.sort((a, b) => a[0] - b[0])
        nearDots.pop()
      }
    }
    this.neighboors = nearDots
  }
  connect() {
    const maxCon = maxConnections;

    if (this.connections.length >= maxCon) return;

    let dot;
    for (let [_, candidate] of this.neighboors) {
      if (candidate.connections.length < maxCon) {
        dot = candidate
        break
      }

    }

    if (dot === undefined) return;

    this.drawLine(dot)
    const i = dot.neighboors.findIndex((n) => n[1] === this)
    if (i !== -1) {
      dot.neighboors.splice(i, 1)
    }

    this.connections.push(dot)
    dot.connections.push(this)
    
  }

  color() {
    switch (this.connections.length) {
      case 1:
        this.drawDot("black")
        break
      case 2:
        this.drawDot("yellow")
        break
      case 3:
        this.drawDot("orange")
        break
      case 4:
        this.drawDot("red")
        break
      default:
        this.drawDot("violet")
        break
    }
  }
  clean() {
    this.connections = []
  }

  // attract() {
  //   this.vx = this.vx * (1 - 0.01)
  //   this.vy = this.vy * (1 - 0.01)
  // }

  // repulse() {
  //   this.vx = this.vx * (1 + 0.01) + (this.vx > 0 ? 0.01 : -0.01)
  //   this.vy = this.vy * (1 + 0.01) + (this.vy > 0 ? 0.01 : -0.01)
  // }
}

function getDistance(from, to) {
  return Math.sqrt(Math.pow(to.y - from.y, 2) + Math.pow(to.x - from.x, 2))
}

class Swarm {
  constructor(elements, surfaceLength, context, canvas) {
    this.dots = []
    this.context = context
    this.canvas = canvas
    for (let i = 0; i < elements; i++) {
      this.dots.push(new Dot(surfaceLength))
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    this.context.clearRect(0, 0, canvas.width, canvas.height)
    this.dots.forEach((dot) => dot.move(this.dots))
    this.dots.forEach((dot) => dot.findNeighboors(this.dots))
    this.dots.forEach((dot) => dot.connect(this.dots))
    this.dots.forEach((dot) => dot.color())
    this.dots.forEach((dot) => dot.clean())
  }
}

const swarm = new Swarm(dotsNumber, length, context)
swarm.animate()
