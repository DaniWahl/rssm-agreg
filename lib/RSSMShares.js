const sqlite = require("sqlite3")
const fs = require("fs")
const path = require("path")
const CryptoJS = require("crypto-js")
const helpers = require("./app.helpers")

class RSSMShares {
    constructor(config, dbMode = sqlite.OPEN_READWRITE) {
        this.data = {
            shareHolders: [],
            persons: [],
            journal: [],
            a_codes: {},
            shares: {},
            history: [],
            rssmShares: [],
            series: [],
            config: {},
        }

        this.config = config
        this.rssm_a_code = "999010"
        this.initialized = false
        this.dbMode = dbMode
        this.db = null
        this.initErrors = []
        this.platform = process.platform
    }

    /**
     * prepares internal data objects
     * @returns {Promise} resolving to true when init completes
     */
    async init() {
        // set empty data objects
        this.data = {
            shareHolders: [],
            persons: [],
            journal: [],
            a_codes: {},
            shares: {},
            history: [],
            rssmShares: [],
            series: [],
            config: {},
        }

        try {
            // read users configuration file
            this.config.read()

            // connect database
            const dbPath = this.config.get("dbpath")
            this.db = await this.connectDatabase(dbPath, this.dbMode)

            // retrieve configuration
            this.data.config = await this.getConfig()

            // check for needed database update
            await this.updateDatabase()

            // make database backup if needed
            await this.backupDatabase()

            // retrieve person data
            this.data.persons = await this.getPersons()

            // retrieve current share holders
            const holders = await this.getCurrentShareHolders()
            this.data.shareHolders = holders

            // retrieve share series
            this.data.series = await this.getShareSeries()

            // populate a_codes and shares
            holders.forEach((holder) => {
                if (this.data.a_codes[holder.a_code]) {
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

            console.log(`RSSMShares.init: ${Object.keys(this.data.a_codes).length} share holders loaded`)
            console.log(`RSSMShares.init: ${Object.keys(this.data.shares).length} shares loaded`)

            this.data.history = await this.getShareHolderHistory()

            console.log(`RSSMShares.init: ${this.data.history.length} history entries loaded`)

            // retrieve journal
            this.data.journal = await this.getJournal()

            console.log(`RSSMShares.init: ${this.data.journal.length} journal entries loaded`)

            this.data.rssmShares = this.data.a_codes[this.data.config.RSSM_A_CODE].shares

            console.log(`RSSMShares.init: ${this.data.rssmShares.length} shares owned by RSSM`)

            this.data.lastAcode = this.data.config.A_CODE_SEQ

            // set initialized property
            this.initialized = true
            return true
        } catch (err) {
            console.error(err)
        }
    }

    async checkForUpdate() {
        const PATHSEP = process.platform == "win32" ? "\\" : "//"
        const updatFilePath = __dirname.replace("lib", "db") + PATHSEP
        const updateFilePattern = /^db_update_.+\.js$/
        let file = null
        console.log("RSSMShares.checkForUpdate: checking for database update scripts...")

        // read db directory
        const list = fs.readdirSync(updatFilePath)

        // find db update file
        for (let i in list) {
            if (list[i].match(updateFilePattern)) {
                file = list[i]
            }
        }

        if (file) {
            return updatFilePath + file
        } else {
            return false
        }
    }

    async updateDatabase() {
        const errors = []
        const updateFile = await this.checkForUpdate()
        if (!updateFile) {
            return
        }

        // get current db version
        const currentDBv = await this.getConfig("VERSION")
        const update = require(updateFile)

        if (update) {
            if (update.info.current != currentDBv) {
                console.log(
                    `WARNING: will not update database using ${updateFile}. Current database version does not match!`
                )
                console.log(`  our current version:`, currentDBv)
                console.log(`  requested version for update:`, update.info.current)
                //errors.push(`unmatching db versions in ${updateFile}: ${update.info.current} <> ${currentDBv}`)
            } else {
                // make database backup before any upates
                await this.backupDatabase(true)
                console.log("RSSMShares.updateDatabase: updating database with ", updateFile)
                console.log(`  updating database from ${update.info.current} to ${update.info.target}`)

                try {
                    await update.run(this.db)
                } catch (error) {
                    console.log(`ERROR: ${error}`)
                    errors.push(error)
                }
            }
        } else {
            console.log(`ERROR: update file ${updateFile} can not be read!`)
        }

        if (errors.length) {
            console.log("errors occured during database update. please restore the resent database backup")
        }
    }

    connectDatabase(dbPath, dbMode) {
        return new Promise((resolve, reject) => {
            // check if db path is defined
            if (typeof dbPath === "undefined" || dbPath === null) {
                const msg = "RSSMShares.connectDatabase: cannot connect to database - database undefined!"
                console.error(msg)
                return reject(msg)
            } else if (!fs.existsSync(dbPath)) {
                const msg = `RSSMShares.connectDatabase: cannot connect to database '${dbPath}' -  file not found!`
                console.error(msg)
                return reject(msg)
            }

            console.log(`RSSMShares.connectDatabase: connecting sqlite database '${dbPath}' in mode ${dbMode} ...`)
            const db = new sqlite.Database(dbPath, dbMode, function (err) {
                if (err) {
                    const msg = `RSSMShares.connectDatabase: Failed to connect database ${dbPath}. (${err.message})`
                    console.error(msg)
                    return reject(msg)
                } else {
                    console.log(`Database connected`)
                    return resolve(db)
                }
            })
        })
    }

    async logError(msg) {
        console.error(msg)
        return this.auditTrail({
            type: "error",
            value: msg,
        })
    }

    async logActivity(msg, entity = null, id = null) {
        console.log("RSSMShares.logActivity", msg)
        return this.auditTrail({
            type: "activity",
            value: msg,
            entity: entity,
            entity_id: id,
        })
    }

    async logEntry(entity, id) {
        return this.auditTrail({
            type: "entry",
            entity: entity,
            entity_id: id,
            value: "created new " + entity,
        })
    }

    async logModification(entity, id, field, original, value) {
        return this.auditTrail({
            type: "modification",
            entity: entity,
            entity_id: id,
            field: field,
            value: value,
            original: original,
        })
    }

    async auditTrail(data) {
        data["user"] = this.config.userInfo.username
        const sql = this.makeInsertSql("audit_trail", data)
        const values = Object.keys(data).map((e) => data[e])
        return this.runSql(sql, values)
    }

    async logComment(value, entities = {}) {
        const commentData = {
            user: this.config.userInfo.username,
            remark: value,
        }

        // adding comment
        let sql = this.makeInsertSql("remark", commentData)
        let values = Object.keys(commentData).map((e) => commentData[e])
        const result = await this.runSql(sql, values)
        const commentId = result.lastID

        // referencing comment to entities
        for (let [entity, id] of Object.entries(entities)) {
            const data = {
                entity: entity,
                entity_id: id,
                remark_id: commentId,
            }
            sql = this.makeInsertSql("entity_remark", data)
            values = Object.keys(data).map((e) => data[e])
            await this.runSql(sql, values)
        }
    }

    async exportToExcel() {
        const maxExports = 5
        const sep = this.platform == "win32" ? "\\" : "//"

        const dbpath = this.config.get("dbpath")
        const exportPath = this.config.get("exportpath")
        const exports = this.config.get("exports")

        // make sure a db path is set
        if (!dbpath) {
            console.error("  Database not set - can not export backup!")
        }

        // make sure a backup path is set
        if (!exportPath) {
            console.error("  Export Path not set - can not create export!")
            return
        }

        // generate Excel workbook
        const Excel = require("exceljs")
        const workbook = new Excel.Workbook()
        workbook.created = new Date()
        workbook.title = "RSSM Aktienregister Export"

        // create sheet 'Aktienregister'
        const register_data = await this.getCurrentShareHolders()
        const registerSheet = workbook.addWorksheet("Aktienregister")
        registerSheet.columns = [
            { header: "Aktien Nr", key: "share_no", width: 15 },
            { header: "Aktien Generation", key: "generation", width: 15 },
            { header: "Zertifikat", key: "status", width: 15 },
            { header: "Wert [CHF]", key: "value", width: 15 },
            { header: "A-Code", key: "a_code", width: 15 },
            { header: "Name", key: "name", width: 25 },
            { header: "Vorname", key: "first_name", width: 25 },
            { header: "Adresse", key: "address", width: 25 },
            { header: "PLZ", key: "post_code", width: 15 },
            { header: "Ort", key: "city", width: 25 },
        ]
        for (let i = 0; i < register_data.length; i++) {
            register_data[i]["status"] = this.translateCertStatus(register_data[i]["status"])
            registerSheet.addRow(register_data[i])
        }

        // create sheet 'Aktionäre'
        const person_data = await this.getPersons()
        const personSheet = workbook.addWorksheet("Aktionäre")
        personSheet.columns = [
            { header: "A-Code", key: "a_code", width: 15 },
            { header: "Name", key: "name", width: 25 },
            { header: "Vorname", key: "first_name", width: 25 },
            { header: "Adresse", key: "address", width: 35 },
            { header: "PLZ", key: "post_code", width: 15 },
            { header: "Ort", key: "city", width: 25 },
            { header: "Kommentar", key: "comment", width: 35 },
            { header: "Korrespondenz Aktiv", key: "correspondence", width: 15 },
            { header: "Anzahl Aktien", key: "shares", width: 15 },
        ]
        // export data
        for (let i = 0; i < person_data.length; i++) {
            if (person_data[i].shares > 0) {
                personSheet.addRow(person_data[i])
            }
        }

        // create sheet Journal
        const journal_data = await this.getJournal()
        const journalSheet = workbook.addWorksheet("Journal")
        journalSheet.columns = [
            { header: "Jounral Nr", key: "journal_no", width: 15 },
            { header: "Jounral Datum", key: "transaction_date", width: 15 },
            { header: "A-Code", key: "a_code", width: 15 },
            { header: "Aktionärs Name", key: "name", width: 25 },
            { header: "Transaktion", key: "transaction_type", width: 35 },
            { header: "Aktion", key: "action", width: 25 },
            { header: "Zertifikate", key: "shares", width: 25 },
            { header: "Kapitaländerung", key: "number", width: 15 },
            { header: "Kommentar", key: "comment", width: 40 },
        ]
        for (let i = 0; i < journal_data.length; i++) {
            journalSheet.addRow(journal_data[i])
        }

        // output data to Excel file
        const dbExport = `${exportPath}${sep}RSSM_Aktienregister_Export_${helpers.dateToDbString()}.xlsx`
        await workbook.xlsx.writeFile(dbExport)

        // update config
        exports.unshift(dbExport) // add new export to front of array
        this.config.save("lastexport", helpers.dateToDbString())
        this.config.save("exports", exports.slice(0, maxExports - 1))

        this.logActivity("database exported to " + dbExport)
        return dbExport
    }

    translateCertStatus(data) {
        switch (data) {
            case "issued":
                return "ausgestellt"
            case "electronic":
                return "elektronisch"
            case "reserved":
                return "reserviert"
            case "canceled":
                return "gelöscht"
            case "invalidated":
                return "annuliert"
            default:
                return data
        }
    }

    /**
     * register the information on a generated document into the database
     * @param info
     * @returns {Promise}
     */
    async registerDocument(info) {
        if (!info.name) {
            info.name = path.basename(info.path)
        }

        if (!info.type) {
            info.type = path.extname(info.path)
        }

        if (!info.created_date) {
            info.created_date = helpers.dateToDbString()
        }

        return this.insertRecord("document", info)
    }

    /**
     * copy the database file to the configured backup directory
     * @param backupNow
     * @returns {Promise<string>}
     */
    async backupDatabase(backupNow = false) {
        const maxBackups = 5
        const backupFreq = 30
        const sep = this.platform == "win32" ? "\\" : "//"

        const dbpath = this.config.get("dbpath")
        const backupPath = this.config.get("backuppath")
        const lastBackupStr = this.config.get("lastbackup")
        const backups = this.config.get("backups")

        // make sure a db path is set
        if (!dbpath) {
            console.error("  Database not set - can not create backup!")
        }

        // make sure a backup path is set
        if (!backupPath) {
            console.error("  Backup Path not set - can not create backup!")
            return
        }

        // calculate time passed since last backup
        if (lastBackupStr) {
            const today = new Date()
            const lastBackup = new Date(lastBackupStr)
            const backupPast = Math.abs(today - lastBackup)

            if (backupPast >= backupFreq * 24 * 3600 * 1000) {
                // last backup was more than BACKUP_FREQ days!
                backupNow = true
            }
        } else {
            // backup was never created!
            backupNow = true
        }

        if (backupNow) {
            console.log("RSSMShares.backupDatabase: generating database backup...")

            // build destination path
            const dbBackup = `${backupPath}${sep}RSSM_backup_${helpers.dateToDbString()}.db`

            // copy the file
            fs.copyFileSync(dbpath, dbBackup)

            // update config
            backups.unshift(dbBackup) // add new backup to front of array
            this.config.save("lastbackup", helpers.dateToDbString())
            this.config.save("backups", backups.slice(0, maxBackups - 1))

            this.logActivity("database backup created: " + dbBackup)

            return dbBackup
        }
    }

    /**
     * use the last journal entry and return an incremented copy
     * @returns {string}
     */
    getNextJounalNo() {
        if (!this.initialized) {
            console.error("not initialized")
            return
        }
        const journal_no = this.data.journal[0].journal_no

        // prepare regex to parse journal no
        const regex = /(\d\d)-(\d\d\d)/g
        const matches = regex.exec(journal_no)
        let year = matches[1]
        let counter = parseInt(matches[2])

        // did we switch year?
        const today = new Date()
        const newYear = today.getFullYear().toString().substr(-2)
        if (newYear != year) {
            year = newYear
            counter = 0
            console.log("RSSMShares.getNextJournalNo: detecting new year - resetting journal counter")
        }

        // increment journal no and pad back to 3 digits
        counter++
        counter = helpers.pad0(counter, 3) // pad0 will respect the case when counter gets > 999

        return `${year}-${counter}`
    }

    /**
     * mutatates person information.
     * will also create a journal entry accordingly.
     * @param {Object} updated_person  person information
     * @returns {Promise<Array>}
     */
    async mutation(updated_person) {
        let updates = []

        // get person
        const person = this.data.a_codes[updated_person.a_code]

        // get last journal
        const last_journal = this.data.journal[0]

        // calculate value, stock and balance and share string
        let value = 0.0
        let new_stock = last_journal.share_stock
        let new_balance = parseFloat(last_journal.balance_account_1130)

        // extract comment
        let comment
        if ("comment" in updated_person) {
            comment = updated_person.comment
            delete updated_person.comment
        }

        // create journal
        let journal = {}
        journal.journal_date = helpers.dateToDbString()
        journal.journal_no = this.getNextJounalNo()
        journal.a_code = updated_person.a_code
        journal.person_id = updated_person.person_id
        journal.name = updated_person.name
        journal.action = "Mutation"
        journal.transaction_type = ""
        journal.shares = ""
        journal.repurchased = 0
        journal.sold = 0
        journal.value_in = 0.0
        journal.value_out = 0.0
        journal.share_stock = new_stock
        journal.balance_account_1130 = new_balance

        //2DO: begin db transaction
        //  sqlite3 object does not support transactions across async functions currently

        try {
            // insert a new journal record
            const new_journal = await this.insertRecord("journal", journal)
            const journal_id = new_journal.lastID
            await this.updateRecord("person", person.person_id, updated_person)
            await this.logComment(comment, { person: person.person_id, journal: journal_id })
            await this.logActivity(`person information updated`, "person", person.person_id)

            //2DO: commit db transaction

            // re-initialize the data cache
            await this.init()

            return {
                old_name: person.name,
                old_first_name: person.first_name,
                old_address: person.address,
                old_post_code: person.post_code,
                old_city: person.city,
                old_correspondence: person.correspondence,
                a_code: person.a_code,
                new_name: updated_person.name,
                new_first_name: updated_person.first_name,
                new_address: updated_person.address,
                new_post_code: updated_person.post_code,
                new_city: updated_person.city,
                new_correspondence: updated_person.correspondence,
                comment: comment,
                journal_no: journal.journal_no,
                journal_id: journal_id,
            }
        } catch (e) {
            //2DO: rollback db transaction
            console.log(e)
            throw new Error(e)
        }
    }

    /**
     * creates a new person record
     * @param {Object} person   new person
     * @returns {Promise<Object>}
     */
    async enterPerson(person) {
        // create a a_code
        person.a_code = await this.generateACode()
        person.correspondence = 1
        let comment

        if (person.comment) {
            comment = person.comment
            delete person.comment
        }

        // create new PERSON
        const person_insert = await this.insertRecord("person", person)
        person.person_id = person_insert.lastID
        this.logComment(comment, { person: person.person_id })

        // re-initialize the data cache
        await this.init()
        return person
    }

    async saleReserved(transaction, buyer) {
        let transfer_info = null
        let owner = null
        const comments = []
        const original_holder = this.data.a_codes[buyer.a_code]

        console.log(transaction)

        if (original_holder.name == buyer.name && original_holder.first_name == buyer.first_name) {
            // person stays the same, update person data
            await this.updateRecord("person", original_holder.person_id, buyer)
            //buyer['person_id'] = original_holder.person_id
            owner = original_holder
        } else {
            // shares should be transferred to new person
            owner = await this.enterPerson(buyer)

            // transfer all shares to the new buyer
            transfer_info = await this.transfer(
                transaction.shares,
                original_holder.a_code,
                owner.a_code,
                "Transfer der Zertifikate im Rahmen der Ausstellung reservierter Aktien"
            )

            // TODO: remove original owner if all were transferred ?
        }

        // get last journal
        const last_journal = this.data.journal[0]

        // retrieve original reservation journal records
        const share_list = transaction.shares.join(",")
        let sql = `SELECT * FROM journal WHERE journal_id IN (
            SELECT DISTINCT journal_id FROM certificate WHERE person_id=? AND status='reserved' AND share_id IN (
                SELECT share_id FROM share WHERE share_no IN (${share_list})
            )
        )`
        const old_journals = await this.selectAllSql(sql, [original_holder.person_id])

        // create new journal entry
        // calculate value, stock and balance and share string
        let value = 0.0
        let new_stock = last_journal.share_stock
        let new_balance = parseFloat(last_journal.balance_account_1130)
        let shares_str = ""
        transaction.shares.forEach((no) => {
            value += parseFloat(this.data.shares[no].value)
            shares_str += helpers.pad0(no, 3)
            shares_str += " "
        })
        let journals_str = ""
        old_journals.forEach((j) => {
            journals_str += j.journal_no
            journals_str += ", "
        })
        journals_str = journals_str.substr(0, journals_str.length - 2)

        // create journal
        let journal = {}
        journal.journal_date = helpers.dateToDbString()
        journal.journal_no = this.getNextJounalNo()
        journal.a_code = owner.a_code
        journal.person_id = owner.person_id
        journal.name = owner.name
        journal.action = "Ausstellung"
        journal.transaction_type = `Eintrag auf ${owner.first_name} ${owner.name}`
        journal.shares = shares_str
        journal.repurchased = 0
        journal.sold = 0
        journal.value_in = 0.0
        journal.value_out = 0.0
        journal.share_stock = new_stock
        journal.balance_account_1130 = new_balance

        // insert a new journal record
        const new_journal = await this.insertRecord("journal", journal)
        const journal_id = new_journal.lastID

        // log comments
        comments.push("Die Zertifikate wurden von reservierten Aktien ausgestellt.")
        comments.push(`Die Reservierung der Aktien wurde im Journal unter folgendem Eintrag vermerkt: ${journals_str}`)
        if (transaction.cert_type == "electronic") {
            comments.push("Es wurden elektronische Zertifikate erstellt.")
        }
        if (transaction.comment) {
            comments.push(transaction.comment)
        }
        for (let i = 0; i < comments.length; i++) {
            await this.logComment(comments[i], { journal: journal_id, person: owner.person_id })
        }
        for (let i = 0; i < old_journals.length; i++) {
            await this.logComment(`Von diesen reservierten Aktien wurden Zertifikate erstellt: ${journal.journal_no}`, {
                journal: old_journals[i].journal_id,
            })
        }

        // update certificates
        sql = `SELECT * FROM certificate WHERE person_id=? AND status='reserved' AND share_id IN (
            SELECT share_id FROM share WHERE share_no IN (${share_list})
        )`

        // define new certificate type
        let new_cert_type = transaction.cert_type
        if (transaction.cert_type == "paper") {
            new_cert_type = "issued"
        }

        const certificates = await this.selectAllSql(sql, [owner.person_id])
        for (let i = 0; i < certificates.length; i++) {
            let c = certificates[i]
            c.status = new_cert_type
            c.a_name = owner.name
            c.a_first_name = owner.first_name
            c.journal_id = journal_id
            c.person_id = owner.person_id
            c = this.hashCertificate(c)
            await this.updateRecord("certificate", c.certificate_id, c)
            await this.logActivity(`issued reserved certificate`, "certificate", c.certificate_id)
        }

        // re-initialize the data cache
        await this.init()
        console.log(`RSSMShares.sale: initialized data objects`)

        // return object for document generation
        return {
            salutation: buyer.salutation,
            first_name: buyer.first_name,
            name: buyer.name,
            address: buyer.address,
            post_code: buyer.post_code,
            city: buyer.city,
            a_code: buyer.a_code,
            family: buyer.family,
            purchase_date: transaction.booking_date,
            comment: comments.join(`\n`),
            journal_no: journal.journal_no,
            journal_id: journal_id,
            journal_reservation: journals_str,
            shares: transaction.shares,
            transfer: transfer_info,
        }
    }

    /**
     * transfers a bunch of shares numbers from RSSM to a new owner.
     * creates a new person record if the new owner does not exist yet.
     * @param {Object} transaction  shares to be repurchased
     * @param {Object} buyer   new owner
     * @returns {Promise<Object>}
     */
    async sale(transaction, buyer) {
        let updates = []
        let person
        let comments = []

        //console.log('RSSMshares.sale: buyer=', buyer);

        if (buyer.a_code) {
            // get person
            person = this.data.a_codes[buyer.a_code]
        } else {
            // create a a_code
            buyer.a_code = await this.generateACode()
            buyer.correspondence = 1
            person = buyer

            // create new PERSON
            const person_insert = await this.insertRecord("person", buyer)
            person.person_id = person_insert.lastID

            // save temporay entry in a_codes
            this.data.a_codes[person.a_code] = person
            this.data.persons.push(person)
        }

        // get last journal
        const last_journal = this.data.journal[0]

        // calculate value, stock and balance
        let value = 0.0
        let shares_str = ""
        transaction.shares.forEach((no) => {
            value += parseFloat(this.data.shares[no].value)
            shares_str += helpers.pad0(no, 3)
            shares_str += " "
        })
        let new_stock = last_journal.share_stock - transaction.shares.length
        let new_balance = parseFloat(last_journal.balance_account_1130) + value

        let action = "Verkauf"
        if (transaction.cert_type == "reservation") {
            action = "Reservierung"
            comments.push("Die Aktien wurden für den Aktionär reserviert. Es wurden keine Zertifikate ausgestellt")
        }
        if (transaction.cert_type == "electronic") {
            comments.push("Es wurden elektronische Zertifikate erstellt.")
        }
        if (transaction.comment) {
            comments.push(transaction.comment)
        }

        // prepare journal
        let journal = {}
        journal.journal_date = helpers.dateToDbString()
        journal.journal_no = this.getNextJounalNo()
        journal.shares = shares_str
        journal.a_code = person.a_code
        journal.person_id = person.person_id
        journal.name = person.name
        journal.transaction_type = `Eintrag auf ${person.first_name} ${person.name}`
        journal.action = action
        journal.repurchased = 0
        journal.sold = transaction.shares.length
        journal.value_in = value
        journal.value_out = 0.0
        journal.share_stock = new_stock
        journal.balance_account_1130 = new_balance
        journal.booking_date = transaction.booking_date

        // 2DO: begin transaction
        //  sqlite3 object does not support transactions across async functions currently

        try {
            // insert a new journal record
            const new_journal = await this.insertRecord("journal", journal)
            const journal_id = new_journal.lastID

            // log comments
            for (let i = 0; i < comments.length; i++) {
                await this.logComment(comments[i], { journal: journal_id, person: person.person_id })
            }

            // iterate over share numbers
            for (let no of transaction.shares) {
                // change owner of all shares
                const share_updates = await this.changeShareOwner(no, person.a_code, journal_id, transaction.cert_type)
                updates = updates.concat(share_updates)
            }

            // 2DO: commit transaction

            // re-initialize the data cache
            await this.init()
            console.log(`RSSMShares.sale: initialized data objects`)

            // return object for document generation
            return {
                salutation: person.salutation,
                first_name: person.first_name,
                name: person.name,
                address: person.address,
                post_code: person.post_code,
                city: person.city,
                a_code: person.a_code,
                family: person.family,
                purchase_date: transaction.booking_date,
                comment: comments.join(`\n`),
                journal_no: journal.journal_no,
                journal_id: journal_id,
                shares: transaction.shares,
            }
        } catch (e) {
            // 2DO: rollback transaction
            console.trace()
            throw new Error(e)
        }
    }

    /**
     * changes the owner of a bunch of share numbers back to RSSM.
     * will also create a journal entry accordingly.
     * @param {Array} shares_no  shares to be repurchased
     * @param {String} a_code  of previous share holder
     * @returns {Promise<Array>}
     */
    async repurchase(shares_no, a_code, booking_date) {
        let updates = []

        // get person
        const person = this.data.a_codes[a_code]

        // get last journal
        const last_journal = this.data.journal[0]

        // calculate value, stock and balance and share string
        let value = 0.0
        let shares_str = ""
        shares_no.forEach((no) => {
            value += parseFloat(this.data.shares[no].value)
            shares_str += helpers.pad0(no, 3)
            shares_str += " "
        })
        let new_stock = last_journal.share_stock + shares_no.length
        let new_balance = parseFloat(last_journal.balance_account_1130) - value

        // create journal
        let journal = {}
        journal.journal_date = helpers.dateToDbString()
        journal.journal_no = this.getNextJounalNo()
        journal.shares = shares_str
        journal.a_code = a_code
        journal.person_id = person.person_id
        journal.name = person.name
        journal.transaction_type = "Eintrag auf RSSM"
        journal.action = "Rückkauf"
        journal.repurchased = shares_no.length
        journal.sold = 0
        journal.value_in = 0.0
        journal.value_out = value
        journal.share_stock = new_stock
        journal.booking_date = booking_date
        journal.balance_account_1130 = new_balance

        //2DO: begin db transaction
        //  sqlite3 object does not support transactions across async functions currently

        try {
            // insert a new journal record
            const new_journal = await this.insertRecord("journal", journal)
            const journal_id = new_journal.lastID

            console.log(`RSSMShares.repurchase: inserted new journal ${journal_id}`)

            // iterate over shares
            for (let no of shares_no) {
                // change owner of all shares
                const share_updates = await this.changeShareOwner(no, this.rssm_a_code, journal_id)
                updates = updates.concat(share_updates)
                console.log(`RSSMShares.repurchase: changed ownership of share ${no} shares to ${this.rssm_a_code}`)
            }

            // was this the last share for this person?
            if (person.shares.length === shares_no.length) {
                // update person set correspondense off
                await this.updateRecord("person", person.person_id, { correspondence: 0 })
            }

            //2DO: commit db transaction

            // re-initialize the data cache
            await this.init()
            console.log(`RSSMShares.repurchase: initialized data objects`)

            // return object for document generation
            return {
                salutation: person.salutation,
                first_name: person.first_name,
                name: person.name,
                address: person.address,
                post_code: person.post_code,
                city: person.city,
                a_code: person.a_code,
                family: person.family,
                journal_date: journal.journal_date,
                booking_date: journal.booking_date,
                journal_no: journal.journal_no,
                journal_id: journal_id,
                shares: shares_no,
            }
        } catch (e) {
            //2DO: rollback db transaction
            throw new Error(e)
        }
    }

    /**
     * transfers ownership of a bunch of share numbers to another share holder.
     * will also create a journal entry accordingly.
     * @param {Array} shares_no
     * @param {String} a_code_holder
     * @param {String} a_code_reciever
     * @param {String} comment
     * @returns {Promise<array>}
     */
    async transfer(shares_no, a_code_holder, a_code_reciever, comment) {
        let updates = []

        // get persons
        const holder = this.data.a_codes[a_code_holder]

        // receiver may not be in data.a_codes! searc from data.persons
        let reciever
        this.data.persons.forEach((person) => {
            if (person.a_code == a_code_reciever) {
                reciever = person
            }
        })

        // get last journal
        const last_journal = this.data.journal[0]

        // calculate share string
        let shares_str = ""
        shares_no.forEach((no) => {
            shares_str += helpers.pad0(no, 3)
            shares_str += " "
        })
        let new_stock = last_journal.share_stock
        let new_balance = parseFloat(last_journal.balance_account_1130)

        // create journal
        let journal = {}
        journal.journal_date = helpers.dateToDbString()
        journal.journal_no = this.getNextJounalNo()
        journal.shares = shares_str
        journal.a_code = a_code_holder
        journal.person_id = holder.person_id
        journal.name = holder.name
        journal.transaction_type = `Eintrag auf ${reciever.first_name} ${reciever.name}`
        journal.action = "Übertrag"
        journal.repurchased = 0
        journal.sold = 0
        journal.value_in = 0.0
        journal.value_out = 0.0
        journal.share_stock = new_stock
        journal.balance_account_1130 = new_balance

        //2DO: begin db transaction
        //  sqlite3 object does not support transactions across async functions currently

        try {
            // insert a new journal record
            const new_journal = await this.insertRecord("journal", journal)
            const journal_id = new_journal.lastID
            if (comment) {
                this.logComment(comment, { journal: journal_id })
            }

            // iterate over shares
            for (let no of shares_no) {
                // change owner of all shares
                const share_updates = await this.changeShareOwner(no, a_code_reciever, journal_id)
                updates = updates.concat(share_updates)
                console.log(`RSSMShares.transfer: changed ownership of share ${no} shares to ${a_code_reciever}`)
            }

            // was this the last share for this person?
            if (holder.shares.length === shares_no.length) {
                // update person set correspondense off
                await this.updateRecord("person", holder.person_id, { correspondence: 0 })
            }

            //2DO: commit db transaction

            // re-initialize the data cache
            await this.init()

            return {
                old_name: holder.name,
                old_first_name: holder.first_name,
                old_address: holder.address,
                old_post_code: holder.post_code,
                old_city: holder.city,
                old_a_code: holder.a_code,
                new_name: reciever.name,
                new_first_name: reciever.first_name,
                new_address: reciever.address,
                new_post_code: reciever.post_code,
                new_city: reciever.city,
                new_a_code: reciever.a_code,
                comment: comment,
                journal_no: journal.journal_no,
                journal_id: journal_id,
                shares: shares_no,
            }
        } catch (e) {
            //2DO: rollback db transaction
            throw new Error(e)
        }
    }

    /**
     * takes a certificate object and generates a unique SHA256 hash which will be added to the returned object
     * @param {Object} cert  certificate object
     */
    hashCertificate(cert) {
        const hash = CryptoJS.SHA256(
            `${cert.person_id}${cert.share_id}${cert.journal_id}${cert.a_first_name}${cert.a_name}${cert.transaction_date}`
        )
        cert["hash"] = hash.toString()
        return cert
    }

    /**
     * change share owner by creating a new certificate and change certificate_id on share.
     * requres a journal_id of a previously created journal entry.
     * @param {Int} share_no share numbers
     * @param {String} new_a_code  new share holder
     * @param {Number} journal_id  journal pk to reference to
     * @returns {Promise<Array>}  resolving to array of update objects
     */
    async changeShareOwner(share_no, new_a_code, journal_id, cert_type = null) {
        const updates = []

        // get new holder
        let buyer
        this.data.persons.forEach((person) => {
            if (person.a_code == new_a_code) {
                buyer = person
            }
        })

        // define new certificate status
        let new_status = "issued"
        if (new_a_code == this.rssm_a_code) {
            new_status = "electronic" // electronic if new share holder is RSSM
        }
        // TODO: define status electronic if share holder wishes no paper certificates
        if (cert_type && cert_type == "electronic") {
            new_status = "electronic"
        }
        if (cert_type && cert_type == "reservation") {
            new_status = "reserved"
        }

        // get share and current certificate
        const share = this.data.shares[share_no]
        const old_cert = await this.getRecord("certificate", share.certificate_id)

        // update old certificate status
        await this.runSql("UPDATE certificate SET status = 'canceled' WHERE certificate_id=?", [
            old_cert.certificate_id,
        ])

        // create new share certificate
        let cert = {}
        cert.person_id = buyer.person_id
        cert.share_id = share.share_id
        cert.journal_id = journal_id
        cert.a_first_name = buyer.first_name
        cert.a_name = buyer.name
        cert.transaction_date = helpers.dateToDbString()
        cert.generation = old_cert.generation + 1
        cert.status = new_status
        cert.check_status = "ok"

        if (new_status != "reserved") {
            cert = this.hashCertificate(cert)
        }
        const new_cert = await this.insertRecord("certificate", cert)
        updates.push(new_cert)

        // update share certificate reference
        const update = await this.updateRecord("share", share.share_id, { certificate_id: new_cert.lastID })
        updates.push(update)

        this.logActivity(`share ${share_no} changed ownership to ${buyer.person_id}`, "share", share.share_id)

        // resolve Promises
        return updates
    }

    /**
     * return an object of person info for the two register admins
     * @returns Object
     */
    getAdminInfo() {
        return {
            admin_1: this.data.persons.find((p) => p.a_code === this.data.config.AG_REGISTER_PERSON_1),
            admin_2: this.data.persons.find((p) => p.a_code === this.data.config.AG_REGISTER_PERSON_2),
        }
    }

    /**
     * query database for all shares
     * @returns {Promise} array of share objects or error
     */
    getAllShares() {
        const sql = this.makeSelectSql("share", ["*"], {}, ["share_no"])
        return this.selectAllSql(sql)
    }

    /**
     * query database for all shared currently belonging to RSSM
     * @returns {Promise} array of share objects
     */
    async getRSSMShares() {
        const a_code = "999010"
        const sql = `select * from share s
        join certificate c on (c.certificate_id=s.certificate_id)
        join person p on (p.person_id=c.person_id)
        where p.a_code = '${a_code}'`
        return this.selectAllSql(sql)
    }

    /**
     * query database for current share holders
     * @returns {Promise} array of share objects or error
     */
    async getPersons() {
        const sql = `
        select 
            p.person_id,
            p.a_code,
            p.name,
            p.first_name,
            p.address,
            p.post_code,
            p.city,
            p.comment,
            p.correspondence,
            (
                select count(c.person_id) 
                from certificate c 
                join share s on (c.certificate_id=s.certificate_id)
                where c.person_id=p.person_id
            ) as shares
         from person p
         order by name, first_name;
        `

        return this.selectAllSql(sql)
    }

    async getPersonDetail(person_id) {
        const share_sql = `select s.share_id, s.certificate_id, s.type, s.value, 
        s.share_no, c.transaction_date, c.generation, j.journal_no, j.journal_date
        from share s
        join certificate c using (certificate_id)
        left join journal j using (journal_id)
        where c.person_id=?
        order by share_no`
        const remark_sql = `select r.remark_id, er.entity_id, r.remark, r.timestamp 
        from entity_remark er
        join remark r using (remark_id)
        where entity='person' 
        and entity_id=?
        order by timestamp desc`
        const person_info = await this.selectOneSql("SELECT * FROM person WHERE person_id=?", [person_id])
        const shares = await this.selectAllSql(share_sql, [person_id])
        const remarks = await this.selectAllSql(remark_sql, [person_id])
        const trail = await this.selectAllSql(
            "select * from audit_trail where entity='person' and entity_id=? order by timestamp desc",
            [person_id]
        )

        return {
            person_info: person_info,
            shares: shares,
            remarks: remarks,
            trail: trail,
        }
    }

    async getJournalDetail(journal_id) {
        const share_sql = `select c.certificate_id, c.share_id, c.journal_id, c.a_first_name, c.a_name, c.transaction_date, c.generation,
        c.status, s.share_no, s.type, s.value, s.emission_date
        from certificate c
        join share s using (share_id) 
        where journal_id=?
        order by share_no`
        const remark_sql = `select r.remark_id, er.entity_id, r.remark, r.timestamp 
        from entity_remark er
        join remark r using (remark_id)
        where entity='journal' 
        and entity_id=?
        order by timestamp desc`
        const journal_info = await this.selectOneSql("SELECT * FROM journal WHERE journal_id=?", [journal_id])
        const shares = await this.selectAllSql(share_sql, [journal_id])
        const remarks = await this.selectAllSql(remark_sql, [journal_id])

        return {
            journal_id: journal_id,
            journal_info: journal_info,
            shares: shares,
            remarks: remarks,
        }
    }

    /**
     * query database for current share holders
     * @returns {Promise} array of share objects or error
     */
    getCurrentShareHolders() {
        const sql = `
        select
            p.person_id,
            s.share_id,
            c.certificate_id,
            c.status,
            c.hash,
            s.share_no,
            c.generation,
            s.value,
            p.f_code,
            p.a_code,
            p.family,
            p.salutation,
            p.name,
            p.first_name,
            p.address,
            p.post_code,
            p.city,
            p.correspondence,
            p.comment
        from share s
        join certificate c on (c.certificate_id=s.certificate_id)
        join person p on (p.person_id=c.person_id)
        order by share_no;
        `
        return this.selectAllSql(sql)
    }

    /**
     * query database for all share holders
     * @returns {Promise} array of share objects or error
     */
    getShareHolderHistory() {
        const sql = `
        select
            s.share_no,
            c.generation,
            c.transaction_date,
            p.f_code,
            p.a_code,
            p.family,
            p.salutation,
            p.name,
            p.first_name,
            p.address,
            p.post_code,
            p.city,
            p.correspondence,
            (s.certificate_id == c.certificate_id) as is_current,
            c.status
        from certificate c
        join share s on (s.share_id=c.share_id)
        join person p on (p.person_id=c.person_id)
        order by s.share_no, c.generation DESC
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
            journal_id,
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
            share_stock,
            balance_account_1130,
            comment
        from journal
        order by journal_date desc
        `

        return this.selectAllSql(sql)
    }

    /**
     * query journal for transactions between range of dates
     * @param start_date
     * @param end_date
     * @returns {Promise}
     */
    async getTransactionList(start_date, end_date) {
        let sql = `
        select 
            case when booking_date IS NULL then journal_date else booking_date end as transaction_date,
            journal_no,
            case action
                when 'Kauf' then 'Verkauf an'
                when 'Verkauf' then 'Verkauf an'
                when 'Rückkauf' then 'Rückkauf von'
                when 'Reservierung' then 'Reservierung für'
				when 'Ausstellung' then 'Ausstellung für'
				when 'Übertrag' then 'Übertrag auf'
                else action
            end as transaction_type,
                name,
                repurchased - sold as stock_change,
                shares
        from journal
        where transaction_date between ? and ?
          and action in ('Kauf', 'Verkauf', 'Rückkauf', 'Reservierung', 'Ausstellung', 'Übertrag')
        order by transaction_date, journal_no asc
        `

        return this.selectAllSql(sql, [start_date, end_date])
    }

    async getShareKapital(date = helpers.dateToDbString()) {
        let sql = `
        select 
          sum(shares) as shares_total,
          sum(shares * shares_value ) as shares_kapital
        from share_series
        where emission_date <= ?;
        `

        return this.selectAllSql(sql, [date])
    }

    /**
     * returns a record of the entity and specified id
     * @param {String} entity table name
     * @param {Int} id  pk
     * @returns {Promise}
     */
    async getRecord(entity, id) {
        let pk_field
        switch (entity) {
            case "config":
                pk_field = "param"
                break
            case "share_series":
                pk_field = "series"
                break
            default:
                pk_field = `${entity}_id`
        }

        const sql = `select * from ${entity} where ${pk_field}=?`
        return this.selectOneSql(sql, [id])
    }

    /**
     * returns the config of one parameter if requested or queries the database
     * to return all config parameters in case param is not set.
     * @param param {String}
     * @returns {Promise<*>} resolves to String or Object
     */
    async getConfig(param) {
        // just return one config parameter if requested
        if (param) {
            return this.data.config[param]
        }

        // query database to retrieve all configs
        const rows = await this.selectAllSql("SELECT * FROM config")
        const config = {}
        rows.forEach((c) => {
            config[c.param] = c.value
        })

        return config
    }

    /**
     * returns the value of a seqence
     * @param name
     * @returns {Promise}
     */
    async getSequence(name) {
        const sql = "select seq from sqlite_sequence where name=?"
        return await this.selectOneSql(sql, name)
    }

    /**
     * returns share series information
     * @returns {Promise<void>}
     */
    async getShareSeries() {
        return await this.selectAllSql("select * from share_series order by series_id")
    }

    /**
     * returns the series information for a particular share including summed values
     * @param share_no {number}
     * @returns {Object} matching series
     */
    getShareSeriesInfo(share_no) {
        let shares = 0
        let nv_shares = 0
        let capital = 0

        for (let i = 0; i < this.data.series.length; i++) {
            const serie = this.data.series[i]

            // calculate sums
            shares += serie.shares
            nv_shares += serie.nv_shares
            capital += serie.shares * serie.shares_value
            capital += serie.nv_shares * serie.nv_value

            if ((share_no >= serie.start_no) & (share_no <= serie.end_no)) {
                // return matched serie with calculated sums
                return {
                    shares: shares,
                    nv_shares: nv_shares,
                    capital: capital,
                    emission_date: serie.emission_date,
                    shares_value: serie.shares_value,
                    nv_value: serie.nv_value,
                }
            }
        }
    }

    /**
     * generate a new A-Code based on the next person sequence value
     * @returns {Promise<string>}
     */
    async generateACode() {
        const today = new Date()
        const year = today.getFullYear() - 2000 // get 2 digit year

        // increment last a_code and save back
        let a_code = parseInt(this.data.config.A_CODE_SEQ)
        a_code++
        const config_promise = await this.setConfig("A_CODE_SEQ", a_code)

        // pad a_code to 4 digits
        a_code = helpers.pad0(a_code, 4)

        // compile and return new a_code
        return `A-${year}${a_code}`
    }

    /**
     * inserts a record to table SHARE_CHUNK
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    insertShareChunk(data) {
        // form insert sql
        const sql = this.makeInsertSql("share_chunk", data)
        const values = Object.keys(data).map((e) => data[e])

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
        const sql = this.makeInsertSql("share", data)
        const values = Object.keys(data).map((e) => data[e])

        // return the promise from this.runSql()
        return this.runSql(sql, values)
    }

    /**
     * inserts a record to table SHARE_SERIES
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    async insertShareSeries(data) {
        // form insert sql
        const sql = this.makeInsertSql("share_series", data)
        const values = Object.keys(data).map((e) => data[e])

        // return the promise from this.runSql()
        return this.runSql(sql, values)
    }

    /**
     * sets a parameter value into the CONFIG table as well as a the objects config property.
     * @param {Object} data  in form of a { param: param, value: value } Object
     * @returns {Promise}
     */
    async setConfig(param, value) {
        let sql

        this.data.config[param] = value

        // do we need to update or insert?
        const row = await this.selectOneSql("SELECT * FROM config WHERE param=?", [param])
        if (typeof row === "undefined") {
            await this.insertRecord("config", { param: param, value: value })
        } else {
            await this.updateRecord("config", row["param"], { value: value })
        }
    }

    async insertRecord(entity, data) {
        try {
            const sql = this.makeInsertSql(entity, data)
            const values = Object.keys(data).map((e) => data[e])
            const rec = await this.runSql(sql, values)
            await this.logEntry(entity, rec.lastID)
            return rec
        } catch (e) {
            throw new Error(e)
        }
    }

    /**
     * update specified record in table with provided data
     * @param table
     * @param id
     * @param data
     * @returns {Promise}
     */
    async updateRecord(table, id, data) {
        const original = await this.getRecord(table, id)
        const sql = this.makeUpdateSql(table, id, data)
        const values = Object.keys(data).map((e) => data[e])
        const rec = await this.runSql(sql, values)

        for (const [field, value] of Object.entries(data)) {
            if (original[field] != value) {
                await this.logModification(table, id, field, original[field], value)
            }
        }
        return rec
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
    makeSelectSql(table, fields = "*", filter, sort) {
        let where = ""
        let orderby = ""

        if (Array.isArray(fields)) {
            fields = fields.join(",")
        }

        if (filter) {
            for (let i = 0; i < Object.keys(filter).length; i++) {
                const field = Object.keys(filter)[i]
                const value = filter[field]
                if (i == 0) {
                    where += `WHERE ${field}='${value}' `
                } else {
                    where += `AND ${field}='${value}' `
                }
            }
        }

        if (sort) {
            orderby = "ORDER BY " + sort.join(",")
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
        const fields = Object.keys(data) // extract field names from data object
        const field_str = fields.join(",") // join field names into field list string
        let qs = "?,".repeat(fields.length) // prepare ? place holders for each field name
        qs = qs.slice(0, -1) // remove last , from list
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
        Object.keys(data).forEach((field) => {
            update_set.push(`${field} = ? `)
        })
        const update_str = update_set.join(", ")

        // build pk field
        let pk_field
        switch (table) {
            case "config":
                pk_field = "param"
                break
            case "share_series":
                pk_field = "series_id"
            default:
                pk_field = `${table}_id`
        }

        return `UPDATE ${table} SET ${update_str} WHERE ${pk_field} = '${id}'`
    }

    /**
     * runs the provided sql statement against the database
     * @param {String} sql  sql statement to run
     * @param {Array} params  parameter array in case the sql contains place holders
     * @returns {Promise}  with an object containing lastID and changes or database error string
     */
    runSql(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error("ERROR in runSql ", sql, err)
                    reject(err)
                } else {
                    // set valid flag to false if data was changed
                    if (this.changes) {
                        this.initialized = false
                    }

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
    selectAllSql(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, function (err, rows) {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
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
            this.db.get(sql, params, function (err, row) {
                if (err) {
                    reject(err)
                } else {
                    resolve(row)
                }
            })
        })
    }
}

exports.RSSMShares = RSSMShares
