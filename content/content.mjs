import messageActions from '../messageActions.mjs'
import readCookie from '../helpers/readCookie.mjs'

const environment = location.host.match(/^(\w+)\.familysearch/)[1]
const personIdToken = location.pathname.match(/\/([A-Z0-9-]+)$/)
let personId

if (personIdToken) {
  personId = personIdToken[1]
}

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
  action: messageActions.SET_HOST,
  data: location.origin
})
chrome.runtime.sendMessage(chrome.runtime.id, {
  action: messageActions.SET_PERSON_ID,
  data: personId
})
chrome.runtime.sendMessage(chrome.runtime.id, {
  action: messageActions.SET_SESSION_ID,
  data: readCookie('fssessionid')
})
