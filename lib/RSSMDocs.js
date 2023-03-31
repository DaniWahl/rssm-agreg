const PDFDoc = require("pdfkit")
const fs = require("fs")
const path = require("path")
const Helpers = require("./app.helpers")
const { dash, lineTo } = require("pdfkit")

const cont = { continued: true }
const center = { align: "center" }
const right = { align: "right" }
const left = { align: "left" }
const vbar = String.fromCharCode(179)
const assetPath = __dirname.replace("lib", "assets") + "/" // set variable where to find image and font assets

/**
 * generate shares naming form
 * @param {Object} info
 * @param {Object} rssm
 */
function makeNamingForm(info, rssm) {
    return new Promise(async function (resolve, reject) {
        // get configuration values
        const exportPath = rssm.config.get("documentpath")
        const register_admins = rssm.getAdminInfo()

        console.log(info)
        const purchase_date_str = Helpers.dateToString(Helpers.dbStringToDate(info.purchase_date))

        // generate document
        const docPath = path.join(
            exportPath,
            `${Helpers.dateToDbString()}_${info.name}_Benennungsformular_${info.journal_no}.pdf`
        )
        const props = getDocProps(rssm)
        props.margins = { top: mm(14), left: 10, right: 17 }
        const doc = new PDFDoc(props)
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)
        registerFonts(doc)

        const tableRow = function (labels, y, n = 1) {
            const left = mm(25)
            const width = mm(160)
            const height = n * mm(5)
            const cols = labels.length
            const col_width = Math.round(width / cols)
            let col_left = left

            doc.lineWidth(1)
            doc.strokeColor("black", 0.8)

            for (let i = 0; i < cols; i++) {
                doc.rect(col_left, y, col_width, height)
                    .stroke()
                    .text(labels[i], col_left + mm(2), y)
                col_left = col_left + col_width
            }
        }

        // document header
        doc.image(path.join(assetPath, "images", "header_color_1.png"), mm(25), mm(14), { width: mm(165) })

        // Address
        doc.font("Arial Bold")
        doc.text("Ausgabe von Aktien und Benennung der Aktionäre", mm(25), mm(55)).moveDown(1)
        doc.font("Arial")
            .fontSize(10)
            .text("Der/die Unterzeichnete/n haben am ", cont)
            .font("Arial Bold")
            .text(purchase_date_str, cont)
            .font("Arial")
            .text(" dem Schulverein Rudolf Steiner Schule Münchenstein")
            .font("Arial Bold Italic")
            .text(`CHF ${info.shares.length * 1000}.-- `, cont)
            .font("Arial")
            .text(" überwiesen.", cont)
            .text(" Für diesen Betrag sollen ", cont)
            .font("Arial Bold Italic")
            .text(` ${info.shares.length} `, cont)
            .font("Arial")
            .text(" Namensaktien zu je CHF 1000.- der Aktiengesellschaft")
            .text("Schulgebäude Rudolf Steiner Schule Münchenstein ausgegeben werden.")
            .moveDown()
            .text("Die Aktien sollen auf folgende/n Namen ausgestellt werden:")
            .moveDown()

        doc.fontSize(12)
        for (let i = 0; i < 3; i++) {
            tableRow(["Anzahl Aktien zu CHF 1000:", "\u25A1  elektronische Aktien (1)"], doc.y, 1)
            tableRow(["Name:", "Vorname:"], doc.y, 1)
            tableRow(["Strasse:", "PLZ, Ort:"], doc.y, 1)
            doc.moveDown()
        }
        doc.fontSize(10)

        doc.font("Arial Italic")
        doc.text(
            "(1):  Elektronische Aktien werden nur in elektronischer Form im Aktienregister erstellt. Sie erhalten keine ",
            mm(25),
            doc.y,
            cont
        ).text("gedruckten Aktienzertifikate auf Papier.")
        doc.text(
            "Bei mehreren Aktien haben Sie die Möglichkeit mehrere Aktieneigentümer zu benennen. Bitte beachten Sie ",
            mm(25),
            doc.y,
            cont
        ).text("dabei Bestimmung a) weiter unten.")

        doc.moveDown()
            .font("Arial")
            .text(
                "Der/die Unterzeichnete/n nehmen zur Kenntniss, dass der Verwaltungsrat über die Namensaktien ein Aktienbuch führt, ",
                mm(25),
                doc.y,
                cont
            )
            .text(
                "in das die Eigentümer der Aktien mit Namen eingetragen werden. Gemäss Art. 5 der Gesellschatsstatuten dürfen die ",
                cont
            )
            .text(
                "Namensaktien nur mit Zustimmung des Verwaltungsrates weiterveräussert werden. Der Verwaltungsrat kann ein Gesuch ",
                cont
            )
            .text("um Zustimmung aus wichtigen Gründen ablehnen. Wichtige Gründe sind namentlich:")
            .moveDown()
            .text("a)", mm(25), doc.y, cont)
            .text("Die Bestimmung, dass mit Ausnahme der Mitglieder des Schulvereins nur", mm(32), doc.y)
            .text(
                "Schulangehörige (Lehrer, Verwaltungsratmitarbeiter und Schüler) oder deren Verwante Aktionäre sein können",
                mm(32),
                doc.y
            )
            .moveDown()
            .text("b)", mm(25), doc.y, cont)
            .text("Die Bestimmung, dass mit Ausnahme des Schulvereins kein Aktionär mehr", mm(32), doc.y)
            .text("als 5% des Aktienkapitals zu Eigentum oder Nutzniessung halten darf", mm(32), doc.y)
            .moveDown()

        doc.fontSize(12)
        tableRow(["Name", `${info.first_name} ${info.name}`], doc.y, 1)
        tableRow(["Adresse", `${info.address}, ${info.post_code} ${info.city}`], doc.y, 1)
        tableRow(["Name des Kindes/der Kinder", " "], doc.y, 1)
        tableRow(["Ort und Datum", " "], doc.y, 1)
        tableRow(["Unterschriften", " "], doc.y, 3)

        doc.fontSize(10)
        doc.moveDown(3)
            .text("Bitte senden Sie das ausgefüllte Formular an den Aktienregisterführer der AG: ", mm(25), doc.y)
            .font("Arial Bold")
            .text(
                `${register_admins.admin_1.first_name} ${register_admins.admin_1.name}, ${register_admins.admin_1.address}, ${register_admins.admin_1.post_code} ${register_admins.admin_1.city}`
            )

        // Footer
        doc.image(path.join(assetPath, "images", "footer_color_1.png"), mm(25), doc.page.height - mm(20), {
            width: mm(165),
        })

        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            console.log("stream finished, returning path:", docPath)
            resolve(docPath)
        })
    })
}

/**
 * generate a journal pdf document for mutation
 * @param info
 * @param rssm
 * @returns {Promise<any>}
 */
function makeJournalMutation(info, rssm) {
    return new Promise(async function (resolve, reject) {
        // get configuration values
        const exportPath = rssm.config.get("documentpath")
        const register_admins = rssm.getAdminInfo()

        // generate document
        const docPath = path.join(
            exportPath,
            `${Helpers.dateToDbString()}_${info.new_name}_Journal_${info.journal_no}.pdf`
        )
        const props = getDocProps(rssm)
        props.margins = { top: mm(14), left: 0, right: 0 }
        const doc = new PDFDoc(props)
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)

        registerFonts(doc)

        const formLabel = {
            width: mm(85),
            align: "right",
        }

        // Header
        doc.font("Arial").fontSize(12).text("Aktiengesellschaft   ", mm(20), mm(14), cont)
        doc.font("Arial Bold").text("Schulgebäude Rudolf Steiner Schule Münchenstein").moveDown()

        doc.fontSize(30).text("Mutation", mm(20), mm(35))

        // Journal No Box
        doc.rect(mm(135), mm(30), mm(45), mm(15)).stroke().font("Arial").fontSize(8).text("Journal Nr", mm(165), mm(30))

        // Form
        doc.font("Arial Bold")
            .fontSize(10)
            .text("Alte Adresse", mm(20), mm(60))
            .font("Arial")
            .text("Name, Vorname", mm(0), mm(60), formLabel)
            .text("Strasse, Nr.", 0, mm(70), formLabel)
            .text("PLZ, Ort", 0, mm(80), formLabel)
            .text("Email", 0, mm(90), formLabel)
            .text("A-Code", 0, mm(100), formLabel)
            .text("Korrespondenz", 0, mm(110), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Neue Adresse", mm(20), mm(130))
            .font("Arial")
            .text("Name, Vorname", mm(0), mm(130), formLabel)
            .text("Strasse, Nr.", 0, mm(140), formLabel)
            .text("PLZ, Ort", 0, mm(150), formLabel)
            .text("Email", 0, mm(160), formLabel)
            .text("Korrespondenz", 0, mm(170), formLabel)

        doc.fontSize(10)
        doc.text("Kommentar", mm(0), mm(190), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Abschluss", mm(20), mm(260))
            .font("Arial")
            .text(`${register_admins.admin_1.city} ,`, mm(0), mm(260), formLabel)

        doc.font("Arial Italic")
            .fontSize(8)
            .text(`${register_admins.admin_1.first_name} ${register_admins.admin_1.name}`, mm(140), mm(269))

        // lines
        doc.lineWidth(1)
        doc.strokeColor("black", 0.2)
        doc.moveTo(mm(90), mm(67)).lineTo(mm(180), mm(67)).stroke()
        doc.moveTo(mm(90), mm(77)).lineTo(mm(180), mm(77)).stroke()
        doc.moveTo(mm(90), mm(87)).lineTo(mm(180), mm(87)).stroke()
        doc.moveTo(mm(90), mm(97)).lineTo(mm(180), mm(97)).stroke()
        doc.moveTo(mm(90), mm(107)).lineTo(mm(180), mm(107)).stroke()
        doc.moveTo(mm(90), mm(117)).lineTo(mm(180), mm(117)).stroke()

        doc.moveTo(mm(90), mm(137)).lineTo(mm(180), mm(137)).stroke()
        doc.moveTo(mm(90), mm(147)).lineTo(mm(180), mm(147)).stroke()
        doc.moveTo(mm(90), mm(157)).lineTo(mm(180), mm(157)).stroke()
        doc.moveTo(mm(90), mm(167)).lineTo(mm(180), mm(167)).stroke()
        doc.moveTo(mm(90), mm(177)).lineTo(mm(180), mm(177)).stroke()

        doc.moveTo(mm(90), mm(197)).lineTo(mm(180), mm(197)).stroke()
        doc.moveTo(mm(90), mm(207)).lineTo(mm(180), mm(207)).stroke()
        doc.moveTo(mm(90), mm(217)).lineTo(mm(180), mm(217)).stroke()
        doc.moveTo(mm(90), mm(227)).lineTo(mm(180), mm(227)).stroke()

        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke()

        // Fill form with data
        doc.font("Arial Italic").fontSize(20).fillColor("blue").text(info.journal_no, mm(145), mm(34))

        doc.fontSize(12)
            .text(`${info.old_name} ${info.old_first_name}`, mm(100), mm(60))
            .text(info.old_address, mm(100), mm(70))
            .text(`${info.old_post_code} ${info.old_city}`, mm(100), mm(80))
            .text(info.old_email, mm(100), mm(90))
            .text(info.a_code, mm(100), mm(100))
            .text(info.old_correspondence ? "aktiv" : "nicht aktiv", mm(100), mm(110))

        doc.fontSize(12)
            .text(`${info.new_name} ${info.new_first_name}`, mm(100), mm(130))
            .text(info.new_address, mm(100), mm(140))
            .text(`${info.new_post_code} ${info.new_city}`, mm(100), mm(150))
            .text(`${info.new_email}`, mm(100), mm(160))

            .text(info.new_correspondence ? "aktiv" : "nicht aktiv", mm(100), mm(170))

        doc.fontSize(12).text(info.comment, mm(100), mm(190)).text(Helpers.dateToString(), mm(100), mm(260))

        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            console.log("stream finished, returning path:", docPath)
            resolve(docPath)
        })
    })
}

/**
 * generate a transfer journal pdf document (Übertrag)
 * @param info
 * @param rssm
 * @returns {Promise<any>}
 */
function makeJournalTransfer(info, rssm) {
    return new Promise(async function (resolve, reject) {
        // get configuration values
        const exportPath = rssm.config.get("documentpath")
        const register_admins = rssm.getAdminInfo()

        // generate document
        const docPath = path.join(
            exportPath,
            `${Helpers.dateToDbString()}_${info.new_name}_Journal_${info.journal_no}.pdf`
        )
        const props = getDocProps(rssm)
        props.margins = { top: mm(14), left: 0, right: 0 }
        const doc = new PDFDoc(props)
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)

        registerFonts(doc)

        const formLabel = {
            width: mm(85),
            align: "right",
        }

        // Header
        doc.font("Arial").fontSize(12).text("Aktiengesellschaft   ", mm(20), mm(14), cont)
        doc.font("Arial Bold").text("Schulgebäude Rudolf Steiner Schule Münchenstein").moveDown()

        doc.fontSize(30).text("Übertrag Aktien", mm(20), mm(35))

        // Journal No Box
        doc.rect(mm(135), mm(30), mm(45), mm(15)).stroke().font("Arial").fontSize(8).text("Journal Nr", mm(165), mm(30))

        // Form
        doc.font("Arial Bold")
            .fontSize(10)
            .text("Aktionär/in ALT", mm(20), mm(60))
            .font("Arial")
            .text("Name, Vorname", mm(0), mm(60), formLabel)
            .text("Strasse, Nr.", 0, mm(70), formLabel)
            .text("PLZ, Ort", 0, mm(80), formLabel)
            .text("A-Code", 0, mm(90), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Aktionär/in NEU", mm(20), mm(110))
            .font("Arial")
            .text("Name, Vorname", mm(0), mm(110), formLabel)
            .text("Strasse, Nr.", 0, mm(120), formLabel)
            .text("PLZ, Ort", 0, mm(130), formLabel)
            .text("A-Code", 0, mm(140), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Aktien", mm(20), mm(160))
            .font("Arial")
            .text("Aktien Nummern", mm(0), mm(160), formLabel)

        doc.fontSize(10)
        doc.text("Kommentar", mm(0), mm(230), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Abschluss", mm(20), mm(260))
            .font("Arial")
            .text(`${register_admins.admin_1.city} ,`, mm(0), mm(260), formLabel)

        doc.font("Arial Italic")
            .fontSize(8)
            .text(`${register_admins.admin_1.first_name} ${register_admins.admin_1.first_name}`, mm(140), mm(269))

        // lines
        doc.lineWidth(1)
        doc.strokeColor("black", 0.2)
        doc.moveTo(mm(90), mm(67)).lineTo(mm(180), mm(67)).stroke()
        doc.moveTo(mm(90), mm(77)).lineTo(mm(180), mm(77)).stroke()
        doc.moveTo(mm(90), mm(87)).lineTo(mm(180), mm(87)).stroke()
        doc.moveTo(mm(90), mm(97)).lineTo(mm(180), mm(97)).stroke()

        doc.moveTo(mm(90), mm(117)).lineTo(mm(180), mm(117)).stroke()
        doc.moveTo(mm(90), mm(127)).lineTo(mm(180), mm(127)).stroke()
        doc.moveTo(mm(90), mm(137)).lineTo(mm(180), mm(137)).stroke()
        doc.moveTo(mm(90), mm(147)).lineTo(mm(180), mm(147)).stroke()

        doc.moveTo(mm(90), mm(167)).lineTo(mm(180), mm(167)).stroke()
        doc.moveTo(mm(90), mm(177)).lineTo(mm(180), mm(177)).stroke()
        doc.moveTo(mm(90), mm(187)).lineTo(mm(180), mm(187)).stroke()
        doc.moveTo(mm(90), mm(197)).lineTo(mm(180), mm(197)).stroke()
        doc.moveTo(mm(90), mm(207)).lineTo(mm(180), mm(207)).stroke()
        doc.moveTo(mm(90), mm(217)).lineTo(mm(180), mm(217)).stroke()

        doc.moveTo(mm(90), mm(237)).lineTo(mm(180), mm(237)).stroke()
        doc.moveTo(mm(90), mm(247)).lineTo(mm(180), mm(247)).stroke()

        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke()

        // Fill form with data

        // share number list
        let share_list = ""
        let share_numbers = ""
        for (let i = 0; i < info.shares.length; i++) {
            share_list += `${i + 1}.\n`
            share_numbers += `${Helpers.pad0(info.shares[i], 3)}\n`
        }

        doc.fontSize(12)
        doc.text(share_list, mm(90), mm(160), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        })

        doc.font("Arial Italic").fontSize(20).fillColor("blue").text(info.journal_no, mm(145), mm(34))

        doc.fontSize(12)
            .text(`${info.old_name} ${info.old_first_name}`, mm(100), mm(60))
            .text(info.old_address, mm(100), mm(70))
            .text(`${info.old_post_code} ${info.old_city}`, mm(100), mm(80))
            .text(info.old_a_code, mm(100), mm(90))

        doc.fontSize(12)
            .text(`${info.new_name} ${info.new_first_name}`, mm(100), mm(110))
            .text(info.new_address, mm(100), mm(120))
            .text(`${info.new_post_code} ${info.new_city}`, mm(100), mm(130))
            .text(info.new_a_code, mm(100), mm(140))

        doc.fontSize(12).text(info.comment, mm(100), mm(230)).text(Helpers.dateToString(), mm(100), mm(260))

        doc.text(share_numbers, mm(100), mm(160), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        })

        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            console.log("stream finished, returning path:", docPath)
            resolve(docPath)
        })
    })
}

/**
 * generate a repurchase journal pdf document
 * @param info
 * @param rssm
 * @returns {Promise<any>}
 */
function makeJournalRepurchase(info, rssm) {
    return new Promise(async function (resolve, reject) {
        // get configuration values
        const exportPath = rssm.config.get("documentpath")
        const register_admins = rssm.getAdminInfo()

        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_${info.name}_Journal_${info.journal_no}.pdf`)
        const props = getDocProps(rssm)
        props.margins = { top: mm(14), left: 0, right: 0 }
        const doc = new PDFDoc(props)
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)

        registerFonts(doc)

        const formLabel = {
            width: mm(85),
            align: "right",
        }

        // Header
        doc.font("Arial").fontSize(12).text("Aktiengesellschaft   ", mm(20), mm(14), cont)
        doc.font("Arial Bold").text("Schulgebäude Rudolf Steiner Schule Münchenstein").moveDown()

        doc.fontSize(30).text("Rückkauf Aktien", mm(20), mm(35))

        doc.font("Arial").fontSize(10).text("durch den Schulverein RSSM", mm(20), mm(47))

        // Journal No Box
        doc.rect(mm(135), mm(30), mm(45), mm(15)).stroke().font("Arial").fontSize(8).text("Journal Nr", mm(165), mm(30))

        // Form
        doc.font("Arial Bold")
            .fontSize(10)
            .text("Aktionär/in", mm(20), mm(60))
            .font("Arial")
            .text("Name", mm(0), mm(60), formLabel)
            .text("Vorname", 0, mm(70), formLabel)
            .text("Strasse, Nr.", 0, mm(80), formLabel)
            .text("PLZ, Ort", 0, mm(90), formLabel)
            .text("A-Code", 0, mm(100), formLabel)
            .text("Familie", 0, mm(110), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Aktien", mm(20), mm(130))
            .font("Arial")
            .text("Aktien Nummern", mm(0), mm(130), formLabel)

        doc.fontSize(10)
        doc.text("Buchungs Datum", mm(0), mm(200), formLabel)
        doc.text("Kommentar", mm(0), mm(210), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Abschluss", mm(20), mm(260))
            .font("Arial")
            .text(`${register_admins.admin_1.city} ,`, mm(0), mm(260), formLabel)

        doc.font("Arial Italic")
            .fontSize(8)
            .text(`${register_admins.admin_1.first_name} ${register_admins.admin_1.name}`, mm(140), mm(269))

        // lines
        doc.lineWidth(1)
        doc.strokeColor("black", 0.2)
        doc.moveTo(mm(90), mm(67)).lineTo(mm(180), mm(67)).stroke()
        doc.moveTo(mm(90), mm(77)).lineTo(mm(180), mm(77)).stroke()
        doc.moveTo(mm(90), mm(87)).lineTo(mm(180), mm(87)).stroke()
        doc.moveTo(mm(90), mm(97)).lineTo(mm(180), mm(97)).stroke()
        doc.moveTo(mm(90), mm(107)).lineTo(mm(180), mm(107)).stroke()
        doc.moveTo(mm(90), mm(117)).lineTo(mm(180), mm(117)).stroke()

        doc.moveTo(mm(90), mm(137)).lineTo(mm(180), mm(137)).stroke()
        doc.moveTo(mm(90), mm(147)).lineTo(mm(180), mm(147)).stroke()
        doc.moveTo(mm(90), mm(157)).lineTo(mm(180), mm(157)).stroke()
        doc.moveTo(mm(90), mm(167)).lineTo(mm(180), mm(167)).stroke()
        doc.moveTo(mm(90), mm(177)).lineTo(mm(180), mm(177)).stroke()
        doc.moveTo(mm(90), mm(187)).lineTo(mm(180), mm(187)).stroke()

        doc.moveTo(mm(90), mm(207)).lineTo(mm(180), mm(207)).stroke()
        doc.moveTo(mm(90), mm(217)).lineTo(mm(180), mm(217)).stroke()
        doc.moveTo(mm(90), mm(227)).lineTo(mm(180), mm(227)).stroke()
        doc.moveTo(mm(90), mm(237)).lineTo(mm(180), mm(237)).stroke()
        doc.moveTo(mm(90), mm(247)).lineTo(mm(180), mm(247)).stroke()

        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke()

        // Fill form with data

        // share number list
        let share_list = ""
        let share_numbers = ""
        for (let i = 0; i < info.shares.length; i++) {
            share_list += `${i + 1}.\n`
            share_numbers += `${Helpers.pad0(info.shares[i], 3)}\n`
        }

        doc.fontSize(12)
        doc.text(share_list, mm(90), mm(130), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        })

        doc.font("Arial Italic").fontSize(20).fillColor("blue").text(info.journal_no, mm(145), mm(34))

        doc.fontSize(12)
            .text(info.name, mm(100), mm(60))
            .text(info.first_name, mm(100), mm(70))
            .text(info.address, mm(100), mm(80))
            .text(`${info.post_code} ${info.city}`, mm(100), mm(90))
            .text(info.a_code, mm(100), mm(100))
            .text(info.family, mm(100), mm(110))
            .text(Helpers.dateToString(new Date(info.booking_date)), mm(100), mm(200))
            .text(Helpers.dateToString(new Date(info.journal_date)), mm(100), mm(260))

        doc.text(share_numbers, mm(100), mm(130), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        })

        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            console.log("stream finished, returning path:", docPath)
            resolve(docPath)
        })
    })
}

/**
 * generate a sale journal pdf document
 * @param info
 * @param rssm
 * @returns {Promise<any>}
 */
function makeJournalSale(info, rssm) {
    return new Promise(async function (resolve, reject) {
        // get configuration values
        const exportPath = rssm.config.get("documentpath")
        const register_admins = rssm.getAdminInfo()

        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_${info.name}_Journal_${info.journal_no}.pdf`)
        const props = getDocProps(rssm)
        props.margins = { top: mm(14), left: 0, right: 0 }
        const doc = new PDFDoc(props)
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)

        registerFonts(doc)

        const formLabel = {
            width: mm(85),
            align: "right",
        }

        // Header
        doc.font("Arial").fontSize(12).text("Aktiengesellschaft   ", mm(20), mm(14), cont)
        doc.font("Arial Bold").text("Schulgebäude Rudolf Steiner Schule Münchenstein").moveDown()

        doc.fontSize(30).text("Verkauf Aktien", mm(20), mm(35))

        // Journal No Box
        doc.rect(mm(135), mm(30), mm(45), mm(15)).stroke().font("Arial").fontSize(8).text("Journal Nr", mm(165), mm(30))

        // Form
        doc.font("Arial Bold")
            .fontSize(10)
            .text("Aktionär/in", mm(20), mm(60))
            .font("Arial")
            .text("Name", mm(0), mm(60), formLabel)
            .text("Vorname", 0, mm(70), formLabel)
            .text("Strasse, Nr.", 0, mm(80), formLabel)
            .text("PLZ, Ort", 0, mm(90), formLabel)
            .text("A-Code", 0, mm(100), formLabel)
            .text("Familie", 0, mm(110), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Aktien", mm(20), mm(130))
            .font("Arial")
            .text("Aktien Nummern", mm(0), mm(130), formLabel)

        doc.fontSize(10)
        doc.text("Buchungs Datum", mm(0), mm(200), formLabel)
        doc.text("Kommentar", mm(0), mm(210), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Abschluss", mm(20), mm(260))
            .font("Arial")
            .text(`${register_admins.admin_1.city} ,`, mm(0), mm(260), formLabel)

        doc.font("Arial Italic")
            .fontSize(8)
            .text(`${register_admins.admin_1.first_name} ${register_admins.admin_1.name}`, mm(140), mm(269))

        // lines
        doc.lineWidth(1)
        doc.strokeColor("black", 0.2)
        doc.moveTo(mm(90), mm(67)).lineTo(mm(180), mm(67)).stroke()
        doc.moveTo(mm(90), mm(77)).lineTo(mm(180), mm(77)).stroke()
        doc.moveTo(mm(90), mm(87)).lineTo(mm(180), mm(87)).stroke()
        doc.moveTo(mm(90), mm(97)).lineTo(mm(180), mm(97)).stroke()
        doc.moveTo(mm(90), mm(107)).lineTo(mm(180), mm(107)).stroke()
        doc.moveTo(mm(90), mm(117)).lineTo(mm(180), mm(117)).stroke()

        doc.moveTo(mm(90), mm(137)).lineTo(mm(180), mm(137)).stroke()
        doc.moveTo(mm(90), mm(147)).lineTo(mm(180), mm(147)).stroke()
        doc.moveTo(mm(90), mm(157)).lineTo(mm(180), mm(157)).stroke()
        doc.moveTo(mm(90), mm(167)).lineTo(mm(180), mm(167)).stroke()
        doc.moveTo(mm(90), mm(177)).lineTo(mm(180), mm(177)).stroke()
        doc.moveTo(mm(90), mm(187)).lineTo(mm(180), mm(187)).stroke()

        doc.moveTo(mm(90), mm(207)).lineTo(mm(180), mm(207)).stroke()
        doc.moveTo(mm(90), mm(217)).lineTo(mm(180), mm(217)).stroke()
        doc.moveTo(mm(90), mm(227)).lineTo(mm(180), mm(227)).stroke()
        doc.moveTo(mm(90), mm(237)).lineTo(mm(180), mm(237)).stroke()
        doc.moveTo(mm(90), mm(247)).lineTo(mm(180), mm(247)).stroke()

        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke()

        // Fill form with data

        // share number list
        let share_list = ""
        let share_numbers = ""
        for (let i = 0; i < info.shares.length; i++) {
            share_list += `${i + 1}.\n`
            share_numbers += `${Helpers.pad0(info.shares[i], 3)}\n`
        }

        doc.fontSize(12)
        doc.text(share_list, mm(90), mm(130), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        })

        doc.font("Arial Italic").fontSize(20).fillColor("blue").text(info.journal_no, mm(145), mm(34))

        doc.fontSize(12)
            .text(info.name, mm(100), mm(60))
            .text(info.first_name, mm(100), mm(70))
            .text(info.address, mm(100), mm(80))
            .text(`${info.post_code} ${info.city}`, mm(100), mm(90))
            .text(info.a_code, mm(100), mm(100))
            .text(info.family, mm(100), mm(110))
            .text(Helpers.dateToString(new Date(info.purchase_date)), mm(100), mm(200))
            .text(info.comment, mm(100), mm(210))
            .text(Helpers.dateToString(), mm(100), mm(260))

        doc.text(share_numbers, mm(100), mm(130), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        })

        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            console.log("stream finished, returning path:", docPath)
            resolve(docPath)
        })
    })
}

/**
 * generate a issue reserved certificate journal pdf document
 * @param info
 * @param rssm
 * @returns {Promise<any>}
 */
function makeJournalIssueReserved(info, rssm) {
    return new Promise(async function (resolve, reject) {
        // get configuration values
        const exportPath = rssm.config.get("documentpath")
        const register_admins = rssm.getAdminInfo()

        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_${info.name}_Journal_${info.journal_no}.pdf`)
        const props = getDocProps(rssm)
        props.margins = { top: mm(14), left: 0, right: 0 }
        const doc = new PDFDoc(props)
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)

        registerFonts(doc)

        const formLabel = {
            width: mm(85),
            align: "right",
        }

        // Header
        doc.font("Arial").fontSize(12).text("Aktiengesellschaft   ", mm(20), mm(14), cont)
        doc.font("Arial Bold").text("Schulgebäude Rudolf Steiner Schule Münchenstein").moveDown()

        doc.fontSize(30).text("Austellen Zertifikate", mm(20), mm(35))

        // Journal No Box
        doc.rect(mm(135), mm(30), mm(45), mm(15)).stroke().font("Arial").fontSize(8).text("Journal Nr", mm(165), mm(30))

        // Form
        doc.font("Arial Bold")
            .fontSize(10)
            .text("Aktionär/in", mm(20), mm(60))
            .font("Arial")
            .text("Name", mm(0), mm(60), formLabel)
            .text("Vorname", 0, mm(70), formLabel)
            .text("Strasse, Nr.", 0, mm(80), formLabel)
            .text("PLZ, Ort", 0, mm(90), formLabel)
            .text("A-Code", 0, mm(100), formLabel)
            .text("Familie", 0, mm(110), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Aktien", mm(20), mm(130))
            .font("Arial")
            .text("Aktien Nummern", mm(0), mm(130), formLabel)

        doc.fontSize(10)
        doc.text("Buchungs Datum", mm(0), mm(200), formLabel)
        doc.text("Journaleintrag Reservierung", mm(0), mm(210), formLabel)
        doc.text("Kommentar", mm(0), mm(220), formLabel)

        doc.font("Arial Bold")
            .fontSize(10)
            .text("Abschluss", mm(20), mm(260))
            .font("Arial")
            .text(`${register_admins.admin_1.city} ,`, mm(0), mm(260), formLabel)

        doc.font("Arial Italic")
            .fontSize(8)
            .text(`${register_admins.admin_1.first_name} ${register_admins.admin_1.name}`, mm(140), mm(269))

        // lines
        doc.lineWidth(1)
        doc.strokeColor("black", 0.2)
        doc.moveTo(mm(90), mm(67)).lineTo(mm(180), mm(67)).stroke()
        doc.moveTo(mm(90), mm(77)).lineTo(mm(180), mm(77)).stroke()
        doc.moveTo(mm(90), mm(87)).lineTo(mm(180), mm(87)).stroke()
        doc.moveTo(mm(90), mm(97)).lineTo(mm(180), mm(97)).stroke()
        doc.moveTo(mm(90), mm(107)).lineTo(mm(180), mm(107)).stroke()
        doc.moveTo(mm(90), mm(117)).lineTo(mm(180), mm(117)).stroke()

        doc.moveTo(mm(90), mm(137)).lineTo(mm(180), mm(137)).stroke()
        doc.moveTo(mm(90), mm(147)).lineTo(mm(180), mm(147)).stroke()
        doc.moveTo(mm(90), mm(157)).lineTo(mm(180), mm(157)).stroke()
        doc.moveTo(mm(90), mm(167)).lineTo(mm(180), mm(167)).stroke()
        doc.moveTo(mm(90), mm(177)).lineTo(mm(180), mm(177)).stroke()
        doc.moveTo(mm(90), mm(187)).lineTo(mm(180), mm(187)).stroke()

        doc.moveTo(mm(90), mm(207)).lineTo(mm(180), mm(207)).stroke()
        doc.moveTo(mm(90), mm(217)).lineTo(mm(180), mm(217)).stroke()
        doc.moveTo(mm(90), mm(227)).lineTo(mm(180), mm(227)).stroke()
        doc.moveTo(mm(90), mm(237)).lineTo(mm(180), mm(237)).stroke()
        doc.moveTo(mm(90), mm(247)).lineTo(mm(180), mm(247)).stroke()

        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke()

        // Fill form with data

        // share number list
        let share_list = ""
        let share_numbers = ""
        for (let i = 0; i < info.shares.length; i++) {
            share_list += `${i + 1}.\n`
            share_numbers += `${Helpers.pad0(info.shares[i], 3)}\n`
        }

        doc.fontSize(12)
        doc.text(share_list, mm(90), mm(130), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        })

        doc.font("Arial Italic").fontSize(20).fillColor("blue").text(info.journal_no, mm(145), mm(34))

        doc.fontSize(12)
            .text(info.name, mm(100), mm(60))
            .text(info.first_name, mm(100), mm(70))
            .text(info.address, mm(100), mm(80))
            .text(`${info.post_code} ${info.city}`, mm(100), mm(90))
            .text(info.a_code, mm(100), mm(100))
            .text(info.family, mm(100), mm(110))
            .text(Helpers.dateToString(new Date(info.purchase_date)), mm(100), mm(200))
            .text(info.journal_reservation, mm(100), mm(210))
            .text(info.comment, mm(100), mm(220))
            .text(Helpers.dateToString(), mm(100), mm(260))

        doc.text(share_numbers, mm(100), mm(130), {
            columns: 2,
            columnGap: mm(5),
            width: mm(90),
            height: mm(60),
            lineGap: mm(5),
        })

        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            console.log("stream finished, returning path:", docPath)
            resolve(docPath)
        })
    })
}

function makeCertificates(info, rssm) {
    return new Promise(async function (resolve, reject) {
        console.log(info)

        // get configuration values
        const exportPath = rssm.config.get("documentpath")

        // generate document
        const docPath = path.join(
            exportPath,
            `${Helpers.dateToDbString()}_${info.name}_Zertifikate_${info.journal_no}.pdf`
        )
        const props = getDocProps(rssm)
        props.margins = { top: mm(14), left: 0, right: 0 }
        const doc = new PDFDoc(props)
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)

        registerFonts(doc)

        // create one page per share
        for (let i = 0; i < info.shares.length; i++) {
            // get share series info
            const series = rssm.getShareSeriesInfo(info.shares[i])

            // get certificate info
            const certificate = await rssm.selectOneSql(
                "SELECT * FROM share JOIN certificate USING (certificate_id) WHERE share_no=?",
                [info.shares[i]]
            )
            console.log(certificate)

            // image Linden
            doc.image(path.join(assetPath, "images", "linden.png"), {
                fit: [mm(210), mm(100)],
                align: "center",
                valign: "center",
            })

            // Header
            doc.font("Arial").fontSize(12).text("Aktiengesellschaft", 0, mm(123), center)
            doc.font("Arial Bold").text("Schulgebäude Rudolf Steiner Schule Münchenstein", center)
            doc.font("Arial").text("In Münchenstein", center).moveDown()

            // Kapital
            doc.text(
                `Aktienkapital erhöht auf Fr. ${series.capital}.-, eingeteilt in ${series.shares} Namenaktien`,
                center
            )
                .text(
                    `(Stammaktien) im Nennwert von Fr. ${series.shares_value}.- und ${series.nv_shares} Namenaktien`,
                    center
                )
                .text(`(Stimmrechtsaktien) im Nennwert von je Fr. ${series.nv_value}.-`, center)
                .moveDown(3)

            // Urkunden Nr & Name
            doc.text("Urkunde Nr.", mm(73), mm(167))
            doc.font("Arial Bold").fontSize(16).text(Helpers.pad0(info.shares[i], 3), 0, mm(166), center).moveDown(1)

            doc.font("Arial").fontSize(12).text("über 1 Namenaktie (Stammaktie) im Nennwert von", center).moveDown()

            doc.font("Arial Bold").fontSize(16).text(`Fr. ${series.shares_value}.-`, center)

            doc.font("Arial").fontSize(12).text("voll liberiert", center).moveDown(2)

            doc.font("Arial Bold").fontSize(16).text(`${info.first_name} ${info.name}`, center).moveDown(2)

            doc.moveTo(mm(210 / 2 - 60), mm(220))
                .lineTo(mm(210 / 2 + 60), mm(220))
                .moveTo(mm(210 / 2 - 60), mm(220 + 1))
                .lineTo(mm(210 / 2 + 60), mm(220 + 1))
                .stroke()

            // note
            doc.font("Arial")
                .fontSize(12)
                .text("ist mit dieser übertragungsbeschränkten Aktie an unserer", center)
                .text("Aktiengesellschaft mit allen gesetzlichen und statuarischen Rechten", center)
                .text("und Pflichten gemäss den jeweiligen aktuellen", center)
                .text("und im Handelsregister deponierten Statuten beteiligt.", center)
                .moveDown()
                .text(`4142 Münchenstein, den ${Helpers.dateToString(new Date(series.emission_date))}`, center)
                .text("Im Namen des Verwaltungsrates", center)

            // cert hash
            doc.font("Courier").fillColor("#aaaaaa").fontSize(5).text(certificate["hash"], 0, mm(290), center)

            if (i < info.shares.length - 1) {
                doc.addPage()
            }
        }
        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            console.log("stream finished, returning path:", docPath)
            resolve(docPath)
        })
    })
}

function makeShareholderPortfolio(info, rssm) {
    return new Promise(async function (resolve, reject) {
        // get configuration values
        const exportPath = rssm.config.get("documentpath")

        const tableRow = function (labels, y, rowType = "normal") {
            const col_pos = [mm(30), mm(60), mm(150)]
            const cols = labels.length

            switch (rowType) {
                case "header":
                    doc.fillOpacity(0.3)
                    break
                case "new":
                    doc.fillOpacity(0.06)
                    break
                case "normal":
                    doc.fillOpacity(0.15)
                    break
            }

            doc.rect(mm(25), y, mm(160), mm(4)).lineWidth(0).fill()
            doc.fillOpacity(1)

            for (let i = 0; i < cols; i++) {
                if (i == 0 || rowType == "header") {
                    doc.font("Arial Bold")
                }
                doc.text(labels[i], col_pos[i], y)
                doc.font("Arial")
            }

            doc.font("Arial")
        }

        // generate document
        let postfix
        if (info.journal_no) {
            postfix = info.journal_no
        } else {
            postfix = Helpers.dateToDbString()
        }
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_${info.name}_Aktienportfolio_${postfix}.pdf`)
        const doc = new PDFDoc(getDocProps(rssm))
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)
        registerFonts(doc)
        header1(doc)

        doc.moveDown(10)
            .font("Arial Bold")
            .fontSize(12)
            .text("Aktienportfolio von", mm(15))
            .moveDown()
            .font("Arial")
            .fontSize(11)
            .moveDown()
            .text(`${info.salutation} ${info.first_name} ${info.name}`)
            .text(`${info.address}`)
            .text(`${info.post_code} ${info.city}`)
            .moveDown(2)

        if (rssm.data.a_codes[info.a_code]) {
            if (rssm.data.a_codes[info.a_code].shares) {
                doc.font("Arial").fontSize(11).moveDown()
                doc.font("Arial Bold")
                tableRow(["Aktien Nr.", "Bezeichnung", "Wert (CHF)"], doc.y, "header")
                doc.font("Arial")
                for (let i = 0; i < rssm.data.a_codes[info.a_code].shares.length; i++) {
                    const share_no = rssm.data.a_codes[info.a_code].shares[i]
                    let is_new = false
                    let marker_new = "- neu"

                    for (let i = 0; i < info.shares.length; i++) {
                        if (info.shares[i] == share_no) {
                            is_new = true
                            break
                        }
                    }

                    if (info.shares.length == rssm.data.a_codes[info.a_code].shares.length) {
                        marker_new = ""
                    }

                    if (is_new) {
                        tableRow(
                            [Helpers.pad0(share_no, 3), `Namenaktie (Stammaktie) ${marker_new}`, "1000.--"],
                            doc.y,
                            "new"
                        )
                    } else {
                        tableRow([Helpers.pad0(share_no, 3), "Namenaktie (Stammaktie)", "1000.--"], doc.y, "normal")
                    }
                }

                doc.moveDown().text(`Stand: ${Helpers.dateToString()}`, mm(25))
            }
        }

        footer1(doc)
        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            console.log("stream finished, returning path:", docPath)
            resolve(docPath)
        })
    })
}

async function positionAddress(doc, address, rssm, drawMarkers = false) {
    const position = {
        correction_left: mm(-2),
        correction_top: mm(-4),
    }
    position.left = await rssm.getConfig("ADDRESS_POS_LEFT")
    position.left = parseInt(position.left)
    position.top = await rssm.getConfig("ADDRESS_POS_TOP")
    position.top = parseInt(position.top)

    // Address
    doc.font("Arial")
        .fontSize(14)
        .text(
            address.first_name + " " + address.name,
            mm(position.left) + position.correction_left,
            mm(position.top) + position.correction_top
        )
        .text(address.address)
        .text(address.post_code + " " + address.city)

    if (drawMarkers) {
        // marker top
        doc.moveTo(mm(position.left) - 20, mm(position.top) + position.correction_top)
            .lineWidth(1)
            .lineTo(mm(position.left) + 150, mm(position.top) + position.correction_top)
            .stroke()

        // arrow top
        doc.moveTo(mm(position.left) + 100, 0)
            .dash(5, { space: 3 })
            .lineTo(mm(position.left) + 100, mm(position.top) + position.correction_top)
            .stroke()
            .moveTo(mm(position.left) + 100, mm(position.top) + position.correction_top)
            .undash()
            .lineTo(mm(position.left) + 100 - 5, mm(position.top) + position.correction_top - 10)
            .stroke()
            .moveTo(mm(position.left) + 100, mm(position.top) + position.correction_top)
            .lineTo(mm(position.left) + 100 + 5, mm(position.top) + position.correction_top - 10)
            .stroke()

        // // distance left
        doc.fontSize(9).text(position.top + " mm", mm(position.left) + 100 + 10, mm(position.top) - 25)

        // marker left
        doc.moveTo(mm(position.left) + position.correction_left, mm(position.top) - 20)
            .lineWidth(1)
            .lineTo(mm(position.left) + position.correction_left, mm(position.top) + 50)
            .stroke()

        // arrow left
        doc.moveTo(0, mm(position.top) + 25)
            .dash(5, { space: 3 })
            .lineTo(mm(position.left) + position.correction_left, mm(position.top) + 25)
            .stroke()
            .moveTo(mm(position.left) + position.correction_left, mm(position.top) + 25)
            .undash()
            .lineTo(mm(position.left) + position.correction_left - 10, mm(position.top) + 25 - 5)
            .stroke()
            .moveTo(mm(position.left) + position.correction_left, mm(position.top) + 25)
            .lineTo(mm(position.left) + position.correction_left - 10, mm(position.top) + 25 + 5)
            .stroke()

        // distance left
        doc.fontSize(9).text(position.left + " mm", mm(position.left - 17), mm(position.top) + 15)
    }
}

function makeAddressTestPrint(rssm) {
    return new Promise(async function (resolve, reject) {
        const filename = "address_test.pdf"
        // get configuration values
        const exportPath = rssm.config.get("documentpath")
        const admin = rssm.getAdminInfo().admin_1

        // generate document
        const doc = new PDFDoc(getDocProps(rssm))
        const docPath = path.join(exportPath, filename)
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)

        registerFonts(doc)
        header1(doc)
        await positionAddress(doc, admin, rssm, true)
        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            resolve(docPath)
        })
    })
}

function makeSharesLetterElectronic(info, rssm) {
    return new Promise(async function (resolve, reject) {
        // get configuration values
        const exportPath = rssm.config.get("documentpath")
        const register_admins = rssm.getAdminInfo()

        // generate initials
        let ag_register_init = ""
        ag_register_init += register_admins.admin_1.first_name.substring(0, 1).toUpperCase()
        ag_register_init += register_admins.admin_1.name.substring(0, 1).toUpperCase()

        // generate document
        const docPath = path.join(
            exportPath,
            `${Helpers.dateToDbString()}_${info.name}_Begleitbrief_${info.journal_no}.pdf`
        )
        const grammarSet = getGrammarSet(info.salutation)

        const doc = new PDFDoc(getDocProps(rssm))
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)
        registerFonts(doc)
        header1(doc)
        await positionAddress(doc, info, rssm)

        // Date
        doc.fontSize(12)
        doc.moveDown(3)
        doc.text(`${register_admins.admin_1.city},  ${Helpers.dateToString()}/${ag_register_init}`, mm(25)).moveDown(2)

        // Title
        doc.font("Arial Bold")
            .fontSize(12)
            .text("Ihre Aktien der AG Schulgebäude Rudolf Steiner Schule Münchenstein")
            .moveDown(2)

        // Salutation
        doc.font("Arial")
            .fontSize(11)
            .text(`Sehr ${grammarSet[0]} ` + info.salutation + " " + info.name)
            .moveDown()

        // P1
        doc.text("Wir freuen uns, dass Sie ", cont)
            .text(info.shares.length, cont)
            .text(" Aktien der Aktiengesellschaft Schulgebäude Rudolf Steiner Schule ", cont)
            .text(
                "Münchenstein gezeichnet haben. Wir haben Ihre Aktien in unserem elektronischen Aktienregister ",
                cont
            )
            .text(
                "auf Sie registriert. Eine Auflistung der Ihnen zugewiesenen Aktien erhalten Sie im beiliegenden Aktienportfolio."
            )
            .text(
                "Auf Wunsch stellen wir Ihnen die Aktienzertifikate gerne in Papierform aus oder übertragen die Aktien ",
                cont
            )
            .text("auf eine andere Person. Bitte nehmen Sie bei Bedarf mit uns Kontakt auf.")
            .moveDown()
        doc.text("Die Regeln für den ", cont)
            .text("Rückkauf von Aktien durch die AG Schulgebäude RSSM entnehmen Sie bitte dem ", cont)
            .text("beiliegenden Infoblatt. Die Statuten der Aktiengesellschaft stellen wir ", cont)
            .text("Ihnen auf Anfrage gerne zu.")
            .moveDown()
        doc.text("Sie sind als ", mm(25), doc.y, cont)
            .text(grammarSet[2], cont)
            .text(" der Aktien im Aktienregister eingetragen und können als ", cont)
            .text(grammarSet[3], cont)
            .text(" die Ihnen nach Gesetz und Statuten zustehenden Rechte wahrnehmen.")
            .text("Insbesondere werden Sie zu den Generalversammlungen der Aktionärinnen und Aktionäre eingeladen.")
            .moveDown()
        doc.text("Für Fragen stehen wir Ihnen gerne zur Verfügung.").moveDown()
        doc.text("Mit freundlichen Grüssen").moveDown(4)

        if (register_admins.signature_1) {
            doc.image(register_admins.signature_1, mm(20), mm(200), { height: mm(20) })
        }

        if (register_admins.signature_2) {
            doc.image(register_admins.signature_2, mm(112), mm(200), { height: mm(20) })
        }

        doc.text(`${register_admins.admin_1.first_name} ${register_admins.admin_1.name}`, cont)
        doc.text(`${register_admins.admin_2.first_name} ${register_admins.admin_2.name}`, mm(85))
        doc.text("Aktienregister", cont)
        doc.text("Verwaltungsrat", mm(94))
        doc.moveDown(2)
        doc.text("Beilagen:", { underline: true }).text("- Aktienportfolio").text("- Infoblatt Rückkauf Aktien")
        footer1(doc)
        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            console.log("stream finished, returning path:", docPath)
            resolve(docPath)
        })
    })
}

function footer1(doc) {
    // Footer
    doc.fontSize(11)
    doc.text(
        `Gutenbergstrasse 1     4142 Münchenstein     Tel. 061 413 93 71     ag@rssm.ch     www.rssm.ch`,
        mm(25),
        doc.page.height - mm(25),
        { align: "justify" }
    )

    doc.moveTo(mm(61.5), mm(273))
        .lineTo(mm(61.5), mm(273 + 3))
        .moveTo(mm(100.75), mm(273))
        .lineTo(mm(100.75), mm(273 + 3))
        .moveTo(mm(137.5), mm(273))
        .lineTo(mm(137.5), mm(273 + 3))
        .moveTo(mm(165), mm(273))
        .lineTo(mm(165), mm(273 + 3))
        .stroke()
}

function header1(doc) {
    // document header
    doc.image(path.join(assetPath, "images", "header_color_2.png"), mm(25), mm(14), { width: mm(165) })
}

function makeSharesLetter(info, rssm) {
    return new Promise(async function (resolve, reject) {
        // get configuration values
        const exportPath = rssm.config.get("documentpath")
        const register_admins = rssm.getAdminInfo()

        // generate initials
        let ag_register_init = ""
        ag_register_init += register_admins.admin_1.first_name.substring(0, 1).toUpperCase()
        ag_register_init += register_admins.admin_1.name.substring(0, 1).toUpperCase()

        // generate document
        const docPath = path.join(
            exportPath,
            `${Helpers.dateToDbString()}_${info.name}_Begleitbrief_${info.journal_no}.pdf`
        )
        const grammarSet = getGrammarSet(info.salutation)

        const doc = new PDFDoc(getDocProps(rssm))
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)

        registerFonts(doc)
        header1(doc)
        await positionAddress(doc, info, rssm)

        // Date
        doc.moveDown(2)
        doc.text(`${register_admins.admin_1.city}, ${Helpers.dateToString()}/${ag_register_init}`, mm(25)).moveDown(3)

        // Title
        doc.font("Arial Bold")
            .fontSize(12)
            .text("Ihre Aktien der AG Schulgebäude Rudolf Steiner Schule Münchenstein")
            .moveDown(2)

        // Salutation
        doc.font("Arial")
            .fontSize(11)
            .text(`Sehr ${grammarSet[0]} ` + info.salutation + " " + info.name)
            .moveDown()

        // P1
        doc.text("Wir freuen uns, dass Sie ", cont)
            .text(info.shares.length, cont)
            .text(" Aktien der Aktiengesellschaft Schulgebäude Rudolf Steiner Schule ", cont)
            .text("Münchenstein gezeichnet haben. Als Beilage finden Sie die auf ", cont)
            .text(grammarSet[1], cont)
            .text(" Namen lautenden Aktienurkunden. Sie sind als ", cont)
            .text(grammarSet[2], cont)
            .text(" der Aktien im Aktienbuch eingetragen und können als ", cont)
            .text(grammarSet[3], cont)
            .text(" die Ihnen nach Gesetz und Statuten zustehenden Rechte wahrnehmen.")
            .moveDown()

        // P2
        doc.text(
            "Insbesondere werden Sie zu den Generalversammlungen der Aktionärinnen und Aktionäre eingeladen."
        ).moveDown()

        // P3
        doc.text("Die Übertragung der Namensaktien ist eingeschränkt und nur mit der Zustimmung ", cont)
            .text("des Verwaltungsrates möglich (vinkulierte Namensaktien). Die Regeln für den ", cont)
            .text("Rückkauf von Aktien durch die AG Schulgebäude RSSM entnehmen Sie bitte dem ", cont)
            .text("beiliegenden Infoblatt. Die Statuten der Aktiengesellschaft stellen wir ", cont)
            .text("Ihnen auf Anfrage gerne zu.")
            .moveDown()

        // P4
        doc.text(
            "Wir bitten Sie, Ihre Aktienzertifikate sorgfältig aufzubewahren, die Eigentumsrechte sind an die Aktie gebunden.",
            { underline: true }
        ).moveDown()

        doc.text("Für Fragen stehen wir Ihnen gerne zur Verfügung.").moveDown()
        doc.text("Freundliche Grüsse").moveDown()
        doc.text("für den Verwaltungsrat").moveDown(4)

        if (register_admins.signature_1) {
            doc.image(register_admins.signature_1, mm(20), mm(210), { height: mm(20) })
        }

        if (register_admins.signature_2) {
            doc.image(register_admins.signature_2, mm(112), mm(210), { height: mm(20) })
        }

        doc.text(`${register_admins.admin_1.first_name} ${register_admins.admin_1.name}`, cont)
        doc.text(`${register_admins.admin_2.first_name} ${register_admins.admin_2.name}`, mm(83))
        doc.text("Aktienregister", cont)
        doc.text("Verwaltungsrat", mm(92))
        doc.moveDown(2)

        // Beilagen
        let shares_list = ""
        info.shares.forEach((no) => {
            shares_list += Helpers.pad0(no, 3) + " "
        })

        doc.text("Beilagen", { underline: true })
            .text("Aktienurkunden Nr. ", cont)
            .text(shares_list)
            .text("Infoblatt Rückkauf Aktien")

        // Footer
        doc.text(
            `Gutenbergstrasse 1     4142 Münchenstein     Tel. 061 413 93 71     ag@rssm.ch     www.rssm.ch`,
            mm(25),
            doc.page.height - mm(25),
            { align: "justify" }
        )

        doc.moveTo(mm(61.5), mm(271))
            .lineTo(mm(61.5), mm(271 + 5))
            .moveTo(mm(100.75), mm(271))
            .lineTo(mm(100.75), mm(271 + 5))
            .moveTo(mm(137.5), mm(271))
            .lineTo(mm(137.5), mm(271 + 5))
            .moveTo(mm(165), mm(271))
            .lineTo(mm(165), mm(271 + 5))
            .stroke()

        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            console.log("stream finished, returning path:", docPath)
            resolve(docPath)
        })
    })
}

function makeAnnualReport(info, rssm) {
    return new Promise(async function (resolve, reject) {
        // get configuration values
        const exportPath = rssm.config.get("documentpath")
        const register_admins = rssm.getAdminInfo()

        // generate document
        const docPath = path.join(exportPath, `${Helpers.dateToDbString()}_Jahresbericht.pdf`)
        const props = getDocProps(rssm)
        props.margins = { top: mm(14), left: 0, right: 0 }
        const doc = new PDFDoc(props)
        const writeStream = fs.createWriteStream(docPath)
        doc.pipe(writeStream)

        registerFonts(doc)

        const formLabel = {
            width: mm(85),
            align: "right",
        }
        let page = 1

        const pageFooter = function () {
            doc.font("Arial")
                .fontSize(8)
                .fillColor("black")
                .text("Seite " + page, mm(25), mm(280))
            page++
        }

        const tableRow = function (data = [], header = false) {
            // colPos is from left page border
            const colPos = [mm(25), mm(30), mm(25), mm(35), mm(30)]
            let x = 0
            let y = doc.y

            if (y > mm(260)) {
                pageFooter()
                doc.addPage()
                tableRow(null, true)
                y = doc.y
            }

            if (header) {
                data = ["Datum", "Journal Nr", "Kapitaländerung", "Transaktion", "Name"]
                doc.font("Arial Bold")
            } else {
                doc.font("Arial")
            }
            doc.fontSize(10)

            for (let i = 0; i < data.length; i++) {
                x += colPos[i]
                doc.text(data[i], x, y)
            }
            //doc.moveDown();
        }

        // document header
        header1(doc)

        // Title
        doc.font("Arial Bold").fontSize(14).text("Bericht aus dem Aktienregister", mm(25), mm(53))

        doc.moveTo(mm(25), mm(60)).lineTo(mm(200), mm(60)).stroke()

        // Summary headers
        doc.font("Arial Bold")
            .fontSize(10)
            .text("Stand", mm(25), mm(65))
            .moveDown()
            .text("Aktienkapital:")
            .moveDown()
            .text("Aktienbestand:")
            .moveDown()
            .text("Transaktionen:")

        // Summary data
        doc.font("Arial")
            .text(info.endDate, mm(75), mm(65))
            .moveDown()
            .text(`${info.shares_total} Namensaktien, CHF ${info.shares_kapital}.-`)
            .moveDown()
            .text(`${info.stock} Namensaktien, CHF ${info.stock * 1000}.-`) // value of share is hardcoded to 1000.- and needs to be changed if other values are introduced
            .moveDown()
            .text(`von ${info.startDate} bis ${info.endDate}`)
            .text(`${info.shares_sold} Aktien verkauft`)
            .text(`${info.shares_bought} Aktien gekauft`)

        doc.moveTo(mm(25), mm(105)).lineTo(mm(200), mm(105)).stroke()

        // Table
        doc.moveDown(3)
        tableRow(null, true)
        for (let i in info.transactions) {
            const t = info.transactions[i]
            tableRow([t.transaction_date, t.journal_no, t.stock_change, t.transaction_type, t.name])
        }

        if (doc.y > mm(250)) {
            doc.addPage()
        }

        doc.font("Arial").fontSize(10).text(`${register_admins.admin_1.city},`, mm(0), mm(260), formLabel)

        doc.font("Arial Italic")
            .fontSize(8)
            .text(`${register_admins.admin_1.first_name} ${register_admins.admin_1.name}`, mm(140), mm(269))

        doc.moveTo(mm(90), mm(267)).lineTo(mm(180), mm(267)).stroke()

        doc.font("Arial Italic").fillColor("blue").fontSize(12).text(Helpers.dateToString(), mm(100), mm(260))

        pageFooter()

        doc.end()

        writeStream.on("error", function (err) {
            console.log("ERROR: failed to write document: ", err)
            reject(err)
        })

        // wait on returning the path until the stream is finished
        writeStream.on("finish", function () {
            rssm.logActivity("annual report generated: " + docPath)
            resolve(docPath)
        })
    })
}

/**
 * registers fonts in pdf file refering to ttf font files
 * @param doc
 */
function registerFonts(doc) {
    doc.registerFont("Arial", path.join(assetPath, "fonts", "Arial.ttf"))
    doc.registerFont("Arial Bold", path.join(assetPath, "fonts", "Arial Bold.ttf"))
    doc.registerFont("Arial Italic", path.join(assetPath, "fonts", "Arial Italic.ttf"))
    doc.registerFont("Arial Bold Italic", path.join(assetPath, "fonts", "Arial Bold Italic.ttf"))
}

/**
 * returns array of gender specific terms for letter
 * @param salutation
 * @returns {string[]}
 */
function getGrammarSet(salutation) {
    if (salutation.toLowerCase() === "frau") {
        return ["geehrte", "Ihren", "Eigentümerin", "Aktionärin"]
    }
    if (salutation.toLowerCase() === "herr") {
        return ["geehrter", "Ihren", "Eigentümer", "Aktionär"]
    }
    if (salutation.toLowerCase() === "familie") {
        return ["geehrte", "Ihre", "Eigentümer", "Aktionäre"]
    }

    return ["geehrte", "Ihre", "EigentümerIn", "AktionärIn"]
}

/**
 * conversion of mm values into PDF Point units (72p/inch)
 * @param mm  millimeter value to
 * @returns  PDF points
 */
function mm(mm) {
    return (72 / 25.4) * mm
}

/**
 * returns object with default pdf document properties
 * @returns {{size: *[], margins: {top: PDF, left: PDF, right: PDF, bottom: PDF}, layout: string, info: {Author: string, Subject: string}}}
 */
function getDocProps(rssm) {
    const register_admins = rssm.getAdminInfo()

    return {
        size: [mm(210), mm(297)], // A4
        margins: {
            top: mm(17),
            left: mm(17),
            right: mm(17),
            bottom: mm(17),
        },
        layout: "portrait",
        info: {
            Author: `${register_admins.admin_1.first_name} ${register_admins.admin_1.name}`,
            Subject: "AG Schulgebäude RSSM",
        },
    }
}

exports.makeSharesLetterElectronic = makeSharesLetterElectronic
exports.makeSharesLetter = makeSharesLetter
exports.makeCertificates = makeCertificates
exports.makeJournalSale = makeJournalSale
exports.makeJournalRepurchase = makeJournalRepurchase
exports.makeJournalTransfer = makeJournalTransfer
exports.makeJournalMutation = makeJournalMutation
exports.makeAnnualReport = makeAnnualReport
exports.makeJournalIssueReserved = makeJournalIssueReserved
exports.makeNamingForm = makeNamingForm
exports.makeShareholderPortfolio = makeShareholderPortfolio
exports.makeAddressTestPrint = makeAddressTestPrint
