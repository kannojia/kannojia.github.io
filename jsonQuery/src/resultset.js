var ResultSet = function(tbl) {
    this.result = tbl.data;
    this.getResultSet = function() {
        return this.result;
    }
};

module.exports = ResultSet;