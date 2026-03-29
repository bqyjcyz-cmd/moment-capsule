# 此刻胶囊 — 项目长期记忆

## 项目概述
- **产品名**：此刻胶囊（Moment Capsule）
- **平台**：微信小程序（云开发），后续迁移独立 App
- **定位**：事件驱动的情感时间胶囊，不是日记 App，有感触才记
- **核心体验**：封存（seal）→ 地图/时间线回看 → 沉浸式重逢

## 技术栈
- 微信小程序原生（无框架）+ 微信云开发
- 云函数：capsule（单函数 action 路由）
- 存储：wx.setStorageSync（本地）+ 云数据库 capsules 集合 + 云存储（照片/视频/音频）

## 当前页面结构
- TabBar：地图（map）/ 时间线（timeline）
- 封存流程：seal → camera / recorder → seal-ceremony（仪式动效）
- 回看：review → edit-text
- 引导：onboarding

## 已识别的架构问题（2026-03-27 评审）

### P0 严重问题
1. **数据断层**：saveCapsule 只写本地 wx.setStorageSync，upload.js 和云函数 createCapsule 从未被调用。photos 字段存的是 tempFilePath，小程序重启后失效→数据丢失。
2. **同步阻塞**：storage.js 全用 wx.getStorageSync，数据量大时阻塞主线程。

### P1 问题
3. **marker ID Bug**：map.js 中 markers 经 filter 后用数组下标做 id，但 onMarkerTap 直接用 markerId 索引未过滤的 capsules 数组 → 下标错位。
4. **color/mood/emoji 字段丢失**：seal.js 传了这三个字段给 saveCapsule，但 storage.js 的 newCapsule 构造时没有包含它们。
5. **音频重复播放**：review.js 的 onShow 每次都重新创建 AudioContext，从 edit-text 返回时可能双重播放。
6. **timeline 月份筛选未实现**：onMonthTap 只更新 state，没有实际调用 getCapsulesByFilter。
7. **离线同步逻辑缺失**：syncStatus 字段已预留，但无网络恢复监听，无同步触发逻辑。

### P2 小问题
8. **date.js replace 顺序**：直接 .replace('M') 可能误匹配已替换内容，建议改正则。
9. **云函数全量查询**：getTodayInHistory 全量 get 后内存过滤，超 100 条会被截断。

## 上线前必做（约 4 天工作量）
- P0：上传媒体 → 存 fileID → 调用云函数写云端（2天）
- P1：修 marker Bug + color/mood 字段 + 音频 + 筛选 + 离线同步（2天）
- 审核：补隐私政策页 + scope.camera/record 权限说明文案

## 产品调性关键词
- 温暖、克制、不打扰
- 不催促记录（无连续天数、无频率统计）
- 封存有仪式感（"把瓶子扔进大海"）
- 回看 ≥ 记录
