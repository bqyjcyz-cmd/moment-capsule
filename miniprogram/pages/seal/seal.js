const { checkLocationAuth, requestLocationAuth } = require('../../utils/location')
const { saveCapsule } = require('../../utils/storage')
const { formatDate } = require('../../utils/date')

const MOOD_LIST = [
  { name: '开心', emoji: '😊', color: '#F2C94C', bg: '#FFF8E1' },
  { name: '平静', emoji: '😌', color: '#8BA676', bg: '#E8F5E9' },
  { name: '难过', emoji: '😢', color: '#8EA4BF', bg: '#E3F2FD' },
  { name: '愤怒', emoji: '😤', color: '#D47B7B', bg: '#FFEBEE' },
  { name: '惊喜', emoji: '🤩', color: '#E8A065', bg: '#FFF3E0' },
  { name: '疲惫', emoji: '😮‍💨', color: '#90A4AE', bg: '#ECEFF1' },
  { name: '感动', emoji: '🥹', color: '#E87DA0', bg: '#FCE4EC' },
  { name: '焦虑', emoji: '😰', color: '#C09DD0', bg: '#F3E5F5' }
]

const COLOR_LIST = [
  '#8BA676', '#E8A065', '#D47B7B', '#8EA4BF',
  '#C09DD0', '#F2C94C', '#E87DA0', '#5BC0EB', '#9B5DE5'
]

Page({
  data: {
    statusBarHeight: 0,
    dateTimeDisplay: '',
    dateShort: '',
    locationStatus: 'loading',
    locationName: '',
    locationAddress: '',
    latitude: 0,
    longitude: 0,
    text: '',
    photos: [],
    videoPath: '',
    videoDuration: 0,
    audioPath: '',
    audioDuration: 0,
    selectedColor: '#8BA676',
    selectedEmoji: '😊',
    selectedMoodName: '开心',
    selectedMoodColor: '#F2C94C',
    canSeal: false,
    isSealing: false,
    showEmojiPanel: false,
    moodList: MOOD_LIST,
    colorList: COLOR_LIST
  },

  onLoad() {
    const { statusBarHeight } = wx.getSystemInfoSync()
    const now = new Date()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const h = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')

    this.setData({
      statusBarHeight,
      dateTimeDisplay: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${h}:${min}`,
      dateShort: `${m}.${d} ${h}:${min}`
    })
    this.initLocation()
  },

  onUnload() {},

  // ===== 定位 =====
  async initLocation() {
    const authStatus = await checkLocationAuth()

    if (authStatus === 'denied') {
      // 之前明确拒绝过 → 提示去设置
      this.setData({ locationStatus: 'unauthorized' })
      return
    }

    if (authStatus === 'not-asked') {
      // 从未请求过 → 先请求授权
      try {
        await requestLocationAuth()
      } catch {
        this.setData({ locationStatus: 'unauthorized' })
        return
      }
    }

    // 已授权 → 获取坐标
    this.doLocate()
  },

  doLocate() {
    this.setData({ locationStatus: 'loading' })
    // 直接用 chooseLocation，一步到位获取地址名+坐标
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          locationStatus: 'success',
          latitude: res.latitude,
          longitude: res.longitude,
          locationName: res.name || res.address || '已定位',
          locationAddress: res.address || ''
        })
      },
      fail: () => {
        // 用户取消或调用失败，标记为可手动重试
        this.setData({ locationStatus: 'failed' })
      }
    })
  },

  onLocationTap() {
    const { locationStatus } = this.data
    if (locationStatus === 'unauthorized') {
      wx.openSetting({
        success: (res) => {
          if (res.authSetting['scope.userLocation']) {
            this.doLocate()
          }
        }
      })
    } else {
      // 任何状态都可以重新选择地点
      this.doLocate()
    }
  },

  // 文字
  onTextInput(e) {
    this.setData({ text: e.detail.value })
    this.checkCanSeal()
  },

  // 表情
  onEmojiAreaTap() {
    this.setData({ showEmojiPanel: true })
  },

  onToggleEmojiPanel() {
    this.setData({ showEmojiPanel: !this.data.showEmojiPanel })
  },

  onMoodSelect(e) {
    const index = e.currentTarget.dataset.index
    const mood = MOOD_LIST[index]
    this.setData({
      selectedEmoji: mood.emoji,
      selectedMoodName: mood.name,
      selectedMoodColor: mood.color,
      showEmojiPanel: false
    })
  },

  // 关闭
  onCloseTap() {
    const hasContent = this.data.text.trim() || this.data.photos.length > 0 || this.data.videoPath || this.data.audioPath
    if (hasContent) {
      wx.showModal({
        title: '放弃此次封存？',
        content: '已输入的内容将不会保存',
        cancelText: '继续',
        confirmText: '放弃',
        confirmColor: '#A09A92',
        cancelColor: '#8BA676',
        success: (res) => {
          if (res.confirm) wx.navigateBack()
        }
      })
    } else {
      wx.navigateBack()
    }
  },

  // 照片 — wx.chooseMedia 自带权限处理，无需手动预检
  onPhotoTap() {
    const remaining = 8 - this.data.photos.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多8张照片', icon: 'none' })
      return
    }
    wx.showActionSheet({
      itemList: ['拍摄照片', '从相册选择'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album']
        wx.chooseMedia({
          count: remaining,
          mediaType: ['image'],
          sourceType,
          success: (mediaRes) => {
            const newPhotos = mediaRes.tempFiles.map(f => f.tempFilePath)
            this.setData({ photos: [...this.data.photos, ...newPhotos] })
            this.checkCanSeal()
          },
          fail: (err) => {
            console.log('选择照片取消或失败', err)
          }
        })
      }
    })
  },

  onDeletePhoto(e) {
    const { index } = e.currentTarget.dataset
    const photos = [...this.data.photos]
    photos.splice(index, 1)
    this.setData({ photos })
    this.checkCanSeal()
  },

  // 视频
  onVideoTap() {
    if (this.data.videoPath) {
      wx.previewMedia({ sources: [{ url: this.data.videoPath, type: 'video' }] })
      return
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['camera', 'album'],
      maxDuration: 15,
      success: (res) => {
        const file = res.tempFiles[0]
        this.setData({ videoPath: file.tempFilePath, videoDuration: Math.round(file.duration) })
        this.checkCanSeal()
      }
    })
  },

  onDeleteVideo() {
    this.setData({ videoPath: '', videoDuration: 0 })
    this.checkCanSeal()
  },

  // 环境音 — 跳转到录音页
  onAudioTap() {
    wx.navigateTo({ url: '/pages/recorder/recorder' })
  },

  onPlayAudio() {
    if (!this.data.audioPath) return
    const ctx = wx.createInnerAudioContext()
    ctx.src = this.data.audioPath
    ctx.play()
  },

  onDeleteAudio() {
    this.setData({ audioPath: '', audioDuration: 0 })
    this.checkCanSeal()
  },

  // 颜色标记
  onColorTap(e) {
    this.setData({ selectedColor: e.currentTarget.dataset.color })
  },

  // 封存
  checkCanSeal() {
    const { text, photos, videoPath, audioPath } = this.data
    this.setData({
      canSeal: text.trim().length > 0 || photos.length > 0 || !!videoPath || !!audioPath
    })
  },

  // 从拍照页回调
  addPhotoFromCamera(path) {
    if (this.data.photos.length >= 8) return
    this.setData({ photos: [...this.data.photos, path] })
    this.checkCanSeal()
  },

  // 从录音页回调
  addAudioFromRecorder(path, duration) {
    console.log('收到录音回调:', path, duration)
    this.setData({
      audioPath: path,
      audioDuration: duration || 0
    })
    this.checkCanSeal()
  },

  async onSealTap() {
    if (!this.data.canSeal || this.data.isSealing) return
    this.setData({ isSealing: true })
    wx.vibrateShort({ type: 'light' })

    await saveCapsule({
      text: this.data.text,
      photos: this.data.photos,
      videoPath: this.data.videoPath,
      audioPath: this.data.audioPath,
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      locationName: this.data.locationName,
      locationAddress: this.data.locationAddress,
      color: this.data.selectedColor,
      mood: this.data.selectedMoodName,
      emoji: this.data.selectedEmoji
    })

    wx.vibrateShort({ type: 'light' })

    // 跳转到封存仪式页
    const text = encodeURIComponent(this.data.text.substring(0, 50))
    const loc = this.data.locationName || ''
    const dateLocation = encodeURIComponent(`${this.data.dateShort} ${loc}`)
    wx.redirectTo({
      url: `/pages/seal-ceremony/seal-ceremony?text=${text}&dateLocation=${dateLocation}`
    })
  }
})
