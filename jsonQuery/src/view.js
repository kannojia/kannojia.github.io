var View = function(resultSet) {
    this.table = null;
    this.fields = [];
    this.resultSet = resultSet;
    
    this.setView = function(table, fields) {
        this.table = table;
        this.fields = fields;
    };
    
    this.getView = function() {
        var selectIndices = [];
        var that = this;
        this.fields.forEach(function(field) {
            var pos = that.table.tblAttributes.indexOf(field);
            if(pos !== -1) {
                selectIndices.push(pos);
            }
        });
        
        return this.resultSet.result.map(function(row) {
            return row.filter(function(col, idx) {
                return (selectIndices.indexOf(idx) !== -1);
            });
        });
    };
};

module.exports = View;