Component({
  data: {
    active: 0
  },

  methods: {
    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index)

      // 中间按钮 → 封存页
      if (index === 1) {
        wx.navigateTo({ url: '/pages/seal/seal' })
        return
      }

      this.setData({ active: index })
      const url = index === 0 ? '/pages/map/map' : '/pages/timeline/timeline'
      wx.switchTab({ url })
    }
  }
})
