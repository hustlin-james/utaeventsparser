var connect = require('connect')
	,url = require('url')
	,path = require('path')
	,fs = require('fs');

var utacal = require('./UTACalendar').utacalendar();
var utacolparkcal = require('./UTACollegeParkCenter').utacollegeparkcenter();

var fileCacheDir= path.join('.', 'filecachedir');


var app = connect()
//req url processing
.use(function(req, res, next){
	var query = url.parse(req.url,true).query;
	var pathname = url.parse(req.url).pathname;
	req.query = query;
	req.pathname = pathname;
	next();
})
//File System cache
.use(function(req,res, next){
	if(req.method==='GET'){
		if(req.pathname === '/utacal'){
			req.filepath = req.pathname.substr(1, req.pathname.length) +'_'+req.query.date+'.json';
			req.filepath = path.join(fileCacheDir, req.filepath);
			console.log('filename: '+req.filepath);
			//TODO if file exists then server the file
			var filepath = req.filepath;
			
			fs.exists(filepath, function(exists){
				if(exists){
					console.log('file is cached: '+filepath);
					var stream = fs.createReadStream(filepath);
					stream.pipe(res);
				}else{
					next();
				}
			});
		}
		else if(req.pathname === '/utacolpark'){
			var month=req.query.month;
			var year=req.query.year;
			
			var filepath = req.pathname.substr(1, req.pathname.length)+'_'+month+'_'+year+'.json';
			req.filepath = path.join(fileCacheDir, filepath);
			filepath = req.filepath;
			fs.exists(filepath, function(exists){
				if(exists){
					console.log('file is cached: '+filepath);
					var stream = fs.createReadStream(filepath);
					stream.pipe(res);
				}else{
					next();
				}
			});
		}
		else{
			next();
		}
	}else{
		res.end('{error: method not supported}');
	}
})
.use(function(req,res){
	
	if(req.method === 'GET'){
		if(req.pathname === '/utacal'){
			
			var date = req.query.date;
			
			utacal.retrieveHTMLPageForDate(date, function(err,data){
				utacal.retrieveSingleDayEventAnchors(data, function(err,data){
					//returns array of strings
					
					res.setHeader('Content-Type', 'application/json');
					
					utacal.executeAllSingleDayEventsSerially(data, function(err,data){
						if(err){
							console.log('error: executeAllSingleDayEventsSerially');
							res.end('{error: '+err+'}');
						}else{
							//fs.writeFile()
							var filepath = req.filepath;
							var jsonStr = JSON.stringify(data);
							
							fs.writeFile(filepath, jsonStr, function(err){
								if(err)
									console.log('error writing file: '+filepath);
								else
									console.log('finished writing file: '+filepath);
							});
							res.setHeader('Content-Length', Buffer.byteLength(jsonStr));
							res.end(jsonStr);
						}
					});
				});
			});
		}
		else if(req.pathname === '/utacolpark'){
			var month=req.query.month;
			var year=req.query.year;
			
			console.log('month: '+month);
			console.log('year: '+year);
		
			utacolparkcal.retrieveEventsForMonthAndYear(month,year, function(err,data){
				utacolparkcal.retrieveSingleEventsList(data, function(err,data){
					
					utacolparkcal.executeAllSinglePageEventSerially(data, function(err,data){
						//data is an array
						res.setHeader('Content-Type', 'application/json');
						if(err){
							console.log('error: executeAllSinglePageEventSerially');
							res.end('{error: '+err+'}');
						}
						else{
							var jsonStr = JSON.stringify(data);
							var filepath = req.filepath;
							
							fs.writeFile(filepath, jsonStr, function(err){
								if(err)
									console.log('error writing file: '+filepath);
								else
									console.log('finished writing file: '+filepath);
							});
							
							res.setHeader('Content-Length', Buffer.byteLength(jsonStr));
							res.end(jsonStr);
						}
					});
				});
			});
			
			
		}else{
			var str = 'please use: /utacal or /utacolpark';
			str+= '\n EX: ';
			str+= '\n /utacal?date=yyyy-mm-dd';
			str+= '\n /utacolpark?month=mm&year=yyyy';
			res.setHeader('Content-Type', 'text/plain');
			res.setHeader('Content-Length', Buffer.byteLength(str));
			res.end(str);
		}
	}else{
		res.end('{error: method not supported}');
	}
});

app.listen(3000);
