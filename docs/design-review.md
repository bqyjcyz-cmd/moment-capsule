# Moment Capsule（此刻胶囊）— Design Review

## Review Basis
- Original requirement: brief.md core scenarios (6 scenarios)
- Design intent: design-spec.md (12 screens, Warm Capsule style)
- Design output: Pencil file `new.pen`

## Verdict

- [x] **Conditional** — 1 issue fixed directly in Pencil, 4 suggestions noted for development

## Dimension Reviews

### 1. Interaction Logic

| Scenario (from brief.md) | Path in Design | Issue | Severity |
|--------------------------|----------------|-------|----------|
| 驻足记录 | Screen 02 → 12 → 01 | 完整路径 | OK |
| 弱网/离线记录 | 交互规格定义完整，缺视觉设计稿 | 离线状态标识缺设计稿 | Suggest |
| 地图回看 | Screen 01 → Preview Card → 03 | 完整 | OK |
| 时间线回看 | Screen 04 → 03 | 完整 | OK |
| 快速回溯 | Screen 04 筛选器 + 01 地图缩放 | 完整 | OK |
| 编辑/删除 | Screen 03 → ··· → 11 | 完整 | OK |

### 2. Information Hierarchy
- 双色调模式（日常暖色 / 回看深色）层级清晰
- 封存页：文字为主、媒体为辅，层级正确
- 沉浸回看：文字 18px → 地名 13px 80% → 时间 13px 60%，层级正确

### 3. State Completeness
- 默认状态：12/12 屏全部完成 ✅
- 空状态：地图空状态已设计 ✅
- 异常状态（Loading/Error/Disabled）：交互规格中有文字定义，缺设计稿 ⚠️

### 4. Consistency
- 色彩/圆角/间距/字号 全局一致 ✅
- Tab Bar 结构在地图页和时间线页一致 ✅
- 渐变方向 #F5A623→#E8836B 全局统一 ✅

### 5. Usability
- 文字对比度 6.8:1，超过 WCAG AA 4.5:1 ✅
- Marker 32px 视觉大小偏小，需开发时扩大热区到 44px
- 封存页关闭按钮 24px，需扩大热区

## Modifications Made

| # | Issue | Change Made | Verified |
|---|-------|------------|----------|
| 1 | 地图首页缺少定位按钮 | 添加 40px 白色圆形 locate 按钮 | ✅ |

## Outstanding Issues

| # | Issue | Severity | Recommendation |
|---|-------|----------|----------------|
| 1 | 离线状态视觉标识缺设计稿 | Suggest | 开发时参照 interaction-spec 7.2 节 |
| 2 | 键盘弹起后媒体按钮可见性 | Suggest | 开发时确保媒体栏固定在键盘上方 |
| 3 | Marker/关闭按钮点击热区偏小 | Suggest | 开发时 padding 扩大到 44px |
| 4 | 权限页状态变化缺设计稿 | Suggest | 交互规格中有定义 |
