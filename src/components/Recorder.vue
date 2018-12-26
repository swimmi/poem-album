<template>
  <div v-if="loading"></div>
  <div v-else class="recorder">
    <div v-if="isRecording" class="recording">
      <span>{{ $str.recording }}</span>
      <img src="~@/assets/images/recording.gif" />
      <span>{{ $str.please_read }}</span>
    </div>
    <div class="column-container">
      <span class="column prev-column">{{ textColumns[cIndex - 1] || $str.start }}</span>
      <marquee v-if="textColumns[cIndex] && textColumns[cIndex].length >= 20" class="column column-long current-column" scrollamount="10" direction="up">{{ textColumns[cIndex] }}</marquee>
      <span v-else class="column" :class="{'current-column': cIndex < textColumns.length }">{{ textColumns[cIndex] }}</span>
      <span class="column next-column">{{ textColumns[cIndex + 1] || $str.end }}</span>
    </div>
    <div class="record-container">
      <audio src="" hidden ref="audio" />
      <div class="record-scroll" ref="recordScroll">
        <div v-show="reads.length == 0" class="record-tip">
          <span>{{ $str.please_read }}</span>
        </div>
        <div v-for="(item, index) in reads"
          :key="index"
          class="record-item animated fadeInDown"
          :class="{'playing': index == playIndex}"
          @click="playRecord(item)">
          <span class="record-text">{{ item.text }}</span>
          <span class="record-duration">{{ $util.secondToStr(item.duration) }}s</span>
          <span class="record-action">
            <span class="image-btn" @click.stop="modifyRecord(index)"><img src="~@/assets/images/record.png"/></span>
          </span>
        </div>
      </div>
    </div>
    <div class="record-btn-container">
      <div class="record-btn" @click="handleRecord" v-if="cIndex < textColumns.length">
        <div class="record-bg"
        :class="{'record-bg-stop': isRecording}">
          <img v-if="isRecording" src="~@/assets/images/mic-off.png" />
          <img v-else src="~@/assets/images/mic-on.png" />
        </div>
      </div>
      <div class="record-btn" v-else>
        <div v-if="!isPlaying" class="record-bg" @click="playRecords">
          <img src="~@/assets/images/play.png" />
        </div>
        <div v-else class="record-bg" @click="pauseRecords">
          <img src="~@/assets/images/pause.png" />
        </div>
      </div>
      <div class="cancel-btn" v-show="isRecording" @click="cancelRecord">
        <span class="image-btn"><img src="~@/assets/images/close.png"/></span>
      </div>
    </div>
  </div>
</template>
<script>
import Recorder from 'recorder-js'
import { getPoem, updateAnyPoem } from '@/api/poem'
export default {
  data () {
    return {
      id: '',
      title: '',
      author: '',
      content: '',
      textColumns: [],
      reads: [],
      cIndex: 0,
      playIndex: -1,
      recorder: null,
      isRecording: false,
      isPlaying: false,
      isPaused: false,
      recordFile: '',
      media: null,
      loading: true
    }
  },
  mounted () {
    this.$bus.on('loadRecorder', this.loadRecorder)
    this.$bus.on('playRecords', this.playRecords)
    this.$bus.on('emptyRecords', this.emptyRecords)
    this.$bus.on('uploadRecords', this.submit)
  },
  methods: {
    initRecorder () {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.recorder = new Recorder(audioContext, {})
      this.media = navigator.mediaDevices.getUserMedia({audio: true})
        .then(stream => {
          this.recorder.init(stream)
        })
        .catch(err => console.log(err))
    },
    loadRecorder (id) {
      this.id = id
      getPoem({id: id}).then(res => {
        this.reads = []
        this.title = res.title
        this.author = res.author
        this.content = res.content
        if (res.prologue) {
          this.content = res.prologue + this.content
        }
        this.content = this.content.replace(/#/g, '')
        this.textColumns = this.$util.splitToSentences(this.content).map(item => {
          return this.$util.parseColumn(item)
        })
        this.textColumns.unshift(this.title, this.author)
        if (res.reads) {
          res.reads.forEach((item, index) => {
            this.reads.push({
              text: this.textColumns[index],
              name: item.name,
              duration: item.duration
            })
          })
          this.cIndex = res.reads.length
        }
        this.loading = false
      })
      this.initRecorder()
    },
    handleRecord () {
      if (!this.isRecording) {
        this.recorder.start().then(() => this.isRecording = true)
      }
      if (this.isRecording) {
        this.recorder.stop().then(({blob, buffer}) => {
          this.isRecording = false
          // 获取音频时长
          var duration = 0
          const url = this.$util.getObjectURL(blob)
          var audioElement = new Audio(url)
          audioElement.addEventListener("loadedmetadata", (event) => {
            duration = audioElement.duration.toFixed(2)
            const item = {
              text: this.textColumns[this.cIndex],
              file: blob,
              duration: duration
            }
            this.reads.splice(this.cIndex, 1, item)
            if (this.reads.length == this.textColumns.length) {
              this.cIndex = this.textColumns.length
            } else {
              this.cIndex ++
            }
            setTimeout(() => {
              this.$refs.recordScroll.scrollTop = this.$refs.recordScroll.scrollHeight
            }, 100)
          })
        })
      }
    },
    playRecord (item) {
      if (item.hasOwnProperty('file')) {
        const url = window.URL.createObjectURL(item.file)
        this.$refs.audio.src = url
        this.$refs.audio.onload = function(){
          window.URL.revokeObjectURL(url)
        }
      } else {
        this.$refs.audio.src = this.$util.getFilePath('reads', this.id) + item.name
      }
      this.$refs.audio.play()
      this.isPlaying = true
      this.$refs.audio.addEventListener('ended', this.stopRecords);
    },
    modifyRecord (index) {
      this.cIndex = index
    },
    stopRecords () {
      this.isPlaying = false
    },
    playRecords () {
      if (this.isPaused) {
        this.resumeRecords()
      } else {
        if (this.playIndex == -1) {
          this.$refs.audio.addEventListener('ended', this.playRecords)
        }
        this.playIndex ++
        if (this.playIndex < this.reads.length) {
          this.playRecord(this.reads[this.playIndex])
        } else  {
          this.playIndex = -1
          this.$refs.audio.removeEventListener('ended', this.playRecords)
        }
      }
    },
    pauseRecords () {
      this.isPaused = true
      this.isPlaying = false
      this.$refs.audio.pause()
    },
    resumeRecords () {
      this.$refs.audio.play()
      this.isPaused = false
      this.isPlaying = true
    },
    emptyRecords () {
      this.isPlaying = false
      this.cIndex = 0
      this.$refs.audio.pause()
      this.reads = []
    },
    cancelRecord () {
      this.recorder.stop()
      this.isRecording = false
    },
    async submit () {
      var form = new FormData()
      form.append('type', 'reads')
      form.append('id', this.id)
      var recordList = []
      this.reads.forEach((item, index) => {
        var name = item.name
        if (item.hasOwnProperty('file')) {
          name = `${index}.wav`
          form.append('file', item.file, name)
        }
        recordList.push({
          name: name,
          duration: item.duration
        })
      })
      // 上传音频
      if (recordList.length > 0) {
        await this.$http.post('/api/upload', form)
      }
      // 提交数据
      const any = {
        'reads': recordList
      }
      updateAnyPoem({'id': this.id, 'any': any}).then(res => {
        this.$bus.emit('poemRecorded')
        this.$bus.emit('refreshPoem', this.id)
      })
    }
  }
}
</script>
<style lang="less" scoped>
.recorder {
  display: flex;
  flex-direction: row-reverse;
  width: 100%;
  height: 100%;
  background: @white-bg;
  .column-container {
    display: flex;
    flex-direction: row-reverse;
    height: 100%;
    width: 200px;
    background: fade(@white-bg, 70%);
    z-index: 3;
    .flex-center();
    .column {
      .v-text(20px);
      margin: 16px;
      color: @text-vice;
      max-height: 480px;
      overflow: hidden;
    }
    .column-long {
      height: 480px;
      text-align: center;
    }
    .current-column {
      color: @primary-color;
      font-weight: bold;
      .v-text(24px);
    }
    .prev-column {
      color: @text-gray
    }
  }
  .recording {
    position: absolute;
    width: 100%;
    height: 100%;
    background: @vice-color;
    z-index: 2;
    .flex-center();
    flex-direction: column;
    span {
      color: @text-white;
      .h-text(18px);
    }
  }
  .record-container {
    flex: 1;
    overflow: hidden;
    z-index: 1;
    .record-scroll {
      @pad: 32px;
      width: calc(100% - @pad);
      height: calc(100% - @pad);
      overflow-y: auto;
      padding: @pad/2;
      .record-tip {
        .center-parent();
        color: @text-red;
        .h-text(20px);
      }
      .record-item {
        display: flex;
        width: 100%;
        margin-bottom: @pad / 2;
        background: @white-bg;
        cursor: pointer;
        border-radius: @base-radius;
        .hover-fade();
        .record-text {
          flex: 1;
          .flex-center();
          justify-content: flex-start;
          padding: @pad / 2;
        }
        .record-duration {
          .flex-center();
          margin-top: 2px;
          .h-text(14px);
          color: @text-gray;
        }
        .record-action {
          flex-direction: column;
          .flex-center();
        }
        &:hover {
          .shadow();
        }
      }
      .playing {
        color: @text-red;
        .shadow();
      }
    }
  }
  .record-btn-container {
    position: relative;
    width: 200px;
    height: 100%;
    background: fade(@white-bg, 30%);
    z-index: 3;
    @size: 60px;
    .record-btn {
      .center-parent();
      width: @size;
      height: @size;
      cursor: pointer;
      .record-bg {
        .flex-center();
        width: 100%;
        height: 100%;
        background-color: @primary-color;
        border-radius: 50%;
        .hover-fade();
      }
      .record-bg-stop {
        background-color: @text-white;
      }
    }
    .cancel-btn {
      .center-parent();
      margin-top: @size;
    }
  }
}
</style>
