
Parse.Cloud.beforeSave("Follow", function(request, response) {
	if (!request.master && request.user && request.user.id != request.object.get('follower').id) {
		return response.error('You can\'t create a follow for another user!');
	}
	if (!request.user)
		return response.error('You must be logged in to create follows');
	var Follow = Parse.Object.extend("Follow");
	var query = new Parse.Query(Follow);
	query.equalTo('following', request.object.get('following'));
	query.equalTo('follower', request.object.get('follower'));
	query.count({
		useMasterKey:true,
		success: function(count) {
			if (count > 0) {
				response.error('This follow already exists!');
			} else {
				response.success();
			}
		},
		error: function(error) {
			response.error('Query error: ' + error);
		}
	})
});