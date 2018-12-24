<template>
  <div class="main">
    <audio src="" loop autoplay preload="true"/>
    <div v-if="loading"></div>
    <div v-else class="content" :style="{width: w + 'px', height: h + 'px'}">
      <div class="message-box"
        :class="{'message-show': messageShow, 'message-hide': !messageShow}"
        @click="messageShow = false"
        @mouseover="stopMessageHide"
        @mouseleave="messageShow = false">
        <div class="message-title"><span>{{ message.title }}</span></div>
        <div class="message-content"><span>{{ message.content }}</span></div>
      </div>
      <div class="album" id="album">
        <div class="page">
          <Cover></Cover>
        </div>
        <div class="page">
          <New :id="poemId"></New>
        </div>
        <div class="page">
          <Catalog></Catalog>
        </div>
        <div class="page" v-for="(item, index) in poems">
          <Poem :id="item._id"></Poem>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import turn from 'st/js/turn.min'
import Cover from '@/components/Cover'
import Poem from '@/components/Poem'
import New from '@/components/New'
import Catalog from '@/components/Catalog'
import { getAllPoems } from '@/api/poem'
export default {
  name: 'Index',
  components: {
    Cover,
    Poem,
    New,
    Catalog
  },
  data () {
    return {
      w: 0,
      h: 0,
      poems: [],
      isOpened: false,
      showNew: true,
      poemId: '',
      messageShow: false,
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
    this.$bus.on('openAlbum', this.openAlbum)
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
            direction: 'rtl',
            elevation: 50,
            gradients: true
          })
          $('#album').bind('turning', (event, page, view) => {
            if (page == 1) {
              this.isOpened = false
              this.showNew = true
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
    },
    openAlbum (page) {
      setTimeout(() => {
        $('#album').turn('page', page * 2)
      }, 1000)
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
  overflow: hidden;
  .flex-center();
  .content {
    position: relative;
    .album {
      cursor: pointer;
      .page {
        background: @page-bg;
      }
    }
  }
  .message-box {
    .center-horizontal();
    width: 300px;
    background: @vice-color;
    border-radius: @base-radius * 2;
    box-shadow: @shadow-color 0px 0px 4px;
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
