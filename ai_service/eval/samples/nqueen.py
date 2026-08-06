def checkmate(x, y):
    for i in visit:
        if (x, y) in i:
            visit.append([])
            return False
    visit_x = [(x, y)]
    for i in range(2):
        idx, idy = (x + 1, y - 1) if i == 0 else (x + 1, y + 1)
        step = -1 if i == 0 else 1
        while 0 <= idx <= N - 1 and 0 <= idy <= N - 1:
            visit_x.append((idx, idy))
            idx += 1
            idy += step
    visit.append(visit_x)
    return True


def permutation(num):
    global count
    if num >= 1:
        if not checkmate(num - 1, path[num - 1]):
            return
    if num == N:
        count += 1
        return
    for i in range(N):
        if used[i]:
            continue
        used[i] = True
        path.append(i)
        permutation(num + 1)
        path.pop()
        visit.pop()
        used[i] = False
