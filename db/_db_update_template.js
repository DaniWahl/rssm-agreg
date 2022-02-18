const path = require("path")
const fs = require("fs")
const info = {
    current: "0.5.0",
    target: "1.1.0",
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
        log(" updateData(): updating person comments to remarks...")
        const personComments = await selectAllSql(db, "SELECT person_id, comment FROM person WHERE comment != ''")
        for (let i in personComments) {
            const comment = personComments[i]
            log(`  inserting remark for person ${comment["person_id"]}`)
            const resp = await runSql(db, "INSERT INTO remark (remark, user) VALUES (?,?)", [
                comment["comment"],
                info.file,
            ])
            await runSql(db, "INSERT INTO entity_remark (entity, entity_id, remark_id) VALUES (?,?,?)", [
                "person",
                comment["person_id"],
                resp["lastID"],
            ])
        }

        log(" updateData() updating jounal comments to remarks...")
        const journalComments = await selectAllSql(
            db,
            "SELECT journal_id, person_id, comment FROM journal WHERE comment != ''"
        )
        for (let i in journalComments) {
            const comment = journalComments[i]
            log(`  inserting remark for journal ${comment["journal_id"]}`)
            const resp = await runSql(db, "INSERT INTO remark (remark, user) VALUES (?,?)", [
                comment["comment"],
                info.file,
            ])
            await runSql(db, "INSERT INTO entity_remark (entity, entity_id, remark_id) VALUES (?,?,?)", [
                "journal",
                comment["journal_id"],
                resp["lastID"],
            ])
            if (comment["person_id"]) {
                await runSql(db, "INSERT INTO entity_remark (entity, entity_id, remark_id) VALUES (?,?,?)", [
                    "person",
                    comment["person_id"],
                    resp["lastID"],
                ])
            }
        }

        log(" updateData() fixing missing share_chunk records...")
        const sql = `SELECT * FROM journal 
        WHERE action NOT IN ('Mutation') AND journal_id NOT IN (
            SELECT DISTINCT journal_id FROM share_chunk 
        )`
        const journals = await selectAllSql(db, sql)
        for (let i in journals) {
            const shares = await selectAllSql(db, "SELECT share_id, journal_id FROM certificate WHERE journal_id=?", [
                journals[i]["journal_id"],
            ])
            for (let j in shares) {
                const share = shares[j]
                log(`  inserting share_chunk for share ${share["share_id"]} and journal ${share["journal_id"]}`)
                const resp = await runSql(db, "INSERT INTO share_chunk (share_id, journal_id) VALUES (?,?)", [
                    share["share_id"],
                    share["journal_id"],
                ])
            }
        }

        log(" updateData() undating certificate status...")
        await runSql(
            db,
            `update certificate set status = 'electronic' where certificate_id in (
            select certificate_id from certificate
            join share using (certificate_id)
            where person_id = (
                select person_id from person where a_code = '999010'
            )
        )`
        )
        await runSql(
            db,
            `update certificate set status = 'issued' where certificate_id in (
            select certificate_id from certificate
            join share using (certificate_id)
            where person_id != (
                select person_id from person where a_code = '999010'
            )
        )`
        )
        await runSql(
            db,
            `update certificate set status = 'canceled' where certificate_id in (
            select certificate_id from certificate where status is null
        )`
        )
        await runSql(
            db,
            `update certificate set status = 'invalidated' where certificate_id in (
            select certificate_id from certificate
            join share using (certificate_id)
            where person_id = (select person_id from person where a_code = '929000')
        )`
        )

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
        await runSql(db, "DROP TABLE entity_remark")
        await runSql(db, "DROP TABLE remark")
        await runSql(db, "DROP TABLE audit_trail")
        await runSql(db, "UPDATE config SET value=? WHERE param=?", ["0.5.0", "VERSION"])
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

const ddl = [
    `CREATE TABLE "audit_trail" (
        "audit_trail_id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        "type"	TEXT NOT NULL,
        "value"	TEXT,
        "original"	TEXT,
        "entity"	TEXT,
        "entity_id"	INTEGER,
        "field"	TEXT,
        "user"	TEXT,
        "timestamp"	TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE "remark" (
        "remark_id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        "remark"	TEXT NOT NULL,
        "user"	TEXT NOT NULL,
        "timestamp"	TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE "entity_remark" (
        "entity_remark_id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        "entity"	TEXT NOT NULL,
        "entity_id"	INTEGER NOT NULL,
        "remark_id"	INTEGER NOT NULL
    )`,
    `ALTER TABLE "certificate" RENAME COLUMN "status" TO "check_status"`,
    `ALTER TABLE "certificate" ADD COLUMN "status" TEXT`,
    `ALTER TABLE "certificate" ADD COLUMN "hash" TEXT`,
    `CREATE INDEX audit_trail_i1 ON audit_trail(entity, entity_id)`,
    `CREATE INDEX entity_remark_i1 ON entity_remark(entity, entity_id, remark_id)`,
]

exports.info = info
exports.run = run
