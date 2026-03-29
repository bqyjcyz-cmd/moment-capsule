// 本地存储管理 — 异步 API + 云端同步
const { uploadPhotos, uploadVideo, uploadAudio, compressImage } = require('./upload')

const CAPSULES_KEY = 'capsules'

// 获取所有本地胶囊（异步）
function getCapsules() {
  return new Promise((resolve) => {
    wx.getStorage({
      key: CAPSULES_KEY,
      success: (res) => resolve(res.data || []),
      fail: () => resolve([])
    })
  })
}

// 同步版本（仅用于非关键路径，如 onShow 快速渲染）
function getCapsulesSync() {
  return wx.getStorageSync(CAPSULES_KEY) || []
}

// 写入本地存储（异步）
function setCapsulesAsync(capsules) {
  return new Promise((resolve) => {
    wx.setStorage({
      key: CAPSULES_KEY,
      data: capsules,
      success: resolve,
      fail: resolve
    })
  })
}

// 上传媒体文件，返回 fileID（替代 tempFilePath）
async function uploadMedia(capsuleData) {
  const result = { photos: [], videoFileID: '', audioFileID: '' }

  // 压缩并上传照片
  if (capsuleData.photos && capsuleData.photos.length > 0) {
    const compressed = []
    for (const p of capsuleData.photos) {
      compressed.push(await compressImage(p))
    }
    result.photos = await uploadPhotos(compressed)
  }

  // 上传视频
  if (capsuleData.videoPath) {
    result.videoFileID = await uploadVideo(capsuleData.videoPath) || ''
  }

  // 上传音频
  if (capsuleData.audioPath) {
    result.audioFileID = await uploadAudio(capsuleData.audioPath) || ''
  }

  return result
}

// 保存胶囊（本地 + 上传媒体 + 云端同步）
async function saveCapsule(capsuleData) {
  const now = new Date().toISOString()
  const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

  // 先立即存本地（用 tempFilePath，保证快速响应）
  const newCapsule = {
    _id: localId,
    text: capsuleData.text || '',
    photos: capsuleData.photos || [],
    videoPath: capsuleData.videoPath || '',
    audioPath: capsuleData.audioPath || '',
    latitude: capsuleData.latitude || 0,
    longitude: capsuleData.longitude || 0,
    locationName: capsuleData.locationName || '',
    locationAddress: capsuleData.locationAddress || '',
    color: capsuleData.color || '#8BA676',
    mood: capsuleData.mood || '',
    emoji: capsuleData.emoji || '',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'local'
  }

  const capsules = await getCapsules()
  capsules.unshift(newCapsule)
  await setCapsulesAsync(capsules)

  // 异步上传媒体 + 云端同步（不阻塞用户）
  syncToCloud(newCapsule).catch(err => console.error('云端同步失败', err))

  return newCapsule
}

// 异步同步到云端
async function syncToCloud(capsule) {
  try {
    // 上传媒体文件
    const media = await uploadMedia(capsule)

    // 调用云函数写入数据库
    const { result } = await wx.cloud.callFunction({
      name: 'capsule',
      data: {
        action: 'createCapsule',
        data: {
          text: capsule.text,
          photos: media.photos,
          video: media.videoFileID || null,
          audio: media.audioFileID || null,
          location: { latitude: capsule.latitude, longitude: capsule.longitude },
          locationName: capsule.locationName,
          locationAddress: capsule.locationAddress,
          color: capsule.color,
          mood: capsule.mood,
          emoji: capsule.emoji
        }
      }
    })

    // 更新本地：替换 tempFilePath 为 fileID，标记已同步
    const capsules = await getCapsules()
    const idx = capsules.findIndex(c => c._id === capsule._id)
    if (idx >= 0) {
      capsules[idx].photos = media.photos.length > 0 ? media.photos : capsules[idx].photos
      capsules[idx].videoPath = media.videoFileID || capsules[idx].videoPath
      capsules[idx].audioPath = media.audioFileID || capsules[idx].audioPath
      capsules[idx].syncStatus = 'synced'
      capsules[idx].cloudId = result._id
      await setCapsulesAsync(capsules)
    }

    console.log('云端同步成功', result._id)
  } catch (err) {
    console.error('云端同步失败，保持本地状态', err)
    // syncStatus 保持 'local'，下次可重试
  }
}

// 同步所有未上传的胶囊
async function syncPending() {
  const capsules = await getCapsules()
  const pending = capsules.filter(c => c.syncStatus === 'local')
  for (const c of pending) {
    await syncToCloud(c).catch(() => {})
  }
}

// 更新胶囊文字
async function updateCapsuleText(id, text) {
  const capsules = await getCapsules()
  const index = capsules.findIndex(c => c._id === id)
  if (index >= 0) {
    capsules[index].text = text
    capsules[index].updatedAt = new Date().toISOString()
    await setCapsulesAsync(capsules)
    return true
  }
  return false
}

// 删除胶囊
async function deleteCapsule(id) {
  const capsules = await getCapsules()
  const filtered = capsules.filter(c => c._id !== id)
  await setCapsulesAsync(filtered)
  return true
}

// 获取单个胶囊
async function getCapsuleById(id) {
  const capsules = await getCapsules()
  return capsules.find(c => c._id === id) || null
}

// 按时间筛选
async function getCapsulesByFilter(year, month) {
  let capsules = await getCapsules()
  if (year) {
    capsules = capsules.filter(c => {
      const d = new Date(c.createdAt)
      if (month) return d.getFullYear() === year && d.getMonth() + 1 === month
      return d.getFullYear() === year
    })
  }
  return capsules
}

// "历史上的今天"
async function getTodayInHistory() {
  const capsules = await getCapsules()
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate()
  const year = now.getFullYear()

  const matches = capsules.filter(c => {
    const d = new Date(c.createdAt)
    return d.getMonth() === month && d.getDate() === day && d.getFullYear() !== year
  })

  return matches.length > 0 ? matches[matches.length - 1] : null
}

module.exports = {
  getCapsules,
  getCapsulesSync,
  saveCapsule,
  syncPending,
  updateCapsuleText,
  deleteCapsule,
  getCapsuleById,
  getCapsulesByFilter,
  getTodayInHistory
}
