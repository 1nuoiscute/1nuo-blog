(function () {
  'use strict'

  const DEFAULT_CENTER = { lat: 35.0263, lng: 111.0073 }
  const CACHE_KEY = 'nuo-travel-map-geocodes-v1'
  let loadPromise
  let initPromise
  let map
  let markerLayer
  let infoWindow
  let points = []

  function status(message) {
    const node = document.getElementById('travel-map-status')
    if (node) node.textContent = message
  }

  function waitForAttractions() {
    if (window.globalData && Array.isArray(window.globalData.attractions)) {
      return Promise.resolve(window.globalData.attractions)
    }
    return new Promise(function (resolve) {
      const timeout = setTimeout(function () { resolve([]) }, 5000)
      window.addEventListener('rate-data-ready', function () {
        clearTimeout(timeout)
        resolve((window.globalData && window.globalData.attractions) || [])
      }, { once: true })
    })
  }

  function escapeHtml(value) {
    const span = document.createElement('span')
    span.textContent = String(value || '')
    return span.innerHTML
  }

  function loadTencentMap(key) {
    if (window.TMap && window.TMap.service && window.TMap.service.Geocoder) return Promise.resolve(window.TMap)
    if (loadPromise) return loadPromise

    loadPromise = new Promise(function (resolve, reject) {
      let settled = false
      let timer
      const finish = function (error) {
        if (settled) return
        settled = true
        clearInterval(timer)
        error ? reject(error) : resolve(window.TMap)
      }
      const waitUntilReady = function () {
        const startedAt = Date.now()
        timer = setInterval(function () {
          if (window.TMap && window.TMap.Map && window.TMap.service && window.TMap.service.Geocoder) {
            finish()
          } else if (Date.now() - startedAt > 15000) {
            finish(new Error('腾讯地图 SDK 初始化超时，请检查 Key 的应用类型和域名白名单'))
          }
        }, 100)
      }
      const script = document.createElement('script')
      script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(key)}&libraries=service`
      script.async = true
      script.onload = waitUntilReady
      script.onerror = function () { finish(new Error('地图 SDK 加载失败')) }
      document.head.appendChild(script)
    })
    return loadPromise
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') }
    catch (_) { return {} }
  }

  function writeCache(cache) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch (_) {}
  }

  async function geocodeAttraction(geocoder, attraction, cache) {
    if (cache[attraction.id]) return cache[attraction.id]
    const response = await geocoder.getLocation({ address: `${attraction.location}${attraction.name}` })
    const location = response && response.result && response.result.location
    if (!location || !Number.isFinite(Number(location.lat)) || !Number.isFinite(Number(location.lng))) {
      throw new Error(`无法定位 ${attraction.name}`)
    }
    cache[attraction.id] = { lat: Number(location.lat), lng: Number(location.lng) }
    writeCache(cache)
    return cache[attraction.id]
  }

  async function mapWithConcurrency(items, limit, worker) {
    const results = new Array(items.length)
    let cursor = 0
    async function run() {
      while (cursor < items.length) {
        const index = cursor++
        try { results[index] = await worker(items[index], index) } catch (_) { results[index] = null }
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
    return results
  }

  function markerIcon() {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path fill="#2563eb" d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z"/><circle cx="16" cy="16" r="6" fill="white"/></svg>'
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  }

  function showPlace(index) {
    const point = points[index]
    if (!point || !map) return
    map.setCenter(point.position)
    map.setZoom(15)
    infoWindow.setPosition(point.position)
    infoWindow.setContent(`<strong>${escapeHtml(point.attraction.name)}</strong><br><span>${escapeHtml(point.attraction.location)}</span><br><span>评分 ${escapeHtml(point.attraction.final_score)}</span>`)
    infoWindow.open()
  }

  function renderList(attractions) {
    const list = document.getElementById('travel-map-list')
    const count = document.getElementById('travel-map-count')
    const cities = document.getElementById('travel-map-cities')
    if (!list) return
    list.innerHTML = attractions.map(function (item, index) {
      return `<li><button class="nuo-map-place" type="button" data-map-id="${escapeHtml(item.id)}" aria-label="在地图查看${escapeHtml(item.name)}"><span class="nuo-map-place-index">${index + 1}</span><span class="nuo-map-place-name">${escapeHtml(item.name)}</span><span class="nuo-map-place-score">${escapeHtml(item.final_score)}</span></button></li>`
    }).join('')
    count.textContent = attractions.length
    cities.textContent = new Set(attractions.map(function (item) {
      const match = item.location && item.location.match(/.*?省(.*?市)/)
      return match ? match[1] : item.location
    }).filter(Boolean)).size
    list.addEventListener('click', function (event) {
      const button = event.target.closest('[data-map-id]')
      if (!button) return
      const index = points.findIndex(function (point) { return point.id === button.dataset.mapId })
      if (index >= 0) showPlace(index)
    })
  }

  async function initialize() {
    const attractions = await waitForAttractions()
    renderList(attractions)
    if (!attractions.length) {
      status('暂无足迹数据。')
      return
    }

    const key = window.__NUO_TENCENT_LBS__ && window.__NUO_TENCENT_LBS__.key
    if (!key) {
      status('地图鉴权尚未配置，足迹清单仍可浏览。')
      return
    }

    status('正在加载腾讯地图并定位足迹…')
    const TMap = await loadTencentMap(key)
    map = new TMap.Map(document.getElementById('travel-map'), {
      center: new TMap.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      zoom: 8,
      pitch: 0,
      rotation: 0
    })
    const geocoder = new TMap.service.Geocoder()
    const cache = readCache()
    const locations = await mapWithConcurrency(attractions, 3, function (item) {
      return geocodeAttraction(geocoder, item, cache)
    })
    points = locations.map(function (location, index) {
      if (!location) return null
      return {
        id: attractions[index].id,
        styleId: 'footprint',
        position: new TMap.LatLng(location.lat, location.lng),
        attraction: attractions[index]
      }
    }).filter(Boolean)

    markerLayer = new TMap.MultiMarker({
      map,
      styles: {
        footprint: new TMap.MarkerStyle({ width: 32, height: 42, anchor: { x: 16, y: 42 }, src: markerIcon() })
      },
      geometries: points.map(function (point, index) {
        return { id: point.id, styleId: point.styleId, position: point.position, properties: { index } }
      })
    })
    infoWindow = new TMap.InfoWindow({ map, position: points[0] ? points[0].position : map.getCenter(), offset: { x: 0, y: -42 } })
    infoWindow.close()
    markerLayer.on('click', function (event) { showPlace(event.geometry.properties.index) })

    if (points.length > 1) {
      const bounds = new TMap.LatLngBounds()
      points.forEach(function (point) { bounds.extend(point.position) })
      map.fitBounds(bounds, { padding: 64 })
    } else if (points.length === 1) {
      map.setCenter(points[0].position)
      map.setZoom(13)
    }
    status(`已在腾讯地图标记 ${points.length} / ${attractions.length} 处足迹。`)
  }

  window.ensureTravelMap = function () {
    if (!initPromise) initPromise = initialize().catch(function (error) {
      status(`地图暂时无法加载：${error.message}。足迹清单仍可浏览。`)
    })
    if (map) setTimeout(function () { map.resize() }, 50)
    return initPromise
  }

  if (document.getElementById('btn-map') && document.getElementById('btn-map').classList.contains('active')) {
    window.ensureTravelMap()
  }
})()
