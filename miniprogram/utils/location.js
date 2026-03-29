// 地理位置工具

// 获取当前位置（宽松模式，更可靠）
function getLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: resolve,
      fail: reject
    })
  })
}

// 检查定位权限状态
// 返回: 'authorized' | 'denied' | 'not-asked'
function checkLocationAuth() {
  return new Promise((resolve) => {
    wx.getSetting({
      success(res) {
        const auth = res.authSetting['scope.userLocation']
        if (auth === true) {
          resolve('authorized')
        } else if (auth === false) {
          resolve('denied')
        } else {
          resolve('not-asked')
        }
      },
      fail() {
        resolve('not-asked')
      }
    })
  })
}

// 请求定位权限
function requestLocationAuth() {
  return new Promise((resolve, reject) => {
    wx.authorize({
      scope: 'scope.userLocation',
      success: resolve,
      fail: reject
    })
  })
}

module.exports = {
  getLocation,
  checkLocationAuth,
  requestLocationAuth
}
