/*
 * grunt-embed
 * http://www.wuhaozheng.com
 */
var fs = require('fs');
var parser = require('./parser');

var filter = false,
	root = false;

var plugin_level = {
		enable: 1,
		disable: 1
	}
	
function analysisEmbedTag(node){
	var laseKey,
		params = {},
		arr = [],
		child = node.child,
		state,
		cmd,
		par,
		arr_cmd = [];
	
	function pull_arr(arr){
		var con, pos;
		for(var n=0;n<arr.length;++n){
			con = arr[n];
			while(con){
				con = con.replace(/(^\s*)|(\s*$)/g, "");
				switch(state){
					case 'read_action':
						cmd = {};
						if(!con){
							con = false;
							break;
						}
						pos = con.indexOf('(');
						if(pos>=0){
							cmd.action = con.substr(0, pos);
							cmd.level = plugin_level[cmd.action] || 0;
							con = con.substr(pos+1);
							cmd.params = [];
							state = 'read_param';
						} else {
							cmd.action = con;
							cmd.level = plugin_level[cmd.action] || 0;
							arr_cmd.push(cmd);
							con = false;
						}
						break;
					case 'read_param':
						if(con == ')'){
							arr_cmd.push(cmd);
							con = false;
							break;
						}
						pos = con.indexOf(')');
						if(pos>=0){
							par = con.substr(0, pos).split(',');
							for(var m=0;m<par.length;++m){
								cmd.params.push(par[m].replace(/(^\s*)|(\s*$)/g, ""));
							}
							arr_cmd.push(cmd);
							con = con.substr(pos+1);
							state = 'read_action';
						} else {
							par = con.split(',');
							for(var m=0;m<par.length;++m){
								cmd.params.push(par[m].replace(/(^\s*)|(\s*$)/g, ""));
							}
							con = false;
						}
				}
			}
		}
	}
	
	if(child.length && child[0].type=='content') {
		arr = child[0].content.replace(/(^\s*)|(\s*$)/g, "").replace(/\s+/g, ' ').split(' ');
		var id_filter = false,
			str_filter = arr.shift(),
			arr_filter = str_filter.split(':');
		
		if(arr_filter.length>=2){
			id_filter = arr_filter[1];
		}
		
		if(id_filter && filter.indexOf(id_filter)<0){
			return 0;
		}
		
		state = 'read_action';
		pull_arr(arr);
		
		for(var n=1;n<child.length;++n){
			if(child[n].type=='content'){
				arr = child[n].content.replace(/(^\s*)|(\s*$)/g, "").replace(/\s+/g, ' ').split(' ');
				pull_arr(arr);
			} else if(child[n].type=='quote') {
				if(cmd && cmd.params && cmd.params.push){
					cmd.params.push(child[n].content.substring(child[n].token.length, child[n].content.length - child[n].expect.length));
				}
			}
		}
	}
	arr_cmd.sort(function(a, b){
		if(a.level < b.level)return 1;
	});
	return arr_cmd;
}

function isValidEmbedTag( node ){
	if(node.embedTag){
		var sign = node.content.substr(node.token.length).replace(/(^\s*)/, "").substr(0,6);
		return /^embed\W/.test(sign);
	} else {
		return false;
	}
}

function isRealEmbedTag( node ){
	if(node.embedTag){
		var sign = node.content.substr(node.token.length).replace(/(^\s*)/, "").substr(0,6);
		return /^[_!]?embed\W/.test(sign);
	} else {
		return false;
	}
}

function analysisNodeTree(parent, node, index, deep, grammar, options){
	if(isValidEmbedTag( node )){
		var tag = analysisEmbedTag(node);
		if(tag && tag.length){
			for(var n=0;n<tag.length;++n){
				if(tag[n].action){
					try{
						var plugin = require('../plugins/'+tag[n].action+'.js');
					} catch(e){
						var plugin = false;
						if(e.code == 'MODULE_NOT_FOUND'){
							grunt.log.writeln('\u001b[1;33m'+node.content+'\u001b[2;37;0m');
							grunt.log.writeln('\u001b[1;31m错误：插件 '+tag[n].action+'未找到，请确保此插件存在于位置：'+'./node_modules/grunt-embed/tasks/plugins/'+tag[n].action+'.js\u001b[2;37;0m')
						} else {
							grunt.log.writeln(e);
						}
					}
					if(plugin && plugin.run){
						(function(runtime){
							var grammar = require('../grammar/'+runtime.grammar);
							plugin.run(grunt, {
								getDocumentRoot: function(){
									return root;
								},
								getCurrentNode: function(){
									node.index = runtime.nodeIndex;
									return node;
								},
								getNextValidNode: function(options){
									var parent = runtime.nodeParent,
										index = runtime.nodeIndex,
										elem;
										++index;
										elem = parent.child[index];
									
									options = options || {};
									while(elem){
										if( !options.realEmbedTag && isRealEmbedTag( elem )){
											++index;
											elem = parent.child[index];
										} else if( options.embedTag && elem.embedTag ){
											elem.index = index;
											break;
										} else if( grammar.isValidNode(elem) ){
											elem.index = index;
											break;
										} else {
											++index;
											elem = parent.child[index];
										}
									}
									if(!elem.content){
										elem.content = parser.restoreNodeTree(elem);
									}
									elem.grammar = runtime.grammar;
									return elem;
								},
								getNodeParam: function( node ){
									return grammar.getNodeParam(node);
								},
								getBaseUrl: function(){
									return options.baseUrl;
								},
								getSourcePath: function(file){
									if(file.replace(/(^\s*)|(\s*$)/g, "").substr(0,7).toLowerCase()=='http://'){
										var urlmap = options.urlmap;
										for(var key in urlmap){
											file = file.replace( key, urlmap[key] );
										}
									}
									var path = require('path');
									file = file.split('?')[0];
									if(options.basePath){
										return options.basePath;
									} else {
										var newfile = path.resolve(options.file, '..', file)
										return newfile;
									}
								},
								getTargetPath: function(file){
									return options.map(this.getSourcePath(file));
								},
								getDocumentFile: function(){
									return options.file;
								},
								getDocumentConfig: function(){
									return options;
								},
								getEmbedTag: function(){
									return runtime.paramEmbedTag;
								},
								getGrammar: function(){
									return runtime.grammar;
								},
								disableNode: function( node ){
									if(!node.content){
										node.content = parser.restoreNodeTree(node);
									}
									return grammar.disableNode(node);
								},
								enableNode: function( node ){
									if(!node.content){
										node.content = parser.restoreNodeTree(node);
									}
									var content = grammar.removeNodeWarp(node);
									var newnode = parser.getRootTree( content, runtime.grammar );
									if(newnode.type == 'root' && newnode.child.length){
										var buff = [node.index, 1];
										for(var n=0;n<newnode.child.length;++n){
											newnode.child[n].parent = runtime.nodeParent;
											buff.push(newnode.child[n]);
										}
										runtime.nodeParent.child.splice.apply(runtime.nodeParent.child, buff);
										//runtime.nodeParent.child.splice.apply(this, buff);
									}
								},
								log: function(content){
									grunt.log.writeln('\u001b[1;31m警告，来自插件['+tag[n].action+']：'+content+'\u001b[2;37;0m');
								}
							}, tag[n].params);
						})({
								nodeEmbedTag: node,
								nodeParent: parent,
								nodeIndex: index,
								nodeDeep: deep,
								grammar: grammar,
								paramEmbedTag: tag,
								root: root
						});
					}
				}
			}
			node.content = node.content.replace('embed', '_embed');
			if(node.child.length){
				node.child[0].content = node.child[0].content.replace('embed', '_embed');
			}
		} else if(tag!=0){
			node.content = node.content.replace('embed', '!embed');
			if(node.child.length){
				node.child[0].content = node.child[0].content.replace('embed', '!embed');
			}
			grunt.log.writeln('\u001b[1;31m警告：如下标签无法识别：'+node.content+'\u001b[2;37;0m');
		}
	}
	if(node.child){
		for(var n=0;n<node.child.length;++n){
			var child = node.child[n];
			if(child){
				if(node.type == 'root'){
					var new_grammar = node.grammar;
				} else {
					var new_grammar = grammar;
				}
				analysisNodeTree(node, child, n, deep+1, new_grammar, options);
			}
		}
	}
}

function dumpNodeTree(node, deep, file){
	if(!deep){
		fs.writeFileSync('dump.txt', '', {encoding: 'utf8'});
	}
	var obj = {index: node.index, length:node.length, pos:node.pos, type:node.type};
	if(node.token)obj.token = node.token;
	if(node.expect)obj.expect = node.expect;
	if(node.param)obj.param = node.param;
	if(node.nodeType)obj.nodeType = node.nodeType;
	if(node.grammar)obj.grammar = node.grammar;
	if(node.embedTag)obj.embedTag = node.embedTag;
	
	space = '';
	for(var n=0;n<deep;++n){
		space += '    ';
	}
	obj = space + JSON.stringify(obj);
	if(node.content){
		obj += node.content;
	}
	obj += "\n";
	
	fs.appendFileSync(file, obj, {encoding: 'utf8'});
	
	if(node.child){
		for(var n=0;n<node.child.length;++n){
			var child = node.child[n];
			if(child){
				dumpNodeTree(child, deep+1, file);
			}
		}
	}
}

var grunt = false;
module.exports = function(_grunt){
	grunt = _grunt;
	return module.exports;
}

module.exports.process = function( content, grammar, options ) {
	
	var node = parser.getRootTree( content, grammar );
	filter = options.embedFilter || [];

	root = node;
	analysisNodeTree( false, node, 0, 0, false, options );
	
	if(options.dump){
		var arr = options.file.split("/");
		var dump_file = 'dump_'+arr[arr.length-1]+'.dump';
		dumpNodeTree( node, 0, dump_file );
	}

	var content = parser.restoreNodeTree(node);
	
	return content;
}