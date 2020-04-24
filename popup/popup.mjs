import messageActions from '../messageActions.mjs'
import fetchData from '../helpers/fetchData.mjs'

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

let cachedHost = ''

function renderResults(results) {
  while (resultsContainer.lastChild) {
    resultsContainer.lastChild.remove()
  }

  results.forEach(result => {
    const row = `
      <div class="result-row">
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

form.addEventListener('submit', async event => {
  event.preventDefault()

  const data = [...form.elements].reduce((configObj, el) => ({ ...configObj, [el.id]: el.value }))
  delete data.environment // We don't need this for now
  data.host = cachedHost
  searchCountContainer.hidden = false
  let processedCount = 0
  let resultCount = 0
  const results = await fetchData(data, (_, result) => {
    if (result) {
      resultCountBox.textContent = ++resultCount
    } else {
      processedCountBox.textContent = ++processedCount
    }
  })

  renderResults(results)
})

toggleAdvanced.onclick = ({ target: { textContent } }) => {
  toggleAdvanced.textContent =
    textContent.trim() === 'Show Advanced' ? 'Hide Advanced' : 'Show Advanced'
  advanced.hidden = toggleAdvanced.textContent === 'Show Advanced'
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
