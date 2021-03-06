// 将数字转换为汉字
var parseNumber = function (num) {
  var str = ''
  const chars = '零一二三四五六七八九'
  const numStr = num + ''
  for (var i = 0; i< numStr.length; i ++) {
    const c = parseInt(numStr.charAt(i))
    str += chars[c]
  }
  return str
}

var parseColumn = function (content) {
  var c = content.replace(/(，|。|、|：|；|！|？|“|”)/g, ' $1')
  c = c.replace('《', ' ︽ ')
  c = c.replace('》', ' ︾ ')
  c = c.replace('（', ' ︵ ')
  c = c.replace('）', ' ︶ ')
  c = c.replace('“', ' ﹃ ')
  c = c.replace('”', ' ﹄ ')
  c = c.replace('‘', ' ﹁ ')
  c = c.replace('’', ' ﹂ ')
  return c
}

var splitToSentences = function (content) {
  const regex = new RegExp(/(。|；|？|！)/g)
  content = content.replace(regex, '$1 ').replace(/\n/g, '').trim()
  var array = content.split(' ')
  if (content.split(/？|！|；/).length > 0) {
    for (var i = 0; i < array.length; i++) {
      const item = array[i]
      if (/^[\u4e00-\u9fa5]+[？|！|；]/.test(item)) {
        if (i < array.length - 1) {
          array.splice(i, 1)
          array[i] = item + array[i]
        }
      }
    }
  }
  return array
}

var getTimeStr = function () {
  const str = '子丑寅卯辰巳午未申酉戌亥'
  const time = new Date()
  var h = time.getHours() + 1
  if (h == 24) {
    h = 0
  }
  const ch = str.charAt(Math.floor(h / 2))
  const m = time.getMinutes()
  var cm = Math.ceil(m / 15)
  if (h % 2 == 1) {
    cm += 4
  }
  return `${ch}时${parseNumber(cm)}刻`
}

var getObjectURL = function (file) {
  var url = null
  if (window.createObjectURL != undefined) {
    url = window.createObjectURL(file)
  } else if (window.URL != undefined) {
    url = window.URL.createObjectURL(file)
  } else if (window.webkitURL != undefined) {
    url = window.webkitURL.createObjectURL(file)
  }
  return url
}

var getFilePath = function (type, id) {
  var uploadPath = 'http://localhost:8080/api/' + type + '/'
  if (id) {
    uploadPath += id + '/'
  }
  return uploadPath
}

var timeToStr = function(s) {
  var t = ''
  if (s > -1) {
      var hour = Math.floor(s/3600)
      var min = Math.floor(s/60) % 60
      var sec = s % 60
      if(hour < 10) {
          t = '0'+ hour + ":"
      } else {
          t = hour + ":"
      }
      if(min < 10){t += "0"}
      t += min + ":"
      if(sec < 10){t += "0"}
      t += sec.toFixed(2)
  }
  return t
}
var secondToStr = function(s) {
  var t = ''
  if (s > -1) {
      var sec = s % 60
      if(sec < 10){t += "0"}
      t += sec.toFixed(2)
  }
  return t
}

export default {
  functions: {
    parseNumber, parseColumn, splitToSentences, getTimeStr, getObjectURL, getFilePath, secondToStr
  }
}
