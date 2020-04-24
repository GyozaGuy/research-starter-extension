import messageActions from './messageActions.mjs'

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            css: ['#open-copy-pid'], // Person page
            pageUrl: { hostSuffix: 'familysearch.org' }
          })
          // new chrome.declarativeContent.PageStateMatcher({
          //   css: ['.fs-person__id button'], // Tree
          //   pageUrl: { hostSuffix: 'familysearch.org' }
          // })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ])
  })
})

let cachedEnvironment = ''
let cachedPersonId = ''

chrome.runtime.onMessage.addListener(({ action, data }, _sender, sendResponse) => {
  switch (action) {
    case messageActions.REQUEST_ENVIRONMENT:
      sendResponse(cachedEnvironment)
      break
    case messageActions.REQUEST_PERSON_ID:
      sendResponse(cachedPersonId)
      break
    case messageActions.SET_ENVIRONMENT:
      cachedEnvironment = data
      break
    case messageActions.SET_PERSON_ID:
      cachedPersonId = data
      break
  }
})
