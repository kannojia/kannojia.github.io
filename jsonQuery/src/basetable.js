function preprocess(table) {
    return table.map(function(row, idx) {
        return [idx].concat(row);
    });
}

var BaseTable = function(jsonObject) {
    this.relation = jsonObject;
    this.data = preprocess(this.relation);
    this.tblAttributes = this.data.shift();
};

module.exports = BaseTable;