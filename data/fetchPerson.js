const fetch = require('node-fetch');

function julianToDate(julianDate) {
  return new Date((julianDate - 2440587.5) * 86400000);
}

function getAge(person) {
  const birthDate = julianToDate(person.lifespanBegin);
  const deathDate = julianToDate(person.lifespanEnd);

  return new Number((deathDate.getTime() - birthDate.getTime()) / 31536000000).toFixed(0);
}

async function fetchPerson(host, sessionId, personId, results) {
  // Get the persons data
  const response = await fetch(`${host}/service/tree/tree-data/family-members/person/${personId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${sessionId}`
    }
  });

  const personData = await response.json();

  console.log(JSON.stringify(personData, null, 2));

  let personAge;
  let personShouldContinue = true;
  let foundSpouse = false;

  // Check the age to see if we are done with this person
  if (personData.data && Array.isArray(personData.data.spouses)) {
    ['spouse1', 'spouse2'].forEach(spouseNumber => {
      const spouse = personData.data.spouses[0][spouseNumber];
      if (spouse && spouse.id === personId) {
        if (!spouse.isLiving) {
          // This is the person that we are searching for. Check to see if we should continue
          personAge = getAge(spouse);
          console.log(`spouse age=${personAge}`);
        } else {
          // This person is living, so stop processing of this person
          console.log('person is living - so stopping');
          personShouldContinue = false;
        }
      } else {
        // This must be the spouse
        foundSpouse = true;
      }
    });

    // If the person's age is greater than 20, and they have no spouse, then add them as a possibility
    if (personAge && personAge >= 20 && !foundSpouse) {
      results.push({
        id: spouse.id,
        reason: 'No spouse'
      });
    }

    // Now check for children


  }

  // Evaluate this person to see if we found match - if so, add to results

  // Look for spouses and recursively call this function again

  // Look for children and recursively call this function again
}

const environment = 'https://beta.familysearch.org';
const sessionId = '1143a7f8-3d78-473b-8867-33758f5660d7-beta';

results = [];
fetchPerson(environment, sessionId, 'KWCT-N2B', results);

