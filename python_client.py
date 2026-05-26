"""
3D GridWorld — Python RL Training Client

Connects to the 3D GridWorld WebSocket server and provides
a Gymnasium-like interface for training RL agents.

Usage:
    pip install websockets
    python python_client.py

Protocol:
    Send:   {"type": "request", "id": "1", "method": "reset", "params": []}
    Receive: {"type": "response", "id": "1", "result": {...state...}}

    All __gridworld API methods are available:
      reset, step, getState, getVisibleGrid, getActionSpace,
      setAgentPos, setGoalPos, setMode, setViewRange,
      getConfig, seed, render
"""

import json
import asyncio
import websockets
from typing import Any


class GridWorldClient:
    """Async client for 3D GridWorld over WebSocket."""

    def __init__(self, uri: str = "ws://localhost:5174"):
        self.uri = uri
        self._ws: websockets.WebSocketClientProtocol | None = None
        self._req_id = 0
        self._pending: dict[str, asyncio.Future] = {}

    async def connect(self):
        """Connect to the GridWorld WebSocket server."""
        self._ws = await websockets.connect(self.uri)
        print(f"[GridWorld] Connected to {self.uri}")
        # Start listener task
        asyncio.create_task(self._listen())

    async def _listen(self):
        """Background task: receive responses and resolve pending futures."""
        try:
            async for msg in self._ws:
                data = json.loads(msg)
                if data.get("type") == "response":
                    req_id = data.get("id")
                    if req_id in self._pending:
                        fut = self._pending.pop(req_id)
                        if "error" in data:
                            fut.set_exception(Exception(data["error"]))
                        else:
                            fut.set_result(data.get("result"))
        except websockets.exceptions.ConnectionClosed:
            print("[GridWorld] Connection closed")

    async def _call(self, method: str, *params) -> Any:
        """Send a method call and wait for response."""
        if not self._ws:
            raise RuntimeError("Not connected. Call connect() first.")
        self._req_id += 1
        req_id = str(self._req_id)
        fut = asyncio.get_event_loop().create_future()
        self._pending[req_id] = fut
        await self._ws.send(json.dumps({
            "type": "request",
            "id": req_id,
            "method": method,
            "params": list(params),
        }))
        return await fut

    # ---- RL Interface ----

    async def reset(self, **config_overrides) -> dict:
        """Reset the environment. Optionally pass config overrides."""
        params = [config_overrides] if config_overrides else []
        return await self._call("reset", *params)

    async def step(self, action: int) -> dict:
        """Take an action (0=+x, 1=-x, 2=+y, 3=-y, 4=+z, 5=-z). Returns state."""
        return await self._call("step", action)

    async def get_state(self) -> dict:
        """Get current environment state."""
        return await self._call("getState")

    async def get_visible_grid(self) -> list:
        """Get visible grid (respects observation mode)."""
        return await self._call("getVisibleGrid")

    async def get_action_space(self) -> list[int]:
        """Get available actions."""
        return await self._call("getActionSpace")

    async def set_agent_pos(self, x: int, y: int, z: int):
        """Manually set agent position."""
        return await self._call("setAgentPos", x, y, z)

    async def set_goal_pos(self, x: int, y: int, z: int):
        """Manually set goal position."""
        return await self._call("setGoalPos", x, y, z)

    async def set_mode(self, mode: str):
        """Set observation mode: 'full' or 'fog_of_war'."""
        return await self._call("setMode", mode)

    async def set_view_range(self, n: int):
        """Set view range."""
        return await self._call("setViewRange", n)

    async def seed(self, s: int):
        """Set random seed for deterministic maps."""
        return await self._call("seed", s)

    async def render(self):
        """Force 3D scene refresh."""
        return await self._call("render")

    async def close(self):
        """Close the connection."""
        if self._ws:
            await self._ws.close()


# ---- Example: Random Walk ----

async def main():
    client = GridWorldClient()
    await client.connect()

    # Reset with some dynamic obstacles
    state = await client.reset(numDynamicObstacles=3, dynamicObstacleSpeed=2)
    print(f"Environment: {state['width']}x{state['height']}x{state['depth']}")
    print(f"Agent starts at: {state['agentPos']}")
    print(f"Goal at: {state['goalPos']}")

    # Random walk
    total_reward = 0
    for i in range(50):
        import random
        action = random.choice([0, 1, 2, 3, 4, 5])
        state = await client.step(action)
        total_reward += state["reward"]

        if i % 10 == 0:
            print(f"Step {i}: pos={state['agentPos']}, reward={state['reward']:.1f}, done={state['done']}")

        if state["done"]:
            print(f"Episode done at step {i}! Total reward: {total_reward:.1f}")
            break

    print(f"Final total reward: {total_reward:.1f}")

    # Example: Deterministic seed
    await client.seed(42)
    state1 = await client.get_state()

    await client.seed(42)
    state2 = await client.get_state()

    # Compare grids (quick check)
    same = all(
        state1["grid"][x][y][z] == state2["grid"][x][y][z]
        for x in range(state1["width"])
        for y in range(state1["height"])
        for z in range(state1["depth"])
    )
    print(f"Seed determinism: {same}")

    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
