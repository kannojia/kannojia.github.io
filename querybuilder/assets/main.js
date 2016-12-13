
$(document).ready(function() {
	var condition_id = getParameterByName('edit');
	if(condition_id != null && condition_id != '') {
		// Get json
		$.ajax({
			url: '',
			method: 'POST',
			data: {
				condition_id : condition_id
			},
			success: function(response) {
				var conditionsJson = response.clause;
				var conditionsTitle = response.title;
				var json = JSON.parse(conditionsJson);

				$('.set-json').trigger('click');
				$('#inputJson textarea').val(JSON.stringify(json, null, 2));
				$('#set-json-btn').trigger('click');	
				$('.query-title').val(conditionsTitle);
				$('#query-save-btn').attr('data-edit', condition_id).text('Update');
			}
		});
	}

	$builder = $('#builder').querybuilder();
	$builder.init();

	$('.query-builder').on('click', '.add-group-btn', function(e) {
		var group = $('select.group-filter').find(':selected').val();
		if(group == '-1') {
			return false;
		}
		var condition = $('select.condition-selector').find(':selected').val();

		$builder.addGroup(group, condition);
	});

	$('.query-builder').on('change', 'select.group-filter', function() {
		if($(this).find(':selected').val() == '-1') {
			$(this).closest('.query-builder').find('.add-group-btn').prop('disabled', true);
		} else {
			$(this).closest('.query-builder').find('.add-group-btn')
											 .prop('disabled', false);
		}

	});


	$('.query-builder').on('change', 'select.clause-list', function() {
		if($(this).find(':selected').val() == '-1') {
			$(this).closest('.block-container').find('.add-clause-btn').prop('disabled', true);
		} else {
			$(this).closest('.block-container').find('> .block-footer .add-clause-btn')
											   .prop('disabled', false);

		}

	});


	$('.query-builder').on('click', '.add-clause-btn', function() {
		$parent = $(this).closest('.block-container');

		var clausename = $parent.find('> .block-footer select.clause-list :selected').val();

		var condition = $parent.find('> .block-header select.condition :selected').val();

		// var parentClause = $parent.data('clause');
		$builder.cloneClause(clausename, $parent, condition);
	});	

	$('.query-builder').on('click', '.delete-clause-btn', function() {
		$parentBlock = $(this).closest('.block-container');
		// $parentBlock.prev('div.condition-name').remove();
		$parentBlock.remove();

	});

	function getJsonFromBuilder() {

		//Check for validity
		var errors = false;

		var validation = $builder.validate();

		if(validation.status == 'invalid') {
			errors = true;
			openModal(validation.element + '\n' + validation.message);
		}

		 $referreInput = $('div[data-clause="noOfActiveReferee"] .multiple-clause[data-dep-clause="noOfActiveReferee"] input.clause-field');
		 $referrals = $('div[data-clause="noOfReferralsMade"] .multiple-clause[data-dep-clause="noOfReferralsMade"] input.clause-field');

		 if($referreInput.length > 0 && $referrals.length > 0) {
		 	if($referreInput.val() > $referrals.val()) {
		 		errors = true;
		 		openModal("Number of active referee should be less than number of referrals made.");
		 	}
		 }

		 if(errors)
		 {
		 	return '';
		 }
		 return $builder.getJson();

	}


	$('.parse-json').on('click', function() {

		 var jsonOutput = getJsonFromBuilder();

		 if(jsonOutput == '') {
		 	return;
		 }

		 $('#result').removeClass('hide').find('pre').html(jsonOutput);

		 var signUpStatus = $('.is-signed-up').find('input[name="isSignedUp"]:checked').val();

	});


	$('.query-builder').on('change', '.clause-container .operator-list', function() {

		var $clause = $(this).closest('.clause-container'); 

		// Check if dependency is present
		var isDependent = $clause.data('is-dependent');

		var c, operator;

		if(isDependent == true) {
			c = $(this).closest('.multiple-clause').data('dep-clause');
		} else {
			c = $clause.data('clause');
		}

		operator = $(this).find(':selected').val();

		$builder.updateClause(c, operator, $clause);
	});

	$('.set-json').click(function() {
		$('#inputJson').removeClass('hide');
		$('#result').addClass('hide');
	});

	$('#set-json-btn').click(function() {
		var json =  $('#inputJson textarea').val();
		$builder.parseJson(json);
	});

	$('#modal-wrapper .modal-close-btn').click(function() {
		closeModal();
	});

	$('.query-builder').on('focus', '.clause-field', function() {
		$(this).removeClass('error-in-input');
	});

	$('.clear-btn').on('click', function() {
		$builder.clean();
	});


	$('.query-builder').on('change', 'select.condition-selector', function() {
		var $subblocks = $(this).closest('.block-container').find('> .block-body > .block-rules > .block-container');
		var newCond = $(this).find(":selected").val().toUpperCase();

		$subblocks.each(function() {
			$this = $(this);

			if(newCond == 'AND') {
				$(this).removeClass('condition-or').addClass('condition-and');
			} else {
				$(this).removeClass('condition-and').addClass('condition-or');
			}

		});

	});

	$('#query-save-btn').on('click', function() {
		var isEdit = $(this).data('edit') || '';
		if($('.query-title').val() == '') {
			openModal('Query Title is required');
		} else {
			var queryTitle = $('.query-title').val();
			var queryJson = getJsonFromBuilder();

			var signUpStatus = $('.is-signed-up').find('input[name="isSignedUp"]:checked').val();

			if(queryJson == '') {
				openModal('Invalid json.');
			} else {
				var data = {};
				data.queryTitle = queryTitle;
				data.isEdit = isEdit;

				var t = {};
				t.type = signUpStatus;
				t.query = JSON.parse(queryJson);

				data.jsonData = t;

				// Pass the json to parent window
				opener.callbackFromPopup('querybuilder', data);

				window.close();
			}

		}

	});

});


function openModal(message) {
	$modal = $('#modal-wrapper');
	$modal.find('.modal-box-body').text(message);
	$modal.fadeIn(200);
	$('body').addClass('modal-is-open');
}

function closeModal() {
	$modal = $('#modal-wrapper');
	$modal.fadeOut(200);
	$('body').removeClass('modal-is-open');
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

