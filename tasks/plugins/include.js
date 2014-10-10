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

	function getSourceContent(file){
		var target, content = '';
		try{
			target = api.getTargetPath(file);
			content = grunt.file.read(target, {encoding: 'utf-8'});
		} catch(e){
			try{
				target = api.getSourcePath(file);
				content = grunt.file.read(target, {encoding: 'utf-8'});
			}catch(e){
				api.log('文件未找到：'+file);
			}
		}
		return content;
	}

	grunt = _grunt;
	var gramma = api.getGrammar();
	var src = param && param[0];
	if(src){
		if(gramma == 'html'){
			var node = api.getCurrentNode();
			var content = getSourceContent(src);
			var ext = getFileExtsion(src);
			if(ext == 'js'){
				content = "\n<script type=\"text/javascript\">\n"+content+"\n</script>";
			} else if(ext == 'css'){
				content = "\n<style>\n"+content+"\n</style>";
			}
			var newnode = {
				type: 'content',
				content: content,
				child: false,
				parent: node.parent
			}
			node.parent.child.splice(node.index+1,0, newnode);
		}
	} else {
		var node = api.getNextValidNode();
		var node_param = api.getNodeParam( node );
		if(node_param){
			if(gramma == 'html'){
				if(node_param.nodeType.toLowerCase() == 'script'){
					if(node_param.orginParams.src){
						var content = getSourceContent(node_param.orginParams.src);
						content = "<script type=\"text/javascript\">\n"+content+"\n</script>";
						node.type = 'content';
						node.content = content;
						node.tocken = node.expect = node.embedTag = node.child = false;
					} else {
						api.log(node_param.nodeType+'Embed标签和对应的HTML标签中都缺少src');
					}
				} else if(node_param.nodeType.toLowerCase() == 'link'){
					if(node_param.orginParams.href){
						var node = api.getNextValidNode();
						var node_param = api.getNodeParam( node );
						var content = getSourceContent(node_param.orginParams.href);
						content = "<style>\n"+content+"\n</style>";
						node.type = 'content';
						node.content = content;
						node.tocken = node.expect = node.embedTag = node.child = false;
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

