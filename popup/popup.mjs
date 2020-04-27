import messageActions from '../messageActions.mjs'
import fetchData from '../helpers/fetchData.mjs'
import sortObjectsByProperty from '../helpers/sortObjectsByProperty.mjs'

const form = document.querySelector('#inputForm')
const envSelector = document.querySelector('#environment')
const sessionIdField = document.querySelector('#sessionId')
const personIdField = document.querySelector('#personId')
const toggleAdvanced = document.querySelector('#toggleAdvanced')
const advanced = document.querySelector('#advanced')
const searchCountContainer = document.querySelector('#searchCountContainer')
const processedCountBox = document.querySelector('#processedCountBox')
const resultCountBox = document.querySelector('#resultCountBox')
const resultsContainer = document.querySelector('#results')

let cachedCompletedResults = []
let cachedHost = ''

function clearResults() {
  while (resultsContainer.lastChild) {
    resultsContainer.lastChild.remove()
  }
}

function renderResults(results) {
  clearResults()
  const sortedResults = sortObjectsByProperty(results, 'name')

  sortedResults.forEach(result => {
    const row = `
      <div class="result-row">
        <input id="${result.id}-${result.reason.replace(/\s/g, '_')}" type="checkbox">
        <a href="${result.personLink}" target="_blank">
          ${result.name} (${result.lifeSpan})
        </a>
        <span>Reason: ${result.reason}</span>
      </div>
    `
    const span = document.createElement('span')
    span.innerHTML = row
    resultsContainer.appendChild(span)
  })
}

function markCompletedResults(completedResults) {
  completedResults.forEach(result => {
    const checkbox = document.querySelector(`#${result}`)

    if (checkbox) {
      checkbox.checked = true
      checkbox.parentElement.setAttribute('completed', '')
    }
  })
}

form.addEventListener('submit', async event => {
  event.preventDefault()

  const data = [...form.elements].reduce((configObj, el) => ({ ...configObj, [el.id]: el.value }))
  delete data.environment // We don't need this for now
  data.host = cachedHost

  clearResults()
  resultsContainer.innerHTML = '<p>Searching...</p>'

  chrome.runtime.sendMessage({ action: messageActions.CLEAR_RESULTS_CACHE })
  searchCountContainer.hidden = false
  let processedCount = 0
  let resultCount = 0

  processedCountBox.textContent = '0'
  resultCountBox.textContent = '0'

  const results = await fetchData(data, (_, result) => {
    if (result) {
      resultCountBox.textContent = ++resultCount
    } else {
      processedCountBox.textContent = ++processedCount
    }
  })

  chrome.runtime.sendMessage({
    action: messageActions.CACHE_RESULTS,
    data: {
      processedCount,
      resultCount,
      results
    }
  })

  renderResults(results)
  markCompletedResults(cachedCompletedResults)
})

toggleAdvanced.onclick = ({ target: { textContent } }) => {
  toggleAdvanced.textContent =
    textContent.trim() === 'Show Advanced' ? 'Hide Advanced' : 'Show Advanced'
  advanced.hidden = toggleAdvanced.textContent === 'Show Advanced'
}

resultsContainer.addEventListener('click', ({ target }) => {
  const { checked, id, type } = target

  if (type === 'checkbox') {
    if (checked) {
      chrome.runtime.sendMessage(
        {
          action: messageActions.MARK_RESULT_COMPLETE,
          data: id
        },
        completedResults => {
          cachedCompletedResults = completedResults
        }
      )
      target.parentElement.setAttribute('completed', '')
    } else {
      chrome.runtime.sendMessage(
        {
          action: messageActions.MARK_RESULT_INCOMPLETE,
          data: id
        },
        completedResults => {
          cachedCompletedResults = completedResults
        }
      )
      target.parentElement.removeAttribute('completed')
    }
  }
})

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

// Request cached results
chrome.runtime.sendMessage(
  { action: messageActions.REQUEST_CACHED_RESULTS },
  ({ cachedResults, completedResults }) => {
    if (
      cachedResults &&
      Object.keys(cachedResults).length > 0 &&
      Array.isArray(cachedResults.results) &&
      cachedResults.results.length > 0
    ) {
      renderResults(cachedResults.results)
      markCompletedResults(completedResults)

      cachedCompletedResults = completedResults
      processedCountBox.textContent = cachedResults.processedCount
      resultCountBox.textContent = cachedResults.resultCount
      searchCountContainer.hidden = false
    }
  }
)
