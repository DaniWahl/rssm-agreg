
const RSSMShares = require('../lib/RSSMShares').RSSMShares
const RSSMDBPATH = '../db/agregRSSM_test.db'


//create RSSMShares object
const rssmShares = new RSSMShares(RSSMDBPATH)



// purge database
rssmShares.purgeDatabase()
.then(msg => {
    console.log(msg)
}) 
.catch(err => {
    throw(err)
})

