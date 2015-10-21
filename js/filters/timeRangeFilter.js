/*global todomvc, angular, Firebase */
'use strict';

/**
 * This filter return todo with timestamp within certain range  
 **/

todomvc.filter("trfilter",function() {
	return function(items,from,to) {
	    var now = new Date().getTime();
	    from = from + now;
	    to = to + now;
	    var results = [];
	    for (var i = 0; i < items.length; i++) {
		if (items[i].timestamp > from && items[i].timestamp < to)
		    results.push(items[i]);
	    }
	    //for (var i = 0; i < items.length; i++) items[i].head = items[i].timestamp;
	    //return items
	    return results;
	};
    });