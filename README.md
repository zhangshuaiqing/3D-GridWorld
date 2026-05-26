# 3D GridWorld

基于 Three.js + React 的 **三维网格世界环境**，用于强化学习可视化展示和 Agent 行为调试。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

浏览器打开 `http://localhost:5173`。

## 技术栈

| 层 | 工具 |
|---|------|
| 构建工具 | Vite |
| 语言 | TypeScript |
| UI 框架 | React + Zustand |
| 3D 渲染 | React Three Fiber (`@react-three/fiber`) |
| 3D 工具库 | `@react-three/drei` (OrbitControls) |
| 调试面板 | leva |
| 代码质量 | ESLint + Prettier (Vite 模板默认) |

## 环境逻辑

### 三维空间

- 网格定义：`grid[x][y][z]`，x/z 为水平面，y 为高度
- 默认尺寸：6×4×6（W×H×D），可通过设置面板调节
- 支持 randomStartGoal 随机起点/终点

### 动作空间

6 个离散动作：

| 动作 | 键位 | 方向 |
|------|------|------|
| 0 (+x) | D / → | 右 |
| 1 (-x) | A / ← | 左 |
| 2 (+y) | Q | 上 |
| 3 (-y) | E | 下 |
| 4 (+z) | W / ↑ | 前 |
| 5 (-z) | S / ↓ | 后 |

### 奖励设计

- 每步惩罚：`-0.1`
- 撞墙/越界：`-0.5`
- 向上移动：`-0.2`（爬坡代价）
- 到达目标：`+10`
- 超过最大步数：`-5`

### 观测模式

| 模式 | 说明 |
|------|------|
| full | 全局可视 |
| fog_of_war | 仅已访问格子可见，未探索区域迷雾 |

## 目录结构

```
3D-GridWorld/
├── index.html              # HTML 入口
├── package.json
├── vite.config.ts
├── tsconfig*.json
├── DEVELOPMENT_PLAN.md     # 开发计划
├── README.md               # 本文件
└── src/
    ├── main.tsx            # 入口
    ├── App.tsx             # 主组件（3D 场景 + UI 面板）
    ├── store.ts            # zustand 全局状态
    ├── types.ts            # 类型定义
    ├── constants.ts        # 常量（颜色、动作向量）
    ├── logic/
    │   └── gridworld.ts    # GridWorld3D 环境核心逻辑
    ├── components/
    │   ├── Grid.tsx        # 地面网格 + 高度指示线
    │   ├── Agent.tsx       # Agent 球体
    │   ├── Goal.tsx        # 目标点光柱
    │   ├── Obstacles.tsx   # 障碍物方块渲染
    │   ├── DynamicObstacle.tsx  # （预留）动态障碍物
    │   └── EditorOverlay.tsx    # 地图编辑器 3D 交互层
    └── panels/
        ├── ControlPanel.tsx     # 操作按钮（Step/Reset/AutoRun）
        ├── StatusPanel.tsx      # 状态信息面板
        ├── LegendPanel.tsx      # 图例面板
        ├── SettingsPanel.tsx    # 参数设置面板
        ├── ObservationPanel.tsx # 三视图小地图
        └── EditorPanel.tsx      # 地图编辑器工具栏
```

## 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 3D 场景渲染 | ✅ | Three.js 三维网格、光照、OrbitControls |
| Agent 移动 | ✅ | 键盘 WASD+QE / 方向键 / 按钮控制 |
| 障碍物生成 | ✅ | 随机生成 + BFS 可达性保证 |
| 奖励系统 | ✅ | 步进惩罚、碰撞惩罚、到达奖励 |
| 状态面板 | ✅ | 步数、坐标、奖励、done |
| 三视图小地图 | ✅ | 俯视 + 前视 + 侧视，显示 Agent 周围环境 |
| 观测模式 | ✅ | full / fog_of_war |
| 地图编辑器 | ✅ | 点击放置/删除障碍物、Y 层切换、随机填充 |
| 图例面板 | ✅ | 颜色形状说明 |
| 动态障碍物 | ⏳ | 待实现 |
| RL 接口 | ⏳ | window.__gridworld API 待实现 |
| 测试 | ⏳ | Vitest 单元测试待添加 |

## 地图编辑器

点击顶部 **🗺️ Edit Map** 按钮进入编辑器模式：

1. **点击方块**：切换障碍物/空地
2. **Y 层滑块**：选择当前编辑高度层
3. **Clear**：清空所有障碍物
4. **Random**：按当前比例随机填充
5. **Apply**：应用编辑并退出
6. **Cancel**：放弃修改

## 键盘快捷键

| 键位 | 功能 |
|------|------|
| WASD / 方向键 | XZ 平面移动 |
| Q / E | 上升 / 下降 |
| Space | 切换自动运行 |
| R | 重置环境 |

## RL 接口（待实现）

```javascript
window.__gridworld = {
  reset(config?)    // 重置环境
  step(action)      // 执行动作 (0-5)
  getState()        // 获取当前状态
  // ...更多 API
}
```

## 项目背景

本项目是 [navigation-agent](https://github.com/zhangshuaiqing/navigation-agent) 的 3D 演进版。从 2D GridWorld 升级为三维网格世界，用于可视化展示和强化学习模型训练的交互式环境。
