
/*
*	Global clause object and operator object, which models the conditionals and their relationships.
*/

var all_operators = {};
var all_clauses = {};
var initial_groups = {};
var colorPalette = ['cs-1','cs-2','cs-3'];

function getSubclauses(clauseObj) {
	var cList = {};
	for(var clause in clauseObj) {
		if(clauseObj.hasOwnProperty(clause)) {
			if(typeof clauseObj[clause] != 'object') {
				cList[clause] = clauseObj[clause];
			}
			else {
				cList[clause] = clauseObj[clause].label;
			}
		}
	}
	return cList;
}


// Recursive function to search applicable clauses
function _getApplicableClauses(node, clause) {

	if(typeof clause == 'undefined' || clause === '') {
		return '';
	}

	if(typeof node == 'undefined' || node === '') {
		return '';
	}

	if(typeof node.clauses == 'undefined')
		return '';

	var subclauses = node.clauses;

	for(var sc in subclauses) {
		if(subclauses.hasOwnProperty(sc)) {
			if(sc == clause) {
				if(typeof subclauses[sc].clauses != 'undefined') {
					return getSubclauses(subclauses[sc].clauses);
				}
			}
			else {
				 var obj = _getApplicableClauses(subclauses[sc], clause);
				 if(obj !== '') {
				 	return obj;
				 }
			}
		}
	}
	return '';
}

function getApplicableClauses(clause) {
	return _getApplicableClauses(all_clauses, clause);
}


function _getClauseProperties(targetClause, currentClause, currentClauseObj) {
	if(typeof currentClauseObj == 'undefined' || currentClauseObj === '' ) {
		return false;
	} 

	if(typeof currentClauseObj == 'object') {

		if(currentClause == targetClause)
			return currentClauseObj;

		if(!currentClauseObj.clauses)
			return false;

		var clauses = currentClauseObj.clauses;
		for(var property in clauses) {
			if(clauses.hasOwnProperty(property)) {
				var r =_getClauseProperties(targetClause, property, clauses[property]);
				if(r) {
					return r;
				}
			}
		}
	}

	return false;
}

function getClauseObject(clause) {

	if(typeof clause == 'undefined' || clause === '') {
		return;
	}


	var temp = _getClauseProperties(clause, 'all_clauses', all_clauses);
	temp.clauseName = clause;
	var cObj = new Clause();
	cObj.setClause(temp);

	return cObj;
}

function _getJson($node) {
	if(typeof $node == 'undefined' || $node.length == 0) {
		return ;
	}
	var json ={};

	var cond = $node.find('> .block-header select.condition')
					
					.find(':selected')
					.val();
	json.condition = cond;

	var $allBlocks = $node.find('> .block-body > .block-rules > div.block-container');

	if($allBlocks.length == 0) {
		var isDependent = $node.data('is-dependent') || false;

		var cname = [],
			operator = [],
			value = [];

		if(isDependent == true) {
			
			var $depClauses = $node.find('.multiple-clause');

			$depClauses.each(function() {
				$this = $(this);
				cname.push($this.find('.clause-name').data('clause-name'));
				operator.push($this.find('select.operator-list :selected').val());
				var $values = $this.find('.clause-field');
				if($values.length > 1) {
					var v = [];
					$values.each(function() {
						v.push($(this).val());
					});
					value.push(v);
				} else {
					value.push($values.val());
				}
			});
		}
		else {

			cname.push($node.find('.clause-name').data('clause-name'));
			operator.push($node.find('select.operator-list :selected').val());
			// value.push($node.find('.clause-field').val());

			var $values = $node.find('.clause-field');
			if($values.length > 1) {
				var v = [];
				$values.each(function() {
					v.push($(this).val());
				});
				value.push(v);
			} else {
				value.push($values.val());
			}
		}


		var t = {};
		t.id = cname;
		t.operator = operator;
		t.value = value;

		return t;
	}

	json.rules = [];

	$allBlocks.each(function (index) {
		var rule = {};

		var ruleName = $(this).data('clause');
		rule[ruleName] = _getJson($(this)); 
		json.rules.push(rule); 
	});

	return json;
}



function _jsonToBuilder($node, json) {

	for(var prop in json) {
		if(json.hasOwnProperty(prop)) {
			var c = '';
			if(prop == 'condition') {
				c = json[prop];
				$node.find('> .block-header select.condition').val(c);
			}

			if(prop == 'value') {
				var $c = $node.find('.clause-name');
				var $o = $node.find('select.operator-list');
				var $f = $node.find('.clause-field');
				var op = '';

				if($c.length > 1) {
					$mf = $node.find('.multiple-clause');
					for(var j=0; j<$c.length; j++) {
						
						$c.eq(j).val(json.id[j]);
						$o.eq(j).val(json.operator[j]).trigger('change');

						$f = $mf.eq(j).find('.clause-field');
						
						op = getOperatorFromVal(json.operator[j]);

						if(all_operators[op].nb_inputs == 1) {
							if($.isArray(json.value[j])) {
								for(var k=0; k<json.value[j].length; k++) {
									$f.find('option[value="'+json.value[j][k]+'"]').prop('selected', true);
								}
								$f.trigger('change');
							} else {
								$f.val(json.value[j]);
							}

						} else if(all_operators[op].nb_inputs == 2) {
							$f.eq(0).val(json.value[0][0]);
							$f.eq(1).val(json.value[0][1]);
						} 
						
					}
				} else {
					$c.val(json.id);
					$o.val(json.operator).trigger('change');
					$f = $node.find('.clause-field');

					op = getOperatorFromVal(json.operator);
					
					if(all_operators[op].nb_inputs == 1) {
						if($.isArray(json.value[0])) {
							for(var j=0; j<json.value[0].length; j++) {
								$f.find('option[value="'+json.value[0][j]+'"]').prop('selected', true);
							}
							$f.trigger('change');
						} else {
							$f.val(json.value[0]);
						}

					} else if(all_operators[op].nb_inputs == 2) {
						$f.eq(0).val(json.value[0][0]);
						$f.eq(1).val(json.value[0][1]);
					} 	
				}
				
				return;
			}

			if(prop =='rules') {
				var rules = json[prop];

				for(var i=0; i<rules.length; i++) {
					for(var r in rules[i]) {
						if(rules[i].hasOwnProperty(r)) {
							$node.find('> .block-footer select.rule')
								 .val(r)
								 .trigger('change');
							
							if($node.hasClass('query-builder')) {
								$node.find('> .block-footer .add-group-btn')
									 .prop('disabled', false)
									 .trigger('click');
							} else {
								$node.find('> .block-footer .add-clause-btn')
									 .prop('disabled', false)
									 .trigger('click');
							}
							
							var $block = $node.find('> .block-body > .block-rules > .block-container').last();
							_jsonToBuilder($block, rules[i][r]);
						}
					}
				}
			}
		}
	}
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function _validateBuilder($node) {
	var o = {};
	o.status = 'valid';
	o.element = $node.data('clause') || '';
	o.message = '';

	if($node.hasClass('clause-container')) {

		var $fields = $node.find('.clause-field');
		
		for(var f=0; f<$fields.length; f++) {
			if($($fields[f]).val() === '') {
				$($fields[f]).addClass('error-in-input');

				o.status = 'invalid';
				o.element = $node.data('clause') || '';
				o.message = 'No '+o.element+' defined';	
				return o;			
			}
		}

		o.status = 'valid';
		o.element = $node.data('clause') || '';
		o.message = '';

		return o;
	}

	var $allBlocks = $node.find('> .block-body > .block-rules > .block-container');

	if($allBlocks.length === 0) {
		o.status = 'invalid';
		o.element = $node.data('clause');
		o.message = 'No subclause selected.';

		return o;
	} 

	for(var b=0; b<$allBlocks.length; b++) {	
		
		var t =_validateBuilder($($allBlocks[b]));
		if(t.status == 'invalid') {
			return t;
		}
		
	}

	return o;
}

function getOperatorFromVal(op) {

	for(var operator in all_operators) {
		if(all_operators.hasOwnProperty(operator)) {
			if(all_operators[operator].val == op)
				return operator;
		}
	}
	return '';
}

function fetchConditionals(cb) {
	$('.loading').show();

	// Fetch Conditionals
	$.get('./sample/sample1.json', function(response) {
		all_clauses = response.conditionalRelationships;
		all_operators = response.operators;
		$('.loading').hide();
		cb();
	}, 'json');

}

function getInitialGroups() {
	var result = {};
	for(var prop in all_clauses.clauses) {
		if(all_clauses.clauses.hasOwnProperty(prop)) {
			result[prop] = all_clauses.clauses[prop].label;
		}
	}

	return result;
}


var Clause = function() {
	

	this.getClause = function() {

	};

	this.setClause = function(clause) {
		this.clauseName = clause.clauseName;
		if(typeof clause.clauseText === 'undefined' || clause.clauseText === '') {
			this.clauseText = clause.label;	
		} else {
			this.clauseText = clause.clauseText;
		}
		
		this.operators = clause.operators;
		this.label = clause.label;
		this.multiple = clause.multiple || false;
		this.input = clause.input || 'text';
		this.values = clause.values;
		this.dependency = clause.dependency || '';
		this.type = clause.type || '';
		this.placeholder = clause.placeholder || '';
		this.popoverText = clause.popoverText || 'None';
	};
};


var HTMLGenerator = function() {
	var id;
	var nextId = 0;

	this.preinit = function() {

		var html = ''+
			'<div class="row is-signed-up">'+
				'<div class="col-md-2">'+
					'<label for="">Is User signed up</label>'+
				'</div>'+
				'<div class="col-md-3">'+
					'<input type="radio" name="isSignedUp" value="signedUp"> Yes '+
					'<input type="radio" name="isSignedUp" value="onlySubscriber"> No '+
					'<input type="radio" name="isSignedUp" value="registered"> Not Required '+
				'</div>'+
			'</div>'+
			'<hr style="border-top: 1px solid #BFBFBF;">';
			return html;
	};

	this.inithtml = function(groups) {
		
		var html = ''+
			'<div class="row block-header">'+
				'<div class="col-md-2 condition-wrapper">'+
					'<select class="condition-selector select-picker condition">'+
						'<option value="and">AND</option>'+
						'<option value="or">OR</option>'+
					'</select>'+
				'</div>'+
				'<div class="col-md-8">'+
					''+
				'</div>'+
			'</div>'+
			'<div class="row block-body">'+
				'<div class="col-md-12 block-rules">'+

				'</div>'+
			'</div>'+
			'<div class="row block-footer">'+
				'<div class="col-md-4">'+
					'<select class="group-filter select-picker rule"><option value="-1">Select a Condition</option>';
					for(var group in groups) {
						html += '<option value="'+group+'">'+groups[group]+'</option>';
					}
					html += '</select>'+
				'</div>'+
				'<div class="col-md-2">'+
					'<button class="btn btn-primary add-group-btn" disabled><strong>+</strong> ADD</button>'+
				'</div>'+
			'</div>';

		return html;
	};

	this.getBlock = function(clause, subClauseList) {
		this.id = 'builder-block-'+nextId++;
		var clauseObj = getClauseObject(clause);

		var html = ''+
		'<div class="row block-container" data-clause="'+clause+'">'+
			'<div class="row block-header">'+
				'<div class="col-md-2 condition-wrapper">'+
					'<select class="condition-selector select-picker condition">'+
						'<option value="and">AND</option>'+
						'<option value="or">OR</option>'+
					'</select>'+
				'</div>'+
				'<div class="col-md-8">'+
					'<label>'+clauseObj.clauseText+'</label>'+
				'</div>'+
				'<div class="col-md-2 button-group">'+
					'<button class="delete-clause-btn btn btn-danger">Delete</button>'+
				'</div>'+
			'</div>'+
			'<div class="row block-body">'+
				'<div class="col-md-12 block-rules">'+

				'</div>'+
			'</div>'+
			'<div class="row block-footer">'+
				'<div class="col-md-4">'+
					'<select class="clause-list select-picker rule">'+
						this.getClauseList(subClauseList)+
					'</select>'+
				'</div>'+
				'<div class="col-md-2">'+
					'<button class="btn btn-primary add-clause-btn" disabled><strong>+</strong> ADD</button>'+
				'</div>'+
			'</div>'+

		'</div>';

		return html;
	};

	this.getClause = function(clauseObj) {
		// If dependency is present, spawn dependency fields
		if(clauseObj.dependency !== '') {
			return this.getClauseMultiple(clauseObj);
		}

		this.id = 'builder-clause-'+nextId++;
		var input = this.getInputFields(clauseObj);

		var dataDate = '';
		if(clauseObj.type == 'date') {
			dataDate += 'data-type="date"';
		}

		return '<div id="'+this.id+'" class="row block-container clause-container" data-clause="'+clauseObj.clauseName+'">'+
						'<div class="col-md-3">'+
							'<input type="text" class="clause-name" data-clause-name="'+clauseObj.clauseName+'"'+
						 'value="'+clauseObj.label+'" '+dataDate+' style="background-color: initial;border: none;" disabled>'+
						'</div>'+
						'<div class="col-md-3">'+
							'<select class="operator-list select-picker">'+
							    this.getOperatorsList(clauseObj.operators)+
							'</select>'+
						'</div>'+
						'<div class="col-md-4 input-wrapper">'+
							input+
						'</div>'+
						'<div class="col-md-2 button-group">'+
							'<a tabindex="0" role="button" class="btn btn-info" style="margin-right:5px;" data-toggle="popover"'+
								'title = "Info"'+
								'data-placement="left" data-trigger="focus"'+
								'data-content = "'+clauseObj.popoverText+'">'+
								'<span class="glyphicon glyphicon-info-sign"></span>'+
							'</a>'+
							'<button type="button" class="btn btn-danger delete-clause-btn">Delete</button>'+
						'</div>'+
				'</div>';
	};

	this.getClauseMultiple = function(clauseObj) {
		this.id = 'builder-clause-'+nextId++;

		var dataDate = '';
		if(clauseObj.type == 'date') {
			dataDate += 'data-type="date"';
		}

		var mainInput = this.getInputFields(clauseObj);
		var dependency = clauseObj.dependency;

		var input = this.getInputFields(clauseObj);		
		var html = '<div id="'+this.id+'" class="row block-container clause-container" data-clause="'+clauseObj.clauseName+'" data-is-dependent = "true" '+dataDate+'>'+
						'<div class="row multiple-clause" data-dep-clause='+clauseObj.clauseName+'>'+
							'<div class="col-md-3">'+
								'<input type="text" class="clause-name" data-clause-name="'+clauseObj.clauseName+'"'+
							 'value="'+clauseObj.clauseText+'" style="background-color: initial;border: none;" disabled>'+
							'</div>'+
							'<div class="col-md-3">'+
								'<select class="operator-list select-picker">'+
								    this.getOperatorsList(clauseObj.operators)+
								'</select>'+
							'</div>'+
							'<div class="col-md-4 input-wrapper">'+
								input+
							'</div>'+
							'<div class="col-md-2 button-group" style="position:relative;">'+
								'<a tabindex="0" role="button" class="btn btn-info" style="margin-right:5px;" data-toggle="popover"'+
									'title = "Info"'+
									'data-placement="left" data-trigger="focus"'+
									'data-content = "'+clauseObj.popoverText+'">'+
									'<span class="glyphicon glyphicon-info-sign"></span>'+
								'</a>'+
								'<button type="button" class="btn btn-danger delete-clause-btn">Delete</button>'+
							'</div>'+
						'</div>';

			for(var dep in dependency) {
				if(dependency.hasOwnProperty(dep)) {
					input = this.getInputFields(dependency[dep]);

					if(dependency[dep].type == 'date') {
						dataDate = 'data-type="date"';
					}

					html+= ''+
					'<div class="row multiple-clause" data-dep-clause='+dep+'>'+
						'<div class="col-md-4">'+
							'<input type="text" class="clause-name" data-clause-name="'+dep+'"'+
						 'value="'+dependency[dep].label+'" '+dataDate+' style="background-color: initial;border: none;" disabled>'+
						'</div>'+
						'<div class="col-md-3">'+
							'<select class="operator-list select-picker">'+
							    this.getOperatorsList(dependency[dep].operators)+
							'</select>'+
						'</div>'+
						'<div class="col-md-5 input-wrapper">'+
							input+
						'</div>'+
					'</div>';
				}
			}

			html+='</div>';

		return html;
	};


	this.getInputFields = function(clause) {
		var inputHtml = '';
		var multiple = clause.multiple || false;

		var inputType = clause.input;
		var defaultOp = clause.operators[0];
		var placeholderText = '';
		if(typeof clause.placeholder != 'undefined' && clause.placeholder !== '') {
			if(typeof clause.placeholder[defaultOp] == 'undefined') {
				placeholderText = clause.placeholder.default;	
			} else {
				placeholderText = clause.placeholder[defaultOp];
			}
		}

		if(inputType == 'text') {
			var dataType = clause.type;
			if(dataType == 'date') {
				inputHtml += '<input type="text" class="clause-field datetime-picker" value="" placeholder="'+placeholderText+'">';
			}
			else {
				inputHtml += '<input type="text" class="clause-field" value="" placeholder="'+placeholderText+'">';
			}

		} else if(inputType == 'select') {
			if(multiple) {
				inputHtml += '<select class="clause-field" multiple="multiple">';
			} else {
				inputHtml += '<select class="clause-field">';
			}

			var values = clause.values;
			for(var i=0; i<values.length; i++) {
				for(var v in values[i]) {
					inputHtml += '<option value="'+v+'">'+values[i][v]+'</option>';
					break;
				}
			}
			inputHtml += '</select>';
		}

		return inputHtml;
	};

	this.updatedInputFields = function(clause, operator) {
		var inputHtml = '';
		var multiple = clause.multiple || false;

		var inputType = clause.input;
		var o = getOperatorFromVal(operator);

		// Get placeholder text
		var placeholderText = '';
		if(typeof clause.placeholder != 'undefined' && clause.placeholder !== '') {
			if(typeof clause.placeholder[o] == 'undefined') {
				placeholderText = clause.placeholder.default;	
			} else {
				placeholderText = clause.placeholder[o];
			}
		}

		if(inputType == 'text') {
			var dataType = clause.type;

			var numInputs = all_operators[o].nb_inputs;

			while (numInputs-- > 0) {
				if(dataType == 'date') {
					inputHtml += '<input type="text" class="clause-field datetime-picker" value="" placeholder="'+placeholderText+'>';
				}
				else {
					inputHtml += '<input type="text" class="clause-field" value="" placeholder="'+placeholderText+'">';
				}
			}

		} else if(inputType == 'select') {
			if(multiple) {
				inputHtml += '<select class="clause-field" multiple="multiple">';
			} else {
				inputHtml += '<select class="clause-field">';
			}

			var values = clause.values;
			for(var i=0; i<values.length; i++) {
				for(var v in values[i]) {
					inputHtml += '<option value="'+v+'">'+values[i][v]+'</option>';
					break;
				}
			}
			inputHtml += '</select>';
		}

		return inputHtml;
	};

	this.getClauseList = function(pClause) {
		clauseList = pClause;
		var optionList = '<option value="-1">Select Condition</option>';
		
		for(var clause in clauseList) {
			if(clauseList.hasOwnProperty(clause)) {
				optionList += '<option value="'+clause+'">'+clauseList[clause]+'</option>';
			}
		}

		return optionList;
	};

	this.getOperatorsList = function(clauseOperators) {
		var optionList = '';

		if (clauseOperators.indexOf('ago') > -1) {
			optionList +='<optgroup label="Absolute Date">';
		}

		for(var operator in clauseOperators) {
				var o = clauseOperators[operator];
				var val = all_operators[o].val;

				if(o == 'ago') {
					optionList += '</optgroup><optgroup label="Relative Date">';
				}
				optionList += '<option value="'+val+'">'+all_operators[o].name+'</option>';
		}

		if (clauseOperators.indexOf('ago') > -1) {
			optionList +='</optgroup>';
		}

		return optionList;
	};

	this.getGroup = function(group) {
		this.id = 'builder-group-'+group;
		var subclauses = getApplicableClauses(group);
		var list = this.getClauseList(subclauses);
		var clauseObj = getClauseObject(group);

		var html = ''+
		'<div class="row block-container" data-clause="'+group+'">'+
			'<div class="row block-header">'+
				'<div class="col-md-2 condition-wrapper">'+
					'<select class="condition-list select-picker condition">'+
						'<option value="and">AND</option>'+
						'<option value="or">OR</option>'+
					'</select>'+
				'</div>'+
				'<div class="col-md-8">'+
					'<label>'+clauseObj.clauseText+'</label>'+
				'</div>'+
				'<div class="col-md-2 button-group">'+
					'<button class="delete-clause-btn btn btn-danger">Delete</button>'+
				'</div>'+
			'</div>'+
			'<div class="row block-body">'+
				'<div class="col-md-12 block-rules">'+

				'</div>'+
			'</div>'+
			'<div class="row block-footer">'+
				'<div class="col-md-4">'+
					'<select class="clause-list select-picker rule">'+
						list+
					'</select>'+
				'</div>'+
				'<div class="col-md-2">'+
					'<button class="btn btn-primary add-clause-btn" disabled><strong>+</strong> ADD</button>'+
				'</div>'+
			'</div>'+
		'</div>';

		return html;

	};

};

		

var QueryBuilder = function($el) {
	this.$el = $el;
	this.htmlGenerator = new HTMLGenerator();

	// Init Querybuilder
	this.$el.addClass('query-builder row').show();

	this.init = function() {
		var that = this;
		fetchConditionals(function() {
			that.bgcounter = 0;
			that.existingClauses = [];
			that.groups = getInitialGroups();

			that.$el.append(that.htmlGenerator.inithtml(that.groups));

			// Init select2
			that.$el.find('select').css('width','100%').select2();

			// Init popover
			$('[data-toggle="popover"]').popover();

			that.$addBtn = that.$el.find('.add-block-btn');
		});
	};

	this.addClause = function(clause, $parent, condition) {
		this.setClause(clause);

		var subclauses = getApplicableClauses(clause);
		
		if(subclauses !== '') {

			var blockHtml = this.htmlGenerator.getBlock(clause, subclauses);

			// Check if previous block is present, if present replace
			if($parent.find('.block-container').length > 0) {
				$parent.find('.block-container').first().remove();	
			}
			$b = $(blockHtml).appendTo($parent).addClass('push-right-5');
			// $b.find('')
		}
		else {
			var clauseObj = getClauseObject(clause);

			var clauseHtml = this.htmlGenerator.getClause(clauseObj);

			// Check if previous clause is present, if present replace that clause
			if($parent.find('.block-container').length > 0) {
				$parent.find('.block-container').first().remove();	
			}
			
			var $c = $(clauseHtml).appendTo($parent).addClass('push-right-5');
			$c.find('select').selectize();
		}
	};

	this.cloneClause = function(clause, $parent, condition) {
		this.setClause(clause);

		var subclauses = getApplicableClauses(clause);
		// var bg = colorPalette[this.bgcounter];
		// this.bgcounter = (this.bgcounter+1) % (colorPalette.length);

		if(subclauses !== '') {

			var blockHtml = this.htmlGenerator.getBlock(clause, subclauses);
			/*$blocks = $parent.find('.block-container[data-clause]');
			if($blocks.length > 0) {
				$blocks.last().after('<div class="condition-name label label-primary">'+condition.toUpperCase()+'</div>');
			}*/

			$b = $(blockHtml).appendTo($parent.find('> .block-body > .block-rules')).addClass('push-right-5');
			$b.find('select')
			  .not($b.find(' >.block-container select'))
			  .css('width','100%')
			  .select2();
			// $b.addClass(bg);
			$parent.find('> .block-footer select.rule').val('-1').trigger('change');
		}
		else {
			var clauseObj = getClauseObject(clause);

			var clauseHtml = this.htmlGenerator.getClause(clauseObj);
			/*$blocks = $parent.find('.block-container[data-clause]');
			if($blocks.length > 0) {
				$blocks.last().after('<div class="condition-name label label-primary">'+condition.toUpperCase()+'</div>');
			}*/

			var $c = $(clauseHtml).appendTo($parent.find('> .block-body > .block-rules')).addClass('push-right-5');
			$c.find('select').css('width','100%').select2();
			// $c.addClass(bg);
			$parent.find('> .block-footer select.rule').val('-1').trigger('change');

			if($c.find('input.datetime-picker').length >0)
			{
				$c.find('input.datetime-picker').datepicker({
					format : 'yyyy-mm-dd' 
				});
			}
		}

		// Init popover
		$('[data-toggle="popover"]').popover();
	};

	this.updateClause = function(clause, operator, $c) {

		var $cobj = $c;
		var clauseObject = getClauseObject(clause);
		var o = getOperatorFromVal(operator);

		if(typeof $c.attr('data-is-dependent') != 'undefined' && $c.attr('data-is-dependent') != false) {
			$cobj = $c.find('.multiple-clause[data-dep-clause="'+clause+'"]');
		}

		$cobj.find('select.operator-list').val(operator);

		var isDatePicker = false;

		if(operator != 'AGO' && operator != 'INTERVAL' && operator != 'UPTO') {
			isDatePicker = ($cobj.find('.clause-name').data('type')) == 'date' ? true:false ;
			// $cobj.find('.input-wrapper').removeClass('label-inc');
		}

		$fields = $cobj.find('.clause-field');
		var fieldType = 'text';
		if($fields.length == 1) {
			if($fields.prop('tagName') == 'SELECT') {
				fieldType = 'select';
			} else {
				fieldType = 'text';
			}
		}


		if(o !== '') {
			var numInputs = all_operators[o].nb_inputs;
			var placeholderText = '';
			if(typeof clauseObject.placeholder != 'undefined' && clauseObject.placeholder !== '') {
				if(typeof clauseObject.placeholder[o] == 'undefined') {
					placeholderText = clauseObject.placeholder.default;	
				} else {
					placeholderText = clauseObject.placeholder[o];
				}
			}

			for(var k =0; k<numInputs; k++) {
				if(fieldType == 'text') {
					var ptext = ($.isArray(placeholderText)) ? placeholderText[k] : placeholderText;
					$fields.remove();
					if(isDatePicker) {
						$('<input type="text" class="clause-field datetime-picker" value="" '+
							'placeholder="'+ptext+'">')
							.appendTo($cobj.find('.input-wrapper'))
							.datepicker({
								format : 'yyyy-mm-dd' 
							});
						// $cobj.find('.input-wrapper').addClass('label-inc');
					}
					else {
						$('<input type="text" class="clause-field" value=""'+
							'placeholder="'+ptext+'">')
							.appendTo($cobj.find('.input-wrapper'));
						// $cobj.find('.input-wrapper').addClass('label-inc');

					}
				} else if(fieldType == 'select') {
					$fields.select2('destroy').remove();

					var fieldhtml = this.htmlGenerator.updatedInputFields(clauseObject, operator);
					$(fieldhtml).appendTo($cobj.find('.input-wrapper'))
								.css('width', '100%')
								.select2();
				}

			}

			/*if(numInputs >1) {
				var $ips = $cobj.find('.input-wrapper input');
				$($ips[0]).attr('placeholder','From');
				$($ips[1]).attr('placeholder', 'To');
			}*/
		}

	};

	this.setClause  = function(clause) {
		var c = {};
		c.clauseName = clause;
		this.existingClauses.push(c);
	};

	this.addGroup = function(group, condition) {
		// if(condition != '-1') {
			var groupHtml = this.htmlGenerator.getGroup(group);


			//console.log(groupHtml);
			$g = $(groupHtml).appendTo(this.$el.find('> .block-body > .block-rules'));
			$g.addClass('push-right-5')
			  .find('select')
			  .not($g.find('> .block-container select'))
			  .css('width','100%')
			  .select2();
			this.$el.find('> .block-footer select.rule').val('-1').trigger('change');
		// }

	};

	this.cloneGroup = function(group, condition) {
		var groupHtml = this.htmlGenerator.getGroup(group);

		$groups = this.$el.find('> .block-container');

		// if($groups.length > 0) {
		// 	$groups.last().after('<div class="condition-name label label-primary">'+condition.toUpperCase()+'</div>');
		// }

		this.$el.append(groupHtml);
	};

	this.getJson = function() {
		$root = this.$el;

		var output = _getJson($root);

		return JSON.stringify(output, null, 2);
	};

	this.parseJson = function(json) {
		$root = this.$el;
		try {
			var jsonObj = JSON.parse(json);
			this.clear();
			this.init();

			_jsonToBuilder($root, jsonObj);

		} catch(e) {
			console.log("Invalid Json.\n Exception: "+e);
		}
	};

	this.validate = function() {
		return _validateBuilder(this.$el);
	};

	this.clear = function() {
		$root = this.$el;
		$root.empty();
	};
};



$.fn.querybuilder = function() {
	$el = this;
	
	$builder = new QueryBuilder($el);

	return $builder;
};

