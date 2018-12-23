<template>
  <div class="left">
    左面
  </div>
</template>

<script>
export default {
  props: {
    id: {
      type: String,
      required: true
    }
  }
}
</script>

<style lang="less" scoped>
.left {
  padding: @page-pad;
}
</style>
