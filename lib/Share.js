const DBObject = require('../lib/DBObject').DBObject

class Share extends DBObject {

    constructor(dbConnection, data) {

        super(dbConnection, 'share', 'share_id', data)

    }


    getValue() {
        return this.data.value
    }



}


module.exports.Share = Share