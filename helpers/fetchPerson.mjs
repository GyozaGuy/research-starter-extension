// Helper function to convert a julian date into a javascript Date
function julianToDate(julianDate) {
  return new Date((julianDate - 2440587.5) * 86400000)
}

// Helper function to calculate the age
function getAge(person) {
  const birthDate = julianToDate(person.lifespanBegin)
  const deathDate = julianToDate(person.lifespanEnd)

  return parseInt(new Number((deathDate.getTime() - birthDate.getTime()) / 31536000000).toFixed(0))
}

// Helper function that returns the death year of the person
function getDeathYear(person) {
  const deathDate = julianToDate(person.lifespanEnd)
  return deathDate.getFullYear()
}

// Helper function to grab temple ordinance information
async function getTempleOrdinances(fetch, host, personId, sessionId) {
  let templeData
  try {
    const response = await fetch(
      `${host}/service/tree/tree-data/reservations/v2/person/${personId}/ordinances`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionId}`
        }
      }
    )
    templeData = await response.json()
  } catch (err) {
    console.log(err)
  }
  // Not Available can mean it was never done or it was done but not submitted on the Family Search site
  const result = templeData.ordinances.reduce((accum, ordinance) => {
    if (ordinance.statusText === 'Not Available') {
      accum.push(`${ordinance.type} - ${ordinance.statusText}`)
      return accum
    }
    return accum
  }, [])
  return result
}

// Possible reasons why a person was reported for further research
const REASONS = {
  NO_SPOUSE: 'No spouse found',
  NO_CHILDREN: 'No children found',
  ONE_CHILD: 'One child found',
  MISSING_ORDINANCES: 'Missing temple ordinances'
}

// Builds a response object of a person that might benefit from some further research
function buildResult(configuration, personId, reason, personData, missingOrdinances = []) {
  const result = {
    id: personId,
    name: personData.name,
    lifeSpan: personData.lifeSpan,
    age: getAge(personData),
    reason,
    personLink: `${configuration.host}/tree/person/details/${personId}`,
    treeLink: `${configuration.host}/tree/pedigree/landscape/${personId}`
  }

  // If the buildResult is for missingOrdinances add the missing ordinances
  if (missingOrdinances.length > 0) {
    result.missingOrdinances = missingOrdinances
    // console.log("missing", result)
    // console.log("ordinances", missingOrdinances)
  }

  if (configuration.notificationCallBack) {
    configuration.notificationCallBack('found result', result)
  }

  return result
}

/**
 * Fetches the data for the given person id, evaluates that person and recursively calls back to this function with each child
 */
export default async function fetchPerson(configuration, personId, results) {
  const {
    fetch = window.fetch,
    host,
    sessionId,
    marriageAgeThreshold,
    deathYearThreshold,
    noChildrenAgeThreshold
  } = configuration

  let personData
  try {
    // Get the persons data
    const response = await fetch(
      `${host}/service/tree/tree-data/family-members/person/${personId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionId}`
        }
      }
    )

    personData = await response.json()
  } catch (err) {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ERROR !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log(err)
  }

  let currentPersonData
  let personAge
  let personDeathYear
  let isPersonLiving = true
  let foundSpouse = false

  const childrenPromiseArray = []

  // Check the age to see if we are done with this person
  if (personData && personData.data && Array.isArray(personData.data.spouses)) {
    // Check all spouses to find the current person data and to discover if there is a spouse
    personData.data.spouses.forEach(currentSpouse => {
      ['spouse1', 'spouse2'].forEach(spouseNumber => {
        const spouse = currentSpouse[spouseNumber]

        // Check to see if this spouse represents the current person
        if (spouse && spouse.id === personId) {
          currentPersonData = spouse

          if (configuration.notificationCallBack) {
            configuration.notificationCallBack(`Searching descendants of ${currentPersonData.name}`)
          }

          // If the person not living then get the age so that we can run some logic later
          if (!spouse.isLiving) {
            personAge = getAge(spouse)
            personDeathYear = getDeathYear(spouse)
            isPersonLiving = false
          }
        } else if (spouse) {
          // This must be the spouse
          foundSpouse = true
        }
      })
    })

    // Checking Missing Temple Ordinances
    try {
      const missingTempleOrdinances = await getTempleOrdinances(fetch, host, personId, sessionId)
      // If the person is single then take out sealing to spouse ordinance
      if (!personData.data.spouses[0].relationshipId) {
        missingTempleOrdinances.splice(
          missingTempleOrdinances.indexOf('SEALING_TO_SPOUSE - Not Available'),
          1
        )
      }
      // Person's under 8 do not need Temple Ordinances
      if (missingTempleOrdinances.length > 0 && !isPersonLiving && personDeathYear <= deathYearThreshold && personAge >= 8) {
        results.push(
          buildResult(
            configuration,
            currentPersonData.id,
            REASONS.MISSING_ORDINANCES,
            currentPersonData,
            missingTempleOrdinances
          )
        )
      }
    } catch (err) {
      console.log('temple', personId, err)
    }

    // If the person's age is greater than the configured marriage threshold, and they have no spouse, then add them as a possibility
    if (
      personAge &&
      personAge >= marriageAgeThreshold &&
      !foundSpouse &&
      personDeathYear <= deathYearThreshold
    ) {
      const result = buildResult(
        configuration,
        currentPersonData.id,
        REASONS.NO_SPOUSE,
        currentPersonData
      )
      results.push(result)
    }

    // Determine the number of children from all spouses
    let numberOfChildren = personData.data.spouses.reduce((acc, current) => {
      if (current && Array.isArray(current.children)) {
        acc += current.children.length
      }
      return acc
    }, 0)

    // Now check for children
    if (Array.isArray(personData.data.spouses) && !isPersonLiving) {
      // Recursively call for every child of every spouse
      personData.data.spouses.forEach(spouse => {
        if (Array.isArray(spouse.children)) {
          spouse.children.forEach(child => {
            childrenPromiseArray.push(fetchPerson(configuration, child.id, results))
          })
        }
      })
    }

    // Wait for all of the children to finish before returning
    await Promise.all(childrenPromiseArray)

    // If there are no children and there could have been children, then add to the results
    ;[0, 1].forEach(numChildren => {
      if (
        personAge &&
        personAge >= marriageAgeThreshold &&
        foundSpouse &&
        numberOfChildren === numChildren &&
        personDeathYear <= deathYearThreshold &&
        personAge >= noChildrenAgeThreshold
      ) {
        if (numChildren === 0) {
          results.push(buildResult(configuration, personId, REASONS.NO_CHILDREN, currentPersonData))
        } else {
          results.push(buildResult(configuration, personId, REASONS.ONE_CHILD, currentPersonData))
        }
      }
    })
  }
}

if (window.module) {
  module.exports = fetchPerson
}
