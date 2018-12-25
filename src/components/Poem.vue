<template>
  <div v-if="loading"></div>
  <div v-else class="poem">
    <div class="poem-header">
      <div class="poem-title">
        <span class="title">{{ poem.title }}</span>
        <span class="edit-btn" @click="editPoem"><img src="~@/assets/images/edit.png"/></span>
      </div>
      <div class="poem-author">
        <span class="name">{{ poem.author }}</span>
      </div>
    </div>
    <div class="poem-main">
      <div class="poem-content">
        <transition enter-active-class="fadeIn" leave-active-class="fadeOut">
        <div v-show="tip.show"
          class="annotation-tip animated"
          :style="{top: tip.position.top, right: tip.position.right}"
          @mouseenter="stopTipHide"
          @mouseleave="hideTip">
          <span>{{ annotationText }}</span>
        </div>
        </transition>
        <div class="column animated fadeIn" v-for="(column, index) in pages[pageIndex]" :key="index">
          <span class="column-text" :class="{'prologue-text': isPrologue(index)}">{{ column }}</span>
          <span class="column-annotation"
            v-for="(a, ai) in annotationList[pageIndex][index]"
            :style="{top: a.index * fontHeight + 'px'}"
            @mouseenter.stop="showTip(index, ai)"
            @mouseleave.stop="hideTip">{{ $util.parseNumber(a.num) }}</span>
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
      <div class="poem-image" :style="{backgroundImage: 'url(' + poemImage + ')'}">
        <span class="change-btn" @click="chooseImage"><img src="~@/assets/images/change_image.png" /></span>
      </div>
    </div>
    <div class="poem-stamp-container" v-show="pageIndex == pages.length - 1">
      <div
        class="poem-stamp poem-author-stamp animated pulse"
        :title="$str.poem_author + '：' + poem.author">
        <span>{{ stampText(poem.author) }}</span>
      </div>
      <div
        class="poem-stamp poem-understand-stamp"
        :class="{'stamp-off': !poem.status.understand, 'animated pulse': poem.status.understand}"
        :title="$str.understand + $str.poem"
        @click="understandPoem">
        <span>{{ $str.ed + $str.understand }}</span>
      </div>
      <div
        v-show="poem.status.understand"
        class="poem-stamp poem-recite-stamp"
        :class="{'stamp-off': !poem.status.recite, 'animated pulse': poem.status.recite}"
        :title="$str.recite + $str.poem"
        @click="recitePoem">
        <span>{{ stampText($str.ed + $str.recite) }}</span>
      </div>
      <div
        v-show="poem.status.recite"
        class="poem-stamp poem-favorite-stamp"
        :class="{'stamp-off': !poem.status.favorite, 'animated pulse': poem.status.favorite}"
        :title="$str.favorite + $str.poem"
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
      annotationList: [],
      annotationText: '',
      // 注释提示
      tip: {
        show: false,
        position: [0, 0],
        timeout: null
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
    annotations () {
      if (this.poem.annotation) {
        return this.poem.annotation.split(/\n/)
      } else {
        return []
      }
    }
  },
  mounted () {
    this.$bus.on('refreshPoem', this.refreshPoem)
    this.init()
  },
  methods: {
    init() {
      this.loadPoem()
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
      this.annotationList = []
      var pa = []
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
          pa[cIndex] = []
          // 处理注释
          do {
            if (m != -1) {
              num ++
              pa[cIndex].push({
                num: num,
                index: m - n
              })
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
            this.annotationList[pIndex] = pa
            pIndex ++
            page = []
            pa = []
          }
          cIndex ++
        }
      }
      this.annotationList[pIndex] = pa
      if (page.length > 0) {
        this.pages.push(page)
      }
    },
    // 阻止注释自动隐藏
    stopTipHide () {
      clearTimeout(this.tip.timeout)
    },
    // 显示注释
    showTip (column, index) {
      this.stopTipHide()
      const annotation = this.annotationList[this.pageIndex][column][index]
      if (annotation) {
        const tip = this.annotations[annotation.num - 1]
        if (tip) {
          this.annotationText = this.$util.parseColumn(tip)
          this.tip.position.top = ((annotation.index - 1) * this.fontHeight) + 'px'
          this.tip.position.right = ((column * this.columnWidth) + 32) + 'px'
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
    refreshPoem (id) {
      if (this.id == id) {
        this.loadPoem()
      }
    },
    chooseImage () {
      this.$bus.emit('chooseImage', this.id)
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
  span {
    display: block;
  }
  .poem-header {
    position: relative;
    display: flex;
    flex-direction: row-reverse;
    align-self: flex-start;
    .poem-title {
      .title {
        .v-title(20px);
      }
      .edit-btn {
        position: absolute;
        .image-btn();
        right: -54px;
        top: 0px;
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
        .column-annotation {
          position: absolute;
          display: block;
          width: 16px;
          height: 16px;
          left: -4px;
          padding: 4px;
          font-size: 16px;
          color: @text-red;
          border: 1px solid @text-red;
          border-radius: 50%;
          transform: scale(0.5, 0.5)
        }
      }
      .annotation-tip {
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
      margin-bottom: 40px;
      text-align: center;
      flex-direction: row;
      .hover-fade();
      .flex-center();
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
    width: 210px;
    .poem-desc {
      .h-text(14px);
      text-indent: 2em;
      color: @text-vice;
    }
    .poem-author-desc {
      .h-text(12px);
      color: @text-grey;
      text-indent: 2em;
      margin-bottom: 32px;
    }
    .poem-image {
      position: relative;
      flex: 1;
      width: 100%;
      border: 1px solid @white-bg;
      border-radius: @base-radius;
      .float-bg(60s);
      .change-btn {
        .image-btn();
        position: absolute;
        bottom: 0px;
        right: 0px;
      }
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
      filter: grayscale(80%);
      opacity: .5;
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
