const DBObject = require('../lib/DBObject').DBObject

class Share extends DBObject {

    constructor(dbConnection, data) {

        super(dbConnection, 'share', 'share_id', data)

    }


    getShareNo() {
        return this.pad0(this.data.share_no, 3)
    }

    getValue() {
        return this.data.value;
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

}


module.exports.Share = Share