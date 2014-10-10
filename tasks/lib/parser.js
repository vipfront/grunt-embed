/**
 * Embed - 语法解析引擎
 *
 * @class embed.parser
 * @date 2014.7.22
 * @author haozhengwu<haozhengwu@wuhaozheng.com>
 */
 
function attchNode(parent, node){
	if(!parent.child){
		parent.child = [];
	}
	node.index = parent.child.length;
	node.parent = parent;
	parent.child.push(node);
}

function getRootTree(document, node, root) {
	var pos = 0,
		length = document.length,
		minMatchPos,
		minMatchGrammarNode;
	while(pos<length){
		//从开始位置，试匹配所有的子分支，找出最近的一个
		minMatchPos = Number.MAX_VALUE;
		for(var n=0;n<root.contain.length;++n){
			var matchPos = document.indexOf(root.contain[n].token, pos);
			if(matchPos>=0 && matchPos<minMatchPos){
				minMatchPos = matchPos;
				minMatchGrammarNode = root.contain[n];
			}
		}
		if(minMatchPos<Number.MAX_VALUE){
			//存在合适的子节点
			if(minMatchPos>pos){
				//存在前缀content
				var newnode = {
					pos:pos, 
					length: minMatchPos-pos, 
					type: 'content', 
					content: document.substr(pos, minMatchPos-pos)
				};
				attchNode(node, newnode);
				pos = minMatchPos;
			}
			
			var newnode = {
				pos:pos, 
				type: minMatchGrammarNode.type, 
				token: minMatchGrammarNode.token, 
				expect: minMatchGrammarNode.expect
			};
			
			if(minMatchGrammarNode.embedTag){
				newnode.embedTag = true;
			}
			
			pos = getNodeTree(document, newnode, minMatchGrammarNode, 
				pos + minMatchGrammarNode.token.length);
			newnode.length = pos - newnode.pos;
			newnode.content = document.substr(newnode.pos, newnode.length);
			attchNode(node, newnode);
			
		} else {
			//不存在合适的子节点，全部列为content
			minMatchPos = length;
			var newnode = {
				pos:pos, 
				length: minMatchPos-pos, 
				type: 'content', 
				content: document.substr(pos, minMatchPos-pos)
			};
			attchNode(node, newnode);
			pos = minMatchPos;
		}
	}
}

function getNodeTree(document, node, grammarNode, start_pos){
	var pos = start_pos,
		length = document.length,
		findtocken = false;
	
	while(pos<length){
		if(grammarNode.contain){
			//存在子元素
			//循环查找子元素
			minMatchPos = Number.MAX_VALUE;
			for(var n=0;n<grammarNode.contain.length;++n){
				var matchPos = document.indexOf(grammarNode.contain[n].token, pos);
				if(matchPos>=0 && matchPos<minMatchPos){
					minMatchPos = matchPos;
					minMatchGrammarNode = grammarNode.contain[n];
				}
			}
			matchPos = document.indexOf(grammarNode.expect, pos);
			if(/*minMatchPos<Number.MAX_VALUE && */ minMatchPos<matchPos){
				//有匹配到的子元素，且在expect前
				if(minMatchPos>pos){
					//存在前缀content
					var newnode = {
						pos:pos, 
						length: minMatchPos-pos, 
						type: 'content', 
						content: document.substr(pos, minMatchPos-pos)
					};
					attchNode(node, newnode);
					pos = minMatchPos;
				}
				var newnode = {
					pos:pos, 
					type: minMatchGrammarNode.type, 
					token: minMatchGrammarNode.token, 
					expect: minMatchGrammarNode.expect
				};
				if(minMatchGrammarNode.embedTag){
					newnode.embedTag = true;
				}
				pos = getNodeTree(document, newnode, minMatchGrammarNode, 
					pos + minMatchGrammarNode.token.length);
				newnode.length = pos - newnode.pos;
				newnode.content = document.substr(newnode.pos, newnode.length);
				attchNode(node, newnode);
			} else {
				//没有匹配到的子元素
				if(matchPos>=0){
					if(matchPos>pos){
						//存在后缀content
						var newnode = {
							pos:pos, 
							length: matchPos-pos, 
							type: 'content', 
							content: document.substr(pos, matchPos-pos)
						};
						attchNode(node, newnode);
					}
					pos = matchPos;
					return pos + grammarNode.expect.length;
				} else {
					console.log(document.substr(pos));
					console.log('期望得到'+grammarNode.expect);
					console.log('语法不匹配！');
					process.exit();
				}
			}
		} else {
			//不存在子元素
			matchPos = document.indexOf(grammarNode.expect, pos);
			if(matchPos>=0){
				pos = matchPos;
				return pos + grammarNode.expect.length;
			} else {
				console.log(document.substr(pos));
				console.log('期望得到'+grammarNode.expect);
				console.log('语法不匹配！');
				process.exit();
			}
		}
	}
	return pos;
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

function eventCallback ( event ){
	switch(event.type){
		case 'engine_call':
			var grammar = require('../grammar/'+event.grammar);
			var grammarRoot = grammar.getGrammarRoot();
			event.root.child = [];
			getRootTree(event.content, event.root, grammarRoot, 0);
			if(grammar.afterBuildTree){
				grammar.afterBuildTree(event.root, eventCallback);
			}
			return 
	}
}

function processNode ( parent, node, index, deep, grammar ) {
	if(node.embedTag){
	}
	
	if(node.child && node.child.length){
		for(var n=0;n<node.child.length;++n){
			if(node.type == 'root'){
				var new_grammar = node.grammar;
			} else {
				var new_grammar = grammar;
			}
			processNode ( node, node.child[n], n, deep+1, new_grammar );
		}
	}
}

module.exports.processNode = function( node, grammar ) {
	processNode ( false, node, 0, 0, false );
}

module.exports.getRootTree = function( content, grammarType ) {
	var grammar = require('../grammar/'+grammarType);
	var node = {
		pos:0, 
		length: content.length, 
		type: 'root',
		grammar: grammarType,
		index:0, 
		parent: false
	};

	var grammarRoot = grammar.getGrammarRoot();
	getRootTree(content, node, grammarRoot, 0);
	if(grammar.afterBuildTree){
		grammar.afterBuildTree(node, eventCallback);
	}
	return node;
}

module.exports.restoreNodeTree = function( node ) {
	return restoreNodeTree ( node );
}

