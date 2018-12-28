import api from '@/api'

// 操作类
export const addPoem = async function (params) {
  return (await api.post('/poem/add', params)).data
}
export const updatePoem = async function (params) {
  return (await api.post("/poem/update", params)).data
}
export const updateAnyPoem = async function (params) {
  return (await api.post("/poem/update/any", params)).data
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
export const getLastPoem = async function () {
  return (await api.get('/poem/last')).data
}
export const getAuthorPoem = async function () {
  return (await api.post('/poem/author')).data
}
export const getTitlePoem = async function (params) {
  return (await api.post('/poem/title', params)).data
}
export const getCatalog = async function () {
  return (await api.get('/poem/catalog')).data
}
export const searchPoem = async function (keyword) {
  return (await api.get('/poem/search?keyword=' + keyword)).data
}
