/**
 * Created by  on 2018/10/30
 */

var page = {
    data: {
        baseUrl: 'http://am.frp.uvanart.com:9200', // 测试库
        // baseUrl: 'https://am.uvanart.com', // 正式库
        // baseUrl: 'http://api.frp.uvanart.com:9200/mock/86', // mock
        // baseUrl: 'http://10.1.43.239:8080', // 本地
        interactUrl: '/a/fz/appreciation/fzAppreciationRecord/getSlideAppreciation', // 获取被赞与受赞shu'j
        departmentUrl: "/a/fz/appreciation/fzAppreciationRecord/getDeptDate",
        appreciateDetailUrl: '/a/fz/appreciation/fzAppreciationRecord/getSlideDate'
    },
    init: function () {
        var _this = this
        // this.getNowTime()
        this.getDepartmentData()
        this.search(0)
        this.bindEvent()
    },
    /*
    * 事件绑定
    * */
    bindEvent: function () {
        var d_select_btn_item = d3.selectAll(".select_btn_item")
        var d_tooltip_com = d3.select(".tooltip_com")
        d3.select('body').on('click', function (e) {
            d3.event.stopPropagation();
            // 清楚选择数据
            d_select_btn_item.classed('active', false)
            d3.select(d_select_btn_item[0][0]).classed('active', true)
            d_tooltip_com.style("display", "none")
        })
        d3.select('.tooltip_com').on('click', function (e) {
            d3.event.stopPropagation();
        })
    },
    /*
    * 获取被赞与受赞数据
    * type 1:星期 2:月 3:季度 4:年,默认2,
    *id 如果是全公司不分部门的话传0,其余传部门id
    * ranking 梵赞记录滑动效果前几名
    * time 时间
    * */
    getInteractData: function (type, id, ranking, time, callback) {
        type = type || '2'
        id = id || "0"
        ranking = ranking || '10'
        var url = this.data.baseUrl + this.data.interactUrl + "?type=" + type + "&departmentId=" + id + "&ranking=" + ranking + "&monthStartTime=" + time
        d3.json(url, function (res) {
            var personData = {
                "nodes": [],
                "links": []
            }
            if (res.code === 200) {
                // 请求成功
                var data = res.data || []
                // 如果返回数据为空，情况页面
                if (data.length === 0) {
                    d3.select('svg').html('')
                    return
                }
                data.forEach(function (item) {
                    var praiserObj = {
                        "id": item.praiserId, // 获赠id
                        "name": item.praiserName, // 获赠Name
                        "image": item.praiserAvatar // 获赠图片地址
                    }
                    var presenterObj = {
                        "id": item.presenterId, // 赠送id
                        "name": item.presenterName, // 赠送Name
                        "image": item.presenterAvatar // 赠送图片地址
                    }
                    personData.links.push({
                        "source": item.presenterId, // 赠送人id
                        "target": item.praiserId // 获赠人id
                    })
                    personData.nodes.push(praiserObj)
                    personData.nodes.push(presenterObj)
                })
                personData.nodes = _.uniqBy(personData.nodes, "id");
                return callback(personData)
            } else {
                // 其他情况
                alert(res.msg)
            }

        })
    },
    /*
    * 请求弹出赞赏详细数据
    * id :	钉钉id
    * type: 1:星期 2:月 3:季度 4:年
    * */
    //
    getAppreciateDetailData: function (id, type) {
        var time = this.getSelectTime()
        //请求赞赏详细数据
        var url = this.data.baseUrl + this.data.appreciateDetailUrl + '?userId=' + id + '&type=' + type + '&monthStartTime=' + time
        d3.json(url, function (res) {
            // console.log(res)
            if (res.code === 200) {
                var data = res.data
                var typeName = ''
                if (type === "2") {
                    typeName = '本月份'
                } else if (type === '3') {
                    typeName = '本季度'
                } else if (type === '4') {
                    typeName = '本年度'
                }
                // 成功
                d3.select(".select_data").html(
                    " <li>" + typeName + "赞赏排名 " + data.leaderboards + "名</li>" +
                    "<li>收到梵钻 " + data.coinCounts + "个</li>" +
                    "<li>赞赏他的人 " + data.praiserNum + "人</li>" +
                    "<li>送出梵钻 " + data.coinNumber + "个</li>" +
                    "<li>赞赏他人 " + data.presenterNum + "人</li>")
            } else {
                //其他情况
                alert(res.msg)
            }
        })
    },
    /*
    * 获取部门数据
    * departmentId :部门id
    * */
    getDepartmentData: function (id) {
        var _this = this
        var url = this.data.baseUrl + this.data.departmentUrl
        d3.json(url, function (res) {
            if (res.code === 200) {
                var arrData = res.data || []
                arrData.forEach(function (item, index) {
                    $('.search_en_select_d').append("<option value=" + item.departmentId + ">" + item.name + "</option>")
                })
                // 注册搜索按钮点击事件，用bind改变this的指向，原本是指向$('.search_en_btn')，改为指向page
                $('.search_en_btn').on('click', function () {
                    _this.search(1)
                }.bind(_this))
            } else {
                alert(res.msg)
            }
        })
    },
    /*
    * 获取当前年月
    * */
    getNowTime: function () {
        // 获取当前日期
        var date = new Date();
        // 获取当前年份
        var nowYear = date.getFullYear();
        // 获取当前月份
        var nowMonth = date.getMonth() + 1;
        // 对月份进行处理，1-9月在前面添加一个“0”
        if (nowMonth >= 1 && nowMonth <= 9) {
            nowMonth = "0" + nowMonth;
        }
        nowMonth = nowMonth.toString()
        nowYear = nowYear.toString()
        var time = this.fitterData(nowYear, nowMonth)
        // 设置当前选择框时间
        $('.search_en_select_y').val(nowYear)
        $('.search_en_select_m').val(nowMonth)
        return time
    },
    /*
    * 过滤时间
    * y:年 m：月
    * */
    fitterData: function (y, m) {
        return (y + "-" + m + "-01 00:00:00")
    },
    /*
    * 获取当前选择的时间
    * */
    getSelectTime: function () {
        var y = $('.search_en_select_y option:selected').val() // 年
        var m = $('.search_en_select_m option:selected').val() // 月
        return (this.fitterData(y, m))
    },
    // 拖拽处理
    drag: function () {
        var _this = this
        var dragstart = function (d, i) {
            _this.force.stop();
            d3.event.sourceEvent.stopPropagation();
        };
        var dragmove = function (d, i) {
            d.px += d3.event.dx;
            d.py += d3.event.dy;
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            _this.tick();
        };
        var dragend = function (d, i) {
            d.fixed = true;
            _this.tick();
            _this.force.resume();
        };
        this.nodeDrag = d3.behavior.drag()
            .on("dragstart", dragstart)
            .on("drag", dragmove)
            .on("dragend", dragend);
    },
    // 标记
    // tick: function() {
    //
    // },
    /*
    * 判断被连接数量,来改变图片大小
    *  d:nodes参数，flag：是否是半径（r)默认不填
    * */
    changeImgSize: function (d, flag) {
        var linkNum = d.weight
        if (linkNum <= 10) {
            return (flag === 'r' ? "20" : "40")
        } else if (linkNum > 10 && linkNum < 20) {
            return (flag === 'r' ? "30" : "60")
        } else if (linkNum >= 20) {
            return (flag === 'r' ? "40" : "80")
        }
    },
    /*
    * 判断被连接数量,来改变文字距离大小
    *  d:nodes参数
    * */
    changeTextDistance: function (d) {
        var linkNum = d.weight
        if (linkNum <= 10) {
            return "30"
        } else if (linkNum > 10 && linkNum < 20) {
            return "40"
        } else if (linkNum >= 20) {
            return "50"
        }
    },
    /*
    * 判断被连接数量,来改变箭头距离大小
    *  d:links中的target（目标）参数
    * */
    changeArrowsDistance: function (d) {
        var linkNum = d.weight
        if (linkNum <= 10) {
            return 32
        } else if (linkNum > 10 && linkNum < 20) {
            return 42
        } else if (linkNum >= 20) {
            return 52
        }
    },
    /*
    * 点击搜索按钮
    *  departmentId :部门id
    *  flag: 0代表当前 1：选择后的
    * */
    search: function (flag) {
        var _this = this
        var time = ''
        var id = $('.search_en_select_d option:selected').val() // 部门id
        var ranking = $('.search_en_select_ran').val() || "10" // 排名
        if (flag === 0) {
            time = this.getNowTime()
        } else if (1) {
            // var y = $('.search_en_select_y option:selected').val() // 年
            // var m = $('.search_en_select_m option:selected').val() // 月
            // time = this.fitterData(y, m)
            time = _this.getSelectTime()
        }
        if (!id) return
        _this.getInteractData('', id, ranking, time, function (data) {
            _this.groupExplorer('body', data)
        })

    },
    // 弹出框详细文本框
    highlightToolTip: function (obj) {
        var _this = this
        var d_tooltip_com = d3.select(".tooltip_com")
        if (obj) {
            // console.log(obj)
            var type = ''
            var name = obj.name
            var id = obj.id
            var d_select_btn_item = d3.selectAll(".select_btn_item")
            d3.select(".tooltip_title span").html("<span>" + name + " 的赞赏数据</span>")
            d_tooltip_com.style("display", "block")
            _this.getAppreciateDetailData(id, '2')
            d_select_btn_item
                .on("click", function (e, i) {
                    d3.event.stopPropagation();
                    // 处理按钮的状态
                    d_select_btn_item.classed('active', false)
                    d3.select(this).classed('active', true)
                    // d_select_btn_item[i].classed('active', true)
                    if (i === 0) {
                        type = '2'
                    } else if (i === 1) {
                        e
                        type = '3'
                    } else if (i === 2) {
                        type = '4'
                    }
                    _this.getAppreciateDetailData(id, type)
                })
            // 关闭按钮事件
            d3.select(".close")
                .on("click", function () {
                    // 清楚选择数据
                    d_select_btn_item.classed('active', false)
                    d3.select(d_select_btn_item[0][0]).classed('active', true)
                    // d3.event.stopPropagation();
                    d_tooltip_com.style("display", "none")
                })
        } else {
            d_tooltip_com.style("display", "none")
        }
    },
    // 导力图处理
    groupExplorer: function (wrapper, config) {
        // 排除筛选的时候出现已经存在的svg
        d3.select("svg").remove()
        var _this = this, highlighted = null, dependsNode = [], dependsLinkAndText = [];
        var defaultConfig = {
            data: {"nodes": [], "links": []},
            width: window.innerWidth,
            height: window.innerHeight - 17,
            distance: 100
        };
        $.extend(true, defaultConfig, {data: config});
        // 处理链接不是数字的问题
        defaultConfig.data.links.forEach(function (e) {
            if (typeof e.source != "number" && typeof e.target != "number") {
                var sourceNode = defaultConfig.data.nodes.filter(function (n) {
                        return n.id === e.source;
                    })[0],
                    targetNode = defaultConfig.data.nodes.filter(function (n) {
                        return n.id === e.target;
                    })[0];
                e.source = sourceNode;
                e.target = targetNode;
            }
        });
        // 配置颜色
        this.color = d3.scale.category20();
        // 配置拖动
        var zoom = d3.behavior.zoom()
            .scaleExtent([0.2, 10])
            .on("zoom", function () {
                _this.zoomed();
            });
        // 增加svg标签
        this.vis = d3.select("body").append("svg:svg")
            .attr("width", defaultConfig.width)
            .attr("height", defaultConfig.height)
            .call(zoom).on("dblclick.zoom", null);
        // 增加g标签
        this.vis = this.vis.append('g').attr('class', 'all')
            .attr("width", defaultConfig.width)
            .attr("height", defaultConfig.height)

        // 配置导力图
        this.force = d3.layout.force()
            .nodes(defaultConfig.data.nodes)
            .links(defaultConfig.data.links)
            .charge(-550)
            .linkDistance(80)
            // .gravity(.015)
            // .distance(defaultConfig.distance)
            // .charge(function (d) {
            //     return (-10 * d.index)
            // })
            .size([defaultConfig.width, defaultConfig.height])
            .start();
        // 配置箭头
        this.vis.append("svg:defs").selectAll("marker")
            .data(defaultConfig.data.links)
            .enter().append("svg:marker")
        // .attr("id", "arrow")
            .attr("id", function (d) {
                return "arrow" + d.target.index
            })
            .attr('class', 'arrow')
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", function (d) {
                return _this.changeArrowsDistance(d.target)
            })
            .attr("refY", 0)
            .attr("markerWidth", 9)
            .attr("markerHeight", 16)
            .attr("markerUnits", "userSpaceOnUse")
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr('fill', '#666');
        // 配置圆圈图片
        this.pattern = this.vis.append("svg:defs").selectAll("pattern")
            .data(defaultConfig.data.nodes)
            .enter().append("svg:pattern")
            .attr("id", function (d) {
                return ("catpattern" + d.index)
            })
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", function (d) {
                return _this.changeImgSize(d)
            })
            .attr("height", function (d) {
                return _this.changeImgSize(d)
            })
            .attr("x", function (d) {
                return _this.changeImgSize(d, 'r')
            })
            .attr("y", function (d) {
                return _this.changeImgSize(d, 'r')
            })

        this.pattern.append("svg:image")
            .attr("class", "circle")
            .attr("xlink:href",
                function (d) {
                    return d.image
                })
            .attr("width", function (d) {
                return _this.changeImgSize(d)
            })
            .attr("height", function (d) {
                return _this.changeImgSize(d)
            })
        // .attr("x", "0")
        // .attr("y", "0")

        // 配置连接线
        this.link = this.vis.selectAll("line.link")
            .data(defaultConfig.data.links)
            .enter().append("svg:line")
            .attr("class", "link")
            .attr('stroke-width', 1)
            .attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            })
            // .attr("marker-end", "url(#arrow)")
            .attr("marker-end", function (d) {
                return ("url(#arrow" + d.target.index + ")")
            })
            .attr('stroke', '#999');

        //执行拖拽函数
        this.drag()

        // 网络高亮(暂时弃用)
        this.highlightObject = function (obj) {
            if (obj) {
                var objIndex = obj.index;
                dependsNode = dependsNode.concat([objIndex]);
                dependsLinkAndText = dependsLinkAndText.concat([objIndex]);
                defaultConfig.data.links.forEach(function (lkItem) {
                    if (objIndex == lkItem['source']['index']) {
                        dependsNode = dependsNode.concat([lkItem.target.index])
                    } else if (objIndex == lkItem['target']['index']) {
                        dependsNode = dependsNode.concat([lkItem.source.index])
                    }
                });
                _this.node.classed('inactive', function (d) {
                    return (dependsNode.indexOf(d.index) == -1)
                });
                _this.link.classed('inactive', function (d) {

                    return ((dependsLinkAndText.indexOf(d.source.index) == -1) && (dependsLinkAndText.indexOf(d.target.index) == -1))
                });

                _this.linetext.classed('inactive', function (d) {
                    return ((dependsLinkAndText.indexOf(d.source.index) == -1) && (dependsLinkAndText.indexOf(d.target.index) == -1))
                });
            } else {
                _this.node.classed('inactive', false);
                _this.link.classed('inactive', false);
                _this.linetext.classed('inactive', false);
            }
        };

        // 配置节点
        this.node = this.vis.selectAll("g.node")
            .data(defaultConfig.data.nodes)
            .enter().append("svg:g")
            .attr("class", "node")
            .call(_this.nodeDrag)
            .on('click', function (d) {
                d3.event.stopPropagation();
                // 点击节点后处理事件
                if (_this.node.mouseoutTimeout) {
                    clearTimeout(_this.node.mouseoutTimeout);
                    _this.node.mouseoutTimeout = null;
                }
                if (d3.event.defaultPrevented) return // 解决点击与拖拽冲突
                _this.highlightToolTip(d);
            })
            .on('dblclick', function (d) {
                // 双击节点网线高亮
                _this.highlightObject(d);
                d3.event.stopPropagation();
            });
        // 双击取消高亮
        d3.select("body").on('dblclick', function () {
            dependsNode = dependsLinkAndText = [];
            _this.highlightObject(null);
        });

        // 配置节点图片(采用圆角)
        this.node.append("svg:circle")
            .attr("class", "circle")
            .attr("width", function (d) {
                return _this.changeImgSize(d)
            })
            .attr('height', function (d) {
                return _this.changeImgSize(d)
            })
            // .attr("x", "20")
            // .attr('y', "20")
            .attr('r', function (d) {
                return _this.changeImgSize(d, 'r')
            })
            .attr('stroke', "#fff")
            .attr('stroke-width', "1")
            .attr('fill',
                function (d) {
                    return ("url(#catpattern" + d.index + ")")
                })
            // 鼠标移上图片效果
            .on('mouseover', function () {
                $(this).attr('stroke-width', "3")
            })
            // 鼠标移出图片效果
            .on('mouseout', function () {
                $(this).attr('stroke-width', "1")
            })

        // 配置节点文字
        this.node.append("svg:text")
            .attr("class", "nodetext")
            .attr("dx", function (d) {
                return _this.changeTextDistance(d)
            })
            .attr('text-anchor', 'start')
            .text(function (d) {
                return d.name
            })
            .attr('fill', function (d, i) {
                return _this.color(i);
            });
        // 配置连接线
        this.linetext = this.vis.selectAll('.linetext')
            .data(defaultConfig.data.links)
            .enter()
            .append("text")
            .attr("class", "linetext")
            .attr("x", function (d) {
                return (d.source.x + d.target.x) / 2
            })
            .attr("y", function (d) {
                return (d.source.y + d.target.y) / 2
            })
            .text(function (d) {
                return d.relation
            })
            .attr('fill', function (d, i) {
                return _this.color(i);
            })
            .call(this.force.drag);

        this.zoomed = function () {
            _this.vis.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")")
        };

        // 弃用，用于判断是否连接数最多
        var findMaxWeightNode = function () {
            var baseWeight = 1, baseNode;
            defaultConfig.data.nodes.forEach(function (item) {
                // console.log(item)
                if (item.weight > baseWeight) {
                    baseWeight = item.weight
                    baseNode = item
                }
            });
            return baseNode;
        };
        this.tick = function () {
            // var findMaxWeightNodeIndex = findMaxWeightNode().index;
            // defaultConfig.data.nodes[findMaxWeightNodeIndex].x = defaultConfig.width / 2;
            // defaultConfig.data.nodes[findMaxWeightNodeIndex].y = defaultConfig.height / 2;
            _this.link.attr("x1", function (d) {
                return d.source.x;
            })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });
            _this.linetext.attr("x", function (d) {
                return (d.source.x + d.target.x) / 2
            })
                .attr("y", function (d) {
                    return (d.source.y + d.target.y) / 2
                });
            _this.node.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        };
        _this.force.on("tick", this.tick);

    }
}
$(function () {
    page.init()
})
