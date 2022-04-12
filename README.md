
**Black Lives Matter.**
**Support the Equal Justice Initiative.**

正在测试阶段，试用即可
### 实例化

> 目前还没有使用其他模式，先出第一版本

```html
<div class="box"></div>
<script src="./mouse-dragDrop.js"></script>
<script>
    let drag = new MouseDragDrop('.box')
    // 绑定事件
    drag.on('dragStart', function () {
        console.log('点击开始');
    })
    drag.on('dragging', function (x,y) {
        this.dom.style.left = x + 'px'
        this.dom.style.top = y + 'px'
        console.log('拖拽中');
    })
    drag.on('dragEnd', function () {
        console.log('拖拽结束');
    })
</script>
```


### 属性说明

属性 | 类型 | 说明
---|:--:|---
openParent | 布尔值 | 是否获取父级定位偏差值，默认为false，自动将上一级的定位，如果没有的定位则不自动获取。可以使用getPosition设置偏差值


<!-- this.getPosition(this.dom.parentNode,x,y) -->
<!-- useDrag | string | 默认值（left）左侧鼠标键。值为right，右鼠标键拖拽才有效。两个都有（both） -->


### 事件说明

属性 | 类型 | 说明
---|:--:|---
on | function | 绑定事件，必须传两个参数，（参数一：事件名。参数二：回调函数，函数内可以接受一个参数）。支持链式操作
getPosition | function | 此方法需要设置 openParent = true ，因为定位问题，会有很多偏差值，如果嵌套多，可以使用这个方法进行计算出来



#### on事件有哪些？

**dragStart 按下**

**dragging 拖拽中**

**dragEnd 拖拽结束**

#### getPosition 手动设置偏差

> 在test8.html中例子

```html
<div class="box-wrap">
    <div style="margin-top: 222px">
        <div class="box"></div>
    </div>
</div>

<script src="./mouse-dragDrop.js"></script>
<script>
    let drag = new MouseDragDrop('.box')
    let boxWrap = document.querySelector('.box-wrap')
    // 禁止当前拖拽父级dom定位产生的偏差
    drag.openParent = true
    // 绑定事件
    drag.on('dragStart', function () {
        console.log('点击开始');
    })
    drag.on('dragging', function (x,y) {
        let { _x, _y} = this.getPosition(boxWrap,x,y)
        this.dom.style.left = _x + 'px'
        this.dom.style.top = _y + 'px'
    })
    drag.on('dragEnd', function () {
        console.log('拖拽结束');
    })
</script>
```

####

> 思路来源：各个网站教程，尤其是element-ui里面的源码和https://github.com/Xing-hui/jsApply
