Page({
  data: {
    currentPage: 0,
    permissions: {
      location: 'pending',
      camera: 'pending',
      record: 'pending'
    }
  },

  onSwiperChange(e) {
    this.setData({ currentPage: e.detail.current })
  },

  onContinue() {
    if (this.data.currentPage < 2) {
      this.setData({ currentPage: this.data.currentPage + 1 })
    }
  },

  // 授权定位
  async onAuthLocation() {
    try {
      await wx.authorize({ scope: 'scope.userLocation' })
      this.setData({ 'permissions.location': 'granted' })
    } catch {
      this.setData({ 'permissions.location': 'denied' })
    }
  },

  // 授权相机
  async onAuthCamera() {
    try {
      await wx.authorize({ scope: 'scope.camera' })
      this.setData({ 'permissions.camera': 'granted' })
    } catch {
      this.setData({ 'permissions.camera': 'denied' })
    }
  },

  // 授权麦克风
  async onAuthRecord() {
    try {
      await wx.authorize({ scope: 'scope.record' })
      this.setData({ 'permissions.record': 'granted' })
    } catch {
      this.setData({ 'permissions.record': 'denied' })
    }
  },

  // 去设置页
  onGoSettings() {
    wx.openSetting()
  },

  // 进入主页
  onEnter() {
    wx.setStorageSync('hasOnboarded', true)
    // 兜底：如果没有上一页就直接跳转到地图
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/map/map' })
    }
  },

  // 跳过
  onSkip() {
    this.onEnter()
  }
})
