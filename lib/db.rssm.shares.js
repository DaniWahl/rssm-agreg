const sqlite = require('sqlite3').verbose();
const pad0 = require('./app.helpers').pad0;



class RSSMShares {


    constructor (dbPath) {
        this.dbPath = dbPath
        this.db = new sqlite.Database(dbPath, (err) => {
            if(err) { console.error(err.message) }
        })

        this.data = {
            shareHolders : [],
            a_codes      : {},
            shares       : {}
        }

        this.valid = false

        this.init()
    }

    /**
     * prepares internal data objects
     */
    init() {

        this.getCurrentShareHolders().then(holders=> {
            this.data.shareHolders = holders;

            holders.forEach(holder => {

                if(this.data.a_codes[holder.a_code]) {
                    // a_code already known, add share_no
                    this.data.a_codes[holder.a_code].shares.push(holder.share_no)
                } else {
                    // create a_code with empty shares array
                    this.data.a_codes[holder.a_code] = holder
                    this.data.a_codes[holder.a_code].shares = []
                    this.data.a_codes[holder.a_code].shares.push(holder.share_no)
                }

                this.data.shares[holder.share_no] = holder
            })

            this.valid = true
        })


        this.getJournal().then(journal => {
            this.data.journal = journal
        })


    }

    /**
     * use the last journal entry and return an incremented copy
     * @returns {string}
     */
    getNextJounalNo() {

        if(!this.valid) {
            console.error('not initialized')
            return
        }
        const journal_no = this.data.journal[0].journal_no

        // prepare regex to parse journal no
        const regex = /(\d\d)-(\d\d\d)/g
        const matches = regex.exec(journal_no)
        const year = matches[1]
        let counter = parseInt(matches[2])

        // increment journal no and pad back to 3 digits
        counter++
        counter = pad0(counter, 3)  // pad0 will respect the case when counter gets > 999

        return `${year}-${counter}`

    }


    /**
     *
     * @param {Array} shares_no  array of share numbers
     * @param {String} a_code  current share holder
     * @param {String} new_a_code  new share holder
     * @param {String} type  action type [repurchase|purchase|transfer]
     */
    changeShareOwner(shares_no, a_code, new_a_code, type) {



        // 1. prepare
        // 2DO: return Promise
        // 2DO: get current date
        // 2DO: get next journal no
        // 2DO: get share stock
        // 2DO: get balance
        // 2DO: calculate total share value
        // 2DO: create share list string (joined share no)
        // 2DO: get share array
        // 2DO: get holder
        // 2DO: het new holder
        // 2DO: create database transaction

        // 2. create new Journal
        // 2DO: insert new Journal

        // iterate over shares

            // 3. create share chunk
            // 2DO: insert new share_chunk

            // 4. create new share certificate
            // 2DO: create new certificate

            // 5. update share owner
            // 2DO: update share.person_id


        // 2DO: resolve Promise

    }

    /** 
     * query database for all shares
     * @returns {Promise} array of share objects or error
    */
    getAllShares() {
        const sql = this.makeSelectSql('share', ['*'], {}, ['share_no'])
        return this.selectAllSql(sql);
    }

    /**
     * query database for current share holders
     * @returns {Promise} array of share objects or error
     */
    getCurrentShareHolders() {

        if (this.valid) {
            return new Promise(resolve => {
                resolve(this.data.shareHolders)
            })
        }

        const sql = `select
            s.share_no,
            f.f_code,
            p.a_code,
            f.name as family,
            p.salutation,
            p.name,
            p.first_name,
            p.address,
            p.post_code,
            p.city
        from share s
        join person p on (p.person_id=s.person_id)
        join family f on (f.family_id=p.family_id)
        order by share_no;
        `
        return this.selectAllSql(sql)
    }

    /**
     * query database for all share holders
     * @returns {Promise} array of share objects or error
     */
    getAllShareHolders() {
        const sql = `select
        s.share_no,
            c.level,
            c.transaction_date,
            f.f_code,
            p.a_code,
        f.name as family,
            p.salutation,
            p.name,
            p.first_name,
            p.address,
            p.post_code,
            p.city
        from certificate c
        join share s on (s.share_id=c.share_id)
        join person p on (p.person_id=c.person_id)
        join family f on (f.family_id=p.family_id)
        order by s.share_no, c.level
        `
        return this.selectAllSql(sql)
    }

    /**
     * query database for jounal entries
     * @returns {Promise} array of journal objects or error
     */
    getJournal() {
        const sql = `
        select 
            journal_no,
            journal_date as transaction_date,
            a_code,
            name,
            shares,
            transaction_type,
            "action",
            0-sold + repurchased as number,
            0-sold as sold,
            repurchased,
            share_stock
        from journal
        order by journal_no desc
        `

        return this.selectAllSql(sql)
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


    /**
     * purdes data form specified table
     * @param table
     * @returns {Promise}
     */
    purgeTable(table) {
        return this.runSql(`DELETE FROM ${table}`)
    }

    /**
     * purges all database table in the correct order
     * @returns {Promise<any>}
     */
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

exports.RSSMShares = RSSMShares