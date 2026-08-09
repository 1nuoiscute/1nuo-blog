'use strict'

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.resolve(__dirname, '..')
const source = fs.readFileSync(path.join(root, 'source/js/rate-map.js'), 'utf8')
const data = JSON.parse(fs.readFileSync(path.join(root, 'source/rate/rate_data.json'), 'utf8'))
const nodes = new Map()

function node(id) {
  if (!nodes.has(id)) {
    nodes.set(id, {
      id,
      classList: { contains: () => false },
      style: {},
      textContent: '',
      innerHTML: '',
      addEventListener: () => {}
    })
  }
  return nodes.get(id)
}

let mapCreated = false
let markerCount = 0
let requestedSdkUrl = ''

class LatLng {
  constructor(lat, lng) { this.lat = lat; this.lng = lng }
}

class TencentMap {
  constructor() { mapCreated = true; this.center = new LatLng(0, 0) }
  getCenter() { return this.center }
  fitBounds() {}
  setCenter(center) { this.center = center }
  setZoom() {}
  resize() {}
}

class MultiMarker {
  constructor(options) { markerCount = options.geometries.length }
  on() {}
}

class InfoWindow {
  close() {}
  open() {}
  setPosition() {}
  setContent() {}
}

class LatLngBounds { extend() {} }
class MarkerStyle { constructor(options) { Object.assign(this, options) } }

const context = {
  console,
  encodeURIComponent,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Date,
  Promise,
  Number,
  Set,
  document: {
    getElementById: node,
    createElement(tag) {
      if (tag === 'script') return {}
      return {
        _text: '',
        set textContent(value) { this._text = String(value) },
        get innerHTML() { return this._text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]) }
      }
    },
    head: {
      appendChild(script) {
        requestedSdkUrl = script.src
        setTimeout(() => {
          context.TMap = { Map: TencentMap, LatLng, MultiMarker, InfoWindow, LatLngBounds, MarkerStyle }
          script.onload()
        }, 0)
      }
    }
  },
  globalData: data,
  __NUO_TENCENT_LBS__: { key: 'test-key' },
  addEventListener: () => {}
}
context.window = context

vm.runInNewContext(source, context, { filename: 'rate-map.js' })

context.ensureTravelMap().then(() => {
  if (!mapCreated) throw new Error('腾讯地图实例未创建')
  if (markerCount !== data.attractions.length) throw new Error(`标记数量错误: ${markerCount}`)
  if (requestedSdkUrl.includes('libraries=service')) throw new Error('运行时仍请求 service 库')
  if (!requestedSdkUrl.includes('api/gljs') || !requestedSdkUrl.includes('key=test-key')) throw new Error('SDK 请求地址错误')
  if (!node('travel-map-status').textContent.includes(`${data.attractions.length} / ${data.attractions.length}`)) throw new Error('地图成功状态错误')
  console.log(`地图运行时模拟通过：创建 ${markerCount} 个腾讯地图标记。`)
}).catch(error => {
  console.error(error)
  process.exitCode = 1
})
