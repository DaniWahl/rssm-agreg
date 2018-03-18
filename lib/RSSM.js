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



    getShares(list = []) {
        const result = []

        list.forEach(no => {
            result.push(
                this.shares[no]
            )
        })
        return result
    }


    getShareHolder(a_code) {
        return this.holders[a_code]
    }

}


module.exports.RSSM = RSSM