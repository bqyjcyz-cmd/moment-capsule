const { formatDate } = require('../../utils/date')
const { getCapsuleById, updateCapsuleText, deleteCapsule } = require('../../utils/storage')

Page({
  data: {
    statusBarHeight: 0,
    safeBottom: 0,
    scrollMaxHeight: 300,
    capsule: null,
    currentPhotoIndex: 0,
    showMenu: false,
    audioPlaying: false
  },

  innerAudioContext: null,

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = sysInfo.statusBarHeight
    const safeBottom = sysInfo.safeArea ? (sysInfo.screenHeight - sysInfo.safeArea.bottom) : 0
    const scrollMaxHeight = Math.floor(sysInfo.windowHeight * 0.38)
    this.setData({ statusBarHeight, safeBottom, scrollMaxHeight })

    if (options.id) {
      this.capsuleId = options.id
      this.loadCapsule(options.id)
    }
  },

  onShow() {
    if (this.capsuleId) {
      this.loadCapsule(this.capsuleId)
    }
  },

  onUnload() {
    this.stopAudio()
  },

  async loadCapsule(id) {
    const capsule = await getCapsuleById(id)
    if (!capsule) {
      wx.showToast({ title: '胶囊不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }

    capsule.formattedDate = formatDate(capsule.createdAt, 'YYYY年M月D日  HH:mm')
    this.setData({ capsule })
  },

  onPhotoSwipe(e) {
    this.setData({ currentPhotoIndex: e.detail.current })
  },

  onToggleAudio() {
    if (this.data.audioPlaying) {
      this.stopAudio()
    } else {
      const src = this.data.capsule && this.data.capsule.audioPath
      if (src) this.playAudio(src)
    }
  },

  playAudio(src) {
    if (!src) return
    this.stopAudio()

    const ctx = wx.createInnerAudioContext()
    // 必须在设置 src 之前设置这些属性
    ctx.obeyMuteSwitch = false
    ctx.volume = 1.0
    ctx.loop = true
    ctx.src = src

    ctx.onCanplay(() => {
      console.log('音频可以播放了，开始播放')
      ctx.play()
    })

    ctx.onPlay(() => {
      this.setData({ audioPlaying: true })
    })

    ctx.onError((err) => {
      console.error('音频播放失败', err)
      this.setData({ audioPlaying: false })
      wx.showToast({ title: '音频无法播放', icon: 'none' })
    })

    this.innerAudioContext = ctx
  },

  stopAudio() {
    if (this.innerAudioContext) {
      this.innerAudioContext.stop()
      this.innerAudioContext.destroy()
      this.innerAudioContext = null
      this.setData({ audioPlaying: false })
    }
  },

  onBackTap() {
    wx.navigateBack()
  },

  onMenuTap() {
    this.setData({ showMenu: true })
  },

  onMenuClose() {
    this.setData({ showMenu: false })
  },

  onEditTap() {
    this.setData({ showMenu: false })
    const c = this.data.capsule
    const params = [
      `id=${c._id}`,
      `text=${encodeURIComponent(c.text || '')}`,
      `location=${encodeURIComponent(c.locationName || '')}`,
      `date=${encodeURIComponent(c.formattedDate || '')}`
    ].join('&')
    wx.navigateTo({ url: `/pages/edit-text/edit-text?${params}` })
  },

  async onDeleteTap() {
    this.setData({ showMenu: false })
    wx.showModal({
      title: '删除这颗胶囊？',
      content: '删除后无法恢复',
      cancelText: '取消',
      confirmText: '删除',
      confirmColor: '#A05050',
      success: async (res) => {
        if (res.confirm) {
          await deleteCapsule(this.data.capsule._id)
          wx.vibrateShort({ type: 'medium' })
          wx.showToast({ title: '已删除', icon: 'none' })
          setTimeout(() => wx.navigateBack(), 1000)
        }
      }
    })
  }
})
