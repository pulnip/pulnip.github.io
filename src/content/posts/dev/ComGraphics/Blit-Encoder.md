---
title: Render Pass Disabling
published: 2026-01-16
tags:
  - 공부
  - 기술
draft: false
category: 지식
---
## Pass를 생략하는 두 가지 방법

:::note
pass를 생략하는 방법을 논하기에 앞서, pass가 생략 가능하다는 전제가 성립되어야한다. 여기에서는 입력 텍스처에 약간의 조작 후 출력으로 같은 형식의 텍스처를 내보내는 간단한 포스트 프로세싱 과정만 생각한다.
:::

- enable/disable flag를 shader constant로 넘겨준다.
- 해당 pass를 blit pass로 교체한다.

### Shader Flag 방식

```
if(enable){
	color += postprocess(...);
}
return color;
```

셰이더 상수로 플래그를 넘기면 코드로 잘 드러나고 구현이 단순하다. 그리고 소소한 장점으로는 파이프라인 구조 변경 없이 토글이 가능하다는 것이다. 다만 고려해야할 점은 GPU의 분기는 uniform/divergent branch 방식으로 일어난다는 것이다.

```
if(condition){
	A;
}
else{
	B;
}
C;
```

위와 같은 코드를 생각해보자. CPU에서는 (분기 예측이 실패했을 때를 제외하면) A와 B 중 하나만 배타적으로 실행된다. 그와 반면, GPU에서는 A와 B 중 하나만 실행되거나, A와 B가 둘 다 실행된다. 이는 SIMT(Single Instruction Multiple Threads)와 관련있다. 즉, GPU의 하나의 instruction은 32개의 thread를 warp라는 단위로 묶어서 일어난다.
그런데, if clause는 thread id나 vertex data처럼 thread마다 `condition`이 다르게 평가될 수 있는 변수가 올 수 있다. 그러니까, 어떤 데이터를 받은 thread는 `A → C`경로로 계산되어야 레지스터가 올바른 상태에 있고, 또 다른 thread는 `B → C`경로로 계산되어야 레지스터가 올바른 상태에 있는데, fetch/decode는 warp단위로 동일하게 한 번만 일어난다는 것이다.
이를 해결하기 위해 gpu는 `A`, `B`, `C` 모두에 해당하는 instruction을 실행하지만 thread에는 자신에 상태에 맞게 activate/inactivate되게(=해당 구간에서 write연산이 일어나지 않게) 설계되었다. 예를 들어, T0-T9에서 `condition == true`이고, T10-T31에서 `condition == false`하자. 그러면, A를 실행 중에는 T0-T9는 activate 그리고 T10-T31은 inactivate되고, B를 실행 중에는 그 반대가 되는 식이다. 이러한 branch모델을 **divergent branch**라고 한다.
그렇지만, 반드시 `A`, `B`, `C`가 전부 실행된다는 의미는 아니다. 예를 들어서, 스레드마다 데이터가 달라지지 않을 constant buffer를 읽거나, 혹은 우연히 한 warp 내에서 조건문이 전부 동일하게 평가된다고 하자. 그러면, 그 쪽 분기(`A`와 `B` 배타적으로 한 쪽)만 실행된다. 이러한 branch 모델을 **uniform branch**라고 한다.
참고로, 그러면 두 branch 모델 중 어느 걸 따를지 정해져있는 것은 아니다. (코드에서) `condition`을 평가할 때 constant buffer을 읽는다면 거의 무조건 uniform branch모델을 따르게 되므로 컴파일 힌트가 될 수 있고, 그렇지 않다고 하더라도 런타임에 warp 내에서 일종의 voting(thread 간 만장일치 체크)을 통해서 어느 모델을 따를지 결정할 수 있다.

### Blit Encoder 사용하기.

blit은 bit transfer의 약자다. 위에서 봤던 것처럼 GPU는 flag 분기에 따른 branch를 꽤 똑똑하게 처리한다. 그러나, 분기 비용이 발생한다는 사실은 피할 수 없다. 또, Constant buffer의 flag만 바뀌었을 뿐, draw call이나 texture bind는 피하기 힘들며 무엇보다 pass 자체는 어쨌든 실행된다는 것이다. 이를 더 개선할 수는 없을까? 간단한 코드를 보면 아래와 같다.

```
// x for texture, buffer, some other states...
// f is pipeline/pass
y = f(x);

// Improve!
y = x; // if disabled
```

어차피 disabled 되었을 때의 동작이 어떤 텍스처를 다른 텍스처에 그대로 복사하는 거라면... 진짜로 복사만 하면 되지 않나는 게 기본 요지이다. 이를 위해서 blit encoder을 사용하면 된다. blit encoder은 텍스처/버퍼 복사를 위한 encoder이다. 다만, cpu에서 pass 전환 시의 분기 예측 실패에 따른 약간의 캐시 미스는 있을 수도 있다. 하지만 pass 실행 비용이 압도적으로 크기에 그 정도는 무시할만 한 것이다. 또, 사실 제대로 사용하려면 코드의 복잡함은 감수해야한다.

### Furthermore...

당연하게도, shader flag 대신 blit pass로 사용하면 최적화가 끝이진 않다. 현대적 렌더링 파이프라인의 정수인 RenderGraph를 생각해보면, 컴파일 과정에서 생각해볼 여지는 아직 많다.

```
A --(Pass1)--> B --(Pass2)--> C --(Pass3)--> D
```

이런 간단한 구조를 생각해보자. 여기에서 `Pass2`를 비활성화할 때, 굳이 `B`에서 `C`로 복사할 필요가 있을까? RVO(Return Value Optimization)를 생각해보면, `Pass3`가 `B`에서 바로 읽거나 `Pass1`이 `C`에 쓰면 되지 않은가? 이런 것처럼, 최적화는 끝이 없다.

## Reference
- [Cornell University: SIMT and Warps](https://cvw.cac.cornell.edu/gpu-architecture/gpu-characteristics/simt_warp)
