export default class {
  constructor (id, options) {
    this.init(id, options)
  }
  init (id, options) {
    const defaultParams = {
      zoom: 13,
      dragEnable: true,
      zoomEnable: true,
      doubleClickZoom: true,
      keyboardEnable: true,
      scrollWheel: true,
      touchZoom: true
    }
    this.aMap = new AMap.Map(id, Object.assign(defaultParams, options))
    this.covers = []
    return this.aMap
  }
  setZoomAndCenter (zoom, center) {
    this.aMap.setZoomAndCenter(zoom, center)
  }
  makeMaker (center, isCity = false, isDetail = false) {
    this.maker = new AMap.Marker({
      position: center,
      map: this.aMap
    })
    if (isCity) {
      this.addMakerCityInfo()
    }
    if (isDetail) {
      this.addMakerInfo(center)
    }

    this.covers.push(this.maker)
    return this.maker
  }
  addPlugins () {
    AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
      const toolBar = new AMap.ToolBar()
      const scale = new AMap.Scale()
      this.aMap.addControl(toolBar)
      this.aMap.addControl(scale)
    })
  }
  addMakerCityInfo () {
    this.aMap.getCity((province, city, citycode, district) => {
      console.log(province, city, citycode, district)
    })
  }
  // 必须注册高德，取得应用合法key和value
  addDetailMakerInfo (center) {
    AMap.service('AMap.Geocoder', () => {
      const geocoder = new AMap.Geocoder({
        city: '010'
      })
      geocoder.getAddress(center, (status, result) => {
        console.log(status, result)
        if (status === 'complete' && result.info === 'OK') {
          const infowindow = new AMap.InfoWindow({
            content: `<div>${result.regeocode.formattedAddress}</div>`,
            offset: new AMap.Pixel(0, -30),
            size: new AMap.Size(230, 0)
          })
          AMap.event.addListener(marker, 'click', () => {
            infowindow.open(this.map, this.marker.getPosition())
          })
        } else {
          console.log('error')
        }
      })
    })
  }
  makeLine (points, options) {
    const config = {
      strokeColor: '#48cc83',
      strokeOpacity: 1,
      strokeWeight: 3,
      strokeStyle: 'solid',
      strokeDasharray: [10, 5],
      path: points
    }
    this.polyline = new AMap.Polyline(Object.assign(config, options))
    this.polyline.setMap(this.aMap)

    this.covers.push(this.polyline)
  }
  clear () {
    this.aMap.clearMap()
  }
  removeAll () {
    this.aMap.remove(this.covers)
  }
  destroy () {
    this.aMap.destroy()
  }
}




```
<template lang="jade">
.cp-set-position
  topbar(title="定位", icon="position")
  #sn_container
  template(v-if="direct")
    .dt_common(@click="toTrack")
      p="实时"
      p="定位"
    .sn_bottom1(@click="remoteMonitor")="远程监听"
  template(v-if="!direct")
    .dt_common(@click="toLocation")
      p="运动"
      p="轨迹"
    ul.sn_bottom2
      li(v-for="item in locations", @click="modifyIndex($index)")
        span(
          v-bind:class="{time_focus: timeIndex == $index}",
          v-text="item"
        )
</template>

<script>
import Map from 'common/map'
import Api from 'api/index'

let map
let timer
export default {
  vuex: {
    getters: {
      count: state => state.index.count,
    },
  },
  components: {

  },
  data() {
    return {
      locations: ['今天', '昨天', '前天'],
      direct: true,
      timeIndex: 0
    }
  },
  methods: {
    toTrack () {
      this.direct = !this.direct
      const today = this.getDate(this.timeIndex)
      clearInterval(timer)
      this.trackLine(today)
    },
    toLocation () {
      this.direct = !this.direct
      this.trackPoint()
      this.loopTrackPoint()
    },
    modifyIndex (index) {
      this.timeIndex = index
      const date = this.getDate(index)
      this.trackLine(date)
    },
    getDate (index) {
      const now = new Date()
      now.setDate(now.getDate() - index)
      return {
        day: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
      }
    },
    trackLine (date) {
      map.clear()
      Api.getTrackPositons(date).then(res => {
        if (res.status === 200) {
          const points = []
          res.data.forEach(value => {
            const point = []
            point.push(value.lon)
            point.push(value.lat)
            points.push(point)
          })
          if (points.length) {
            map.makeLine(points)
          } else {
            App.pop('未发现运动轨迹')
          }
        }
      })
    },
    trackPoint () {
      Api.getDevicePosition().then(res => {
        if (res.status === 200) {
          const center = [res.data.lon, res.data.lat]
          map.clear()
          map.makeMaker(center)
        } else {
          App.pop('定位失败，30秒后自动刷新')
        }
      })
    },
    loopTrackPoint () {
      timer = setInterval(() => {
        this.trackPoint()
      }, 30 * 1000)
    },
    remoteMonitor () {
      Api.monitorDevice().then(res => {
        if (res.status === 200) {
          App.pop('远程监听成功')
        } else {
          App.pop('远程监听失败')
        }
      })
    }
  },
  route: {
  },
  created () {
  },
  ready () {
    Api.getDevicePosition().then(res => {
      if (res.status === 200) {
        const center = [res.data.lon, res.data.lat]
        map = new Map('sn_container', {
          center
        })
        map.makeMaker(center)
        map.addPlugins()
        this.loopTrackPoint()
      } else {
        App.pop('定位失败，30秒后自动刷新')
      }
    })
  },
  beforeDestroy () {
    clearInterval(timer)
  }
}
</script>

<style lang="sass" scoped>
@import 'config'
.cp-set-position
  .dt_common
    position: absolute
    top: r(100)
    right: r(24)
    background-color: rgba(255, 164, 33, .7)
    z-index: 2
    text-align: center
    border-radius: r(8)
    font-size: 0
    padding: r(8) r(12)
    animation: pulse 1s infinite
    p
      @include fc(r(36), white, 500)
  #sn_container
    @include autoWrap(100%, r(80), 0)
    z-index: 0
  .sn_bottom1
    position: fixed
    width: r(692)
    border-radius: r(8)
    background-color: rgb( 72, 204, 131 )
    z-index: 1
    @include hlfc(r(96), r(36), rgb( 248, 248, 248 ), 500)
    bottom: r(32)
    left: 50%
    margin-left: r(-346)
    text-align: center
  .sn_bottom2
    position: fixed
    width: 100%
    height: r(120)
    background-color: #48cc83
    overflow: hidden
    left: 0
    bottom: 0
    z-index: 1
    display: flex
    li
      width: 33.33%
      @include hlfc(r(120), r(38), rgb( 0, 134, 78 ))
      text-align: center
    .time_focus
      display: inline-block
      width: r(160)
      @include hlfc(r(64), r(38), white)
      background-color: rgba(0, 0, 0, .4)
      border-radius: r(32)
</style>

```
