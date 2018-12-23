// node後端服務器
const api = require('./api')
const bodyParser = require('body-parser')
const express = require('express')
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

// 後端api路由
app.use('/api', api)

// 監聽端口
app.listen(3000)
console.log('路漫漫其修远兮，吾将上下而求索···')
