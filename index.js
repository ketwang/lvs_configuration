import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';
import toast from '../../ui/toast';
import app from '../../app';
import highcharts from 'highcharts';
import 'jquery-form-validator';
import 'jquery-form-validator/src/theme-default.css';
import 'select2';
import CodeMirror from 'codemirror';
//import dislog from 'codemirror/addon/dialog/dialog'
//import cursor from 'codemirror/addon/search/searchcursor'
//import vim from 'codemirror/keymap/vim'
import 'codemirror/mode/shell/shell';//clike/clike
import 'codemirror/keymap/vim';

import 'codemirror/lib/codemirror.css';


var Block = Backbone.Model.extend({});

var Blocks = app.base.Collection.extend({
    model : Block,

    initialize : function (models , options) {
        options = options || {};
        _.each(options, function(v, k){ this[k] = v;}, this);

    },

    url : function(){
    	var params = {};
    	if (this.q)
    	{
    		params['q'] = this.q;
    	}
    	if (this.type)
    	{
    		params['type'] = this.type;
    	}
    	if (this.page)
    	{
    		params['page'] = this.page;
    	}
        return app.url('data/lvs/list?' + $.param(params));
    }
});
var ConfigurationView = Backbone.View.extend({
	tagName: 'textarea',
	//class: 'editor',
	id : 'code',
	name : 'code',
	template: _.template(require('./templates/configuration.html')),
	initialize : function(options){},
	render : function(data){ 
		/*this.$el.html(this.template({data: data}));
		var CodeMirrorEditor = CodeMirror.fromTextArea(document.getElementById('code'), {
			indentWithTabs: true,
			smartIndent: true,
			autofocus: true,
			lineNumbers: true,
		    mode: "text/x-csrc",
			keyMap: "vim",
			matchBrackets: true,
			showCursorWhenSelecting: true 
		});*/
		var self = this;
		$.ajax({
			url: '/data/lvs/config',
	  	    type: 'get',
		}).success(function(data){
			//console.log('++++'+data);
			//var myTextarea = self.$el.find(".editor");
			//console.log(myTextarea.getAttribute('class'));
			self.$el.html(self.template({data: data}));
			var CodeMirrorEditor = CodeMirror.fromTextArea(document.getElementById('code'), {
					//mode: 'shell',
					//lineNumbers: true,
					//value: 'hehe',//self.template({data: data})
					//value : self.template({data: data}),
					indentWithTabs: true,  
			        smartIndent: true,   
			        //matchBrackets : true,  
			        autofocus: true,
			        lineNumbers: true,
				    //mode: "text/x-csrc",
				    mode : 'shell',
				    keyMap: "vim",
				    matchBrackets: true,
				    showCursorWhenSelecting: true 
			});
			//self.$el = self.$el.html(self.template({data: data}));
		}).fail(function(){
			alert('获取失败!');
		});
		//this.$el.html(this.template());
		return this;
	}
})
var BlocksView = Backbone.View.extend({
	template: _.template(require('./templates/block.html')),
	events : {
		"click .prod" : 'showprod',
		"click .pre"  : 'showPre',
		"click .daily" : 'showDaily',
		"keyup [name=q]" : "query",
		'click .show-configuration' : 'showConfig'
	},
	showConfig : function($show=true){
		/*$.ajax({
			url: '/data/lvs/config',
			type: 'get',
		}).success(function(data) {
			console.log(data);
			var file = new ConfigurationView({});
			var editview = new commonModal({
				settings: {show: true, backdrop: 'static'},
				header: true,
				footer: false,
				title: '当前LVS总配置一览',
				body: file.render(data).$el
			});
			editview.render();
		}).fail(function(){
			alert('获取失败！');
		});*/
		if (this.$editview)
		{
			this.$editview.$el.modal();
		}
		else
		{
			var file = new ConfigurationView({});
		    this.$editview = new commonModal({
		    	settings: {show: true, backdrop: 'static'},
				header: true,
				footer: false,
				title: '当前LVS总配置一览',
			    body: file.render().$el
		    });
	        this.$editview.render();
		}
		
		
		//this.$editview.render();

	},
	query : function() {
		var value = this.$el.find('[name=q]').val();
		this.$body.html('');
		this.$('.message-empty').addClass('hide');
		this.showLoading();
		this.collection.q = value;//搜VIP、搜realserverIP、搜分组名
		this.collection.fetch({reset: true});
	},
	showprod : function(){
		this.$el.find(".environment").text("当前环境: 生产环境");
		//这个是错误的实例this.collection = new Blocks([], {});
		//这样也会重新渲染 出发reset事件 this.collection.reset();
		this.$('.message-empty').addClass('hide');
		this.showLoading();
		this.collection.type = 'prod';
		this.collection.fetch({reset: true});
	},
	showPre : function(){
		this.$el.find(".environment").text("当前环境: 预发环境");
		this.$body.html('');
		this.$('.message-empty').addClass('hide');
		this.showLoading();
		this.collection.type = 'pre';
		this.collection.fetch({reset: true});
	},
	showDaily : function(){
		this.$el.find(".environment").text("当前环境: 日常环境");
		this.$body.html('');
		this.$('.message-empty').addClass('hide');
		this.showLoading();
		this.collection.type = 'daily';
		this.collection.fetch({reset: true});
	},
	initialize : function(options){
		options = options || {};
		_.each(options, function(k,v){this[k] = v;}, this);
		//绑定reset事件,首次加载数据渲染页面
		this.collection.on('reset', function(){
			//console.log(this.collection);
			this.renderRows();
		}, this);
		
		//绑定change事件,主要是当某个model更新之后渲染页面
		this.collection.on('change', function(){
			this.$body.html("");
			this.renderRows();
		}, this);

		this.collection.on('remove', function(){
			this.$body.html("");
			this.renderRows();
		}, this);
	},
	render : function(){
		var pagination;
		this.$el.html(this.template());

        pagination = new app.ui.Pagination({
        	collection : this.collection
        });
        this.$('.pagination-container').html(pagination.$el);
        
		this.$body = this.$('tbody');
        //这里是伪造数据的地方，用真实的数据就屏蔽这条
		//this.$body.append((new TestBlockRowView()).render().$el);
		return this;
	},
	renderRows : function(){
		this.prepareRender();
		this.collection.each(function(model){
			this.renderRow(model);
		}, this)
	},
	renderRow : function(model) {
		this.$body.append((new BlockRowView({model : model, collection : this.collection})).render().$el);
	},
	showLoading : function(){
		this.$el.find('.message-loading').removeClass('hide');
	},
	prepareRender : function(){
		this.$('.message-loading').addClass('hide');

		if (this.collection.length)
		{
			this.$('.table-wrapper').removeClass('hide');
			this.$('.message-empty').addClass('hide');
		}
		else
		{
			this.$('.table-wrapper').addClass('hide');
			this.$('.message-empty').removeClass('hide');
		}
	}
})

var BlockRowView = Backbone.View.extend({
	template: _.template(require('./templates/block-row.html')),
	tagName : 'tr',
	events : {
		'click a': 'showDiv',
		'click .edit-block': 'edit_lvs_record',
		'click .delete-block': 'delete_lvs_record'
	},
	delete_lvs_record: function(){
	//实际上就是将vip  vport标注为“停用”状态,
	//一条vip vport protocol唯一标注一条数据,这条数据的id作为后端服务机器parent_id
	//并且将rs记录修改为停用状态
	//表1，LVS表,id自增、protocol、vip、vport唯一，最初配置关联的集群名称、use状态
	//负载均衡算法、负载均衡模式、健康检查类型、delay_loop
	//表2，rs表,id自增、ip唯一、port唯一，parent_id根据LVS表来设置、协议类型、use状态,
	//健康状态检测类型、链接超时设置、重试次数、等待时间、
	//最终也是结合这两个表去设置配置文件
	  this.$el.attr('class', 'warning');
	  console.log('让开  我要编辑这个');
	  self = this;
	  var editblock = new EditBlock({model: this.model});
	  this.$editview = new commonModal({
	  	model: this.model,
	  	collection: this.collection,
	  	title: '配置',
	  	header: false,
	  	footer: true,
	  	settings: {show: true, backdrop: false},
	  	dismiss: function(){
	  		self.$editview.$el.modal('hide');
	  		self.$el.removeClass('warning');
	  	},
	  	submit: function(id){
	  		//获取页面可以修改的数据
	  		var data = {};
	  		data['nb_get_retry'] = self.$editview.$el.find('[name="nb_get_retry"]').val();
	  		data['delay_before_retry'] = self.$editview.$el.find('[name="delay_before_retry"]').val();
	  		data['delay_loop'] = self.$editview.$el.find('[name="delay_loop"]').val();
	  		data['connect_timeout'] = self.$editview.$el.find('[name="connect_timeout"]').val();
	  		//if (self.$editview.model.attributes.check_type == 'tcp')
	  		//{

	  		//}
	  	    if (self.$editview.model.attributes.check_type == 'http')
	  	    {
	  	    	data['url_path'] = self.$editview.$el.find('[name="url_path"]').val();
	  	    	data['url_status_code'] = self.$editview.$el.find('[name="url_status_code"]').val();
	  	    }
	  		self.$editview.$el.find('.submit').attr('disabled', 'true');
	  		self.$editview.$el.find('.cancel').attr('disabled', 'true');
	  		console.log(data);
	  		$.ajax({
	  			url: '/data/lvs/recovery?id='+id,
	  			type: 'post',
	  			data: data
	  		}).success(function(data){
	  			if (data['update_success'] == 'ok')
	  			{
	  				self.model.set(data.value);
	  				//触发change事件会重新渲染页面
	  				self.collection.add(self.model,{merge: true});
	  			}
	  			else
	  			{
	  				alert('更新失败');
	  			}
	  			self.$editview.$el.modal('hide');
	  		}).fail(function(data){
	  			console.log(data.status);
	  			self.$editview.$el.find('.submit').removeAttr('disabled');
	  			self.$editview.$el.find('.cancel').removeAttr('disabled');
	  		}).complete(function(){

	  		})
	  	},
	  	body: editblock.render().$el
	  });
	  this.$editview.render();
	  
	},
	edit_lvs_record: function(){
		this.$el.attr('class', 'danger');
	    console.log("让开  我要干掉这个配置");
	    self = this;
	    this.$modalview = new commonModal({
	   	collection: this.collection,
	   	model: this.model,
	   	title: '配置删除',
	   	header: true,
	   	footer: true,
	   	body: '你确定需要删除这个配置吗？',
	   	dismiss: function(){
	   		//self.$editview.modal('hide');
	   		self.$modalview.$el.modal('hide');
	   		self.$el.removeClass('danger');
	   	},
	   	submit: function(id){
	   		console.log('真删除');
	   		self.$modalview.$el.find('.submit').attr('disabled', 'true');
	   		self.$modalview.$el.find('.cancel').attr('disabled', 'true');
	   		//发送ajax请求删除这个配置（主要是停用这个配置）
	   		$.ajax({
	   			url: '/data/lvs/delete?id='+id,
	   			type: 'get',
	   		}).success(function(data){
	   			if (data['delete_success'] == 'ok')
	   			{
	   				//更新这个collection
	   				//这里会触发change事件，重新绘图，这里主要是实现删除后不刷新页面
	   				//因为一旦刷新页面会导致删除者无法看到是否被删除
	   				self.collection.remove(self.model);//这玩意只会触发remove事件
	   				self.$modalview.$el.modal('hide');
	   			}
	   			else
	   			{
	   				//提示下信息
	   				//提示信息说没有被删除
	   				alert('删除失败');
	   			}
	   		}).fail(function(data){
	   			console.log(data);
	   		}).complete(function(){
	   			self.$modalview.$el.find('.submit').removeAttr('disabled');
	   			self.$modalview.$el.find('.cancel').removeAttr('disabled');
	   		});
	   	},
	   	settings: {show: true, backdrop: false}
	   });
	   this.$modalview.render();
	},
	showDiv: function(e){
		var $target = $(e.target);
		if ($target.hasClass('ok'))
		{
			if ($target.hasClass('selected'))
			{
				//this.$modal.modal('show');
				//alert('again');
				console.log(this.$mm);
				this.$mm[$target.text()].modal('show');
				return;
			}
			else
			{
				if($target.hasClass('vs_ip_port'))
				{
					console.log($target.text());
					this.$modal = app.ui.modal({
						title : $target.text(),
						id: $target.text(),
            			autoClose: false,});
					this.$mm[$target.text()] = this.$modal;
					$target.addClass('selected');
					return;
				}
				else if ($target.hasClass('rs_ip_port'))
				{
					var $self = this;
					$.each($target.parents('td').prevAll(), function(){
						if ($(this).find('a').hasClass('vs_ip_port'))
						{
							console.log($(this).find('a').text()+$target.text());
					        this.$modal = app.ui.modal({
					        	title : $target.text(),
						        id: $target.text(),
            			        autoClose: false,
					        });
					        console.log($self.$mm);
					        $self.$mm[$target.text()] = this.$modal;
							//$self.drawFromData($target.parents('p').next().attr('id'));
							$target.addClass('selected');
							return;
						}
					})
				}
				else
				{
					return;
				}
			}
		}
    },
	hideDiv: function(e){
		var $target = $(e.target);
		$target.parents('p').next().css({"display":"none"});
		//$target.find('div').hide();
	},

	drawFromData : function($target){
		console.log("...."+$target);
		//$("#container_test").highcharts({
		var chart = new highcharts.Chart({
			chart: {
				renderTo : $target,//"container_test",
				type: 'spline',
				marginRight: 10,
				zoomType: 'x',
				events: {
					load: function(){
						var series = this.series;
						setInterval(function(){
							var x = (new Date()).getTime(),
						    y1 = Math.random(),
						    y2 = Math.random();
						    series[0].addPoint([x, y1]);//这里会一直打点绘图
						    series[1].addPoint([x, y2]);
						}, 1000);
						//setInterval(function(){	
						//}, 1000);
						//$.websocket('ws://10.2.190.11:8080', {
						//	events: {
						//		message: function(e){}
						//	}
						//})
					}
				}
			},
			title : {
				text: '流量图'
			},
			xAxis: {
				type: 'datetime',
				tickPixelInterval: 150
			},
			yAxis: {title: 'Value'},
			tooltip: {
				shared: true,
				valueSuffix: "{value} Bytes/s"
			},
			lengend : {
				enabled: true,
				float: true,
				labelFormat: "{name} (click to hide or show..)"
			},
			exporting: {
				enabled: true
			},
			series: [{
				name: 'in',
				data: [],
			},{
				name: 'out',
				data: [],
			}],
		});
	},

	initialize : function(options) {
		this.$mm = {};
		console.log(this.$mm);
	},

	render : function (){
		var data = this.model.toJSON();
		console.log(data);
		this.$el.html(this.template(data));
		return this;
	},
})

var EditBlock = Backbone.View.extend({
	template: _.template(require('./templates/edit.html')),
	events: {},
	initialize: function(options) {
		this.options = options;
	},
	render: function(){
		this.$el = $(this.template(this.options.model.toJSON()));
		return this;
	}
}) 

var TestBlockRowView = Backbone.View.extend({
	template: _.template(require('./templates/block-row.html')),
	tagName : 'tr',
	events : {},
	initialize : function(options) {},
	render : function (){
		var data = {
		"canEdit": false,
		"canDelete": false,
	    "vs_protocol": "TCP",
	    "vip_name": "op-rabbitmq",
	    "vs_ip": "10.2.199.12", 
		"vs_port": "80",
		"group_names": 'puppet', 
		"rs_in_running": [{"ip": "1.1.1.1", "port": "8080"}], 
		"rs_in_config": [{"ip" : "1.1.1.1", "port" : "8080"}, {"ip" : "2.2.2.2", "port": "8080"}], 
		"rs_in_group": {"type": "prod", "iplist" : ["1.1.1.1", "2.2.2.2", "3.3.3.3"]}};
		console.log(data);
		this.$el.html(this.template(data));
		return this;
	}
})

app.module('lvs/index', function(){
	var collection = new Blocks([], {});
	var view = new BlocksView({
		collection: collection,
		enableSearch: true
	});
	$('.block-container').html(view.render().$el)
	view.showLoading();
	collection.fetch({reset: true});
	//setInterval(function(){
	//	collection.fetch()
	//}, 60000);
	/*
	var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    mode: "text/x-csrc",
    keyMap: "vim",
    matchBrackets: true,
    showCursorWhenSelecting: true
  }); */

})

var commonModal = Backbone.View.extend({
	template: _.template(require('./templates/modal.html')),
	events: {
		//'click .cancel': 'cancel',
		//'click .submit': 'submit'
		//绑定不成功，什么鬼
	},
	cancel: function(event){
		console.log('我没有做任何操作');
		event['data']();
		//this.options['dismiss']();
	},
	submit: function(event){
		console.log('&&&&&&');
		//console.log(event);
		event['data']['submit'](event['data']['id']);
		//event['data']();
		//this.options['submit']();
	},
	initialize: function(options){
		this.$el = $(this.template())
		this.options = options;
		this.model = options['model'];
		this.collection = options['collection'];
		//console.log(this.options['dismiss']);
		//console.log(this.options['submit']);
	},//设置title、去头 去尾等等
	render: function(){
		this.open();
		if (this.options.footer)
		{
			$('.cancel').on('click', this.options['dismiss'], this.cancel);
		    $('.submit').on('click', {'submit': this.options['submit'], 'id': this.model.attributes.id}, this.submit);
		}
	},
	open: function(){
		this.setTitle(this.options.title);
		if (! this.options.header)
		{
			this.removeHeader();
		}
		if (! this.options.footer)
		{
			this.removeFooter();
		}
		this.setBody();
		this.$el.modal(this.options.settings);
	},
	setBody: function(){
		this.$el.find('.modal-body').html(this.options.body);
	},
	setTitle: function(){
		this.$el.find('.modal-header').append('<h4>'+this.options.title+'</h4>');
	},
	removeHeader: function(){
		this.$el.find('.modal-header').remove();
	},
	removeFooter: function(){
		this.$el.find('.modal-footer').remove();
	}
})
//这是测试发布成功的页面
var anotherModalView = Backbone.View.extend({
	template: _.template(require('./templates/showData.html')),
	events: {},
	initialize: function(options){},
	render: function(data){
		this.open(data);
		//while( true ){}
		return this;
	},
	getIPStatus: function(iplist){
		self = this;
        var sets = {};
		_.each(iplist, function(ip){
			sets[ip] = setInterval(function(){
				$.ajax({
					type: 'GET',
					url: '/data/lvs/health?ip='+ip+'port='+port,
				}).success(function(data){
					console.log(data);
					if (data.status == 'up')
					{
						self.$el.find('#'+ip.replace(/\./g, '\\.')).attr('class','glyphicon glyphicon-ok');//菊花图变成狗
						clearInterval(sets[ip]);//状态成功了就不要再更新了
					}
					else if (data.status == 'down')
					{
						console.log(data);
					}
					
				})
			}, 5000);
		});
		setInterval(function(){
			if (_.every(iplist, function(ip){
				return self.$el.find('#'+ip.replace(/\./g, '\\.')).hasClass('glyphicon glyphicon-ok');
			}))
			{
				location.href = 'index';
			}
		}, 3000);
	},
	open: function(data){
		//console.log(data);
		this.$el = $(this.template({'data': data}));
		var modalview = new commonModal({
			settings: {show: true, backdrop: 'static'},
			header: false,
			footer: false,
			body: this.$el
		});
		modalview.render();
	}
});

var modalView = Backbone.View.extend({
	template: _.template(require('./templates/detailmodal.html')),
	events: {},
	initialize : function(options) {
	},
	render: function(data){
		this.open(data);
		return this;
	},
	open: function(data){
		this.$el = $(this.template({'data': data}));
		var modalView = new commonModal({
			settings: {backdrop: false},
			header: true,
			title: '配置一览',
			footer: false,
			body: this.$el
		});
		modalView.render();
	},
})

var lvsFormView = Backbone.View.extend({
	template: _.template(require('./templates/form.html')),
	events : {
		'change .check_type': 'showCheckDiv',
		'click .submit': 'submitData',
		'click .show': 'showData',
		'change #select2-rs_cluster_name-container': 'test'
	},
	test: function(){
		console.log(this.$el.find('#select2-rs_cluster_name-container').val());
	},
	showCheckDiv: function(){
		//各种检查方式相互切换
		var target = this.$el.find('.check_type').val();
		if (target == 'http')
		{
			$("#http").css('display', 'block');
			$("#tcp").css('display', 'none');
		}
		else if (target == 'tcp')
		{
			$("#tcp").css('display', 'block');
			$("#http").css('display', 'none');
		}
		else
		{
			$("#tcp").css('display', 'none');
			$("#http").css('display', 'none');
		}
	},
	submitData: function(){
		//this.$el.find('.submit'),disable();
		var data_ = this.getData('submit');
		if (! this.validateData(data_))
		{
			alert('信息不全或者存在错误的输入数据，请仔细纠正后再提交...这很重要....');
			return;
		}
		console.log(data_);
		var self = this;
		$.ajax({
			type: "POST",
			url: '/data/lvs/create',
			dataType: 'json',
			data: data_,
			async: false,
			timeout: 6000
		}).success(function(data1, textStatus){
			//后端返回这次操作关联的vip、vport和后端服务器集群
			//提示保存成功，然后开始生成一个很溜的页面
			//就是每个机器后面转菊花，在timemout时间之内，转菊花等待变为健康的颜色，超时后全部打叉。
			//console.log(data);
			//console.log(textStatus);
			console.log("成功");
			if (data1.success == 'no')
			{
				alert(data1.message);
			}
			else
			{
				var view = new anotherModalView({});
				view.render(data1).getIPStatus(data1['iplist']);
			}
			//var view = new anotherModalView({});
			//view.render(data1).getIPStatus(data1['iplist']);
		}).error(function(xhr, textStatus, errorThrown){
			//这里应该设置modal的错误提示信息，只要出错，后端肯定不会保存的！
			if (textStatus)
			{
				alert(textStatus);
			}
			else if (errorThrown)
			{
				alert(errorThrown);
			}
		}).complete(function(xhr, ts){
			//留着不做啥，任性
			//可以用来消除桃花侠和菊花怪
		})

		//console.log(data);
	},
	showData: function(){
		var data = this.getData('show');
		console.log(data);
		var modal = new modalView();
		modal.render(data);
	},
	getData: function(action){
		var basic_set = {};
		basic_set['environment_type'] = '2';
		basic_set['vip_name'] = this.$el.find('.vip_name').val();
		basic_set['vip'] = this.$el.find('.vip').val();
		basic_set['vport'] = this.$el.find('.vport').val();
		//basic_set['rs_cluster_name'] = this.$el.find('#rs_cluster_name').val();
		basic_set['rs_port'] = this.$el.find('.rs_port').val();
		basic_set['protocol'] = 'TCP';

		var lb_set = {};
		lb_set['lb_algo'] = this.$el.find('.lb_algo').val();
		lb_set['lb_kind'] = "FNAT"

		var health_checker = {};
		var check_type = this.$el.find('.check_type').val();
		if (check_type == 'http')
		{
			health_checker['check_type'] = 'http';
			health_checker['delay_loop'] = this.$el.find('.http_delay_loop').val();
			health_checker['url_path'] = this.$el.find('.path').val();
			health_checker['url_status_code'] = this.$el.find('.status_code').val();
			health_checker['connect_timeout'] = this.$el.find('.http_connect_timeout').val();
			health_checker['nb_get_retry'] = this.$el.find('.http_nb_get_retry').val();
			health_checker['delay_before_retry'] = this.$el.find('.http_delay_before_retry').val();
		}
		else if (check_type == 'tcp')
		{
			health_checker['check_type'] = 'tcp';
			health_checker['delay_loop'] = this.$el.find('.tcp_delay_loop').val();
			health_checker['connect_timeout'] = this.$el.find('.tcp_connect_timeout').val();
			health_checker['nb_get_retry'] = this.$el.find('.tcp_nb_get_retry').val();
			health_checker['delay_before_retry'] = this.$el.find('.tcp_delay_before_retry').val();
		}
		else
		{
			health_checker['check_type'] = "";
		}
		//console.log(basic_set);
		//console.log(lb_set);
		//console.log(health_checker);
		if (action == 'show')
		{
			basic_set['rs_cluster_name'] = this.$el.find('#rs_cluster_name').attr('name');
			return [
			{name:"基础配置",value: basic_set},
			{name:"均衡模式和算法配置", value: lb_set},
			{name:"服务集群健康检查配置", value: health_checker}
			];
		}
		else
		{
			basic_set['rs_cluster_name'] = this.$el.find('#rs_cluster_name').attr('name');
			basic_set['rs_cluster_id'] = this.$el.find('#rs_cluster_name').val();
			var attr = {};
			_.each(basic_set, function(v, k){
				attr[k] = v;
			});
			_.each(lb_set, function(v, k){
				attr[k] = v;
			});
			_.each(health_checker, function(v, k){
				attr[k] = v;
			});
			//return attr;
			return {
				basic_set: basic_set,
			    lb_set: lb_set,
			    healthCheck_set: health_checker
			};
		}
	},
	validateData: function(data){
		//这里用的是underscore.js提供的一些方法
		//检测页面是否存在错误
		if (this.$el.find('div').hasClass('has-error'))
		{
			return false;
		}
		//检测是否又元素存在空值
		if (_.some(data, function(v, k){
			return _.contains(data[k], ""); 
		}))
		{
			return false;
		}
		return true;
	},
	initialize : function(options) {
	},
	render: function(){
		this.$el.html(this.template());
		//setTimeout(() => {
		//	this.validateData();
        //
		//}, 1000)
		var self = this;
		setTimeout(() => {
			$.validate();
			//根据API，值改变时会调用
			$('#rs_cluster_name').on("select2:select", function(e){
				//设置集群名称值
				//console.log(e);
				self.$el.find('#rs_cluster_name').attr('name', e.params.data.name);
				self.$el.find('.basic_set_error_message').css('display', 'none');
				self.$el.find('[name="vip"]').val("");
				//self.$el.find('[name="rs_cluster_name"]').val(e.params.data.name);
				//根据所选的集群名称联动设置vip，原则是（1）这个集群已经配置了vip－－>返回已有的（2）这个集群未配置－－>马上选择一个未用的
				$.ajax({
					url : '/data/lvs/get-vip-by-group?group_id=' + e.params.data.id,
					type : 'get' 
				}).success(function(data){
					if (data.exists == 'yes')//先有集群已经有一个正在使用的VIP
					{
						self.$el.find('[name="vip"]').attr('disbaled', 'disabled');
						self.$el.find('[name="vip"]').val(data.vip);
						self.$el.find('.basic_set_error_message').html('<h4>此集群已经配置了VIP:'
							+data.vip+' VPORT:'+data.vport+
							' ,所以再配置时不允许使用相同的端口了</h4>');
						self.$el.find('.basic_set_error_message').css('display', 'block');
					}
					else if (data.exists == 'no')//现有集群可以复用一个停用的VIP
					{
						self.$el.find('[name="vip"]').attr('disbaled', 'disabled');
						self.$el.find('[name="vip"]').val(data.vip);
					}
					else if (data.exists == 'empty')//需要一个新的VIP
					{
						self.$el.find('[name="vip"]').removeAttr('disabled');
					}
				});
			});
			//用于select选择框
			$('#rs_cluster_name').select2({
				placeholder: '请选择一个集群',
				ajax: {
					url: '/data/group',
					dataType: 'json',
					delay: 250,
					data: function(params){
						return {
							q: params.term
						};
					},
					processResults: function(data, params){
						return {
							results: data
						}
					},
					cache: true
				},
				escapeMarkup: function (markup) { return markup; },
				minimumInputLength: 3,
				templateResult: function (repo) {
                    if (repo.loading) {
                        return repo.text;
                    }
                    return repo.name;
			    },
			    templateSelection: function (repo) {
                    return repo.name || repo.text;
                }
			});
		});
		return this;
	}
})

app.module('lvs/configuration', function(){
	var view = new lvsFormView({});
	$('.block-container').html(view.render().$el);
})







