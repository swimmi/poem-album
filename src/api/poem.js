import api from '@/api'

// 操作类
export const addPoem = async function (params) {
  return (await api.post('/poem/add', params)).data
}
export const updatePoem = async function (params) {
  return (await api.post("/poem/update", params)).data
}
export const updatePoemContent = async function (params) {
  return (await api.post('/poem/content/update', params)).data
}
// 查询类
export const getPoem = async function (params) {
  return (await api.post('/poem/get', params)).data
}
export const getAllPoems = async function () {
  return (await api.get('/poem/all')).data
}

