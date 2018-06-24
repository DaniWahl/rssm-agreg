const makeSharesLetter = require('../lib/RSSMDocs').makeSharesLetter;
const makeCertificates = require('../lib/RSSMDocs').makeCertificates;
const makeJournalSale = require('../lib/RSSMDocs').makeJournalSale;


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

makeDocs();




async function makeDocs() {

    await init();
    const cert_doc = await makeCertificates(info);
    await makeSharesLetter(info);
    await makeJournalSale(info);


    console.log('opening item ', cert_doc);
    console.log(shell);

    shell.openItem(cert_doc);

}
