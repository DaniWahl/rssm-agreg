const DBConnection = require('../lib/DBConnection').DBConnection
const ShareCollection = require('../lib/ShareCollection').ShareCollection



const RSSM_DB_PATH = '../db/agregRSSM_test.db'


// setup some test data
const shares_no = [623, 624, 625, 626]
const a_code_wahl = '928001'
const a_code_rssm = '999010'

const rssm = new RSSM( RSSM_DB_PATH )

run()



async function run() {


    // await rssm.init()
    //
    //
    // const shares = rssm.getShares(shares_no)
    // console.log(shares)
    //
    // const rssm_shareholder = rssm.getShareHolder(a_code_rssm)
    // console.log(rssm_shareholder)
    //
    // const me = rssm.getShareHolder(a_code_wahl)
    // console.log(me)
    //
    //
    // const journal_no = rssm.getLastJournalNo()
    // console.log(journal_no)
    //
    //
    // const next_journal_no = rssm.getNextJournalNo()
    // console.log(next_journal_no)
    //
    //
    // console.log(rssm.today)
    //
    // console.log(rssm.getRSSMHolder())
    //
    // console.log(rssm.getShareStock())
    //
    //
    // console.log("current shareholders ", rssm.getCurrentShareHolders().length )
}






