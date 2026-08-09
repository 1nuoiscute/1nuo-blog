'use strict'

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const data = JSON.parse(fs.readFileSync(path.join(root, 'source/rate/rate_data.json'), 'utf8'))
const page = fs.readFileSync(path.join(root, 'source/rate/index.md'), 'utf8')
const client = fs.readFileSync(path.join(root, 'source/js/rate-map.js'), 'utf8')
const generator = fs.readFileSync(path.join(root, 'scripts/tencent-lbs-config.js'), 'utf8')

if (!Array.isArray(data.attractions) || !data.attractions.length) throw new Error('缺少景点评测数据')
const ids = new Set()
for (const item of data.attractions) {
  if (!item.id || !item.name || !item.location) throw new Error('足迹缺少 id、名称或位置')
  if (ids.has(item.id)) throw new Error(`重复足迹 id: ${item.id}`)
  ids.add(item.id)
}

for (const required of ['btn-map', 'section-map', 'travel-map', 'travel-map-status', '/js/tencent-lbs-config.js', '/js/rate-map.js']) {
  if (!page.includes(required)) throw new Error(`评测页缺少 ${required}`)
}
if (!client.includes('encodeURIComponent(key)')) throw new Error('地图 Key 未安全编码')
if (!client.includes('&libraries=service')) throw new Error('腾讯地图地理编码服务库未声明')
if (!client.includes('window.TMap.service.Geocoder')) throw new Error('缺少地理编码服务可用性检查')
if (!client.includes('SDK 初始化超时')) throw new Error('缺少腾讯地图异步初始化超时处理')
if (!client.includes('地图鉴权尚未配置')) throw new Error('缺少无 Key 降级提示')
if (!client.includes('rate-data-ready')) throw new Error('缺少评测数据加载同步')
if (!client.includes("classList.contains('active')")) throw new Error('缺少地图脚本延迟加载恢复')
if (!page.includes('if (!activeCategory)')) throw new Error('缺少快速切换页签保护')
if (!generator.includes('process.env.TENCENT_LBS_KEY')) throw new Error('未从构建环境读取地图 Key')
if (/TENCENT_LBS_KEY\s*=\s*['"][^'"]+/.test(page + client + generator)) throw new Error('检测到疑似硬编码 Key')

console.log(`旅行足迹地图检查通过：${data.attractions.length} 个地点，Key 未写入源码。`)
