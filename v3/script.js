const canvas = document.getElementById("mon_canvas")
const context = canvas.getContext("2d")

const length = 700
const maxDist = 100
const dotsNumber = 80

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
    this.size = 3
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

    context.fillStyle = "black"
    context.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    )
  }

  findNeighboors(dots) {
    const limit = 10
    const topSix = []
    for (let dot of dots) {
      if (dot === this) continue
      const distance = getDistance(this, dot)
      //debugger
      if (topSix.length < limit) {
        topSix.push([distance, dot])
        topSix.sort((a, b) => a[0] - b[0])
        continue
      }
      if (distance < topSix[topSix.length - 1][0]) {
        topSix.push([distance, dot])
        topSix.sort((a, b) => a[0] - b[0])
        topSix.pop()
      }
    }
    this.neighboors = topSix
  }
  connect() {
    if(this.neighboors[0][0] == undefined) console.log("no neighboors")
    const dot = this.neighboors[0][1]
    context.beginPath()
    context.moveTo(this.x, this.y)
    context.lineTo(dot.x, dot.y)
    context.stroke()

    context.fillStyle = "red"
    context.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    )
  
    const i = dot.neighboors.findIndex((n) => n[1] === this)
   
    if (i !== -1) {
      dot.neighboors.splice(i, 1)
    }

    context.fillStyle = "black"
    context.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    )
    
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
  }
}

const swarm = new Swarm(dotsNumber, length, context)
swarm.animate()
