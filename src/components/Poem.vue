<template>
  <div v-if="loading"></div>
  <div v-else class="poem">
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
        <span v-if="poem.reads.length > 0" class="read-btn" @click="readPoem"><img src="~@/assets/images/read.png" /></span>
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
            <span>{{ annoText }}</span>
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
      <div class="poem-image" :class="{'float-start': music.started, 'animation-pause': !music.playing, 'float-reset': !music.started}" :style="{backgroundImage: 'url(' + poemImage + ')'}">
        <div class="poem-play-btn" v-if="poem.music" @click="playMusic">
          <img class="player-holder" src="~@/assets/images/audio_cover_holder.png" />
          <img class="player-pointer" :class="{'pointer-off': music.playing, 'pointer-on': !music.playing}" src="~@/assets/images/audio_cover_pointer.png" />
          <div class="player-cover flash-btn"
            :class="{'gray-filter': !music.playing}">
            <img v-if="music.playing" class="cover-img" src="~@/assets/images/music_on.svg" />
            <img v-else class="cover-img" src="~@/assets/images/music_off.svg" />
          </div>
        </div>
        <div class="poem-image-btn">
          <span :class="{'gray-filter': !poem.music}" @click="chooseMusic"><img src="~@/assets/images/music.png" /></span>
          <span :class="{'gray-filter': !poem.image}" @click="chooseImage"><img src="~@/assets/images/image.png" /></span>
        </div>
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
    <div class="poem-page">
      <span>{{ $util.parseNumber(this.page - 3) }}</span>
    </div>
  </div>
</template>
<script>
import { getPoem } from '@/api/poem'
export default {
  props: {
    id: {
      type: String,
      required: true
    },
    odd: {
      type: Boolean,
      required: true
    },
    sibling: {
      type: String,
      required: false
    },
    page: {
      type: Number,
      required: true
    }
  },
  data () {
    return {
      poem: null,
      poemImage: 'static/images/default.png',
      fontHeight: 18 * 1.2,
      columnWidth: 34,
      pages: [],
      pageIndex: 0,
      columnSize: 16,
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
      music: {
        started: false,
        playing: false
      },
      reads: {
        started: false,
        playing: false,
        index: -1
      },
      loading: true
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
    this.$bus.on('refreshPoem', this.refreshPoem)
    this.init()
  },
  methods: {
    init() {
      this.loadPoem()
    },
    initConfig () {
      this.music = {
        playing: false
      }
    },
    loadPoem () {
      this.loading = true
      getPoem({'id': this.id}).then(res => {
        this.poem = res
        if(this.poem.image) {
          this.poemImage = this.$util.getFilePath('images') + this.poem.image
        }
        this.loadColumns()
        this.loading = false
      })
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
      var size = this.columnSize
      if (this.poem.shi) {
        size *= 2
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
      this.$bus.emit('editPoem', this.id, this.page)
    },
    resetPoem (id) {
      if (this.id == id) {
        this.initConfig()
      }
    },
    refreshPoem (id) {
      if (this.id == id) {
        this.loadPoem()
      }
    },
    playMusic () {
      this.music.started = true
      this.music.playing = !this.music.playing
      if (this.poem.music) {
        this.$bus.emit('playMusic', this.id, this.poem.music, this.odd)
        this.$bus.emit('resetPoem', this.sibling)
      }
    },
    chooseMusic () {
      this.$bus.emit('chooseMusic', this.id)
    },
    chooseImage () {
      this.$bus.emit('chooseImage', this.id)
    },
    readPoem () {
      if (this.poem.reads && this.poem.reads.length > 0) {
        if(!this.reads.started) {
          this.$bus.emit('loadReads', this.id, this.poem.reads)
          this.reads.started = true
          this.reads.playing = true
        } else {
          if (this.reads.playing) {
            this.$bus.emit('pauseReads')
          } else {
            this.$bus.emit('resumeReads')
          }
          this.reads.playing = !this.reads.playing
        }
      }
    },
    recordPoem () {
      this.$bus.emit('recordPoem', this.id)
      this.$bus.emit('pauseMusic')
      this.music.playing = false
    }
  }
}
</script>
<style lang="less" scoped>
.poem {
  display: flex;
  flex-direction: row-reverse;
  width: calc(100% - @page-pad * 2);
  height: calc(100% - @page-pad * 2);
  margin: @page-pad;
  z-index: 9;
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
      flex: 1;
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
        width: 100%;
        height: 100%;
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
        z-index: 1;
        span {
          color: @text-vice;
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
    .poem-image {
      position: relative;
      flex: 1;
      width: 100%;
      border: 1px solid @border-color;
      border-radius: @base-radius;
      .poem-play-btn {
        position: absolute;
        width: 100px;
        height: 130px;
        left: -16px;
        top: -32px;
        display: flex;
        flex-direction: column;
        transform: scale(0.5);
        .hover-fade();
        .player-holder {
          position: relative;
          width: 32px;
          left: 50%;
          transform: translate(-50%, 0);
          z-index: 3;
        }
        .player-pointer {
          position: relative;
          width: 48px;
          left: calc(50% - 10px);
          top: -12px;
          transform-origin: 8px 8px;
          z-index: 2;
        }
        .player-cover {
          .flex-center();
          position: absolute;
          width: 100px;
          height: 100px;
          bottom: 0px;
          background-image: url('~@/assets/images/audio_cover_bg.png');
          background-size: 100px;
          background-repeat: no-repeat;
          .cover-img {
            width: 40px;
          }
        }
        .pointer-on {
          transition: all .7s;
          transform: rotateZ(-30deg);
        }
        .pointer-off {
          transition: all .7s;
          transform: rotateZ(0deg);
        }
      }
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
  .poem-stamp-container {
    position: absolute;
    height: auto;
    bottom: 42px;
    left: 272px;
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
