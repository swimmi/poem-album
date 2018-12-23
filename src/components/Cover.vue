<template>
  <div class="cover" :style="{backgroundImage: 'url('+ bg + ')'}">
    <div class="cover-title">
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
      bg: 'static/images/bg/10.jpg'
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
  background-size: auto 200vh;
  background-position: 0px 0%;
  -webkit-user-select: none;
  animation: bgFloat 120s ease-in-out infinite;
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
