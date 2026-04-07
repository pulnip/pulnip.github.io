---
title: QueryInterface vs dynamic_cast
published: 2026-02-02
tags:
  - 공부
  - 기술
draft: true
category: 지식
---
## Application Binary Interface
---
API(Application Programming Interface)가 호출할 때의 규약이라고 한다면, 바이너리 수준의 규약을 ABI라고 한다. 프로그램은 어떤 특정 형태의 함수 스택 구조조나, 클래스의 멤버를 어떤 순서로 배치할지의 규칙을 가진다. 이런 것들이 제대로 지켜져야 프로그램이 올바른 순서로 실행된다.


## DirectX의 COM객체
---
COM(Microsoft Component Object Model)은 DirectX에서 사용되는 개체 지향 프로그래밍 모델이다. DXGI(DirectX Graphics Infrastructure)을 사용하다보면, 해당 버전의 COM객체로 쓸 수 있는지 확인하는 작업을 하기 위해 QueryInterface를 쓰곤 한다. QueryInterface가 뭐냐면 일종의 COM 전용 downcasting이다. COM 내부적으로 각 객체들은 상속 구조를 가지고, 기능을 지원할 때마다 숫자를 증가시키며 이전 버전의 클래스를 상속하여 만들어진다.


## COM 객체에 dynamic_cast를 쓰면 안되는 이유
---
COM상 상속 구조를 가지더라도, 그게 C++의 타입 시스템이 그 구조를 알고있다는 뜻은 아니기 때문이다. 상속 구조가 아니라는 뜻은 아니다. 확실히 dxgi 헤더를 확인할 때 C++코드 상 상속 구조로 이루어진 건 맞다. 그렇지만 COM은 자신만의 GUID를 통해 타입을 바인딩해주므로 (`MIDL_INTERFACE`의 매크로) 이 타입의 상속 계통을 C++에게 물어보면 조금 곤란해진다.