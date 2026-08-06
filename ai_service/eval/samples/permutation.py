def per(num, sm):
    global result
    if sm >= result:
        return
    if num == N:
        result = sm
        return
    for i in range(N):
        if used[i]:
            continue
        used[i] = True
        per(num + 1, sm + arr[i][num])
        used[i] = False


T = int(input())
for t in range(1, T + 1):
    N = int(input())
    arr = [list(map(int, input().split())) for _ in range(N)]
    used = [False] * N
    result = 99 * N * N
    per(0, 0)
    print(f'#{t} {result}')
