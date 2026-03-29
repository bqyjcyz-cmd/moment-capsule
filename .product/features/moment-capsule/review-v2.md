# Moment Capsule（此刻胶囊）— Product Review (Round 2)

## Summary

更新后的 brief 在原有基础上补充了离线策略、短视频（替代 Live Photo）、编辑/删除场景、存储策略和可观测成功指标。上轮评审的两个 Blocker 已解决，Scope 更聚焦。

## Review Dimensions

### 1. Completeness

**改善：**
- ✅ 离线/弱网场景已覆盖（本地暂存+自动同步）
- ✅ 编辑/删除场景已补充
- ✅ 关键词搜索移出 MVP，用地图+时间筛选替代
- ✅ 存储策略已明确（照片 ≤1MB，短视频 ≤15秒，环境音 ≤60秒，单颗 ≤7MB）
- ✅ 成功指标增加了代理指标（停留时长 >30秒、重复打开次数、记录完成率 >80%）

**残留（可留给设计阶段）：**
- 同一地点多次记录的组织和展示方式未定义
- 首次使用的权限授权引导流程未定义

### 2. User Experience

- 记录素材现有四种（文字、照片、短视频、环境音），需注意交互层级：文字+照片为一级入口，短视频和环境音为二级可选，避免界面过载
- 离线体验设计为"用户无感"，符合产品调性
- 短视频作为 Live Photo 替代方案，交互上需要明确引导（不是让用户拍 vlog，而是 3-5 秒的氛围捕捉）

### 3. Technical Feasibility

- 沉浸式回看已标注"需设计前做技术原型验证效果底线"，合理
- `wx.chooseMedia({ mediaType: ['video'], maxDuration: 15 })` 直接支持短视频录制，无技术阻碍
- 离线队列架构需在开发阶段优先设计，避免后期重构
- 数据模型应预留字段扩展性（后续 App 阶段需增加天气、Live Photo 等）

### 4. ROI

- MVP scope 精简合理，核心功能无冗余
- 开发量最大的"沉浸式回看"是核心差异点，值得重点投入
- 短视频功能基于小程序原生能力，几乎零额外开发成本

## Key Assumptions (updated)

| # | Assumption | Type | Risk | Validation Approach |
|---|-----------|------|------|---------------------|
| 1 | 用户在户外驻足时愿意花1-2分钟打字+拍照记录 | Usability | **High** | 自用2周，统计记录时长和完成率 |
| 2 | 照片+文字+短视频+环境音足以在回看时重现感受 | Desirability | **High** | 记录10颗胶囊后回看，评估感受重现度 |
| 3 | 小程序沉浸式回看体验能达到"足够好" | Feasibility | **Medium** | 设计前做技术原型 |
| 4 | 四种记录素材不会让界面过于复杂 | Usability | **Medium** | 设计阶段做交互层级验证 |
| 5 | 离线暂存+自动同步的可靠性 | Feasibility | **Low** | 开发阶段测试弱网场景 |

## Review Opinions

### Blockers (must resolve before design)

无。上轮两个 Blocker 已在 brief 中解决。

### Suggestions (carry forward to design)

| # | Issue | Recommendation |
|---|-------|----------------|
| 1 | 四种记录素材的交互层级 | 文字+照片为一级默认路径，短视频和环境音收在二级入口 |
| 2 | 首次使用权限授权流程 | 设计引导页，分步授权，解释"为什么需要这些权限" |
| 3 | 同一地点多次记录的展示 | 设计阶段需定义：聚合 or 展开 or 叠加 |
| 4 | 短视频的交互暗示 | 引导用户拍 3-5 秒氛围片段，而非长视频 |
| 5 | 数据模型预留扩展性 | 为后续 App 阶段的天气、Live Photo 等预留字段 |

### Future (noted, not for this iteration)

| # | Issue | Notes |
|---|-------|-------|
| 1 | 地理围栏重逢提醒 | App 阶段实现 |
| 2 | 原生 Live Photo 支持 | App 阶段实现 |
| 3 | 数据导出/备份 | App 阶段实现 |
| 4 | 自动环境数据采集（天气、温度） | v1.1 或 v2.0 |
| 5 | 从微信云迁移至自建后端 | App 阶段规划 |

## Verdict

- [x] **Approved** — proceed to /product-design
- [ ] Conditional — resolve blockers, then proceed
- [ ] Rejected — rethink the approach

Brief 方案完整、scope 合理、技术可行。可以进入设计阶段。
