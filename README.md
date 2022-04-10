## 鼠标拖拽文档

### 解决痛处

- 拖拽不一定是要对其跑动，对于不会canvas操作的，就可以使用这个创建
- 常见的限制区间
- 

### 实例化

> 目前还没有使用其他模式，先出第一版本

```html
<div class="box"></div>
<script src="./index.js"></script>
<script>
    let drag = new MouseDragDrop('.box')
    // 绑定事件
    drag.on('dragStart', function () {
        console.log('点击开始');
    })
    drag.on('dragging', function () {
        this.dom.style.left = this.left + 'px'
        this.dom.style.top = this.top + 'px'
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

<!-- useDrag | string | 默认值（left）左侧鼠标键。值为right，右鼠标键拖拽才有效。两个都有（both） -->


### 事件说明

属性 | 类型 | 说明
---|:--:|---
on | function | 绑定事件，必须传两个参数，（参数一：事件名。参数二：回调函数，函数内可以接受一个参数）。支持链式操作

思路来源：各个网站教程，尤其是element-ui里面的源码和https://github.com/Xing-hui/jsApply
