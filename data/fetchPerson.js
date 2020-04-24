// Helper function to convert a julian date into a javascript Date
function julianToDate(julianDate) {
  return new Date((julianDate - 2440587.5) * 86400000);
}

// Helper function to calculate the age
function getAge(person) {
  const birthDate = julianToDate(person.lifespanBegin);
  const deathDate = julianToDate(person.lifespanEnd);

  return parseInt(new Number((deathDate.getTime() - birthDate.getTime()) / 31536000000).toFixed(0));
}

// Helper function that returns the death year of the person
function getDeathYear(person) {
  const deathDate = julianToDate(person.lifespanEnd);
  return deathDate.getFullYear();
}

// Possible reasons why a person was reported for further research
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

/**
 * Fetches the data for the given person id, evaluates that person and recursively calls back to this function with each child
 */
async function fetchPerson(configuration, personId, results) {
  const { fetch = window.fetch, host, sessionId, marriageAgeThreshold, deathYearThreshold, noChildrenAgeThreshold } = configuration;

  let personData;
  try {
    // Get the persons data
    const response = await fetch(`${host}/service/tree/tree-data/family-members/person/${personId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionId}`
      }
    });

    personData = await response.json();
  } catch (err) {
    console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ERROR !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    console.log(err);
  }

  let currentPersonData;
  let personAge;
  let personDeathYear;
  let isPersonLiving = true;
  let foundSpouse = false;

  const childrenPromiseArray = [];

  // Check the age to see if we are done with this person
  if (personData && personData.data && Array.isArray(personData.data.spouses)) {
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
        } else if(spouse) {
          // This must be the spouse
          foundSpouse = true;
        }
      });
    })

    // If the person's age is greater than the configured marriage threshold, and they have no spouse, then add them as a possibility
    if (personAge && personAge >= marriageAgeThreshold && !foundSpouse && personDeathYear <= deathYearThreshold) {
      const result = buildResult(configuration, currentPersonData.id, REASONS.NO_SPOUSE, currentPersonData);
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
      if (personAge && personAge >= marriageAgeThreshold && foundSpouse && numberOfChildren === numChildren && personDeathYear <= deathYearThreshold && personAge >= noChildrenAgeThreshold) {
        if (numChildren === 0) {
          results.push(buildResult(configuration, personId, REASONS.NO_CHILDREN, currentPersonData));
        } else {
          results.push(buildResult(configuration, personId, REASONS.ONE_CHILD, currentPersonData));
        }
      }
    });
  }
}

if (module) {
  module.exports = fetchPerson;
}
