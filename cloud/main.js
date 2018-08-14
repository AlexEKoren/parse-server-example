var Follow = Parse.Object.extend('Follow');
var Event = Parse.Object.extend('Event');
var Title = Parse.Object.extend('Title');
var Badge = Parse.Object.extend("Badge");

var god_ids = ['vmBSxOeEbP', 'P5CBED1VUc'];
var god_accounts = god_ids.map(god_id => {
	return Parse.User.createWithoutData(god_id);
});


Parse.Cloud.define('get_events', function(request, response) {
	var query = new Parse.Query(Event);
	var title = Title.createWithoutData(request.params.title_id);
	query.equalTo('title', title);
	query.include('title');
	query.include('user');
	updateQueryWithFollowers(request, query, function(following_query) {
		recursiveQuery(following_query, 0, []).then(function(events) {
			response.success(events);
		},
		function(error) {
			response.error(error);
		});
	});
	
});

function updateQueryWithFollowers(request, query, callback) {
	console.log(request.params.global);
	if (request.params.global == true) 
		return callback(query);

	var follow_query = new Parse.Query(Follow);
	follow_query.equalTo('follower', request.user);
	follow_query.include('following');
	query.matchesKeyInQuery('user', 'following', follow_query);
	var user_query = new Parse.Query(Event);
	user_query.equalTo('user', request.user);
	user_query.equalTo(Title.createWithoutData(request.params.title_id));
	user_query.include('title');
	user_query.include('user');

	var total_query = Parse.Query.or(user_query, query);
	total_query.include('title');
	total_query.include('user');
	callback(total_query);
}

Parse.Cloud.beforeSave("Follow", function(request, response) {
	if (!request.user && !request.master)
		return response.error('You must be logged in to create follows');
	if (request.user && request.user.id != request.object.get('follower').id) {
		return response.error('You can\'t create a follow for another user!');
	}
	if (request.object.get('follower').id == request.object.get('following').id) {
		return response.error('You can\'t follow yourself!');
	}
	
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

var FIRST_TIMER = 'First Timer';
var SPREADING_THE_WORD = 'Spreading the Word';

Parse.Cloud.define("did_sync", function(request, response) {
	checkForBadge(request, response, FIRST_TIMER, function() {
		createBadge(request, response, FIRST_TIMER, 'Successfully synchronize with a movie.', 0);
	});
});

Parse.Cloud.define("did_share", function(request, response) {
	checkForBadge(request, response, SPREADING_THE_WORD, function() {
		createBadge(request, response, SPREADING_THE_WORD, 'Shared the app with new people!', 0);
	});
});

function checkForBadge(request, response, name, callback) {
	if (!request.user)
		return response.error('You must be logged in to record a sync');
	var query = new Parse.Query(Badge);
	query.equalTo('user', request.user);
	query.equalTo('name', name);
	query.count({
		success: function(count) {
			if (count <= 0)
				callback();
			else
				response.error('Badge already exists');
		},
		error: function(error) {
			response.error('Query error: ' + error);
		}
	})
}

function createBadge(request, response, name, description, level) {
	var badge = new Badge();
	badge.set("user", request.user);
	badge.set("name", name);
	badge.set("description", description);
	badge.set("level", level);
	badge.save(null, {
		success: function(badge) {
			console.log(badge);
			response.success(badge);
		},
		error: function(badge, error) {
			response.error('Save error: ' + error);
		}
	});
}

function simpleQuery(query, batchNumber) {
  query.limit(1000);
  query.skip(batchNumber * 1000);

  return query.find().then(
    function(objects) {
      return objects;
    },
    function(error) {
      return error;
    }
  );
}

function recursiveQuery(query, batchNumber, allObjects) {
  return simpleQuery(query, batchNumber).then(function(objects) {
    // concat the intermediate objects into the final array
    allObjects = allObjects.concat(objects);
    // if the objects length is 1000, it means that we are not at the end of the list
    if (objects.length === 1000) {
      batchNumber = batchNumber + 1;
      return recursiveQuery(query, batchNumber, allObjects);
    } else {
      return allObjects;
    }
  });
}