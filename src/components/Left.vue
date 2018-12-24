<template>
  <div v-if="loading"></div>
  <div v-else class="poem">
    <div class="poem-spine-left" @click="toolbarShow = !toolbarShow"></div>
    <div class="poem-toolbar-left" @mouseenter="toolbarShow = true" @mouseleave="toolbarShow = false">
      <transition enter-active-class="flipInY" leave-active-class="flipOutY">
        <div class="poem-toolbar animated" v-show="toolbarShow">
          <div class="toolbar-btn image-btn" @click.stop="chooseImage"><img src="~@/assets/images/image.png" /></div>
          <div class="toolbar-btn done-btn" @click.stop="actionDone"><img src="~@/assets/images/done.png" /></div>
        </div>
      </transition>
    </div>
    <div class="poem-images">
      <input hidden type="file" id="chooseImage" ref="chooseImage" accept="image" @change="changeImage"/>
      <div class="cropper-box" v-show="cropperShow">
        <img ref="Image" id="image" :src="imageUrl" />
      </div>
    </div>
  </div>
</template>
<script>
import 'cropperjs/dist/cropper.css'
import Cropper from 'cropperjs'
export default {
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      images: [],
      imageUrl: '',
      imageTypes: "image/gif, image/jpeg, image/png, image/jpg",
      cropperShow: false,
      cropper: null,
      toolbarShow: false,
      action: '',
      loading: true
    }
  },
  mounted () {
    this.init()
    this.initCropper()
  },
  methods: {
    init () {
      this.loading = false
    },
    initCropper () {
      this.$nextTick(() => {
        this.cropper = new Cropper(this.$refs.Image, {
          aspectRatio: 2 / 3,
          viewMode: 1,
          movable: false
        })
      })
    },
    chooseImage () {
      this.$refs.chooseImage.click()
    },
    changeImage (e) {
      var files = e.target.files || e.dataTransfer.files
      if (!files.length) return
      const type = files[0].type
      if (this.imageTypes.indexOf(type) == -1) {
        this.$bus.emit('message', this.$str.select_image_tip)
        return false
      }
      this.imageUrl = this.$util.getObjectURL(files[0])
      this.cropper.replace(this.imageUrl)
      this.cropperShow = true
      this.action = 'image'
    },
    uploadImage (blob) {
      const config = {
        headers: {'Content-Type': 'multipart/form-data'}
      }
      var form = new FormData()
      const name = '1.jpg'
      form.append('type', 'images')
      form.append('id', this.id)
      form.append('file', blob, name)
      this.$http.post('/api/upload', form, config).then(res => {
        console.log(res)
      })
    },
    addImage () {
      this.cropperShow = false
      const url = this.cropper.getCroppedCanvas().toDataURL()
      this.images.push(url)
      this.cropper.getCroppedCanvas().toBlob((blob) => {
        this.uploadImage(blob)
      })
    },
    actionDone () {
      switch (this.action) {
        case 'image':
          this.addImage()
          break
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
  .poem-images {
    position: relative;
    width: 100%;
    height: 100%;
    .flex-center();
  }
  .poem-spine {
    position: absolute;
    left: calc(50% - 48px);
    top: 0px;
    width: 48px;
    height: 100%;
    .hover-fade();
    &:hover {
      background-color: @light-bg;
    }
  }
  .poem-toolbar-left {
    .poem-toolbar(@vice-color, 1)
  }
  .poem-spine-left {
    .poem-spine(1)
  }
  .cropper-box {
    .center-parent();
    width: 100%;
    height: 100%;
    img {
      max-width: 100%;
    }
  }
}
</style>
