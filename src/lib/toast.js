import { reactive } from 'vue'

export const toastState = reactive({ show: false, msg: '', type: 'success' })

let timer = null

export function showToast(msg, type = 'success') {
  toastState.msg = msg
  toastState.type = type
  toastState.show = true
  clearTimeout(timer)
  timer = setTimeout(() => { toastState.show = false }, 3000)
}
