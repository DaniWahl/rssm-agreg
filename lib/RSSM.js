const DBConnection = require('../lib/DBConnection').DBConnection
const Share = require('../lib/Share').Share
const Person = require('../lib/Person').Person
const Certificate = require('../lib/Certificate').Certificate
const Journal = require('../lib/Journal').Journal


const RSSM_CODE = '999010'


class RSSM {

    constructor(DB_PATH) {

        this.db = new DBConnection( DB_PATH )
        this.RSSM_CODE = RSSM_CODE
        this.today = new Date()

        this.shares = {}
        this.holders = {}
        this.certificates = {}
        this.journal = {}

        this.pki = {
            share : {},
            holder : {},
            certificate : {},
            journal : {}
        }

    }

    /**
     * connects the database and loads all data objects
     * @returns {Promise<string>}
     */
    async init() {

        // connect to database
        this.db = await this.db.connect();


        // load all data from database
        const results = await Promise.all([
            this.db.selectAll('share'),
            this.db.selectAll('person'),
            this.db.selectAll('certificate'),
            this.db.selectAll('journal')
        ])


        // process results
        results[0].forEach(row => {

            // create shares and pki index
            this.shares[row.share_no] = new Share(this.db, row)
            this.pki.share[row.share_id] = row.share_no
        })

        results[1].forEach(row => {

            this.holders[row.a_code] = new Person(this.db, row)
            this.pki.holder[row.person_id] = row.a_code
        })

        results[2].forEach(row => {

            const share_no = this.pki.share[row.share_id]
            const id = `${share_no}_${row.level}`


            this.certificates[id] = new Certificate(this.db, row)
            this.pki.certificate[row.certificate_id] = id
        })

        results[3].forEach(row => {

            this.journal[row.journal_no] = new Journal(this.db, row)
            this.pki.journal[row.journal_id] = row.journal_no

        })

        return 'ok'
    }

    /**
     *
     * @param holder
     * @param shares
     * @returns {Journal}
     */
    repurchase(holder, shares = []) {

    }


    /**
     * gets the last journal no from the journal dataset
     * @returns {string}  journal no
     */
    getLastJournalNo() {
        const journal_nos = Object.keys( this.journal )
        journal_nos.sort()
        journal_nos.reverse()
        return journal_nos[0]
    }

    /**
     * returns the inrement of the last journal no
     * @returns {string}
     */
    getNextJournalNo() {
        const journal_no = this.getLastJournalNo()
        const reg = /(\d\d)-(.*)$/
        const matches = reg.exec(journal_no)
       //  return reg.exec(journal_no)
        const year = matches[1]
        let counter = parseInt(matches[2]);
        counter++
        return `${year}-${this.pad0(counter, 3)}`
    }

    /**
     * returns the count and sum of values or all RSSM owned shares
     * @returns {{count: number, value: number}}
     */
    getShareStock() {
        const rssm = this.getRSSMHolder()
        const rssm_pk = rssm.data[rssm.pkField]
        let val=0;
        let count=0;

        Object.keys(this.shares).forEach(share_no => {
            const share = this.shares[share_no]

            if(share.data.person_id === rssm_pk ) {
                count++
                val += share.getValue()
            }
        })

        return {count: count, value: val}
    }

    /**
     * returns the RSSM {Person} object
     * @returns {Person}
     */
    getRSSMHolder() {
        return this.holders[this.RSSM_CODE]
    }

    /**
     * pads a number with leading 0 characters to the specified length
     * @param {int} number  number to pad
     * @param {int} length  length to pad to
     * @returns {String}  number padded with 0
     */
    pad0 (number, length) {

        if(number.toString().length >= length) {
            return number.toString()
        } else {
            let s = "000000000" + number
            return s.substr(s.length-length)
        }
    }

    /**
     * returns array of {Share} objects specified by the array of share_no values
     * @param list
     * @returns {Array}
     */
    getShares(list = []) {
        const result = []

        list.forEach(no => {
            result.push(
                this.shares[no]
            )
        })
        return result
    }


    /**
     * returns the share holder by the specified a_code
     * @param a_code
     * @returns {*}
     */
    getShareHolder(a_code) {
        return this.holders[a_code]
    }



    getCurrentShareHolders() {
        const result = []
        const shares = Object.values(this.shares);

        shares.forEach(share => {
            //const holder = rssm.
        })

        return result;
    }

}


module.exports.RSSM = RSSM