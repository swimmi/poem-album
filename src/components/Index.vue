<template>
  <div class="main">
    <div class="control-btn">
      <span class="image-btn end-btn" @click="turnLast"><img src="~@/assets/images/backward.png"/></span>
      <span class="image-btn next-btn" @click="turnPrev"><img src="~@/assets/images/next.png"/></span>
      <span class="image-btn prev-btn" @click="turnNext"><img src="~@/assets/images/prev.png"/></span>
      <span class="image-btn home-btn" @click="turnFirst"><img src="~@/assets/images/forward.png"/></span>
    </div>
    <div class="modal animated fadeIn" v-show="cropper.show">
      <input type="file" hidden ref="imageFile" accept="image/*" @change="changeImage"/>
      <transition enter-active-class="fadeIn" leave-active-class="fadeIn">
        <div class="modal-wrapper cropper">
          <img ref="cropperImage" :src="cropper.url"/>
        </div>
      </transition>
      <div class="modal-btn btn-group">
        <span class="modal-title">{{ $str.choose_image }}</span>
        <span class="image-btn" @click="selectFile"><img src="~@/assets/images/image.png"/></span>
        <span class="image-btn" @click="cropper.show = false"><img src="~@/assets/images/close.png"/></span>
        <span class="image-btn" @click="uploadImage"><img src="~@/assets/images/ok.png"/></span>
      </div>
    </div>
    <div class="modal animated fadeIn" v-show="recorder.show">
      <div class="modal-wrapper recorder"><Recorder></Recorder></div>
      <div class="modal-btn btn-group">
        <span class="modal-title">{{ $str.record_read }}</span>
        <span class="image-btn" @click="playRecords"><img src="~@/assets/images/remove.png"/></span>
        <span class="image-btn" @click="recorder.show = false"><img src="~@/assets/images/close.png"/></span>
        <span class="image-btn" @click="uploadRecords"><img src="~@/assets/images/ok.png"/></span>
      </div>
    </div>
    <div v-if="loading"></div>
    <div v-else class="content" :style="{width: w + 'px', height: h + 'px'}">
      <div class="album" id="album">
        <div class="page">
          <Cover></Cover>
        </div>
        <div class="page">
          <New></New>
        </div>
        <div class="page">
          <Catalog></Catalog>
        </div>
        <div class="page" v-for="(item, index) in poems">
          <Poem :id="item._id" :page="index + 4" :odd="index % 2 == 0"></Poem>
        </div>
        <div class="page">
          <Back></Back>
        </div>
      </div>
      <div class="pad" v-show="writable">
        <canvas id="writePad" :width="w" :height="h"></canvas>
      </div>
      <div class="player">
        <audio id="audio" src="static/erke.mp3"></audio>
        <canvas id="canvas" :width="210" :height="player.height"></canvas>
      </div>
    </div>
  </div>
</template>
<script>
import 'cropperjs/dist/cropper.css'
import Cropper from 'cropperjs'
import SignaturePad from 'signature_pad'
import turn from 'st/js/turn.min'
import Cover from '@/components/Cover'
import Back from '@/components/Back'
import Poem from '@/components/Poem'
import New from '@/components/New'
import Recorder from '@/components/Recorder'
import Player from '@/components/Player'
import Catalog from '@/components/Catalog'
import { getAllPoems, updateAnyPoem, getLastPoem } from '@/api/poem'
export default {
  name: 'Index',
  components: {
    Cover,
    Back,
    Poem,
    New,
    Catalog,
    Recorder,
    Player
  },
  data () {
    return {
      w: 0,
      h: 0,
      poems: [],
      poemId: '',
      poemPage: 0,
      // 图片裁剪
      cropper: {
        self: null,
        url: '',
        show: false
      },
      recorder: {
        show: false
      },
      player: {
        height: 600,
        analyser: null,
        ctx: null,
        gradient: null,
        capYPositionArray: []
      },
      writable: false,
      loading: true
    }
  },
  mounted() {
    this.$bus.on('editPoem', this.editPoem)
    this.$bus.on('openAlbum', this.openAlbum)
    this.$bus.on('poemAdded', this.poemAdded)
    this.$bus.on('poemEdited', this.poemEdited)
    this.$bus.on('recordPoem', this.recordPoem)
    this.$bus.on('chooseImage', this.chooseImage)
    this.$bus.on('poemRecorded', this.poemRecorded)
    this.init()
  },
  updated () {
    this.$nextTick(() => {
      this.initCropper()
      this.initTurn()
      this.initPlayer()
    })
  },
  unbind () {

  },
  methods: {
    init () {
      this.h = document.documentElement.clientHeight * .9
      this.w = this.h * 1.6
      this.loadPoems()
    },
    loadPoems () {
      getAllPoems({}).then(res => {
        this.poems = res
        if(this.inited) {
          this.initTurn()
        }
        this.loading = false
      })
    },
    turnPage (num) {
      $('#album').turn('page', num)
    },
    turnFirst () {
      this.turnPage(1)
    },
    turnLast () {
      this.turnPage($('#album').turn('pages'))
    },
    turnNext () {
      $('#album').turn('next')
    },
    turnPrev () {
      $('#album').turn('previous')
    },
    poemAdded () {
      this.loadPoems()
    },
    editPoem (id, page) {
      this.poemPage = page
      this.$bus.emit('loadPoem', id)
      // 跳到添加页
      this.turnPage(2)
    },
    // 编辑后处理
    poemEdited (id) {
      // 转回页面
      this.turnPage(this.poemPage)
      this.$bus.emit('refreshPoem', id)
    },
    openAlbum (page) {
      setTimeout(() => {
        this.turnPage(page)
      }, 1000)
    },
    initTurn () {
      $('#album').turn({
        width: this.w,
        height: this.h,
        direction: 'rtl',
        elevation: 50,
        gradients: true,
        autoCenter: true
      })
      $('#album').turn("options", {turnCorners: "bl,br"});
    },
    // 初始化手写板
    initWritePad () {
      var canvas = document.getElementById('writePad')
      var signaturePad = new SignaturePad(canvas)
      signaturePad.toDataURL("image/png")
    },
    // 初始化Cropper
    initCropper () {
      this.cropper.self = new Cropper(this.$refs.cropperImage, {
        aspectRatio: 3 / 2,
        viewMode: 1
      })
    },
    /**
     * 播放器可视化相关
     */
    initPlayer () {
      this.player.ctx = new AudioContext()
      this.player.analyser = this.player.ctx.createAnalyser()
      this.player.analyser.connect(this.player.ctx.destination)
      this.player.capYPositionArray = []

      var audio = document.getElementById('audio')
      var audioSrc = this.player.ctx.createMediaElementSource(audio)
      audioSrc.connect(this.player.analyser)

      var canvas = document.getElementById('canvas')
      this.player.ctx = canvas.getContext('2d')
      this.player.gradient = this.player.ctx.createLinearGradient(0, 0, 0, this.player.height)
      this.player.gradient.addColorStop(1, '#00ff00cc')
      this.player.gradient.addColorStop(0.5, '#ffff00cc')
      this.player.gradient.addColorStop(0, '#ff0000cc')
      this.renderFrame()
      audio.play()
    },
    renderFrame() {
      var cwidth = canvas.width - 2,
          cheight = canvas.height,
          meterHeight = 8,
          meterGap = 10,
          capWidth = 2,
          capStyle = '#ffffffcc',
          meterNum = this.player.height / meterGap
      var array = new Uint8Array(this.player.analyser.frequencyBinCount)
      this.player.analyser.getByteFrequencyData(array)
      var step = Math.round(array.length / meterNum)
      this.player.ctx.clearRect(0, 0, canvas.width, cheight)
      for (var i = 0; i < meterNum; i++) {
          var value = array[i * step]
          if (this.player.capYPositionArray.length < Math.round(meterNum)) {
              this.player.capYPositionArray.push(value)
          }
          this.player.ctx.fillStyle = this.player.gradient
          this.player.ctx.fillRect(0, (meterNum - i) * meterGap, value + capWidth, meterHeight)
          this.player.ctx.fillStyle = capStyle
          if (value < this.player.capYPositionArray[i]) {
              this.player.ctx.fillRect(this.player.capYPositionArray[i], (meterNum - i) * meterGap, capWidth, meterHeight)
              this.player.capYPositionArray[i] --
          } else {
              this.player.ctx.fillRect(value, (meterNum - i) * meterGap, capWidth, meterHeight)
              this.player.capYPositionArray[i] = value
          }
      }
      requestAnimationFrame(this.renderFrame)
    },
    // 打开文件选择
    chooseImage (id) {
      if (this.poemId == id && this.cropper.url != '') {
        this.cropper.show = true
      } else {
        this.selectFile()
      }
      this.poemId = id
    },
    selectFile () {
      this.$refs.imageFile.click()
    },
    // 处理选择图片
    changeImage (e) {
      var files = e.target.files || e.dataTransfer.files
      if (!files.length) return
      this.cropper.url = this.$util.getObjectURL(files[0])
      this.cropper.self.replace(this.cropper.url)
      this.cropper.show = true
    },
    uploadImage () {
      const name = `${this.poemId}.png`
      this.cropper.self.getCroppedCanvas().toBlob((blob) => {
        var form = new FormData()
        form.append('type', 'images')
        form.append('file', blob, name)
        this.$http.post('/api/upload', form)
        const any = {
          'image': name
        }
        updateAnyPoem({'id': this.poemId, 'any': any}).then(res => {
          this.$bus.emit('refreshPoem', this.poemId)
        })
      })
      this.cropper.show = false
    },
    // 处理录制朗读
    recordPoem (id) {
      this.recorder.show = true
      this.poemId = id
      this.$bus.emit('loadRecorder', id)
    },
    playRecords () {
      this.$bus.emit('playRecords')
    },
    uploadRecords () {
      this.$bus.emit('uploadRecords')
    },
    poemRecorded () {
      this.recorder.show = false
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
    .pad {
      .center-parent();
      z-index: 9;
    }
    .player {
      position: absolute;
      height: auto;
      width: 210px;
      bottom: 48px;
      left: 48px;
      z-index: 8;
    }
  }
  .cropper {
    width: 100%;
    height: 100%;
    img {
      max-width: 100%;
    }
  }
  .modal {
    .modal-wrapper {
      .center-parent();
      width: 800px;
      height: 600px;
    }
    .modal-btn {
      display: flex;
      flex-direction: column;
      right: 160px;
      .center-vertical();
      .flex-center();
      .modal-title {
        display: block;
        color: @white-bg;
        margin-bottom: 16px;
        .v-text(20px);
      }
    }
  }
  .end-btn,.home-btn,.next-btn,.prev-btn {
    .center-vertical();
    .dark-btn();
    .flash-btn();
    z-index: 1;
  }
  .end-btn {
    left: 0px;
  }
  .home-btn {
    right: 0px;
  }
  .next-btn {
    right: 64px;
  }
  .prev-btn {
    left: 64px;
  }
  
}
</style>
