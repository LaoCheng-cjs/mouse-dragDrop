var express = require('express')
var app = express()
let path = require('path')
app.use(express.static(path.join(__dirname,'../html')))

app.listen(3008,function () {
    console.log('服务器启动成功： http://localhost:3008');
})