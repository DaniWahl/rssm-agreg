/**
 * db_create.js
 *
 * runs DDL statements to generate the RSSMShares SQLite database.
 *
 */



const RSSMShares = require('../lib/RSSMShares').RSSMShares;
const Helpers = require('../lib/app.helpers');

const SETTINGS = require('../settings');
const DB_CREATE_WRITE_MODE = 6;

//create RSSMShares object
const rssmShares = new RSSMShares(SETTINGS.dbpath, DB_CREATE_WRITE_MODE);
const tables = [];
const indices = [];


// 1. create table PERSON
tables.push(`CREATE TABLE person (
    person_id       INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    a_code          TEXT,
    f_code          TEXT,
    family          TEXT,
    name            TEXT,
    first_name      TEXT,
    address         TEXT,
    post_code       TEXT,
    city            TEXT,
    salutation      TEXT,
    correspondence  INTEGER,
    status          TEXT,
    last_update     TEXT,
    comment         TEXT
)`);
indices.push(`CREATE INDEX person_i2 ON person(a_code)`);
indices.push(`CREATE INDEX person_i3 ON person(correspondence)`);


// 2. create table SHARE
tables.push(`CREATE TABLE share (
    share_id        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    certificate_id  INTEGER,
    share_no        INTEGER NOT NULL UNIQUE,
    type            TEXT NOT NULL,
    value           REAL NOT NULL,
    emission_date   TEXT NOT NULL
)`);
indices.push(`CREATE INDEX share_i1 ON share(certificate_id)`);
indices.push(`CREATE INDEX share_i2 ON share(share_no)`);
// certificate_id references the currently valid certificate.
// integrity is not enforced with a foreign key to avoid issues when purging the database


// 3. create table CERTIFICATE
tables.push(`CREATE TABLE certificate (
    certificate_id   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    person_id        INTEGER NOT NULL,
    share_id         INTEGER NOT NULL,
    journal_id       INTEGER,
    a_first_name     TEXT,
    a_name           TEXT,
    transaction_date TEXT,
    generation       INTEGER,
    status           TEXT,
    FOREIGN KEY (person_id) REFERENCES person(person_id),
    FOREIGN KEY (share_id) REFERENCES share(share_id)
)`);
indices.push(`CREATE INDEX certificate_i1 ON certificate(person_id)`);
indices.push(`CREATE INDEX certificate_i2 ON certificate(share_id)`);
indices.push(`CREATE INDEX certificate_i3 ON certificate(journal_id)`);
indices.push(`CREATE INDEX certificate_i4 ON certificate(transaction_date)`);


// 4. create table JOURNAL
tables.push(`CREATE TABLE journal (
    journal_id           INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    person_id            INTEGER,
    journal_no           TEXT NOT NULL UNIQUE,
    journal_date         TEXT NOT NULL,
    checked              TEXT,
    a_code               TEXT,
    name                 TEXT,
    shares               TEXT,
    transaction_type     TEXT,
    action               TEXT,
    sold                 INTEGER,
    repurchased          INTEGER,
    win                  REAL,
    value_in             REAL,
    value_out            REAL,
    share_stock          INTEGER,
    balance_account_1130 REAL,
    balance_bcl          REAL,
    booking_no           TEXT,
    booking_date         TEXT,
    vr_protocol_date     TEXT,
    comment              TEXT,
    FOREIGN KEY (person_id) REFERENCES person(person_id)
)`);
indices.push(`CREATE INDEX journal_i1 ON journal(person_id)`);
indices.push(`CREATE INDEX journal_i2 ON journal(journal_no)`);
indices.push(`CREATE INDEX journal_i3 ON journal(journal_date)`);


// 5. create table SHARE_CHUNK
tables.push(`CREATE TABLE share_chunk (
    share_chunk_id   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    share_id         INTEGER NOT NULL,
    journal_id       INTEGER NOT NULL,
    FOREIGN KEY (share_id) REFERENCES share(share_id),
    FOREIGN KEY (journal_id) REFERENCES journal(journal_id)
)`);
indices.push(`CREATE INDEX share_chunk_i1 ON share_chunk(share_id)`);
indices.push(`CREATE INDEX share_chunk_i2 ON share_chunk(journal_id)`);


// 6. create table CONFIG
tables.push(`CREATE TABLE config (
    param  TEXT NOT NULL PRIMARY KEY,
    value  TEXT 
)`);

// 7. create table SHARE_SERIES
tables.push(`CREATE TABLE share_series (
    series_id     INTEGER NOT NULL PRIMARY KEY UNIQUE,
    emission_date TEXT NOT NULL,
    start_no      INTEGER NOT NULL,
    end_no        INTEGER NOT NULL,
    shares        INTEGER NOT NULL,
    shares_value  INTEGER NOT NULL,
    nv_shares     INTEGER NOT NULL,
    nv_value      INTEGER NOT NULL
)`);


// run SQL statements 
const tablePromises = [];
tables.forEach(tablesql => {
    // initiates all table sqls and stores the returned promises
    tablePromises.push(rssmShares.runSql(tablesql));
});


Promise.all(tablePromises)
    .then(msgs => {

        // log table creation logs
        msgs.forEach(msg => {
            console.log(msg.msg);
        });

        // all tables created, now run all index creations
        indices.forEach(indexsql => {
            rssmShares.runSql(indexsql)
                .then(msg => {
                    console.log(msg.msg);
                });

        });

        // setting db creation date
        rssmShares.setConfig('DB_CREATION', Helpers.dateToDbString());
        rssmShares.setConfig('VERSION', SETTINGS.version);
        rssmShares.setConfig('DB_PATH', SETTINGS.dbpath);


    })
    .catch(err => {
        console.error(err);
    });
