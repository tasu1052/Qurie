from collections import deque


def bfs(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    queue = deque([(start, 0)])
    seen = {start}
    moves = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    while queue:
        (r, c), dist = queue.popleft()
        if (r, c) == goal:
            return dist
        for dr, dc in moves:
            nr, nc = r + dr, c + dc
            if not (0 <= nr < rows and 0 <= nc < cols):
                continue
            if grid[nr][nc] == 1 or (nr, nc) in seen:
                continue
            seen.add((nr, nc))
            queue.append(((nr, nc), dist + 1))
    return -1
