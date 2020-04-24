import messageActions from '../messageActions.mjs'

const environment = location.host.match(/^(\w+)\.familysearch/)[1]
const personId = location.pathname.match(/\/([A-Z0-9-]+)$/)[1]
const envMap = {
  beta: 'beta',
  integration: 'int',
  www: 'prod'
}

chrome.runtime.sendMessage(chrome.runtime.id, {
  action: messageActions.SET_ENVIRONMENT,
  data: envMap[environment]
})
chrome.runtime.sendMessage(chrome.runtime.id, {
  action: messageActions.SET_PERSON_ID,
  data: personId
})

setTimeout(() => {
  const personPage = document.body.querySelector('fs-person-page').shadowRoot // Joys of shadow DOM
  const personDetails = personPage.querySelector('.fs-person__details')
  const newButton = document.createElement('button')

  newButton.classList.add('fs-button', 'fs-button--minor')
  newButton.style.padding = '0'
  newButton.textContent = 'Find descendant possibilities'
  newButton.addEventListener('click', () => {
    console.log('clicked!')
  })

  personDetails.appendChild(newButton)
}, 1000)