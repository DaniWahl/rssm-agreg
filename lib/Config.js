const fs = require('fs')

class Config {

    constructor(file, set='default') {
        this.file = file
        this.set = set
        this.conf = this.initParamSet()
    }


    initParamSet() {
        return {
            dbpath : null,
            backuppath : null,
            exportpath : null,
            documentpath : null,
        }
    }

    get(param) {
        return this.conf[param]
    }

    save(param, value) {
        this.conf[param] = value
        this.write()
    }

    read() {

        try {

            if(!fs.existsSync(this.file)) {
                console.warn(`Config file ${this.file} does not exist! Generating one...`)
                fs.writeFileSync(this.file, JSON.stringify({}))
            }

            const fileStr = fs.readFileSync(this.file)
            const fileData = JSON.parse(fileStr)

            if(fileData[this.set]) {
                this.conf = fileData[this.set]
            } else {
                console.warn(`Config file ${this.file} does not contain configuration set '${this.set}'! Generating one...`)
                this.conf = this.initParamSet()
                this.write()
            }


        } catch(err) {
            console.error("Failed to read config file " + this.file, err)
            //throw new Error(err)
        }
    }


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
}

exports.Config = Config;