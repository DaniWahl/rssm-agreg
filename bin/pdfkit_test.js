const makeSharesLetter = require('../lib/RSSMDocs').makeSharesLetter;
const makeCertificates = require('../lib/RSSMDocs').makeCertificates;
const makeJournalSale = require('../lib/RSSMDocs').makeJournalSale;

const init = require('../lib/RSSMDocs').init;



const info = {
    salutation : 'Frau',
    first_name : 'Vivane',
    name : 'Sacher',
    address: 'Heiligholzstrasse 42',
    post_code : '4142',
    city: 'Münchenstein',
    a_code : '1069',
    family : 'Sacher',
    purchase_date : '2018-05-02',
    comment : '6 Aktien',
    origin : 'Muttenz',
    initials : 'DW',
    journal_no : '18-047',
    shares: [877, 878, 879, 880, 881, 882, 3]

};

makeDocs();




async function makeDocs() {

    await init();
    await makeCertificates(info);
    await makeSharesLetter(info);
    await makeJournalSale(info);

}
