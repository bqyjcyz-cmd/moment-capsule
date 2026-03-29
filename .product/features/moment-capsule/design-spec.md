# Moment Capsule（此刻胶囊）— Design Spec

## Page Structure

### 12 screens designed, covering all v0.1 + v1.0 core flows:

| # | Screen | Description | Screenshot |
|---|--------|-------------|------------|
| 01 | Map Home | 地图首页，胶囊 Marker 散落 + 预览卡片 + "历史上的今天"浮层 + Tab Bar | `01-map-home.png` |
| 02 | Seal Page | 封存页，定位 + 文字输入 + 媒体按钮（照片/视频/环境音）+ 封存按钮 | `02-seal-page.png` |
| 03 | Immersive Review | 沉浸式回看页，照片全屏铺底 + 暗色蒙层 + 文字叠加 + 音频波形 | `03-immersive-review.png` |
| 04 | Timeline | 时间线页，胶囊卡片列表 + 时间筛选器 + Tab Bar | `04-timeline.png` |
| 05 | Onboarding 1 | 引导页 1/3，产品理念"此刻胶囊" | `05-onboarding.png` |
| 06 | Map Empty | 地图空状态，"你的胶囊会出现在这里" | `06-map-empty.png` |
| 07 | Onboarding 2 | 引导页 2/3，"这不是日记" | `07-onboarding-2.png` |
| 08 | Onboarding 3 | 引导页 3/3，权限授权页（位置/相机/麦克风分步授权） | `08-onboarding-3-permissions.png` |
| 09 | Video Recording | 视频录制页，全屏取景 + 按住录制 + 进度条 | `09-video-recording.png` |
| 10 | Location Picker | 位置修正页，地图选点 + 搜索 + 附近 POI | `10-location-picker.png` |
| 11 | Edit Text | 编辑文字页，可编辑文本 + 取消/保存 + 键盘 | `11-edit-text.png` |
| 12 | Seal Ceremony | 封存仪式动效关键帧，胶囊成形 + 发光 + "已封存" | `12-seal-ceremony.png` |

---

## Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#F5A623` | 封存按钮、活跃 Tab、Marker、关键操作 |
| Primary Gradient End | `#E8836B` | 渐变终点色 |
| Accent Light | `#FFD9A0` | 背景渐变、卡片高亮、Marker 发光 |
| Background | `#FFF8F0` | 日常模式页面背景（奶白色） |
| Surface | `#FFFFFF` | 卡片、输入框、Tab Bar |
| Text Primary | `#1C1C1C` | 标题、正文 |
| Text Secondary | `#4A4A4A` | 副标题 |
| Text Muted | `#9A9A9A` | 标签、时间、地名 |
| Text Placeholder | `#C8C0B4` | 输入框占位文字 |
| Border | `#E8E5E0` | 分割线、边框 |
| Immersive BG | `#2C2C2E` | 沉浸式回看背景 |
| Error | `#8B4049` | 删除、错误状态 |

### Typography

| Level | Size | Weight | Letter Spacing | Usage |
|-------|------|--------|---------------|-------|
| Display | 32px | 300 (Light) | -0.5px | 引导页标题 |
| Title | 28px | 300 (Light) | -0.5px | 时间线页标题 |
| Headline | 17-18px | 500 (Medium) | -0.3px | 页面标题、回看文字 |
| Body | 15-16px | 400 (Normal) | 0 | 正文、卡片文字 |
| Caption | 13px | 400-500 | 0-0.3px | 地名、日期、标签 |
| Micro | 10-11px | 500-600 | 0.5px | Tab 标签、角标 |

- Font: Inter (fallback: PingFang SC)
- Line height: 1.6 for body text, 1.05 for display

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| Page Padding | 20px | 页面左右内边距 |
| Section Gap | 12-16px | 卡片之间间距 |
| Card Padding | 16px | 卡片内边距 |
| Component Gap | 8px | 组件内元素间距 |

### Corner Radius

| Element | Radius |
|---------|--------|
| Cards | 16px |
| Buttons (CTA) | 26px (full round) |
| Tab Bar Pill | 36px |
| Photos | 8-12px |
| Input/Search | 12px |
| Media Pill Buttons | 20px |
| Permission Icon Circle | 22px |

### Shadows

| Type | Value | Usage |
|------|-------|-------|
| Card | `0 2px 8px rgba(0,0,0,0.03)` | 时间线卡片 |
| Float | `0 4px 20px rgba(0,0,0,0.06)` | Tab Bar、预览卡片 |
| CTA | `0 4px 16px rgba(245,166,35,0.19)` | 封存按钮 |
| Marker Glow | `0 2px 8px rgba(245,166,35,0.25)` | 地图胶囊标记 |

---

## Key Interaction Flows

### Flow 1: First Open → Onboarding → Map

```
Screen 05 → Screen 07 → Screen 08 → Screen 06
(理念介绍)   (不是日记)   (分步授权)   (地图空状态)
```

### Flow 2: Seal a Capsule

```
Screen 01/04 → Screen 02 → [Screen 10] → [Screen 09] → Screen 12 → Screen 01
(地图/时间线)   (封存页)     (选位置,可选)  (录视频,可选)  (封存仪式)   (地图+新Marker)
```

### Flow 3: Review a Capsule

```
Screen 01 → Preview Card → Screen 03 → [Screen 11]
(点击Marker)  (底部弹出)    (沉浸回看)   (编辑文字,可选)

Screen 04 → Screen 03
(时间线点击)  (沉浸回看)
```

---

## States Checklist

| Screen | Default | Empty | Loading | Error | Boundary |
|--------|---------|-------|---------|-------|----------|
| Map Home | ✅ 01 | ✅ 06 | — | — | v1.1 聚合 |
| Seal Page | ✅ 02 | — | 封存中 | 定位失败/权限拒绝 | 9张照片上限 |
| Immersive Review | ✅ 03 | — | 加载中 | 照片加载失败 | 长文字滚动 |
| Timeline | ✅ 04 | 空状态 | 骨架屏 | 加载失败重试 | 分页加载 |
| Onboarding 1 | ✅ 05 | — | — | — | — |
| Onboarding 2 | ✅ 07 | — | — | — | — |
| Onboarding 3 | ✅ 08 | — | — | 权限被拒→"去设置" | — |
| Video Recording | ✅ 09 | — | — | 相机权限被拒 | 15秒上限 |
| Location Picker | ✅ 10 | — | 搜索中 | 逆地理编码失败 | — |
| Edit Text | ✅ 11 | — | — | — | — |
| Seal Ceremony | ✅ 12 | — | — | — | — |

---

## Design Assets

- **Pencil file**: 当前 Pencil 编辑器中（建议保存为 `moment-capsule-v1.pen`）
- **Screenshots**: `docs/screens/` 目录下 12 张 @2x PNG
- **Design References**: `docs/design-references.md`

## Restoration Notes (for development)

1. **双色调模式是核心**：日常操作用暖色浅底（#FFF8F0），沉浸回看切换为深色照片铺底 — 这个对比暗示"进入另一个时空"
2. **封存仪式动效不可省略**：即使 v0.1 简化版，也至少需要一个"内容汇聚成点 → 飘走"的过渡，不能用普通 Toast 替代
3. **Tab Bar 中间封存按钮要突出**：渐变圆形 + 发光阴影，是整个 App 最重要的操作入口
4. **Marker 不能用默认红色钉子**：必须用琥珀色渐变圆形，带发光阴影，这是产品视觉识别的核心
5. **文案不能有感叹号**：所有文案遵循"温暖、克制、不打扰"原则
6. **引导页授权是分步的**：三个权限独立授权，不是一次性全弹，用户可以跳过任意权限
