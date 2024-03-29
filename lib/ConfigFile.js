const fs = require("fs")
const os = require("os")

/**
 * handles user configuration files for RSSMShares
 */
class ConfigFile {
    /**
     * Object Constructor
     * @param {String} file path and name of users configuration file
     * @param {String} set  name of configuration set (default='default')
     */
    constructor(file, set = "default") {
        this.file = file
        this.set = set
        this.conf = this.initParamSet()
        this.userInfo = os.userInfo()
    }

    /**
     * returns value of param or undefined if it does not exist
     * @param {String} param
     */
    get(param) {
        if (typeof this.conf[param] === "undefined") {
            // store default value if available
            if (this.initParamSet()[param]) {
                console.info(`reverting to default value ${this.initParamSet()[param]} for ${param}`)
                return this.initParamSet()[param]
            } else {
                console.warn(`parameter ${param} not defined in ${this.file}:${this.set}`)
                return null
            }
        } else {
            return this.conf[param]
        }
    }

    /**
     * saves params value and stores file
     * @param {String} param
     * @param {*} value
     */
    save(param, value) {
        this.conf[param] = value
        this.write()
    }

    /**
     * ignores a parameter by resetting it to undefined.
     * does not write to file.
     * @param {String} param
     */
    ignore(param) {
        this.conf[param] = undefined
    }

    /**
     * reads users configuration file or generates one if it does not exist
     */
    read() {
        try {
            if (!fs.existsSync(this.file)) {
                console.warn(`Config file ${this.file} does not exist! Generating one...`)
                fs.writeFileSync(this.file, JSON.stringify({}))
            }

            const fileStr = fs.readFileSync(this.file)
            const fileData = JSON.parse(fileStr)

            if (fileData[this.set]) {
                this.conf = fileData[this.set]
            } else {
                console.warn(
                    `Config file ${this.file} does not contain configuration set '${this.set}'! Generating one...`
                )
                this.conf = this.initParamSet()
                this.write()
            }
        } catch (err) {
            console.error("Failed to read config file " + this.file, err)
            //throw new Error(err)
        }
    }

    /**
     * stores configuration set in file
     * @param {String} set configuration set to store (defaults to set specified at instanciation)
     */
    write(set = this.set) {
        try {
            const fileStr = fs.readFileSync(this.file)
            const fileData = JSON.parse(fileStr)
            fileData[set] = this.conf

            fs.writeFileSync(this.file, JSON.stringify(fileData))
            console.log(`Config file ${this.file} updated`)
        } catch (err) {
            console.error("Failed to write config file " + this.file, err)
        }
    }

    /**
     * returns an Object of empty configuration items
     */
    initParamSet() {
        return {
            dbpath: null,
            backuppath: null,
            exportpath: null,
            documentpath: null,
            lastbackup: null,
            lastexport: null,
            signaturefile_1: null,
            signaturefile_2: null,
            addresspos_left: 120,
            addresspos_top: 50,
            windowsize: [null, null],
            backups: [],
            exports: [],
        }
    }
}

exports.ConfigFile = ConfigFile
