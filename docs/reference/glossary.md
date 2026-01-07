# 术语表

本术语表解释天文学和软件开发中的专业术语。

## A

### Altitude (高度角)

天体相对于地平圈的角距离，从地平圈（0°）到天顶（+90°）或天底（-90°）。

### Apparent Magnitude (视星等)

天体在地球上的观测亮度。数值越小，天体越亮。

### Azimuth (方位角)

从正北沿地平圈向东测量的角度，范围0°-360°。

## C

### Celestial Sphere (天球)

以观测者为球心的假想球体，所有天体都投影在这个球面上。

### Coordinate System (坐标系)

用于描述天体位置的数学系统。常见的有地平坐标系、赤道坐标系等。

## D

### Declination (赤纬)

天体距离天赤道的角距离，向北为正，向南为负，范围-90°到+90°。

### Deep Sky Object (深空天体)

除太阳系天体和恒星外的天体，如星云、星团、星系等。

## E

### Ecliptic (黄道)

太阳在天球上的视运动路径，也是地球公转轨道面与天球的交线。

### Equatorial Coordinate System (赤道坐标系)

以天赤道为基准的坐标系，使用赤经和赤纬表示天体位置。

### Extinction (消光)

星光穿过地球大气时被吸收和散射的现象。

## H

### Horizontal Coordinate System (地平坐标系)

以观测者地平圈为基准的坐标系，使用方位角和高度角表示天体位置。

## I

### IPC (Inter-Process Communication, 进程间通信)

不同进程之间交换数据的技术。Tauri使用IPC在前后端之间通信。

## J

### Julian Day (儒略日)

从公元前4713年1月1日正午开始连续计数的天数，常用于天文计算。

## L

### Local Sidereal Time (地方恒星时)

观测者所在位置的恒星时，等于春分点的地方时角。

## M

### Meridian (子午线)

通过天顶、天底和天极的大圆。

### Magnitude (星等)

天体亮度的度量。星等每差1，亮度相差约2.512倍。

## N

### Nebula (星云)

宇宙中的云状结构，可以是气体、尘埃或恒星系统。

## R

### Right Ascension (赤经)

沿天赤道从春分点向东测量的角度，通常用时、分、秒表示，范围0h-24h。

### Refraction (折射)

光线从太空进入地球大气时发生的偏折现象。

## S

### Seeing (视宁度)

大气湍流引起的星像抖动和模糊程度，影响观测质量。

### Sidereal Time (恒星时)

以地球相对于恒星的自转为基准的时间系统。

## T

### Twilight (曙暮光)

日出前和日后的天空变亮现象。

### Transit (中天)

天体经过观测者子午线的时刻。

## U

### Universal Time (世界时)

基于地球自转的时间系统，相当于格林尼治平太阳时。

### UTC (协调世界时)

使用跳秒保持与世界时接近的原子时间标准。

## Z

### Zenith (天顶)

观测者正上方的点，高度角为+90°。

### Zenith Distance (天顶距)

天体距离天顶的角距离，等于90°减去高度角。

## 开发术语

### Component (组件)

React中的可复用UI单元。

### Hook (钩子)

React 16.8引入的特性，允许在函数组件中使用状态和其他React特性。

### IPC Command (IPC命令)

前端通过Tauri IPC调用的后端Rust函数。

### Rate Limiting (速率限制)

限制单位时间内请求次数的安全机制，防止 API 滥用和资源耗尽。

### SSRF (Server-Side Request Forgery, 服务端请求伪造)

攻击者诱使服务器向内部资源发起请求的安全漏洞。SkyMap 通过 URL 验证防止此类攻击。

### Store (存储)

Zustand中的状态管理单元。

### Tauri

使用Web技术构建轻量级桌面应用的框架。

### URL Validation (URL 验证)

验证 URL 安全性的机制，阻止访问私有 IP、localhost 和危险协议。

---

返回：[参考资料](index.md)
