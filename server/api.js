var db = require('./db')
var express = require('express')
var router = express.Router()
var mongoose = require('mongoose')
var models = require('./models')
var fileUpload = require('express-fileupload')
router.use(fileUpload({createParentPath: true}))

// 連接數據庫
mongoose.connect(db.mongodb, {useNewUrlParser: true})

/**
 * POEM
 */
router.post('/poem/add', (req, res) => {
  var poem = new models.Poem(req.body.poem)
  poem.save((err, data) => {res.send(err?err:data)})
})
router.post('/poem/update', (req, res) => {
  var poem = new models.Poem(req.body.poem)
  models.Poem.updateOne({_id: poem._id}, {
    'shi': poem.shi,
    'type': poem.type,
    'title': poem.title,
    'prologue': poem.prologue,
    'period': poem.period,
    'author': poem.author,
    'author_desc': poem.author_desc,
    'content': poem.content,
    'desc': poem.desc,
    'annotation': poem.annotation,
    'image': poem.image,
    'music': poem.music,
    'reads': poem.reads,
    'writes': poem.writes,
    'locked': poem.locked
  }, (err, data) => {res.send(err?err:data)})
})
router.post('/poem/update/any', (req, res) => {
  const id = req.body.id
  const any = req.body.any
  models.Poem.updateOne({_id: id}, any, (err, data) => {res.send(err?err:data)})
})
router.post('/poem/get', (req, res) => {
  models.Poem.findById(req.body.id, (err, data) => {res.send(err?err:data)})
})
router.get('/poem/all', (req, res) => {
  models.Poem.find({}).select('_id title author author_desc').exec((err, data) => {res.send(err?err:data)})
})
router.get('/poem/last', (req, res) => {
  models.Poem.findOne({}).select('_id title').sort({'createdAt': -1}).exec((err, data) => {res.send(err?err:data)})
})
router.post('/poem/author', (req, res) => {
  const author = req.body.author
  models.Poem.find({'author': author}).select('_id title').sort({'period': 1, 'title': 1}).exec((err, data) => {res.send(err?err:data)})
})
router.get('/poem/catalog', (req, res) => {
  models.Poem.
  aggregate([
    {$match: {'author': '佚名'}},
    {$project: {id: '$_id', _id: 0, title: 1}},
    {$sort: {'period': 1, 'title': 1}}
  ]).
  exec((err, sub_data) => {
    const anonymity = {
      '_id': '佚名',
      'period': null,
      "poems": sub_data,
      "count": sub_data.length
    }
    models.Poem.
    aggregate([
      {$match: {'author': {$not: /佚名/}}},
      {$group: {_id: '$author', period: {$first: '$period'}, poems: {$push: {'id': '$_id', 'title': '$title'}}, count: {$sum: 1}}},
      {$sort: {count: -1, 'author': -1, 'author_desc': -1, 'type': 1, 'title': 1}}
    ]).
    exec((err, data) => {
      data.push(anonymity)
      res.send(err?err:data)
    })
  })
})
router.post('/poem/search', (req, res) => {
  const key = req.body.keyword
  const reg = new RegExp(key)
  const page = req.body.page || 0
  const limit = req.body.limit || 10
  models.Poem.
    find({$or: [{'title': {$regex: reg}}, {'content': {$regex: reg}}]}).
    sort({'lastViewAt': -1}).
    skip(page * limit).
    limit(limit).
    exec((err, data) => {res.send(err?err:data)})
})


// 获取服务器文件
router.get('/:type/:id?/:name', function(req, res) {
  var type = req.params.type
  var id = req.params.id
  var options = {
    root: __dirname + `/uploads/${type}/` + (id ? `${id}/` : ''),
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  }
  var name = req.params.name
  res.sendFile(name, options, function (err) {
    if (err) {
      console.log(err)
    }
  })
})
// 上传文件到服务器
router.post('/upload/', function(req, res) {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('None')
  }
  const type = req.body.type
  const id = req.body.id
  var dir = `${type}`
  if (id) {
    dir += `/${id}`
  }
  let files = req.files.file
  if (Array.isArray(files)) {
    files.forEach(file => {
      file.mv(`uploads/${dir}/` + file.name)
    })
  } else {
    files.mv(`uploads/${dir}/` + files.name)
  }
  res.send('File uploaded!')
})

module.exports = router