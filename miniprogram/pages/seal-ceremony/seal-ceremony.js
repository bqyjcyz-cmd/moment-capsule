Page({
  data: {
    text: '',
    dateLocation: '',
    phase: 0 // 0: 初始, 1: 便签收缩+胶囊出现, 2: 胶囊飘走
  },

  onLoad(options) {
    const text = decodeURIComponent(options.text || '')
    const dateLocation = decodeURIComponent(options.dateLocation || '')
    this.setData({ text, dateLocation })

    // 动画序列
    setTimeout(() => this.setData({ phase: 1 }), 600)
    setTimeout(() => this.setData({ phase: 2 }), 2000)
    setTimeout(() => wx.navigateBack(), 3000)
  }
})
