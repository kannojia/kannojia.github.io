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