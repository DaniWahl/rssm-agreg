const DBObject = require('../lib/DBObject').DBObject

class Certificate extends DBObject {

    constructor(dbConnection, data) {

        super(dbConnection, 'certificate', 'certificate_id', data)

    }




}


module.exports.Certificate = Certificate