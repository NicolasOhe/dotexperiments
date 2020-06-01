function generateQuadTree(bugs, surfLength, offset) {
  const width = (height = surfLength)

  const qt = new Qtree(Qtree.getBoundary(height, width), 4, offset)
  for (bug of bugs) {
    qt.insert(bug, false)
  }

  return qt
}

class Qtree {
  constructor(boundary, capacity, offset) {
    this.boundary = boundary
    this.capacity = capacity
    this.bucket = []
    this.regions = {}
    this.divided = false
    this.gathered = []
    this.offset = offset || 0
  }

  insert(bug) {
    //console.log("insert", { x: bug.x, y: bug.y })
    if (!this.boundary.contains(bug, this.offset)) {
      //console.log("bug not in boundary,", { x: bug.x, y: bug.y }, this.boundary)
      return false
    }
    if (!this.divided) {
      if (this.bucket.length < this.capacity) {
        //console.log("adding bug to bucket", { x: bug.x, y: bug.y }, this.bucket)
        this.bucket.push(bug)
        return true
      }
      //console.log("subdividing")
      this.subdivide()
      this.transferBucket()
    }

    this.passToChild(bug)
  }

  passToChild(bug) {
    //console.log("passtochild", { x: bug.x, y: bug.y })
    if (bug.x + this.offset > this.boundary.x) {
      if (bug.y + this.offset > this.boundary.y) {
        //console.log("adding to se")
        return this.regions.se.insert(bug)
      } else {
        //console.log("adding to ne")
        return this.regions.ne.insert(bug)
      }
    } else {
      if (bug.y + this.offset > this.boundary.y) {
        //console.log("adding to sw")
        return this.regions.sw.insert(bug)
      } else {
        //console.log("adding to nw")
        return this.regions.nw.insert(bug)
      }
    }
  }

  subdivide() {
    const { x, y } = this.boundary
    const [hW, hH] = [this.boundary.w / 2, this.boundary.h / 2]
    const nwSpace = new Rectangle(x - hW, y - hH, hW, hH)
    const neSpace = new Rectangle(x + hW, y - hH, hW, hH)
    const swSpace = new Rectangle(x - hW, y + hH, hW, hH)
    const seSpace = new Rectangle(x + hW, y + hH, hW, hH)

    this.regions.nw = new Qtree(nwSpace, this.capacity, this.offset)
    this.regions.ne = new Qtree(neSpace, this.capacity, this.offset)
    this.regions.sw = new Qtree(swSpace, this.capacity, this.offset)
    this.regions.se = new Qtree(seSpace, this.capacity, this.offset)

    this.divided = true
  }

  transferBucket() {
    this.bucket.forEach((bug) => {
      this.passToChild(bug)
    })
    this.bucket = null
  }

  query(rect) {
    if (!this.boundary.intersects(rect)) {
      return []
    }

    if (rect.encompasses(this.boundary)) {
      return [...this.gather(rect)]
    }

    if (this.divided) {
      return [
        ...this.regions.nw.query(rect),
        ...this.regions.ne.query(rect),
        ...this.regions.sw.query(rect),
        ...this.regions.se.query(rect),
      ]
    } else {
      return [...this.bucket]
    }
  }

  gather(rect) {
    if (this.divided) {
      return [
        ...this.regions.nw.gather(rect),
        ...this.regions.ne.gather(rect),
        ...this.regions.sw.gather(rect),
        ...this.regions.se.gather(rect),
      ]
    } else {
      return [...this.bucket]
    }
  }

  static getBoundary(width, height) {
    const [x, y, w, h] = [width / 2, height / 2, width / 2, height / 2]

    return new Rectangle(x, y, w, h)
  }

  static getQuerySurface(x, y, w, h) {
    return new Rectangle(x, y, w / 2, h / 2)
  }
}

class Rectangle {
  constructor(x, y, w, h) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }

  contains(bug, offset) {
    //console.log("contains",bug.x +offset, bug.y + offset, this)
    const r = this
    return (
      bug.x + offset > r.x - r.w &&
      bug.x + offset < r.x + r.w &&
      bug.y + offset > r.y - r.h &&
      bug.y + offset < r.y + r.h
    )
  }
  intersects(rect) {
    const r = this
    return !(
      rect.x - rect.w > r.x + r.w ||
      rect.x + rect.w < r.x - r.w ||
      rect.y - rect.h > r.y + r.h ||
      rect.y + rect.h < r.y - r.h
    )
  }

  encompasses(rect) {
    const r = this
    return (
      rect.x - rect.w >= r.x - r.w &&
      rect.x + rect.w <= r.x + r.w &&
      rect.y - rect.h >= r.y - r.h &&
      rect.y + rect.h <= r.y + r.h
    )
  }
}

// exports.generateQuadTree = generateQuadTree
