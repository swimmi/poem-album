<!-- 再见！2018 -->
<!-- 你好！2019 -->
<template>
  <div class="main">
    <div class="modal animated fadeIn" v-show="cropper.show">
      <input type="file" hidden ref="imageFile" accept="image/*" @change="changeImage"/>
      <div class="modal-wrapper cropper">
        <img ref="cropperImage" :src="cropper.url"/>
      </div>
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
        <span class="image-btn" @click="closeRecorder"><img src="~@/assets/images/close.png"/></span>
        <span class="image-btn" @click="uploadRecords"><img src="~@/assets/images/ok.png"/></span>
      </div>
    </div>
    <div class="modal animated fadeIn" v-show="reader.listShow">
      <div class="modal-wrapper recorder">
        <div class="reader-list-container">
          <div class="reader-list-item" v-for="(poem, index) in reader.list" :key="index"><span>{{ poem.title }}</span></div>
        </div>
      </div>
      <div class="modal-btn btn-group">
        <span class="modal-title">{{ $str.read_list }}</span>
        <span class="image-btn" @click="reader.listShow = false"><img src="~@/assets/images/close.png"/></span>
        <span class="image-btn" @click=""><img src="~@/assets/images/ok.png"/></span>
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
        <span class="read-btn"
          v-show="canRead"
          @click="toggleTool('read')">
          <img src="~@/assets/images/read.png"/>
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
            <div class="toolbar-panel-btn">
              <span class="image-btn" @click="undoWrite"><img src="~@/assets/images/undo.png"/></span>
              <span class="image-btn" @click="redoWrite"><img src="~@/assets/images/redo.png"/></span>
              <span class="image-btn" @click="clearWrite"><img src="~@/assets/images/remove.png"/></span>
            </div>
          </div>
        </transition>
        <transition enter-active-class="fadeInRight" leave-active-class="fadeOutRight">
          <div class="toolbar-panel search-panel animated" v-show="toolbar.action == 'search'">
            <div class="toolbar-panel-main animated" :class="{'shake': search.noResult}">
              <input v-model="search.keyword" type="text" class="search-input toolbar-input" :placeholder="$str.search_tip" @keyup.enter="doSearch"/>
              <span v-show="search.showCount" class="search-result-count">{{ $str.search_count.format(resultCount) }}</span>
            </div>
            <span class="image-btn" @click="doSearch"><img src="~@/assets/images/ok.png"/></span>
            <span class="image-btn" @click="cleanSearch"><img src="~@/assets/images/close.png"/></span>
          </div>
        </transition>
        <transition enter-active-class="fadeInRight" leave-active-class="fadeOutRight">
          <div class="toolbar-panel read-panel animated" v-show="toolbar.action == 'read'">
            <div class="toolbar-panel-main animated" >
              <span class="image-btn" @click="changeReadStyle"><img :src="readerPlayIcon" /></span>
              <span class="image-btn" @click="alterReadPoem(false)"><img src="~@/assets/images/prev_one.png" /></span>
              <span class="image-btn" @click="alterReadText(false)"><img src="~@/assets/images/prev.png" /></span>
              <marquee v-if="readerText && readerText.length > 20" class="reader-text reader-text-long" scrollamount="5">{{ readerText }}</marquee>
              <span v-else class="reader-text">{{ readerText }}</span>
              <span class="image-btn" @click="alterReadText(true)"><img src="~@/assets/images/next.png" /></span>
              <span class="image-btn" @click="alterReadPoem(true)"><img src="~@/assets/images/next_one.png" /></span>
              <span class="image-btn" @click="reader.listShow = true"><img src="~@/assets/images/play_list.png" /></span>
            </div>
            <span class="image-btn" @click="toggleReads">
              <img v-if="reader.playing" src="~@/assets/images/pause.png" />
              <img v-else src="~@/assets/images/play.png" />
            </span>
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
          <section><Dashboard></Dashboard></section>
          <section><New></New></section>
        </div>
        <div class="page">
          <div v-if="loadingCatalog"></div>
          <Catalog v-else :catalog="catalog"></Catalog>
        </div>
        <div class="page" v-for="(item, index) in poems">
          <Poem :poem="item"></Poem>
        </div>
        <div class="page">
          <Back></Back>
        </div>
      </div>
      <div class="write" v-show="write.show">
        <canvas id="writePad" :width="w" :height="h"></canvas>
      </div>
      <div class="music" v-show="currentPage > 3">
        <input type="file" id="musicFile" ref="musicFile" hidden accept="audio/*" @change="changeMusic" />
        <Player></Player>
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
import Dashboard from '@/components/Dashboard'
import { getAllPoems, getCatalog, updateAnyPoem, searchPoem } from '@/api/poem'
export default {
  name: 'Index',
  components: {
    Cover,
    Back,
    Poem,
    New,
    Catalog,
    Recorder,
    Player,
    Dashboard
  },
  data () {
    return {
      inited: false,
      w: 0,
      h: 0,
      catalog: [],
      poems: [],
      poemIndex: 0,
      fromPage: 0,
      newPoem: null,
      currentPage: 0,
      cropper: {
        self: null,
        url: '',
        show: false
      },
      recorder: {
        show: false
      },
      reader: {
        started: false,
        playing: false,
        listShow: false,
        list: [],
        index: -1,
        tIndex: -1,
        style: 0,
        styleTypes: ['order', 'loop', 'loop_one', 'shuffle']
      },
      write: {
        pad: null,
        show: false,
        color: 'black',
        colors: ['black', 'white', 'red', 'yellow'],
        stroke: 1,
        strokes: [1, 2, 3],
        data: [],
        index: 0,
        undoable: false,
        redoable: false
      },
      toolbar: {
        inited: false,
        show: true,
        action: '',
      },
      search: {
        showCount: true,
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
    this.$bus.on('reloadPoem', this.reloadPoem)
    this.$bus.on('loadPoems', this.loadPoems)
    this.$bus.on('openAlbum', this.openAlbum)
    this.$bus.on('poemEdited', this.poemEdited)
    this.$bus.on('recordPoem', this.recordPoem)
    this.$bus.on('addReadPoem', this.addReadPoem)
    this.$bus.on('chooseImage', this.chooseImage)
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
    poem () {
      return this.poems[this.poemIndex]
    },
    readerPoem () {
      if (this.reader.index == -1) {
        return null
      } else {
        return this.reader.list[this.reader.index]
      }
    },
    readerText () {
      if (this.readerPoem == null || this.reader.tIndex == -1) {
        return this.$str.end
      } else {
        return this.readerPoem.texts[this.reader.tIndex] || this.$str.end
      }
    },
    readerRead () {
      if (this.readerPoem == null || this.reader.tIndex == -1) {
        return null
      } else {
        return this.readerPoem.reads[this.reader.tIndex]
      }
    },
    readerPlayIcon () {
      return require('@/assets/images/play_' + this.reader.styleTypes[this.reader.style] + '.png')
    },
    canNote () {
      return (this.toolbar.action == '' || this.toolbar.action == 'note') && this.currentPage > 3
    },
    canWrite () {
      return (this.toolbar.action == '' || this.toolbar.action == 'write') && this.currentPage > 3
    },
    canSearch () {
      return (this.toolbar.action == '' || this.toolbar.action == 'search')
    },
    canRead () {
      return (this.toolbar.action == '' || this.toolbar.action == 'read') && this.reader.list.length > 0
    },
    resultCount () {
      var count = 0
      if (this.toolbar.action == 'search' && this.search.showCount) {
        count = this.catalog.filter((item) => {
          return !item.flag
        }).length
      }
      return count
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
        poems.forEach((poem, index) => {
          poem.id = poem._id
          poem.page = index + 4
          var image = ''
          if (poem.image) {
            image = this.$util.getFilePath('images') + poem.image
          } else {
            image = 'static/images/default.jpg'
          }
          poem.image = image
          if (poem.status.reading) {
            this.addReadPoem(poem)
          }
        })
        this.poems = poems
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
    // 初始化翻页器
    initTurn () {
      $('#album').turn({
        width: this.w,
        height: this.h,
        direction: 'rtl',
        display: 'single',
        turnCorners: 'tl,tr',
        acceleration: true,
        elevation: 10,
        gradients: true,
        autoCenter: true
      })
      $('#album').bind("turning", (event, page, view) => {
        this.$bus.emit('stopMusic')
        this.currentPage = page
        if (page > 3 && page < $('#album').turn('pages') - 1) {
          this.poemIndex = page - 4
          if (this.poem.music) {
            this.$bus.emit('loadMusic', this.poem.music)
          }
        }
      })
      $("#album").bind("start", function(event, pageObject, corner) {
        if (corner=="tl" || corner=="tr") {
          event.preventDefault();
        }
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
        this.write.redoable = false
        this.write.undoable = true
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
    chooseImage () {
      if (this.cropper.url != '') {
        this.cropper.show = true
      } else {
        this.selectImage()
      }
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
      this.cropper.show = false
      const name = `${this.poem.id}.png`
      this.cropper.self.getCroppedCanvas().toBlob((blob) => {
        var form = new FormData()
        form.append('type', 'images')
        form.append('file', blob, name)
        this.$http.post('/api/upload', form).then(res => {
          const any = {
            'image': name
          }
          updateAnyPoem({'id': this.poem.id, 'any': any}).then(res => {
            this.poem.image = this.$util.getFilePath('images') + name
            this.$bus.emit('reloadImage', this.poem.id)
          })
        })
      })
    },
    /**
     * Poem Music 相关
     */
    // 打开文件选择
    chooseMusic () {
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
      const name = `${this.poem.id}.mp3`
      var form = new FormData()
      form.append('type', 'musics')
      form.append('file', file, name)
      this.$http.post('/api/upload', form)
      const any = {
        'music': name
      }
      updateAnyPoem({'id': this.poem.id, 'any': any}).then(res => {
        this.poem.music = name
        this.$bus.emit('loadMusic', name)
      })
    },
    /**
     * 录制朗读 相关
     */
    recordPoem () {
      this.recorder.show = true
      this.$bus.emit('loadRecorder', this.poem)
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
    closeRecorder () {
      this.recorder.show = false
      localStream.getAudioTracks()[0].stop()
    },
    /**
     * 播放朗读 相关
     */
    toggleReads () {
      if (!this.reader.started) {
        this.readText()
        this.reader.started = true
      } else {
        if (this.reader.playing) {
          this.$refs.readerAudio.pause()
        } else {
          this.$refs.readerAudio.play()
        }
        this.reader.playing = !this.reader.playing
      }
    },
    alterReadText (flag) {
      if (!flag) {
        this.reader.tIndex -= 2
      }
      if (this.reader.tIndex < -2) {
        this.reader.tIndex = this.readerPoem.texts.length - 1
      }
      if (this.reader.tIndex > this.readerPoem.texts.length - 1) {
        this.reader.tIndex = 0
      }
      this.readText()
    },
    alterReadPoem (flag) {
      this.reader.index += (flag ? 1 : -1)
      if (this.reader.index < 0) {
        this.reader.index = this.reader.list.length - 1
      }
      if (this.reader.index > this.reader.list.length - 1) {
        this.reader.index = 0
      }
      this.reader.tIndex = -1
      this.readText()
    },
    resetReads () {
      this.$refs.readerAudio.src = ''
      this.reader.playing = false
      this.reader.index = -1
      this.reader.tIndex = -1
      this.reader.list = []
    },
    readText () {
      if (this.$refs.readerAudio) {
        if (this.reader.index == -1) {
          this.reader.index = 0
        }
        if (this.reader.tIndex < this.readerPoem.texts.length -1) {
          this.reader.tIndex ++
          this.$refs.readerAudio.src = this.$util.getFilePath('reads', this.readerPoem.id) + this.readerRead.name
          this.$refs.readerAudio.play()
          this.reader.playing = true
          // 播放下一句
          this.$refs.readerAudio.addEventListener('ended', this.readText)
        } else {
          // 播放下一首
          switch (this.reader.style) {
            case 0:   // 列表播放，不循环
              this.$refs.readerAudio.removeEventListener('ended', this.readText)
              if (this.reader.index < this.reader.list.length - 1) {
                this.$refs.readerAudio.addEventListener('ended', this.handleRead('next'))
              } else {
                this.endRead()
              }
              break
            case 1:   // 列表播放，循环
              if (this.reader.index < this.reader.list.length - 1) {
                this.$refs.readerAudio.removeEventListener('ended', this.readText)
                this.$refs.readerAudio.addEventListener('ended', this.handleRead('next'))
              } else {
                this.$refs.readerAudio.removeEventListener('ended', this.readText)
                this.$refs.readerAudio.addEventListener('ended', this.handleRead('loop_list'))
              }
              break
            case 2:   // 单曲播放，循环
              this.$refs.readerAudio.addEventListener('ended', this.handleRead)
              break
            case 3:   // 随机播放
              this.$refs.readerAudio.removeEventListener('ended', this.readText)
              this.$refs.readerAudio.addEventListener('ended', this.handleRead('shuffle'))
              break
          }
        }
      }
    },
    handleRead (flag) {
      switch (flag) {
        case 'loop_list':
          this.reader.index = -1
          break
        case 'next':
          this.reader.index ++
          break
        case 'shuffle':
          var list = this.reader.list.concat()
          list.splice(list.indexOf(this.readerPoem), 1)
          const p = list[Math.floor(Math.random() * list.length)]
          this.reader.index = this.reader.list.indexOf(p)
          break
      }
      this.reader.tIndex = -1
      this.$refs.readerAudio.removeEventListener('ended', this.handleRead.bind(flag))
      this.readText()
    },
    endRead () {
      this.reader.started = false
      this.reader.playing = false
      this.reader.tIndex = -1
      this.reader.index = -1
    },
    changeReadStyle () {
      this.reader.style ++
      if (this.reader.style == this.reader.styleTypes.length) {
        this.reader.style = 0
      }
    },
    // 添加到播放列表
    addReadPoem (poem) {
      if (poem.status.reading) {
        var content = poem.content
        if (poem.prologue) {
          content = poem.prologue + content
        }
        var texts = this.$util.splitToSentences(content.replace(/#/g, ''))
        texts.unshift(poem.title, poem.author)
        poem.texts = texts
        this.reader.list.push(poem)
      }
    },
    /**
     * 工具栏 相关
     */
    toggleTool (action) {
      switch (action) {
        case 'write':
          if (this.write.show) {
            this.saveWrite()
          } else {
            this.loadWrite()
          }
          this.write.show = !this.write.show
          break
        case 'read':
          this.reader.show = !this.reader.show
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
        this.search.showCount = true
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
    cleanSearch () {
      this.search.keyword = ''
      this.doSearch()
      this.toggleTool('search')
    },
    /**
     * 手写板 相关
     */
    loadWrite () {

    },
    saveWrite () {
      var data = this.write.pad.toDataURL('image/jpeg')
      var dataArray = []
      dataArray.push(data)
      const any = {
        'writes': dataArray
      }
    },
    undoWrite () {
      if (this.write.index > 0) {
        this.write.index --
        const data = this.write.data[this.write.index]
        this.write.pad.clear()
        this.write.pad.fromData(data)
      } else {
        this.clearWrite()
      }
    },
    redoWrite () {
      if (this.write.index < this.write.data.length - 1) {
        this.write.index ++
        const data = this.write.data[this.write.index]
        this.write.pad.clear()
        this.write.pad.fromData(data)
      }
    },
    clearWrite () {
      this.write.pad.clear()
      this.write.index = - 1
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
        display: flex;
        background: @page-bg;
        section {
          flex: 1;
          position: relative;
        }
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
      height: calc(100% - @page-pad * 2);
      bottom: @page-pad;
      margin-left: @page-pad;
      z-index: 3;
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
      .reader-list-container {
        background: @white-bg;
        padding: @page-pad;
        height: calc(100% - @page-pad * 2);
        .reader-list-item {
          line-height: 32px;
        }
      }
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
      color: @text-white;
      .toolbar-panel {
        display: flex;
        width: 800px;
        .toolbar-panel-main {
          position: relative;
          flex: 1;
          .flex-center();
          .shape-container {
            margin: 0px 8px;
          }
        }
        .toolbar-panel-btn {
          display: flex;
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
        .search-result-count {
          position: absolute;
          right: 32px;
        }
      }
      .read-panel {
        .flex-center();
        .reader-text {
          width: 360px;
          font-size: 18px;
          text-align: center;
          .flash-text();
        }
      }
    }
  }
}
</style>
