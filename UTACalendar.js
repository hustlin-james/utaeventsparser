var request=require('request')
	,fs=require('fs')
	,cheerio = require('cheerio')
	,querystring = require('querystring')
	,ical=require('ical');

var mainUrl = 'http://www.uta.edu/events/';

var UTACalendar = function(){
	//may put something here later...
};

//inputDate: YYYY-MM-DD
//2014-05-12
UTACalendar.prototype.retrieveHTMLPageForDate = function(inputDate,callback){
	if(inputDate.length > 10 || typeof inputDate !== 'string'){
		var err = new Error("inputDate is wrong");
		if(typeof callback === 'function')
			callback(err,null);
	}else{
		//retrieve the html page and store in data variable
		var timeBegin=inputDate+' 00:00:00';
		var timeEnd=inputDate+' 23:59:00';
		var view='day';
		
		var query = {
				'timebegin':timeBegin,
				'timeend':timeEnd,
				'view':view
		};
		var encodedQuery = querystring.stringify(query);
		
		request.get(mainUrl+'main.php?'+encodedQuery, function(err,res,body){
			if(err)
				callback(err,null);
			else
				callback(null,body);
		});
	}
};

UTACalendar.prototype.retrieveSingleDayEventAnchors = function(html,callback){
	if(typeof html !== 'string'){
		if(typeof callback === 'function'){
			callback(new Error('html parameter must be string'), null);
		}
	}else{
		 var $ = cheerio.load(html);
	     var anchors = $('a');
	     var result = [];
	     for(var i = 0; i < anchors.length; i++){
	    	 var a = anchors[i];
	    	 var href = a.attribs.href;
	    	 if(href.indexOf('eventid') > -1){
	    		 result.push(href);
	    	 }
	     }
	 
	     if(typeof callback === 'function'){
	    	 callback(null, result);
	     }
	}
};

UTACalendar.prototype.retrieveSingleDayEvent = function(eventLink,callback){
	if(typeof eventLink !== 'string'){
		if(typeof callback === 'function')
			return callback(new Error('eventLink must be a string'),null);
	}
	var url = mainUrl+eventLink;
	request.get(url, function(err,res,body){
		
		if(err){
			if(typeof callback === 'function'){
				return callback(err, null);
			}
		}
		
		var $ = cheerio.load(body);
		var anchors = $('a');
		
		var icalendarLink = '';
		for(var i = 0; i < anchors.length; i++){
			var a = anchors[i];
			var href=a.attribs.href;
			if(href.indexOf('icalendar') > -1)
				icalendarLink = href;
		}
		
		ical.fromURL(mainUrl+icalendarLink, {},function(err, data) {
			
			if(err){
				if(typeof callback === 'function')
					return callback(err, null);
			}
			
			var result = parseIcalendar(data);
			if(typeof callback==='function'){
				callback(null, result);
			}
			
		    function parseIcalendar(data){
		    	var firstKey = '';
		        for (var key in data) {
		          if (data.hasOwnProperty(key)) {
		            firstKey = key;
		            break;
		          }
		        }
		        
		         /*
		            start,end,summary,description,location
		         */
		         var obj=data[firstKey];
		         var start = obj.start.toString();
		         var end = obj.end.toString();
		         var summary = obj.summary;
		         var description = obj.description;
		         var location = obj.location;

		         return {
		            start:start,
		            end: end,
		            summary: summary,
		            description: description,
		            location:location
		         };
		    }
		});
		
	});
	
};

//the callback will be appied to each single day event retrieval
UTACalendar.prototype.executeAllSingleDayEventsSerially = function(links,callback){
	
	var tasks = [];
	var buffer = [];
	
	//creating the tasks
	for(var i = 0; i < links.length; i++){
		var task = (function(link){
			return function(){
				UTACalendar.prototype.retrieveSingleDayEvent(link,function(err, data){
					if(err)
						next({});
					else
						next(data);
				});
			};
		})(links[i]);
		
		tasks.push(task);
	}
	
	function next(data){
		if(data)
			buffer.push(data);
		var currentTask = tasks.shift();
		if(currentTask){
			currentTask();
		}
		else{
			//finsihed
			callback(null, buffer);
		}
	}
	next();
};

exports.utacalendar = function(){
	return new UTACalendar();
};