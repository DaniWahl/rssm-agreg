const PDFDoc = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Helpers = require('./app.helpers');


const cont = {continued: true};
const center = {align: 'center'};
const right = {align: 'right'};
const vbar = String.fromCharCode(179);
const assetPath = __dirname.replace('lib', 'assets') + '/';  // set variable where to find image and font assets



/**
 * generate a journal pdf document for mutation
 * @param info
 * @param rssm
 * @returns {Promise<any>}
 */
function makeJournalMutation(info, rssm) {
    return new Promise(async function(resolve, reject) {

        // get configuration values
        const exportPath = rssm.config.get('documentpath');
        const ag_register = await rssm.getConfig('AG_REGISTER');
        const ag_register_city = await rssm.getConfig('AG_REGISTER_CITY');

        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_${info.new_name}_Journal_${info.journal_no}.pdf`);
        const props = getDocProps();
        props.margins = {top: mm(14), left: 0, right: 0};
        const doc = new PDFDoc(props);
        const writeStream = fs.createWriteStream(docPath);
        doc.pipe(writeStream);

        registerFonts(doc);

        const formLabel = {
            width: mm(85),
            align: 'right'
        };

        // Header
        doc.font('Arial')
            .fontSize(12)
            .text('Aktiengesellschaft   ', mm(20), mm(14), cont);
        doc.font('Arial Bold')
            .text('Schulgebäude Rudolf Steiner Schule Münchenstein')
            .moveDown();

        doc.fontSize(30)
            .text('Mutation', mm(20), mm(35));

        // Journal No Box
        doc.rect(mm(135), mm(30), mm(45), mm(15))
            .stroke()
            .font('Arial')
            .fontSize(8)
            .text('Journal Nr', mm(165), mm(30));

        // Form
        doc.font('Arial Bold')
            .fontSize(10)
            .text('Alte Adresse', mm(20), mm(60))
            .font('Arial')
            .text('Name, Vorname', mm(0), mm(60), formLabel)
            .text('Strasse, Nr.', 0, mm(70), formLabel)
            .text('PLZ, Ort', 0, mm(80), formLabel)
            .text('A-Code', 0, mm(90), formLabel)
            .text('Korrespondenz', 0, mm(100), formLabel)
        ;

        doc.font('Arial Bold')
            .fontSize(10)
            .text('Neue Adresse', mm(20), mm(120))
            .font('Arial')
            .text('Name, Vorname', mm(0), mm(120), formLabel)
            .text('Strasse, Nr.', 0, mm(130), formLabel)
            .text('PLZ, Ort', 0, mm(140), formLabel)
            .text('Korrespondenz', 0, mm(150), formLabel);


        doc.fontSize(10);
        doc.text('Kommentar', mm(0), mm(170), formLabel);


        doc.font('Arial Bold')
            .fontSize(10)
            .text('Abschluss', mm(20), mm(260))
            .font('Arial')
            .text(ag_register_city + ',', mm(0), mm(260), formLabel);

        doc.font('Arial Italic')
            .fontSize(8)
            .text(ag_register, mm(140), mm(269));


        // lines
        doc.lineWidth(1);
        doc.strokeColor('black', 0.2);
        doc.moveTo(mm(90), mm(67)).lineTo(mm(180), mm(67)).stroke();
        doc.moveTo(mm(90), mm(77)).lineTo(mm(180), mm(77)).stroke();
        doc.moveTo(mm(90), mm(87)).lineTo(mm(180), mm(87)).stroke();
        doc.moveTo(mm(90), mm(97)).lineTo(mm(180), mm(97)).stroke();
        doc.moveTo(mm(90), mm(107)).lineTo(mm(180), mm(107)).stroke();

        doc.moveTo(mm(90), mm(127)).lineTo(mm(180), mm(127)).stroke();
        doc.moveTo(mm(90), mm(137)).lineTo(mm(180), mm(137)).stroke();
        doc.moveTo(mm(90), mm(147)).lineTo(mm(180), mm(147)).stroke();
        doc.moveTo(mm(90), mm(157)).lineTo(mm(180), mm(157)).stroke();

        doc.moveTo(mm(90), mm(177)).lineTo(mm(180), mm(177)).stroke();
        doc.moveTo(mm(90), mm(187)).lineTo(mm(180), mm(187)).stroke();
        doc.moveTo(mm(90), mm(197)).lineTo(mm(180), mm(197)).stroke();
        doc.moveTo(mm(90), mm(207)).lineTo(mm(180), mm(207)).stroke();


        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke();


        // Fill form with data
        doc.font('Arial Italic')
            .fontSize(20)
            .fillColor('blue')
            .text(info.journal_no, mm(145), mm(34));

        doc.fontSize(12)
            .text(`${info.old_name} ${info.old_first_name}`,mm(100), mm(60))
            .text(info.old_address, mm(100), mm(70))
            .text(`${info.old_post_code} ${info.old_city}`, mm(100), mm(80))
            .text(info.a_code, mm(100), mm(90))
            .text(info.old_correspondence ? 'aktiv' : 'nicht aktiv', mm(100), mm(100));


        doc.fontSize(12)
            .text(`${info.new_name} ${info.new_first_name}`,mm(100), mm(120))
            .text(info.new_address, mm(100), mm(130))
            .text(`${info.new_post_code} ${info.new_city}`, mm(100), mm(140))
            .text(info.new_correspondence  ? 'aktiv' : 'nicht aktiv', mm(100), mm(150));

        doc.fontSize(12)
            .text(info.comment, mm(100), mm(170))
            .text(Helpers.dateToString(), mm(100), mm(260));



        doc.end();

        writeStream.on('error', function(err) {
            console.log('ERROR: failed to write document: ', err);
            reject(err);
        });

        // wait on returning the path until the stream is finished
        writeStream.on('finish', function() {
            console.log('stream finished, returning path:', docPath);
            resolve(docPath);
        });

    });
}


/**
 * generate a transfer journal pdf document (Übertrag)
 * @param info
 * @param rssm
 * @returns {Promise<any>}
 */
function makeJournalTransfer(info, rssm) {
    return new Promise(async function(resolve, reject) {

        // get configuration values
        const exportPath = rssm.config.get('documentpath');
        const ag_register = await rssm.getConfig('AG_REGISTER');
        const ag_register_city = await rssm.getConfig('AG_REGISTER_CITY');

        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_${info.new_name}_Journal_${info.journal_no}.pdf`);
        const props = getDocProps();
        props.margins = {top: mm(14), left: 0, right: 0};
        const doc = new PDFDoc(props);
        const writeStream = fs.createWriteStream(docPath);
        doc.pipe(writeStream);

        registerFonts(doc);

        const formLabel = {
            width: mm(85),
            align: 'right'
        };

        // Header
        doc.font('Arial')
            .fontSize(12)
            .text('Aktiengesellschaft   ', mm(20), mm(14), cont);
        doc.font('Arial Bold')
            .text('Schulgebäude Rudolf Steiner Schule Münchenstein')
            .moveDown();

        doc.fontSize(30)
            .text('Übertrag Aktien', mm(20), mm(35));

        // Journal No Box
        doc.rect(mm(135), mm(30), mm(45), mm(15))
            .stroke()
            .font('Arial')
            .fontSize(8)
            .text('Journal Nr', mm(165), mm(30));

        // Form
        doc.font('Arial Bold')
            .fontSize(10)
            .text('Aktionär/in ALT', mm(20), mm(60))
            .font('Arial')
            .text('Name, Vorname', mm(0), mm(60), formLabel)
            .text('Strasse, Nr.', 0, mm(70), formLabel)
            .text('PLZ, Ort', 0, mm(80), formLabel)
            .text('A-Code', 0, mm(90), formLabel);

        doc.font('Arial Bold')
            .fontSize(10)
            .text('Aktionär/in NEU', mm(20), mm(110))
            .font('Arial')
            .text('Name, Vorname', mm(0), mm(110), formLabel)
            .text('Strasse, Nr.', 0, mm(120), formLabel)
            .text('PLZ, Ort', 0, mm(130), formLabel)
            .text('A-Code', 0, mm(140), formLabel);

        doc.font('Arial Bold')
            .fontSize(10)
            .text('Aktien', mm(20), mm(160))
            .font('Arial')
            .text('Aktien Nummern', mm(0), mm(160), formLabel);

        doc.fontSize(10);
        doc.text('Kommentar', mm(0), mm(230), formLabel);


        doc.font('Arial Bold')
            .fontSize(10)
            .text('Abschluss', mm(20), mm(260))
            .font('Arial')
            .text( ag_register_city + ',', mm(0), mm(260), formLabel);

        doc.font('Arial Italic')
            .fontSize(8)
            .text(ag_register, mm(140), mm(269));


        // lines
        doc.lineWidth(1);
        doc.strokeColor('black', 0.2);
        doc.moveTo(mm(90), mm(67)).lineTo(mm(180), mm(67)).stroke();
        doc.moveTo(mm(90), mm(77)).lineTo(mm(180), mm(77)).stroke();
        doc.moveTo(mm(90), mm(87)).lineTo(mm(180), mm(87)).stroke();
        doc.moveTo(mm(90), mm(97)).lineTo(mm(180), mm(97)).stroke();

        doc.moveTo(mm(90), mm(117)).lineTo(mm(180), mm(117)).stroke();
        doc.moveTo(mm(90), mm(127)).lineTo(mm(180), mm(127)).stroke();
        doc.moveTo(mm(90), mm(137)).lineTo(mm(180), mm(137)).stroke();
        doc.moveTo(mm(90), mm(147)).lineTo(mm(180), mm(147)).stroke();

        doc.moveTo(mm(90), mm(167)).lineTo(mm(180), mm(167)).stroke();
        doc.moveTo(mm(90), mm(177)).lineTo(mm(180), mm(177)).stroke();
        doc.moveTo(mm(90), mm(187)).lineTo(mm(180), mm(187)).stroke();
        doc.moveTo(mm(90), mm(197)).lineTo(mm(180), mm(197)).stroke();
        doc.moveTo(mm(90), mm(207)).lineTo(mm(180), mm(207)).stroke();
        doc.moveTo(mm(90), mm(217)).lineTo(mm(180), mm(217)).stroke();

        doc.moveTo(mm(90), mm(237)).lineTo(mm(180), mm(237)).stroke();
        doc.moveTo(mm(90), mm(247)).lineTo(mm(180), mm(247)).stroke();

        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke();


        // Fill form with data

        // share number list
        let share_list = '';
        let share_numbers = '';
        for (let i = 0; i < info.shares.length; i++) {
            share_list += `${i + 1}.\n`;
            share_numbers += `${Helpers.pad0(info.shares[i], 3)}\n`;
        }

        doc.fontSize(12);
        doc.text(share_list, mm(90), mm(160), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        });


        doc.font('Arial Italic')
            .fontSize(20)
            .fillColor('blue')
            .text(info.journal_no, mm(145), mm(34));

        doc.fontSize(12)
            .text(`${info.old_name} ${info.old_first_name}`,mm(100), mm(60))
            .text(info.old_address, mm(100), mm(70))
            .text(`${info.old_post_code} ${info.old_city}`, mm(100), mm(80))
            .text(info.old_a_code, mm(100), mm(90));

        doc.fontSize(12)
            .text(`${info.new_name} ${info.new_first_name}`,mm(100), mm(110))
            .text(info.new_address, mm(100), mm(120))
            .text(`${info.new_post_code} ${info.new_city}`, mm(100), mm(130))
            .text(info.new_a_code, mm(100), mm(140));

        doc.fontSize(12)
            .text(info.comment, mm(100), mm(230))
            .text(Helpers.dateToString(), mm(100), mm(260));


        doc.text(share_numbers, mm(100), mm(160), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5)
        });


        doc.end();

        writeStream.on('error', function(err) {
            console.log('ERROR: failed to write document: ', err);
            reject(err);
        });

        // wait on returning the path until the stream is finished
        writeStream.on('finish', function() {
            console.log('stream finished, returning path:', docPath);
            resolve(docPath);
        });

    });
}



/**
 * generate a repurchase journal pdf document
 * @param info
 * @param rssm
 * @returns {Promise<any>}
 */
function makeJournalRepurchase(info, rssm) {
    return new Promise(async function(resolve, reject) {

        // get configuration values
        const exportPath = rssm.config.get('documentpath');
        const ag_register = await rssm.getConfig('AG_REGISTER');
        const ag_register_city = await rssm.getConfig('AG_REGISTER_CITY');

        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_${info.name}_Journal_${info.journal_no}.pdf`);
        const props = getDocProps();
        props.margins = {top: mm(14), left: 0, right: 0};
        const doc = new PDFDoc(props);
        const writeStream = fs.createWriteStream(docPath);
        doc.pipe(writeStream);

        registerFonts(doc);

        const formLabel = {
            width: mm(85),
            align: 'right'
        };

        // Header
        doc.font('Arial')
            .fontSize(12)
            .text('Aktiengesellschaft   ', mm(20), mm(14), cont);
        doc.font('Arial Bold')
            .text('Schulgebäude Rudolf Steiner Schule Münchenstein')
            .moveDown();

        doc.fontSize(30)
            .text('Rückkauf Aktien', mm(20), mm(35));

        doc.font('Arial')
            .fontSize(10)
            .text('durch den Schulverein RSSM', mm(20), mm(47))

        // Journal No Box
        doc.rect(mm(135), mm(30), mm(45), mm(15))
            .stroke()
            .font('Arial')
            .fontSize(8)
            .text('Journal Nr', mm(165), mm(30));

        // Form
        doc.font('Arial Bold')
            .fontSize(10)
            .text('Aktionär/in', mm(20), mm(60))
            .font('Arial')
            .text('Name', mm(0), mm(60), formLabel)
            .text('Vorname', 0, mm(70), formLabel)
            .text('Strasse, Nr.', 0, mm(80), formLabel)
            .text('PLZ, Ort', 0, mm(90), formLabel)
            .text('A-Code', 0, mm(100), formLabel)
            .text('Familie', 0, mm(110), formLabel);

        doc.font('Arial Bold')
            .fontSize(10)
            .text('Aktien', mm(20), mm(130))
            .font('Arial')
            .text('Aktien Nummern', mm(0), mm(130), formLabel);

        doc.fontSize(10);
        doc.text('Buchungs Datum', mm(0), mm(200), formLabel);
        doc.text('Kommentar', mm(0), mm(210), formLabel);


        doc.font('Arial Bold')
            .fontSize(10)
            .text('Abschluss', mm(20), mm(260))
            .font('Arial')
            .text(ag_register_city + ',', mm(0), mm(260), formLabel);

        doc.font('Arial Italic')
            .fontSize(8)
            .text(ag_register, mm(140), mm(269));


        // lines
        doc.lineWidth(1);
        doc.strokeColor('black', 0.2);
        doc.moveTo(mm(90), mm(67)).lineTo(mm(180), mm(67)).stroke();
        doc.moveTo(mm(90), mm(77)).lineTo(mm(180), mm(77)).stroke();
        doc.moveTo(mm(90), mm(87)).lineTo(mm(180), mm(87)).stroke();
        doc.moveTo(mm(90), mm(97)).lineTo(mm(180), mm(97)).stroke();
        doc.moveTo(mm(90), mm(107)).lineTo(mm(180), mm(107)).stroke();
        doc.moveTo(mm(90), mm(117)).lineTo(mm(180), mm(117)).stroke();

        doc.moveTo(mm(90), mm(137)).lineTo(mm(180), mm(137)).stroke();
        doc.moveTo(mm(90), mm(147)).lineTo(mm(180), mm(147)).stroke();
        doc.moveTo(mm(90), mm(157)).lineTo(mm(180), mm(157)).stroke();
        doc.moveTo(mm(90), mm(167)).lineTo(mm(180), mm(167)).stroke();
        doc.moveTo(mm(90), mm(177)).lineTo(mm(180), mm(177)).stroke();
        doc.moveTo(mm(90), mm(187)).lineTo(mm(180), mm(187)).stroke();


        doc.moveTo(mm(90), mm(207)).lineTo(mm(180), mm(207)).stroke();
        doc.moveTo(mm(90), mm(217)).lineTo(mm(180), mm(217)).stroke();
        doc.moveTo(mm(90), mm(227)).lineTo(mm(180), mm(227)).stroke();
        doc.moveTo(mm(90), mm(237)).lineTo(mm(180), mm(237)).stroke();
        doc.moveTo(mm(90), mm(247)).lineTo(mm(180), mm(247)).stroke();

        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke();


        // Fill form with data

        // share number list
        let share_list = '';
        let share_numbers = '';
        for (let i = 0; i < info.shares.length; i++) {
            share_list += `${i + 1}.\n`;
            share_numbers += `${Helpers.pad0(info.shares[i], 3)}\n`;
        }

        doc.fontSize(12);
        doc.text(share_list, mm(90), mm(130), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        });


        doc.font('Arial Italic')
            .fontSize(20)
            .fillColor('blue')
            .text(info.journal_no, mm(145), mm(34));

        doc.fontSize(12)
            .text(info.name, mm(100), mm(60))
            .text(info.first_name, mm(100), mm(70))
            .text(info.address, mm(100), mm(80))
            .text(`${info.post_code} ${info.city}`, mm(100), mm(90))
            .text(info.a_code, mm(100), mm(100))
            .text(info.family, mm(100), mm(110))
            .text(Helpers.dateToString(new Date(info.booking_date)), mm(100), mm(200))
            .text(Helpers.dateToString(new Date(info.journal_date)), mm(100), mm(260));


        doc.text(share_numbers, mm(100), mm(130), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5)
        });


        doc.end();

        writeStream.on('error', function(err) {
            console.log('ERROR: failed to write document: ', err);
            reject(err);
        });

        // wait on returning the path until the stream is finished
        writeStream.on('finish', function() {
            console.log('stream finished, returning path:', docPath);
            resolve(docPath);
        });

    });
}


/**
 * generate a sale journal pdf document
 * @param info
 * @param rssm
 * @returns {Promise<any>}
 */
function makeJournalSale(info, rssm ) {

    return new Promise(async function(resolve, reject) {

        // get configuration values
        const exportPath = rssm.config.get('documentpath');
        const ag_register = await rssm.getConfig('AG_REGISTER');
        const ag_register_city = await rssm.getConfig('AG_REGISTER_CITY');

        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_${info.name}_Journal_${info.journal_no}.pdf`);
        const props = getDocProps();
        props.margins = {top: mm(14), left: 0, right: 0};
        const doc = new PDFDoc(props);
        const writeStream = fs.createWriteStream(docPath);
        doc.pipe(writeStream);

        registerFonts(doc);

        const formLabel = {
            width: mm(85),
            align: 'right'
        };

        // Header
        doc.font('Arial')
            .fontSize(12)
            .text('Aktiengesellschaft   ', mm(20), mm(14), cont);
        doc.font('Arial Bold')
            .text('Schulgebäude Rudolf Steiner Schule Münchenstein')
            .moveDown();

        doc.fontSize(30)
            .text('Verkauf Aktien', mm(20), mm(35));

        // Journal No Box
        doc.rect(mm(135), mm(30), mm(45), mm(15))
            .stroke()
            .font('Arial')
            .fontSize(8)
            .text('Journal Nr', mm(165), mm(30));

        // Form
        doc.font('Arial Bold')
            .fontSize(10)
            .text('Aktionär/in', mm(20), mm(60))
            .font('Arial')
            .text('Name', mm(0), mm(60), formLabel)
            .text('Vorname', 0, mm(70), formLabel)
            .text('Strasse, Nr.', 0, mm(80), formLabel)
            .text('PLZ, Ort', 0, mm(90), formLabel)
            .text('A-Code', 0, mm(100), formLabel)
            .text('Familie', 0, mm(110), formLabel);

        doc.font('Arial Bold')
            .fontSize(10)
            .text('Aktien', mm(20), mm(130))
            .font('Arial')
            .text('Aktien Nummern', mm(0), mm(130), formLabel);

        doc.fontSize(10);
        doc.text('Buchungs Datum', mm(0), mm(200), formLabel);
        doc.text('Kommentar', mm(0), mm(210), formLabel);


        doc.font('Arial Bold')
            .fontSize(10)
            .text('Abschluss', mm(20), mm(260))
            .font('Arial')
            .text(ag_register_city + ',', mm(0), mm(260), formLabel);

        doc.font('Arial Italic')
            .fontSize(8)
            .text(ag_register, mm(140), mm(269));


        // lines
        doc.lineWidth(1);
        doc.strokeColor('black', 0.2);
        doc.moveTo(mm(90), mm(67)).lineTo(mm(180), mm(67)).stroke();
        doc.moveTo(mm(90), mm(77)).lineTo(mm(180), mm(77)).stroke();
        doc.moveTo(mm(90), mm(87)).lineTo(mm(180), mm(87)).stroke();
        doc.moveTo(mm(90), mm(97)).lineTo(mm(180), mm(97)).stroke();
        doc.moveTo(mm(90), mm(107)).lineTo(mm(180), mm(107)).stroke();
        doc.moveTo(mm(90), mm(117)).lineTo(mm(180), mm(117)).stroke();

        doc.moveTo(mm(90), mm(137)).lineTo(mm(180), mm(137)).stroke();
        doc.moveTo(mm(90), mm(147)).lineTo(mm(180), mm(147)).stroke();
        doc.moveTo(mm(90), mm(157)).lineTo(mm(180), mm(157)).stroke();
        doc.moveTo(mm(90), mm(167)).lineTo(mm(180), mm(167)).stroke();
        doc.moveTo(mm(90), mm(177)).lineTo(mm(180), mm(177)).stroke();
        doc.moveTo(mm(90), mm(187)).lineTo(mm(180), mm(187)).stroke();


        doc.moveTo(mm(90), mm(207)).lineTo(mm(180), mm(207)).stroke();
        doc.moveTo(mm(90), mm(217)).lineTo(mm(180), mm(217)).stroke();
        doc.moveTo(mm(90), mm(227)).lineTo(mm(180), mm(227)).stroke();
        doc.moveTo(mm(90), mm(237)).lineTo(mm(180), mm(237)).stroke();
        doc.moveTo(mm(90), mm(247)).lineTo(mm(180), mm(247)).stroke();

        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke();


        // Fill form with data

        // share number list
        let share_list = '';
        let share_numbers = '';
        for (let i = 0; i < info.shares.length; i++) {
            share_list += `${i + 1}.\n`;
            share_numbers += `${Helpers.pad0(info.shares[i], 3)}\n`;
        }

        doc.fontSize(12);
        doc.text(share_list, mm(90), mm(130), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        });


        doc.font('Arial Italic')
            .fontSize(20)
            .fillColor('blue')
            .text(info.journal_no, mm(145), mm(34));

        doc.fontSize(12)
            .text(info.name, mm(100), mm(60))
            .text(info.first_name, mm(100), mm(70))
            .text(info.address, mm(100), mm(80))
            .text(`${info.post_code} ${info.city}`, mm(100), mm(90))
            .text(info.a_code, mm(100), mm(100))
            .text(info.family, mm(100), mm(110))
            .text(Helpers.dateToString(new Date(info.purchase_date)), mm(100), mm(200))
            .text(info.comment, mm(100), mm(210))
            .text(Helpers.dateToString(), mm(100), mm(260));


        doc.text(share_numbers, mm(100), mm(130), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5)
        });


        doc.end();

        writeStream.on('error', function(err) {
            console.log('ERROR: failed to write document: ', err);
            reject(err);
        });

        // wait on returning the path until the stream is finished
        writeStream.on('finish', function() {
            console.log('stream finished, returning path:', docPath);
            resolve(docPath);
        });

    });
}

function makeCertificates(info, rssm) {

    return new Promise(async function(resolve, reject) {

        // get configuration values
        const exportPath = rssm.config.get('documentpath');

        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_${info.name}_Zertifikate_${info.journal_no}.pdf`);
        const props = getDocProps();
        props.margins = {top: mm(14), left: 0, right: 0};
        const doc = new PDFDoc(props);
        const writeStream = fs.createWriteStream(docPath);
        doc.pipe(writeStream);

        registerFonts(doc);


        // create one page per share
        for (let i=0; i<info.shares.length; i++) {


            // get share series info
            const series = rssm.getShareSeriesInfo(info.shares[i]);

            // image Linden
            doc.image(assetPath + 'linden.png', {
                fit : [mm(210), mm(100)],
                align: 'center',
                valign: 'center'
            });

            // Header
            doc.font('Arial')
                .fontSize(12)
                .text('Aktiengesellschaft', 0, mm(123), center);
            doc.font('Arial Bold')
                .text('Schulgebäude Rudolf Steiner Schule Münchenstein', center);
            doc.font('Arial')
                .text('In Münchenstein', center)
                .moveDown();

            // Kapital
            doc.text(`Aktienkapital erhöht auf Fr. ${series.capital}.-, eingeteilt in ${series.shares} Namenaktien`, center)
                .text(`(Stammaktien) im Nennwert von Fr. ${series.shares_value}.- und ${series.nv_shares} Namenaktien`, center)
                .text(`(Stimmrechtsaktien) im Nennwert von je Fr. ${series.nv_value}.-`, center)
                .moveDown(3);

            // Urkunden Nr & Name
            doc.text('Urkunde Nr.', mm(73), mm(167));
            doc.font('Arial Bold')
                .fontSize(16)
                .text(Helpers.pad0(info.shares[i], 3), 0, mm(166), center)
                .moveDown(1);

            doc.font('Arial')
                .fontSize(12)
                .text('über 1 Namenaktie (Stammaktie) im Nennwert von', center)
                .moveDown();

            doc.font('Arial Bold')
                .fontSize(16)
                .text(`Fr. ${series.shares_value}.-`, center);

            doc.font('Arial')
                .fontSize(12)
                .text('voll liberiert', center)
                .moveDown(2);

            doc.font('Arial Bold')
                .fontSize(16)
                .text(`${info.first_name} ${info.name}`, center)
                .moveDown(2);

            doc.moveTo(mm((210/2) - 60), mm(220))
                .lineTo(mm((210/2) + 60), mm(220))
                .moveTo(mm((210/2) - 60), mm(220 + 1))
                .lineTo(mm((210/2) + 60), mm(220 + 1))
                .stroke();

            // note
            doc.font('Arial')
                .fontSize(12)
                .text('ist mit dieser übertragungsbeschränkten Aktie an unserer', center)
                .text('Aktiengesellschaft mit allen gesetzlichen und statuarischen Rechten', center)
                .text('und Pflichten gemäss den jeweiligen aktuellen', center)
                .text('und im Handelsregister deponierten Statuten beteiligt.', center)
                .moveDown()
                .text(`4142 Münchenstein, den ${Helpers.dateToString(new Date(series.emission_date))}`, center)
                .text('Im Namen des Verwaltungsrates', center);

            if(i<info.shares.length-1) {
                doc.addPage();
            }
        }
        doc.end();


        writeStream.on('error', function(err) {
            console.log('ERROR: failed to write document: ', err);
            reject(err);
        });

        // wait on returning the path until the stream is finished
        writeStream.on('finish', function() {
            console.log('stream finished, returning path:', docPath);
            resolve(docPath);
        });

    });

}




function makeSharesLetter(info, rssm) {

    return new Promise(async function(resolve, reject) {

        // get configuration values
        const exportPath = rssm.config.get('documentpath');
        const ag_secretary = await rssm.getConfig('AG_SECRETARY');
        const ag_register = await rssm.getConfig('AG_REGISTER');
        const ag_register_init = await rssm.getConfig('AG_REGISTER_INITIALS');
        const ag_register_city = await rssm.getConfig('AG_REGISTER_CITY');



        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_${info.name}_Begleitbrief_${info.journal_no}.pdf`);
        const grammarSet = getGrammarSet(info.salutation);

        const doc = new PDFDoc(getDocProps());
        const writeStream = fs.createWriteStream(docPath);
        doc.pipe(writeStream);

        registerFonts(doc);


        // document header
        doc.image(assetPath + 'archs.png', mm(25), mm(14), {width: mm(30)});
        doc.font('Arial Bold')
            .fontSize(11)
            .text('AG Schulgebäude Rudolf Steiner Schule Münchenstein', mm(60), mm(33));

        // Address
        doc.text('Einschreiben', mm(25), mm(48));
        doc.font('Arial')
            .text(info.salutation + ' ' + info.first_name + ' ' + info.name)
            .text(info.address)
            .text(info.post_code + ' ' + info.city)
            .moveDown(2);


        // Date
        doc.text(ag_register_city + ', ' + Helpers.dateToString() + '/' + ag_register_init, mm(25))
            .moveDown(3);

        // Title
        doc.font('Arial Bold')
            .fontSize(12)
            .text('Ihre Aktien der AG Schulgebäude Rudolf Steiner Schule Münchenstein')
            .moveDown(2);

        // Salutation
        doc.font('Helvetica')
            .fontSize(11)
            .text(`Sehr ${grammarSet[0]} ` + info.salutation + ' ' + info.name)
            .moveDown();


        // P1
        doc.text('Wir freuen uns, dass Sie ', cont)
            .text(info.shares.length, cont)
            .text(' Aktien der Aktiengesellschaft Schulgebäude Rudolf Steiner Schule ', cont)
            .text('Münchenstein gezeichnet haben. Als Beilage finden Sie die auf ', cont)
            .text(grammarSet[1], cont)
            .text(' Namen lautenden Aktienurkunden. Sie sind als ', cont)
            .text(grammarSet[2], cont)
            .text(' der Aktien im Aktienbuch eingetragen und können als ', cont)
            .text(grammarSet[3], cont)
            .text(' die Ihnen nach Gesetz und Statuten zustehenden Rechte wahrnehmen.')
            .moveDown();

        // P2
        doc.text('Insbesondere werden Sie zu den Generalversammlungen der Aktionärinnen und Aktionäre eingeladen.')
            .moveDown();

        // P3
        doc.text('Die Übertragung der Namensaktien ist eingeschränkt und nur mit der Zustimmung ', cont)
            .text('des Verwaltungsrates möglich (vinkulierte Namensaktien). Die Regeln für den ', cont)
            .text('Rückkauf von Aktien durch die AG Schulgebäude RSSM entnehmen Sie bitte dem ', cont)
            .text('beiliegenden Infoblatt. Die Statuten der Aktiengesellschaft stellen wir ', cont)
            .text('Ihnen auf Anfrage gerne zu.')
            .moveDown();

        // P4
        doc.text('Wir bitten Sie, Ihre Aktienzertifikate sorgfältig aufzubewahren, die Eigentumsrechte sind an die Aktie gebunden.', {underline: true})
            .moveDown();

        doc.text('Für Fragen stehen wir Ihnen gerne zur Verfügung.').moveDown();
        doc.text('Freundliche Grüsse').moveDown();
        doc.text('für den Verwaltungsrat').moveDown(4);

        doc.text(ag_register, cont)
            .text(ag_secretary, mm(95));
        doc.text('VR, Aktienregister', cont)
            .text('VR, Sekretariat', mm(85))
            .moveDown(2);

        // Beilagen
        let shares_list = '';
        info.shares.forEach(no => {
            shares_list += Helpers.pad0(no, 3) + ' ';
        });

        doc.text('Beilagen', {underline: true})
            .text('Aktienurkunden Nr. ', cont)
            .text(shares_list)
            .text('Infoblatt Rückkauf Aktien');

        // Footer
        doc.text(`Gutenbergstrasse 1     4142 Münchenstein     Tel. 061 413 93 71     ag@rssm.ch     www.rssm.ch`,
            mm(25),
            doc.page.height - mm(25),
            {align: 'justify'});

        doc.moveTo(mm(61.5), mm(271))
            .lineTo(mm(61.5), mm(271 + 5))
            .moveTo(mm(100.75), mm(271))
            .lineTo(mm(100.75), mm(271 + 5))
            .moveTo(mm(137.5), mm(271))
            .lineTo(mm(137.5), mm(271 + 5))
            .moveTo(mm(165), mm(271))
            .lineTo(mm(165), mm(271 + 5))
            .stroke();


        doc.end();


        writeStream.on('error', function(err) {
            console.log('ERROR: failed to write document: ', err);
            reject(err);
        });

        // wait on returning the path until the stream is finished
        writeStream.on('finish', function() {
            console.log('stream finished, returning path:', docPath);
            resolve(docPath);
        });

    });

}


function makeAnnualReport(info, rssm) {
    return new Promise(async function(resolve, reject) {

        // get configuration values
        const exportPath = rssm.config.get('documentpath');
        const ag_register = await rssm.getConfig('AG_REGISTER');
        const ag_register_city = await rssm.getConfig('AG_REGISTER_CITY');

        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_Jahresbericht.pdf`);
        const props = getDocProps();
        props.margins = {top: mm(14), left: 0, right: 0};
        const doc = new PDFDoc(props);
        const writeStream = fs.createWriteStream(docPath);
        doc.pipe(writeStream);

        registerFonts(doc);

        const formLabel = {
            width: mm(85),
            align: 'right'
        };
        let page=1;


        const pageFooter = function() {
            doc.font('Arial')
                .fontSize(8)
                .fillColor('black')
                .text('Seite ' + page, mm(25), mm(280));
            page++;
        };

        const tableRow = function(data=[], header=false) {

            const colWidths = [mm(25), mm(25), mm(20), mm(30), mm(50), mm(20)];
            let x=0;
            let y=doc.y;

            if(y > mm(260)) {
                pageFooter();
                doc.addPage();
                tableRow(null, true);
                y = doc.y;
            }

            if(header) {
                data = ['Datum', 'Journal Nr', 'Transaktion', 'Name', 'Anzahl', 'Verfügbar'];
                doc.font('Arial Bold');
            } else {
                doc.font('Arial');
            }
            doc.fontSize(10);


            for(let i=0; i<data.length; i++) {
                x += colWidths[i];
                doc.text(data[i], x, y);
            }
            //doc.moveDown();
        };

        // document header
        doc.image(assetPath + 'archs.png', mm(25), mm(14), {width: mm(30)});
        doc.font('Arial Bold')
            .fontSize(11)
            .text('AG Schulgebäude Rudolf Steiner Schule Münchenstein', mm(60), mm(33));

        // Title
        doc.font('Arial Bold')
            .fontSize(14)
            .text('Bericht aus dem Aktienregister', mm(25), mm(48));

        // Summary headers
        doc.font('Arial Bold')
            .fontSize(10)
            .text('Aktienkapital:', mm(25), mm(60))
            .moveDown()
            .text('Aktien Verfügbar:')
            .moveDown()
            .text('Stand')
            .moveDown()
            .text('Transaktionen:');

        // Summary data
        doc.font('Arial')
            .text(`${info.shares_total} Namensaktien, CHF ${info.shares_kapital}.-`, mm(75), mm(60))
            .moveDown()
            .text(info.stock)
            .moveDown()
            .text(info.endDate)
            .moveDown()
            .text(`zwischen ${info.startDate} und ${info.endDate}`);



        // Table
        doc.moveDown(2);
        tableRow(null, true);
        for (let i in info.transactions) {
            const t = info.transactions[i];
            tableRow([t.transaction_date, t.journal_no, t.transaction_type, t.name, t.share_number, t.share_stock]);
        }


        if(doc.y > mm(250)) {
            doc.addPage();
        }


        doc.font('Arial')
            .fontSize(10)
            .text(ag_register_city + ',', mm(0), mm(260), formLabel);

        doc.font('Arial Italic')
            .fontSize(8)
            .text(ag_register, mm(140), mm(269));

        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke();

        doc.font('Arial Italic')
            .fillColor('blue')
            .fontSize(12)
            .text(Helpers.dateToString(), mm(100), mm(260));


        pageFooter();

        doc.end();


        writeStream.on('error', function(err) {
            console.log('ERROR: failed to write document: ', err);
            reject(err);
        });

        // wait on returning the path until the stream is finished
        writeStream.on('finish', function() {
            console.log('stream finished, returning path:', docPath);
            resolve(docPath);
        });
    });
}


/**
 * registers fonts in pdf file refering to ttf font files
 * @param doc
 */
function registerFonts(doc) {

    console.log("loading font files from " + assetPath);
    console.log()

    doc.registerFont('Arial', assetPath + 'Arial.ttf');
    doc.registerFont('Arial Bold', assetPath + 'Arial Bold.ttf');
    doc.registerFont('Arial Italic', assetPath + 'Arial Italic.ttf');
    doc.registerFont('Arial Bold Italic', assetPath + 'Arial Bold Italic.ttf');

}


/**
 * returns array of gender specific terms for letter
 * @param salutation
 * @returns {string[]}
 */
function getGrammarSet(salutation) {
    if(salutation.toLowerCase() === 'frau') {
        return ['geehrte', 'Ihren', 'Eigentümerin', 'Aktionärin'];
    }
    if(salutation.toLowerCase() === 'herr') {
        return ['geehrter', 'Ihren', 'Eigentümer', 'Aktionär'];
    }
    if(salutation.toLowerCase() === 'familie') {
        return ['geehrte', 'Ihre', 'Eigentümer', 'Aktionäre'];
    }

    return ['geehrte', 'Ihre', 'EigentümerIn', 'AktionärIn'];
}


/**
 * conversion of mm values into PDF Point units (72p/inch)
 * @param mm  millimeter value to
 * @returns  PDF points
 */
function mm(mm) {
    return (72 / 25.4) * mm;
}


/**
 * returns object with default pdf document properties
 * @returns {{size: *[], margins: {top: PDF, left: PDF, right: PDF, bottom: PDF}, layout: string, info: {Author: string, Subject: string}}}
 */
function getDocProps() {
    return {
        size: [mm(210), mm(297)],  // A4
        margins : {
            top: mm(17),
            left: mm(17),
            right: mm(17),
            bottom: mm(17)
        },
        layout: 'portrait',
        info: {
            Author: 'Daniel Wahl',
            Subject: 'AG Schulgebäude RSSM'
        }
    };
}

exports.makeSharesLetter = makeSharesLetter;
exports.makeCertificates = makeCertificates;
exports.makeJournalSale = makeJournalSale;
exports.makeJournalRepurchase = makeJournalRepurchase;
exports.makeJournalTransfer = makeJournalTransfer;
exports.makeJournalMutation = makeJournalMutation;
exports.makeAnnualReport = makeAnnualReport;
