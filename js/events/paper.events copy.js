'use strict';

angular
        .module('paper.events', [])
        .factory('paperevents', ['$rootScope', 'component', 'drawline', function ($rootScope, component, drawline) {
                var factory = {};
                var PaperEvent = (function(){
                    var PaperEvent = function(){
                        return new PaperEvent.fn.tool();
                    };
                    let pswitch = $rootScope.minispice.paintSwitch;
                    //let draw = drawline.createDrawLineTool();

                    PaperEvent.fn = PaperEvent.prototype = {
                        constructor: PaperEvent,
                        
                        tool: function(){
                            this.blankPointerDown = function(evt, x, y){                                
                                if(pswitch.isStartDraw){
                                    switch (pswitch.type) {
                                        case 'wire':
                                            //draw.normalLink(x, y);
                                            break;
                                        case 'component':
                                            this._createComponent();
                                            break;
                                        default:
                                            this._createBasicComponent(pswitch.type,x,y); 
                                            break;
                                    }
                                }
                            };

                            this.blankContextMenu = function(evt, x, y ){
                                // console.log('blankContextMenu');
                                // console.log(evt);
                                // console.log(x);
                                // console.log(y);
                            };

                            this.cellPointerDown = function(cellView, evt, x, y ){
                                if(cellView.model.attributes.type == 'standard.Circle'){//点击元器件的连接点
                                    if(pswitch.type == 'wire'){//连线状态下点击了元器件，则显示连线鼠标跟随
                                        //draw.normalLinkForNode(cellView,x,y);
                                    }else{//点击连接点自动连线
                                        //draw.normalLinkForNode(cellView,x,y);
                                    }
                                }
                            };
                            
                            this.cellPointerMove = function(cellView, evt, x, y ){//drag the label of component to move
                                if(cellView.model.attributes.type == 'standard.Image'){
                                    this._freshLinkNodesPostion(cellView);
                                }
                                //console.log(evt)
                            };

                            this.cellContextMenu = function(cellView, evt, x, y ){
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
                            let minispice = $rootScope.minispice;
                            minispice.graph.addCell(cpt.shape);                                                                                    
                            minispice.graph.addCells(cpt.linkNodes);
                            $.each(minispice.papers,function(cindex,cobj){
                                if(cobj.isShow)
                                    cobj.components.push(newComponent);
                            });           
                        },

                        _createComponent: function(){//popwindow to choose a component to create

                        },

                        _freshLinkNodesPostion: function(cellView){
                            let ctype = this._getComponentType(cellView);                                
                            $.each($rootScope.minispice.papers,function(pindex,pobj){
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