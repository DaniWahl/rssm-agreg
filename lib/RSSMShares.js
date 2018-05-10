const sqlite = require('sqlite3').verbose();
const helpers = require('./app.helpers');


class RSSMShares {


    constructor (dbPath) {
        this.dbPath = dbPath;
        this.db = new sqlite.Database(dbPath, (err) => {
            if(err) { console.error(err.message); }
        })

        this.data = {
            shareHolders : [],
            persons      : [],
            journal      : [],
            a_codes      : {},
            shares       : {},
            history      : [],
            rssmShares   : []
        };

        this.config = {};

        this.rssm_a_code = '999010';
        this.initialized = false;

        console.log('RSSMShares: object instantiated');

    }

    /**
     * prepares internal data objects
     * @returns {Promise} resolving to true when init completes
     */
    async init() {

        // set empty data objects
        this.data = {
            shareHolders : [],
            persons      : [],
            journal      : [],
            a_codes      : {},
            shares       : {},
            history      : [],
            rssmShares   : []
        };

        // retrieve configuration
        this.config = await this.getConfig();


        this.data.persons = await this.getPersons();

        // retrieve current share holders
        const holders = await this.getCurrentShareHolders();
        this.data.shareHolders = holders;


        // populate a_codes and shares
        holders.forEach(holder => {

            if (this.data.a_codes[holder.a_code]) {
                // a_code already known, add share_no
                this.data.a_codes[holder.a_code].shares.push(holder.share_no);
            } else {
                // create a_code with empty shares array
                this.data.a_codes[holder.a_code] = holder;
                this.data.a_codes[holder.a_code].shares = [];
                this.data.a_codes[holder.a_code].shares.push(holder.share_no);
            }

            this.data.shares[holder.share_no] = holder;
        })

        console.log(`RSSMShares.init: ${Object.keys(this.data.a_codes).length} share holders loaded`);
        console.log(`RSSMShares.init: ${Object.keys(this.data.shares).length} shares loaded`);

        this.data.history = await this.getShareHolderHistory();

        console.log(`RSSMShares.init: ${this.data.history.length} history entries loaded`);

        // retrieve journal
        this.data.journal = await this.getJournal();

        console.log(`RSSMShares.init: ${this.data.journal.length} journal entries loaded`);

        this.data.rssmShares = this.data.a_codes[this.rssm_a_code].shares;

        console.log(`RSSMShares.init: ${this.data.rssmShares.length} shares owned by RSSM`);

        this.data.lastAcode = this.get

        // set initialized property
        this.initialized = true;

        return true;
    }

    /**
     * use the last journal entry and return an incremented copy
     * @returns {string}
     */
    getNextJounalNo() {

        if(!this.initialized) {
            console.error('not initialized');
            return;
        }
        const journal_no = this.data.journal[0].journal_no;

        // prepare regex to parse journal no
        const regex = /(\d\d)-(\d\d\d)/g;
        const matches = regex.exec(journal_no);
        const year = matches[1];
        let counter = parseInt(matches[2]);

        // increment journal no and pad back to 3 digits
        counter++;
        counter = helpers.pad0(counter, 3);  // pad0 will respect the case when counter gets > 999

        return `${year}-${counter}`;

    }


    /**
     * mutatates person information.
     * will also create a journal entry accordingly.
     * @param {Object} updated_person  person information
     * @returns {Promise<Array>}
     */
    async mutation(updated_person) {

        let updates = [];

        // get person
        const person = this.data.a_codes[updated_person.a_code];

        // get last journal
        const last_journal = this.data.journal[0];

        // calculate value, stock and balance and share string
        let value = 0.0;
        let new_stock = last_journal.share_stock;
        let new_balance = parseFloat(last_journal.balance_account_1130);


        // create journal
        let journal = {};
        journal.journal_date = helpers.dateToDbString();
        journal.journal_no = this.getNextJounalNo();
        journal.a_code = updated_person.a_code;
        journal.person_id = updated_person.person_id;
        journal.name = updated_person.name;
        journal.action = 'Mutation';
        journal.transaction_type = '';
        journal.shares = '';
        journal.repurchased = 0;
        journal.sold = 0;
        journal.value_in = 0.0;
        journal.value_out = 0.0;
        journal.share_stock = new_stock;
        journal.balance_account_1130 = new_balance;
        journal.comment = person.comment;


        //2DO: begin db transaction
        //  sqlite3 object does not support transactions across async functions currently

        try {

            // insert a new journal record
            const new_journal = await this.insertJournal(journal);
            const journal_id = new_journal.lastID;

            console.log(`RSSMShares.mutation: inserted new journal ${journal_id}`);

            this.updateRecord('person', person.person_id, updated_person);
            console.log(`RSSMShares.mutation: updated person information`);
            
            
            //2DO: commit db transaction

            // re-initialize the data cache
            await this.init();
            console.log(`RSSMShares.mutation: initialized data objects`);


            // return resolved update promises
            return updates;
        }
        catch(e) {

            //2DO: rollback db transaction
            throw new Error(e);
        }

    }


    /**
     * transfers a bunch of shares numbers from RSSM to a new owner.
     * creates a new person record if the new owner does not exist yet.
     * @param {Array} shares_no  shares to be repurchased
     * @param {Object} buyer   new owner
     * @returns {Promise<Array>}
     */
    async sale(shares_no, buyer) {

        let updates = [];
        let person;

        //console.log('RSSMshares.sale: buyer=', buyer);

        if(buyer.a_code) {
            // get person
            person = this.data.a_codes[buyer.a_code];
        } else {

            // create a a_code
            buyer.a_code = await this.generateACode();
            person = buyer;

            // create new PERSON
            const person_insert = await this.insertPerson(buyer);
            person.person_id = person_insert.lastID;

            console.log(person_insert);

            // save temporay entry in a_codes
            this.data.a_codes[person.a_code] = person;
        }

        console.log(person);

        // get last journal
        const last_journal = this.data.journal[0];


        // calculate value, stock and balance
        let value = 0.0;
        let shares_str = '';
        shares_no.forEach(no => {
            value += parseFloat(this.data.shares[no].value);
            shares_str += helpers.pad0(no, 3);
            shares_str += ' ';
        });
        let new_stock = last_journal.share_stock - shares_no.length;
        let new_balance = parseFloat(last_journal.balance_account_1130) + value;


        // prepare journal
        let journal = {};
        journal.journal_date = helpers.dateToDbString();
        journal.journal_no = this.getNextJounalNo();
        journal.shares = shares_str;
        journal.a_code = person.a_code;
        journal.person_id = person.person_id;
        journal.name = person.name;
        journal.transaction_type = `Eintrag auf ${person.first_name} ${person.name}`;
        journal.action = 'Verkauf';
        journal.repurchased = 0;
        journal.sold = shares_no.length;
        journal.value_in = value;
        journal.value_out = 0.0;
        journal.share_stock = new_stock;
        journal.balance_account_1130 = new_balance;


        // 2DO: begin transaction
        //  sqlite3 object does not support transactions across async functions currently

        try{

            // insert a new journal record
            const new_journal = await this.insertJournal(journal);
            const journal_id = new_journal.lastID;
            console.log(`RSSMShares.sale: inserted new journal ${journal_id}`);

            // iterate over share numbers
            for(let no of shares_no) {

                // change owner of all shares
                const share_updates = await this.changeShareOwner(no, person.a_code, journal_id);
                updates = updates.concat(share_updates);
                console.log(`RSSMShares.sale: changed ownership of share ${no} to ${person.a_code}`);
            }

            // 2DO: commit transaction

            // re-initialize the data cache
            await this.init();
            console.log(`RSSMShares.sale: initialized data objects`);

            return updates;
        }
        catch(e) {

            // 2DO: rollback transaction
            throw new Error(e);
        }

    }



    /**
     * changes the owner of a bunch of share numbers back to RSSM.
     * will also create a journal entry accordingly.
     * @param {Array} shares_no  shares to be repurchased
     * @param {String} a_code  of previous share holder
     * @returns {Promise<Array>}
     */
    async repurchase(shares_no, a_code) {

        let updates = [];

        // get person
        const person = this.data.a_codes[a_code];

        // get last journal
        const last_journal = this.data.journal[0];

        // calculate value, stock and balance and share string
        let value = 0.0;
        let shares_str = '';
        shares_no.forEach(no => {
            value += parseFloat(this.data.shares[no].value);
            shares_str += helpers.pad0(no, 3);
            shares_str += ' ';
        });
        let new_stock = last_journal.share_stock + shares_no.length;
        let new_balance = parseFloat(last_journal.balance_account_1130) - value;


        // create journal
        let journal = {};
        journal.journal_date = helpers.dateToDbString();
        journal.journal_no = this.getNextJounalNo();
        journal.shares = shares_str;
        journal.a_code = a_code;
        journal.person_id = person.person_id;
        journal.name = person.name;
        journal.transaction_type = 'Eintrag auf RSSM';
        journal.action = 'Rückkauf';
        journal.repurchased = shares_no.length;
        journal.sold = 0;
        journal.value_in = 0.0;
        journal.value_out = value;
        journal.share_stock = new_stock;
        journal.balance_account_1130 = new_balance;


        //2DO: begin db transaction
        //  sqlite3 object does not support transactions across async functions currently

        try {

            // insert a new journal record
            const new_journal = await this.insertJournal(journal);
            const journal_id = new_journal.lastID;

            console.log(`RSSMShares.repurchase: inserted new journal ${journal_id}`);


            // iterate over shares
            for(let no of shares_no ) {
                // change owner of all shares
                const share_updates = await this.changeShareOwner(no, this.rssm_a_code, journal_id);
                updates = updates.concat(share_updates);
                console.log(`RSSMShares.repurchase: changed ownership of share ${no} shares to ${this.rssm_a_code}`);
            }

            //2DO: commit db transaction

            // re-initialize the data cache
            await this.init();
            console.log(`RSSMShares.repurchase: initialized data objects`);


            // return resolved update promises
            return updates;
        }
        catch(e) {

            //2DO: rollback db transaction
            throw new Error(e);
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

        let updates = [];

        // get persons
        const holder = this.data.a_codes[a_code_holder];
        const reciever = this.data.a_codes[a_code_reciever];

        // get last journal
        const last_journal = this.data.journal[0];

        // calculate share string
        let shares_str = '';
        shares_no.forEach(no => {
            shares_str += helpers.pad0(no, 3);
            shares_str += ' ';
        })
        let new_stock = last_journal.share_stock;
        let new_balance = parseFloat(last_journal.balance_account_1130);


        // create journal
        let journal = {};
        journal.journal_date = helpers.dateToDbString();
        journal.journal_no = this.getNextJounalNo();
        journal.shares = shares_str;
        journal.a_code = a_code_holder;
        journal.person_id = holder.person_id;
        journal.name = holder.name;
        journal.transaction_type = `Eintrag auf ${reciever.first_name} ${reciever.name}`;
        journal.action = 'Übertrag';
        journal.repurchased = 0;
        journal.sold = 0;
        journal.value_in = 0.0;
        journal.value_out = 0.0;
        journal.share_stock = new_stock;
        journal.balance_account_1130 = new_balance;
        journal.comment = comment;


        //2DO: begin db transaction
        //  sqlite3 object does not support transactions across async functions currently

        try {

            // insert a new journal record
            const new_journal = await this.insertJournal(journal);
            const journal_id = new_journal.lastID;

            console.log(`RSSMShares.transfer: inserted new journal ${journal_id}`);


            // iterate over shares
            for(let no of shares_no ) {
                // change owner of all shares
                const share_updates = await this.changeShareOwner(no, a_code_reciever, journal_id);
                updates = updates.concat(share_updates);
                console.log(`RSSMShares.transfer: changed ownership of share ${no} shares to ${a_code_reciever}`);
            }

            //2DO: commit db transaction

            // re-initialize the data cache
            await this.init();
            console.log(`RSSMShares.transfer: initialized data objects`);


            // return resolved update promises
            return updates;
        }
        catch(e) {

            //2DO: rollback db transaction
            throw new Error(e);
        }
    }


    /**
     * change share owner by creating a new certificate and change certificate_id on share.
     * requres a journal_id of a previously created journal entry.
     * @param {Int} share_no share numbers
     * @param {String} new_a_code  new share holder
     * @param {Number} journal_id  journal pk to reference to
     * @returns {Promise<Array>}  resolving to array of update objects
     */
    async changeShareOwner(share_no, new_a_code, journal_id) {

        const updates = [];

        // get new holder
        const buyer = this.data.a_codes[new_a_code];

        // get share and current certificate
        const share = this.data.shares[share_no];
        const old_cert = await this.getCertificate(share.certificate_id);

        // create new share certificate
        const cert = {};
        cert.person_id = buyer.person_id;
        cert.share_id = share.share_id;
        cert.journal_id = journal_id;
        cert.a_first_name = buyer.first_name;
        cert.a_name = buyer.name;
        cert.transaction_date = helpers.dateToDbString();
        cert.generation = old_cert.generation + 1;
        cert.status = 'ok';
        const new_cert = await this.insertCertificate(cert);
        updates.push(new_cert);
        console.log(`RSSMShares.changeShareOwner: inserted new certificate ${new_cert.lastID}`);

        // update share certificate reference
        const update = await this.updateRecord('share', share.share_id, {certificate_id: new_cert.lastID});
        updates.push(update);
        console.log(`RSSMShares.changeShareOwner: changed share.certificate_id from share ${share.share_id}`);

        // resolve Promises
        return updates;
    }

    /** 
     * query database for all shares
     * @returns {Promise} array of share objects or error
    */
    getAllShares() {
        const sql = this.makeSelectSql('share', ['*'], {}, ['share_no']);
        return this.selectAllSql(sql);
    }

    /**
     * query database for current share holders
     * @returns {Promise} array of share objects or error
     */
    async getPersons() {
        const sql = `
        select 
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
        `;

        return this.selectAllSql(sql);
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
        `;
        return this.selectAllSql(sql);
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
            p.correspondence
        from certificate c
        join share s on (s.share_id=c.share_id)
        join person p on (p.person_id=c.person_id)
        order by s.share_no, c.generation
        `;
        return this.selectAllSql(sql);
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
            share_stock,
            balance_account_1130
        from journal
        order by journal_no desc
        `;

        return this.selectAllSql(sql);
    }


    /**
     * returns a certificate record of the specified id
     * @param {Int} id  certificate pk
     * @returns {Promise}
     */
    async getCertificate(id) {
        const sql = 'select * from certificate where certificate_id=?';
        return this.selectOneSql(sql, [id]);
    }


    /**
     * returns the config of one parameter if requested or queries the database
     * to return all config parameters in case param is not set.
     * @param param {String}
     * @returns {Promise<*>} resolves to String or Object
     */
    async getConfig(param) {
        // just return one config parameter if requested
        if(param) {
            return this.config[param];
        }

        // query database to retrieve all configs
        const rows = await this.selectAllSql('SELECT * FROM config');
        const config = {};
        rows.forEach(c => {
            config[c.param] = c.value;
        })

        return config;
    }

    /**
     * returns the value of a seqence
     * @param name
     * @returns {Promise}
     */
    async getSequence(name) {
        const sql = 'select seq from sqlite_sequence where name=?';
        return await this.selectOneSql(sql, name);
    }

    /**
     * generate a new A-Code based on the next person sequence value
     * @returns {Promise<string>}
     */
    async generateACode() {

        const today = new Date();
        const year = today.getFullYear() - 2000;  // get 2 digit year

        // increment last a_code and save back
        let a_code = parseInt(this.config.A_CODE_SEQ);
        a_code++;
        const config_promise = await this.setConfig('A_CODE_SEQ', a_code);

        // pad a_code to 4 digits
        a_code = helpers.pad0(a_code, 4);

        // compile and return new a_code
        return `A-${year}${a_code}`;

    }


    /**
     * inserts a record to table JOURNAL 
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    async insertJournal(data) {
        // form insert sql
        const sql = this.makeInsertSql('journal', data);
        const values = Object.keys(data).map(e => data[e]);

        // return the promise from this.runSql()
        return this.runSql(sql, values);
    }


    /**
     * inserts a record to table SHARE_CHUNK
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    insertShareChunk(data) {
        // form insert sql
        const sql = this.makeInsertSql('share_chunk', data);
        const values = Object.keys(data).map(e => data[e]);

        // return the promise from this.runSql()
        return this.runSql(sql, values);
    }


    /**
     * inserts a record to table SHARE 
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    insertShare(data) {
        // form insert sql
        const sql = this.makeInsertSql('share', data);
        const values = Object.keys(data).map(e => data[e]);

        // return the promise from this.runSql()
        return this.runSql(sql, values);
    }


    /**
     * sets a parameter value into the CONFIG table as well as a the objects config property.
     * @param {Object} data  in form of a { param: param, value: value } Object
     * @returns {Promise}
     */
    async setConfig(param, value) {
        let sql;

        // store config in object
        this.config[param] = value;

        // do we need to update or insert?
        const row = await this.selectOneSql('SELECT * FROM config WHERE param=?', [param]);
        if(typeof row === 'undefined') {
            // need to insert
            sql = 'INSERT INTO config (value, param) VALUES (?,?)';
        } else {
            // need to update
            sql = `UPDATE config SET value=? WHERE param=?`;
        }


        return await this.runSql(sql, [value, param]);
    }


    /**
     * inserts a record to table PERSON 
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    async insertPerson(data) {
        // form insert sql

        try{
            const sql = this.makeInsertSql('person', data);
            const values = Object.keys(data).map(e => data[e]);
            return this.runSql(sql, values);
        }
        catch(e) {
            throw new Error(e);
        }
    }


    /**
     * inserts a record to table CERTIFICATE 
     * @param {Object} data  object with appropriate field names as keys
     * @returns {Promise} with an object containing lastID and changes or database error string
     */
    async insertCertificate(data) {
        // form insert sql
        const sql = this.makeInsertSql('certificate', data);
        const values = Object.keys(data).map(e => data[e]);

        // return the promise from this.runSql()
        return this.runSql(sql, values);
    }


    /**
     * update specified record in table with provided data
     * @param table
     * @param id
     * @param data
     * @returns {Promise}
     */
    async updateRecord(table, id, data) {
        const sql = this.makeUpdateSql(table, id, data);
        const values = Object.keys(data).map(e => data[e]);

        return this.runSql(sql, values);
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
        let where = '';
        let orderby = '';

        if(Array.isArray(fields)) {
            fields = fields.join(',');
        }

        if(filter) {
            for(let i=0; i<Object.keys(filter).length; i++) {
                const field = Object.keys(filter)[i];
                const value = filter[field];
                if(i==0) {
                    where += `WHERE ${field}='${value}' `;
                } else {
                    where += `AND ${field}='${value}' `;
                }
            }
        }

        if(sort) {
            orderby = 'ORDER BY ' + sort.join(',');
        }

        return `SELECT ${fields} FROM ${table} ${where} ${orderby}`;
    }

    /**
     * forms an INSERT sql statement for the specified table from the data object
     * @param {String} table  table name to insert
     * @param {Object} data   data object having field names as keys
     * @returns {String}  SQL statement string
     */
    makeInsertSql(table, data) {
        const fields = Object.keys(data);      // extract field names from data object
        const field_str = fields.join(',');     // join field names into field list string
        let qs = '?,'.repeat(fields.length); // prepare ? place holders for each field name
        qs = qs.slice(0,-1);                  // remove last , from list
        return `INSERT INTO ${table} (${field_str}) VALUES (${qs})`;
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
        const update_set = [];
        Object.keys(data).forEach(field => {
            update_set.push( `${field} = ? ` );
        })
        const update_str = update_set.join(', ');

        // build pk field
        const pk_field = `${table}_id`;

        return `UPDATE ${table} SET ${update_str} WHERE ${pk_field} = ${id}`;
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
                    console.error("ERROR in runSql ", err);
                    reject(err );
                } else {

                    // set valid flag to false if data was changed
                    if(this.changes) {
                        this.initialized=false;
                    }

                    resolve( {
                        lastID: this.lastID,
                        changes: this.changes,
                        params : params,
                        msg: sql.substr(0, 50) + '...  OK'} );
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
                    reject( err );
                } else { 
                    resolve( rows );
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
                    reject( err );
                } else { 
                    resolve( row );
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
        return this.runSql(`DELETE FROM ${table}`);
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
                                this.purgeTable('config').then(
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