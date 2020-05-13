class timeoutRegister {
  constructor() {
    this.register = {}
  }

  add({ id, fn, onCancel, delay }) {
    const executor = () => {
      fn()
      this.remove(id)
    }
    const timeoutID = setTimeout(executor, delay)
    this.register[id] = { onCancel, timeoutID }
  }

  remove(id) {
    delete this.register[id]
  }

  cancel(id) {
    const { onCancel, timeoutID } = this.register[id]
    if (onCancel) onCancel()
    clearTimeout(timeoutID)
    this.remove(id)
  }

  active(id) {
    return !!this.register[id]
  }
}

const sections = document.querySelectorAll("section")
const killRegister = new timeoutRegister()

for (let section of sections) {
  section.addEventListener("mouseenter", activateBackground)
  section.addEventListener("mouseleave", deactivateBackground)
}

function activateBackground(event) {
  const { iframe, path } = getElements(event)
  if (killRegister.active(path)) {
    killRegister.cancel(path)
  } else {
    iframe.setAttribute("src", path)
  }
}

function deactivateBackground(event) {
  const { iframe, path } = getElements(event)

  iframe.classList.add("transparent")

  killRegister.add({
    id: path,
    fn() {
      iframe.removeAttribute("src")
      iframe.classList.remove("transparent")
    },
    onCancel() {
      iframe.classList.remove("transparent")
    },
    delay: 800,
  })
}

function getElements(event) {
  const section = event.target
  const iframe = section.querySelector("iframe")
  const path = iframe.getAttribute("lazy-src")
  return { iframe, path }
}
