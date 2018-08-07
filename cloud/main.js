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
	console.log('UNFOLLOW: ' + request.params.following_id);
	if (!request.user)
		return response.error('You must be logged in to unfollow');
	var following = Parse.User.createWithoutData(request.params.following_id);
	var Follow = Parse.Object.extend("Follow");
	var query = new Parse.Query(Follow);
	query.equalTo('following', following);
	query.equalTo('follower', request.user);
	query.find({useMasterKey:true}).then(function(follows) {
		if (follows.length <= 0)
			return response.success();

		return Parse.Object.destroyAll(follows);
	}).then(function() {
		return response.success();
	}).catch(function(error) {
		return response.error(error);
	});
});

Parse.Cloud.define("did_sync", function(request, response) {
	if (!request.user)
		return response.error('You must be logged in to record a sync');
	var Badge = Parse.Object.extend("Badge");
	var query = new Parse.Query(Badge);
	query.equalTo('user', request.user);
	query.count({
		success: function(count) {
			if (count <= 0)
				response.success();
			else
				response.error('Badge already exists');
		},
		error: function(error) {
			response.error('Query error: ' + error);
		}
	})
});