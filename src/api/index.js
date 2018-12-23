'use strict'

import axios from 'axios'

axios.interceptors.request.use(config => {
  return config
}, error => {
  return Promise.reject(error)
})

axios.interceptors.response.use(response => {
  return response
}, error => {
  return Promise.resolve(error.response)
})

export default {
  post (url, data) {
    return axios({
      method: 'post',
      baseURL: 'api/',
      url,
      data: data,
      timeout: 3000,
    }).then(
      (response) => {
        return response
      }
    ).then(
      (res) => {
        return res
      }
    )
  },
  get (url, params) {
    return axios({
      method: 'get',
      baseURL: 'api/',
      url,
      params,
      timeout: 3000,
    }).then(
      (response) => {
        return response
      }
    ).then(
      (res) => {
        return res
      }
    )
  }
}