const sqlite3 = require('sqlite3').verbose();



class DBConnection {


    /**
     * object constructor
     * @param {String} dbPath  path to database file
     */
    constructor (dbPath) {
        this.dbPath = dbPath
        this.connected = false
        this.db = null
    }

    /**
     *
     * @returns {Promise<any>}
     */
    async connect() {
        const database = this
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, function(err) {
                if (err) { reject(err.message) }
                database.connected = true
                resolve(database)
            })
        })
    }

    /**
     *
     * @param sql
     * @param params
     * @returns {Promise<any>}
     */
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {

            this.db.run(sql, params, function(err) {
                if (err) {
                    reject({status:err, sql:sql, params:params } )
                } else {

                    resolve( {
                        lastID: this.lastID,
                        changes: this.changes,
                        sql : sql,
                        params : params,
                        status: 'OK'
                    })

                }
            })

        })
    }


    /**
     *
     * @param table
     * @returns {Promise<any>}
     */
     async selectAll(table) {
        const sql = `SELECT * FROM ${table}`
        return new Promise((resolve, reject) => {
            this.db.all(sql, function(err, rows) {
                if(err) { reject(err)}
                resolve(rows)
            })
        })
    }

}



exports.DBConnection = DBConnection