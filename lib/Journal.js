const DBObject = require('../lib/DBObject').DBObject

class Journal extends DBObject {

    constructor(dbConnection, data) {

        super(dbConnection, 'journal', 'journal_id', data)

    }


}


module.exports.Journal = Journal