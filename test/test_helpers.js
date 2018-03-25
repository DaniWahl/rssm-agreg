
// testing function in app.helper.js module
//const excel_to_date_string = require('../lib/app.helpers.js').excel_to_date_string
//const parse_share_no = require('../lib/app.helpers').parse_share_no
//const helpers = require('../lib/app.helpers')

QUnit.module("Module app.helpers")
QUnit.test("pad0 1 digit", function(assert) {
    assert.equal(pad0(1, 3), '001', 'pad0(1, 3) should return 001');
})
QUnit.test("pad0 2 digit", function(assert) {
    assert.equal(pad0(10, 3), '010', 'pad0(10, 3) should return 010');
})
QUnit.test("pad0 3 digit", function(assert) {
    assert.equal(pad0(100, 3), '100', 'pad0(100, 3) should return 100');
})
QUnit.test("pad0 4 digit", function(assert) {
    assert.equal(pad0(1000, 3), '1000', 'pad0(1000, 3) should return 1000');
})
