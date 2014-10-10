/**
 * Embed - js语法模块
 *
 * @class embed.grammar.html
 * @date 2014.7.22
 * @author haozhengwu<haozhengwu@wuhaozheng.com>
 */
 
var grammar = [
	{type: "root", contain: "comment,quote"},
	{type: "comment", token: "/*", expect: "*/", contain: "quote", embedTag: true},
	{type: "comment", token: "//", expect: "\n", contain: "quote", embedTag: true},
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

module.exports.isValidNode = function( node ){
	return true;
}

module.exports.getGrammarRoot = function(){
	return root;
}

module.exports.afterBuildTree = function( node, callback ){

}