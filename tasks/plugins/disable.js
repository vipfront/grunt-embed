/**
 * Embed - 语法解析引擎插件 - disable
 *
 * @class embed.plugins.include
 * @date 2014.7.22
 * @author haozhengwu<haozhengwu@wuhaozheng.com>
 */
 
module.exports.run = function( grunt, api, param ) {
	var node = api.getNextValidNode({embedTag: true});
	if(node.type != 'comment'){
		api.disableNode(node);
	} else {
		api.log('缺少有效语句!');
	}
}

