<template>
  <div class="player" ref="player">
    <audio id="audio" :src="player.src" preload loop></audio>
    <canvas id="canvas" :width="player.width" :height="player.height"></canvas>
  </div>
</template>
<script>
export default {
  data () {
    return {
      player: {
        playing: false,
        audio: null,
        src: '',
        width: 200,
        height: 200,
        analyser: null,
        ctx: null,
        gradient: null,
        capYPositionArray: []
      },
    }
  },
  updated () {
    if (this.player.audio) {
      this.player.audio.play()
      this.player.ctx.clearRect(0, 0, this.player.width, this.player.height)
      this.player.playing = true
    }
  },
  mounted () {
    this.$bus.on('startMusic', this.startMusic)
    this.$bus.on('toggleMusic', this.toggleMusic)
  },
  methods: {
    initPlayer () {
      this.player.ctx = new AudioContext()
      this.player.analyser = this.player.ctx.createAnalyser()
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
      this.player.audio.play()
      this.player.playing = true
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
          var value = array[i * step]
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
    startMusic (src) {
      if (this.player.audio) {
        this.player.audio.pause()
        this.player.src = src
      } else {
        this.player.src = src
        this.$nextTick(() => {
          this.initPlayer()
        })
      }
    },
    toggleMusic () {
      if (this.player.audio) {
        if (this.player.playing) {
          this.player.audio.pause()
        } else {
          this.player.audio.play()
        }
        this.player.playing = !this.player.playing
      }
    }
  }
}
</script>

