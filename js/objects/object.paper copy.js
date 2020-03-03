'use strict';

angular
        .module('object.paper', [])
        .factory('paper', ['$rootScope','component', function ($rootScope,component) {
            var factory = {};
            var MinispicePaper = (function(){
                var MinispicePaper = function(){
                    return new MinispicePaper.fn.paper();
                }

                MinispicePaper.fn = MinispicePaper.prototype = {
                    constructor: MinispicePaper,

                    paper: function(){
                        this.paperId = '';    
                        this.components = []; //all components in each paper
                        this.dots = [];       //all dots array of each line, it's also an array, just like this: [[{x,y},{x,y},...], []....]
                        this.tempDot = [];
                        this.nodes = [];      //每个画布上的交叉点（点击交叉点后产生）just like this:[{id: , label: , position: },{}...]
                        this.paper = null;
                        this.isShow = false;
                        this.startLink = false;
                        this.startLinkLine = false;
                        this.startDot = {x:0, y:0};
                        this.endDot = {x:0, y:0};
                        this.startDotObject = null;
                        this.startLine = {start:{x:0, y:0}, end:{x:0, y:0}};
                        this.endLine = {start:{x:0, y:0}, end:{x:0, y:0}};
                        this.startLineObject = null;
                        this.startLineDot = {x:0, y:0};
                        this.endLineDot = {x:0, y:0};
                        this.initPaper = function(){
                            var paperId = this._createPaperId();                            
                            $('#paper').append('<div id='+paperId+'></div>');
                            this.paperId = paperId;
                            this.paper = this._initPaper(paperId);
                            this.isShow = true; //show the current paper
                            $rootScope.minispice.currentPaperId = paperId;
                        };
                    },
                    _initPaper: function(paperId){
                        var dots = this.dots,                        
                            tempDot = this.tempDot,       //临时数据点数组，记录一条完整线的数据
                            startLink = this.startLink,   //是否开始画线(点对点)
                            startLinkLine = this.startLinkLine, //是否开始画线（线对线）
                            startDot = this.startDot,     //开始画线的起始点
                            endDot = this.endDot,         //开始画线的结束点
                            startDotOpposite = {}, 
                            // testLink = new joint.dia.Link(),
                            // testLinkFirst = false,
                            endDotOpposite = {},
                            startDotObject = this.startDotObject, //记录开始画线的第一个点（点对点）
                            startLine = this.startLine,
                            endLine = this.endLine,
                            startLineDot = this.startLineDot,
                            endLineDot = this.endLineDot,
                            startLineObject = this.startLineObject, //记录开始画线的第一根线（线对线）
                            paper = new joint.dia.Paper({
                                            el: $('#'+paperId),
                                            model: $rootScope.minispice.graph,
                                            width: 2000,
                                            height: 1400,
                                            gridSize: 10,
                                            drawGrid: {name: 'doubleMesh', args:[{color: 'black', thickness: 0.2}, { color: 'black', scaleFactor: 10, thickness: .5 }]},
                                        });
                            $('#'+paperId).on('mousemove', function (e) {
                                //console.log('pointermove:x='+e.pageX+',y='+e.pageY);
                                if($rootScope.minispice.paintSwitch.type=='wire' && testLinkFirst){
                                    testLink.set('target', {x: e.pageX-200, y: e.pageY-130});
                                }
                            });

                        paper.on({'blank:pointerdown': function (evt, x, y ) {
                            var type = $rootScope.minispice.paintSwitch.type;
                            if($rootScope.minispice.paintSwitch.isStartDraw){
                                switch (type) {
                                    case 'wire': //wire
                                        tempDot.push({x:x,y:y});
                                        var dotsNum = tempDot.length;
                                        if(dotsNum>1){
                                            if((tempDot[dotsNum-1].x == tempDot[dotsNum-2].x && tempDot[dotsNum-1].y != tempDot[dotsNum-2].y) || (tempDot[dotsNum-1].x != tempDot[dotsNum-2].x && tempDot[dotsNum-1].y == tempDot[dotsNum-2].y)){
                                                var link = new joint.dia.Link();
                                                link.set('target', {x: tempDot[dotsNum-1].x, y: tempDot[dotsNum-1].y});
                                                link.set('source', {x: tempDot[dotsNum-2].x, y: tempDot[dotsNum-2].y});
                                                link.addTo($rootScope.minispice.graph);
                                                //evt.data = {link: link, x: x, y: y};   
                                                $.each($("#v-3")[0].children, function(aindex, com){
                                                    if(($(com).attr('model-id')) == link.id){//mark the startDot
                                                        $(com.children[6]).remove();
                                                        $(com.children[5]).remove();
                                                    }
                                                })                                                 
                                            }else{
                                                tempDot.pop();
                                                if(tempDot.length>1)
                                                    dots.push(tempDot);
                                                tempDot = [];
                                            }
                                        }
                                        // if(!testLinkFirst){//还没有点第一下
                                        //     testLink.set('source', {x: x, y: y});
                                        //     testLink.set('target', {x: 0, y: 0});
                                        //     testLink.addTo(graph);
                                        //     testLinkFirst = true;
                                        // }else{
                                        //     testLink.set('target', {x: x, y: y});
                                        //     testLinkFirst = false;
                                        // }
                                        break;

                                    case 'component': //component

                                        break;

                                    default: //draw: capacitor, ground, resistor, inductor, diode, 
                                        var newComponent = component.createComponent();
                                        var cpt = newComponent.createShape(type, x, y);
                                        $rootScope.minispice.graph.addCell(cpt.shape);                                            
                                        //if(cpt.linkNodes.length>0)
                                        $rootScope.minispice.graph.addCells(cpt.linkNodes);

                                        $.each($rootScope.minispice.papers,function(cindex,cobj){
                                            if(cobj.isShow)
                                                $rootScope.minispice.papers[cindex].components.push(newComponent);
                                        });                                            
                                        //console.log($rootScope.minispice);
                                        break;
                                }                                
                            }}
                        });

                        paper.on({'cell:pointerdown': function (cellView, evt, x, y ) {//if it is shape return false  
                                var tempOppositeDot = {},
                                    makeLine = function(startDot,endDot,isLine){
                                        var link = new joint.dia.Link();
                                        link.set('target', startDot);
                                        link.set('source', endDot);
                                        if(isLine)
                                            link.attr('.connection/stroke', 'blue');
                                        link.addTo($rootScope.minispice.graph);

                                        $.each($("#v-3")[0].children, function(aindex, com){
                                            if(($(com).attr('model-id')) == link.id){//mark the startDot
                                                $(com.children[6]).remove();
                                                $(com.children[5]).remove();
                                            }
                                        });
                                    };
                                $.each($rootScope.minispice.papers[0].components, function(ctindex, ct){
                                    $.each(ct.linkNodes, function(clnindex, cln){
                                        if(ct.linkNodes.length>1 && cln.cid == cellView.model.cid){
                                            if(clnindex === 0)
                                                tempOppositeDot = ct.linkNodes[1].attributes.position;
                                            else if(clnindex === 1)
                                                tempOppositeDot = ct.linkNodes[0].attributes.position;
                                        }
                                    });
                                });
                                
                                if(cellView.model.attributes.type == 'standard.Circle'){//如果鼠标点击在连接点上
                                    if(startLink){//如果已经点击过起始点，表示开始绘制路径
                                        endDot = cellView.model.attributes.position;
                                        endDot.x = endDot.x + 4;
                                        endDotOpposite = tempOppositeDot;
                                        var leftTop = startDot.y < startDotOpposite.y, //start dot is top dot, !leftTop is bottom dot
                                            rightTop = endDot.y < endDotOpposite.y,    //end dot is top dot, !rightTop is bottom dot
                                            resetDots = function(){
                                                cellView.model.remove(); //remove endDot
                                                startDotObject.remove(); //remove startDot
                                                startLink = false;
                                                startDot = {};
                                                endDot = {};
                                                startDotObject = null;
                                                startDotOpposite = {};
                                                endDotOpposite = {};
                                            };                                        
        
                                        if(startDot.x != endDot.x && startDot.y == endDot.y){//两点在同一水平线上
                                            makeLine(startDot, endDot, 0);                                            
                                        }else if(startDot.x == endDot.x && startDot.y != endDot.y){//两点在同一垂直线上
                                            var tempDotX = startDot.x-100;
                                            if(!leftTop && !rightTop)
                                                tempDotX = startDot.x+100;
                                            if((leftTop && !rightTop && endDot.y < startDot.y) || (!leftTop && rightTop && endDot.y > startDot.y)){
                                                makeLine(startDot, endDot,0);
                                            }else{
                                                makeLine(startDot, {x:tempDotX, y:startDot.y}, 0);
                                                makeLine({x:tempDotX, y:startDot.y}, {x:tempDotX, y:endDot.y}, 0);
                                                makeLine({x:tempDotX, y:endDot.y}, endDot, 0);
                                            }
                                        }else{//Other situations
                                            if((leftTop && rightTop && startDot.y < endDot.y) ||   //top & top
                                               (!leftTop && !rightTop && startDot.y > endDot.y) || //bottom & bottom
                                               (leftTop && !rightTop && startDot.y > endDot.y) ||  //top & bottom
                                               (!leftTop && rightTop && startDot.y < endDot.y)){   //bottom & top;   MiddleDot:(endDot.x, startDot.y), startDot and endDot both link to MiddleDot
                                                makeLine(startDot, {x:endDot.x, y:startDot.y}, 0);
                                                makeLine({x:endDot.x, y:startDot.y}, endDot, 0);
                                            }else if((leftTop && rightTop && startDot.y > endDot.y) ||
                                                     (!leftTop && !rightTop && startDot.y < endDot.y)){//MiddleDot:(startDot.x, endDot.y)
                                                makeLine(startDot, {x:startDot.x, y:endDot.y}, 0);
                                                makeLine({x:startDot.x, y:endDot.y}, endDot, 0);
                                            }else if((leftTop && !rightTop && startDot.y < endDot.y && endDot.y>startDotOpposite.y) ||
                                                     (!leftTop && rightTop && startDot.y > endDot.y && endDot.y>startDotOpposite.y)){ //2 dots added between start and end: (endDot.x+100, startDot.y), (endDot.x+100,endDot.y)
                                                makeLine(startDot, {x:endDot.x+100, y:startDot.y}, 0);
                                                makeLine({x:endDot.x+100, y:startDot.y}, {x:endDot.x+100, y:endDot.y}, 0);
                                                makeLine({x:endDot.x+100, y:endDot.y}, endDot, 0);
                                            }else if((leftTop && !rightTop &&  startDot.y < endDot.y && endDot.y<startDotOpposite.y) ||
                                                     (!leftTop && rightTop && startDot.y > endDot.y && endDot.y<startDotOpposite.y)){ //中间加两个点，需要计算中间点
                                                 var tempMiddleX = (endDot.x-startDot.x)/2+startDot.x;
                                                 if(startDot.x > endDot.x)
                                                    tempMiddleX = (startDot.x-endDot.x)/2+endDot.x;
                                                makeLine(startDot, {x:tempMiddleX, y:startDot.y}, 0);
                                                makeLine({x:tempMiddleX, y:startDot.y}, {x:tempMiddleX, y:endDot.y}, 0);
                                                makeLine({x:tempMiddleX, y:endDot.y}, endDot, 0);                                                
                                            }
                                        }
                                        resetDots();
                                    }else{//还没有起始点，则设置起始点 
                                        let allComponent = $("#v-3")[0].children;
                                        $.each(allComponent, function(aindex, com){
                                            if(($(com).attr('model-id')) == cellView.model.id){//mark the startDot
                                                $(com.children[0]).attr('fill','red');
                                                $(com.children[0]).attr('stroke','red');
                                            }
                                        });

                                        startDot = cellView.model.attributes.position;
                                        startDot.x = startDot.x+4;                                        
                                        startDotObject = cellView.model;
                                        startDotOpposite = tempOppositeDot;
                                        startLink = true;
                                    }
                                }else if(cellView.model.attributes.type == 'link'){//select one link line
                                    var allLinks = $(".joint-type-link"),
                                        tempLine = null,
                                        lineDots = {},
                                        markCircle = function(x,y){
                                            var circle = new joint.shapes.standard.Circle();
                                            circle.position(x-6, y-6);
                                            circle.resize(12, 12);
                                            circle.attr('body/fill','blue');
                                            circle.attr('body/stroke','blue');
                                            $rootScope.minispice.graph.addCells(circle);
                                        };

                                    $.each(allLinks, function(lindex, link){                                       
                                        if(($(link).attr('model-id')) == cellView.model.id){
                                            tempLine = $(link.children[0]).attr('d').split(/[ ]+/);//获取被点击线段的两端点坐标
                                            lineDots = {start:{x:tempLine[1], y:tempLine[2]}, end:{x:tempLine[4], y:tempLine[5]}};
                                        }
                                    });

                                    if(startLinkLine){//已经标记了起始线，则开始连线
                                        if(startLine==lineDots) //如果跟前一次点击的是同一根线，则返回
                                            return;
                                        
                                        endLine = lineDots;         //1.记录结束线的两个端点                                        
                                        endLineDot = {x:x, y:y};    //2.标记结束点
                                        markCircle(x, y);           //3.画一个圆形标记

                                        //4.判断起始线和结束线的方向和位置，然后连线
                                        var startHorizontal = false, //起始线是否水平
                                            endHorizontal = false;   //结束线是否水平
                                        if(startLine.start.x != startLine.end.x && startLine.start.y == startLine.end.y)
                                            startHorizontal = true;
                                        if(endLine.start.x != endLine.end.x && endLine.start.y == endLine.end.y)
                                            endHorizontal = true;

                                        if((startHorizontal && endHorizontal && startLineDot.x == endLineDot.x && startLineDot.y != endLineDot.y) ||
                                           (!startHorizontal && !endHorizontal && startLineDot.x != endLineDot.x && startLineDot.y == endLineDot.y)){//水平+水平，且x相等；或垂直+垂直，且y相等；则不加辅助点，直接连线
                                            makeLine(startLineDot, endLineDot, 1);
                                        }else if(startHorizontal && !endHorizontal && startLineDot.x != endLineDot.x && startLineDot.y != endLineDot.y){//水平+垂直，增加一个辅助点1，连2条线
                                            makeLine(startLineDot, {x:startLineDot.x, y:endLineDot.y}, 1);
                                            makeLine({x:startLineDot.x, y:endLineDot.y}, endLineDot, 1);                                            
                                        }else if(!startHorizontal && endHorizontal && startLineDot.x != endLineDot.x && startLineDot.y != endLineDot.y){//垂直+水平，增加一个辅助点2，连2条线
                                            makeLine(startLineDot, {x:endLineDot.x, y:startLineDot.y}, 1);
                                            makeLine({x:endLineDot.x, y:startLineDot.y}, endLineDot, 1);                                            
                                        }else if(startHorizontal && endHorizontal && startLineDot.x != endLineDot.x){//水平+水平，增加两个辅助点，连3条线
                                            let dot1 = {x:startLineDot.x, y:startLineDot.y-100},
                                                dot2 = {x:endLineDot.x, y:startLineDot.y-100};
                                            if(startLineDot.y > endLineDot.y){
                                                dot1.y = endLineDot.y-100;
                                                dot2.y = endLineDot.y-100; 
                                            }
                                            makeLine(startLineDot, dot1, 1);
                                            makeLine(dot1, dot2, 1);
                                            makeLine(dot2, endLineDot, 1);
                                        }else if(!startHorizontal && !endHorizontal && startLineDot.y != endLineDot.y){//垂直+垂直，增加两个辅助点，连3条线
                                            let dot1 = {x:startLineDot.x-100, y:startLineDot.y},
                                                dot2 = {x:startLineDot.x-100, y:endLineDot.y};
                                            if(startLineDot.x < endLineDot.x){
                                                dot1.x = endLineDot.x+100;
                                                dot2.x = endLineDot.x+100; 
                                            }
                                            makeLine(startLineDot, dot1, 1);
                                            makeLine(dot1, dot2, 1);
                                            makeLine(dot2, endLineDot, 1);
                                        }else if(startLineDot.y == endLineDot.y){
                                            let dot1={}, dot2={}, dot3={};
                                            if(startHorizontal && !endHorizontal && startLineDot.x < endLineDot.x){//增加三个辅助点，连4条线
                                                dot1={x:startLineDot.x, y:startLineDot.y-100}, 
                                                dot2={x:endLineDot.x-100, y:startLineDot.y-100}, 
                                                dot3={x:endLineDot.x-100, y:endLineDot.y};
                                            }else if(startHorizontal && !endHorizontal && startLineDot.x > endLineDot.x){
                                                dot1={x:startLineDot.x, y:startLineDot.y-100}, 
                                                dot2={x:endLineDot.x+100, y:startLineDot.y-100}, 
                                                dot3={x:endLineDot.x+100, y:endLineDot.y};
                                            }else if(!startHorizontal && endHorizontal && startLineDot.x < endLineDot.x){
                                                dot1={x:startLineDot.x+100, y:startLineDot.y}, 
                                                dot2={x:startLineDot.x+100, y:startLineDot.y-100}, 
                                                dot3={x:endLineDot.x, y:endLineDot.y-100};
                                            }else if(!startHorizontal && endHorizontal && startLineDot.x > endLineDot.x){
                                                dot1={x:startLineDot.x-100, y:startLineDot.y}, 
                                                dot2={x:startLineDot.x-100, y:startLineDot.y-100}, 
                                                dot3={x:endLineDot.x, y:endLineDot.y-100};
                                            }
                                            makeLine(startLineDot, dot1, 1);
                                            makeLine(dot1, dot2, 1);
                                            makeLine(dot2, dot3, 1);
                                            makeLine(dot3, endLineDot, 1);
                                        }
                                        //reset all
                                        startLinkLine = false;
                                        startLineDot = {};
                                        endLineDot = {};
                                        startLineObject = null;
                                        $.each(allLinks, function(lindex, link){
                                            if(($(link.children[0]).attr('stroke'))=='red')
                                                $(link.children[0]).attr('stroke','black');
                                        });                                            
                                    }else{//开始标记起始线
                                        $.each(allLinks, function(lindex, link){
                                            if(($(link.children[0]).attr('stroke'))=='red')
                                                $(link.children[0]).attr('stroke','black');
                                            if(($(link).attr('model-id')) == cellView.model.id){
                                                $(link.children[0]).attr('stroke','red');
                                                startLineObject = $(link.children[0]);
                                            }
                                        });
                                        
                                        startLine = lineDots;        //1.记录起始线的两个端点
                                        startLineDot = {x:x, y:y};   //2.标记起始点
                                        markCircle(x, y);            //3.画一个圆形标记
                                        startLinkLine = true;        //4.开始连线
                                    }                                    
                                }
                                //evt.originalEvent.defaultPrevented = true; //it fixed moving issue of the little rectangle, ignore the error in console                              
                            }
                        });

                        paper.on({'cell:pointermove': function (cellView,evt,x,y) {//拖动元素时触发（除图片外）
                            console.log('pointermove');    
                            
                        }});

                        paper.on({'element:pointerclick': function (evt, x, y) {//鼠标右击元素时
                                console.log('pointerclick')
                            }
                        });

                        paper.on({'element:mouseenter': function (evt, x, y) {//鼠标移入元素时触发text, rect, shapes, all are elements
                                console.log('mouseenter')
                            }
                        });

                        paper.on({'element:mouseout': function (evt, x, y) {//鼠标移出元素时触发text, rect, shapes, all are elements
                            console.log('mouseout')
                        }
                    });
                    
                        return paper;
                    },                    
                    _createPaperId: function(){
                        return "paper_" + ($('#paper').children().length + 1);
                    },                    
                    _getComponent: function(){
                        return this.components;
                    },
                    _makePath: function(startX, startY, endX, endY){

                    }
                }

                MinispicePaper.fn.paper.prototype = MinispicePaper.fn;

                return MinispicePaper;
            })();            

            factory.createMinispicePaper = function () {
                return MinispicePaper();
            };

            return factory;
        }]);