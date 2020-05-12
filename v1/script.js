const canvas = document.getElementById("mon_canvas")
const context = canvas.getContext("2d")

const length = 1000
const maxDist = 100
const dotsNumber = 600
canvas.width = length
canvas.height = length
canvas.style.width = length / 1 + "px"
canvas.style.height = length / 1 + "px"

const dots = []

class Dot {
  constructor(length) {
    this.x = Math.round(Math.random() * length)
    this.y = Math.round(Math.random() * length)
    this.vx = Math.random() - 0.5
    this.vy = Math.random() - 0.5
    this.size = 3
  }

  move() {
    this.x += this.vx
    this.y += this.vy

    if (this.x < 0 || this.x > length) {
      this.vx *= -1
    }
    if (this.y < 0 || this.y > length) {
      this.vy *= -1
    }

    context.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    )
    this.connect()
  }

  connect() {
    const remainingDots = dots.slice(dots.findIndex((dot) => dot === this) + 1)
  
    for (let dot of remainingDots) {
      const distance = getDistance(this, dot)

      if (distance > maxDist) {
        continue
      }

      if (distance > maxDist * 0.8) {
        this.attract(dot)
      }

      if (distance < maxDist * 0.3) {
        this.repulse(dot)
      }

      const intensity = 1 - distance / maxDist
      const color = "rgba(0,0,0," + intensity + ")"
      //console.log("color",color)
      context.strokeStyle = color
      context.beginPath()
      context.moveTo(this.x, this.y)
      context.lineTo(dot.x, dot.y)
      context.stroke()
    }
  }

  attract() {
    this.vx *= 1 - 0.01
    this.vy *= 1 - 0.01
  }

  repulse() {
    this.vx = this.vx * (1 + 0.01) + (this.vx > 0 ? 0.01 : -0.01)
    this.vy = this.vy * (1 + 0.01) + (this.vy > 0 ? 0.01 : -0.01)
  }
}

function getDistance(from, to) {
  return Math.sqrt(Math.pow(to.y - from.y, 2) + Math.pow(to.x - from.x, 2))
}

for (let i = 0; i < dotsNumber; i++) {
  dots.push(new Dot(length))
}


(function animate() {
  requestAnimationFrame(animate)
  context.clearRect(0, 0, canvas.width, canvas.height) 

  dots.forEach((dot) => dot.move())
})()

