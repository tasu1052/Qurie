# 버블 정렬
# 이웃한 두 수를 비교해서 큰 수를 뒤로 보내는 것을 반복하면
# 가장 큰 수부터 차례대로 맨 뒤에 정렬된다.


def bubble_sort(numbers):
    n = len(numbers)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            # TODO: 이웃한 두 수(numbers[j], numbers[j+1])를 비교해서
            #       앞의 수가 더 크면 자리를 바꾸세요.
            pass

    return numbers


if __name__ == "__main__":
    data = [5, 2, 9, 1, 7, 3]
    print("정렬 전:", data)
    print("정렬 후:", bubble_sort(data))

    # 완성하면 이렇게 출력됩니다:
    # 정렬 전: [5, 2, 9, 1, 7, 3]
    # 정렬 후: [1, 2, 3, 5, 7, 9]
