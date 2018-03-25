const DBObject = require('../lib/DBObject').DBObject

class ShareCollection {

    constructor(db) {

        this.db = db
        this.shares = []

    }


    async init() {

    }

}




module.exports.ShareCollection = ShareCollection