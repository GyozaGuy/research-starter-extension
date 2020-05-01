import fetchPerson from './fetchPerson.mjs'

export default async function fetchData(
  { host, sessionId, personId, marriageAgeThreshold, noChildrenAgeThreshold, deathYearThreshold },
  notificationCallBack = () => {}
) {
  // Array of persons that might benefit from further research
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

  const counts = {
    requestCount: 0,
    resultCount: 0
  };

  // Start the recursive process
  await fetchPerson(configuration, personId, results, counts)

  return results
}
