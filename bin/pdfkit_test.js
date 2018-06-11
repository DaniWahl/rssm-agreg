const makeSharesLetter = require('../lib/RSSMDocs').makeSharesLetter;
const makeCertificates = require('../lib/RSSMDocs').makeCertificates;



const info = {
    salutation : 'Frau',
    first_name : 'Vivane',
    name : 'Sacher',
    address: 'Heiligholzstrasse 42',
    post_code : '4142',
    city: 'Münchenstein',
    origin : 'Muttenz',
    initials : 'DW',
    shares: [877, 878, 879, 880, 881, 882, 3]

};

makeDocs();


async function makeDocs() {

    await makeCertificates(info);
    await makeSharesLetter(info);

}
