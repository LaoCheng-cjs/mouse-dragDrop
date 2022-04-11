""
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
        function down (event) {
            windowFlags = false;
            event.preventDefault();// 阻止默认事件
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
                if(['absolute','fixed','relative'].includes(mouseDragDrop.getStyle(_dom.parentNode).position)) {
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
            if (that.draggingStatus) {
                that.isClick = false;
                if(event.type === 'touchmove') {
                    event.clientY = event.touches[0].clientY;
                    event.clientX = event.touches[0].clientX;
                }
                // ---------------------------------更改------------
                let x = event.clientX + window.scrollX;
                let y = event.clientY + window.scrollY;
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
     */
    limitRange(dom, x, y) {
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
        return {
            _x: Math.min(Math.max(0, x),  dom._clientWidth - _dom.offsetWidth),
            _y: Math.min(Math.max(0, y), dom._clientHeight - _dom.offsetHeight)
        }
    }
    /**
     * 检测碰撞
    */
    checkCollision(dom, _x, _y) {
        let _dom = this.dom
        // console.log(x,y,_x,_y);
        // x坐标值的范围判断，y坐标值的范围判断
        const box2X = dom.offsetLeft
        const box2Y = dom.offsetTop
        var t1 = oDiv.offsetTop;
        var l1 = oDiv.offsetLeft;
        var r1 = oDiv.offsetLeft + oDiv.offsetWidth;
        var b1 = oDiv.offsetTop + oDiv.offsetHeight;
        var t2 = oDiv2.offsetTop;
        var l2 = oDiv2.offsetLeft;
        var r2 = oDiv2.offsetLeft + oDiv2.offsetWidth;
        var b2 = oDiv2.offsetTop + oDiv2.offsetHeight;
        return !(b1<t2 || l1>r2 || t1>b2 || r1<l2)
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
