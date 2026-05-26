# 3D GridWorld

基于 Three.js + React 的 **三维网格世界环境**，用于强化学习可视化展示和 Agent 行为调试。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（局域网可访问）
npm run dev

# 构建生产版本
npm run build
```

浏览器打开 `http://localhost:5173`。同一局域网其他设备用 `http://<你的IP>:5173` 访问。

## 技术栈

| 层 | 工具 |
|---|------|
| 构建工具 | Vite |
| 语言 | TypeScript |
| UI 框架 | React + Zustand |
| 3D 渲染 | React Three Fiber (`@react-three/fiber`) |
| 3D 工具库 | `@react-three/drei` (OrbitControls, Text) |
| 调试面板 | leva |
| 代码质量 | ESLint (Vite 模板默认) |

## 环境逻辑

### 三维空间

- 网格定义：`grid[x][y][z]`，x/z 为水平面，y 为高度
- 使用 Three.js 右手坐标系：X 向右、Y 向上、Z 向前
- 默认尺寸：6×4×6（W×H×D）
- 支持随机/固定起点终点

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
- 碰撞动态障碍物：`-1.0`
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
├── index.html
├── src/
│   ├── main.tsx               # 入口 + window.__gridworld 挂载
│   ├── App.tsx                # 主组件（3D 场景 + UI 面板）
│   ├── store.ts               # zustand 全局状态
│   ├── types.ts               # 类型定义
│   ├── constants.ts           # 常量
│   ├── logic/
│   │   └── gridworld.ts       # GridWorld3D 环境核心逻辑
│   ├── components/
│   │   ├── Grid.tsx           # 地面网格 + 外框 + 坐标轴标注
│   │   ├── Agent.tsx          # Agent 球体
│   │   ├── Goal.tsx           # 目标光柱
│   │   ├── Obstacles.tsx      # 静态障碍物 + 边框线
│   │   ├── DynamicObstacle.tsx # 动态障碍物 + 方向箭头
│   │   ├── EditorOverlay.tsx  # 编辑器视觉覆盖层
│   │   └── Cursor.tsx         # 编辑器游标
│   ├── panels/
│   │   ├── ControlPanel.tsx   # 操作按钮（Agent/游标双模式）
│   │   ├── StatusPanel.tsx    # 状态信息
│   │   ├── LegendPanel.tsx    # 图例
│   │   ├── SettingsPanel.tsx  # 参数设置（含动态障碍物）
│   │   ├── ObservationPanel.tsx # 三视图小地图
│   │   ├── EditorPanel.tsx    # 地图编辑器工具栏
│   │   └── DynObsPanel.tsx    # 动态障碍物独立控制
│   └── rl/
│       └── interface.ts       # RL 接口实现
├── DEVELOPMENT_PLAN.md
└── README.md
```

## 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 3D 场景渲染 | ✅ | 三维网格、光照、OrbitControls |
| Agent 移动 | ✅ | 6 方向 WASD+QE / 键盘 + 按钮 |
| 静态障碍物 | ✅ | 随机生成 + BFS 可达性保证 |
| 动态障碍物 | ✅ | bounce/random 双模式，独立控制 |
| 奖励系统 | ✅ | 步进/碰撞/爬坡/到达/超步惩罚 |
| 状态面板 | ✅ | 步数、三维坐标、奖励、done |
| 三视图小地图 | ✅ | TOP + FRONT + SIDE |
| 观测模式 | ✅ | full / fog_of_war |
| 地图编辑器 | ✅ | 键盘游标编辑 + 文件导入/导出 JSON |
| 外框 + 坐标系 | ✅ | 3D 边界框 + X/Y/Z 轴标注 |
| 动态障碍物控制 | ✅ | 每个障碍物独立 Mode/Speed |
| RL 接口 | ✅ | window.__gridworld API |
| 局域网访问 | ✅ | vite --host |
| 测试 | ✅ | Vitest 单元测试（39项，覆盖核心逻辑） |
```

## 运行测试

```bash
# 运行所有测试
npm run test

# 监视模式（开发时使用）
npm run test:watch
```

测试覆盖范围（39 项）：

| 测试类别 | 数量 | 说明 |
|---------|------|------|
| 基础环境 | 3 | 创建、BFS 可达性、自定义尺寸 |
| 重置 | 3 | 重置步数/奖励、新配置、新地图 |
| 移动 | 8 | 6 方向移动、步数计数、全部动作 |
| 碰撞 | 3 | 越界、障碍物、多边界 |
| 目标检测 | 2 | 到达目标、停止接受步数 |
| 奖励系统 | 5 | 正常步进、爬坡、下降、越界、超步 |
| 随机起点终点 | 2 | 不同位置、不同种子 |
| 种子确定性 | 1 | 相同种子相同地图 |
| Fog of War | 2 | 访问标记、移动扩展 |
| 动态障碍物 | 3 | 创建、移动、碰撞 |
| 状态 | 1 | getState 一致性 |
| 手动设置 | 2 | setAgentPos、setGoalPos |
| 边界情况 | 3 | 1x1x1、0障碍物、最大障碍物 |

## RL 接口

浏览器控制台可直接调用 `window.__gridworld`：

```javascript
// 获取完整状态
__gridworld.getState()
// 返回: { grid, agentPos, goalPos, stepCount, done, reward, visited, dynamicObstacles }

// 执行动作 (0=+x, 1=-x, 2=+y, 3=-y, 4=+z, 5=-z)
__gridworld.step(4)  // 向前移动

// 重置环境
__gridworld.reset()

// 获取可见网格（受观测模式影响）
__gridworld.getVisibleGrid()

// 设置观测模式
__gridworld.setMode('fog_of_war')

// 设置视野范围
__gridworld.setViewRange(3)

// 事件监听
__gridworld.on('goal', (state) => console.log('到达目标!', state))
__gridworld.on('collision', (state) => console.log('撞墙了'))
__gridworld.on('collision_dynamic', (state) => console.log('被动态障碍物撞了'))

// 设置随机种子
__gridworld.seed(42)

// 强制刷新 3D 场景
__gridworld.render()

// 获取当前配置
__gridworld.getConfig()
```

### 接口文档

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `reset` | `config?` | `GridWorldState` | 重置环境，可选覆盖配置 |
| `step` | `action: 0\|1\|2\|3\|4\|5` | `GridWorldState` | 执行动作 |
| `getState` | — | `GridWorldState` | 当前完整状态 |
| `getVisibleGrid` | — | `number[][][]` | 可见网格（-1=不可见） |
| `getActionSpace` | — | `[0,1,2,3,4,5]` | 动作空间 |
| `setAgentPos` | `x,y,z` | `void` | 设置 Agent 位置 |
| `setGoalPos` | `x,y,z` | `void` | 设置目标位置 |
| `setMode` | `'full'\|'fog_of_war'` | `void` | 切换观测模式 |
| `setViewRange` | `n: number` | `void` | 设置视野范围 |
| `getConfig` | — | `GridWorldConfig` | 当前配置 |
| `seed` | `s: number` | `void` | 设置随机种子 |
| `render` | — | `void` | 强制刷新 3D |
| `on` | `event, callback` | `void` | 订阅事件 |
| `off` | `event, callback` | `void` | 取消订阅 |

### 事件列表

| 事件 | 触发时机 |
|------|---------|
| `step` | 每步执行后 |
| `reset` | 重置后 |
| `goal` | 到达目标 |
| `collision` | 撞墙/越界 |
| `collision_dynamic` | 撞到动态障碍物 |

## 地图编辑器

点击顶部按钮进入编辑器模式，使用键盘游标编辑：

- **WASD/方向键**：移动游标（XZ 平面）
- **Q/E**：上下移动
- **Space/F**：切换障碍物/空地
- **R**：重置

工具栏按钮：Clear（清空）、Random（随机填充）、Apply（应用）、Cancel（取消）
文件按钮：Import Map（加载 JSON）、Export Map（导出 JSON）、Example（下载示例）

### JSON 地图格式

```json
{
  "width": 6,
  "height": 4,
  "depth": 6,
  "agentPos": [0, 0, 0],
  "goalPos": [5, 0, 5],
  "obstacles": [[1, 0, 1], [2, 0, 1], [3, 0, 1]]
}
```

## 键盘快捷键

| 键位 | 普通模式 | 编辑模式 |
|------|---------|---------|
| WASD / 方向键 | XZ 平面移动 | 移动游标 |
| Q / E | 上升 / 下降 | 游标上 / 下 |
| Space | 切换自动运行 | 切换障碍物 |
| F | — | 切换障碍物 |
| R | 重置环境 | 重置环境 |

## 动态障碍物

设置面板中 **Dyn** 滑块控制数量（0~8），**Spd** 控制全局速度。

右侧 **Dynamic Obstacles** 面板可单独设置每个障碍物：

- **Mode**: Bounce（碰壁反弹）/ Random（随机游走）
- **Speed**: 每 N 步移动一次

## 项目背景

本项目是 [navigation-agent](https://github.com/zhangshuaiqing/navigation-agent) 的 3D 演进版。从 2D GridWorld 升级为三维网格世界，用于可视化展示和强化学习模型训练的交互式环境。
