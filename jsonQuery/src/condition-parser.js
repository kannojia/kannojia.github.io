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