# 3D GridWorld 开发计划

> 基于 Three.js 的 3D GridWorld 环境，用于可视化展示和强化学习模型训练。

## 项目定位

纯浏览器端的 3D GridWorld 环境，从 2D GridWorld（navigation-agent 项目）升级为三维网格世界，提供：

- **3D 可视化**：第三人称自由视角，3D 渲染三维网格空间
- **交互控制**：6 方向键盘控制 Agent 移动
- **三视图小地图**：俯视 + 前视 + 侧视辅助导航
- **观测模式**：full / fog_of_war
- **地图编辑器**：直观的 3D 点击编辑
- **RL 接口**（待实现）：`window.__gridworld` 对接训练

## 技术选型

| 层 | 工具 | 说明 |
|---|------|------|
| 构建 | Vite | 零配置启动、HMR 热更新 |
| 语言 | TypeScript | 类型安全、接口声明清晰 |
| UI 框架 | React + zustand | 状态管理统一，组件化 UI |
| 3D 渲染 | React Three Fiber | 声明式 3D 场景，组件化管理 |
| 调试 | leva | 实时调参面板 |

## 目录结构

```
3D-GridWorld/
├── index.html
├── src/
│   ├── main.tsx               # 入口
│   ├── App.tsx                # 主组件
│   ├── store.ts               # zustand 全局状态
│   ├── types.ts               # 类型定义
│   ├── constants.ts           # 常量
│   ├── logic/
│   │   └── gridworld.ts       # GridWorld3D 核心逻辑
│   ├── components/
│   │   ├── Grid.tsx           # 地面网格 + 高度指示
│   │   ├── Agent.tsx          # Agent 球体
│   │   ├── Goal.tsx           # 目标光柱
│   │   ├── Obstacles.tsx      # 障碍物渲染
│   │   ├── DynamicObstacle.tsx # 动态障碍物（预留）
│   │   └── EditorOverlay.tsx  # 编辑器交互层
│   └── panels/
│       ├── ControlPanel.tsx   # 操作按钮
│       ├── StatusPanel.tsx    # 状态信息
│       ├── LegendPanel.tsx    # 图例
│       ├── SettingsPanel.tsx  # 参数设置
│       ├── ObservationPanel.tsx # 三视图小地图
│       └── EditorPanel.tsx    # 编辑器工具栏
├── DEVELOPMENT_PLAN.md
└── README.md
```

## 已完成功能

- [x] Vite + TS + React + R3F + zustand 脚手架
- [x] 3D GridWorld 核心逻辑（grid[x][y][z]）
- [x] 6 方向移动 + 键盘控制
- [x] 碰撞检测 + 奖励系统
- [x] 随机/固定起点终点
- [x] 状态面板 + 图例面板
- [x] 参数设置面板
- [x] 三视图小地图（TOP/FRONT/SIDE）
- [x] full / fog_of_war 观测模式
- [x] 地图编辑器（点击编辑 + Y 层切换）

## 待实现功能

- [ ] 动态障碍物
- [ ] RL 接口 window.__gridworld
- [ ] Vitest 单元测试
- [ ] GitHub Pages 部署

## 验收标准

- [x] 3D 场景加载，自由视角控制
- [x] 键盘控制 Agent 三维移动
- [x] 图例清晰说明所有元素
- [x] 状态面板实时更新
- [x] 三视图小地图正确显示
- [x] 观测模式工作正常
- [ ] 动态障碍物展示正确
- [ ] RL 接口可用
- [ ] 地图编辑器可用
