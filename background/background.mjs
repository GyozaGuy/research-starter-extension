import messageActions from '../messageActions.mjs'

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
let cachedHost = ''
let cachedPersonId = ''
let cachedSessionId = ''

chrome.runtime.onMessage.addListener(({ action, data }, _sender, sendResponse) => {
  switch (action) {
    case messageActions.CACHE_RESULTS:
      chrome.storage.local.set({ cachedResults: data })
      break
    case messageActions.CLEAR_RESULTS_CACHE:
      chrome.storage.local.remove(['cachedResults'])
      break
    case messageActions.MARK_RESULT_COMPLETE:
      chrome.storage.local.get(['completedResults'], ({ completedResults = [] }) => {
        const newCompletedResults = [...completedResults, data]
        chrome.storage.local.set({ completedResults: newCompletedResults })
        sendResponse(newCompletedResults)
      })
      break
    case messageActions.MARK_RESULT_INCOMPLETE:
      chrome.storage.local.get(['completedResults'], ({ completedResults = [] }) => {
        completedResults.splice(completedResults.indexOf(data), 1)
        chrome.storage.local.set({ completedResults })
        sendResponse(completedResults)
      })
      break
    case messageActions.REQUEST_CACHED_RESULTS:
      chrome.storage.local.get(
        ['cachedResults', 'completedResults'],
        ({ cachedResults, completedResults = [] }) => {
          sendResponse({ cachedResults, completedResults })
        }
      )
      break
    case messageActions.REQUEST_ENVIRONMENT:
      sendResponse(cachedEnvironment)
      break
    case messageActions.REQUEST_COMPLETED_RESULTS: // NOTE: currently unused
      chrome.storage.local.get(['completedResults'], ({ completedResults = [] }) => {
        sendResponse(completedResults)
      })
      break
    case messageActions.REQUEST_HOST:
      sendResponse(cachedHost)
      break
    case messageActions.REQUEST_PERSON_ID:
      sendResponse(cachedPersonId)
      break
    case messageActions.REQUEST_SESSION_ID:
      sendResponse(cachedSessionId)
      break
    case messageActions.SET_ENVIRONMENT:
      cachedEnvironment = data
      break
    case messageActions.SET_HOST:
      cachedHost = data
      break
    case messageActions.SET_PERSON_ID:
      cachedPersonId = data
      break
    case messageActions.SET_SESSION_ID:
      cachedSessionId = data
      break
  }

  return true
})
