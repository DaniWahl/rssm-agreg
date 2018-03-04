const sqlite = require('sqlite3').verbose();


class RSSMShares {


    constructor (dbPath) {
        this.dbPath = dbPath
        this.db = new sqlite.Database(dbPath, (err) => {
            if(err) { console.error(err.message) }
        })
    }

    /** 
     * query database for all shares
     * @returns {Promise} array of share objects or error
    */
    getAllShares() {
        const sql = this.makeSelectSql('share', ['person_id', 'share_no', 'value'], {person_id:1, value:1000}, ['value'])
        console.log(sql)
        return this.selectAllSql(sql);
    }

    

    /**
     * inserts a record to table JOURNAL 
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    insertJournal(data) {
        // form insert sql
        const sql = this.makeInsertSql('journal', data)
        const values = Object.keys(data).map(e => data[e])

        // return the promise from this.runSql()
        return this.runSql(sql, values)
    }


    /**
     * inserts a record to table SHARE_CHUNK
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    insertShareChunk(data) {
        // form insert sql
        const sql = this.makeInsertSql('share_chunk', data)
        const values = Object.keys(data).map(e => data[e])

        // return the promise from this.runSql()
        return this.runSql(sql, values)
    }


    /**
     * inserts a record to table SHARE 
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    insertShare(data) {
        // form insert sql
        const sql = this.makeInsertSql('share', data)
        const values = Object.keys(data).map(e => data[e])

        // return the promise from this.runSql()
        return this.runSql(sql, values)
    }


    /**
     * inserts a record to table PERSON 
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    insertPerson(data) {
        // form insert sql
        const sql = this.makeInsertSql('person', data)
        const values = Object.keys(data).map(e => data[e])

        // return the promise from this.runSql()
        return this.runSql(sql, values)
    }

    /**
     * inserts a record to table FAMILY 
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    insertFamily(data) {
        // form insert sql
        const sql = this.makeInsertSql('family', data)
        const values = Object.keys(data).map(e => data[e])

        // return the promise from this.runSql()
        return this.runSql(sql, values)
    }

    /**
     * inserts a record to table CERTIFICATE 
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    insertCertificate(data) {
        // form insert sql
        const sql = this.makeInsertSql('certificate', data)
        const values = Object.keys(data).map(e => data[e])

        // return the promise from this.runSql()
        return this.runSql(sql, values)
    }


    /**
     * update specified record in table with provided data
     * @param table
     * @param id
     * @param data
     * @returns {Promise}
     */
    updateRecord(table, id, data) {
        const sql = this.makeUpdateSql(table, id, data)
        const values = Object.keys(data).map(e => data[e])

        return this.runSql(sql, values)
    }

    /**
     * forms a simple SELECT sql statement.
     * does only filter where x=y (no < > etc and order ASC
     * @param {String}       table  table name to query
     * @param {String|Array} fields (optional)  fields to select. defaults to *
     * @param {Object}       filter (optional)  object of field:value filter definition
     * @param {Array}        sort  (optioal)  fields to sort on
     * @returns {String}  SQL statement string
     */
    makeSelectSql(table, fields='*', filter, sort) {
        let where = ''
        let orderby = ''

        if(Array.isArray(fields)) {
            fields = fields.join(',')
        }

        if(filter) {
            for(let i=0; i<Object.keys(filter).length; i++) {
                const field = Object.keys(filter)[i]
                const value = filter[field]
                if(i==0) {
                    where += `WHERE ${field}='${value}' `
                } else {
                    where += `AND ${field}='${value}' `
                }
            }
        }

        if(sort) {
            orderby = 'ORDER BY ' + sort.join(',')
        }

        return `SELECT ${fields} FROM ${table} ${where} ${orderby}`
    }

    /**
     * forms an INSERT sql statement for the specified table from the data object
     * @param {String} table  table name to insert
     * @param {Object} data   data object having field names as keys
     * @returns {String}  SQL statement string
     */
    makeInsertSql(table, data) {
        const fields = Object.keys(data)      // extract field names from data object
        const field_str = fields.join(',')     // join field names into field list string
        let qs = '?,'.repeat(fields.length) // prepare ? place holders for each field name
        qs = qs.slice(0,-1)                  // remove last , from list
        return `INSERT INTO ${table} (${field_str}) VALUES (${qs})`
    }


    /**
     * forms an UPDATE sql statement for the specified table and data object
     * @param {String} table  table name to update
     * @param {int} id  primary key value of record to update
     * @param {Object} data  set of field : value pairs to update
     * @returns {string}  SQL statement string
     */
    makeUpdateSql(table, id, data) {

        // build update SQL string
        const update_set = []
        Object.keys(data).forEach(field => {
            update_set.push( `${field} = ? ` )
        })
        const update_str = update_set.join(', ')

        // build pk field
        const pk_field = `${table}_id`

        return `UPDATE ${table} SET ${update_str} WHERE ${pk_field} = ${id}`
    }


    /**
     * runs the provided sql statement against the database
     * @param {String} sql  sql statement to run
     * @param {Array} params  parameter array in case the sql contains place holders
     * @returns {Promise}  with an object containing lastID and changes or database error string
     */
    runSql(sql, params = []) {
        return new Promise((resolve, reject) => {

            this.db.run(sql, params, function(err) {
                if (err) { 
                    reject({err:err, sql:sql, params:params } )
                } else {
                    resolve( {
                        lastID: this.lastID,
                        changes: this.changes,
                        params : params,
                        msg: sql.substr(0, 20) + '...  OK'} )
                }
            }) 
        })
    }

    /**
     * runs the provided sql statement against the database and returns a promised array of objects
     * @param {String} sql  sql statement to run
     * @param {Array} params  parameter array in case the sql contains place holders
     * @returns {Promise}  with an array of row objects or database error string
     */
    selectAllSql(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, function(err, rows) {
                if (err) { 
                    reject( err ) 
                } else { 
                    resolve( rows ) 
                }
            }) 
        })
    }

    /**
     * runs the provided sql statement against the database and returns one promised row object
     * @param {String} sql  sql statement to run
     * @param {Array} params  parameter array in case the sql contains place holders
     * @returns {Promise}  with one row object or database error string
     */
    selectOneSql(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, function(err, row) {
                if (err) { 
                    reject( err ) 
                } else { 
                    resolve( row ) 
                }
            }) 
        })
    }


    purgeTable(table) {
        return this.runSql(`DELETE FROM ${table}`)
    }

    purgeDatabase(){
        return new Promise((resolve, reject) => {
            this.purgeTable('share_chunk').then(
                this.purgeTable('journal').then(
                    this.purgeTable('certificate').then(
                        this.purgeTable('share').then(
                            this.purgeTable('person').then(
                                this.purgeTable('family').then(
                                    resolve(' all tables purged')
                                )
                            )
                        )
                    )
                )
            )
            .catch(
                reject(err)
            )
        })
    }

}


module.exports.RSSMShares = RSSMShares