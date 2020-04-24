import fetchPerson from './fetchPerson.mjs'

export default async function fetchData(
  { host, sessionId, personId, marriageAgeThreshold, noChildrenAgeThreshold, deathYearThreshold },
  notificationCallBack = () => {}
) {
  // This doesn't work when running locallay and not in familysearch.org
  // const host = window.location.protocol + '/' + window.location.hostname

  // This doesn't work when running locally
  // const sessionId = readCookie('fssessionid');

  // const personId = 'KWNK-G6R';
  // const generationsToCrawlUp = 4

  // Opportunities to do further research on persons in this array
  let results = []

  const configuration = {
    fetch, // If not provided then window.fetch will be used
    host, // Host to call (ie https://beta.familysearch.org)
    sessionId, // Session id that goes along with the host above (ie beta.familysearch.org will expect a sessionId from beta)
    marriageAgeThreshold, // If the person is greater than or equal to this value, then not married could be reported
    noChildrenAgeThreshold, // If the age of the person is greater than or equal to this value, then no children will be reported
    deathYearThreshold, // If the person dies before this year, then results will be reported
    notificationCallBack // Optional callback that will be called when a person is being searched and when results are found
  }

  // Start the recursive process
  await fetchPerson(configuration, personId, results)

  // Show the results
  // console.log(`There were ${results.length} results found ${JSON.stringify(results, null, 2)}`)

  return results
}
