/**
 * Embed - html语法模块
 *
 * @class embed.grammar.html
 * @date 2014.7.22
 * @author haozhengwu<haozhengwu@wuhaozheng.com>
 */
 
var grammar = [
	{type: "root", contain: "comment,HTMLTag"},
	{type: "comment", token: "<!--", expect: "-->", contain: "quote", embedTag: true},
	{type: "HTMLTag", token: "<", expect: ">", contain: "quote"},
	{type: "quote", token: "'", expect: "'"},
	{type: "quote", token: "\"", expect: "\""}
];

var grammarMap = {};
//构建以type为键值的grammarMap
for(var n=0; n<grammar.length; ++n){
	var type = grammar[n].type;
	if(!grammarMap[type]){
		grammarMap[type] = [grammar[n]];
	} else {
		grammarMap[type].push(grammar[n]);
	}
}

//树状化grammarMap
for(var key in grammarMap){
	var arr = grammarMap[key];
	for(var n=0;n<arr.length;++n){
		var el = arr[n];
		if(el.contain){
			var contain = el.contain.split(',');
			el.contain = [];
			for(var m=0; m<contain.length; ++m) {
				if(grammarMap[contain[m]]){
					var subarr = grammarMap[contain[m]];
					for(var i=0;i<subarr.length;++i){
						el.contain.push(subarr[i]);
					}
				}
			}
		}
	}
}

var root = grammarMap['root'][0];

module.exports.getGrammarRoot = function(){
	return root;
}

function getHTMLTagParam(node){
	var laseKey,
		params = {},
		arr = [],
		child = node.child;
	
	if(child.length && child[0].type=='content') {
		arr = child[0].content.replace(/(^\s*)|(\s*$)/g, "").replace(/\s*=\s*/g, '=').replace(/\s+/g, ' ').split(' ');
		var nodeType = arr.shift(),
		nodeClose = false;
		if(nodeType.substr(0,1) == '/'){
			nodeClose = true;
			nodeType = nodeType.substr(1);
		}
		for(var n=0;n<arr.length;++n){
			var item = arr[n].split('=');
			laseKey = item[0];
			if(item.length > 1){
				params[laseKey] = item[1];
			} else {
				params[laseKey] = true;
			}
		}
	}
	
	for(var n=1;n<child.length;++n){
		if(child[n].type=='content'){
			arr = child[n].content.replace(/(^\s*)|(\s*$)/g, "").replace(/\s*=\s*/g, '=').replace(/\s+/g, ' ').split(' ');
			for(var m=0;m<arr.length;++m){
				var item = arr[m].split('=');
				laseKey = item[0];
				if(item.length > 1){
					params[laseKey] = item[1];
				} else {
					params[laseKey] = true;
				}
			}
		} else if(child[n].type=='quote') {
			params[laseKey] = child[n].content.substring(child[n].token.length, child[n].content.length-child[n].expect.length);
		}
	}
	
	return {
		nodeType: nodeType,
		nodeClose: nodeClose,
		orginParams: params
	};
}

var stack = [];
function buildChildNode(parent, from, to, orgnode){
	var node = orgnode || {};
	
	node.pos = parent.child[from].pos;
	node.length = parent.child[to].pos + parent.child[to].length - parent.child[from].pos;
	
	node.parent = parent;
	node.child = [];
	for(var n=from;n<=to;++n ){
		parent.child[n].parent = node;
		node.child.push(parent.child[n]);
		parent.child[n] = false;
	}
	parent.child[from] = node;
	return node;
}

function restoreNodeTree ( node ) {
	var buff = [];
	for(var n=0;n<node.child.length;++n){
		var child = node.child[n];
		if(child.child){
			var token = child.token || '',
				expect = child.expect || '';
			
			buff.push(token + restoreNodeTree(child) + expect);
		} else if(child.content){
			buff.push(child.content);
		}
	}
	return buff.join('');
}

function makeRootFramefromHTMLBlock( parent, node, index ){
	if(node.type != 'HTMLBlock')return;
	var rootFrame = buildChildNode(node, 1, node.child.length-2, {
		type: 'root'
	});
	return rootFrame;
}

module.exports.getNodeParam = function( node ){
	if(node.type == 'HTMLTag'){
		return getHTMLTagParam(node);
	} else if(node.type == 'HTMLBlock'){
		return node.param;
	} else {
		return false;
	}
}

module.exports.removeNodeWarp = function( node ){
	return node.content.substring(node.token.length || 0, node.content.length - (node.expect.length || 0));
}

module.exports.disableNode = function( node ){
	if(node.type != 'comment'){
		node.type = 'comment';
		node.token = grammarMap['comment'][0].token;
		node.expect = grammarMap['comment'][0].expect;
		node.embedTag = grammarMap['comment'][0].embedTag;
		node.content = node.token + node.content + node.expect;
		node.child = false;
	}
}

module.exports.isValidNode = function( node ){
	if(node.type == 'HTMLTag' || node.type == 'HTMLBlock'){
		return true;
	} else {
		return false;
	}
}

module.exports.afterBuildTree = function( node, callback ){

	function handleMatchedHTMLBlock(parent, node, index, deep) {
		if(node.nodeType == 'script' || node.nodeType == 'style'){
			if(node.child.length>2){
				var rootFrame = makeRootFramefromHTMLBlock( parent, node, index );
				var content = restoreNodeTree ( rootFrame );
				var grammar = {script: 'js', style: 'css'}[node.nodeType];
				rootFrame.grammar = grammar;
				if(content && callback){
					callback({
						type: 'engine_call',
						root: rootFrame,
						content: content,
						grammar: grammar
					})
				}
			}
		}
	}

	function matchHTMLTag(parent, node, index, deep){
		var param;
		if(node.type == 'HTMLTag'){
			param = getHTMLTagParam(node);
			node.param = param;
			if(param.nodeClose){
				for(var n=stack.length-1; n>=0; --n){
					if(stack[n].node.param.nodeType == node.param.nodeType){
						var block_index = stack[n].index;
						var block = buildChildNode(parent, stack[n].index, node.index, {
							type: 'HTMLBlock',
							nodeType: stack[n].node.param.nodeType
						});
						block.param = stack[n].node.param;
						stack.length = Math.max(n-1, 0);
						
						handleMatchedHTMLBlock(parent, block, block_index, deep);
						break;
					}
				}
			} else {
				stack.push({parent: parent, index: index, node: node});
			}
		}
		
		if(deep == 0 && node.child){
			for(var n=0;n<node.child.length;++n){
				var child = node.child[n];
				if(child){
					matchHTMLTag(node, child, n, deep+1);
				}
			}
		}
		
	}
	return matchHTMLTag(false, node, 0, 0);
}