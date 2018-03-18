const RSSMShares = require('../lib/db.rssm.shares').RSSMShares
const RSSMDBPATH = '../db/agregRSSM_test.db'         // path to sqlite database
const rssm = new RSSMShares(RSSMDBPATH)



// setup some test data
const shares_no = [623, 624, 625, 626]
const a_code_wahl = '918001'
const a_code_rssm = '999010'


rssm.init().then(s => { console.log(s) })


//const p = rssm.changeShareOwner(shares_no, a_code_wahl, a_code_rssm, 'repurchase')

