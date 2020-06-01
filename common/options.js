class Options {
    constructor(options, selector) {
      const urlParams = new URLSearchParams(window.location.search);
      if(urlParams.get('nooptions')) {
        return
      }

      this.options = options
      const wrapper = document.createElement("form")
      wrapper.style.display = "flex"
      wrapper.style.flexDirection = "column"
      wrapper.style.padding = "0.5rem"
      wrapper.style.maxWidth = "20rem"
      wrapper.style.position = "fixed"
      wrapper.style.top = "1rem"
      wrapper.style.right = "1rem"
      wrapper.style.borderRadius = "1rem"
      wrapper.style.backdropFilter = "blur(20px) invert(1)"
      
  
      for (let option in options) {
        const label = document.createElement("label")
        label.setAttribute("for", option)
        label.innerHTML = option
        label.style.backgroundColor = "rgba(255,255,255, 0.3)"
        label.style.borderTopLeftRadius = "0.5rem"
        label.style.borderTopRightRadius = "0.5rem"
        label.style.display = "inline-block"
        label.style.padding = "0.1rem 0.5rem 0"
        
        wrapper.appendChild(label)
  
        const input = document.createElement("input")
        input.value = options[option]
        input.setAttribute("id", option)
        input.style.marginBottom = "0.4rem"
        input.style.backgroundColor = "rgba(255,255,255, 0.3)"
        input.style.borderBottomLeftRadius = "0.5rem"
        input.style.borderBottomRightRadius = "0.5rem"
        input.style.padding = "0.1rem 0.5rem"
        input.style.border = "none"
        input.style.margin = "0 0 0.3rem"
  
        wrapper.appendChild(input)
  
  
      }
  
      const submit = document.createElement("input")
      submit.type = "submit"
      submit.value = "Update"
      submit.style.backgroundColor = "rgba(255,255,255, 0.5)"
      submit.style.border = "none"
      submit.style.borderRadius = "1rem"
      submit.style.margin = "0.3rem 0 0"
      submit.style.padding = "0.3rem 0"
      wrapper.appendChild(submit)
  
      document.querySelector("body").appendChild(wrapper)
  
      wrapper.addEventListener("submit", (e) => {
        e.preventDefault()
        const elementsCount = e.target.length
        for (let i = 0; i < elementsCount; i++) {
          const key = e.target[i].id
          const value = e.target[i].value
  
          if (!key) {
            continue
          }
          console.log(this.options)
          this.options[key] = value
        }
      })
    }
  }