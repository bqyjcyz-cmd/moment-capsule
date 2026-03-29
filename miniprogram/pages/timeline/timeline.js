const { formatDate } = require('../../utils/date')
const { getCapsules, getCapsulesByFilter } = require('../../utils/storage')

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

Page({
  data: {
    statusBarHeight: 0,
    groupedCapsules: [],
    isEmpty: true,
    isLoading: false,
    currentYear: new Date().getFullYear(),
    filterMonth: new Date().getMonth() + 1,
    filterMonthLabel: ''
  },

  onLoad() {
    const { statusBarHeight } = wx.getSystemInfoSync()
    const month = new Date().getMonth() + 1
    this.setData({
      statusBarHeight,
      filterMonth: month,
      filterMonthLabel: month + '月'
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 2 })
    }
    // 每次回到时间线，重置为当月
    const month = new Date().getMonth() + 1
    this.setData({
      currentYear: new Date().getFullYear(),
      filterMonth: month,
      filterMonthLabel: month + '月'
    })
    this.loadCapsules()
  },

  async loadCapsules() {
    this.setData({ isLoading: true })

    const { currentYear, filterMonth } = this.data
    const rawCapsules = await getCapsulesByFilter(currentYear, filterMonth)
    const now = new Date()

    const capsules = rawCapsules.map(c => {
      const d = new Date(c.createdAt)
      const dayOfWeek = DAY_NAMES[d.getDay()]
      const isRecent = (now - d) < 7 * 24 * 60 * 60 * 1000

      return {
        ...c,
        dateLabel: `${d.getMonth() + 1}月${d.getDate()}日 · ${dayOfWeek}`,
        monthKey: `${d.getMonth() + 1}月 ${d.getFullYear()}`,
        monthSort: d.getFullYear() * 100 + d.getMonth(),
        textPreview: c.text ? (c.text.length > 30 ? c.text.substring(0, 30) + '...' : c.text) : '',
        coverPhoto: c.photos && c.photos.length > 0 ? c.photos[0] : '',
        isRecent
      }
    })

    // 按月分组
    const groups = {}
    capsules.forEach(c => {
      if (!groups[c.monthKey]) {
        groups[c.monthKey] = { monthKey: c.monthKey, monthSort: c.monthSort, items: [] }
      }
      groups[c.monthKey].items.push(c)
    })

    const groupedCapsules = Object.values(groups).sort((a, b) => b.monthSort - a.monthSort)

    this.setData({
      groupedCapsules,
      isEmpty: capsules.length === 0,
      isLoading: false
    })
  },

  onPullDownRefresh() {
    this.loadCapsules().then(() => wx.stopPullDownRefresh())
  },

  onCardTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/review/review?id=${id}` })
  },

  onMonthTap(e) {
    const month = e.currentTarget.dataset.month
    this.setData({
      filterMonth: month,
      filterMonthLabel: month + '月'
    })
    this.loadCapsules()
  }
})
