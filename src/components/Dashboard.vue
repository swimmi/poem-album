<template>
  <div class="dashboard"></div>
</template>
<script>
export default {
  
}
</script>
<style lang="less" scoped>
.dashboard {
  position: absolute;
  height: calc(100% - @page-pad / 2);
  width: calc(100% - @page-pad * 2);
  padding: 0 @page-pad;
  padding-top: @page-pad / 2;
  background: @accent-color;
}
</style>
