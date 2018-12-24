<template>
  <div v-if="loading"></div>
  <div v-else class="poem">
    <div class="poem-spine" @click="toolbarShow = !toolbarShow"></div>
    <div class="poem-toolbar-container" @mouseenter="toolbarShow = true" @mouseleave="toolbarShow = false">
      <transition enter-active-class="flipInY" leave-active-class="flipOutY">
        <div class="poem-toolbar animated" v-show="toolbarShow">
          <div class="toolbar-btn edit-btn" @click.stop="editPoem"><img src="~@/assets/images/edit.png"/></div>
          <div class="toolbar-btn done-btn" @click.stop="actionDone"><img src="~@/assets/images/done.png"/></div>
          <div class="toolbar-btn favorite-btn" @click.stop="favoritePoem"><img src="~@/assets/images/favorite.png"/></div>
          <div class="toolbar-btn done-btn" @click.stop="actionDone"><img src="~@/assets/images/delete.png"/></div>
        </div>
      </transition>
    </div>
    <transition enter-active-class="fadeIn" leave-active-class="fadeOut">
      <div class="action-btn animated">
        <div class="add-btn">
          <span class="btn-label">{{ $str.new }}</span>
          <span class="icon-btn"><img src="~@/assets/images/add.png"/></span>
        </div>
      </div>
    </transition>
    <div class="poem-header">
      <div class="poem-title">
        <span class="title">{{ poem.title }}</span>
      </div>
      <div class="poem-author">
        <span class="name">{{ poem.author }}</span>
      </div>
    </div>
    <div class="poem-main">
      <div class="poem-content">
        <transition enter-active-class="fadeIn" leave-active-class="fadeOut">
        <div v-show="tipShow"
          class="annotation-tip animated"
          :style="{top: tipPosition.top, right: tipPosition.right}"
          @mouseenter="clearTipTimeout"
          @mouseleave="hideTip">
          <span>{{ annotationText }}</span>
        </div>
        </transition>
        <div class="column" v-for="(column, index) in columns">
          <span class="column-text">{{ column }}</span>
          <span class="column-space" v-if="spaceTop(column) != -1" :style="{top: spaceTop(column)}"></span>
          <span class="column-annotation"
            v-for="(a, ai) in annotationList[index]"
            :style="{top: a.index * fontHeight + 'px'}"
            @mouseenter.stop="showTip(index, ai)"
            @mouseleave.stop="hideTip">{{ $util.parseNumber(a.num) }}</span>
        </div>
      </div>
      <div class="poem-image">
        
      </div>
    </div>
    <div class="poem-footer">
      <div class="poem-desc">
        <span>{{ poem.desc }}</span>
      </div>
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
    reverse: {
      type: Boolean,
      required: true
    }
  },
  data () {
    return {
      poem: null,
      fontHeight: 18 * 1.2,
      columnWidth: 42,
      columns: [],
      columnSize: 16,
      annotationList: [],
      annotationText: '',
      tipShow: false,
      tipPosition: [0, 0],
      tipTimeout: null,
      toolbarShow: false,
      action: '',
      loading: true
    }
  },
  computed: {
    spaceTop () {
      return function (column) {
        const i = column.replace(/ /g, '').indexOf('＠＠')
        if (i != -1) {
          return i * this.fontHeight + 'px'
        } else {
          return -1
        }
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
  mounted() {
    this.$bus.on('poemEdited', this.poemEdited)
    getPoem({'id': this.id}).then(res => {
      this.poem = res
      this.loadColumns()
      this.loading = false
    })
  },
  methods: {
    loadColumns () {
      var array = []
      // 添加段首标记
      var text = this.poem.content.replace(/\n/g, '＠＠')
      var size = this.columnSize
      // 调整列数
      if (text.length > size * 8) {
        size *= 2
      }
      // 获取注释位置
      var cIndex = 0      // 列索引
      var num = 0         // 注释数
      for (var i = 0; i < text.length; i += size) {
        var column = ''   // 当前列
        var n = 0         // 当前列注释数量
        var m = -1        // 当前列注释位置
        this.annotationList[cIndex] = []
        do {
          if (m != -1) {
            num ++
            this.annotationList[cIndex].push({
              num: num,
              index: m - n
            })
          }
          column = text.substr(i, size + n)
          // 去除段首标记
          if (column.charAt(0) == '＠') {
            column = column.substring(2)
          }
          m = column.indexOf('#', m + 1)
          n ++
        } while (m != -1)
        i += n - 1
        // 去除注释标记
        column = this.$util.parseColumn(column).replace(/#/g, '')
        this.columns.push(column)
        cIndex ++
      }
    },
    clearTipTimeout () {
      clearTimeout(this.tipTimeout)
    },
    showTip (column, index) {
      this.clearTipTimeout()
      const annotation = this.annotationList[column][index]
      this.annotationText = this.$util.parseColumn(this.annotations[annotation.num - 1])
      this.tipPosition.top = ((annotation.index + 1) * this.fontHeight) + 'px'
      this.tipPosition.right = ((column * this.columnWidth) + 158) + 'px'
      this.tipShow = true
    },
    hideTip () {
      this.tipTimeout = setTimeout(() => { this.tipShow = false }, 1000)
    },
    editPoem () {
      this.action = 'edit'
      this.$bus.emit('editPoem', this.poem._id)
    },
    poemEdited (poem) {
      this.poem = poem
      this.loadColumns()
      this.$bus.emit('editPoem', this.poem._id)
    },
    favoritePoem () {
      this.$bus.emit('message', this.$str.favorite_success)
    },
    actionDone () {
      switch (this.action) {
        case 'edit':
          this.$bus.emit('submitPoem')
          break;
      }
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
  padding: @page-pad;
  z-index: 9;
  span {
    display: block;
  }
  .poem-header {
    display: flex;
    flex-direction: row-reverse;
    align-self: flex-start;
    .poem-title {
      .title {
        .v-title(20px);
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
    .poem-content {
      display: flex;
      flex-direction: row-reverse;
      color: @text-black;
      margin: 32px;
      .column {
        position: relative;
        .column-text {
          margin-left: 24px;
          .v-text(18px);
        }
        .column-space {
          position: absolute;
          background: @page-bg;
          width: 100%;
          height: 50px;
        }
        .column-annotation {
          position: absolute;
          display: block;
          width: 16px;
          height: 16px;
          left: 4px;
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
  }
  .poem-footer {
    display: flex;
    flex-direction: column;
    width: 210px;
    .poem-desc {
      flex: 1;
      .h-text(14px);
      text-indent: 2em;
    }
  }
  .poem-toolbar-container {
    position: absolute;
    bottom: 50%;
    left: 0px;
    transform: translate(-50%, 50%);
    z-index: 9;
    .toggle-btn {
      position: absolute;
      bottom: 50%;
      transform: translate(0, 50%);
    }
    .toolbar-btn {
      width: 64px;
      height: 64px;
      .flex-center();
      border-radius: @base-radius * 2;
      &:hover {
        background: @accent-color;
      }
    }
    .poem-toolbar {
      flex-direction: column;
      padding: 8px 4px;
      box-shadow: @shadow-color 2px 2px 8px;
      background-color: @primary-color;
      border-radius: @base-radius * 2;
    }
  }
  .poem-spine {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 48px;
    height: 100%;
    .hover-fade();
    &:hover {
      background-color: @light-bg;
    }
  }
  .action-btn {
    display: flex;
    position: absolute;
    top: 0px;
    right: 0px;
    z-index: 4;
    overflow: hidden;
    div {
      position: relative;
      height: 58px;
      width: 48px;
      margin: 0px 8px;
      text-align: center;
      background: lighten(@accent-color, 10%);
      color: @text-white;
      transition: all 1s;
      cursor: pointer;
      &:hover {
        background: darken(@accent-color, 10%);
        height: 120px;
      }
      &:before {
        content: '';
        width: 0;
        height: 0;
        top: -18px;
        right: -28px;
        border-width: 0px 10px 10px 0px;
        border-style: solid;
        border-color: transparent transparent lighten(@accent-color, 20%) transparent;
        margin: 40px auto;
        position: relative;
      }
      .btn-label {
        .center-horizontal();
        bottom: 54px;
        .v-text(18px);
      }
      .icon-btn {
        display: block;
        width: @icon-size;
        height: @icon-size;
        bottom: 8px;
        .center-horizontal();
        img {
          width: @icon-size;
          height: @icon-size;
        }
      }
    }
  }
}
</style>
