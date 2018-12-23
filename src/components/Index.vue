<template>
  <div class="main">
    <audio src="" loop autoplay preload="true"/>
    <div v-if="loading"></div>
    <div v-else class="content" :style="{width: w + 'px', height: h + 'px'}">
      <div class="message-box animated bounceIn"
        :class="{'message-show': messageShow, 'message-hide': !messageShow}"
        @click="messageShow = false"
        @mouseover="stopMessageHide"
        @mouseleave="messageShow = false">
        <div class="message-title"><span>{{ message.title }}</span></div>
        <div class="message-content"><span>{{ message.content }}</span></div>
      </div>
      <transition enter-active-class="fadeIn" leave-active-class="fadeOut">
        <div class="action-btn animated" v-if="!isOpened">
          <div class="add-btn" @click="showNew = !showNew"><span class="btn-label">{{ $str.new }}</span><span class="icon-btn"><img src="~@/assets/images/add.png"/></span></div>
          <div class="search-btn" @click="searchPoem"><span class="btn-label">{{ $str.search }}</span><span class="icon-btn"><img src="~@/assets/images/search.png"/></span></div>
        </div>
      </transition>
      <div class="album" id="album">
        <div class="page">
          <Cover></Cover>
        </div>
        <div class="page" v-for="(item, index) in poems">
          <section><Left :id="item._id"></Left></section>
          <section><Right :id="item._id"></Right></section>
        </div>
      </div>
      <div class="new" :style="{width: w / 2 + 'px',  height: h + 'px'}">
        <transitionenter-active-class="fadeInUp" leave-active-class="fadeOutUp">
          <New v-if="showNew" class="animated" :id="poemId"></New>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import turn from 'st/js/turn.min'
import Cover from '@/components/Cover'
import Left from '@/components/Left'
import Right from '@/components/Right'
import New from '@/components/New'
import { getAllPoems } from '@/api/poem'
export default {
  name: 'Index',
  components: {
    Cover,
    Left,
    Right,
    New
  },
  data () {
    return {
      w: 0,
      h: 0,
      poems: [],
      isOpened: false,
      showNew: false,
      poemId: '',
      messageShow: true,
      message: {
        title: '',
        content: '',
        type: '',
        timeout: '',
      },
      loading: true
    }
  },
  mounted() {
    this.$bus.on('message', this.showMessage)
    this.$bus.on('editPoem', this.editPoem)
    this.init()
    this.load()
    window.onresize = () => {
      this.init()
    }
  },
  methods: {
    init () {
      this.h = document.documentElement.clientHeight * .9
      this.w = this.h * 1.6
    },
    load () {
      getAllPoems({}).then(res => {
        this.poems = res
        this.loading = false
        this.$nextTick(() => {
          $('#album').turn({
            width: this.w,
            height: this.h,
            display: 'single',
            direction: 'rtl',
            elevation: 50,
            gradients: true
          })
          $('#album').bind('turning', (event, page, view) => {
            if (page == 1) {
              this.isOpened = false
            } else {
              this.showNew = false
              this.isOpened = true
            }
          })
        })
      })
    },
    editPoem (id) {
      this.showNew = !this.showNew
      if (this.showNew) {
        this.poemId = id
      } else {
        this.poemId = ''
      }
    },
    searchPoem () {
      this.$bus.emit('message', '提示', '您中奖啦！')
    },
    stopMessageHide () {
      clearTimeout(this.message.timeout)
    },
    showMessage (content, title, type) {
      this.stopMessageHide()
      this.message.title = title
      this.message.content = content
      this.messageShow = true
      this.message.timeout = setTimeout(() => {
        this.messageShow = false
      }, 3000)
    }
  }
}
</script>

<style lang="less" scoped>
.main {
  width: 100%;
  height: 100vh;
  background: @dark-bg;
  -webkit-user-select: none;
  .flex-center();
  .content {
    position: relative;
    .album {
      cursor: pointer;
      z-index: 3;
      .page {
        display: flex;
        position: relative;
        background: @page-bg;
        section {
          flex: 1;
        }
      }
    }
    .new {
      position: absolute;
      left: 50%;
      top: 0px;
      .flex-center();
    }
  }
  .action-btn {
    display: flex;
    position: absolute;
    top: -10px;
    right: 80px;
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
  .message-box {
    .center-horizontal();
    width: 300px;
    background: @cover-bg;
    border-radius: @base-radius * 2;
    box-shadow: @white-bg 0px 0px 4px;
    color: @text-white;
    padding: 4px 8px;
    text-align: center;
    z-index: 9;
    cursor: pointer;
    .message-title {
      line-height: 24px;
    }
    .message-content {
      height: 32px;
      line-height: 32px;
    }
  }
  .message-show {
    animation: messageShow 1s 1 forwards;
    @keyframes messageShow {
      from { top: -120px; }
      to { top: 40px; }
    }
  }
  .message-hide {
    animation: messageHide 1s 1 forwards;
    @keyframes messageHide {
      from { top: 40px; }
      to { top: -120px; }
    }
  }
}
</style>
