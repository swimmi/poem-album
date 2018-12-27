<template>
  <div class="author-container">
    <div class="poem-item catalog-item">
      <span class="title">目录</span>
    </div>
    <div v-for="(item, index) in catalog" class="poem-item" :class="{'author-item': item.flag}">
      <marquee v-if="item.title.length > 10" class="title title-long" direction="up" scrollamount="5" @click="viewPoem(item.page)">{{ item.title }}</marquee>
      <span v-else class="title" @click="viewPoem(item.page)">{{ item.title }}</span>
      <span class="line"></span>
      <span class="page">{{ $util.parseNumber(item.page - 2) }}</span>
    </div>
  </div>
</template>
<script>
import data from '@/store/data'
export default {
  props: {
    catalog: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      periods: data.period
    }
  },
  mounted () {
  },
  methods: {
    viewPoem (page) {
      this.$bus.emit('turnPage', page)
    }
  }
}
</script>
<style lang="less" scoped>
.author-container {
  display: flex;
  flex-flow: row-reverse wrap;
  flex: 1;
  align-content: flex-start;
  height: calc(100% - @page-pad * 2); 
  width: calc(100% - @page-pad * 2);
  padding: @page-pad;
  .poem-item {
    .flex-center();
    flex-direction: column;
    @mg: 12px;
    height: calc(33% - @mg * 2);
    margin: @mg;
    .title {
      max-height: 30vh;
      overflow: hidden;
      color: @text-gray;
      margin-top: @mg;
      .v-text(16px);
      &:hover {
        color: @text-black;
      }
    }
    .line {
      flex: 1;
      width: 1px;
      margin: calc(@mg / 2) 0px;
      background-image: linear-gradient(to bottom, #aaa 0%, #fff 50%, transparent 100%);
      background-size: 1px 6px;
      background-repeat: repeat-y;
    }
    .page {
      color: @text-gray;
      .v-text(12px);
    }
  }
  .catalog-item {
    .title {
      color: @primary-color;
      .v-title(18px);
        &:hover {
          color: @text-red;
        }
    }
  }
  .author-item {
    .title {
      color: @vice-color;
      margin-top: 0px;
      .v-title(16px);
      &:hover {
        color: @primary-color;
      }
    }
  }
}
</style>
