<template>
  <div class="catalog">
    <div class="item-container">
      <div v-for="(item, index) in pageCatalog[page]" class="poem-item" :class="{'author-item': item.flag}">
        <marquee v-if="item.title.length > 10" class="title title-long" direction="up" scrollamount="5" @click="viewPoem(item.page)">{{ item.title }}</marquee>
        <span v-else class="title" @click="viewPoem(item.page)">{{ item.title }}</span>
        <span class="line"></span>
        <span class="page">{{ $util.parseNumber(item.page - 2) }}</span>
      </div>
    </div>
    <div class="catalog-title">
      <span class="image-btn" :class="{'invisible': page >= pageCatalog.length - 1 }" @click="page ++"><img src="~@/assets/images/left.png" /></span>
      <span>{{ $str.catalog }}</span>
      <span class="image-btn" :class="{'invisible': page <= 0}" @click="page --"><img src="~@/assets/images/right.png" /></span>
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
      pageCatalog: [],
      periods: data.period,
      pageSize: 27 * 3,
      page: 0
    }
  },
  created () {
    this.pageCatalog = []
    for (var i = 0; i < this.catalog.length; i += this.pageSize) {
      this.pageCatalog.push(this.catalog.slice(i, i + this.pageSize))
    }
  },
  methods: {
    viewPoem (page) {
      this.$bus.emit('turnPage', page)
    }
  }
}
</script>
<style lang="less" scoped>
.catalog {
  height: calc(100% - @page-pad); 
  width: calc(100% - @page-pad * 2);
  padding: @page-pad / 2 @page-pad;
  .item-container {
    display: flex;
    flex-flow: row-reverse wrap;
    flex: 1;
    align-content: flex-start;
    width: 100%;
    height: 100%;
    .poem-item {
      .flex-center();
      flex-direction: column;
      @mg: 10px;
      height: calc(33% - @mg * 2);
      margin: @mg / 2;
      .title {
        max-height: 30vh;
        overflow: hidden;
        color: @text-gray;
        margin: 0px @mg;
        margin-top: @mg;
        .v-text(16px);
        &:hover {
          color: @text-black;
        }
      }
      .line {
        flex: 1;
        width: 1px;
        margin: @mg / 2 0px;
        background-image: linear-gradient(to bottom, #aaa 0%, #fff 50%, transparent 100%);
        background-size: 1px 5px;
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
  .catalog-title {
    display: flex;
    .center-horizontal();
    bottom: 4px;
    span {
      align-self: center;
      margin: 0px 8px;
      color: @primary-color;
      .h-text(16px);
    }
  }
}
</style>
