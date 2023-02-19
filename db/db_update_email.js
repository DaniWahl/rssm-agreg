const path = require("path")
const fs = require("fs")
const info = {
    current: "1.1.0",
    target: "1.1.1",
    file: path.basename(__filename),
    run: [checkDatabase, updateDll, updateData, renameFile],
}
const errors = []

async function run(db) {
    for (let i in info.run) {
        await info.run[i](db)
    }
}

function err(msg) {
    console.error(`ERROR: ${msg}`)
    errors.push(msg)
}

function log(msg) {
    console.log(msg)
}

/**
 * checks database before updating anything
 * @param {Object} db  sqlite3 database object
 */
async function checkDatabase(db) {
    log(" checkDatabase(): checking database before update...")

    try {
        const row = await selectAllSql(db, "SELECT value FROM config WHERE param='VERSION'")
        const dbVersion = row[0]["value"]
        if (dbVersion != info.current) {
            err(`unable to update database, version no does not match! (${dbVersion}<>${info.current})`)
        } else {
            log(` database version is OK (${dbVersion})`)
        }
    } catch (error) {
        err(error)
    }
}

/**
 * execute DDL statements to modify database structure
 * @param {Object} db  sqlite3 database object
 */
async function updateDll(db) {
    log(" updateDll(): updating database structure... ")
    try {
        for (let i in ddl) {
            log(`  running statement ${ddl[i].substr(0, ddl[i].indexOf("("))} ...`)
            await runSql(db, ddl[i])
        }
        log(" database structure update complete")
    } catch (error) {
        err(error)
    }
}

async function updateData(db) {
    try {
        log(" updateData() updating database version...")
        await runSql(db, "UPDATE config SET value=? WHERE param='VERSION'", [info.target])
        const value = `database successfully updated from version ${info.current} to ${info.target}`
        await runSql(db, "INSERT INTO audit_trail (type, value, user) VALUES (?,?,?)", [
            "database update",
            value,
            info.file,
        ])

        log(" data update complete")
    } catch (error) {
        err(error)
    }
}

/**
 * dropping created tables
 * @param {Object} db  sqlite3 database object
 */
async function restoreDb(db) {
    log(" restoreDb(): restoring database structure... ")
    try {
        await runSql(db, `ALTER TABLE "person" DROP COLUMN "email" TEXT`)
        await runSql(db, "UPDATE config SET value=? WHERE param=?", ["1.1.0", "VERSION"])
        log(" restoring database complete")
    } catch (error) {
        err(error)
    }
}

async function renameFile(db) {
    const dirname = path.dirname(__filename)
    const newName = `${dirname}\\complete_${info.file}`

    log(` renameFile(): renaming update file ${__filename} to ${newName}`)
    fs.renameSync(__filename, newName)
    log(` remame complete`)
}

/**
 * runs the provided sql statement against the database
 * @param {String} sql  sql statement to run
 * @param {Array} params  parameter array in case the sql contains place holders
 * @returns {Promise}  with an object containing lastID and changes or database error string
 */
function runSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err)
            } else {
                resolve({
                    lastID: this.lastID,
                    changes: this.changes,
                    params: params,
                    msg: sql.substr(0, 50) + "...  OK",
                })
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
function selectAllSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, function (err, rows) {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

const ddl = [`ALTER TABLE "person" ADD COLUMN "email" TEXT`]

exports.info = info
exports.run = run
