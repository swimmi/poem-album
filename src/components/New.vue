<template>
  <div v-if="loading"></div>
  <div v-else class="new-poem">
    <div class="header">
      <span v-if="poem._id" class="btn title back" @click="back">{{ $str.back }}</span>
      <span v-else class="btn title">{{ $str.new }}</span>
      <span class="btn submit" @click="submit">{{ $str.submit }}</span>
    </div>
    <div class="input-container">
      <div class="input-group">
        <span class="input-label required">{{ $str.poem_type }}</span>
        <span class="input-control switch" @click="switchShi"><span :class="{'on': poem.shi}">{{ $str.shi }}</span><span :class="{'on': !poem.shi}">{{ $str.ci }}</span></span>
        <span class="input-label label-inline">{{ poem.shi ? $str.poem_category : $str.poem_cipai }}</span>
        <select class="input-control" v-if="poem.shi" v-model="poem.type">
          <option v-for="(item, index) in types" :value="item.title">{{ item.title }}</option>
        </select>
        <input v-else class="input-control" type="text" v-model="poem.type" @keyup="inputCiPai"/>
      </div>
      <div class="input-group">
        <span class="input-label required">{{ $str.poem_title }}</span>
        <input class="input-control" :class="{'error-input': hasSameTitle }" type="text" v-model="poem.title" :placeholder="poem.shi ? '' : $str.poem_cipai_tip" @blur="checkTitle"/>
      </div>
      <div class="input-group">
        <span class="input-label">{{ $str.poem_prologue }}</span>
        <textarea class="input-control" type="text" rows="2" v-model="poem.prologue" onpaste="return false;"></textarea>
      </div>
      <div class="input-group">
        <span class="input-label required">{{ $str.poem_author }}</span>
        <input class="input-control" type="text" v-model="poem.author" />
        <span class="input-label label-inline required">{{ $str.poem_period }}</span>
        <select class="input-control period" v-model="poem.period">
          <option v-for="(item, index) in periods" :value="item.id">{{ item.title }}</option>
        </select>
      </div>
      <div class="input-group">
        <span class="input-label">{{ $str.poem_author_desc }}</span>
        <textarea class="input-control" type="text" rows="3" v-model="poem.author_desc" onpaste="return false;"></textarea>
      </div>
      <div class="input-group">
        <span class="input-label required">{{ $str.poem_content }}</span>
        <textarea class="input-control" type="text" rows="7" v-model="poem.content" onpaste="return false;"></textarea>
      </div>
      <div class="input-group">
        <span class="input-label">{{ $str.poem_annotation }}</span>
        <textarea class="input-control" type="text" rows="4" v-model="poem.annotation" onpaste="return false;"></textarea>
      </div>
      <div class="input-group">
        <span class="input-label">{{ $str.poem_desc }}</span>
        <textarea class="input-control" type="text" rows="4" v-model="poem.desc" onpaste="return false;"></textarea>
      </div>
    </div>
  </div>
</template>
<script>
import data from '@/store/data'
import { addPoem, updatePoem, getPoem, getTitlePoem } from '@/api/poem'
export default {
  data () {
    return {
      poem: {
        shi: true,
        type: '',
        title: '',
        period: '',
        author: '',
        author_desc: '',
        prologue: '',
        content: '',
        desc: '',
        annotation: '',
      },
      poemPage: 0,
      hasSameTitle: false,
      types: data.type,
      periods: data.period,
      loading: true
    }
  },
  mounted () {
    this.$bus.on('loadPoem', this.loadPoem)
    this.$bus.on('submitPoem', this.submit)
    this.loading = false
  },
  methods: {
    switchShi () {
      this.poem.shi = !this.poem.shi
      this.poem.type = ''
    },
    inputCiPai () {
      this.poem.title = this.poem.type
    },
    loadPoem (poem, page) {
      this.poemPage = page
      this.loading = true
      setTimeout(() => {
        this.poem = poem
        this.loading = false
      }, 100)
    },
    checkTitle () {
      if (this.poem.shi) {
        getTitlePoem({'title': this.poem.title}).then(res => {
          if (res.length > 0) {
            this.hasSameTitle = true
          } else {
            this.hasSameTitle = false
          }
        })
      }
    },
    back () {
      if (this.poemPage > 0) {
        this.$bus.emit('turnPage', this.poemPage)
        this.reset();
      }
    },
    reset () {
      this.loading = true
      setTimeout(() => {
        this.loading = false
        this.poem = {
          shi: true
        }
      }, 100)
    },
    submit () {
      if (this.poem.type == 0 || this.poem.title == '' || this.poem.author == '' || this.poem.period == '' || this.poem.content == '') {
        alert(this.$str.input_required)
      } else {
        const id = this.poem._id
        if (id) {
          updatePoem({'id': id, 'poem': this.poem}).then(res => {
            this.$bus.emit('poemEdited', id)
          })
        } else {
          addPoem({'poem': this.poem})
        }
      }
      this.reset()
    }
  }
}
</script>
<style lang="less" scoped>
.new-poem {
  position: absolute;
  height: calc(100% - @page-pad / 2);
  width: calc(100% - @page-pad * 2);
  padding: 0 @page-pad;
  padding-top: @page-pad / 2;
  color: @primary-color;
  background-color: lighten(@vice-color, 10%);
  box-shadow: 0px 0px 2px @primary-color;
  z-index: 3;
  -webkit-user-select: none;
  .header {
    display: flex;
    font-size: 24px;
    color: @text-white;
    padding: 8px;
    margin-bottom: 16px;
    border-bottom: 1px @white-bg solid;
    .btn {
      display: inline-block;
      font-size: 20px;
      width: 80px;
      color: @white-bg;
      cursor: pointer;
      transition: all 1s;
    }
    .title {
      flex: 1;
      margin-left: 48px;
    }
    .back {
      &:hover {
        color: @primary-color;
      }
    }
    .submit {
      &:hover {
        color: @accent-color;
      }
    }
  }
  .input-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    .input-group {
      display: flex;
      margin-bottom: 8px;
      padding: 8px;
      .input-label {
        width: 50px;
        text-align: right;
        font-size: 16px;
        padding: 8px;
        color: @white-bg;
        border-right: 1px @white-bg solid;
        letter-spacing: 2px;
      }
      .label-inline {
        margin-left: 16px;
      }
      .required {
        border-right: 1px @text-red solid;
      }
      .input-control {
        margin-left: 16px;
        padding: 4px 8px;
        background: fade(@white-bg, 20%);
        border: 1px solid fade(@white-bg, 10%);
        &:hover {
          border: 1px solid fade(@white-bg, 30%);
        }
      }
      .error-input {
        border: 1px solid @text-red;
      }
      input, textarea, select {
        font-family: 'Kaiti';
        flex: 1;
        background: transparent;
        outline: none;
        border: none;
        font-size: 16px;
        color: @text-black;
        letter-spacing: 2px;
        z-index: 4;
        resize: none;
        word-wrap: none;
        overflow-y: visible;
      }
      .switch {
        display: inline-block;
        text-align: center;
        line-height: 25px;
        cursor: pointer;
        span {
          display: inline-block;
          width: 50px;
          flex: 1;
          text-align: center;
          background: @white-bg;
          .hover-fade();
        }
        .on {
          background: @primary-color;
          color: @text-white;
        }
      }
      select {
        color: @text-vice;
        cursor: pointer;
      }
    }
  }
}
</style>
