<template>
  <div class="main">
    <div class="modal animated fadeIn" v-show="cropper.show">
      <input type="file" hidden ref="imageFile" accept="image/*" @change="changeImage"/>
      <transition enter-active-class="fadeIn" leave-active-class="fadeIn">
        <div class="modal-wrapper cropper">
          <img ref="cropperImage" :src="cropper.url"/>
        </div>
      </transition>
      <div class="modal-btn btn-group">
        <span class="modal-title">{{ $str.choose_image }}</span>
        <span class="image-btn" @click="selectImage"><img src="~@/assets/images/folder.png"/></span>
        <span class="image-btn" @click="cropper.show = false"><img src="~@/assets/images/close.png"/></span>
        <span class="image-btn" @click="uploadImage"><img src="~@/assets/images/ok.png"/></span>
      </div>
    </div>
    <div class="modal animated fadeIn" v-show="recorder.show">
      <div class="modal-wrapper recorder"><Recorder></Recorder></div>
      <div class="modal-btn btn-group">
        <span class="modal-title">{{ $str.record_read }}</span>
        <span class="image-btn" @click="emptyRecords"><img src="~@/assets/images/remove.png"/></span>
        <span class="image-btn" @click="recorder.show = false"><img src="~@/assets/images/close.png"/></span>
        <span class="image-btn" @click="uploadRecords"><img src="~@/assets/images/ok.png"/></span>
      </div>
    </div>
    <div v-if="loading"></div>
    <div v-else class="content" :style="{width: w + 'px', height: h + 'px'}">
      <audio id="readerAudio" ref="readerAudio" hidden />
      <div class="album" id="album">
        <div class="page">
          <Cover></Cover>
        </div>
        <div class="page">
          <New></New>
        </div>
        <div class="page">
          <Catalog :catalog="catalog"></Catalog>
        </div>
        <div class="page" v-for="(item, index) in poems">
          <Poem :id="item.id" :page="index + 4" :odd="index % 2 == 0" :sibling="sibling(index)"></Poem>
        </div>
        <div class="page">
          <Back></Back>
        </div>
      </div>
      <div class="writepad" v-show="writepad.show">
        <canvas id="writePad" :width="w" :height="h"></canvas>
      </div>
      <div class="music" :class="{'music-right': poemOdd, 'height': h}">
        <input type="file" id="musicFile" ref="musicFile" hidden accept="audio/*" @change="changeMusic" />
        <Player v-show="player.show"></Player>
      </div>
    </div>
    <div class="control top-control">
      <span class="note-btn" @click="addNote"><img src="~@/assets/images/note.png"/></span>
      <span class="write-btn" @click="addWrite"><img src="~@/assets/images/write.png"/></span>
    </div>
    <div class="control bottom-control">
      <span class="end-btn" @click="turnLast"><img src="~@/assets/images/backward.png"/></span>
      <span class="prev-btn" @click="turnNext"><img src="~@/assets/images/prev.png"/></span>
      <span class="shuffle-btn" @click="shufflePage"><img src="~@/assets/images/shuffle.png"/></span>
      <span class="page-current">{{ currentPage }} / {{ poems.length + 4 }}</span>
      <span class="catalog-btn" @click="turnPage(3)"><img src="~@/assets/images/catalog.png"/></span>
      <span class="next-btn" @click="turnPrev"><img src="~@/assets/images/next.png"/></span>
      <span class="home-btn" @click="turnFirst"><img src="~@/assets/images/forward.png"/></span>
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
import { getAllPoems, getCatalog, updateAnyPoem, getLastPoem, getAuthorPoem } from '@/api/poem'
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
      inited: false,
      w: 0,
      h: 0,
      catalog: [],
      poems: [],
      poemId: '',
      fromPage: 0,
      currentPage: 0,
      poemOdd: false,     // 左页或者右页，影响部分布局
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
        name: '',
        show: false
      },
      reader: {
        playing: false,
        list: [],
        index: -1
      },
      writepad: {
        show: false
      },
      loading: true
    }
  },
  mounted() {
    this.$bus.on('turnPage', this.turnPage)
    this.$bus.on('editPoem', this.editPoem)
    this.$bus.on('loadPoems', this.loadPoems)
    this.$bus.on('openAlbum', this.openAlbum)
    this.$bus.on('poemAdded', this.poemAdded)
    this.$bus.on('poemEdited', this.poemEdited)
    this.$bus.on('recordPoem', this.recordPoem)
    this.$bus.on('chooseImage', this.chooseImage)
    this.$bus.on('loadReads', this.loadReads)
    this.$bus.on('pauseReads', this.pauseReads)
    this.$bus.on('resumeReads', this.resumeReads)
    this.$bus.on('playMusic', this.playMusic)
    this.$bus.on('pauseMusic', this.pauseMusic)
    this.$bus.on('chooseMusic', this.chooseMusic)
    this.$bus.on('poemRecorded', this.poemRecorded)
    this.init()
  },
  updated () {
    if (!this.inited) {
      this.$nextTick(() => {
        this.initCropper()
        this.initTurn()
        this.initWritePad()
      })
      this.inited = true
    }
  },
  computed: {
    sibling () {
      return function (index) {
        if (index % 2 == 0) {
          if (index == this.poems.length - 1) {
            return ''
          }
          return this.poems[index + 1]._id
        } else {
          return this.poems[index - 1]._id
        }
      }
    }
  },
  methods: {
    init () {
      this.h = document.documentElement.clientHeight * .9
      this.w = this.h * 1.6
      this.loadPoems()
    },
    loadPoems () {
      getCatalog({}).then(res => {
        this.catalog = []
        res.forEach(author => {
          var item = {
            title: author._id,
            flag: true
          }
          this.catalog.push(item)
          author.poems.forEach(poem => {
            item = {
              id: poem.id,
              title: poem.title,
            }
            this.catalog.push(item)
          })
        })
        getAllPoems({}).then(poems => {
          this.poems = poems.map((poem, index) => {
            return {
              id: poem._id,
              title: poem.title,
              author: poem.author,
              author_desc: poem.author_desc,
              page: index + 4
            }
          })
          this.catalog.forEach(item => {
            var poem = null
            if (item.flag) {
              poem = this.poems.filter(function (p) {
                return p.author == item.title && p.author_desc != ''
              })[0]
            } else {
              poem = this.poems.filter(function (p) {
                return p.id == item.id
              })[0]
            }
            item.page = poem.page
          })
          if(this.inited) {
            this.initTurn()
          }
          this.loading = false
        })
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
    shufflePage () {
      const num = Math.floor(Math.random() * this.poems.length) + 4
      this.turnPage(num)
    },
    poemAdded () {
      this.loadPoems()
    },
    editPoem (id, page) {
      this.fromPage = page
      this.$bus.emit('loadPoem', id, page)
      // 跳到添加页
      this.turnPage(2)
    },
    // 编辑后处理
    poemEdited (id) {
      // 转回页面
      this.turnPage(this.fromPage)
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
        turnCorners: 'tl,tr',
        acceleration: true,
        elevation: 50,
        gradients: true,
        autoCenter: true
      })
      $('#album').bind("turning", (event, page, view) => {
        if (this.player.show) {
          this.$bus.emit('toggleMusic')
          this.$bus.emit('resetPoem', this.poemId)
          this.player.show = false
          this.currentPage = page
        }
      })
      $("#album").bind("start", function(event, pageObject, corner) {
        if (corner=="tl" || corner=="tr") {
          event.preventDefault();
        }
      })
      $('#album').bind("turned", (event, page, view) => {
        this.currentPage = page
      })
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
     * Poem Image 相关
     */
    // 打开文件选择
    chooseImage (id) {
      if (this.poemId == id && this.cropper.url != '') {
        this.cropper.show = true
      } else {
        this.selectImage()
      }
      this.poemId = id
    },
    selectImage () {
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
    /**
     * Poem Music 相关
     */
    // 打开文件选择
    chooseMusic (id) {
      this.selectMusic()
      this.poemId = id
    },
    selectMusic () {
      this.$refs.musicFile.click()
    },
    // 已选择文件
    changeMusic (e) {
      var files = e.target.files || e.dataTransfer.files
      if (!files.length) return
      this.uploadMusic(files[0])
    },
    // 上传文件
    uploadMusic (file) {
      const name = `${this.poemId}.mp3`
      var form = new FormData()
      form.append('type', 'musics')
      form.append('file', file, name)
      this.$http.post('/api/upload', form)
      const any = {
        'music': name
      }
      updateAnyPoem({'id': this.poemId, 'any': any}).then(res => {
        this.$bus.emit('refreshPoem', this.poemId)
      })
    },
    pauseMusic () {
      if (this.player.show) {
        this.$bus.emit('toggleMusic')
        this.player.show = !this.player.show
      }
    },
    playMusic (id, name, odd) {
      this.poemId = id
      this.poemOdd = odd
      if (this.player.name == name) {
        this.$bus.emit('toggleMusic')
        this.player.show = !this.player.show
      } else {
        this.$bus.emit('startMusic', this.$util.getFilePath('musics', name))
        this.player.show = true
      }
      this.player.name = name
    },
    /**
     * 录制朗读 相关
     */
    recordPoem (id) {
      this.recorder.show = true
      this.poemId = id
      this.$bus.emit('loadRecorder', id)
    },
    playRecords () {
      this.$bus.emit('playRecords')
    },
    emptyRecords () {
      this.$bus.emit('emptyRecords')
    },
    uploadRecords () {
      this.$bus.emit('uploadRecords')
    },
    poemRecorded () {
      this.recorder.show = false
    },
    /**
     * 播放朗读 相关
     */
    loadReads (id, list) {
      this.reader.index = -1
      this.poemId = id
      this.reader.list = list
      this.playReads()
    },
    pauseReads () {
      if (this.reader.playing) {
        this.$refs.readerAudio.pause()
        this.reader.playing = false
      }
    },
    resumeReads () {
      if (!this.reader.playing) {
        this.$refs.readerAudio.play()
        this.reader.playing = true
      }
    },
    playRead (item) {
      if (this.$refs.readerAudio) {
        this.$refs.readerAudio.src = this.$util.getFilePath('reads', this.poemId) + item.name
        this.$refs.readerAudio.play()
        this.reader.playing = true
        this.$refs.readerAudio.addEventListener('ended', this.stopReads);
      }
    },
    stopReads () {
      this.reader.playing = false
    },
    playReads () {
      if (this.reader.index == -1) {
        this.$refs.readerAudio.addEventListener('ended', this.playReads)
      }
      this.reader.index ++
      if (this.reader.index < this.reader.list.length) {
        this.playRead(this.reader.list[this.reader.index])
      } else  {
        this.reader.index = -1
        this.$refs.readerAudio.removeEventListener('ended', this.playReads)
      }
    },
    /**
     * 手写板 相关
     */
    addWrite () {
      this.writepad.show = !this.writepad.show
    },
    /**
     * 笔记 相关
     */
    addNote () {
      
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
      z-index: 2;
      cursor: pointer;
      .page {
        background: @page-bg;
      }
    }
    .writepad {
      .center-parent();
      background: @write-bg;
      z-index: 3;
    }
    .music {
      position: absolute;
      width: auto;
      bottom: calc(@page-pad - 4px);
      margin-left: calc(@page-pad + 5px);
      z-index: 3;
    }
    .music-right {
      left: 50%;
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
  .control {
    display: flex;
    flex-direction: row;
    z-index: 1;
    .center-horizontal();
    span {
      .image-btn();
      .dark-btn();
      .flash-btn();
      margin: 0px 8px;
    }
  }
  .top-control {
    top: 2px;
  }
  .bottom-control {
    bottom: 2px;
    .page-current {
      color: @text-white;
      .flex-center();
      width: 80px;
    }
  }
}
</style>
