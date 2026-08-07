# 피보나치 수열
# n번째 피보나치 수를 반환한다.
# 예: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...


def fibonacci(n):
    if n <= 1:
        return n

    prev, curr = 0, 1
    for _ in range(2, n + 1):
        # TODO: 이전 두 수를 더해 다음 수를 만들고, prev와 curr를 한 칸씩 옮기세요.
        pass

    return curr


if __name__ == "__main__":
    for i in range(10):
        print(f"fibonacci({i}) = {fibonacci(i)}")

    # 완성하면 이렇게 출력됩니다:
    # fibonacci(0) = 0
    # fibonacci(1) = 1
    # fibonacci(2) = 1
    # fibonacci(3) = 2
    # fibonacci(4) = 3
    # fibonacci(5) = 5
    # ...
