# 此刻胶囊 — 小程序架构评审报告

> 评审时间：2026-03-27
> 评审范围：miniprogram/ 全部源码 + docs/ 产品文档

---

## 一、架构全局图（当前状态）

```
┌─────────────────────────────────────────────────────┐
│                   微信小程序前端                      │
│                                                     │
│  app.js（极简：云开发初始化 + globalData.openId）      │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ map 地图  │  │ timeline │  │  seal 封存（主流程）│  │
│  │ (TabBar) │  │ (TabBar) │  │  (navigateTo)    │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│       ↓               ↓              ↓              │
│  ┌────────────────────────────────────────────────┐ │
│  │           子页面                                │ │
│  │  review / edit-text / camera                   │ │
│  │  recorder / seal-ceremony / onboarding         │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌──── utils ──────────────────────────────────┐   │
│  │  storage.js   date.js   location.js          │   │
│  │  upload.js                                   │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  数据流：100% 读写本地 wx.StorageSync（同步阻塞）      │
│  云端：saveCapsule 仅保存本地，云函数 createCapsule   │
│        从未被调用（断层！）                            │
└─────────────────────────────────────────────────────┘
                          │
                          │ wx.cloud.callFunction（仅 login）
                          ▼
┌────────────────────────────────────────────────────┐
│            微信云开发（已配置但未打通）                │
│                                                     │
│  云函数 capsule：login / createCapsule /             │
│                  getCapsules / updateCapsule /       │
│                  deleteCapsule / getTodayInHistory   │
│                                                     │
│  云数据库：capsules 集合（结构已设计）                 │
│  云存储：photos/ videos/ audio/ 目录（upload.js 已写） │
└────────────────────────────────────────────────────┘
```

---

## 二、已完成的亮点

| 亮点 | 说明 |
|------|------|
| **工具函数分层清晰** | storage / date / location / upload 职责单一，可复用 |
| **权限处理完整** | checkLocationAuth 三态处理（authorized/denied/not-asked）规范 |
| **页面通信设计合理** | camera/recorder 用 getCurrentPages 回调父页面，不引入全局事件总线，轻量简洁 |
| **云函数设计预先完备** | action 路由模式，支持 login/CRUD/历史今日，云端结构已经思考到位 |
| **封存仪式感** | seal-ceremony 动画序列（phase 0→1→2→自动返回）体现了产品的仪式感设计理念 |
| **lazyCodeLoading** | app.json 已启用 requiredComponents，减少启动包加载 |
| **upload.js 的批量+压缩** | 照片上传已包含 compressImage（quality 80）和批量串行上传逻辑 |

---

## 三、关键问题诊断

### 🔴 P0 — 数据根本断层：本地存储 vs 云开发完全脱节

**问题描述**

```javascript
// seal.js 的 onSealTap — 只保存本地，从不上传
saveCapsule({ text, photos, videoPath, ... })  // ✅ 存本地

// upload.js 写好了，云函数 createCapsule 也写好了
// 但两者从未被调用
```

`saveCapsule` 只写 `wx.setStorageSync`，`photos` 字段存的是 `tempFilePath`（临时路径）。微信小程序的 `tempFilePath` **在小程序重启或一定时间后会失效**。用户封存后重启小程序，照片/视频/音频全部 404。

同时，云函数 `createCapsule`、`getCapsules`、`deleteCapsule` 等已经实现，`upload.js` 的批量上传也已完成，但**二者从未被连接**。

**风险：** 用户数据丢失，这是上线最大的 P0 问题。

---

### 🔴 P0 — wx.getStorageSync 同步阻塞主线程

```javascript
// storage.js — 全部使用同步 API
function getCapsules() {
  return wx.getStorageSync(CAPSULES_KEY) || []  // 阻塞 JS 线程
}

// map.js、timeline.js 的 onShow 中直接调用
loadCapsules() {
  const capsules = getCapsules()  // 同步读取，数据量大时卡顿
```

当胶囊数量增多（含图片路径、元数据），Storage 数据量会增大。`wx.getStorageSync` 在主线程同步执行，可能导致页面白屏/卡顿。

**建议：** 全部改为异步 `wx.getStorage`（Promise 化）。

---

### 🔴 P0 — tempFilePath 生命周期问题 + 媒体路径未持久化

```javascript
// storage.js saveCapsule
photos: capsule.photos || [],  // 存的是 tempFilePath！
videoPath: capsule.videoPath || '',
audioPath: capsule.audioPath || '',
```

`wx.chooseMedia` 返回的 `tempFilePath` 是临时文件，**小程序退出或一段时间后系统会清理**。本地存储中保存的路径会变成死链。

---

### 🟡 P1 — 云端写入未打通（离线同步机制未实现）

Brief 中明确要求"离线记录 + 自动同步"，`syncStatus: 'local'` 字段也已预留，但：

- 没有任何触发同步的逻辑（`app.js onShow`、`onNetworkStatusChange` 等均未实现）
- `upload.js` 的函数从未被调用
- 云函数中 `createCapsule` 准备好了，但前端没有调用入口

---

### 🟡 P1 — map.js 的 marker ID 使用数组下标，存在潜在 Bug

```javascript
const markers = capsules
  .filter(c => c.latitude && c.longitude)
  .map((c, i) => ({
    id: i,        // ← 使用数组索引！
    _id: c._id,
```

`onMarkerTap` 用 `markerId` 去 `capsules[markerId]` 取值：

```javascript
const capsule = this.data.capsules[markerId]  // ← 直接用 marker id 做下标
```

但 `markers` 是经过 `.filter()` 后的子集，而 `capsules` 是完整数组。**如果有胶囊没有坐标，两个数组的下标就对不上**，会拿到错误的胶囊或 undefined。

---

### 🟡 P1 — recorder.js 波形高度每秒随机生成，每次 setData 25 个值

```javascript
const heights = []
for (let i = 0; i < 25; i++) {
  heights.push(i < barCount ? 16 + Math.random() * 104 : 16)
}
this.setData({
  recordTime: t,
  timerDisplay: ...,
  activeWaveBars: barCount,
  waveHeights: heights   // 每秒 setData 一个 25 项数组
})
```

每秒触发一次 `setData` 传递 25 个随机高度，同时还更新了 timer 和 activeWaveBars。频繁 setData + 每次传较大数据，会有性能损耗（JS-原生桥通信）。

---

### 🟡 P1 — review.js 每次 onShow 重新加载，音频可能重复播放

```javascript
onShow() {
  if (this.capsuleId) {
    this.loadCapsule(this.capsuleId)  // 每次 onShow 都重新 load
  }
},

loadCapsule(id) {
  // ...
  if (capsule.audioPath) {
    setTimeout(() => this.playAudio(capsule.audioPath), 500)  // 又创建新 AudioContext
  }
}
```

从 edit-text 返回时会触发 `onShow`，重新加载并重新播放音频。如果上一次 `innerAudioContext` 没被 destroy，会出现两个音频同时播放。

---

### 🟡 P1 — timeline.js 的 filterMonth 功能未实现（遗留 TODO）

```javascript
onMonthTap(e) {
  const month = e.currentTarget.dataset.month
  this.setData({ filterMonth: month, filterMonthLabel: month + '月' })
  // 可扩展：按月过滤  ← 仅注释，未实现
}
```

`getCapsulesByFilter` 在 storage.js 中已实现，但 `timeline.js` 没有在 `loadCapsules` 中使用它，月份筛选逻辑是空的。

---

### 🟡 P1 — onboarding.js 的 onEnter 使用 navigateBack，首次进入时会失败

```javascript
onEnter() {
  wx.setStorageSync('hasOnboarded', true)
  wx.navigateBack()  // ← 如果是直接打开 onboarding，没有上一页！
}
```

`map.js` 用 `wx.navigateTo` 跳转到 onboarding，所以返回没问题。但如果未来调整首页 → onboarding 的方式（比如用 `wx.redirectTo`），这里会失败。建议统一用 `wx.switchTab({ url: '/pages/map/map' })` 作为兜底。

---

### 🟢 P2 — seal.js 的 saveCapsule 调用时 color/mood/emoji 未存入 newCapsule

```javascript
// storage.js saveCapsule — newCapsule 对象
const newCapsule = {
  _id, text, photos, videoPath, audioPath,
  latitude, longitude, locationName, locationAddress,
  createdAt, updatedAt, syncStatus
  // ← color / mood / emoji 没有保存！
}
```

```javascript
// seal.js 调用时传了 color/mood/emoji
saveCapsule({
  ...
  color: this.data.selectedColor,
  mood: this.data.selectedMoodName,
  emoji: this.data.selectedEmoji
})
```

`saveCapsule` 接收了 `color/mood/emoji`，但 `newCapsule` 的构造过程里没有这三个字段，它们被静默丢弃了。

---

### 🟢 P2 — 云函数 getTodayInHistory 全量拉取所有数据

```javascript
async function getTodayInHistory(openId) {
  const { data: capsules } = await db.collection('capsules')
    .where({ openId })
    .orderBy('createdAt', 'asc')
    .get()  // ← 全量拉取，再在内存里过滤
  
  const matches = capsules.filter(c => { ... })
}
```

没有分页或条数限制，用户胶囊数量多时会全量返回。云数据库单次 `.get()` 默认上限 100 条，超出时会静默截断，导致历史数据找不到。

---

### 🟢 P2 — date.js 的 formatDate 对 'D' 替换可能影响 'DD'

```javascript
return format
  .replace('YYYY', year)
  .replace('MM', ...)
  .replace('M', month)     // ← 'M' 会匹配 'MM' 中的字母！
  .replace('DD', ...)
  .replace('D', day)       // ← 'D' 也可能匹配已替换后的内容
  .replace('HH', ...)
  .replace('mm', ...)
```

`String.replace()` 非全局替换，只替换第一个匹配。但如果 `format` 中既有 `MM` 又有 `M`（比如 `'M月DD日 HH:mm'`），替换顺序不当会出错。建议改用正则全局替换或 `replaceAll`。

---

## 四、推荐架构改造方案（快速上线版）

### 4.1 数据层统一改造：本地优先 + 云端同步

```
┌─────────────────────────────────────────────────────┐
│                    DataStore 层（新增）               │
│                                                     │
│  saveCapusle(data)：                                 │
│    1. 上传媒体文件（upload.js）→ 获得 fileID          │
│    2. 写本地（带 fileID，不再存 tempFilePath）         │
│    3. 异步调用云函数 createCapsule                    │
│    4. 成功后更新本地 syncStatus: 'synced'             │
│                                                     │
│  loadCapsules()：                                   │
│    优先本地，后台增量同步云端                          │
└─────────────────────────────────────────────────────┘
```

**核心原则：本地存储永远存 fileID（云存储路径），不存 tempFilePath。**

### 4.2 推荐文件结构扩展

```
miniprogram/
├── app.js                    ← 加入 onNetworkStatusChange 监听
├── services/                 ← 新增服务层
│   ├── capsule.service.js    ← 统一胶囊的 CRUD（本地+云端）
│   └── sync.service.js       ← 离线队列 + 自动同步逻辑
├── utils/
│   ├── storage.js            ← 改为异步 API
│   ├── upload.js             ← 现有，已基本可用
│   ├── date.js               ← 修复 replace 顺序问题
│   └── location.js           ← 现有，逻辑正确
└── pages/                    ← 页面只调用 service 层
```

### 4.3 marker ID Bug 修复方案

```javascript
// map.js — 修复：用唯一 _id 建立映射，不依赖数组下标
const markerMap = {}
const markers = capsules
  .filter(c => c.latitude && c.longitude)
  .map((c, i) => {
    markerMap[i] = c  // 或用 _id 做 key
    return { id: i, _id: c._id, ... }
  })
this.markerMap = markerMap  // 挂在实例上

onMarkerTap(e) {
  const capsule = this.markerMap[e.detail.markerId]  // 安全取值
}
```

---

## 五、快速上线优先级行动清单

| 优先级 | 问题 | 行动 | 工作量 |
|--------|------|------|--------|
| 🔴 P0 | tempFilePath 失效 + 媒体未上传 | 在 onSealTap 中接入 uploadPhotos/uploadVideo/uploadAudio，存 fileID | 1 天 |
| 🔴 P0 | 云端写入断层 | 在 saveCapsule 后调用云函数 createCapsule | 半天 |
| 🔴 P0 | Storage 同步阻塞 | 将 getCapsules/saveCapsule 改为 async/await + wx.getStorage | 半天 |
| 🟡 P1 | marker ID Bug | 改用 markerMap 对象映射 | 1 小时 |
| 🟡 P1 | color/mood/emoji 丢失 | storage.js 的 newCapsule 加入这三个字段 | 30 分钟 |
| 🟡 P1 | review 音频重复播放 | onShow 中判断已在播放则不重新创建 | 1 小时 |
| 🟡 P1 | timeline 月份筛选空实现 | 在 loadCapsules 中接入 getCapsulesByFilter | 1 小时 |
| 🟡 P1 | 离线同步 | app.js 监听网络恢复后触发未同步项上传 | 1 天 |
| 🟢 P2 | date.js replace 顺序 | 改用正则全局替换 | 30 分钟 |
| 🟢 P2 | 云函数全量查询 | getTodayInHistory 加分页上限 | 30 分钟 |

**最小上线工作量估算：解决 P0 约需 2 天，P1 约需 2 天，共 4 天可达到安全上线状态。**

---

## 六、上线前检查清单（微信审核视角）

- [ ] **隐私政策**：使用了 `getLocation`/`camera`/`record`，必须有隐私政策页面，app.json 中配置 `__usePrivacyCheck__: true`
- [ ] **权限说明文案**：已有 `scope.userLocation` 的 desc，需补充 `scope.camera` 和 `scope.record` 的使用说明
- [ ] **域名白名单**：所有 wx.request 的域名需在微信公众平台配置（当前纯云开发暂不需要，但后续如接天气 API 等需要添加）
- [ ] **包大小**：当前结构简单，预计主包远低于 2MB，✅ 安全
- [ ] **tabBar 页面完整**：app.json 中 tabBar list 的页面必须存在，✅ 已满足
- [ ] **sitemap.json**：已有，✅
- [ ] **真机测试**：需在 iOS + Android 各做一轮，重点测试音频路径问题

---

## 七、总结

**此刻胶囊的产品方向和技术选型是对的**：微信云开发对于这个体量的个人工具完全够用，代码结构也已经很清晰。主要的问题集中在**数据层没有打通**——云函数写好了、上传工具写好了，但封存时两者都没被调用，导致数据停在了本地临时文件阶段。

解决掉 P0 的数据打通问题之后，这个小程序就具备安全上线的基础条件。之后再按 P1 清单逐步修复细节，体验就能达到 v1.0 的目标。
