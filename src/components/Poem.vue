<template>
  <div v-if="loading"></div>
  <div v-else class="poem">
    <div class="poem-media">
      <div v-if="loadingImage"></div>
      <div v-else class="poem-image float-start" :style="{backgroundImage: 'url(' + poem.image + '?' + Date.now() + ')'}">
        <div class="poem-image-btn">
          <span :class="{'gray-filter': !poem.music}" @click="chooseMusic"><img src="~@/assets/images/music.png" /></span>
          <span :class="{'gray-filter': poem.image.indexOf('default') != -1}" @click="chooseImage"><img src="~@/assets/images/image.png" /></span>
        </div>
      </div>
    </div>
    <div class="poem-text">
      <div class="poem-header">
        <div class="poem-title">
          <marquee v-if="poem.title.length > 12" class="title title-long" direction="up" scrollamount="10">{{ poem.title }}</marquee>
          <span v-else class="title">{{ poem.title }}</span>
          <div class="title-btns">
            <span class="edit-btn" @click="editPoem"><img src="~@/assets/images/edit.png"/></span>
          </div>
        </div>
        <div class="poem-author">
          <span class="name">{{ poem.author }}</span>
        </div>
        <div class="poem-reads">
          <span class="read-btn"
            :class="{'gray-filter': !poem.status.reading, 'animated pulse': poem.status.reading}"
            @click="addToReadList"
            v-show="poem.reads.length > 0"><img src="~@/assets/images/list_in.png" /></span>
          <span class="record-btn" @click="recordPoem"><img src="~@/assets/images/mic.png" /></span>
        </div>
      </div>
      <div class="poem-main">
        <div class="poem-content">
          <transition enter-active-class="fadeIn" leave-active-class="fadeOut">
            <div v-show="tip.show"
              class="anno-tip animated"
              :style="{top: tip.position.top, right: tip.position.right}"
              @mouseenter="stopTipHide"
              @mouseleave="hideTip">
              <marquee v-if="annoText.length > 30" class="anno-tip-long" direction="up" scrollamount="10">{{ annoText }}</marquee>
              <span v-else>{{ annoText }}</span>
            </div>
          </transition>
          <div class="anno-container">
            <span class="column-anno"
              v-for="(anno, index) in pageAnnos"
              :style="{top: anno.index * fontHeight + 'px', right: (anno.column * columnWidth + 12) + 'px',}"
              @mouseenter.stop="showTip(anno.num)"
              @mouseleave.stop="hideTip">{{ $util.parseNumber(anno.num) }}</span>
          </div>
          <div class="column" v-for="(column, index) in pages[pageIndex]" :key="index">
            <span class="column-text" :class="{'prologue-text': isPrologue(index)}">{{ column }}</span>
          </div>
        </div>
        <div class="page-btn" v-show="pages.length > 1">
          <span class="left-btn" :class="{'invisible': pageIndex == pages.length - 1}" @click="pageIndex ++"><img src="~@/assets/images/left.png" /></span>
          <span class="page-num">{{ $util.parseNumber(pageIndex + 1) }}</span>
          <span class="right-btn" :class="{'invisible': pageIndex == 0}" @click="pageIndex --"><img src="~@/assets/images/right.png" /></span>
        </div>
      </div>
      <div class="poem-footer">
        <div class="poem-desc">
          <span>{{ poem.desc }}</span>
        </div>
        <div class="divider"></div>
        <div class="poem-author-desc">
          <span>{{ poem.author_desc }}</span>
        </div>
      </div>
      <div class="poem-stamp-container" v-show="pageIndex == pages.length - 1">
        <div
          class="poem-stamp poem-author-stamp animated pulse">
          <span>{{ stampText(poem.author) }}</span>
        </div>
        <div
          class="poem-stamp poem-understand-stamp"
          :class="{'stamp-off': !poem.status.understand, 'animated pulse': poem.status.understand}"
          @click="understandPoem">
          <span>{{ $str.ed + $str.understand }}</span>
        </div>
        <div
          v-show="poem.status.understand"
          class="poem-stamp poem-recite-stamp"
          :class="{'stamp-off': !poem.status.recite, 'animated pulse': poem.status.recite}"
          @click="recitePoem">
          <span>{{ stampText($str.ed + $str.recite) }}</span>
        </div>
        <div
          v-show="poem.status.recite"
          class="poem-stamp poem-favorite-stamp"
          :class="{'stamp-off': !poem.status.favorite, 'animated pulse': poem.status.favorite}"
          @click="favoritePoem">
          <span>{{ $str.favorite }}</span>
        </div>
      </div>
    </div>
    <div class="poem-page">
      <span>{{ $util.parseNumber(this.poem.page - 3) }}</span>
    </div>
  </div>
</template>
<script>
import { getPoem } from '@/api/poem'
export default {
  props: {
    poem: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      fontHeight: 18 * 1.2,
      columnWidth: 34,
      pages: [],
      pageIndex: 0,
      maxColumn: 8,
      prologueColumns: [],
      annoList: [],
      annoText: '',
      // 注释提示
      tip: {
        show: false,
        position: [0, 0],
        timeout: null
      },
      reads: {
        started: false,
        playing: false,
        index: -1
      },
      loading: true,
      loadingImage: false
    }
  },
  computed: {
    isPrologue () {
      return function (index) {
        return this.prologueColumns.indexOf(this.pageIndex * this.maxColumn + index) != -1
      }
    },
    pageAnnos () {
      var annos = []
      this.annoList.forEach(anno => {
        if (anno.page == this.pageIndex) {
          annos.push(anno)
        }
      })
      return annos
    },
    poemAnnos () {
      if (this.poem.annotation) {
        return this.poem.annotation.split(/\n/)
      } else {
        return []
      }
    }
  },
  mounted () {
    this.$bus.on('resetPoem', this.resetPoem)
    this.$bus.on('reloadImage', this.reloadImage)
    this.init()
  },
  methods: {
    init() {
      if (this.poem) {
        this.loadPoem()
      }
    },
    loadPoem () {
      this.loadColumns()
      this.loading = false
    },
    reloadImage (id) {
      if (this.poem.id == id) {
        this.loadingImage = true
        setTimeout(() => {
          this.loadingImage = false
        }, 300)
      }
    },
    loadColumns () {
      this.prologueColumns = []
      this.pages = []
      var page = []
      this.annoList = []
      // 添加段首标记
      var content = this.poem.content
      var hasPrologue = false
      if (this.poem.prologue) {
        hasPrologue = true
        content = this.poem.prologue.trim() + '@\n@\n' + content.trim()
      }
      var startPrologue = hasPrologue
      var ps = content.split(/\n/g)
      var size = 22
      if (this.poem.shi) {
        size = 32
      }
      // 调整列数
      // 获取注释位置
      var pIndex = 0      // 页索引
      var cIndex = 0      // 列索引
      var num = 0         // 注释数
      for (var p = 0; p < ps.length; p ++) {
        var text = ps[p].trim()
        for (var i = 0; i < text.length; i += size) {
          var column = ''   // 当前列
          var n = 0         // 当前列注释数量
          var m = -1        // 当前列注释位置
          // 处理注释
          do {
            if (m != -1) {
              num ++
              const anno = {
                page: pIndex,
                column: cIndex,
                index: m - n,
                num: num
              }
              this.annoList.push(anno)
            }
            column = text.substr(i, size + n)
            m = column.indexOf('#', m + 1)
            n ++
          } while (m != -1)
          i += n - 1
          // 处理序言
          if (hasPrologue) {
            if (startPrologue) {
              this.prologueColumns.push(pIndex * this.maxColumn + cIndex)
            }
            if (column.endsWith('@')) {
              startPrologue = false
            }
          }
          // 去除注释标记、序言标记
          column = this.$util.parseColumn(column).replace(/#/g, '').replace(/@/g, '')
          if (column == '') {
            this.prologueColumns.push(pIndex * this.maxColumn + cIndex)
          }
          page.push(column)
          // 因序言字小距窄，列数酌情添加一二
          var delta = 0
          if (pIndex == 0) {
            delta = Math.floor(this.prologueColumns.length / 3)
          }
          if (page.length == this.maxColumn + delta) {
            this.pages.push(page)
            pIndex ++
            cIndex = -1
            page = []
          }
          cIndex ++
        }
      }
      if (page.length > 0) {
        this.pages.push(page)
      }
    },
    // 阻止注释自动隐藏
    stopTipHide () {
      clearTimeout(this.tip.timeout)
    },
    // 显示注释
    showTip (num) {
      this.stopTipHide()
      const anno = this.annoList[num - 1]
      if (anno) {
        const tip = this.poemAnnos[num - 1]
        if (tip) {
          this.annoText = this.$util.parseColumn(tip)
          this.tip.position.top = ((anno.index - 1) * this.fontHeight) + 'px'
          this.tip.position.right = ((anno.column * this.columnWidth) + 32) + 'px'
          this.tip.show = true
        }
      }
    },
    // 隐藏注释
    hideTip () {
      this.tip.timeout = setTimeout(() => { this.tip.show = false }, 1000)
    },
    /**
     * 印章相关
     */
    // 转成印章文字
    stampText (val) {
      if (val.length == 3) {
        val = val + '作'
      }
      if (val.length == 2) {
        val = val + '之作'
      }
      const str = val.charAt(2) + val.charAt(0) + val.charAt(3) + val.charAt(1)
      return str
    },
    favoritePoem () {

    },
    recitePoem () {

    },
    understandPoem () {

    },
    // 编辑诗词
    editPoem () {
      this.$bus.emit('editPoem', this.poem, this.poem.page)
    },
    chooseMusic () {
      this.$bus.emit('chooseMusic')
    },
    chooseImage () {
      this.$bus.emit('chooseImage')
    },
    recordPoem () {
      this.$bus.emit('recordPoem')
      this.$bus.emit('toggleMusic')
      this.$bus.emit('toggleReads')
    },
    addToReadList () {
      this.$bus.emit('addReadPoem', this.poem)
    }
  }
}
</script>
<style lang="less" scoped>
.poem {
  display: flex;
  width: calc(100% - @page-pad * 2);
  height: calc(100% - @page-pad * 2);
  margin: @page-pad;
  z-index: 9;
  .poem-media {
    position: relative;
    flex: 1;
    display: flex;
    border-right: 1px @border-color solid;
    .poem-image {
      position: relative;
      width: 300px;
      border-radius: @base-radius;
      .poem-image-btn {
        display: flex;
        flex-direction: column;
        position: absolute;
        bottom: 0px;
        right: 0px;
        z-index: 9;
        span {
          .image-btn();
        }
      }
    }
    .poem-float-bg {
      .float-bg(60s);
    }
  }
  .poem-text {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: row-reverse;
    .poem-header {
      position: relative;
      display: flex;
      height: 100%;
      flex-direction: row-reverse;
      align-self: flex-start;
      .poem-title {
        .title {
          .v-title(20px);
        }
        .title-long {
          height: 350px;
        }
        .title-btns {
          span {
            position: absolute;
            right: -52px;
            .image-btn();
          }
          .edit-btn {
            top: 45px;
          }
          .note-btn {
            top: 100px;
          }
          .write-btn {
            top: 155px;
          }
        }
      }
      .poem-author {
        margin-top: 2px;
        margin: 24px;
        color: @text-vice;
        .name {
          .v-text(16px);
        }
      }
      .poem-reads {
        position: absolute;
        bottom: 330px;
        right: -52px;
        display: flex;
        .read-btn {
          .image-btn();
        }
        .record-btn {
          .image-btn();
        }
      }
    }
    .poem-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      .poem-content {
        position: relative;
        display: flex;
        flex-direction: row-reverse;
        color: @text-black;
        .column {
          position: relative;
          .column-text {
            margin-left: 16px;
            .v-text(18px);
          }
          .prologue-text {
            margin-left: 6px;
            font-size: 16px;
            color: @text-vice;
          }
        }
        .anno-container {
          position: absolute;
          z-index: 2;
          .column-anno {
            position: absolute;
            display: block;
            width: 16px;
            height: 16px;
            padding: 4px;
            font-size: 16px;
            color: @text-red;
            border: 1px solid @text-red;
            border-radius: 50%;
            transform: scale(0.5, 0.5)
          }
        }
        .anno-tip {
          position: absolute;
          background: fadeIn(@accent-color, 10%);
          text-align: center;
          padding: 8px 4px;
          height: auto;
          border-radius: @base-radius;
          color: @text-vice;
          z-index: 1;
          .anno-tip-long {
            height: 400px;
            .v-text(14px);
          }
          span {
            .v-text(14px);
          }
        }
      }
      .page-btn {
        position: relative;
        width: calc(100% - 80px);
        left: 80px;
        text-align: center;
        flex-direction: row;
        .hover-fade();
        .flex-center();
        .flash-btn();
      }
      .right-btn {
        right: 0px;
      }
      .page-num {
        flex: 1;
        font-size: 14px;
        color: @text-vice;
      }
      .left-btn {
        left: 100px;
      }
    }
    .poem-footer {
      display: flex;
      flex-direction: column;
      width: @footer-width;
      margin-left: @page-pad;
      .poem-desc {
        .h-text(14px);
        text-indent: 2em;
        color: @text-vice;
      }
      .poem-author-desc {
        .h-text(12px);
        color: @text-gray;
        text-indent: 2em;
        margin-bottom: 32px;
      }
    }
    .poem-stamp-container {
      position: absolute;
      height: auto;
      bottom: 16px;
      left: @page-pad;
      display: flex;
      flex-direction: column-reverse;
      .flex-center();
      .hover-fade();
      .poem-author-stamp {
        width: 48px;
        height: 48px;
        background-image: url('~st/images/stamp/author.png');
        span {
          .flash-text();
          color: white!important;
        }
      }
      .poem-understand-stamp {
        width: 34px;
        height: 88px;
        background-image: url('~st/images/stamp/understand.png');
      }
      .poem-recite-stamp {
        width: 52px;
        height: 88px;
        background-image: url('~st/images/stamp/recite.png');
        span {
          font-size: 24px!important;
          margin-top: 8px;
        }
      }
      .poem-favorite-stamp {
        width: 45px;
        height: 88px;
        background-image: url('~st/images/stamp/favorite.png');
        span {
          color: white!important;
          font-size: 26px!important;
          line-height: 28px!important;
          margin-top: 20px;
          margin-left: 18px;
        }
      }
      .poem-stamp {
        font-family: 'Zhuanti';
        background-size: cover;
        margin: 8px 0px;
        padding: 4px;
        .flex-center();
        span {
          text-align: center;
          font-size: 20px;
          line-height: 22px;
          color: @stamp-color;
          .hover-fade();
          cursor: pointer;
        }
      }
      .stamp-off {
        opacity: .5;
        .gray-filter();
        .hover-fade();
      }
    }
  }
  .poem-page {
    .flex-center();
    .center-horizontal();
    width: 48px;
    height: 48px;
    bottom: 0px;
    left: 50%;
    span {
      font-size: 14px;
      color: @text-vice;
    }
  }
}
</style>
