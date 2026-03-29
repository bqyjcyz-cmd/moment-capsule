Page({
  data: {
    statusBarHeight: 0,
    authReady: false,
    devicePosition: 'back',
    flash: 'off',
    mode: 'photo',
    lastPhoto: ''
  },

  onLoad() {
    const { statusBarHeight } = wx.getSystemInfoSync()
    this.setData({ statusBarHeight })
    this.checkCameraAuth()
  },

  checkCameraAuth() {
    wx.getSetting({
      success: (res) => {
        const auth = res.authSetting['scope.camera']
        if (auth === true) {
          this.setData({ authReady: true })
          this.cameraCtx = wx.createCameraContext()
        } else if (auth === false) {
          wx.showModal({
            title: '需要相机权限',
            content: '请在设置中允许使用相机',
            confirmText: '去设置',
            cancelText: '返回',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (s) => {
                    if (s.authSetting['scope.camera']) {
                      this.setData({ authReady: true })
                      this.cameraCtx = wx.createCameraContext()
                    } else {
                      wx.navigateBack()
                    }
                  }
                })
              } else {
                wx.navigateBack()
              }
            }
          })
        } else {
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              this.setData({ authReady: true })
              this.cameraCtx = wx.createCameraContext()
            },
            fail: () => wx.navigateBack()
          })
        }
      }
    })
  },

  onClose() {
    wx.navigateBack()
  },

  onFlashToggle() {
    this.setData({
      flash: this.data.flash === 'off' ? 'on' : 'off'
    })
  },

  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.mode })
  },

  onFlipTap() {
    this.setData({
      devicePosition: this.data.devicePosition === 'back' ? 'front' : 'back'
    })
  },

  onGalleryTap() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath
        this.returnPhoto(path)
      }
    })
  },

  onShutterTap() {
    if (!this.cameraCtx) return

    wx.vibrateShort({ type: 'light' })

    this.cameraCtx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.returnPhoto(res.tempImagePath)
      },
      fail: (err) => {
        console.error('拍照失败', err)
        wx.showToast({ title: '拍照失败', icon: 'none' })
      }
    })
  },

  returnPhoto(path) {
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage && prevPage.addPhotoFromCamera) {
      prevPage.addPhotoFromCamera(path)
    }
    wx.navigateBack()
  },

  onCameraError(e) {
    console.error('相机错误', e.detail)
    wx.showToast({ title: '相机不可用', icon: 'none' })
  }
})
