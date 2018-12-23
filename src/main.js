// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import 'jquery'
import 'animate.css'
import axios from 'axios'
import VueBus from 'vue-bus'
import values from '@/store/values'
import utils from '@/store/utils'
import api from '@/api'

Vue.config.productionTip = false
Vue.use(VueBus)

Vue.prototype.$str = values.strings
Vue.prototype.$util = utils.functions
Vue.prototype.$http = axios
Vue.prototype.$api = api

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
