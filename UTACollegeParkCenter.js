/**
 * 
 */

var request=require('request')
	,fs=require('fs')
	,cheerio = require('cheerio')
	,querystring = require('querystring');

var mainUrl = 'http://www.utacollegepark.com/events/';

var UTACollegeParkCenter = function(){
};

UTACollegeParkCenter.prototype.executeAllSinglePageEventSerially = function(links,callback){
	var tasks = [];
	var buffer=[];
	
	for(var i = 0; i < links.length; i++){
		var task = (function(link){
			return function(){
				UTACollegeParkCenter.prototype.retrieveSinglePageEvent(link,function(err, data){
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
		var task = tasks.shift();
		
		if(task)
			task();
		else{
			callback(null,buffer);
		}
	}
	
	next();
	
};

UTACollegeParkCenter.prototype.retrieveSinglePageEvent = function(url, callback){
	if(typeof url !== 'string'){
		if(typeof callback === 'function')
			callback(new Error('url is not a string'),null);
	}else{
		var fullURL = mainUrl+url;
		var date = fullURL.split('eid=')[1].substr(0, 10);
		request.get(fullURL, function(err,res,body){
			var $ = cheerio.load(body);
			var r = parseHTML($);
			r.date = date;
			if(typeof callback === 'function')
				callback(null,r);
		});
	}
	
	//Time: Friday, May 9, 2014Time: 11:00 a.m.Doors Open: 10:00 a.m.
	function parseHTML($){
		var temp = $('p[class=event-description-header]').text();
		var time = parseTime(temp);
		var content = parseContent($);
		var result = {
				time: time,
				title: content.title,
				description: content.description
		};
		return result;
	}
	
	function parseContent($){
		var title = $('div#content h3').text();
		var num=$('div#content p').length;
		var description = $('div#content p')[num -1].children[0].data;
		return {
			title:title,
			description:description
		};
	}
	
	function parseTime(str){
		var r = str.split('Time: ')[1].trim();
		return r.split('Doors Open:')[0].trim();
	}
	
}
//where data is html
UTACollegeParkCenter.prototype.retrieveSingleEventsList = function(data,callback){
	if(typeof data !== 'string'){
		if(typeof callback === 'function')
			callback(new Error('data is not a string'), null);
	}else{
		var $=cheerio.load(data);
		var anchors=$('a');
		var result=[];
		for(var i=0; i < anchors.length; i++){
			var href = anchors[i].attribs.href;
			if(href && href.indexOf('event.php') > -1){
				href = href.substr('/events'.length+1, href.length - 1);
				result.push(href);
			}
		}
		
		if(typeof callback === 'function')
			callback(null,result);
	}
};

UTACollegeParkCenter.prototype.retrieveEventsForMonthAndYear = 
	function(month,year,callback){
	
	if(typeof month !== 'string' || typeof year !== 'string'){
		if(typeof callback === 'function')
			callback(new Error('month and year must be string'), null);
	}else{
		var query={
				view:'list',
				month:month,
				year:year
		};
		var encodedQuery = querystring.stringify(query);
		var url =mainUrl+'index.php';
		console.log(encodedQuery);
		request.get(url+'?'+encodedQuery , function(err,res,body){	
			if(err)
				callback(err,null);
			else
				callback(null,body);
		});
	}
};

exports.utacollegeparkcenter = function(){
	return new UTACollegeParkCenter();
};