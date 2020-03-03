'use strict';

angular
        .module('paper.events', [])
        .factory('paperevents', ['$rootScope', 'component', 'drawline', 'file', function ($rootScope, component, drawline, file) {
                var factory = {};
                var PaperEvent = (function(){
                    var PaperEvent = function(){
                        return new PaperEvent.fn.tool();
                    };
                    
                    let draw = drawline.createDrawLineTool();

                    PaperEvent.fn = PaperEvent.prototype = {
                        constructor: PaperEvent,
                        
                        tool: function(){
                            this.blankPointerDown = function(evt, x, y){
                                $(".rightmenu").hide();
                                if(this._paintType().isStartDraw){
                                    switch (this._paintType().type) {
                                        case 'wire':
                                            draw.normalLink(x, y);
                                            break;
                                        case 'component':
                                            this._createComponent();
                                            break;
                                        default:
                                            this._createBasicComponent(this._paintType().type, x, y); 
                                            break;
                                    }
                                }
                            };

                            this.blankContextMenu = function(evt, x, y ){
                                $(".rightmenu").hide();
                                let menus = angular.fromJson(file.readallsync("json\\rightmenu\\rightmenu.json"));
                                $.each(menus, function(mindex, menu){
                                    if(menu.name == 'paper')
                                    $rootScope.minispice.rightMenus = menu.list;
                                });
                                
                                console.log($rootScope.minispice.rightMenus);
                                
                                // console.log('blankContextMenu');
                                // console.log(evt);
                                // console.log(x);
                                // console.log(y);
                            };

                            this.cellPointerDown = function(cellView, evt, x, y ){
                                $(".rightmenu").hide();
                                let guide = $rootScope.minispice.papers[0].guide,
                                    isguide = false,
                                    cellid = cellView.el.attributes[0].value;
                                if(guide.horizontalLine.id == cellid || guide.verticalLine.id == cellid)
                                    isguide = true;
                                
                                let type = cellView.model.attributes.type; 
                                if(type == 'standard.Circle' && this._paintType().type == 'wire'){                                    
                                    draw.normalLinkForNode(cellView,x,y);//连线状态下点击了元器件，则显示连线鼠标跟随                                    
                                }else if(type == 'standard.Circle' || (type == 'link' && !isguide)){
                                    draw.autoLink(type, cellView, x, y);
                                }
                            };
                            
                            this.cellPointerMove = function(cellView, evt, x, y ){//drag the label of component to move
                                if(cellView.model.attributes.type == 'standard.Image'){
                                    this._freshLinkNodesPostion(cellView);
                                }
                                //console.log(evt)
                            };

                            this.cellContextMenu = function(cellView, evt, x, y ){
                                $(".rightmenu").hide();
                                let menus = angular.fromJson(file.readallsync("json\\rightmenu\\rightmenu.json"));
                                $.each(menus, function(mindex, menu){
                                    if(menu.name == 'paper')
                                    $rootScope.minispice.rightMenus = menu.list;
                                });
                                if(cellView.model.attributes.type == 'link'){
                                    $rootScope.minispice.papers[0].rightclickLinkObject = cellView;
                                    $(".rightmenu").css("top", (y+130)+"px");
                                    $(".rightmenu").css("left", (x+215)+"px");
                                    $(".rightmenu").show();
                                }
                                // console.log('cellContextMenu');
                                // console.log(evt);
                                // console.log(x);
                                // console.log(y);
                            };

                            this.elementMouseEnter = function(cellView, evt){
                                // console.log('elementMouseEnter');
                                // console.log(evt);
                            };

                            this.elementMouseOut = function(cellView, evt){
                                // console.log('elementMouseOut');
                                // console.log(evt);
                            };
                        },

                        _createBasicComponent: function(type,x,y){//draw: capacitor, ground, resistor, inductor, diode
                            let newComponent = component.createComponent();
                            let cpt = newComponent.createShape(type, x, y);
                            this._getGraph().addCell(cpt.shape);                                                                                    
                            this._getGraph().addCells(cpt.linkNodes);
                            $.each(this._getPapers(),function(cindex,cobj){
                                if(cobj.isShow)
                                    cobj.components.push(newComponent);
                            });           
                        },

                        _createComponent: function(){//popwindow to choose a component to create

                        },

                        _freshLinkNodesPostion: function(cellView){
                            let ctype = this._getComponentType(cellView);                                
                            $.each(this._getPapers(),function(pindex,pobj){
                                if(pobj.isShow){
                                    $.each(pobj.components,function(cindex,cobj){
                                        if(cobj.shapeObj.cid == cellView.model.cid){
                                            
                                            let allLinkNodes = $(".joint-type-standard-circle")//界面上所有的小圆圈-连接点
                                            
                                            $.each(cobj.linkNodes, function(lindex, linkobj){
                                                let movedPosition = {x:0, y:0},
                                                    getPos = $("g[model-id='"+cobj.shapeObj.id+"']").attr('transform');//获取图形移动时的坐标
                                                    getPos = getPos.substr(0,getPos.length-1).split('(')[1].split(',');
                                                    movedPosition.x = Number(getPos[0]);
                                                    movedPosition.y = Number(getPos[1]);
                                                linkobj.attributes.position = movedPosition;//更新保存在component.linknodes对象里的坐标
                                                
                                                $.each(allLinkNodes,function(allindex, lnobj){  //fresh nodelink's position                                                      
                                                    if(($(lnobj).attr('model-id')) == linkobj.attributes.id){
                                                        let tempX = movedPosition.x+26,
                                                            tempY = movedPosition.y;                                                                
                                                        if(ctype == 'inductor')
                                                            tempX = movedPosition.x + 23;
                                                        if(ctype == 'diode')
                                                            tempX = movedPosition.x + 38;
                                                        if(lindex == 1)
                                                            tempY = movedPosition.y + 60;
                                                        if(ctype == 'ground')
                                                            tempY = movedPosition.y + 10;
                                                            $(lnobj).attr('transform','translate(' + tempX + ',' + tempY + ')');                                                                    
                                                    }
                                                });
                                            });
                                        }
                                    })
                                }
                            });
                        },

                        _getComponentType: function(cellView){
                            let str = cellView.model.attributes.attrs.image.xlinkHref;
                            return str.split('/')[2].split('_')[0];
                        },

                        _paintType: function(){
                            return $rootScope.minispice.paintSwitch;
                        },

                        _getPapers: function(){
                            return $rootScope.minispice.papers;
                        },

                        _getGraph: function(){
                            return $rootScope.minispice.graph;
                        }
    
                    };
    
                    PaperEvent.fn.tool.prototype = PaperEvent.fn;
    
                    return PaperEvent;
                })();

                factory.createPaperEventsHandle = function () {
                    return PaperEvent();
                };

                return factory;
            }]);