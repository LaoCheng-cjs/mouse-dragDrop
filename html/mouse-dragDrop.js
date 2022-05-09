"use strict";
/*
 * version 1.0
 * 2022-04-09
 * https://www.lolku.cn/ui/
 */

class MouseDragDrop {
    constructor (domOrStr) {
        /**
         * 初始化绑定dom
        */
        if(domOrStr === null || typeof domOrStr === 'undefined') {
            console.error('[MouseDragDrop]：没有绑定的dom')
            return;
        }
        let _dom = null
        if(typeof domOrStr === 'string') {// 是字符串
            _dom = document.querySelector(domOrStr)
            if(!_dom) {
                console.error('[MouseDragDrop]：获取dom失败，' + domOrStr)
                return;
            }
        }else if(!MouseDragDrop.isDOM(domOrStr)) { // 是dom
            console.error('[MouseDragDrop]：这个不是dom啊，'+domOrStr)
            return;
        }else {
            _dom = domOrStr
        }
        this.dom = _dom
        const that = this
        /**
         * 添加css样式，解决iframe定位后，拖拽在上面事件还在触发
        */
        let bodyDom = document.querySelector('body')
        if(!document.querySelector('#MouseDragDropCss')) {
            let styles = document.createElement('style')
            styles.id = 'MouseDragDropCss'
            styles.innerText = `.MouseDragDropCss-iframe iframe { pointer-events: none !important; }`
            document.querySelector('head').append(styles)
        }
        /**
         * 绑定dom事件
        */
        _dom.addEventListener('touchstart', down)
        _dom.addEventListener('mousedown',down)
        var windowFlags = false;
        let domX = null,
            domY = null,
            deviationX = 0,
            deviationY = 0;
        let parentPosition = null;
        function down (event) {
            windowFlags = false;
            event.preventDefault();// 阻止默认事件
            event.stopPropagation()
            if (event.type === 'touchstart') {
                event.clientY = event.touches[0].clientY;
                event.clientX = event.touches[0].clientX;
            }
            // 获取基本信息
            that.draggingStatus = true; // 按下了
            that.isClick = true; // 在点击状态
            that.startX = event.clientX; // 获取浏览器左边缘鼠标位置
            that.startY = event.clientY; // 获取浏览器右边缘鼠标位置
            domX =  that.startX - _dom.getBoundingClientRect().left; // dom的左边边缘与按下去鼠标的位置
            domY =  that.startY - _dom.getBoundingClientRect().top; // dom的上边边缘与按下去鼠标的位置
            if(!that.openParent) {
                // 进行定位偏差
                parentPosition = MouseDragDrop.getStyle(_dom.parentNode).position
                if(['absolute','fixed','relative','sticky'].includes(parentPosition)) {
                    deviationX = _dom.parentNode.offsetLeft
                    deviationY = _dom.parentNode.offsetTop
                }
            }
            bodyDom.classList.add('MouseDragDropCss-iframe')
            that.#checkEvent('dragStart',domX, domY)
            // 并且添加事件
            window.addEventListener('mousemove', onDragging); // 监听当前移动
            window.addEventListener('touchmove', onDragging); // 监听当前移动
            window.addEventListener('mouseup', onDragEnd); // 添加抬起事件
            window.addEventListener('touchend', onDragEnd);// 添加抬起事件
            window.addEventListener('contextmenu', onDragEnd); // 右击事件
            if (self != top) {
                let subWin = window;
                // 解决嵌入到iframe中，滑动的太快，出去了，没有执行 dragEnd 回调
                window.parent.addEventListener('mousemove', function (ev) {
                    if (windowFlags) {
                        return;
                    }
                    windowFlags = true;
                    that.#checkEvent('dragEnd')
                    subWin.removeEventListener('mousemove', onDragging);
                    subWin.removeEventListener('touchmove', onDragging);
                    subWin.removeEventListener('mouseup', onDragEnd);
                    subWin.removeEventListener('touchend', onDragEnd);
                    subWin.removeEventListener('contextmenu', onDragEnd);
                    ev.preventDefault();
                }, false)
            }
        }
        // 监听拖着
        function onDragging (event) {
            event.preventDefault()
            event.stopPropagation()
            if (that.draggingStatus) {
                that.isClick = false;
                if(event.type === 'touchmove') {
                    event.clientY = event.touches[0].clientY;
                    event.clientX = event.touches[0].clientX;
                }
                // ---------------------------------更改------------
                let x = event.clientX + (parentPosition === 'fixed' ? 0: window.scrollX);
                let y = event.clientY + (parentPosition === 'fixed' ? 0: window.scrollY);
                that.#checkEvent('dragging',x - domX - deviationX, y - domY - deviationY)
                that.x = x
                that.y = y
            }
        }
        // 监听拖拽放开
        function onDragEnd (e) {
            if (that.draggingStatus) {
                /*
                * 防止在 mouseup 后立即触发 click，导致滑块有几率产生一小段位移
                * 不使用 preventDefault 是因为 mouseup 和 click 没有注册在同一个 DOM 上
                */
                setTimeout(function (){
                    that.draggingStatus = false;
                    bodyDom.classList.remove('MouseDragDropCss-iframe')
                    that.#checkEvent('dragEnd')
                }, 0);
                window.removeEventListener('mousemove', onDragging);
                window.removeEventListener('touchmove', onDragging);
                window.removeEventListener('mouseup', onDragEnd);
                window.removeEventListener('touchend', onDragEnd);
                window.removeEventListener('contextmenu', onDragEnd);
            }
        }
        // 销毁
        this.destroy = function () {
            _dom.removeEventListener('mousedown',down)
            _dom.removeEventListener('touchstart',down)
            deviationX = null
            deviationY = null
            domX = null
            domY = null
            deviationX = null
            deviationY = null
            _dom.MouseDragDrop = null;
        }
        _dom.MouseDragDrop = this;
    }
    on(str, cb) {
        if(!(cb && typeof cb === 'function')) {
            console.warn('[MouseDragDrop]：on函数中没有给函数')
            return;
        }
        // 绑定事件
        if(['dragStart','dragging','dragEnd'].includes(str)) {
            this[str] = cb;
        }
        return this;
    }
    /**
     * 限制范围
     * 1、情况一：父级（定位）的父级（定位）的父级（定位）以此类推
     * 2、情况二：没有定位
     * 3、情况三：当前定位区域
     * 4、情况四：正好是自己区域
     * 5、情况4和情况1联合在一起
     * 6、其他dom的话
     * 原理： 
     */
    limitRange(dom, x, y,minLeft,minTop) {
        let _dom = this.dom
        if(Object.prototype.toString.call(dom) === '[object Window]') {
            dom._clientWidth = dom.innerWidth
            dom._clientHeight = dom.innerHeight
        }else {
            if(!MouseDragDrop.isDOM(dom)) { // 是dom
                console.error('[MouseDragDrop]：limitRange方法，参数一不是dom也不是window')
                return;
            }
            dom._clientWidth = dom.clientWidth
            dom._clientHeight = dom.clientHeight
        }
        // 这里是属于反过来嵌入的问题
        let diffX = dom._clientWidth - _dom.offsetWidth
        let diffY = dom._clientHeight - _dom.offsetHeight
        return {
            _x: Math.min(Math.max(minLeft?minLeft:0, x), diffX >= 0 ? diffX : (_dom.offsetWidth - dom.offsetLeft)),
            _y: Math.min(Math.max(minTop?minTop:0, y), diffY >= 0 ? diffY : (_dom.offsetHeight - dom.offsetTop))
        }
    }
    /**
     * 检测碰撞很难做到定位还有滚动产生的偏差。只能使用h5的拖拽目标了
    */
    checkCollision(dom, _x, _y) {
        let op2 = dom,
            op = this.dom;
        var t1 = op.offsetTop;
        var l1 = op.offsetLeft;
        var r1 = op.offsetLeft + op.offsetWidth;
        var b1 = op.offsetTop + op.offsetHeight;
        var t2 = op2.offsetTop;
        var l2 = op2.offsetLeft;
        var r2 = op2.offsetLeft + op2.offsetWidth;
        var b2 = op2.offsetTop + op2.offsetHeight;
        return b1<t2 || l1>r2 || t1>b2 || r1<l2
    }
    // 递归在哪个
    // getPositions(dom, x, y) {
    //     const _parentNode = dom.parentNode
    //     if(_parentNode.tagName == 'BODY') { // 到了body了
    //         return {
    //             _x: x,
    //             _y: y
    //         }
    //     }else {
    //         return this.getPositions(_parentNode,x + _parentNode.offsetLeft, y + _parentNode.offsetTop)
    //     }
    // }
    // 拖拽基于谁来定位的
    getPosition(dom, x, y, _i) {
        if(!MouseDragDrop.isDOM(dom)) { // 是dom
            console.error('[MouseDragDrop]：getPosition方法，参数一不是dom')
            return;
        }
        return {
            _x: x - dom.offsetLeft,
            _y: y - dom.offsetTop
        }
    }
    dom = null
    startX = null // 开始x轴
    startY = null
    #domX = null // 私有
    #domY = null // 私有
    #useDrag = 'left' // 默认使用左
    left = null
    top = null
    x = 0
    y = 0
    #openParent = false
    get openParent() {
        return this.#openParent
    }
    set openParent(_boolean) {
        if(Object.prototype.toString.call(_boolean) === '[object Boolean]') {
            this.#openParent = _boolean
        }
    }
    draggingStatus = false
    get useDrag() {
        return this.#useDrag;
    }
    set useDrag(str) {
        if(typeof str === 'string') {
            this.#useDrag = str
        }
    }
    // 检查事件是否存在
    #checkEvent(str,x,y) {
        if(this[str]) {
            this[str](x,y)
        }
    }
    /**
     * 判断是否是dom
     * @param {Element} dom对象
     * @returns {boolean} 返回布尔值
     * */
    static isDOM = ( typeof HTMLElement === 'object' ) ? function(obj){
        return obj instanceof HTMLElement;
        } : function(obj){
            return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
        }
    /**
     *  获取样式
     * @param {Element, Array}
     * @returns {JSON}
    */
    static getStyle = function (obj,attr){
        return obj.currentStyle?obj.currentStyle:getComputedStyle(obj);
    }
    /**
     * 获取两点之间距离
     * @param {x1} number 第一个点x轴
     * @param {y1} number 第一个点y轴
     * @param {x2} number 第二个点x轴
     * @param {y2} number 第二个点y轴
     * @return {number} 两点之间的线距离
    */
    static getCalcLine(x1,y1,x2,y2) {
        // 计算出两个点之间的距离
        let line = Math.sqrt(
          Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)
        );
        return line;
    }
    /**
     * 获得两个点坐标连线，与y轴正半轴之间的夹角
     * @param {x1} number 第一个点x轴
     * @param {y1} number 第一个点y轴
     * @param {x2} number 第二个点x轴
     * @param {y2} number 第二个点y轴
     * @return {number} 两点之间的夹角
    */
    static getAngle(x1, y1, x2, y2) {
        // 获得人物中心和鼠标坐标连线，与y轴正半轴之间的夹角
        var x = x1 - x2;
        var y = y1 - y2;
        var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        var cos = y / z;
        var radina = Math.acos(cos); // 用反三角函数求弧度
        var angle = 180 / (Math.PI / radina); // 将弧度转换成角度
        if (x2 > x1 && y2 === y1) {
            // 在x轴正方向上
            angle = 0;
        }
        if (x2 > x1 && y2 < y1) {
            // 在第一象限;
            angle = angle - 90;
        }
        if (x2 === x1 && y1 > y2) {
            // 在y轴正方向上
            angle = -90;
        }
        if (x2 < x1 && y2 < y1) {
            // 在第二象限
            angle = 270 - angle;
        }
        if (x2 < x1 && y2 === y1) {
            // 在x轴负方向
            angle = 180;
        }
        if (x2 < x1 && y2 > y1) {
            // 在第三象限
            angle = 270 - angle;
        }
        if (x2 === x1 && y2 > y1) {
            // 在y轴负方向上
            angle = 90;
        }
        if (x2 > x1 && y2 > y1) {
            // 在四象限
            angle = angle - 90;
        }
        return angle;
    }
}
if (typeof define === 'function') {
    // AMD环境或CMD环境
    define(MouseDragDrop);
} else if (typeof module !== 'undefined' && module.exports) {
    // 定义为普通Node模块
    module.exports = MouseDragDrop;
} else {
// 将模块的执行结果挂在window变量中，在浏览器中this指向window对象
    this['mouseDragDrop'] = MouseDragDrop;
}