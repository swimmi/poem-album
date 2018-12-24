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
        <div class="column" v-for="(column, index) in columns">
          <span class="column-text">{{ column }}</span>
          <span class="column-annotation"
            v-for="(a, ai) in annotationList[index]"
            :style="{top: a.index * fontHeight + 'px'}"
            @mouseenter.stop="showTip(index, ai)"
            @mouseleave.stop="hideTip">{{ $util.parseNumber(a.num) }}</span>
        </div>
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
        <span class="change-btn" @click="changeImage"><img src="~@/assets/images/change_image.png" /></span>
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
    }
  },
  data () {
    return {
      poem: null,
      poemImage: 'static/images/default.png',
      fontHeight: 18 * 1.2,
      columnWidth: 42,
      columns: [],
      columnSize: 16,
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
    annotations () {
      if (this.poem.annotation) {
        return this.poem.annotation.split(/\n/)
      } else {
        return []
      }
    }
  },
  mounted () {
    this.$bus.on('poemEdited', this.poemEdited)
    getPoem({'id': this.id}).then(res => {
      this.poem = res
      this.init()
    })
  },
  methods: {
    init() {
      this.loadColumns()
      this.loading = false
    },
    loadColumns () {
      // 添加段首标记
      var ps = this.poem.content.split(/\n/g)
      console.log(ps)
      var size = this.columnSize
      // 调整列数
      // 获取注释位置
      var cIndex = 0      // 列索引
      var num = 0         // 注释数
      for (var p = 0; p < ps.length; p ++) {
        var text = ps[p].trim()
        if (text.length >= size * 8) {
          size *= 2
        }
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
            m = column.indexOf('#', m + 1)
            n ++
          } while (m != -1)
          i += n - 1
          // 去除注释标记
          column = this.$util.parseColumn(column).replace(/#/g, '')
          this.columns.push(column)
          cIndex ++
        }
      }
    },
    // 阻止注释自动隐藏
    stopTipHide () {
      clearTimeout(this.tip.timeout)
    },
    // 显示注释
    showTip (column, index) {
      this.stopTipHide()
      const annotation = this.annotationList[column][index]
      this.annotationText = this.$util.parseColumn(this.annotations[annotation.num - 1])
      this.tip.position.top = ((annotation.index + 1) * this.fontHeight) + 'px'
      this.tip.position.right = ((column * this.columnWidth) + 164) + 'px'
      this.tip.show = true
    },
    // 隐藏注释
    hideTip () {
      this.tip.timeout = setTimeout(() => { this.tip.show = false }, 1000)
    },
    // 编辑诗词
    editPoem () {
      this.$bus.emit('editPoem', this.id)
    },
    // 编辑后处理
    poemEdited (poem) {
      this.poem = poem
      this.loadColumns()
      this.$bus.emit('editPoem', this.id)
    },
    changeImage () {
      this.$bus.emit('changeImage', this.id)
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
      display: flex;
      .title {
        .v-title(20px);
      }
      .edit-btn {
        align-self: flex-end;
        position: absolute;
        .image-btn();
        right: -54px;
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
      .column {
        position: relative;
        .column-text {
          margin-left: 16px;
          .v-text(18px);
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
  }
  .poem-footer {
    display: flex;
    flex-direction: column;
    width: 210px;
    .poem-desc {
      .h-text(14px);
      text-indent: 2em;
    }
    .poem-author-desc {
      .h-text(12px);
      color: @text-vice;
      text-indent: 2em;
      margin-bottom: 32px;
    }
    .poem-image {
      position: relative;
      flex: 1;
      width: 100%;
      border: 1px solid @white-bg;
      border-radius: @base-radius;
      //.float-bg(120s);
      .change-btn {
        .image-btn();
        position: absolute;
        bottom: 0px;
        right: 0px;
      }
    }
  }
}
</style>
