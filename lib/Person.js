const DBObject = require('../lib/DBObject').DBObject

class Person extends DBObject {

    constructor(dbConnection, data) {

        super(dbConnection, 'person', 'person_id', data)

    }




}


module.exports.Person = Person