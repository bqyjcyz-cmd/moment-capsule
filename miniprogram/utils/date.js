// 日期格式化工具

function formatDate(date, format = 'YYYY年M月D日') {
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date)
  }
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  // 用占位符避免替换冲突
  // 先把长 token 替换为占位符，再替换短 token，最后还原
  return format
    .replace('YYYY', String(year))
    .replace('MM', '\x01')
    .replace('DD', '\x02')
    .replace('HH', '\x03')
    .replace('mm', '\x04')
    .replace('M', String(month))
    .replace('D', String(day))
    .replace('\x01', String(month).padStart(2, '0'))
    .replace('\x02', String(day).padStart(2, '0'))
    .replace('\x03', String(hour).padStart(2, '0'))
    .replace('\x04', String(minute).padStart(2, '0'))
}

function formatRelativeDate(date) {
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date)
  }
  const now = new Date()
  const diffYears = now.getFullYear() - date.getFullYear()

  if (diffYears === 1) return '一年前的今天'
  if (diffYears === 2) return '两年前的今天'
  if (diffYears > 2) return `${diffYears}年前的今天`

  const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth()
  if (diffMonths === 1) return '上个月的今天'
  if (diffMonths > 1) return `${diffMonths}个月前的今天`

  return formatDate(date)
}

module.exports = {
  formatDate,
  formatRelativeDate
}
