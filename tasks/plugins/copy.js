/**
 * Embed - 语法解析引擎插件 - indlude
 *
 * @class embed.plugins.include
 * @date 2014.7.22
 * @author haozhengwu<haozhengwu@wuhaozheng.com>
 */
var grunt = false;

function getFileExtsion(file){
	var filename = file.split('?'),
		chunk = filename[0].split('.');
	return chunk[chunk.length-1].toLowerCase();
}

module.exports.run = function( _grunt, api, param ) {
	grunt = _grunt;
	var gramma = api.getGrammar();
	var src = param && param[0];
	if(src){
		if(gramma == 'html'){
			var node = api.getCurrentNode();
			var sourcefile = api.getSourcePath(src),
				targetfile = api.getTargetPath(src);
				
			content = grunt.file.copy(sourcefile, targetfile);
		}
	} else {
		var node = api.getNextValidNode();
		var node_param = api.getNodeParam( node );
		if(node_param){
			if(gramma == 'html'){
				if(node_param.nodeType.toLowerCase() == 'script'){
					if(node_param.orginParams.src){
						var node = api.getCurrentNode();
						var sourcefile = api.getSourcePath(node_param.orginParams.src),
							targetfile = api.getTargetPath(node_param.orginParams.src);
							
						content = grunt.file.copy(sourcefile, targetfile);
					} else {
						api.log(node_param.nodeType+'Embed标签和对应的HTML标签中都缺少src');
					}
				} else if(node_param.nodeType.toLowerCase() == 'link'){
					if(node_param.orginParams.href){
						var node = api.getCurrentNode();
						var sourcefile = api.getSourcePath(node_param.orginParams.href),
							targetfile = api.getTargetPath(node_param.orginParams.href);
						content = grunt.file.copy(sourcefile, targetfile);
					} else {
						api.log(node_param.nodeType+'Embed标签和对应的HTML标签中都缺少href');
					}
				} else {
					api.log('暂不支持标签：'+node.content);
				}
			}
		}
	}
}

