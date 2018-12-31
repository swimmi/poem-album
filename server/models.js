var mongoose = require('mongoose')

const Schema = mongoose.Schema

// Poem
const poemSchema = Schema({
  shi: Boolean,                               // 是诗
  type: String,                               // 类型
  title: String,                              // 标题
  prologue: String,                           // 序言
  period: Number,                             // 时代
  author: String,                             // 作者
  author_desc: String,                        // 作者介绍
  author_year: {                              // 作者生卒年
    birth: Number,
    death: Number
  },
  content: String,                            // 内容
  desc: String,                               // 介绍
  annotation: String,                         // 注解
  image: String,
  music: String,
  reads: [
    {
      name: String,
      duration: Number
    }
  ],
  writes: [],
  notes: [],                                  // 笔记
  locked: { type: Boolean, default: false },  // 是否锁定
  number: {
    time: { type: Number, default: 0 },       // 阅读次数
    duration: { type: Number, default: 0 }    // 阅读时长，分钟
  },
  status: {
    understand: { type: Boolean, default: false },    // 已理解
    recite: { type: Boolean, default: false },        // 可背诵
    favorite: { type: Boolean, default: false },      // 是喜欢
    reading: { type: Boolean, default: false }           // 朗读中
  },
  hidden: { type: Boolean, default: false },
  lastViewAt: Date                            // 上次浏览
}, {collection: 'poems', timestamps: true})

const models = {
  Poem: mongoose.model('Poem', poemSchema)
}

module.exports = models