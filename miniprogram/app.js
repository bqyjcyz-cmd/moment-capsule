App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: 'cloudbase-2gko7z753975d4ba',
      traceUser: true
    })
    this.globalData = {}

    // 启动时尝试同步未上传的胶囊
    this.trySyncPending()

    // 监听网络恢复，自动同步
    wx.onNetworkStatusChange((res) => {
      if (res.isConnected) {
        console.log('网络恢复，尝试同步未上传胶囊')
        this.trySyncPending()
      }
    })
  },

  globalData: {
    openId: null
  },

  async login() {
    if (this.globalData.openId) return this.globalData.openId
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'capsule',
        data: { action: 'login' }
      })
      this.globalData.openId = result.openId
      return result.openId
    } catch (err) {
      console.error('登录失败', err)
      return null
    }
  },

  async trySyncPending() {
    try {
      const { syncPending } = require('./utils/storage')
      await syncPending()
    } catch (err) {
      console.error('同步失败', err)
    }
  }
})
