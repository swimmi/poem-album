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

var splitToColumns = function (content, size) {
  var columns = []
  var text = content.replace(/\n/g, '＠＠')
  for (var i = 0; i < text.length; i+= size) {
    var column = parseColumn(text.substr(i, size))
    if (column.charAt(0) == '＠') {
      column = column.substring(2)
    }
    columns.push(column)
  }
  return columns
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

export default {
  functions: {
    parseNumber, parseColumn, splitToColumns, splitToSentences, getTimeStr, getObjectURL
  }
}
