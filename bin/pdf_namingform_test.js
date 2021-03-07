const RSSMDocs = require('../lib/RSSMDocs');
const RSSMShares = require('../lib/RSSMShares').RSSMShares
const helpers = require('../lib/app.helpers');


makeDoc()


async function makeDoc() {
    const configSet = 'dev' 
    const configFile = "C:\\Users\\Dani\\AppData\\Roaming\\aktienregister-rssm\\config.json"

    const info = {
        salutation: 'Herr',
        first_name: 'Daniel',
        name: 'Wahl',
        address: 'Tramstrasse 27',
        post_code: '4132',
        city: 'Muttenz',
        a_code: '928001',
        family: 'Wahl, Garcia',
        purchase_date: '2021-02-27',
        comment: 'Die Aktien wurden f├╝r den Aktion├ñr reserviert. Es wurden keine Zertifikate ausgestellt\n' + 'test',
        journal_no: '21-021' + new Date().getTime(),
        journal_id: 900,
        shares: [ '128' ]
    }
    
    // initialize main RSSMShares object
    rssm = new RSSMShares(configFile, configSet)
    await rssm.init()

    const naming_form_path = await RSSMDocs.makeNamingForm(info, rssm);
}