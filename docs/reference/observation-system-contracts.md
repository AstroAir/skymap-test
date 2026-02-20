# 观测系统契约（坐标/评分/移动端）

本文档定义“全量一次到位”增强后的核心契约，作为前后端与测试统一依据。

## 1. 坐标与时制契约

- 统一帧枚举：`ICRF` / `CIRS` / `OBSERVED` / `VIEW`
- 统一时制枚举：`UTC` / `UT1` / `TT`
- 角度语义：
  - 经度：东经为正（East-positive）
  - 方位角：北=0°，东=90°
- 结果元数据（必须携带）：
  - `frame`
  - `epochJd`
  - `timeScale`
  - `qualityFlag`
  - `dataFreshness`
  - `generatedAt`

### EOP 与精度策略

- 内置基线 EOP 数据始终可用
- 网络可用时后台自动拉取更新
- 数据新鲜度分级：
  - `fresh`
  - `stale`
  - `fallback`
- `fallback` 时功能不降级，但 UI 必须显示精度回退状态

## 2. 推荐评分契约（v2）

支持 profile：

- `imaging`
- `visual`
- `hybrid`（对 imaging/visual 的 50/50 线性融合）

评分维度（0-100 归一）：

- `observability`
- `moonImpact`
- `equipmentMatch`
- `targetSuitability`
- `timingQuality`
- `difficultyPenalty`

固定权重：

- imaging：`30/20/25/10/10/5`
- visual：`35/10/5/25/20/5`
- hybrid：由 imaging/visual 各 50% 融合

缺设备参数时：

- 将 `equipmentMatch` 权重重分配到其它可计算维度
- 输出 `scoreConfidence`（`high` / `medium` / `low`）

## 3. 移动端功能可达矩阵

移动端不做功能阉割，仅允许入口形态差异（抽屉/分步入口）。

| 功能 | 移动端入口 |
| --- | --- |
| 今晚推荐 | 顶部抽屉 + 底部工具条 |
| Sky Atlas | 顶部抽屉 + 底部工具条 |
| Session Planner | 顶部抽屉 + 底部工具条 |
| 事件日历 | 顶部抽屉 + 底部工具条 |
| 板求解/坐标跳转 | 顶部抽屉 + 底部工具条 |
| 目镜模拟 | 顶部抽屉 + 底部工具条 |
| 设备管理 | 顶部抽屉 + 底部工具条 |
| 离线缓存 | 顶部抽屉 + 底部工具条 |
| 设置 | 顶部抽屉 |
| 对象信息 | 选择对象后信息面板/详情抽屉 |

### 触控与安全区

- 触控目标最小尺寸：44px（兼容 WCAG 2.2 与移动端可达性建议）
- 顶/底栏使用 `env(safe-area-inset-*)` 规避刘海与手势区遮挡

## 4. 一致性验证

- TS 与 Rust 使用同一银河坐标矩阵（J2000）实现互转
- M31 参考样例维持 1 arcsec 阈值一致性
- 关键坐标转换覆盖单测与 E2E 断言（可见性 + 可操作性 + 数值阈值）
