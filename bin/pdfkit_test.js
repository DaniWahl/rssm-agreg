const makeSharesLetter = require('../lib/RSSMDocs').makeSharesLetter;
const makeCertificates = require('../lib/RSSMDocs').makeCertificates;
const makeJournalSale = require('../lib/RSSMDocs').makeJournalSale;
const makeJournalTransfer = require('../lib/RSSMDocs').makeJournalTransfer;
const makeJournalMutation = require('../lib/RSSMDocs').makeJournalMutation;


const electron = require('electron');
const {shell} = electron;
const init = require('../lib/RSSMDocs').init;


const info = {
    salutation : 'Herr',
    first_name : 'Matthias',
    name : 'Walther',
    address: 'Hardstrasse 40',
    post_code : '4142',
    city: 'Münchenstein',
    a_code : '1073',
    family : 'Walther',
    purchase_date : '2018-06-04',
    comment : 'Kinder: Jerome Portmann, Noemi Portmann',
    origin : 'Muttenz',
    initials : 'DW',
    journal_no : '18-052',
    shares: [635, 636, 637, 638, 641, 642, 656, 657, 658]

};



const info_transfer = {
    old_name : 'Wahl',
    old_first_name : 'Daniel',
    old_address : 'Tramstrasse 27',
    old_post_code : '4132',
    old_city : 'Muttenz',
    old_a_code : '98w933',
    new_name : 'Garcia',
    new_first_name : 'Elisa',
    new_address : 'Tramstrasse 27_',
    new_post_code : '4132_',
    new_city : 'Muttenz_',
    new_a_code : '9298472',
    comment : 'Test Kommentar',
    journal_no : '18-058',
    journal_id : 123,
    shares: [635, 636, 637, 638, 641]

};


const info_mutation = {
    old_name : 'Wahl',
    old_first_name : 'Daniel',
    old_address : 'Zollweidenstrasse 21',
    old_post_code : '4142',
    old_city : 'Münchenstein',
    old_correspondence : 1,
    a_code : '98w933',
    new_name : 'Wahl',
    new_first_name : 'Daniel',
    new_address : 'Tramstrasse 27',
    new_post_code : '4132',
    new_city : 'Muttenz',
    new_correspondence : 0,
    comment : 'Test Kommentar',
    journal_no : '18-059',
    journal_id : 126

};

makeDocs();



async function makeDocs() {

    // await init();
    // const cert_doc = await makeCertificates(info);
    // await makeSharesLetter(info);
    // await makeJournalSale(info);

    // await makeJournalTransfer(info_transfer);

    await makeJournalMutation(info_mutation);

}
