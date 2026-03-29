Page({
  data: {
    statusBarHeight: 0,
    isRecording: false,
    isPaused: false,
    audioPath: '',
    recordTime: 0,
    timerDisplay: '00:00',
    activeWaveBars: 0,
    waveHeights: []
  },

  onLoad() {
    const { statusBarHeight } = wx.getSystemInfoSync()
    this.setData({ statusBarHeight })
    this.recorderManager = wx.getRecorderManager()

    this.recorderManager.onStop((res) => {
      this.clearTimer()
      this.setData({
        audioPath: res.tempFilePath,
        isRecording: false,
        isPaused: false
      })
    })

    this.recorderManager.onError((err) => {
      console.error('录音错误', err)
      this.clearTimer()
      this.setData({ isRecording: false })
      wx.showToast({ title: '录音失败', icon: 'none' })
    })
  },

  onUnload() {
    this.clearTimer()
    if (this.data.isRecording && this.recorderManager) {
      this.recorderManager.stop()
    }
  },

  onRecordToggle() {
    if (this.data.isRecording) {
      this.recorderManager.stop()
      return
    }

    // 暂停状态 → 恢复录音
    if (this.data.isPaused) {
      this.recorderManager.resume()
      this.setData({ isPaused: false, isRecording: true })
      this.resumeTimer()
      return
    }

    // 直接开始录音，recorderManager.start() 会自动触发权限弹窗
    this.startRecording()
  },

  startRecording() {
    this.setData({
      audioPath: '',
      recordTime: 0,
      timerDisplay: '00:00',
      isRecording: true,
      activeWaveBars: 0
    })

    this.recorderManager.start({
      duration: 60000,
      format: 'mp3'
    })

    this.timer = setInterval(() => {
      const t = this.data.recordTime + 1
      const min = String(Math.floor(t / 60)).padStart(2, '0')
      const sec = String(t % 60).padStart(2, '0')

      // 模拟波形
      const barCount = Math.min(t, 25)
      const heights = []
      for (let i = 0; i < 25; i++) {
        heights.push(i < barCount ? 16 + Math.random() * 104 : 16)
      }

      this.setData({
        recordTime: t,
        timerDisplay: `${min}:${sec}`,
        activeWaveBars: barCount,
        waveHeights: heights
      })

      if (t >= 60) {
        this.recorderManager.stop()
      }
    }, 1000)
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  resumeTimer() {
    this.timer = setInterval(() => {
      const t = this.data.recordTime + 1
      const min = String(Math.floor(t / 60)).padStart(2, '0')
      const sec = String(t % 60).padStart(2, '0')
      const barCount = Math.min(t, 25)
      const heights = []
      for (let i = 0; i < 25; i++) {
        heights.push(i < barCount ? 16 + Math.random() * 104 : 16)
      }
      this.setData({
        recordTime: t,
        timerDisplay: `${min}:${sec}`,
        activeWaveBars: barCount,
        waveHeights: heights
      })
      if (t >= 60) this.recorderManager.stop()
    }, 1000)
  },

  onPause() {
    if (!this.data.isRecording) return
    this.recorderManager.pause()
    this.clearTimer()
    this.setData({ isPaused: true, isRecording: false })
  },

  onDelete() {
    if (!this.data.audioPath) return
    this.setData({
      audioPath: '',
      recordTime: 0,
      timerDisplay: '00:00',
      activeWaveBars: 0,
      waveHeights: []
    })
  },

  onCancel() {
    if (this.data.isRecording) {
      this.recorderManager.stop()
    }
    wx.navigateBack()
  },

  onRetry() {
    this.setData({
      audioPath: '',
      recordTime: 0,
      timerDisplay: '00:00',
      activeWaveBars: 0,
      waveHeights: []
    })
  },

  onPlayPreview() {
    if (!this.data.audioPath) return
    if (this._previewCtx) {
      this._previewCtx.stop()
      this._previewCtx.destroy()
    }
    this._previewCtx = wx.createInnerAudioContext()
    this._previewCtx.src = this.data.audioPath
    this._previewCtx.play()
  },

  onUse() {
    if (!this.data.audioPath) return
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage && prevPage.addAudioFromRecorder) {
      prevPage.addAudioFromRecorder(this.data.audioPath, this.data.recordTime)
    }
    wx.navigateBack()
  }
})
