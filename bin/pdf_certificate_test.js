const RSSMDocs = require("../lib/RSSMDocs")
const RSSMShares = require("../lib/RSSMShares").RSSMShares
const helpers = require("../lib/app.helpers")
const log = require("electron-log")
const Config = require("../lib/Config").Config
const path = require("path")

makeLetter()

async function makeLetter() {
    const info = {
        salutation: "Herr",
        first_name: "Max",
        name: "Mustermann",
        address: "Musterweg 123",
        post_code: "1234",
        city: "Musterhausen",
        a_code: "928001",
        family: "Mustermann",
        purchase_date: "2021-02-27",
        comment: "",
        journal_no: "21-000" + new Date().getTime(),
        journal_id: 900,
        shares: ["104"],
    }

    // get configuration
    const configSet = "dev"
    const configFile = "C:Users/Dani/AppData/Roaming/aktienregister-rssm/config.json"
    const config = new Config(configFile, configSet)

    // setup logging
    log.transports.file.level = "debug"
    log.transports.file.resolvePath = () => "C:Users/Dani/AppData/Roaming/aktienregister-rssm/logs/dev.log"
    log.info("AktienregisterRSSM initializing ...")

    // initialize main RSSMShares object
    rssm = new RSSMShares(config, log)
    await rssm.init()

    const path = await RSSMDocs.makeCertificates(info, rssm)
}
