const { updateCapsuleText } = require('../../utils/storage')

Page({
  data: {
    statusBarHeight: 0,
    id: '',
    text: '',
    originalText: '',
    hasChanged: false,
    location: '',
    date: ''
  },

  onLoad(options) {
    const { statusBarHeight } = wx.getSystemInfoSync()
    const text = decodeURIComponent(options.text || '')
    const location = decodeURIComponent(options.location || '')
    const date = decodeURIComponent(options.date || '')

    this.setData({
      statusBarHeight,
      id: options.id,
      text,
      originalText: text,
      location,
      date
    })
  },

  onTextInput(e) {
    const text = e.detail.value
    this.setData({
      text,
      hasChanged: text !== this.data.originalText
    })
  },

  onCancel() {
    if (this.data.hasChanged) {
      wx.showModal({
        title: '放弃修改？',
        content: '',
        cancelText: '继续编辑',
        confirmText: '放弃',
        confirmColor: '#9A9A9A',
        success: (res) => {
          if (res.confirm) wx.navigateBack()
        }
      })
    } else {
      wx.navigateBack()
    }
  },

  async onSave() {
    if (!this.data.hasChanged) {
      wx.navigateBack()
      return
    }

    await updateCapsuleText(this.data.id, this.data.text)

    wx.showToast({ title: '已保存', icon: 'none' })
    setTimeout(() => wx.navigateBack(), 800)
  }
})
