/**
 * Embed - 语法解析引擎插件 - md5
 *
 * @class embed.plugins.include
 * @date 2014.7.22
 * @author haozhengwu<haozhengwu@wuhaozheng.com>
 */
var grunt = false;
 
function replaceNodeContent(node, search, content){
	node.child = false;
	node.content = node.content.replace(search, content);
}

function appendFileName(file, content){
	var filename = file.split('?'),
		chunk = filename[0].split('.');
	chunk[chunk.length-1] = content+'.'+chunk[chunk.length-1];
	filename[0] = chunk.join('.');
	return filename.join('?');
}

function getFileMD5(file){
	var content = grunt.file.read(file, {encoding: 'utf-8'});
	var _encrymd5 = require('crypto').createHash('md5');
	_encrymd5.update(content);
	var md5 = _encrymd5.digest('hex').substr(0,8);
	return md5;
}

module.exports.run = function( _grunt, api, param ) {
	grunt = _grunt;
	var node = api.getNextValidNode();
	var node_param = api.getNodeParam( node );
	var gramma = api.getGrammar();
	if(node_param){
		if(gramma == 'html'){
			if(node_param.nodeType.toLowerCase() == 'script'){
				if(node_param.orginParams.src){
					var file = api.getTargetPath(node_param.orginParams.src);
					var md5 = getFileMD5(file);
					var newfile = api.getTargetPath(appendFileName(file, md5));
					grunt.file.copy(file, newfile);
					var newpar = appendFileName(node_param.orginParams.src, md5);
					replaceNodeContent(node, node_param.orginParams.src, newpar);
				} else {
					api.log(node_param.nodeType+'标签中缺少src');
				}
			} else if(node_param.nodeType.toLowerCase() == 'link'){
				if(node_param.orginParams.href){
					var file = api.getTargetPath(node_param.orginParams.href);
					var md5 = getFileMD5(file);
					var newfile = api.getTargetPath(appendFileName(file, md5));
					grunt.file.copy(file, newfile);
					var newpar = appendFileName(node_param.orginParams.href, md5);
					replaceNodeContent(node, node_param.orginParams.href, newpar);
				} else {
					api.log(node_param.nodeType+'标签中缺少href');
				}
			} else {
				api.log('暂不支持标签：'+node.content);
			}
		}
	}
}

