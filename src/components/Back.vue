<template>
  <div class="back" :style="{backgroundImage: 'url('+ bg + ')'}">
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
  }
}
</script>

<style lang="less" scoped>
.back {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  background-color: white;
  -webkit-user-select: none;
  .float-bg(90s);
  .cover-spine {
    position: absolute;
    left: 24px;
    width: 16px;
    height: 100%;
    border-right: 1px @white-bg ridge;
    background: fade(@white-bg, 20%);
  }
}
</style>
