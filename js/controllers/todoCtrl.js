/*global todomvc, angular, Firebase */
'use strict';

/**
* The main controller for the app. The controller:
* - retrieves and persists the model via the $firebaseArray service
* - exposes the model to the template and provides event handlers
*/
todomvc.controller('TodoCtrl',
['$scope', '$location', '$firebaseArray', '$sce', '$localStorage', '$window',
function ($scope, $location, $firebaseArray, $sce, $localStorage, $window) {
	// set local storage
	$scope.$storage = $localStorage;

	var scrollCountDelta = 10;
	$scope.maxQuestion = scrollCountDelta;

	/*
	$(window).scroll(function(){
	if($(window).scrollTop() > 0) {
	$("#btn_top").show();
} else {
$("#btn_top").hide();
}
});
*/
var splits = $location.path().trim().split("/");
var roomId = angular.lowercase(splits[1]);
if (!roomId || roomId.length === 0) {
	roomId = "all";
}

// TODO: Please change this URL for your app
var firebaseURL = "https://classquestion.firebaseio.com/";

$scope.roomId = roomId;
var url = firebaseURL + roomId + "/questions/";
var echoRef = new Firebase(url);

var query = echoRef.orderByChild("order");
// Should we limit?
//.limitToFirst(1000);
$scope.todos = $firebaseArray(query);

//$scope.input.wholeMsg = '';
$scope.editedTodo = null;

Date.prototype.dateDiff = function(interval,now) { 
    var t = now.getTime() - this.getTime();
    var i = {};
    
    i['d']=Math.floor(t/86400000);
    t = t % 86400000;
    i['h']=Math.floor(t/3600000);
    t = t % 3600000;
    i['m']=Math.floor(t/60000);
    t = t % 60000;
    i['s']=Math.floor(t/1000);
    return i[interval]; 
}

$scope.getQYTime = function(postTime) {
    if (postTime == 0) return '';
    var postDate = new Date(postTime);
    var now = new Date();
    var d = postDate.dateDiff('d',now);
    var h = postDate.dateDiff('h',now);
    var m = postDate.dateDiff('m',now);
    var s = postDate.dateDiff('s',now);
    var dateString="";
    if (d != 0) {
	dateString+=d;
	if (d == 1) {
	    dateString +=" day ";
	} else  {
	    dateString +=" days ";
	}
	if (h == 0) {
	    dateString +=" ago";
	} else if (m==1) {
	    dateString +="1 hour ago";
	} else {
	    dateString +=h+" hours ago";
	}
    } else {
	if (h == 0) {
	} else if (h == 1) {
	    dateString = "1 hour "
	} else {
	    dateString = h + " hours "
	}
	if (m == 0) {
	} else if (m == 1) {
	    dateString += "1 minute ago";
	} else {
	    dateString += m+" minutes ago";
	}
    }
    if (dateString == '') return 'just now'; 
    return dateString;
};

$scope.trInput = {
    from: {
	name: 'from',
	value: -5000000000000
    },
    to: {
	name: 'to',
	value: 5000000000000
    } 
};

$scope.trOptions = [
		    {
			name: 'now',
			value: 5000000000000
		    },
		    {
			name: '1 hour ago',
			value: -3600000
		    },
		    {
			name: '2 hour ago',
			value: -7200000
		    },
		    {
			name: '1 day ago',
			value: -24*3600000
		    },
		    {
			name: '1 week ago',
			value: -7*24*3600000
		    },
		    {
			name: '30 days ago',
			value: -30*24*3600000
		    },
		    {
			name: '365 days ago',
			value: -365*24*3600000
		    },
		    {
			name: 'time origin',
			value: -5000000000000
		    }
		    ];
    
// pre-precessing for collection
$scope.$watchCollection('todos', function () {
	var total = 0;
	var remaining = 0;
	$scope.todos.forEach(function (todo) {
		// Skip invalid entries so they don't break the entire app.
		if (!todo || !todo.head ) {
			return;
		}

		total++;
		if (todo.completed === false) {
			remaining++;
		}

		// set time
		//todo.dateString = new Date(todo.timestamp).toString();
		todo.dateString = $scope.getQYTime(todo.timestamp);
		todo.tags = todo.wholeMsg.match(/#\w+/g);
		todo.splitMsg = todo.wholeMsg.split(/(#\w+)/g);
		todo.displayMsg = [];
		for (var i in todo.splitMsg) {
		    if (todo.splitMsg[i][0] != '#') {
			todo.displayMsg.push($sce.trustAsHtml('<plaintext>'+todo.splitMsg[i]));
		    }
		    else todo.displayMsg.push($sce.trustAsHtml('<a style="display:inline">' + todo.splitMsg[i]  + '</a>'));
		}

		todo.trustedDesc = $sce.trustAsHtml(todo.linkedDesc);
	});

	$scope.totalCount = total;
	$scope.remainingCount = remaining;
	$scope.completedCount = total - remaining;
	$scope.allChecked = remaining === 0;
	$scope.absurl = $location.absUrl();
}, true);

$scope.editInput = function($string) {
    if ($string.length >= 11 && $string.toString().slice(0,11) == '<plaintext>') return;
    $scope.input.wholeMsg = $string.toString().match(/#\w+/g)[0];
};

// Get the first sentence and rest
$scope.getFirstAndRestSentence = function($string) {
	var head = $string;
	var desc = "";

	var separators = [". ", "? ", "! ", '\n'];

	var firstIndex = -1;
	for (var i in separators) {
		var index = $string.indexOf(separators[i]);
		if (index == -1) continue;
		if (firstIndex == -1) {firstIndex = index; continue;}
		if (firstIndex > index) {firstIndex = index;}
	}

	if (firstIndex !=-1) {
		head = $string.slice(0, firstIndex+1);
		desc = $string.slice(firstIndex+1);
	}
	return [head, desc];
};

$scope.addTodo = function () {
	var newTodo = $scope.input.wholeMsg.trim();

	// No input, so just do nothing
	if (!newTodo.length) {
		return;
	}

	var firstAndLast = $scope.getFirstAndRestSentence(newTodo);
	var head = firstAndLast[0];
	var desc = firstAndLast[1];

	$scope.todos.$add({
		wholeMsg: newTodo,
		head: head,
		headLastChar: head.slice(-1),
		desc: desc,
		linkedDesc: Autolinker.link(desc, {newWindow: false, stripPrefix: false}),
		completed: false,
		timestamp: new Date().getTime(),
		tags: "...",
		echo: 0,
		    hate: 0,
		    reply: [[' ',0]],
		    new_reply: '',
		order: 0
	});
	// remove the posted question in the input
	$scope.input.wholeMsg = '';
};

$scope.addReply = function (todo) {
    var now = new Date();
    todo.reply.push([todo.new_reply,now.getTime()]);
    todo.new_reply = '';
    $scope.todos.$save(todo);
};

$scope.editTodo = function (todo) {
	$scope.editedTodo = todo;
	$scope.originalTodo = angular.extend({}, $scope.editedTodo);
};

$scope.addEcho = function (todo) {
	$scope.editedTodo = todo;
	todo.echo = todo.echo + 1;
	// Hack to order using this order.
	todo.order = todo.order -1;
	$scope.todos.$save(todo);

	// Disable the button
	$scope.$storage[todo.$id] = "echoed";
};

$scope.addHate = function (todo) {
	$scope.editedTodo = todo;
	todo.hate = todo.hate + 1;
	// Hack to order using this order.
	todo.order = todo.order + 1;
	$scope.todos.$save(todo);

	// Disable the button
	$scope.$storage[todo.$id] = "echoed";
};

$scope.doneEditing = function (todo) {
	$scope.editedTodo = null;
	var wholeMsg = todo.wholeMsg.trim();
	if (wholeMsg) {
		$scope.todos.$save(todo);
	} else {
		$scope.removeTodo(todo);
	}
};

$scope.revertEditing = function (todo) {
	todo.wholeMsg = $scope.originalTodo.wholeMsg;
	$scope.doneEditing(todo);
};

$scope.removeTodo = function (todo) {
	$scope.todos.$remove(todo);
};

$scope.clearCompletedTodos = function () {
	$scope.todos.forEach(function (todo) {
		if (todo.completed) {
			$scope.removeTodo(todo);
		}
	});
};

$scope.toggleCompleted = function (todo) {
	todo.completed = !todo.completed;
	$scope.todos.$save(todo);
};

$scope.markAll = function (allCompleted) {
	$scope.todos.forEach(function (todo) {
		todo.completed = allCompleted;
		$scope.todos.$save(todo);
	});
};

$scope.FBLogin = function () {
	var ref = new Firebase(firebaseURL);
	ref.authWithOAuthPopup("facebook", function(error, authData) {
		if (error) {
			console.log("Login Failed!", error);
		} else {
			$scope.$apply(function() {
				$scope.$authData = authData;
				$scope.isAdmin = true;
			});
			console.log("Authenticated successfully with payload:", authData);
		}
	});
};

$scope.FBLogout = function () {
	var ref = new Firebase(firebaseURL);
	ref.unauth();
	delete $scope.$authData;
	$scope.isAdmin = false;
};

$scope.increaseMax = function () {
	if ($scope.maxQuestion < $scope.totalCount) {
		$scope.maxQuestion+=scrollCountDelta;
	}
};

$scope.toTop =function toTop() {
	$window.scrollTo(0,0);
};

// Not sure what is this code. Todel
if ($location.path() === '') {
	$location.path('/');
}
$scope.location = $location;

// autoscroll
angular.element($window).bind("scroll", function() {
	if ($window.innerHeight + $window.scrollY >= $window.document.body.offsetHeight) {
		console.log('Hit the bottom2. innerHeight' +
		$window.innerHeight + "scrollY" +
		$window.scrollY + "offsetHeight" + $window.document.body.offsetHeight);

		// update the max value
		$scope.increaseMax();

		// force to update the view (html)
		$scope.$apply();
	}
});

}]);
