---
title: 픽셀 간의 관계
tags:
  - study
date: 2025-03-03
thumbnail: https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/5x5x5_connectivity.png/800px-5x5x5_connectivity.png
---
# 픽셀 간의 연결성
---

좌표 $$(x, y)$$에서 픽셀 $$p$$에 수평과 수직으로 이웃한 픽셀 집합을 4-이웃이라고 한다.
$$N_4(p)=\{(x+1,y),(x-1,y),(x,y+1),(x,y-1)\}$$

마찬가지로, 대각 이웃은 아래와 같다.
$$N_D(p)=\{(x+1,y+1),(x+1,y-1),(x-1,y+1),(x-1,y-1)\}$$

8방향 이웃은 아래와 같다.
$$N_8(p)=N_4(p)\cup N_D(p)$$
# Notation
