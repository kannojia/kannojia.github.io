(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
var Util = require('./util');

function Node(logicOp, condition) {
    this.logicOp = logicOp;
    this.condition = condition || null;
    this.children = [];
}

function generateTree(arr) {
    var node = null;
    
    if(!arr && arr.length === 0) {
        return node;
    }
    
    if(arr[0].toLowerCase() === 'and' || arr[0].toLowerCase() === 'or') {
        node = new Node(arr[0].toLowerCase(), null);
        
        for(var i=1; i<arr.length; i++) {
            node.children[i-1] = generateTree(arr[i]);
        }
    } else {
        node = new Node(null, arr);
    }
    
    return node;
}

var conditionParser = function(baseTable, resultSet) {
    
    var getResults = function(conditionalArr) {
        var parseTree = generateTree(conditionalArr[0]);

        // Recursively apply conditional to get final results
        return applyConditionals(parseTree, resultSet.result);
    }
    
    var applyConditionals = function(tree, results) {
        var r = [];
        
        if(!tree || Util.isEmpty(tree)) {
            return r;
        }
        
        if(tree.logicOp !== null) {
            if(tree.logicOp === 'or') {
                for(var i = 0; i < tree.children.length; i++) {
                    r = Util.unionArray(r, applyConditionals(tree.children[i], results));
                }    
            } else {
                for(var i = 0; i < tree.children.length; i++) {
                    if(!r.length) {
                        r = applyConditionals(tree.children[i], results); 
                    } else {
                        r = Util.intersectArray(r, applyConditionals(tree.children[i], results));
                    }
                }
            }
        } else {
            var idx = baseTable.tblAttributes.indexOf(tree.condition[0]);
            r = results.filter(function(row) {
                return Util.evalExpression(row[idx], tree.condition[1], tree.condition[2]);
            });
        }
        
        return r;
    };
    
    return {
        getResults : getResults
    };
};

module.exports = conditionParser;
},{"./util":5}],3:[function(require,module,exports){
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

},{"./basetable":1,"./condition-parser":2,"./resultset":4,"./util":5,"./view":6}],4:[function(require,module,exports){
var ResultSet = function(tbl) {
    this.result = tbl.data;
    this.getResultSet = function() {
        return this.result;
    }
};

module.exports = ResultSet;
},{}],5:[function(require,module,exports){
var Util = (function() {
    var evalExpression = function (a, operator, b) {
        var func;
        switch(operator) {
            case '<' : func = new Function('a', 'b', 'return a < b;');
                break;
            case '<=' : func = new Function('a', 'b', 'return a <= b;');
                break;
            case '>' : func = new Function('a', 'b', 'return a > b;');
                break;
            case '>=' : func = new Function('a', 'b', 'return a >= b;');
                break;
            case '=' : func = new Function('a', 'b', 'return a === b; ');
                break;
            case '!=' : func = new Function('a', 'b', 'return a !== b; ');
                break;
            case 'IN' : func = function(a, b) {
                    if (!isArray(b)) {
                        throw 'IN operator : Operand is not an Array';
                    }
                    return b.some(function(val) {
                        return val === a;
                    });
                }
                break;
            case 'NOT IN' : func = function(a, b) {
                    if (!isArray(b)) {
                        throw 'NOT IN operator : Operand is not an Array';
                    }
                    return b.every(function(val) {
                        return val !== a;
                    });
                }
                break;
        }
        
        return func(a, b);
    };
    
    var arrayContains = function(array, obj) {
        return array.indexOf(obj) !== -1;
    };
    
    var isArray = function(arg) {
        return (arg.constructor === Array);
    };
    
    var isEmpty = function(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop)) {
                return false;
            }
        }
        return true;
    };
    
    var unionArray = function(a, b) {
        var hash = {};
        
        a.forEach(function(row) {
            hash[row[0]] = 1;
        });
        
        return a.concat(b.filter(function(row) {
            return (!hash[row[0]]);
        }));
    };
    
    var intersectArray = function(a, b) {
        var hash = {};
        
        a.forEach(function(row) {
            hash[row[0]] = 1;
        });
        
        return b.filter(function(row) {
            return Boolean(hash[row[0]]);
        })
    };
    
    return {
        evalExpression : evalExpression,
        arrayContains : arrayContains,
        isArray : isArray,
        isEmpty : isEmpty,
        unionArray : unionArray,
        intersectArray : intersectArray
    };
})();

module.exports = Util;
},{}],6:[function(require,module,exports){
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
},{}]},{},[3]);
