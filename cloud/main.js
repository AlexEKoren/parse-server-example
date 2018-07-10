Parse.Cloud.beforeSave("Follow", function(request, response) {
	if (!request.user && !request.master)
		return response.error('You must be logged in to create follows');
	if (request.user && request.user.id != request.object.get('follower').id) {
		return response.error('You can\'t create a follow for another user!');
	}
	if (request.object.get('follower').id == request.object.get('following').id) {
		return response.error('You can\'t follow yourself!');
	}
	
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

Parse.Cloud.define("unfollow", function(request, response) {
	if (!reuest.user)
		return response.error('You must be logged in to unfollow');
	if (request.user && request.user.id != request.object.get('follower').id) {
		return.response.error('You can\'t unfollow for another user!');
	}
	var Follow = Parse.Object.extend("Follow");
	var query = new Parse.Query(Follow);
	query.equalTo('following', request.object.get('following'));
	query.equalTo('follower', request.object.get('follower'));
	query.find({useMasterKey:true}).then(follows => {
		if (follows.length <= 0)
			return response.success();

		return Parse.Object.destroyAll(follows);
	}).then(() => {
		return response.success();
	}).catch(error => {
		return response.error(error);
	});
});