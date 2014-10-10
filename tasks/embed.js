/*
 * grunt-embed
 * http://www.wuhaozheng.com
 */

module.exports = function(grunt) {
	'use strict';
	
	var path = require('path');
	var embed = require('./lib/embed')(grunt);
	
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
	
	//用于将需要保护的文件放到保护文件夹中
	grunt.registerMultiTask('embed', '', function(param) {
		
		var config = this.data;
		if(!config.embedFilter){
			config.embedFilter = [this.target];
		}
		//设置默认选项
		var options = this.options({
		});
		
		this.files.forEach(function(file) {
		
			var valid = file.src.filter(function(filepath) {
				if (!grunt.file.exists(filepath)) {
					grunt.log.warn('源文件：' + filepath + '不存在!');
					return false;
				} else {
					return true;
				}
			});
			
			var content = valid.map(function(file) {
				grunt.log.writeln('\u001b[32mprocessing:'+file+'\u001b[2;37;0m');
				if(!config.extension){
					var arr = file.split('.');
					config.extension = arr[arr.length-1];
				}
				processFile(config, file);
			});
			
		});
		
		return;
	});

};