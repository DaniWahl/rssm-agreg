const makeExampleDoc = require('../lib/RSSMDocs').makeExampleDoc;
const Helpers = require('../lib/app.helpers');



const info = {
    filePath : './data/example.pdf',
    salutation : 'Frau',
    first_name : 'Vivane',
    name : 'Sacher',
    address: 'Heiligholzstrasse 42',
    post_code : '4142',
    city: 'Münchenstein',
    origin : 'Muttenz',
    initials : 'DW',
    date : Helpers.dateToString(),
    shares: [877, 878, 879, 880, 881, 882]

};


makeExampleDoc(info);