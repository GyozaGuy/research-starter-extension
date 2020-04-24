const fetch = require('node-fetch');
const fetchPerson = require('./fetchPerson')

// This might be used to update the UI as the search progresses
function notifyListeners(message, result) {
  if (result) {
    console.log(`${message} for ${result.name}`);
  } else {
    console.log(message);
  }
}

async function testFetchPerson() {
  const host = 'https://beta.familysearch.org';
  const sessionId = '7e19b054-cca2-4a49-bc4b-85a27809ff19-beta';
  const personId = 'KWNK-G6R';
  // const personId = 'KWJK-YBK'
  const generationsToCrawlUp = 4;

  // Opportunities to do further research on persons in this array
  results = [];

  const configuration = {
    fetch, // If not provided then window.fetch will be used
    host, // Host to call (ie https://beta.familysearch.org)
    sessionId, // Session id that goes along with the host above (ie beta.familysearch.org will expect a sessionId from beta)
    marriageAgeThreshold: 20, // If the person is greater than or equal to this value, then not married could be reported
    noChildrenAgeThreshold: 30, // If the age of the person is greater than or equal to this value, then no children will be reported
    deathYearThreshold: 1980,  // If the person dies before this year, then results will be reported
    notificationCallBack: notifyListeners // Optional callback that will be called when a person is being searched and when results are found
  };

  // Start the recursive process
  await fetchPerson(configuration, personId, results);

  // Show the results
  console.log(`There were ${results.length} results found ${JSON.stringify(results, null, 2)}`);
}

testFetchPerson();
