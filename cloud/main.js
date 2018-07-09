
Parse.Cloud.beforeSave("Follow", function(request, response) {
	var Follow = Parse.Object.extend("Follow");
	var query = new Parse.Query(Follow);
	query.equalTo('following', request.object.get('following'));
	query.equalTo('follower', request.object.get('follower'));
	query.count({
		success: function(count) {
			if (count > 0) {
				response.error('This follow already exists!');
			} else {
				response.success();
			}
		},
		error: function(error) {
			response.error('Failed to run the query');
		}
	})
});