module.exports.excel_to_date_string = excel_to_date_string
module.exports.pad0 = pad0
module.exports.parse_share_no = parse_share_no
module.exports.dateToString = dateToString
module.exports.dateToDbString = dateToDbString

/**
 * pads a number with leading 0 characters to the specified length
 * @param {int} number  number to pad
 * @param {int} length  length to pad to
 * @returns {String}  number padded with 0  
 */
function pad0 (number, length) {
    
    if(number.toString().length >= length) {
        return number.toString()
    } else {
        let s = "000000000" + number
        return s.substr(s.length-length)
    }
}


function dateToString (date) {
    if(!date) {
        date = new Date()
    }

    return `${pad0(date.getDate(), 2)}.${pad0(date.getMonth()+1, 2)}.${date.getFullYear()}`
}


function dateToDbString (date) {
    if(!date) {
        date = new Date()
    }

    return `${date.getFullYear()}-${pad0(date.getMonth()+1, 2)}-${pad0(date.getDate(), 2)}`
}


/**
 * converts an excel date Integer value to a YYYY-MM-DD formated date string
 * @param {int} excelDate
 * @returns {String}  formatted date string
 */
function excel_to_date_string ( excelDate ) {


    if(!excelDate || excelDate === 0) { return ''}

    let platformDependentAdd = 1  // need to add 1 in case of Windows
    if(process.platform === 'darwin') {
        platformDependentAdd = 2  // but need to add 2 in case of Mac
    }

    //return excelDate
    const date = new Date((excelDate - (25567 + platformDependentAdd)) * 86400 * 1000)
    const y = date.getFullYear()
    const m = pad0((date.getMonth()+1), 2)
    const d = pad0(date.getDate(), 2)

    return `${y}-${m}-${d}` 
}

/**
 * parses a string into individual integer values and returns an array.
 * it considers multiple characters as separators
 * and converts ranges into values.
 * 1,2, 3, 4-10 is converted to [1,3,4,5,6,7,8,9,10]
 * @param {String} s_input
 * @returns {Array}
 */
function parse_share_no( s_input ) {
    const shares = [];
    const sep = '|';
    let s_shares = s_input.trim();

    if(s_shares === '') { return [] }

    // replace ,<space> by
    s_shares = s_shares.replace(/, /g, sep);
    s_shares = s_shares.replace(/,/g, sep);
    s_shares = s_shares.replace(/\./g, sep);
    s_shares = s_shares.replace(/ -/g, '-');
    s_shares = s_shares.replace(/ /g, sep);

    // parse s_shares by separator
    const s_split = s_shares.split(sep);

    s_split.forEach((s) => {

        // is this a range ?
        if(  s.match(/.+-.+/) )  {

            // parse range
            let start, end;
            [start, end] = s.split(/-/);

            // we need to make sure those are integers!
            start = parseInt(start);
            end = parseInt(end);

            for(let i=start; i<=end; i++) {
                shares.push( i );
            }

        } else {

            // not a range, add individual value
            const val = parseInt(s)

            // make sure is numeric
            if(!isNaN(val)) {
                shares.push( val );
            }

        }

    });


    return shares;
}
