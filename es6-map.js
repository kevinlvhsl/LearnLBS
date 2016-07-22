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
