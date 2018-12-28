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
    <div class="toolbar top-toolbar animated fadeInLeft">
      <div class="toolbar-btn-container" :class="{'toolbar-in-left': toolbar.show && toolbar.inited, 'toolbar-out-left': !toolbar.show}">
        <span class="note-btn"
          v-show="canNote"
          @click="toggleTool('note')">
          <img src="~@/assets/images/note.png"/>
        </span>
        <span class="write-btn"
          v-show="canWrite"
          @click="toggleTool('write')">
          <img src="~@/assets/images/write.png"/>
        </span>
        <span class="search-btn"
          v-show="canSearch"
          @click="toggleTool('search')">
          <img src="~@/assets/images/search.png"/>
        </span>
      </div>
      <div class="toolbar-panel-container">
        <transition enter-active-class="fadeInRight" leave-active-class="fadeOutRight">
          <div class="toolbar-panel write-panel animated" v-show="toolbar.action == 'write'">
            <div class="toolbar-panel-main animated">
              <div class="shape-container">
                <span class="shape-btn circle animated fadeInRight" :class="{'shape-on': write.color == color}" v-for="(color, index) in write.colors" @click="write.color = color">
                  <span class="color" :style="{background: color}"></span>
                </span>
              </div>
              <div class="shape-container">
                <span class="shape-btn square animated fadeInRight" :class="{'shape-on': write.stroke == stroke}" v-for="(stroke, index) in write.strokes" @click="write.stroke = stroke">
                  <span class="stroke" :style="{height: stroke + 'px', background: write.color}"></span>
                </span>
              </div>
            </div>
            <span class="image-btn" @click="undoWrite"><img src="~@/assets/images/undo.png"/></span>
            <span class="image-btn" @click="redoWrite"><img src="~@/assets/images/redo.png"/></span>
          </div>
        </transition>
        <transition enter-active-class="fadeInRight" leave-active-class="fadeOutRight">
          <div class="toolbar-panel search-panel animated" v-show="toolbar.action == 'search'">
            <div class="toolbar-panel-main animated" :class="{'shake': search.noResult}">
              <input v-model="search.keyword" type="text" class="search-input toolbar-input" :placeholder="$str.search_tip" @keyup.enter="doSearch"/>
            </div>
            <span class="image-btn" @click="doSearch"><img src="~@/assets/images/ok.png"/></span>
          </div>
        </transition>
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
          <div v-if="loadingCatalog"></div>
          <Catalog v-else :catalog="catalog"></Catalog>
        </div>
        <div class="page" v-for="(item, index) in poems">
          <Poem :id="item.id" :page="index + 4" :odd="index % 2 == 0" :sibling="sibling(index)"></Poem>
        </div>
        <div class="page">
          <Back></Back>
        </div>
      </div>
      <div class="write" v-show="write.show">
        <canvas id="writePad" :width="w" :height="h"></canvas>
      </div>
      <div class="music" :class="{'music-right': poemOdd, 'height': h}">
        <input type="file" id="musicFile" ref="musicFile" hidden accept="audio/*" @change="changeMusic" />
        <Player v-show="player.show"></Player>
      </div>
    </div>
    <div class="toolbar bottom-toolbar animated fadeInRight">
      <div class="toolbar-btn-container">
        <span class="end-btn" @click="turnLast"><img src="~@/assets/images/backward.png"/></span>
        <span class="prev-btn" @click="turnNext"><img src="~@/assets/images/prev.png"/></span>
        <span class="shuffle-btn" @click="shufflePage"><img src="~@/assets/images/shuffle.png"/></span>
        <span class="page-current">{{ currentPage }} / {{ poems.length + 4 }}</span>
        <span class="catalog-btn" @click="turnPage(3)"><img src="~@/assets/images/catalog.png"/></span>
        <span class="next-btn" @click="turnPrev"><img src="~@/assets/images/next.png"/></span>
        <span class="home-btn" @click="turnFirst"><img src="~@/assets/images/forward.png"/></span>
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
import { getAllPoems, getCatalog, updateAnyPoem, getLastPoem, getAuthorPoem, searchPoem } from '@/api/poem'
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
      write: {
        pad: null,
        show: false,
        color: 'black',
        colors: ['black', 'white', 'red', 'yellow', '#6e7bb3e5'],
        stroke: 1,
        strokes: [1, 2, 3],
        data: [],
        index: 0,
      },
      toolbar: {
        inited: false,
        show: true,
        action: '',
      },
      search: {
        noResult: false,
        keyword: ''
      },
      loadingCatalog: true,
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
  watch: {
    'write.color': function(val){
      this.write.pad.penColor = val
    },
    'write.stroke': function(val){
      this.write.pad.minWidth = val
      this.write.pad.maxWidth = val * 2
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
    },
    canNote () {
      return (this.toolbar.action == '' || this.toolbar.action == 'note') && this.currentPage > 3
    },
    canWrite () {
      return (this.toolbar.action == '' || this.toolbar.action == 'write') && this.currentPage > 3
    },
    canSearch () {
      return (this.toolbar.action == '' || this.toolbar.action == 'search')
    }
  },
  methods: {
    init () {
      this.h = document.documentElement.clientHeight - 128
      this.w = this.h * 1.6
      this.loadPoems()
    },
    loadPoems () {
      getCatalog({}).then(res => {
        this.loadCatalog(res)
        if (this.inited) {
          this.h = document.documentElement.clientHeight - 128
          this.w = this.h * 1.6
          $("#album").turn('resize')
        }
      })
    },
    loadCatalog (res) {
      this.loadingCatalog = true
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
        this.loadingCatalog = false
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
        }
        this.currentPage = page
        this.toolbar.action = ''
        this.toolbar.show = true
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
      this.write.pad = new SignaturePad(canvas)
      this.write.pad.toDataURL("image/jpeg")
      this.write.data = []
      this.write.index = -1
      this.write.pad.onEnd = (e) => {
        const d = this.write.pad.toData()
        const len = this.write.data.length - this.write.index - 1
        this.write.data.splice(this.write.index + 1, len, d.concat())
        this.write.index = this.write.data.length - 1
        console.log(this.write.data)
      }
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
     * 工具栏 相关
     */
    toggleTool (action) {
      switch (action) {
        case 'write':
          this.write.show = !this.write.show
          break
      }
      if (!this.toolbar.inited) {
        this.toolbar.inited = true
      }
      if (this.toolbar.show) {
        this.toolbar.action = action
      } else {
        this.toolbar.action = ''
      }
      this.toolbar.show = !this.toolbar.show
    },
    doSearch () {
      searchPoem(this.search.keyword).then(res => {
        if (res.length > 0) {
          this.loadCatalog(res)
          this.turnPage(3)
        } else {
          this.search.noResult = true
          setTimeout(() => {
            this.search.noResult = false
          }, 1000)
        }
      })
    },
    undoWrite () {
      if (this.write.index > 0) {
        this.write.index --
        const data = this.write.data[this.write.index]
        this.write.pad.clear()
        this.write.pad.fromData(data)
      } else {
        this.write.index = -1
        this.write.pad.clear()
      }
    },
    redoWrite () {
      if (this.write.index < this.write.data.length - 1) {
        this.write.index ++
        const data = this.write.data[this.write.index]
        this.write.pad.clear()
        this.write.pad.fromData(data)
      }
    }
  }
}
</script>
<style lang="less" scoped>
.main {
  position: relative;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: @dark-bg;
  -webkit-user-select: none;
  overflow: hidden;
  .flex-center();
  .content {
    flex: 1;
    position: relative;
    .album {
      z-index: 2;
      cursor: pointer;
      .page {
        background: @page-bg;
      }
    }
    .write {
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
  .toolbar {
    position: relative;
    height: 64px;
    .flex-center();
    z-index: 1;
    animation-delay: 1s;
    .toolbar-btn-container {
      position: relative;
      display: flex;
      flex-direction: row;
      span {
        .image-btn();
        .dark-btn();
        .flash-btn();
        margin: 0px 8px;
      }
      .page-current {
        color: @text-white;
        .flex-center();
        width: 80px;
      }
    }
    .toolbar-panel-container {
      .toolbar-panel {
        display: flex;
        width: 600px;
        .toolbar-panel-main {
          flex: 1;
          .flex-center();
          .shape-container {
            margin: 0px 8px;
          }
        }
      }
      .write-panel {
        .shape-container {
          display: flex;
        }
      }
      .search-panel {
        .search-input {
          flex: 1;
        }
      }
    }
  }
}
</style>
