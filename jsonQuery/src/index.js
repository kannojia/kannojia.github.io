var Util = require('./util');
var BaseTable = require('./basetable');
var ResultSet = require('./resultset');
var View = require('./view');
var ConditionParser = require('./condition-parser');


var jsonQuery = (function() {
    
    var QueryObject = function(table) {
        this.table = new BaseTable(table);
        this.resultSet = new ResultSet(this.table);
        this.view = new View(this.resultSet);
        this.cparser = ConditionParser(this.table, this.resultSet);
    };
    
    QueryObject.prototype.Select = function(fields) {
        this.view.setView(this.table, fields);
        
        return this;
    };
    
    QueryObject.prototype.Where = function() {
        
        if(!Util.isArray(arguments[0])) {
            throw '.Where('+arguments[0]+'. Argument to Where must be an Array';
        }
        
        this.resultSet.result = this.cparser.getResults(arguments[0], this.resultSet);
        
        return this;
    };
    
    QueryObject.prototype.OrderBy = function(field, order) {
        var idx = this.table.tblAttributes.indexOf(field);
        order = order || 'ASC';
        
        this.resultSet.result.sort(function(a, b) {
            if(order === 'DESC') {
                if(typeof a[idx] === 'number') {
                    return b[idx] - a[idx];
                } else {
                    return ( a < b ) ? -1 : ( a > b ? 1 : 0 );
                }
            } else {
                if(typeof a[idx] === 'number') {
                    return a[idx] - b[idx];
                } else {
                    return ( a > b ) ? -1 : ( a < b ? 1 : 0 );
                }
            }
        })
        
        return this;
    };
    
    QueryObject.prototype.GroupBy = function(field) {
        var idx = this.table.tblAttributes.indexOf(field);
        
        this.groups = this.resultSet.result.reduce(function(groups, row) {
            groups[row[idx]] = groups[row[idx]] || [];
            groups[row[idx]].push(row);
            return groups;
        }, {});
        
        this.resultSet.result = Object.keys(this.groups).map(function(key) {
            return this.groups[key][0];
        }, this);
        //console.log(this.groups);
        return this;
    };
    
    QueryObject.prototype.Execute = function() {
        return this.view.getView();
    };
    
    
    return QueryObject;
})();

module.exports = jsonQuery;
