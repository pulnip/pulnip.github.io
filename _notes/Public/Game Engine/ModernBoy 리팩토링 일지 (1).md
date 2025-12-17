---
title: ModernBoy 리팩토링 일지 (1)
feed: show
date: 2025-12-17
tags:
  - 기록
  - 프로젝트
  - 엔지니어링
source:
  - 생각
---
## 새로운 폴더 구조
아주 처음에는 include, src가 있고 그 안에서 모듈 별로 파일을 나누어두었다. C/C++의 전통적인 폴더 구조가 이러하다고 어디선가 들은 적이 있기 때문이었다.
```
ModernBoy/
  include/
    Engine/
    Game/
    ...
  src/
  test/
```
내 프로젝트는 CMake를 사용하는데, 이 구조는 처음에는 매우 편안했다. 단 하나의 폴더만 경로로 알려주면 모든 게 해결되었기 때문이다. 그렇지만, 엔진과 게임을 나누는 게 거의 불가능했다. 헤더 파일을 include하는 건 매우 쉬웠지만, 그 후에 격리하려고하면 전역 변수만 사용해서 작성된 프로그램을 리팩토링하는 것 만큼이나 어려웠기 때문이다.
그래서, 이번에는 모듈 안에서 include, src 폴더 구조를 갖도록 바꾸었다. 나중에 테스트를 추가했을 때도, 그게 단위 테스트인지 통합 테스트인지 구분이 명확할 것 같아서 꽤나 잘 작동할 것 같았다.
```
ModernBoy/
  Engine/
    Render/
      include/
      src/
    ...
  Game/
```
하지만 새로운 문제가 발생했다. 가장 큰 문제는 모든 헤더가 include에 들어가서 다른 모듈에서 가져다 쓸 때 이 헤더를 가져와도 되는지 깊이 생각해야했다는 것이다. 지금 돌이켜보면, 기계적으로 헤더파일을 include에 뒀다는 게 잘못된 것일 지도 모르겠다. 사소한 문제로는 (VSCode를 사용하고 있기에) C/C++확장이 CMake가 Configure하기 전까지는 제대로 작동하지 않는다는 문제가 있었다. includePath에 전부 다 쓰면 괜찮은 거 아닌가 싶지만, 그렇게 되면 intellisense에게 보이는 헤더 파일이 실제 빌드 과정에서는 찾을 수 없다고 나오는 경우가 매우 많다. (moduleA가 moduleB에 대해서 종속성을 가지기에->그 헤더파일도 보인다. 가 아니라, 빌드가 실패하기에 종속성을 추가한다(?)같은 형태로 흘러갔기 때문이다.)
include-src 형태가 C/C++의 전통적인 폴더 구조인 건 맞다. 그렇지만, [Unreal Engine](https://github.com/EpicGames/UnrealEngine)이나, [Godot Engine](https://github.com/godotengine/godot)을 참고하면 include-src형태가 아닌 것을 확인할 수 있다. Visual Studio을 사용한 경험을 되돌아보아도 프로젝트 별로 소스 파일이 나뉘어지긴 하지만 include-src 형태는 아니었다. 그러면 무엇을 고려해야하는 걸까? 사실, 위에 구조도 틀린 구조는 아니다. 다만, 내가 관리하기에 불편했다. 어떤 코드를 누구에게 보여줄지 통제할 수 없었고, 헤더 파일과 소스 파일이 너무 멀리 떨어져있기에 코드를 확인하려 할 때마다 피곤했다.
```
ModernBoy/
  Core/          ← 순수 자료구조나 수학 등 범용
    include/
    src/
    test/
  Engine/        ← 내 게임 엔진
    Render/
      Public/
      Private/
    Resource/
      Public/
      Private/
    ...
  Sample/
    main.cpp     ← 프로그램 진입점
  Editor/
  Test/
	Render/
	Resource/
```
지금 생각하는 구조는 위와 같다. Unreal Engine의 폴더 구조를 차용하되, `Core`은 외부 라이브러리처럼 두는 것이다. `Public/`에는 헤더 파일만, `Private/`에는 모듈 내부 헤더 파일과 소스 파일이 위치하게 되면 조금 더 내가 통제할 수 있게 된다.