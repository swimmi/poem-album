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
    'images': poem.images,
    'musics': poem.musics,
    'reads': poem.reads,
    'writes': poem.writes,
    'locked': poem.locked
  }, (err, data) => {res.send(err?err:data)})
})
router.post('/poem/get', (req, res) => {
  models.Poem.findById(req.body.id, (err, data) => {res.send(err?err:data)})
})
router.get('/poem/all', (req, res) => {
  models.Poem.find({}).select('_id title').exec((err, data) => {res.send(err?err:data)})
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

router.get('/:dir/:id/:name', function(req, res) {
  var dir = req.params.dir
  var id = req.params.id
  var options = {
    root: __dirname + `/uploads/${dir}/${id}/`,
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
router.post('/upload/record', function(req, res) {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('None')
  }
  const id = req.body.id
  let files = req.files.file
  if (Array.isArray(files)) {
    files.forEach(file => {
      file.mv(`uploads/records/${id}/` + file.name)
    })
  } else {
    files.mv(`uploads/records/${id}/` + files.name)
  }
  res.send('File uploaded!')
})

module.exports = router