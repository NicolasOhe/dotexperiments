function initShaders(gl, vertexShader, fragmentShader) {
  const program = createProgramm(gl, vertexShader, fragmentShader)
  gl.program = program
  gl.useProgram(program)
  return true
}

function createProgramm(gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = loadShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  )

  const program = gl.createProgram()

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)

  gl.linkProgram(program)

  return program
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type)

  gl.shaderSource(shader, source)

  gl.compileShader(shader)

  const isCompiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (!isCompiled) {
    const decodedType =
      type === gl.VERTEX_SHADER
        ? "vertex"
        : type === gl.FRAGMENT_SHADER
        ? "fragment"
        : "unknown type"
    console.error(`The ${decodedType} shader could not be compiled`)
  }

  return shader
}



class Stats {
  constructor(range, selector) {
    this.total = 0
    this.elements = []
    if (range == null) throw new Error("The stats class needs a range!")
    this.range = range
    this.last = 0
    this.count = 0
    this.domElement = this.linkToDOM(selector)
  }

  linkToDOM(selector) {
    let el = document.querySelector(selector)
    if (!el) {
      console.warn("No selector was provided to display the stats. A <p> element was added to the end of <body>")
      el = document.createElement("p")
      document.querySelector("body").appendChild(el)
    }
    return el
  }

  add(value) {
    if (typeof(value) !== "number") return 0
    this.count++
    const change = value - this.last
    this.elements.push(change)
    this.total += change
    this.last = value
    
    if (this.count > this.range) {
      this.total -= this.elements.shift()
    }

    if (this.count % this.range === 0) {
      this.updateDom()
    }

    return change
  }

  updateDom() {
    const average = Math.round(1000 / (this.total / this.range))
    this.domElement.innerHTML = `${average} fps`
  }
}
