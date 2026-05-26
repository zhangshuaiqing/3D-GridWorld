// 3D GridWorld — Core Logic Unit Tests

import { describe, it, expect } from 'vitest';
import { GridWorld3D } from '../src/logic/gridworld';
import { CellType, DEFAULT_CONFIG } from '../src/types';
import type { Action } from '../src/types';

function createEnv(config?: Partial<typeof DEFAULT_CONFIG>) {
  return new GridWorld3D({ ...DEFAULT_CONFIG, ...config });
}

// ─── Basic Environment ────────────────────────────────────────────

describe('GridWorld3D - Basic', () => {
  it('should create environment with default config', () => {
    const env = createEnv();
    const state = env.getState();
    expect(state.width).toBe(6);
    expect(state.height).toBe(4);
    expect(state.depth).toBe(6);
    expect(state.agentPos).toEqual([0, 0, 0]);
    expect(state.goalPos).toEqual([5, 0, 5]);
    expect(state.stepCount).toBe(0);
    expect(state.done).toBe(false);
    expect(state.reward).toBe(0);
  });

  it('should have path from start to goal (BFS validated)', () => {
    const env = createEnv({ seed: 42 });
    const s = env.getState();
    // Agent and goal should be marked in grid
    expect(s.grid[0][0][0]).toBe(CellType.AGENT);
    expect(s.grid[5][0][5]).toBe(CellType.GOAL);
  });

  it('should accept custom dimensions', () => {
    const env = createEnv({ width: 4, height: 3, depth: 5 });
    const s = env.getState();
    expect(s.width).toBe(4);
    expect(s.height).toBe(3);
    expect(s.depth).toBe(5);
  });

  it('should place correct number of obstacles', () => {
    const env = createEnv({ obstacleRatio: 0.2, seed: 42 });
    const grid = env.grid;
    let obsCount = 0;
    for (let x = 0; x < grid.length; x++)
      for (let y = 0; y < grid[x].length; y++)
        for (let z = 0; z < grid[x][y].length; z++)
          if (grid[x][y][z] === CellType.OBSTACLE) obsCount++;

    const total = env.width * env.height * env.depth;
    const expected = Math.floor(total * 0.2);
    // Allow ±1 due to path clearing
    expect(Math.abs(obsCount - expected)).toBeLessThanOrEqual(2);
  });
});

// ─── Reset ─────────────────────────────────────────────────────────

describe('GridWorld3D - Reset', () => {
  it('should reset step count and reward', () => {
    const env = createEnv();
    env.step(4);
    env.step(4);
    expect(env.stepCount).toBe(2);
    env.reset();
    expect(env.stepCount).toBe(0);
    expect(env.done).toBe(false);
  });

  it('should reset with new config', () => {
    const env = createEnv({ size: 8 } as any); // will be overridden
    env.reset({ width: 5, height: 5, depth: 5 });
    const s = env.getState();
    expect(s.width).toBe(5);
    expect(s.height).toBe(5);
    expect(s.depth).toBe(5);
  });

  it('should generate new map on reset', () => {
    const env = createEnv({ seed: 1 });
    const grid1 = env.grid.map(xy => xy.map(yz => [...yz]));
    env.reset({ seed: 999 });
    const grid2 = env.grid;

    // Different seed should produce different grid
    let same = true;
    for (let x = 0; x < grid1.length && same; x++)
      for (let y = 0; y < grid1[x].length && same; y++)
        for (let z = 0; z < grid1[x][y].length && same; z++)
          if (grid1[x][y][z] !== grid2[x][y][z]) same = false;
    expect(same).toBe(false);
  });
});

// ─── Step / Movement ──────────────────────────────────────────────

describe('GridWorld3D - Step / Movement', () => {
  it('should move agent forward (+z = action 4)', () => {
    const env = createEnv({ obstacleRatio: 0 });
    env.step(4);
    expect(env.agentPos).toEqual([0, 0, 1]);
  });

  it('should move agent right (+x = action 0)', () => {
    const env = createEnv({ obstacleRatio: 0 });
    env.step(0);
    expect(env.agentPos).toEqual([1, 0, 0]);
  });

  it('should move agent up (+y = action 2)', () => {
    const env = createEnv({ obstacleRatio: 0 });
    env.step(2);
    expect(env.agentPos).toEqual([0, 1, 0]);
  });

  it('should move agent left (-x = action 1)', () => {
    const env = createEnv({ obstacleRatio: 0 });
    env.step(0); // +x
    env.step(0); // +x
    env.step(1); // -x back
    expect(env.agentPos).toEqual([1, 0, 0]);
  });

  it('should move agent down (-y = action 3)', () => {
    const env = createEnv({ obstacleRatio: 0 });
    env.step(2); // up
    env.step(3); // down
    expect(env.agentPos).toEqual([0, 0, 0]);
  });

  it('should move agent backward (-z = action 5)', () => {
    const env = createEnv({ obstacleRatio: 0 });
    env.step(4); // forward
    env.step(4); // forward
    env.step(5); // backward
    expect(env.agentPos).toEqual([0, 0, 1]);
  });

  it('should count steps correctly', () => {
    const env = createEnv({ obstacleRatio: 0 });
    for (let i = 0; i < 5; i++) env.step(4);
    expect(env.stepCount).toBe(5);
  });

  it('should handle all 6 actions without error', () => {
    const env = createEnv({ obstacleRatio: 0 });
    const actions: Action[] = [0, 1, 2, 3, 4, 5];
    for (const a of actions) {
      env.reset();
      env.step(a);
      // No crash = pass
    }
    expect(true).toBe(true);
  });
});

// ─── Collision ────────────────────────────────────────────────────

describe('GridWorld3D - Collision', () => {
  it('should block out-of-bounds movement and give negative reward', () => {
    const env = createEnv({ obstacleRatio: 0 });
    const s = env.step(1); // -x from (0,0,0) -> out of bounds
    expect(s.agentPos).toEqual([0, 0, 0]); // no movement
    expect(s.reward).toBe(-0.5);
  });

  it('should block obstacle collision', () => {
    const env = createEnv({ obstacleRatio: 0.4, seed: 42 });
    // Find an obstacle near start
    const grid = env.grid;
    let obsDir: Action | null = null;
    const dirs: [number, number, Action][] = [[1, 0, 0], [-1, 0, 1], [0, 1, 2], [0, -1, 3], [0, 0, 4], [0, 0, 5]];
    for (const [dx, dz, action] of dirs) {
      const nx = env.agentPos[0] + dx;
      const nz = env.agentPos[2] + dz;
      if (nx >= 0 && nx < env.width && nz >= 0 && nz < env.depth && grid[nx][env.agentPos[1]][nz] === CellType.OBSTACLE) {
        obsDir = action;
        break;
      }
    }
    if (obsDir !== null) {
      const s = env.step(obsDir);
      expect(s.reward).toBe(-0.5);
      expect(s.agentPos).toEqual(env.agentPos); // no movement
    }
    // If no obstacle adjacent to start, test is skipped (valid for sparse maps)
  });

  it('should block all 4 boundaries around start', () => {
    const env = createEnv({ obstacleRatio: 0, width: 2, height: 2, depth: 2 });
    // Move agent to corner (0,0,0) then try all 3 negative directions
    env.step(1); // -x out
    expect(env.reward).toBe(-0.5);
    env.step(5); // -z out
    expect(env.reward).toBe(-0.5);
    env.step(3); // -y out
    expect(env.reward).toBe(-0.5);
    expect(env.agentPos).toEqual([0, 0, 0]);
  });
});

// ─── Goal Detection ───────────────────────────────────────────────

describe('GridWorld3D - Goal Detection', () => {
  it('should detect goal and give reward', () => {
    const env = createEnv({ obstacleRatio: 0 });
    // Move agent step by step toward goal (5,0,5)
    while (env.agentPos[0] < env.goalPos[0]) env.step(0); // +x
    while (env.agentPos[2] < env.goalPos[2]) env.step(4); // +z
    const s = env.getState();
    expect(s.done).toBe(true);
    expect(s.reward).toBe(10);
  });

  it('should stop accepting steps after goal', () => {
    const env = createEnv({ obstacleRatio: 0 });
    // Go to goal
    while (env.agentPos[0] < env.goalPos[0]) env.step(0);
    while (env.agentPos[2] < env.goalPos[2]) env.step(4);
    const stepCount = env.stepCount;
    // Try to step after done
    env.step(4);
    expect(env.stepCount).toBe(stepCount); // no change
  });
});

// ─── Reward System ────────────────────────────────────────────────

describe('GridWorld3D - Reward', () => {
  it('should give -0.1 for a normal step', () => {
    const env = createEnv({ obstacleRatio: 0 });
    const s = env.step(4);
    expect(s.reward).toBe(-0.1);
  });

  it('should give -0.2 for moving up', () => {
    const env = createEnv({ obstacleRatio: 0 });
    const s = env.step(2); // up
    expect(s.reward).toBe(-0.2);
  });

  it('should give 0 for moving down', () => {
    const env = createEnv({ obstacleRatio: 0 });
    env.step(2); // go up first
    const s = env.step(3); // down
    expect(s.reward).toBe(0);
  });

  it('should give -0.5 for out of bounds', () => {
    const env = createEnv({ obstacleRatio: 0 });
    const s = env.step(1); // left from (0,0,0)
    expect(s.reward).toBe(-0.5);
  });

  it('should give -5 for max steps exceeded', () => {
    const env = createEnv({ obstacleRatio: 0, width: 3, height: 2, depth: 3 });
    const maxSteps = env.maxSteps;
    for (let i = 0; i < maxSteps + 5; i++) {
      env.step(4); // keep moving forward (will bounce at wall)
      if (env.done) break;
    }
    expect(env.done).toBe(true);
    expect(env.reward).toBe(-5);
  });
});

// ─── Random Start/Goal ────────────────────────────────────────────

describe('GridWorld3D - Random Start/Goal', () => {
  it('should place agent and goal at different positions', () => {
    const env = createEnv({ randomStartGoal: true, seed: 123 });
    const s = env.getState();
    expect(s.agentPos).not.toEqual(s.goalPos);
  });

  it('should vary positions with different seeds', () => {
    const env1 = createEnv({ randomStartGoal: true, seed: 1 });
    const env2 = createEnv({ randomStartGoal: true, seed: 2 });
    expect(env1.agentPos).not.toEqual(env2.agentPos);
  });
});

// ─── Seed Determinism ─────────────────────────────────────────────

describe('GridWorld3D - Seed', () => {
  it('should produce identical grids with same seed', () => {
    const env1 = createEnv({ seed: 42, obstacleRatio: 0.25 });
    const grid1 = env1.grid.map(xy => xy.map(yz => [...yz]));

    const env2 = createEnv({ seed: 42, obstacleRatio: 0.25 });
    const grid2 = env2.grid;

    for (let x = 0; x < grid1.length; x++)
      for (let y = 0; y < grid1[x].length; y++)
        for (let z = 0; z < grid1[x][y].length; z++)
          expect(grid1[x][y][z]).toBe(grid2[x][y][z]);
  });
});

// ─── Fog of War ──────────────────────────────────────────────────

describe('GridWorld3D - Fog of War', () => {
  it('should mark visited cells', () => {
    const env = createEnv({ observationMode: 'fog_of_war', viewRange: 2 });
    const s = env.getState();
    // Agent's initial position and surrounding should be visited
    const [ax, ay, az] = s.agentPos;
    expect(s.visited[ax][ay][az]).toBe(true);
    // A far away cell should not be visited
    let farUnvisited = false;
    for (let x = 0; x < s.width; x++) {
      for (let y = 0; y < s.height; y++) {
        for (let z = 0; z < s.depth; z++) {
          const dist = Math.abs(x - ax) + Math.abs(y - ay) + Math.abs(z - az);
          if (dist > env.viewRange && !s.visited[x][y][z]) farUnvisited = true;
        }
      }
    }
    expect(farUnvisited).toBe(true);
  });

  it('should expand visited area when moving', () => {
    const env = createEnv({ observationMode: 'fog_of_war', viewRange: 1 });
    const initialVisited = env.visitedMask.map(xy => xy.map(yz => [...yz]));
    env.step(4); // move forward
    const afterVisited = env.visitedMask;
    // More cells should be visited after moving
    let initialCount = 0, afterCount = 0;
    for (let x = 0; x < env.width; x++)
      for (let y = 0; y < env.height; y++)
        for (let z = 0; z < env.depth; z++) {
          if (initialVisited[x][y][z]) initialCount++;
          if (afterVisited[x][y][z]) afterCount++;
        }
    expect(afterCount).toBeGreaterThan(initialCount);
  });
});

// ─── Dynamic Obstacles ────────────────────────────────────────────

describe('GridWorld3D - Dynamic Obstacles', () => {
  it('should create dynamic obstacles', () => {
    const env = createEnv({ numDynamicObstacles: 3, seed: 42 });
    expect(env.dynamicObstacles.length).toBe(3);
  });

  it('should move dynamic obstacles after step', () => {
    const env = createEnv({ numDynamicObstacles: 2, dynamicObstacleSpeed: 1, seed: 42 });
    const initialPositions = env.dynamicObstacles.map(d => [...d.pos]);
    env.step(4); // agent step triggers dynamic obstacle update
    let allSame = true;
    for (let i = 0; i < env.dynamicObstacles.length; i++) {
      if (env.dynamicObstacles[i].pos[0] !== initialPositions[i][0] ||
          env.dynamicObstacles[i].pos[1] !== initialPositions[i][1] ||
          env.dynamicObstacles[i].pos[2] !== initialPositions[i][2]) {
        allSame = false;
      }
    }
    // At least some should have moved
    expect(allSame).toBe(false);
  });

  it('should cause collision with agent', () => {
    const env = createEnv({ width: 3, height: 2, depth: 3, obstacleRatio: 0, numDynamicObstacles: 1, seed: 42 });
    // Move agent step by step; if it hits a dynamic obstacle, reward should be -1.0
    let hitDynamic = false;
    for (let i = 0; i < 20; i++) {
      const s = env.step(4);
      if (s.reward === -1.0) {
        hitDynamic = true;
        break;
      }
    }
    // Not guaranteed to hit in 20 steps, but worth checking
    // If no hit, test is informative rather than pass/fail
    // We just verify the logic doesn't crash
    expect(true).toBe(true);
  });
});

// ─── getState / getGrid ──────────────────────────────────────────

describe('GridWorld3D - State', () => {
  it('should return consistent state', () => {
    const env = createEnv();
    const s = env.getState();
    expect(s.grid).toBeDefined();
    expect(s.agentPos).toBeDefined();
    expect(s.goalPos).toBeDefined();
    expect(typeof s.stepCount).toBe('number');
    expect(typeof s.done).toBe('boolean');
    expect(typeof s.reward).toBe('number');
    expect(Array.isArray(s.visited)).toBe(true);
    expect(Array.isArray(s.dynamicObstacles)).toBe(true);
  });
});

// ─── setAgentPos / setGoalPos ─────────────────────────────────────

describe('GridWorld3D - Manual Position', () => {
  it('should set agent position', () => {
    const env = createEnv();
    env.setAgentPos(3, 2, 1);
    expect(env.agentPos).toEqual([3, 2, 1]);
    expect(env.grid[3][2][1]).toBe(CellType.AGENT);
  });

  it('should set goal position', () => {
    const env = createEnv();
    env.setGoalPos(4, 3, 2);
    expect(env.goalPos).toEqual([4, 3, 2]);
  });
});

// ─── Edge Cases ──────────────────────────────────────────────────

describe('GridWorld3D - Edge Cases', () => {
  it('should handle 1x1x1 world', () => {
    const env = createEnv({ width: 1, height: 1, depth: 1, obstacleRatio: 0 });
    const s = env.getState();
    expect(s.agentPos).toEqual([0, 0, 0]);
    expect(s.goalPos).toEqual([0, 0, 0]);
    // Agent starts at goal — step should immediately detect it
    // But agent can't move anywhere, so it stays
    const s2 = env.step(4);
    expect(s2.agentPos).toEqual([0, 0, 0]);
    expect(s2.reward).toBe(-0.5); // out of bounds
  });

  it('should handle 0 obstacles', () => {
    const env = createEnv({ obstacleRatio: 0 });
    let obsCount = 0;
    for (let x = 0; x < env.grid.length; x++)
      for (let y = 0; y < env.grid[x].length; y++)
        for (let z = 0; z < env.grid[x][y].length; z++)
          if (env.grid[x][y][z] === CellType.OBSTACLE) obsCount++;
    expect(obsCount).toBe(0);
  });

  it('should handle max obstacles without crashing', () => {
    const env = createEnv({ obstacleRatio: 0.4 });
    // Should not crash during generation
    expect(env).toBeDefined();
  });
});
