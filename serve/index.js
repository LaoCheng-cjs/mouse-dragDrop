var express = require('express')
var app = express()
let path = require('path')
console.log(path.join(__dirname,'../html/'));
app.use(express.static(path.join(__dirname,'../html')))

app.listen(3006,function () {
    console.log('服务器启动成功： http://localhost:3006');
})