var crypto = require('crypto');

var debug = require('debug');
var log = debug('webot-example:log');
var verbose = debug('webot-example:verbose');
var error = debug('webot-example:error');

var _ = require('underscore')._;
var search = require('../lib/support').search;
var geo2loc = require('../lib/support').geo2loc;
var talk = require('../lib/support').talk;

var package_info = require('../package.json');

/**
 * 初始化路由规则
 */
module.exports = exports = function(webot){
  var reg_help = /^(help|\?)$/i
  webot.set({
    // name 和 description 都不是必须的
    name: 'hello help',
    description: '获取使用帮助，发送 help',
    pattern: function(info) {
      //首次关注时,会收到subscribe event
      return info.is('event') && info.param.event === 'subscribe' || reg_help.test(info.text);
    },
    handler: function(info){
      var reply = {
        title: '来人啊～小薇～接客!',
          pic: 'http://image.baidu.com/search/down?tn=download&word=download&ie=utf8&fr=detail&url=http%3A%2F%2Fww2.sinaimg.cn%2Flarge%2F005yZdI7jw1efrw21jsehj30fk078aap.jpg&thumburl=http%3A%2F%2Fimg5.imgtn.bdimg.com%2Fit%2Fu%3D1623061980%2C4247400873%26fm%3D21%26gp%3D0.jpg',
          url: 'http://www.ss.pku.edu.cn/',
        description: [
            '目前开放的功能:',
            '输入more来查看开放的所有功能',
            '软小薇聊天（未来加入自我意识，每个人都会拥有自己的小薇）',
            '语音识别（小薇能听你说话啦）',
            '地图查找，发送: go 地点',
            '百度搜索，发送: s 关键词',
            '喂，我不是一个人在战斗，快来帮我写机器人~',
            'PS: 点击下面的「查看全文」将跳转到北大软微主页面'
        ].join('\n')
      };
      // 返回值如果是list，则回复图文消息列表
      return reply;
    }
  });

  // more查看当前所有规则
  webot.set(/^more$/i, function(info){
    var reply = _.chain(webot.gets()).filter(function(rule){
      return rule.description;
    }).map(function(rule){
      //console.log(rule.name)
      return '> ' + rule.description;
    }).join('\n').value();

    return ['我的主人还没教我太多东西,你可以考虑帮我加下.\n可用的指令:\n'+ reply,
      '我的学习能力可强啦！当前可用指令：\n' + reply];
  });

  // 加载简单的纯文本对话，用单独的 yaml 文件来定义
  require('js-yaml');
  webot.dialog(__dirname + '/dialog.yaml');


  function do_search(info, next){
    // pattern的解析结果将放在param里
    var q = info.param[1];
    log('searching: ', q);
    // 从某个地方搜索到数据...
    return search(q , next);
  }

  // 可以通过回调返回结果
  webot.set('search', {
    description: '发送: s 关键词 ',
    pattern: /^(?:搜索?|search|百度|s\b)\s*(.+)/i,
    //handler也可以是异步的
    handler: do_search
  });

  // 回复图文消息
  webot.set('reply_news', {
    description: '发送news,我将回复图文消息你',
    pattern: /^news\s*(\d*)$/,
    handler: function(info){
      var reply = [
        {title: '微信机器人', description: '微信机器人测试帐号：webot', pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg', url: 'https://github.com/node-webot/webot-example'},
        {title: '豆瓣同城微信帐号', description: '豆瓣同城微信帐号二维码：douban-event', pic: 'http://i.imgur.com/ijE19.jpg', url: 'https://github.com/node-webot/weixin-robot'},
        {title: '图文消息3', description: '图文消息描述3', pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg', url: 'http://www.baidu.com'}
      ];
      // 发送 "news 1" 时只回复一条图文消息
      return Number(info.param[1]) == 1 ? reply[0] : reply;
    }
  });

  // 可以指定图文消息的映射关系
  webot.config.mapping = function(item, index, info){
    //item.title = (index+1) + '> ' + item.title;
    return item;
  };

    // 地图查找
    webot.set('mapsearch', {
        description: "地图查找，发送: go 地点",
        pattern: /^(go\b)\s*(.+)/i,
        handler: function(info) {
            var location = info.param[2];
            var reply = {
                title: '地图查找',
                description: '点击查看' + location + '查找结果',
                pic: 'http://api.map.baidu.com/staticimage?center=' + location,
                url: 'http://api.map.baidu.com/geocoder?address=' + location + '&output=html'
            }
            return reply;
        }
    });

    // 图灵机器人
    webot.set('talk', {
        description: "软小薇聊天,支持语音哦，跟我讲讲今天的新鲜事儿~",
        pattern: /.*/,
        handler: talk
    });

  //所有消息都无法匹配时的fallback
  webot.set(/.*/, function(info){
    // 利用 error log 收集听不懂的消息，以利于接下来完善规则
    // 你也可以将这些 message 存入数据库
    log('unhandled message: %s', info.text);
    info.flag = true;
    return '你发送了「' + info.text + '」,可惜我太笨了,听不懂. 发送: help 查看可用的指令';
  });
};
