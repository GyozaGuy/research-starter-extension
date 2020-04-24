const fetch = require('node-fetch')

const host = 'https://beta.familysearch.org'
const sessionId = '7e19b054-cca2-4a49-bc4b-85a27809ff19-beta'
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
    } catch (err) {
        console.log(templeData, err)
    }

    // console.log('data', templeData.ordinances)
    const result = templeData.ordinances.reduce((accum, ordinance) => {
        if (ordinance.statusText === 'Not Available') {
            accum.push(`${ordinance.type} - ${ordinance.statusText}`)
            return accum
        }
        return accum
    }, [])
    console.log(result)
    return result
}

templeTest()
