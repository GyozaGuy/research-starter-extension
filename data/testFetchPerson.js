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

async function test() {
  const host = 'https://beta.familysearch.org';
  const sessionId = 'c732d570-99c0-43b3-8c3f-00e59e944248-beta';

  results = [];

  const configuration = {
    fetch,
    host,
    sessionId,
    marriageAgeThreshold: 20,
    deathYearThreshold: 1980,
    notificationCallBack: notifyListeners
  };

  await fetchPerson(configuration, 'KWCB-7WT', results);

  console.log(`There were ${results.length} results found ${JSON.stringify(results, null, 2)}`);
}

test();