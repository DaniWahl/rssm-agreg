


const SETTINGS = require('../settings');
const RSSMShares = require('../lib/RSSMShares').RSSMShares;


//create RSSMShares object
const rssmShares = new RSSMShares(SETTINGS.dbpath);



// purge database
rssmShares.purgeDatabase()
.then(msg => {
    console.log(msg)
}) 
.catch(err => {
    throw(err)
});

