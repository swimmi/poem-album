<template>
  <div class="main">
    <audio src="" loop autoplay preload="true"/>
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
        <div class="modal cropper-container animated" v-show="cropper.show">
          <input type="file" hidden ref="imageFile" accept="image/*" @change="changeImage"/>
          <transition enter-active-class="fadeIn" leave-active-class="fadeIn">
            <div class="cropper">
              <img ref="cropperImage" :src="cropper.url"/>
            </div>
          </transition>
          <div class="cropper-btn btn-group">
            <span class="image-btn" @click="selectFile"><img src="~@/assets/images/image.png"/></span>
            <span class="image-btn" @click="cropper.show = false"><img src="~@/assets/images/close.png"/></span>
            <span class="image-btn" @click="uploadImage"><img src="~@/assets/images/ok.png"/></span>
          </div>
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
import Catalog from '@/components/Catalog'
import { getAllPoems, updateAnyPoem, getLastPoem } from '@/api/poem'
export default {
  name: 'Index',
  components: {
    Cover,
    Back,
    Poem,
    New,
    Catalog
  },
  data () {
    return {
      inited: false,
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
      writable: false,
      loading: true
    }
  },
  mounted() {
    this.$bus.on('addPoem', this.addPoem)
    this.$bus.on('editPoem', this.editPoem)
    this.$bus.on('openAlbum', this.openAlbum)
    this.$bus.on('poemEdited', this.poemEdited)
    this.$bus.on('chooseImage', this.chooseImage)
    this.init()
  },
  updated () {
    if (!this.inited) {
      this.initCropper()
      this.initTurn()
      this.inited = true
    }
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
    addPoem () {
      this.loadPoems()
    },
    editPoem (id, page) {
      this.poemPage = page
      this.$bus.emit('loadPoem', id)
      // 跳到添加页
      $('#album').turn('page', 2)
    },
    // 编辑后处理
    poemEdited (id) {
      // 转回页面
      $('#album').turn('page', this.poemPage)
      this.$bus.emit('refreshPoem', id)
    },
    openAlbum (page) {
      setTimeout(() => {
        $('#album').turn('page', page)
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
      this.$nextTick(() => {
        this.cropper.self = new Cropper(this.$refs.cropperImage, {
          aspectRatio: 3 / 2,
          viewMode: 1
        })
      })
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
      z-index: 99;
    }
    .cropper-container {
      .cropper {
        .center-parent();
        width: 800px;
        height: auto;
        img {
          max-width: 100%;
        }
      }
      .cropper-btn {
        .center-vertical();
        right: 120px;
      }
    }
  }
}
</style>
