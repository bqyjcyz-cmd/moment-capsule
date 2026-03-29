const { getLocation, checkLocationAuth } = require('../../utils/location')
const { formatRelativeDate, formatDate } = require('../../utils/date')
const { getCapsules, getTodayInHistory } = require('../../utils/storage')

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

Page({
  data: {
    statusBarHeight: 0,
    latitude: 31.2304,
    longitude: 121.4737,
    markers: [],
    showPreview: false,
    previewCapsule: null,
    todayHistory: null,
    showTodayHistory: false,
    isEmpty: true,
    monthDisplay: ''
  },

  markerMap: {},  // marker ID → capsule 映射

  onLoad() {
    const { statusBarHeight } = wx.getSystemInfoSync()
    const monthDisplay = MONTH_NAMES[new Date().getMonth()]
    this.setData({ statusBarHeight, monthDisplay })
    this.checkOnboarding()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 0 })
    }
    this.loadCapsules()
  },

  checkOnboarding() {
    const hasOnboarded = wx.getStorageSync('hasOnboarded')
    if (!hasOnboarded) {
      wx.navigateTo({ url: '/pages/onboarding/onboarding' })
    }
  },

  async loadCapsules() {
    const capsules = await getCapsules()

    // 用 markerMap 做 ID→胶囊映射，避免 filter 后下标错位
    const markerMap = {}
    const markers = capsules
      .filter(c => c.latitude && c.longitude)
      .map((c, i) => {
        markerMap[i] = c
        return {
          id: i,
          latitude: c.latitude,
          longitude: c.longitude,
          width: 24,
          height: 24,
          callout: {
            content: c.locationName || '',
            fontSize: 9,
            color: '#6B6560',
            bgColor: '#F6F4EEEE',
            borderRadius: 4,
            padding: 6,
            display: 'ALWAYS',
            textAlign: 'center'
          },
          anchor: { x: 0.5, y: 0.5 }
        }
      })

    this.markerMap = markerMap
    this.setData({ markers, isEmpty: capsules.length === 0 })

    this.locateUser()
    this.checkTodayHistory()
  },

  async locateUser() {
    const authStatus = await checkLocationAuth()
    if (authStatus !== 'authorized') return
    try {
      const { latitude, longitude } = await getLocation()
      this.setData({ latitude, longitude })
    } catch (err) {
      console.error('定位失败', err)
    }
  },

  onLocateTap() {
    this.locateUser()
  },

  async checkTodayHistory() {
    const lastShown = wx.getStorageSync('lastTodayShownDate')
    const today = new Date().toDateString()
    if (lastShown === today) return

    const capsule = await getTodayInHistory()
    if (capsule) {
      this.setData({
        todayHistory: {
          ...capsule,
          relativeDate: formatRelativeDate(capsule.createdAt)
        },
        showTodayHistory: true
      })
      wx.setStorageSync('lastTodayShownDate', today)
      setTimeout(() => this.setData({ showTodayHistory: false }), 5000)
    }
  },

  onMarkerTap(e) {
    const capsule = this.markerMap[e.detail.markerId]
    if (!capsule) return

    const text = capsule.text || ''
    this.setData({
      showPreview: true,
      previewCapsule: {
        ...capsule,
        textPreview: text.length > 30 ? text.substring(0, 30) + '...' : text,
        dateDisplay: formatDate(capsule.createdAt, 'M月D日')
      }
    })
  },

  onPreviewTap() {
    const capsule = this.data.previewCapsule
    if (!capsule) return
    wx.navigateTo({ url: `/pages/review/review?id=${capsule._id}` })
  },

  onMapTap() {
    if (this.data.showPreview) {
      this.setData({ showPreview: false })
    }
  },

  onTodayHistoryTap() {
    const capsule = this.data.todayHistory
    if (!capsule) return
    this.setData({ showTodayHistory: false })
    wx.navigateTo({ url: `/pages/review/review?id=${capsule._id}` })
  }
})
