// 媒体上传工具

// 上传单个文件到云存储
function uploadFile(filePath, cloudPath) {
  return wx.cloud.uploadFile({
    cloudPath,
    filePath
  })
}

// 批量上传照片
async function uploadPhotos(tempFilePaths) {
  const results = []
  for (let i = 0; i < tempFilePaths.length; i++) {
    const ext = tempFilePaths[i].split('.').pop() || 'jpg'
    const cloudPath = `photos/${Date.now()}_${i}.${ext}`
    try {
      const res = await uploadFile(tempFilePaths[i], cloudPath)
      results.push(res.fileID)
    } catch (err) {
      console.error(`上传第${i + 1}张照片失败`, err)
    }
  }
  return results
}

// 上传视频
async function uploadVideo(tempFilePath) {
  const ext = tempFilePath.split('.').pop() || 'mp4'
  const cloudPath = `videos/${Date.now()}.${ext}`
  try {
    const res = await uploadFile(tempFilePath, cloudPath)
    return res.fileID
  } catch (err) {
    console.error('上传视频失败', err)
    return null
  }
}

// 上传音频
async function uploadAudio(tempFilePath) {
  const ext = tempFilePath.split('.').pop() || 'mp3'
  const cloudPath = `audio/${Date.now()}.${ext}`
  try {
    const res = await uploadFile(tempFilePath, cloudPath)
    return res.fileID
  } catch (err) {
    console.error('上传音频失败', err)
    return null
  }
}

// 压缩图片
function compressImage(src) {
  return new Promise((resolve) => {
    wx.compressImage({
      src,
      quality: 80,
      success(res) {
        resolve(res.tempFilePath)
      },
      fail() {
        resolve(src) // 压缩失败用原图
      }
    })
  })
}

module.exports = {
  uploadPhotos,
  uploadVideo,
  uploadAudio,
  compressImage
}
