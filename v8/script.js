const length = 700
const maxDist = 200
const dotsNumber = 150
const dotSize = 8
const maxConnections = 2
const maxNeighboors = 10
let move = true
let preventDraw = false

class Dot {
  constructor(surface, connections, triangles) {
    this.id = Math.random().toString()
    this.x = Math.round(Math.random() * surface.width)
    this.y = Math.round(Math.random() * surface.height)
    this.vx = Math.random() - 0.5
    this.vy = Math.random() - 0.5
    this.size = dotSize
    this.surface = surface
    this.neighboors = []
    this.connections = []
    this.allConnections = connections
    this.allTriangles = triangles
  }

  move() {
    this.x += this.vx
    this.y += this.vy

    if (this.x < 0 || this.x > this.surface.width) {
      this.vx *= -1
    }
    if (this.y < 0 || this.y > this.surface.height) {
      this.vy *= -1
    }
  }

  findNeighboors(dots) {
    const limit = maxNeighboors
    const nearDots = []
    for (let dot of dots) {
      if (dot === this) continue
      const distance = getDistance(this, dot)
      const angle =  getAngle(this, dot)
   
      if (nearDots.length < limit) {
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

  isIntersecting(dot){
    for (let line of this.allConnections) {
      const intersect = doIntersect(this, dot, line[0], line[1])
      if (intersect) {
        return true
      }
    }
    return false
  }

  group() {
    if (preventDraw) return

    this.visited = true

    const orderedByAngle = [...this.neighboors].sort(
      (a, b) => b.angle - a.angle
    )

    //draw line to neighboors
    for (let neighboor of orderedByAngle) {
      if (!this.isIntersecting(neighboor.dot)) {
        this.allConnections.add([this, neighboor.dot])
        this.connections.push(neighboor.dot)
      }
    }

    // draw lines / triangle between neighboors
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
    this.connections = []
    this.visited = false
  }

  direction(dot) {
    const dx = dot.x - this.x
    const dy = dot.y - this.y
    const distance = getDistance(this, dot)
    return [dx / distance, dy / distance]
  }

  attract(dot) {
    const intensity = 0.005
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
    const intensity = 0.015
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
    for (let connection of this.connections) {
      const distance = getDistance(this, connection)

      if (distance < 100) {
        this.repulse(connection)
      }

      if (distance > 150) {
        this.attract(connection)
      }
    }
  }
}


class SetOfDotCollections {
    constructor (collectionSize) {
        this._collectionSize = collectionSize
        this._set = []
        this._register = {} 
    }

    add(co) {
     
      if (co.length !== this._collectionSize) throw new Error(`The collection ${co} doesn't contain ${this._collectionSize} elements`)
      co.sort((a,b)=> b.id - a.id)
      const hash = co.map(c=>c.id).join("")
    
      const noEntry = !this._register[hash]
      if (noEntry) {
        this._register[hash] = true
        this._set.push(co)
      }
    }

    clean() {
      this._set = []
      this._register = {} 
    }

    get length() {
      return this._set.length
    }

    [Symbol.iterator]() {
       const localThis = this
      return {
        current: 0,
        last: localThis._set.length-1,
    
        next() {
          if (this.current <= this.last) {
            return { done: false, value: localThis._set[this.current++] };
          } else {
            return { done: true };
          }
        }
      };
    };
    

}


class Swarm {
  constructor(elements, drawer) {
    this.dots = []
    this.connections = new SetOfDotCollections(2)
    this.triangles = new SetOfDotCollections(3)

    for (let i = 0; i < elements; i++) {
      this.dots.push(new Dot(drawer.canvas, this.connections, this.triangles))
    }

    this.drawer = drawer
  }
 


  animate() {
    const start = performance.now()
    if (move) this.dots.forEach((dot) => dot.move(this.dots))

    this.dots.forEach((dot) => dot.findNeighboors(this.dots))
    this.drawer.clear()

    //console.time()
    this.dots[0].group()
    //console.timeEnd()

    //this.connections.forEach(([from, to]) => this.drawer.drawLine(from,to))
    //this.triangles.forEach((t) => this.drawer.drawTriangle(...t))
    for(let t of this.triangles) {
      this.drawer.drawTriangle(...t)
    }
    //this.dots.forEach((dot) => this.drawer.drawDot(dot, "black"))
    //this.dots.forEach((dot) => dot.group(this.dots))
    this.dots.forEach((dot) => dot.interact())
    this.dots.forEach((dot) => dot.clean())
    this.connections.clean()
    this.triangles.clean()
    const elapsed = performance.now()- start
    // console.log("Time for one iteration:", elapsed, "ms")
    if (move) requestAnimationFrame(this.animate.bind(this))
  }
}

class CanvasDrawer {
  constructor(canvasSelector) {
    this.canvas = document.querySelector(canvasSelector)
    this.context = this.canvas.getContext("2d")
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight

    this.canvas.addEventListener("click", () => {
      preventDraw = !preventDraw
      if (move) swarm.animate()
    })
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  drawDot(dot, color) {
    this.context.fillStyle = color || "black"
    this.context.fillRect(
      dot.x - dot.size / 2,
      dot.y - dot.size / 2,
      dot.size,
      dot.size
    )
  }

  drawLine(from, to) {
    this.context.beginPath()
    this.context.moveTo(from.x, from.y)
    this.context.lineTo(to.x, to.y)
    this.context.stroke()
  }

  drawTriangle(dot1, dot2, dot3) {
    if (preventDraw) return

    this.context.fillStyle = `rgb(
      ${(dot1.x / this.canvas.width) * 255},
      ${(1 - dot2.x / this.canvas.width) * 255},
      ${(dot3.y / this.canvas.width) * 255})`

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
}

const drawer = new CanvasDrawer("#mon_canvas")
const swarm = new Swarm(dotsNumber, drawer)
swarm.animate()
