const PDFDoc = require('pdfkit');
const fs = require('fs');

// will use this for continued lines
const cont = {continued: true};
const vbar = String.fromCharCode(179);


function makeExampleDoc(info) {


    const doc = new PDFDoc(getDocProps());
    doc.pipe(fs.createWriteStream(info.filePath));



    // document header
    doc.image('assets/archs.png', mm(25), mm(14), {width: mm(30)});
    doc.font('Helvetica-Bold')
        .fontSize(11)
        .text('AG Schulgebäude Rudolf Steiner Schule Münchenstein', mm(60), mm(33));

    // Address
    doc.text('Einschreiben', mm(115), mm(48));
    doc.font('Helvetica')
        .text(info.salutation + ' ' + info.first_name + ' ' + info.name)
        .text(info.address)
        .text(info.post_code + ' ' + info.city)
        .moveDown(2);


    // Date
    doc.text(info.origin + ', ' + info.date + '/DW', mm(25))
        .moveDown(3);

    // Title
    doc.font('Helvetica-Bold')
        .fontSize(12)
        .text('Ihre Aktien der AG Schulgebäude Rudolf Steiner Schule Münchenstein')
        .moveDown(2);

    // Salutation
    // 2DO: respect gender gramar
    doc.font('Helvetica')
        .fontSize(11)
        .text('Sehr geehrte ' + info.salutation + ' ' + info.name)
        .moveDown();


    // P1
    doc.text('Wir freuen uns, dass Sie ', cont)
        .text(info.shares.length, cont)
        .text(' Aktien der Aktiengesellschaft Schulgebäude Rudolf Steiner Schule ', cont)
        .text('Münchenstein gezeichnet haben. Als Beilage finden Sie die auf ', cont)
        .text('Ihren ', cont)
        .text('Namen lautenden Aktienurkunden. Sie sind als ', cont)
        .text('Eigentümerin ', cont)
        .text('der Aktien im Aktienbuch eingetragen und können als ', cont)
        .text('Aktionärin ', cont)
        .text('die Ihnen nach Gesetzt und Statuten zustehenden Rechte wahrnehmen.')
        .moveDown();

    // P2
    doc.text('Insbesondere werden Sie zu den Generalversammlungen der Aktionärinnen und Aktionäre eingeladen.')
        .moveDown();

    // P3
    doc.text('Die Übertragung der Namensaktion ist eingeschränkt und nur mit der Zustimmung ', cont)
        .text('des Verwaltungsrates möglich (vinkulierte Namensaktien). Die Regeln für den ', cont)
        .text('Rückkauf von Aktien durch die AG Schulgebäude RSSM entnehmen Sie bitte dem ', cont)
        .text('beiliegenden Infoblatt. Die Statuten der Aktiengesellschaft stellen wir ', cont)
        .text('Ihnen auf Anfrage gerne zu.')
        .moveDown();

    // P4
    doc.text('Wir bitten Sie, Ihre Aktienzertifikate sorgfältig aufzubewahren, die Eigentumsrechte sind and die Aktie gebunden.', {underline: true})
        .moveDown();

    doc.text('Für Fragen stehen wir Ihnen gerne zur Verfügung.').moveDown();
    doc.text('Freundliche Grüsse').moveDown();
    doc.text('für den Verwaltungsrat').moveDown(4);

    doc.text('Daniel Wahl', cont)
        .text('Ruth Andrea', mm(95));
    doc.text('VR, Aktienregister', cont)
        .text('VR, Sekretariat', mm(85))
        .moveDown(2);

    // Beilagen
    doc.text('Beilagen', {underline: true})
        .text('Aktienurkunden Nr. ', cont)
        .text(info.shares.toString())
        .text('Infoblatt Rückkauf Aktien');

    // Footer  (2DO: bars are not displayed correctly)
    doc.text(`Gutenbergstrasse 1  │  4142 Münchenstein  │  Tel. 061 413 93 71  │  ag@rssm.ch  │  www.rssm.ch`,
        mm(25),
        doc.page.height - mm(25),
        {align: 'center'});


    doc.end();

}

/**
 * conversion of mm values into PDF Point units (72p/inch)
 * @param mm  millimeter value to
 * @returns  PDF points
 */
function mm(mm) {
    return (72 / 25.4) * mm;
}

function getDocProps() {
    return {
        size: [mm(210), mm(297)],  // A4
        margins : {
            top: mm(17),
            left: mm(25),
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

exports.makeExampleDoc = makeExampleDoc;