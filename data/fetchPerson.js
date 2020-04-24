const fetch = require('node-fetch');

function julianToDate(julianDate) {
  return new Date((julianDate - 2440587.5) * 86400000);
}

function getAge(person) {
  const birthDate = julianToDate(person.lifespanBegin);
  const deathDate = julianToDate(person.lifespanEnd);

  return new Number((deathDate.getTime() - birthDate.getTime()) / 31536000000).toFixed(0);
}

const REASONS = {
  NO_SPOUSE: 'No spouse found',
  NO_CHILDREN: 'No children found',
  ONE_CHILD: 'One child found'
};

// Builds a response object of a person that might benefit from some further research
function buildResult(host, personId, reasonKey, personData) {
  return {
    id: personId,
    name: personData.name,
    lifeSpan: personData.lifeSpan,
    age: getAge(personData),
    reasonText: REASONS[reasonKey],
    reasonKey,
    personLink: `${host}/tree/person/details/${personId}`,
    treeLink: `${host}/tree/pedigree/landscape/${personId}`,
  };
}

async function fetchPerson(host, sessionId, personId, results) {
  console.log(`$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ fetchPerson for ${personId} $$$$$$$$$$$$$$$$$$$$$$$$$$`);

  // Get the persons data
  const response = await fetch(`${host}/service/tree/tree-data/family-members/person/${personId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${sessionId}`
    }
  });

  const personData = await response.json();

  let currentPersonData;
  let personAge;
  let isPersonLiving = true;
  let foundSpouse = false;

  const childrenPromiseArray = [];

  // Check the age to see if we are done with this person
  if (personData.data && Array.isArray(personData.data.spouses)) {
    // Check all spouses to find the current person data and to discover if there is a spouse
    personData.data.spouses.forEach(currentSpouse => {
      ['spouse1', 'spouse2'].forEach(spouseNumber => {
        const spouse = currentSpouse[spouseNumber];

        // Check to see if this spouse represents the current person
        if (spouse && spouse.id === personId) {
          currentPersonData = spouse;

          // If the person not living then get the age so that we can run some logic later
          if (!spouse.isLiving) {
            personAge = getAge(spouse);
          } else {
            // This person is living, so stop processing of this person
            isPersonLiving = false;
          }
        } else {
          // This must be the spouse
          foundSpouse = true;
        }
      });
    })

    // If the person's age is greater than 20, and they have no spouse, then add them as a possibility
    if (personAge && personAge >= 20 && !foundSpouse) {
      results.push(buildResult(host, spouse.id, REASONS.NO_SPOUSE, currentPersonData));
    }

    // Determine the number of children from all spouses
    let numberOfChildren = personData.data.spouses.reduce((acc, current) => {
      if (current && Array.isArray(current.children)) {
        acc += current.children.length;
      }
      return acc;
    }, 0);

    // Now check for children
    if (Array.isArray(personData.data.spouses) && isPersonLiving) {
      // Recursively call for every child of every spouse
      personData.data.spouses.forEach(spouse => {
        if (Array.isArray(spouse.children)){
          spouse.children.forEach(child => {

            // TODO - collect all and await
            childrenPromiseArray.push(fetchPerson(host, sessionId, child.id, results));
          })
        }
      });
    }

    // Wait for the children to finish
    await Promise.all(childrenPromiseArray);

    // If there are no children and there could have been children, then add to the results
    if (personAge && personAge >= 20 && foundSpouse && numberOfChildren <= 0) {
      results.push(buildResult(host, personId, REASONS.NO_CHILDREN, currentPersonData));
    }

    if (personAge && personAge >= 20 && foundSpouse && numberOfChildren === 1) {
      results.push(buildResult(host, personId, REASONS.ONE_CHILD, currentPersonData));
    }
  }
}

async function test() {
  const environment = 'https://beta.familysearch.org';
  const sessionId = '55e52809-ad50-43f3-a0ca-4971892258e5-beta';

  results = [];
  await fetchPerson(environment, sessionId, 'KWCB-7WT', results);

   console.log(`There were ${results.length} results found ${JSON.stringify(results, null, 2)}`);
}

test();
