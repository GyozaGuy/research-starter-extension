const fetch = require('node-fetch');
const fetchPerson = require('./fetchPerson')

async function test() {
  const host = 'https://beta.familysearch.org';
  const sessionId = 'c732d570-99c0-43b3-8c3f-00e59e944248-beta';

  results = [];

  const configuration = {
    fetch,
    host,
    sessionId,
    marriageAgeThreshold: 20,
    deathYearThreshold: 1980
  };

  await fetchPerson(configuration, 'KWCB-7WT', results);

  console.log(`There were ${results.length} results found ${JSON.stringify(results, null, 2)}`);
}

test();