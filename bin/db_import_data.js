/**
 * db_import_data.js
 *
 * reads the specified Excel workbook and imports the all data into the RSSMShares SQLite database.
 *
 * Note: all existing data will be purged from the database before loading!
 */



const excel = require('excel')
const RSSMShares = require('../lib/db.rssm.shares').RSSMShares
const excel_to_date_string = require('../lib/app.helpers.js').excel_to_date_string
const parse_share_no = require('../lib/app.helpers').parse_share_no



const RSSMDBPATH = 'db/agregRSSM_test.db'         // path to sqlite database
const WBPATH = 'docs/Aktien 2018.02.27.xlsx'        // path to Excel document to read
const CERTIF_SHEET = 2                              // worksheet containing Certificates & Person data
const JOUNRAL_SHEET = 1                             // worksheet containing Journal

const rssmShares = new RSSMShares(RSSMDBPATH)



// run the whole import!
import_data().catch(err => {
     console.log(err)
})




/**
 *
 * @returns {Promise<void>}
 */
async function import_data() {

    console.log('**********************************************************')
    console.log('****   IMPORTING AG RSSM SHARE REGISTER TO DATABASE   ****')
    console.log('**********************************************************')
    console.log('')

    // purge database
    console.log('purging database...')
    console.log( await rssmShares.purgeDatabase() )
    console.log('')

    // generate 1170 shares
    const share_ids = await generateShares()
    console.log('')


    // read all data files and wait until we get the raw sheets back
    const sheets = await readFiles();
    console.log(' file reading successful')
    console.log('')


    // parse excel sheet data into data objects
    const [families,persons, certificates] = extractShares(sheets.shares)
    const journal = extractJournal(sheets.journal)
    console.log('  parsed file data successfully')
    console.log('')


    // running database inserts
    const family_ids = await insertFamilies(families)
    console.log(`  inserted ${Object.keys(family_ids).length} family records`)

    const person_ids = await insertPersons(persons, family_ids)
    console.log(`  inserted ${Object.keys(person_ids).length} person records`)

    const journal_ids = await insertJournal(journal, person_ids)
    console.log(`  inserted ${Object.keys(journal_ids).length} journal records`)

    const share_junk_ids = await insertShareJunks(journal, share_ids, journal_ids)
    console.log(`  inserted ${Object.keys(share_junk_ids).length} share_junk records`)

    const cert_ids =  await insertCertificates(certificates, person_ids, share_ids, journal_ids)
    console.log(`  inserted ${Object.keys(cert_ids).length} certificate records`)
    console.log('')

    // update shares to link them to current holders
    await updateShareHolders(certificates, share_ids, person_ids)
    console.log(`  updated all shares`)
    console.log('')

    console.log('')
    console.log('**********************************************************')
    console.log('****   IMPORT COMPLETE                                ****')
    console.log('**********************************************************')


}


/**
 * reads raw data from Excel Sheets specified in WBPATH, CERTIF_SHEET and JOURNAL_SHEET
 * variables. Data is returned as an  array reference holding both sheets as two-dimensional arrays.
 * @returns {Promise}  promise resolving to array holding data sheets
 */
function readFiles() {
    const data_sheets = []

    return new Promise((resolve, reject) => {
        data_sheets.push( readExcelWorkbook(WBPATH, CERTIF_SHEET))
        data_sheets.push( readExcelWorkbook(WBPATH, JOUNRAL_SHEET))

        Promise.all(data_sheets).then(sheets => {

            resolve({
                shares : sheets[0],
                journal : sheets[1]
            })

        })

    })
}


/**
 * updates all share records with their current share holders
 * @param {Object} certificates
 * @param share_ids
 * @param person_ids
 * @returns {Promise<any>}
 */
function updateShareHolders(certificates, share_ids, person_ids) {

    console.log('updating shares with their current share holders...')

    return new Promise(resolve => {

        const update_promises = []

        Object.keys(certificates).forEach(cert_code => {

            // get certificate object
            const cert = certificates[cert_code]

            // prepare update object
            const update = {
                person_id : cert.person_id
            }

            update_promises.push( rssmShares.updateRecord('share', cert.share_id, update) )

        })


        // when all update promises resolve, resolve the function promise
        Promise.all(update_promises).then(responses => {

            const share_ids = {}
            // responses.forEach(response => {
            //
            //     // build unique cert_code from share_id and level
            //     let cert_code = response.params[6] + response.params[0]
            //     share_ids[cert_code] = response.lastID
            //
            // })

            resolve('update successful')

        }).catch(error => {
            console.log('ERROR', error)
        })


    })

}


/**
 * analyse share list from journal entries and generate share_chunk records
 * @param journals
 * @param share_ids
 * @param journal_ids
 * @returns {Promise<any>}
 */
function insertShareJunks(journals, share_ids, journal_ids ) {

    console.log('inserting SHARE_CHUNK records...')

    return new Promise(resolve => {

        const insert_promises = []

        Object.keys(journals).forEach(journal_no => {

            // prepare array of shares from journal
            const share_list = journals[journal_no].shares
            const shares = parse_share_no(share_list)


            // iterate over shares
            shares.forEach(share_no => {

                // build object to insert
                const share_chunk = {
                    share_id   : share_ids[share_no],
                    journal_id : journal_ids[journal_no]
                }


                // insert the share_chunk to database
                insert_promises.push( rssmShares.insertShareChunk(share_chunk) )

            })
        })

        Promise.all(insert_promises).then(responses => {

            // build object with journal_no and journal_id to be returned
            const chunk_ids = {}
            responses.forEach(response => {

                let id = response.params[0] + '_' + response.params[1]
                chunk_ids[id] = response.lastID
            })

            resolve(chunk_ids)

        }).catch(error => {
            console.log('ERROR', error)
        })
    })
}


/**
 * inserts journal entries from journal data
 * @param journal_data
 * @param person_ids
 * @returns {Promise<any>}
 */
function insertJournal(journal_data, person_ids) {

    console.log('inserting JOURNAL records...')

    return new Promise(resolve => {

        const journal_nos = Object.keys(journal_data)  // get all journal numbers
        const insert_promises = []

        journal_nos.forEach(journal_no => {

            // prepare journal object to insert
            const journal = journal_data[journal_no]

            // link the journal to the person
            journal.person_id = person_ids[journal.a_code]


            // insert the journal to database
            insert_promises.push( rssmShares.insertJournal(journal) )

        })

        Promise.all(insert_promises).then(values => {

            // build object with journal_no and journal_id to be returned
            const journal_ids = {}
            values.forEach(id => {

                let journal_no = id.params[0]
                journal_ids[journal_no] = id.lastID
            })

            resolve(journal_ids)
        })
    })


}

/**
 * inserts family entries
 * @param families
 * @returns {Promise<any>}
 */
function insertFamilies(families) {

    console.log('inserting FAMILIY records...')

    return new Promise((resolve, reject) => {

        const f_codes = Object.keys(families)  // get all f_code keys
        const insert_promises = []


        f_codes.forEach(f_code => {
            // request inserts for family and store the returned promise in the array
            insert_promises.push( rssmShares.insertFamily(families[f_code]) )
        })

        // when all insert promises resolve, resolve the function promise
        Promise.all(insert_promises).then(values => {

            // build object with f_code and family pks to be returned
            const family_ids = {}
            values.forEach(id => {

                let f_code = id.params[0]
                family_ids[f_code] = id.lastID
                families[f_code].family_id = id.lastID
            })

            resolve(family_ids)
        })

    })
}

/**
 * insert person entries
 * @param persons
 * @param family_ids
 * @returns {Promise<any>}
 */
function insertPersons(persons, family_ids) {

    console.log('inserting PERSON records...')

    return new Promise((resolve, reject) => {

        const insert_promises = []      // array to store promises from inserts

        // iterate over persons
        Object.keys(persons).forEach(a_code => {

            // get the persons f_code
            const f_code = persons[a_code].f_code

            // save the family_id in this person
            persons[a_code].family_id = family_ids[f_code]

            // remove the f_code from the person object, since we don't want to insert this
            delete persons[a_code].f_code

            // request inserts for family and store the returned promise in the array
            insert_promises.push( rssmShares.insertPerson(persons[a_code]) )


        })


        // when all insert promises resolve, resolve the function promise
        Promise.all(insert_promises).then(values => {

            const person_ids = {}
            values.forEach(id => {

                let a_code = id.params[0]
                person_ids[a_code] = id.lastID
                persons[a_code].person_id = id.lastID
            })

            resolve(person_ids)

        })

    })
}


/**
 * insert certificate entries and links them to shares, persons and journal entries
 * @param certificates
 * @param person_ids
 * @param share_ids
 * @param journal_ids
 * @returns {Promise<any>}
 */
function insertCertificates(certificates, person_ids, share_ids, journal_ids) {

    console.log('inserting CERTIFICATE records...')


    return new Promise((resolve, reject) => {

        // prepare a promises array
        const insert_promises = []

        Object.keys(certificates).forEach(cert_code => {

            //console.log(cert_code)

            // prepare object for insert
            const cert = certificates[cert_code]

            //translate a_code to peron_id
            cert.person_id = person_ids[cert.a_code]
            delete cert.a_code

            // translate share_no to share_id
            const share_no = cert.share_no + '' // this should be a String
            cert.share_id = share_ids[share_no]
            delete cert.share_no

            // translate journal_no to journal_id
            if(cert.journal_no) {
                cert.journal_id = journal_ids[cert.journal_no]
            }
            delete cert.journal_no


            insert_promises.push( rssmShares.insertCertificate(cert) )

        })

        // when all insert promises resolve, resolve the function promise
        Promise.all(insert_promises).then(responses => {

            const cert_ids = {}
            responses.forEach(response => {

                // build unique cert_code from share_id and level
                let cert_code = response.params[6] + response.params[0]
                cert_ids[cert_code] = response.lastID

            })

            resolve(cert_ids)

        }).catch(error => {
            console.log('ERROR', error)
        })


    })


}


/**
 * extracts journal objects from journal raw data
 * @param rawdata
 * @returns {{}}
 */
function extractJournal(rawdata) {
    const journal = {}
    const headers = getSheetHeaders('journal')
    let line = 0

    console.log(`processing journal raw data on ${rawdata.length} lines...`)

    rawdata.forEach((row) => {
        line++;


        // skip first line (headers)
        if( line === 1) {
            console.log("  skipping row 1: header row");
            return;
        }

        // get journal code
        const journal_no = row[headers.journal_no];


        // convert journal date to date string from Excel date number
        const journal_date = excel_to_date_string( row[headers.journal_date] )

        // convert journal date to date string from Excel date number
        const booking_date = excel_to_date_string( row[headers.booking_date] )

        // convert vr_protocol date date to date string from Excel date number
        const vr_protocol_date = excel_to_date_string( row[headers.vr_protocol_date] )

        // get a_code
        let a_code = row[headers.a_code];

        // make a_code from name in case no a_code is available
        if(!a_code) {
            a_code = row[headers.name].toUpperCase()
        }

        // handle empty lines
        if( !journal_no || !journal_date ) {
            console.log(`  skipping row ${line}: no journal no or date`);
            return;
        }


        // store data in structures
        journal[journal_no] = {
            journal_no       : journal_no,
            a_code           : a_code,
            journal_date     : journal_date,
            name             : row[headers.name],
            checked          : row[headers.checked],
            shares           : row[headers.shares],
            transaction_type : row[headers.transaction_type],
            action           : row[headers.action],
            sold             : row[headers.sold],
            repurchased      : row[headers.repurchased],
            share_stock      : row[headers.share_stock],
            value_in         : row[headers.value_in],
            value_out        : row[headers.value_out],
            win              : row[headers.win],
            balance_account_1130 : row[headers.balance_account_1130],
            balance_bcl      : row[headers.balance_bcl],
            booking_no       : row[headers.booking_no],
            booking_date     : booking_date,
            vr_protocol_date : vr_protocol_date
        }



    })

    return journal

}


/**
 * extracts share, person and family entries from share raw data
 * @param rawdata
 * @returns {*[]}
 */
function extractShares(rawdata) {
    const persons = {}
    const families = {}
    const certificates = {}
    const headers = getSheetHeaders('shares')
    let line = 0;

    console.log(`processing share raw data on ${rawdata.length} lines...`)


    rawdata.forEach((row) => {
        line++;

        // skip first line (headers)
        if( line === 1) {
            console.log("  skipping row 1: header row");
            return;
        }


        // get f_code
        let f_code = row[headers.f_code];

        // make a_code from name in case no a_code is available
        if(!f_code) {
            f_code = row[headers.family].toUpperCase()
        }

        // if f_code is already known, make sure family matches
        if(families[f_code]) {
            if(families[f_code].name !== row[headers.family]) {
                new Error (`Error (line ${line}): f_code ${f_code} found with wrong family name: '${row[headers.family]}' != '${families[f_code].name}'`)
                //console.log( `Error (line ${line}): f_code ${f_code} found with wrong family name: '${row[headers.family]}' != '${families[f_code].name}'`)
            }
        }


        // get a_code
        let a_code = row[headers.a_code];

        // make a_code from name in case no a_code is available
        if(!a_code) {
            a_code = row[headers.name].toUpperCase()
        }

        // if a_code is already known, make sure name matches
        if(persons[a_code]) {
            if(persons[a_code].name !== row[headers.name]) {
                new Error (`Error (line ${line}): a_code ${a_code} found with wrong name: '${row[headers.name]}' != '${persons[a_code].name}'`)
                //console.log( `Error (line ${line}): a_code ${a_code} found with wrong name: '${row[headers.name]}' != '${persons[a_code].name}'`)
            }
        }


        // handle empty lines
        if( !a_code && !f_code ) {
            console.log(`  skipping row ${line}: no names or f/a_code, f_code`);
            return;
        }


        // get post code from city
        let city = row[headers.city]
        // starts with a 1 or 2 capital letters (optional)
        // followed by one - or space (optional)
        // followed by a 4 or 5 digit number
        let post_code = city.match(/[A-Z]{0,2}?[- ]?[0-9]{4,5}/g)
        if(post_code) {
            post_code = post_code[0]
        }


        // remove post code part from city
        city = city.replace(post_code, '')
        city = city.trim()


        // handle '0' or '-' instead of blank in certain fields
        let salutation = row[headers.salutation]
        if(salutation === '0') { salutation = '' }

        let first_name = row[headers.first_name]
        if(first_name === '0') { first_name = '' }


        let a_first_name = row[headers.sh_first_name]
        if(a_first_name === '-') { a_first_name = '' }


        // create a certificate id code
        let cert_code = row[headers.share_no] + row[headers.level]

        // convert transaction date to date string from Excel date number
        const transaction_date = excel_to_date_string( row[headers.transaction] )


        // store data in structures
        families[f_code] = {
            f_code : f_code,
            name   : row[headers.family]
        }

        persons[a_code] = {
            a_code       : a_code,
            f_code       : f_code,
            name         : row[headers.name],
            first_name   : first_name,
            address      : row[headers.address],
            city         : city,
            salutation   : salutation,
            status       : row[headers.status],
            post_code    : post_code
        }

        certificates[cert_code] = {
            share_no         : row[headers.share_no],
            level            : row[headers.level],
            a_code           : a_code,
            journal_no       : row[headers.journal],
            transaction_date : transaction_date,
            status           : row[headers.status],
            a_name           : row[headers.sh_name],
            a_first_name     : a_first_name
        }
    })


    return[families, persons, certificates]

}



/**
 * generate 1170 database share records
 */
function generateShares() {


    // retrieve information on share series
    const shareSeries = getShareSeries()

    return new Promise((resolve) => {

        const insert_promises = []

        // iterate over share series
        shareSeries.forEach(serie => {

            console.log(`generating shares of series : (${serie.emission}) ${serie.start_no} - ${serie.end_no} `);
            for(let i=serie.start_no; i<=serie.end_no; i++) {

                // form share data object
                const shareData = {
                    share_no      : i,
                    type          : 'Stammaktie',
                    emission_date : serie.emission,
                    value         : 1000
                }

                // insert share object to database
                insert_promises.push( rssmShares.insertShare(shareData) )

            }
        })


        Promise.all(insert_promises).then(values => {

            // create object with share_no : share_id pairs
            const share_ids = {}
            values.forEach(id => {
                let share_no = id.params[0]
                share_ids[share_no] = id.lastID
            })

            // resolve promise with share ids
            resolve(share_ids)
        })

    })


}



/**
 * reads data from Excel specified worksheet
 * @param {String} file   file path to read
 * @param {int} sheetno sheet number of excel workbook to read (1-based)
 * @returns {Promise}  returning array or error message
 */
function readExcelWorkbook(file, sheetno) {

    console.log(`reading sheet ${sheetno} from file ${file} ...`)

    return new Promise((resolve, reject) => {
        excel(file, sheetno, function(err, data) {
            if(err) reject(new Error(err))
            console.log(` done reading ${data.length * data[0].length} cells from sheet ${sheetno} `)
            resolve(data)
        }) 
    })

}



/**
 * @returns {Array}  array of objects containing information on share series
 */
function getShareSeries() {
    return [{
        start_no : 1,
        end_no   : 300,
        emission : '1993-05-25'
    },{
        start_no : 301,
        end_no   : 473,
        emission : '1993-11-25'
    },{
        start_no : 474,
        end_no   : 900,
        emission : '1994-06-13'
    },{
        start_no : 901,
        end_no   : 990,
        emission : '2001-12-26'
    },{
        start_no : 991,
        end_no   : 1170,
        emission : '2003-04-05'
    }]
}


/** 
 * @returns {Object}  worksheet header configuration
*/
function getSheetHeaders(sheetname) {
    const headers = {
        shares : {
            status        : 0,
            share_no      : 1,
            level         : 2,
            yn            : 3,
            sh_name       : 4,
            sh_first_name : 5,
            journal       : 6,
            transaction   : 7,
            f_code        : 8,
            a_code        : 9,
            family        : 10,
            salutation    : 11,
            name          : 12,
            first_name    : 13,
            address       : 14,
            city          : 15
        },
        journal : {
            journal_date     : 0,
            journal_no       : 1,
            checked          : 2,
            a_code           : 3,
            name             : 4,
            shares           : 5,
            transaction_type : 6,
            action           : 7,
            sold             : 8,
            repurchased      : 9,
            share_stock      : 10,
            value_in         : 11,
            value_out        : 12,
            win              : 13,
            balance_account_1130 : 14,
            balance_bcl      : 15,
            booking_no       : 16,
            booking_date     : 17,
            vr_protocol_date : 18
        }
    }

    return headers[sheetname]
}
