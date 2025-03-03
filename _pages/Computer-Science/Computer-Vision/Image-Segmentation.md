---
title: 지역적 밝기 변화 검출하기
tags:
  - study
date: 2025-03-03
thumbnail: https://upload.wikimedia.org/wikipedia/commons/9/93/Valve_monochrome_canny_%286%29.PNG
---
# 영상의 (지역적) 특징들
---
영상의 밝기 변화를 공간적 특징과 결합하면 **점**, **선**, **에지**, **면** 으로 구분할 수 있다.
간단하게 X와 Y축 방향 변화(량)만 고려하면 아래와 같다.

![](/assets/img/local_changes.png)

즉, 특정 방향으로의 *급격한* 밝기 변화가 점, 선, 에지를 만든다.
이러한 밝기 변화는 미분에 의해 검출될 수 있음이 분명하다.

## 디지털 함수의 미분
	디지털 함수는 샘플링 한계로 인해 유한 차이를 가지는 함수이다. '불연속'과는 다르다!

$$\frac{\partial f(x)}{\partial x}=\frac{f(x+\Delta x)-f(x)}{\Delta x}$$

위와 같은 1차 미분에서, 샘플 간의 간격이 1이므로, 아래와 같이 다시 쓸 수 있다.

$$\frac{\partial f(x)}{\partial x}=f(x+1)-f(x)$$

비슷한 방식으로, 2차 미분을 구할 수 있다.

$$\frac{\partial f(x)}{\partial x}=f(x+1)-2f(x)+f(x-1)$$

# (고립) 점 검출
	고립 점: 단일 픽셀 위치에서의 급격한 밝기 변화

점은 그 밝기가 [이웃]({% link _pages/Computer-Science/Computer-Vision/Neighbors-of-Pixel.md %}) 픽셀과 매우 다른 픽셀을 의미한다.

# Edge Detector
- [Canny Edge Detector]({% link _pages/Computer-Science/Computer-Vision/Canny-edge-detector.md %})