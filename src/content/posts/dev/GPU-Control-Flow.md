---
title: GPU Control Flow
published: 2026-03-25
tags:
  - 공부
  - 기술
draft: false
category: 지식
---
## 조건문과 GPU의 Warp
---
CPU는 PC(Program Counter), Register, Instruction Decoder, Control Unit으로 구성되어있다. 그리고 CPU에서 조건문은 "예측해서 실행한 후, 틀리면 복구한다."의 형태로 동작한다.

GPU는 32개의 thread를 warp라는 단위로 묶어서 동작한다. 그리고 이 thread는 같은 PC와 Instruction Decoder 등을 공유한다. 다시 말하자면, 모든 thread가 같은 명령어를 보고 있다는 뜻이다. 그렇다면 조건에 따라 각 thread마다 실행해야하는 instruction이 달라진다면 어떻게 대처해야할까?


## Branch Model
---
GPU에는 두 개의 branch모델이 있다. 한 warp 내의 thread의 상태에 따라Uniform Branch와 divergent branch로 나뉜다.

```cpp
A;
if( condition ){
	B;
}
else{
	C;
}
D;
```

우선 위와 같은 코드가 있다고 할 때, CPU에서 어떻게 실행될지 생각해보자. condition이 true일 경우 자명하게도 `A -> B -> D`의 경로로 실행된다. 분기 예측까지 고려한다고 하더라도 CPU 내부적으로(즉, 암묵적으로) `C`의 일부가 실행되다가 "마치 C가 실행된 적이 없는 것처럼" 올바른 control flow로 복귀한다.

이제 GPU를 생각해보자. 우선 간단한 상태부터 생각해보자. 한 warp내의 모든 thread에서 condition이 true로 평가되었다고 해보자. condition이 constant buffer에 의해서만 결정되거나 혹은 그렇지 않더라도 우연히 같을 수 있을 것이다. 이 경우는 당연하다. `C`를 실행시킬 이유가 없기에 자명하게 `A -> B -> D` 경로로 실행된다.

그렇다면, (한 warp 내의) 모든 thread에서 condition이 동일한 값으로 평가되지 않는다면 어떨까? 각 thread마다 다른 명령어를 바라보고 있게 할 방법은 없고, 그렇다고 `A -> B -> D`경로로 진행되거나 `A -> C -> D`경로로 실행된다면 그건 프로그래머가 의도한 바가 전혀 아니다. 그렇다면 `B`와 `C`가 모두 실행되지만, 어떤 thread에서는 `B`만 활성화(=`C`는 비활성화)되고 다른 thread에서는 그 반대 상태이면 될 것이다. 이걸 divergent branch model이라고 한다.


## 실제 Shader에서 사용할 때의 팁
---
간단히 가장 최적 상태를 생각한다면, 한 warp 내에서 utility가 최고이면 될 것이다. 다시 말하면, 위와 같은 divergent branch가 발생하지 않는 상태가 조건문 측면에서는 가장 최적일 것이다. 가장 간단하게는, 그냥 조건문을 사용하지 않거나, 모든 thread에서 조건문이 똑같이 평가될 때만 조건문을 사용하는 것이다. 그렇지만... 좀 더 최적화할 수는 없을까? 

문제 상황을 먼저 생각해보자. 조건문 각 경우 모두 충분히 무겁고, 모든 warp에서 divergent branch가 발생해야한다면 최악의 상황일 것이다. 그렇다면, 실제 파이프라인 내의 셰이더에서 분기가 발생하기 전에 pass를 둘로 쪼개서 (pass단위로) 먼저 분기하고 나중에 두 파이프라인을 실행시키는 건 어떨까? 만약 그렇게 구성할 수 있다면 모든 thread가 divergent branch에 의해 멈추지 않을 것이다. 하지만 다음과 같은 비용을 생각해봐야한다.

1. 구현 복잡도. 일단 한 pass를 여러 pass로 쪼개야한다.
2. pipeline 교체 비용.
3. vertex / pixel의 pass별 정렬(compaction하게 데이터를 재구성)

일단 pass를 둘로 쪼갤 만큼 그 분기 이후에 실행 비용이 높아야한다. 왜냐하면 pass를 둘로 쪼개는 과정도 그냥 이루어지는 게 아니라 중간에 pipeline을 교체하는 작업이 추가로 들어가기 때문이다.
두 번째로 데이터도 그에 맞게 재구성해야한다. `[A, B, C, A, B, C, A, B, C, ...]`와 같이 구성되어있는 데이터는 어떻게 실행시키든 분기를 발생시키기 때문이다. 이걸 각 pass에 맞게 `[A, A, A, ...], [B, B, B, ...], [C, C, C, ...]` 형태로 가공해줘야한다는 얘기이다.