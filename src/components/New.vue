<template>
  <div v-if="loading"></div>
  <div v-else class="new-poem">
    <div class="header">
      <span v-if="step > 0" class="btn prev" @click="step--">{{ $str.prev }}</span>
      <span v-else class="btn new">{{ $str.new }}</span>
      <span class="title">{{ stepNames[step] }}</span>
      <span v-if="step < stepNames.length - 1" class="btn next" @click="step++">{{ $str.next }}</span>
      <span v-else class="btn submit" @click="submit">{{ $str.submit }}</span>
    </div>
    <div class="input-scroll">
      <div v-show="step == 0" class="input-container animated fadeIn">
        <div class="input-group">
          <span class="input-label required">{{ $str.poem_type }}</span>
          <span class="input-control switch" @click="switchShi"><span :class="{'on': poem.shi}">{{ $str.shi }}</span><span :class="{'on': !poem.shi}">{{ $str.ci }}</span></span>
          <select class="input-control type" v-if="poem.shi" v-model="poem.type">
            <option v-for="(item, index) in types" :value="item.title">{{ item.title }}</option>
          </select>
          <input v-else class="input-control input-inline" type="text" :placeholder="$str.poem_cipai" v-model="poem.type" @keyup="inputCiPai"/>
        </div>
        <div class="input-group">
          <span class="input-label required">{{ $str.poem_title }}</span>
          <input class="input-control" type="text" v-model="poem.title" :placeholder="poem.shi ? '' : $str.poem_cipai_tip" />
        </div>
        <div class="input-group">
          <span class="input-label">{{ $str.poem_prologue }}</span>
          <textarea class="input-control" type="text" rows="3" v-model="poem.prologue" onpaste="return false;"></textarea>
        </div>
        <div class="input-group">
          <span class="input-label">{{ $str.poem_period }}</span>
          <select class="input-control period" v-model="poem.period">
            <option v-for="(item, index) in periods" :value="item.id">{{ item.title }}</option>
          </select>
        </div>
        <div class="input-group">
          <span class="input-label required">{{ $str.poem_author }}</span>
          <input class="input-control" type="text" v-model="poem.author" />
        </div>
        <div class="input-group">
          <span class="input-label">{{ $str.poem_author_desc }}</span>
          <textarea class="input-control" type="text" rows="6" v-model="poem.author_desc" onpaste="return false;"></textarea>
        </div>
      </div>
      <div v-show="step == 1" class="input-container animated fadeIn">
        <div class="input-group">
          <span class="input-label required">{{ $str.poem_content }}</span>
          <textarea class="input-control" type="text" rows="8" v-model="poem.content" onpaste="return false;"></textarea>
        </div>
        <div class="input-group">
          <span class="input-label">{{ $str.poem_desc }}</span>
          <textarea class="input-control" type="text" rows="6" v-model="poem.desc" onpaste="return false;"></textarea>
        </div>
        <div class="input-group">
          <span class="input-label">{{ $str.poem_annotation }}</span>
          <textarea class="input-control" type="text" rows="6" v-model="poem.annotation" onpaste="return false;"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import data from '@/store/data'
import { addPoem, updatePoem, getPoem } from '@/api/poem'
export default {
  props: {
    id: {
      type: String,
      required: false
    }
  },
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
      types: data.type,
      periods: data.period,
      stepNames: ['信息','文本'],
      step: 0,
      loading: true
    }
  },
  mounted () {
    this.$bus.on('submitPoem', this.submit)
    if (this.id != "") {
      getPoem({'id': this.id}).then(res => {
        this.poem = res
        this.loading = false
      })
    } else {
      this.loading = false
    }
  },
  methods: {
    switchShi () {
      this.poem.shi = !this.poem.shi
      this.poem.type = ''
    },
    inputCiPai () {
      this.poem.title = this.poem.type
    },
    submit () {
      if (this.poem.type == 0 || this.poem.title == '' || this.poem.author == '' || this.poem.content == '') {
        alert(this.$str.input_required)
      } else {
        if (this.id == '') {
          addPoem({'poem': this.poem}).then(res => {
            console.log(res)
          })
        } else {
          updatePoem({'id': this.id, 'poem': this.poem}).then(res => {
            this.$bus.emit('poemEdited', this.poem)
          })
        }
      }
      this.step = 0
      this.loading = true
      setTimeout(() => {
        this.loading = false
        this.poem = {
          shi: true
        }
      }, 100)
    }
  }
}
</script>

<style lang="less" scoped>
.new-poem {
  position: absolute;
  height: calc(100% - @page-pad * 2);
  padding: @page-pad * 2 @page-pad * 2 0 @page-pad * 2;
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
    text-align: center;
    .btn {
      display: inline-block;
      width: 80px;
      font-size: 20px;
      color: @white-bg;
      cursor: pointer;
      transition: all 1s;
    }
    .new {
      cursor: default;
    }
    .prev {
      &:hover {
        color: @accent-color;
      }
    }
    .title {
      flex: 1;
    }
    .next {
      &:hover {
        color: @accent-color;
      }
    }
    .submit {
      &:hover {
        color: @text-red;
      }
    }
  }
  .input-scroll {
    overflow: hidden;
    .input-container {
      width: calc(100% + 32px);
      overflow-y: auto;
      .input-group {
        border-bottom: 1px @white-bg solid;
        margin-bottom: 16px;
        padding: 8px;
        .input-label {
          display: inline-block;
          width: 40px;
          font-size: 16px;
          padding: 0px 8px;
          color: @white-bg;
          border-right: 1px @white-bg solid;
          letter-spacing: 2px;
          vertical-align: bottom;
        }
        .required {
          border-right: 1px @text-red solid;
        }
        .input-control {
          margin-left: 16px;
          padding: 8px;
          background: fade(@white-bg, 20%);
          border: 1px solid fade(@white-bg, 10%);
          &:hover {
            border: 1px solid fade(@white-bg, 30%);
          }
        }
        .input-inline {
          width: 140px;
        }
        input, textarea, select {
          font-family: 'Kaiti';
          width: 280px;
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
        select {
          width: 280px;
          color: @text-vice;
          cursor: pointer;
        }
        .switch {
          display: inline-block;
          cursor: pointer;
          span {
            display: inline-block;
            padding: 1px;
            width: 48px;
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
        .type {
          width: 158px;
        }
        .period {
          width: 298px;
        }
      }
    }
  }
}
</style>
