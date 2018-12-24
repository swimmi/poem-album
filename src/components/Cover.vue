<template>
  <div class="cover" :style="{backgroundImage: 'url('+ bg + ')'}">
    <div class="cover-title" :class="{'animated bounceOut': isOpen}" @click="openAlbum">
      <span>{{ $str.title }}</span>
    </div>
    <div class="cover-spine">
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      isOpen: false,
      bg: 'static/images/bg/17.jpg'
    }
  },
  methods: {
    openAlbum () {
      this.isOpen = true
      this.$bus.emit('openAlbum', 1)
      setTimeout(() => {
        this.isOpen = false
      }, 1000)
    }
  }
}
</script>

<style lang="less" scoped>
.cover {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  background-color: white;
  background-repeat: no-repeat;
  background-position: 0 0;
  -webkit-user-select: none;
  //animation: bgFloat 120s ease-in-out infinite;
  .cover-title {
    position: absolute;
    top: 15%;
    left: 10%;
    background: @white-bg;
    box-shadow: @white-bg 0px 0px 4px;
    border: 4px @primary-color double;
    transition: all 1s;
    span {
      @size: 50px;
      display: block;
      width: @size;
      padding: 16px 8px;
      font-family: 'Weibei';
      font-size: @size;
      color: @primary-color;
      transition: all 1s;
      &:hover {
        color: @accent-color;
      }
    }
    &:hover {
      border: 4px @accent-color double;
      box-shadow: @white-bg 0px 0px 16px;
    }
  }
  .cover-spine {
    position: absolute;
    right: 24px;
    width: 16px;
    height: 100%;
    border-right: 1px @white-bg ridge;
    background: fade(@white-bg, 20%);
  }
}
</style>
