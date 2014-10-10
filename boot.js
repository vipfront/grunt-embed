/*
 * grunt-embed
 * http://www.wuhaozheng.com
 */

var fs = require('fs');
 
var grunt = {
	file: {
		read: function( file, options ){
			var content = fs.readFileSync(file, options);
			return content;
		},
		write: function( file, content ){
			fs.writeFileSync(file, content);
		},
		copy: function(){
		}
	},
	log:{
		writeln: function( content ){
			console.log(content);
		}
	}
}
	
	
var path = require('path');
var embed = require('./tasks/lib/embed')(grunt);

function processFile(config, file){
	
	config.file = file;
	config.encoding = config.encoding || 'utf-8';
	config.map = config.map || function(file, config){
		return path.resolve(config.dest, path.relative('..', file));
	}
	config.urlmap = config.urlmap || {};
	
	var content = grunt.file.read(file, {encoding: config.encoding});
	content = embed.process( content, config.extension, config );
	
	var export_file = config.map(file, config);
	grunt.file.write(export_file, content, {encoding: config.encoding});

	if(content){
		grunt.log.writeln('\u001b[32mwrite in:'+export_file+'\u001b[2;37;0m');
	} else {
		grunt.log.writeln('\u001b[1;31mwarning: 生成了空的文件，'+file+'\u001b[2;37;0m');
	}
};

var config = this.data = {
	src: ['../../../src/index/index.html'],
	//dump: true,
	map: function(filename){
		var newfilename = filename.replace('../src/', '../release/').replace('\\src\\','\\release\\');
		console.log('replace:'+filename+'=>'+newfilename);
		return newfilename;
	},
	urlmap: {
		'http://m.daoju.qq.com/release/': '../'
	}
};

/*var config = this.data = {
	src: ['../../../release/index/index.js'],
	dump: true,
	map: function(filename){
		var newfilename = filename.replace('../release/', '../temp/release/').replace('\\release\\','\\temp\\release\\');
		console.log('replace:'+filename+'=>'+newfilename);
		return newfilename;
	}
}*/
			
this.target = 'online';
	
if(!config.embedFilter){
	config.embedFilter = [this.target];
}

config.src.forEach(function(file) {
	
	grunt.log.writeln('\u001b[32mprocessing:'+file+'\u001b[2;37;0m');
	if(!config.extension){
		var arr = file.split('.');
		config.extension = arr[arr.length-1];
	}
	processFile(config, file);
	
});
