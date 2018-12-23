<template>
  <div v-if="loading"></div>
  <div v-else class="poem">
    <div class="poem-spine" @click="showToolbar = !showToolbar"></div>
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
        <div class="column" v-for="(column, index) in columns">
          <span class="column-text">{{ column }}</span>
          <span class="column-space" v-if="spaceTop(column) != -1" :style="{top: spaceTop(column)}"></span>
          <span class="column-annotation" v-for="(annotation, ai) in columnAnnotations(index)"></span>
        </div>
      </div>
    </div>
    <div class="poem-footer">
      <div class="poem-desc">
        <span>{{ poem.desc }}</span>
      </div>
      <div class="poem-annotation">
        <span v-for="(item, index) in annotations">{{ item }}</span>
      </div>
    </div>
    <div class="poem-toolbar-container" @mouseenter="showToolbar = true" @mouseleave="showToolbar = false">
      <transition enter-active-class="flipInY" leave-active-class="flipOutY">
        <div class="poem-toolbar animated" v-show="showToolbar">
          <div class="toolbar-btn edit-btn" @click.stop="editPoem"><img src="~@/assets/images/edit.png"/></div>
          <div class="toolbar-btn done-btn" @click.stop="actionDone"><img src="~@/assets/images/done.png"/></div>
          <div class="toolbar-btn favorite-btn" @click.stop="favoritePoem"><img src="~@/assets/images/favorite.png"/></div>
          <div class="toolbar-btn done-btn" @click.stop="actionDone"><img src="~@/assets/images/delete.png"/></div>
        </div>
      </transition>
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
      fontHeight: 18 * 1.2,
      columns: [],
      columnSize: 16,
      showToolbar: false,
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
    columnAnnotations () {
      return function (index) {
        return []
      }
    },
    annotations () {
      if (this.poem.annotation) {
        return this.poem.annotation.split('/n')
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
      this.columns = this.$util.splitToColumns(this.poem.content, this.columnSize)
      if (this.columns.length >= 8) {
        this.columns = this.$util.splitToColumns(this.poem.content, this.columnSize * 2)
      }
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
  border-left: 1px #888 dashed;
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
      margin-right: 24px;
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
      margin-right: 32px;
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
    }
    .poem-annotation {
      position: relative;
      padding: 16px 0px;
      .thin-border();
      .h-text(14px);
    }
  }
  .poem-toolbar-container {
    position: absolute;
    bottom: 50%;
    left: 50%;
    transform: translate(-50%, 50%);
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
    left: 50%;
    top: 0px;
    width: 48px;
    height: 100%;
    .hover-fade();
    &:hover {
      background-color: @light-bg;
    }
  }
}
</style>
