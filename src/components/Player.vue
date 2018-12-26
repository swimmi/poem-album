<template>
  <div class="player">
    <audio id="audio" src="static/erke.mp3"></audio>
    <canvas id="canvas" :width="400" :height="400"></canvas>
  </div>
</template>
<script>
export default {
  data () {
    return {
      analyser: null,
      ctx: null,
      gradient: null
    }
  },
  mounted () {
    this.$bus.on('initPlayer', this.initPlayer)
  },
  methods: {
    initPlayer () {
      var audio = document.getElementById('audio')
      this.ctx = new AudioContext()
      this.analyser = this.ctx.createAnalyser()
      var audioSrc = this.ctx.createMediaElementSource(audio)
      audioSrc.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)
      // this.analyser.fftSize = 64

      var canvas = document.getElementById('canvas')
          
      this.ctx = canvas.getContext('2d')
      this.gradient = this.ctx.createLinearGradient(0, 0, 0, 300)
      this.gradient.addColorStop(1, '#0f0')
      this.gradient.addColorStop(0.5, '#ff0')
      this.gradient.addColorStop(0, '#f00')
      this.renderFrame()
      audio.play()
    },
    renderFrame() {
      var cwidth = canvas.width,
          cheight = canvas.height - 2,
          meterWidth = 10, //width of the meters in the spectrum
          gap = 2, //gap between meters
          capHeight = 2,
          capStyle = '#fff',
          meterNum = 800 / (10 + 2), //count of the meters
          capYPositionArray = [] ////store the vertical position of hte caps for the preivous frame

      var array = new Uint8Array(this.analyser.frequencyBinCount)
      this.analyser.getByteFrequencyData(array)
      var step = Math.round(array.length / meterNum) //sample limited data from the total array
      this.ctx.clearRect(0, 0, cwidth, cheight)
      for (var i = 0; i < meterNum; i++) {
          var value = array[i * step]
          if (capYPositionArray.length < Math.round(meterNum)) {
              capYPositionArray.push(value)
          }
          this.ctx.fillStyle = capStyle;
          //draw the cap, with transition effect
          if (value < capYPositionArray[i]) {
              this.ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight)
          } else {
              this.ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight)
              capYPositionArray[i] = value
          }
          this.ctx.fillStyle = this.gradient //set the filllStyle to gradient for a better look
          this.ctx.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight) //the meter
      }
      requestAnimationFrame(this.renderFrame)
    }
  }
}
</script>

