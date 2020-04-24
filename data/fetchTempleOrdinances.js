const fetch = require('node-fetch')

const host = 'https://beta.familysearch.org'
const sessionId = '11f5093d-4a64-4463-9566-f5930b287874-beta'
const personId = 'KWNK-G6R'

//https://beta.familysearch.org/service/tree/tree-data/reservations/v2/person/KWNK-G6R/ordinances

async function templeTest() {
  let templeData
  try {
    // Get the temple ordinance data
    const response = await fetch(`${host}/service/tree/tree-data/reservations/v2/person/${personId}/ordinances`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionId}`
      }
    })
    templeData = await response.json()
  } catch(err) {
    console.log(err)
  }
 
  console.log(templeData.ordinances)
  const result = templeData.ordinances.filter((ordinance)=> {
    if (ordinance.statusText === 'Not Available') {
      return ordinance
    }
  })
  setTimeout(()=>{

  }, 1000)
  return result
}

console.log(templeTest())
