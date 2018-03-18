


class DBObject {

    constructor (dbConnection, table, pkField, data) {

        this.db = dbConnection
        this.table = table
        this.pkField = pkField
        this.data = data
        this.dirty = false


    }


    setValue(key, value) {
        if(key === this.pkField) {
            throw Error('forbidden to change pk value!')
        }
        this.data[key] = value
        this.dirty = true
    }

    async commit() {
        const update = this.makeUpdateSql()
        const msg = await this.db.run(update.sql, update.params)
        if(msg.status === 'OK' ){
            this.dirty = false
        }
        return msg
    }

    refresh() {

    }

    getData() {
        return this.data
    }

    getPk() {
        return this.data[this.pkField]
    }

    /**
     *
     * @returns {{sql: string, params: Array}}
     */
    makeUpdateSql() {
        // prepare update sql
        const params = []
        let sql = `UPDATE ${this.table} SET`
        Object.keys(this.data).forEach(key => {
            if(key === this.pkField) {
                return
            }
            params.push(this.data[key])
            sql += ` ${key}=?,`
        })

        sql = sql.slice(0, -1)

        sql += ` WHERE ${this.pkField}=?`
        params.push(this.data[this.pkField])

        return {sql: sql, params : params}
    }



}


module.exports.DBObject = DBObject