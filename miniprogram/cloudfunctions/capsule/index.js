const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  const openId = wxContext.OPENID

  switch (action) {
    case 'login':
      return { openId }

    case 'createCapsule':
      return createCapsule(openId, data)

    case 'getCapsules':
      return getCapsules(openId, data)

    case 'getCapsuleDetail':
      return getCapsuleDetail(openId, data)

    case 'updateCapsule':
      return updateCapsule(openId, data)

    case 'deleteCapsule':
      return deleteCapsule(openId, data)

    case 'getTodayInHistory':
      return getTodayInHistory(openId)

    default:
      return { error: 'unknown action' }
  }
}

// 创建胶囊
async function createCapsule(openId, data) {
  const { text, photos, video, audio, location, locationName, locationAddress, color, mood, emoji } = data
  const now = new Date()
  const capsule = {
    openId,
    text: text || '',
    photos: photos || [],
    video: video || null,
    audio: audio || null,
    location: {
      type: 'Point',
      coordinates: [location.longitude, location.latitude]
    },
    latitude: location.latitude,
    longitude: location.longitude,
    locationName: locationName || '',
    locationAddress: locationAddress || '',
    color: color || '#8BA676',
    mood: mood || '',
    emoji: emoji || '',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced'
  }
  const result = await db.collection('capsules').add({ data: capsule })
  return { _id: result._id, createdAt: now }
}

// 获取胶囊列表
async function getCapsules(openId, data) {
  const { page = 1, pageSize = 20, year, month } = data || {}
  let query = db.collection('capsules').where({ openId })

  if (year) {
    const startDate = new Date(year, month ? month - 1 : 0, 1)
    const endDate = month
      ? new Date(year, month, 1)
      : new Date(year + 1, 0, 1)
    query = query.where({
      openId,
      createdAt: _.gte(startDate).and(_.lt(endDate))
    })
  }

  const { total } = await query.count()
  const { data: capsules } = await query
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  return { capsules, total, page, pageSize }
}

// 获取胶囊详情
async function getCapsuleDetail(openId, data) {
  const { id } = data
  const { data: capsule } = await db.collection('capsules').doc(id).get()
  if (capsule.openId !== openId) return { error: 'unauthorized' }
  return { capsule }
}

// 更新胶囊（编辑文字）
async function updateCapsule(openId, data) {
  const { id, text } = data
  const { data: capsule } = await db.collection('capsules').doc(id).get()
  if (capsule.openId !== openId) return { error: 'unauthorized' }

  await db.collection('capsules').doc(id).update({
    data: {
      text,
      updatedAt: new Date()
    }
  })
  return { success: true }
}

// 删除胶囊
async function deleteCapsule(openId, data) {
  const { id } = data
  const { data: capsule } = await db.collection('capsules').doc(id).get()
  if (capsule.openId !== openId) return { error: 'unauthorized' }

  // 删除关联的媒体文件
  const fileIDs = [...(capsule.photos || [])]
  if (capsule.video) fileIDs.push(capsule.video)
  if (capsule.audio) fileIDs.push(capsule.audio)
  if (fileIDs.length > 0) {
    await cloud.deleteFile({ fileList: fileIDs })
  }

  await db.collection('capsules').doc(id).remove()
  return { success: true }
}

// "历史上的今天"
async function getTodayInHistory(openId) {
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate()

  // 分页查询，避免全量拉取
  let allCapsules = []
  let hasMore = true
  let skip = 0
  const batchSize = 100

  while (hasMore) {
    const { data } = await db.collection('capsules')
      .where({ openId })
      .orderBy('createdAt', 'asc')
      .skip(skip)
      .limit(batchSize)
      .get()
    allCapsules = allCapsules.concat(data)
    hasMore = data.length === batchSize
    skip += batchSize
  }

  const matches = allCapsules.filter(c => {
    const d = new Date(c.createdAt)
    return d.getMonth() === month && d.getDate() === day && d.getFullYear() !== now.getFullYear()
  })

  return { capsule: matches.length > 0 ? matches[0] : null }
}
