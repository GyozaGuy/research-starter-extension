const buttonContainer = document.getElementById('buttonDiv')
const buttonColors = ['#3aa757', '#e8453c', '#f9bb2d', '#4688f1']

function constructOptions(colors) {
  colors.forEach(color => {
    let button = document.createElement('button')

    button.style.backgroundColor = color

    button.addEventListener('click', () => {
      chrome.storage.sync.set({ color: color }, () => {
        console.log('color is', color)
      })
    })

    buttonContainer.appendChild(button)
  })
}

constructOptions(buttonColors)
