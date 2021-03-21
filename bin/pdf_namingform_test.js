const RSSMDocs = require('../lib/RSSMDocs');
const RSSMShares = require('../lib/RSSMShares').RSSMShares
const helpers = require('../lib/app.helpers');


makeForm()


async function makeForm() {
    const configSet = 'dev' 
    const configFile = "C:\\Users\\Dani\\AppData\\Roaming\\aktienregister-rssm\\config.json"

    const info = {
        salutation: 'Herr',
        first_name: 'Max',
        name: 'Mustermann',
        address: 'Musterweg 123',
        post_code: '1234',
        city: 'Musterhausen',
        a_code: 'A00000',
        family: 'Mustermann',
        purchase_date: '2021-02-27',
        comment: 'Die Aktien wurden für den Aktionär reserviert. Es wurden keine Zertifikate ausgestellt\n',
        journal_no: '21-000' + new Date().getTime(),
        journal_id: 900,
        shares: [ '000' ]
    }
    
    // initialize main RSSMShares object
    rssm = new RSSMShares(configFile, configSet)
    await rssm.init()

    const naming_form_path = await RSSMDocs.makeNamingForm(info, rssm);
}