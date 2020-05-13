const canvas = document.getElementById("mon_canvas")
const context = canvas.getContext("2d")

const length = 700
const maxDist = 200
const dotsNumber = 20
const dotSize = 8
const maxConnections = 2
let move = false
let preventDraw = false

canvas.addEventListener("click", () => {
  preventDraw = !preventDraw
  if (move) swarm.animate()
  console.log(move)
})

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
    this.deadAnglesList = []
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

  drawLine(target, distance) {
    if (preventDraw) return
    if (distance) {
      const intensity = 1 - distance / maxDist
      const color = "rgba(0,0,0," + intensity + ")"
      context.strokeStyle = color
    }

    context.beginPath()
    context.moveTo(this.x, this.y)
    context.lineTo(target.x, target.y)
    context.stroke()
  }

  drawTriangle(dot1, dot2) {
    if (preventDraw) return

    context.fillStyle = `rgb(
      ${(this.x / canvas.width) * 355},
      ${(1 - dot1.x / canvas.width) * 355},
      ${(dot2.y / canvas.width) * 355})`
    context.beginPath()
    context.moveTo(this.x, this.y)
    context.lineTo(dot1.x, dot1.y)
    context.lineTo(dot2.x, dot2.y)
    context.fill()
  }

  drawAngle(start, end, color) {
    if (preventDraw) return

    context.beginPath()
    context.arc(this.x, this.y, 22, start, end)
    context.fillStyle = color || "grey"
    context.lineTo(this.x, this.y)
    context.fill()
    context.closePath()
  }

  findNeighboors(dots) {
  
    const limit = 5
    const nearDots = []
    for (let dot of dots) {
      if (dot === this) continue
      const distance = getDistance(this, dot)
      const angle = getAngle(this, dot)
  
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

  connect() {
    const maxCon = maxConnections

    if (this.connections.length >= maxCon) return

    const neighboor = this.neighboors.find(
      (candidate) => candidate.dot.connections.length < maxCon
    )

    if (neighboor === undefined) return

    const dot = neighboor.dot

    const i = dot.neighboors.findIndex((n) => n.dot === this)
    if (i !== -1) {
      dot.neighboors.splice(i, 1)
    }

    this.neighboors = this.neighboors.filter((n) => n !== neighboor)

    this.connections.push(dot)
    dot.connections.push(this)
  }

  async group() {
    if (preventDraw) return

    this.drawDot("red")
    this.visited = true

    const orderedByAngle = [...this.neighboors].sort(
      (a, b) => b.angle - a.angle
    )

    //draw line to neighboors
    for (let neighboor of orderedByAngle) {
      await delay(() => this.drawLine(neighboor.dot), 300)
    }

    // draw lines / triangle between neighboors
    for (let i = 0; i < orderedByAngle.length; i++) {
      const from = orderedByAngle[i]
      const nextIndex = (i + 1) % orderedByAngle.length
      const to = orderedByAngle[nextIndex]
      const dif =
        nextIndex !== 0
          ? Math.abs(to.angle - from.angle) % (2 * Math.PI)
          : Math.abs(-Math.PI - from.angle) + Math.abs(Math.PI - to.angle)

   
      let collision = false
      const triade = [this, to.dot, from.dot]
      triade.forEach((dot) => dot.drawDot("yellow"))

      triade.forEach((dot) => {
        dot.drawDot("orange")
        const others = triade.filter((el) => el !== dot)
        others.forEach((other) => {
          other.drawDot("violet")
          dot.deadAnglesList.forEach(([min, max]) => {
            dot.drawAngle(min, max, "grey")
            dot.drawDot("orange")
            other.drawDot("violet")
            const angle = getAngle(dot, other)

            if (angle > min && angle < max) {
              collision = true
            }
          })
          other.drawDot("yellow")
        })
        dot.drawDot("yellow")
      })
     
      triade.forEach((dot) => dot.drawDot("black"))

      if (dif < Math.PI && !collision) {
        await delay(() => from.dot.drawLine(to.dot), 5)
        await delay(() => this.drawTriangle(to.dot, from.dot), 5)
      }
    }

    // calculate "dead angle" for neighboors

    /* 
     for each neighboorN
        others = neigboors - neighboorN + this
        for each other
          calculate angle to neighboorN
        sort by angle
        add [min angle, max angle] to deadAnglesList
     */
    for (let neighboor of this.neighboors) {
      const others = this.neighboors
        .map((n) => n.dot)
        .filter((d) => d !== neighboor.dot)
      others.push(this)

      const anglesToNeighboor = others.map((other) =>
        getAngle(neighboor.dot, other)
      )

      neighboor.dot.deadAnglesList.push([
        Math.min(...anglesToNeighboor),
        Math.max(...anglesToNeighboor),
      ])
    }

    await delay(() => this.drawDot("blue"), 50)

    // repeat process to neighboors
    for (let neighboor of this.neighboors) {
      if (neighboor.dot.visited) continue
      await neighboor.dot.group()
    }
    return Promise.resolve()
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
      //console.log("distance", distance)
      //if (distance < 80) {
      this.repulse(connection)
      // }

      //   if (distance > 150) {
      //  this.attract(connection)
      // }
    }
  }
}

function getDistance(from, to) {
  return Math.sqrt(Math.pow(to.y - from.y, 2) + Math.pow(to.x - from.x, 2))
}

function getAngle(from, to) {
  const y = to.y - from.y
  const x = to.x - from.x
  return Math.atan2(y, x)
}

function delay(fn, time) {
  return new Promise((res) => {
    const executor = () => {
      fn()
      res()
    }
    setTimeout(executor, time)
  })
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
    if (move) requestAnimationFrame(this.animate.bind(this))
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (move) this.dots.forEach((dot) => dot.move(this.dots))
    this.dots.forEach((dot) => dot.drawDot("black"))
    this.dots.forEach((dot) => dot.findNeighboors(this.dots))
    //this.dots.forEach((dot) => dot.connect(this.dots))
    //this.dots[0].drawAngle(0, Math.PI * 1.5)
    this.dots[0].group()
    //this.dots.forEach((dot) => dot.group(this.dots))
    //this.dots.forEach((dot) => dot.interact())
    this.dots.forEach((dot) => dot.clean())
  }
}

const swarm = new Swarm(dotsNumber, length, context, canvas)
swarm.animate()







// https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/

// The main function that returns true if line segment 'p1q1'
// and 'p2q2' intersect.
function doIntersect(p1, q1, p2, q2) {
  // Find the four orientations needed for general and
  // special cases
  const o1 = orientation(p1, q1, p2)
  const o2 = orientation(p1, q1, q2)
  const o3 = orientation(p2, q2, p1)
  const o4 = orientation(p2, q2, q1)

  // General case
  if (o1 != o2 && o3 != o4) return true

  // Special Cases
  // p1, q1 and p2 are colinear and p2 lies on segment p1q1
  if (o1 == 0 && onSegment(p1, p2, q1)) return true

  // p1, q1 and q2 are colinear and q2 lies on segment p1q1
  if (o2 == 0 && onSegment(p1, q2, q1)) return true

  // p2, q2 and p1 are colinear and p1 lies on segment p2q2
  if (o3 == 0 && onSegment(p2, p1, q2)) return true

  // p2, q2 and q1 are colinear and q1 lies on segment p2q2
  if (o4 == 0 && onSegment(p2, q1, q2)) return true

  return false // Doesn't fall in any of the above cases
}


// To find orientation of ordered triplet (p, q, r). 
// The function returns following values 
// 0 --> p, q and r are colinear 
// 1 --> Clockwise 
// 2 --> Counterclockwise 

function orientation(p, q, r) {
  // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
  // for details of below formula.
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)

  if (val == 0) return 0 // colinear

  return val > 0 ? 1 : 2 // clock or counterclock wise
}


// Given three colinear points p, q, r, the function checks if 
// point q lies on line segment 'pr' 
function onSegment( p,  q,  r) 
{ 
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && 
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y)) 
       return true; 
  
    return false; 
}