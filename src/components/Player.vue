<template>
  <div class="player" ref="player">
    <audio id="audio" :src="player.src" preload loop></audio>
    <div class="music-cd" @click="toggleMusic" v-show="player.show">
      <img class="cd-holder" src="~@/assets/images/audio_cover_holder.png" />
      <img class="cd-pointer" :class="{'pointer-off': player.playing, 'pointer-on': !player.playing}" src="~@/assets/images/audio_cover_pointer.png" />
      <div class="cd-cover flash-btn">
        <img v-if="player.playing" class="cover-img" src="~@/assets/images/music_on.svg" />
        <img v-else class="cover-img" src="~@/assets/images/music_off.svg" />
      </div>
    </div>
    <canvas id="canvas" :width="player.width" :height="player.height"></canvas>
  </div>
</template>
<script>
export default {
  data () {
    return {
      player: {
        show: false,
        playing: false,
        audio: null,
        src: '',
        width: 240,
        height: 600,
        analyser: null,
        ctx: null,
        gradient: null,
        capYPositionArray: []
      },
    }
  },
  mounted () {
    this.$bus.on('loadMusic', this.loadMusic)
    this.$bus.on('toggleMusic', this.toggleMusic)
    this.$bus.on('stopMusic', this.stopMusic)
    if (this.player.audio) {
      this.player.audio.play()
      this.player.ctx.clearRect(0, 0, this.player.width, this.player.height)
      this.player.playing = true
    }
  },
  methods: {
    initPlayer () {
      this.player.ctx = new AudioContext()
      this.player.analyser = this.player.ctx.createAnalyser()
      this.player.analyser.fftSize = 256
      this.player.analyser.connect(this.player.ctx.destination)
      this.player.capYPositionArray = []
      this.player.audio = document.getElementById('audio')

      var audioSrc = this.player.ctx.createMediaElementSource(audio)
      audioSrc.connect(this.player.analyser)

      var canvas = document.getElementById('canvas')
      this.player.ctx = canvas.getContext('2d')
      this.player.gradient = this.player.ctx.createLinearGradient(0, 0, 0, this.player.height)
      this.player.gradient.addColorStop(1, '#00ff00cc')
      this.player.gradient.addColorStop(0.5, '#ffff00cc')
      this.player.gradient.addColorStop(0, '#ff0000cc')
      this.renderFrame()
    },
    renderFrame() {
      var cwidth = canvas.width - 2,
          cheight = canvas.height,
          meterWidth = 4,
          meterGap = 6,
          capHeight = 2,
          capStyle = '#ffffffcc',
          meterNum = this.player.width / meterGap
      var array = new Uint8Array(this.player.analyser.frequencyBinCount)
      this.player.analyser.getByteFrequencyData(array)
      var step = Math.round(array.length / meterNum)
      this.player.ctx.clearRect(0, 0, canvas.width, cheight)
      for (var i = 0; i < meterNum; i++) {
          var value = array[i * step] * 2
          if (this.player.capYPositionArray.length < Math.round(meterNum)) {
              this.player.capYPositionArray.push(value)
          }
          this.player.ctx.fillStyle = this.player.gradient
          this.player.ctx.fillRect(i * meterGap, cheight - value, meterWidth, value + capHeight)
          // 绘制cap
          this.player.ctx.fillStyle = capStyle
          if (value < this.player.capYPositionArray[i]) {
            this.player.ctx.fillRect(i * meterGap, cheight - this.player.capYPositionArray[i], meterWidth, capHeight)
            this.player.capYPositionArray[i] --
          } else {
            this.player.ctx.fillRect(i * meterGap, cheight - value, meterWidth, capHeight)
            this.player.capYPositionArray[i] = value
          }
      }
      requestAnimationFrame(this.renderFrame)
    },
    loadMusic (name) {
      this.player.show = (name != null)
      if (name) {
        this.player.src = this.$util.getFilePath('musics', name)
        if (this.player.audio) {
          this.player.audio.pause()
        } else {
          this.$nextTick(() => {
            this.initPlayer()
          })
        }
      }
    },
    toggleMusic () {
      if (this.player.audio && this.player.src) {
        if (this.player.playing) {
          this.player.audio.pause()
        } else {
          this.player.audio.play()
        }
        this.player.playing = !this.player.playing
      }
    },
    stopMusic () {
      if (this.player.audio) {
        this.player.audio.pause()
        this.player.playing = false
        this.player.src = ''
      }
    }
  }
}
</script>
<style lang="less" scoped>
.player {
  display: flex;
  height: 100%;
  .play-btn {
    .image-btn();
    position: absolute;
    top: 0px;
    right: 0px;
  }
  .music-cd {
    flex: 1;
    position: absolute;
    width: 100px;
    height: 130px;
    left: 32px;
    top: 0px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    .hover-fade();
    .cd-holder {
      position: relative;
      width: 32px;
      left: 50%;
      transform: translate(-50%, 0);
      z-index: 3;
    }
    .cd-pointer {
      position: relative;
      width: 48px;
      left: calc(50% - 10px);
      top: -12px;
      transform-origin: 8px 8px;
      z-index: 2;
    }
    .cd-cover {
      .flex-center();
      position: absolute;
      width: 100px;
      height: 100px;
      bottom: 0px;
      background-image: url('~@/assets/images/audio_cover_bg.png');
      background-size: 100px;
      background-repeat: no-repeat;
      .cover-img {
        width: 40px;
      }
    }
    .pointer-on {
      transition: all .7s;
      transform: rotateZ(-30deg);
    }
    .pointer-off {
      transition: all .7s;
      transform: rotateZ(0deg);
    }
  }
}
</style>


