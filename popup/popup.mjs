import messageActions from '../messageActions.mjs'
import fetchData from '../helpers/fetchData.mjs'

const form = document.querySelector('#inputForm')
const envSelector = document.querySelector('#environment')
const sessionIdField = document.querySelector('#sessionId')
const personIdField = document.querySelector('#personId')
const showAdvanced = document.querySelector('#showAdvanced')
const hideAdvanced = document.querySelector('#hideAdvanced')
const advanced = document.querySelector('#advanced')

let cachedHost = ''

form.addEventListener('submit', async event => {
  event.preventDefault()
  const data = [...form.elements].reduce((configObj, el) => ({ ...configObj, [el.id]: el.value }))
  delete data.environment // We don't need this for now
  data.host = cachedHost
  const results = await fetchData(data)

  // console.log(results)
})

showAdvanced.onclick = function() {
  advanced.hidden = false
  showAdvanced.hidden = true
}

hideAdvanced.onclick = function() {
  advanced.hidden = true
  showAdvanced.hidden = false
}

// Request environment
chrome.runtime.sendMessage({ action: messageActions.REQUEST_ENVIRONMENT }, environment => {
  if (environment) {
    envSelector.value = environment
  }
})

// Request host
chrome.runtime.sendMessage({ action: messageActions.REQUEST_HOST }, host => {
  if (host) {
    cachedHost = host
  }
})

// Request person ID
chrome.runtime.sendMessage({ action: messageActions.REQUEST_PERSON_ID }, personId => {
  if (personId) {
    personIdField.value = personId
  }
})

// Request session ID
chrome.runtime.sendMessage({ action: messageActions.REQUEST_SESSION_ID }, sessionId => {
  if (sessionId) {
    sessionIdField.value = sessionId
  }
})
