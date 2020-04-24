import messageActions from '../messageActions.mjs'

const envSelector = document.querySelector('#environment')
const personIdField = document.querySelector('#personID')
const showAdvanced = document.querySelector('#showAdvanced')
const hideAdvanced = document.querySelector('#hideAdvanced')
const advanced = document.querySelector('#advanced')

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

// Request person ID
chrome.runtime.sendMessage({ action: messageActions.REQUEST_PERSON_ID }, personId => {
  if (personId) {
    personIdField.value = personId
  }
})
