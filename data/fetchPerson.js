const fetch = require('node-fetch');

function julianToDate(julianDate) {
  return new Date((julianDate - 2440587.5) * 86400000);
}

function getAge(person) {
  const birthDate = julianToDate(person.lifespanBegin);
  const deathDate = julianToDate(person.lifespanEnd);

  return new Number((deathDate.getTime() - birthDate.getTime()) / 31536000000).toFixed(0);
}

function getDeathYear(person) {
  const deathDate = julianToDate(person.lifespanEnd);
  return deathDate.getFullYear();
}

const REASONS = {
  NO_SPOUSE: 'No spouse found',
  NO_CHILDREN: 'No children found',
  ONE_CHILD: 'One child found'
};

// Builds a response object of a person that might benefit from some further research
function buildResult(configuration, personId, reasonKey, personData) {
  const result = {
    id: personId,
    name: personData.name,
    lifeSpan: personData.lifeSpan,
    age: getAge(personData),
    reasonText: REASONS[reasonKey],
    reasonKey,
    personLink: `${configuration.host}/tree/person/details/${personId}`,
    treeLink: `${configuration.host}/tree/pedigree/landscape/${personId}`,
  };

  if (configuration.notificationCallBack) {
    configuration.notificationCallBack(`found result`, result);
  }

  return result;
}

// // This might be used to update the UI as the search progresses
// function notifyListeners(message, result) {
//   if (result) {
//     console.log(`${message} for ${result.name}`);
//   } else {
//     console.log(message);
//   }
// }

/**
 * Fetches the data for the given person id, evaluates that person and recursively calls back to this function with each child
 */
async function fetchPerson(configuration, personId, results) {
  const { host, sessionId, marriageAgeThreshold, deathYearThreshold } = configuration;

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
  let personDeathYear;
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

          if (configuration.notificationCallBack) {
            configuration.notificationCallBack(`Searching descendants of ${currentPersonData.name}`);
          }

          // If the person not living then get the age so that we can run some logic later
          if (!spouse.isLiving) {
            personAge = getAge(spouse);
            personDeathYear = getDeathYear(spouse);
            isPersonLiving = false;
          }
        } else {
          // This must be the spouse
          foundSpouse = true;
        }
      });
    })

    // If the person's age is greater than the configured marriage threshold, and they have no spouse, then add them as a possibility
    if (personAge && personAge >= 20 && !foundSpouse) {
      const result = buildResult(configuration, spouse.id, REASONS.NO_SPOUSE, currentPersonData);
      results.push(result);
    }

    // Determine the number of children from all spouses
    let numberOfChildren = personData.data.spouses.reduce((acc, current) => {
      if (current && Array.isArray(current.children)) {
        acc += current.children.length;
      }
      return acc;
    }, 0);

    // Now check for children
    if (Array.isArray(personData.data.spouses) && !isPersonLiving) {
      // Recursively call for every child of every spouse
      personData.data.spouses.forEach(spouse => {
        if (Array.isArray(spouse.children)){
          spouse.children.forEach(child => {
            childrenPromiseArray.push(fetchPerson(configuration, child.id, results));
          })
        }
      });
    }

    // Wait for all of the children to finish before returning
    await Promise.all(childrenPromiseArray);

    // If there are no children and there could have been children, then add to the results
    [0, 1].forEach(numChildren => {
      if (personAge && personAge >= marriageAgeThreshold && foundSpouse && numberOfChildren === numChildren && personDeathYear <= deathYearThreshold) {
        results.push(buildResult(configuration, personId, REASONS.NO_CHILDREN, currentPersonData));
      }
    });
  }
}

if (module) {
  module.exports = fetchPerson;
}