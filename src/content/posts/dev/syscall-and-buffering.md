---
title: syscall과 buffering
published: 2026-04-16
tags:
  - 공부
draft: true
category: 지식
---
## 시스템 콜
---
시스템 콜은 비싼 연산이다. 그 이유는...
- 모드 스위칭(User -> Kernel -> User)
- 모드 스위칭에 따른 캐시 오염
- (메모리에 관한) 커널 보안 로직
- 시스템 콜 자체에 관한 검증 로직
- (가상 메모리) I/O가 수반될 경우 스케쥴러 개입


## 시스템 콜과 라이브러리 함수(malloc)
---
`malloc`은 시스템 콜인가? 그렇지 않다. 시스템 콜이 이렇게 비싼데 OS가 "나 4Byte 좀 써도 돼?" 같은 요청을 하나하나 받고 있어야 할 이유가 전혀 없다! 게다가 애초에 OS는 그렇게 메모리를 관리하지도 않는다!
- 진짜 syscall: `brk`, `mmap`, ...

malloc 내부적으로 메모리 풀이 있고, 함수 호출 시 이 pool에서 먼저 쪼개서 나눠준다. 그리고, 풀이 가득 차게 되면 그제서야 OS에게 메모리 요청을 한다. "user space memory allocator"가 바로 이런 메모리 관리를 해준다. 그리고, 이 allocator은 (OS가 아닌) 라이브러리가 제공하는 기능이다. 즉, malloc이 표준 **라이브러리**인 이유가 바로 이것이다.

또 다르게 말하면, (라이브러리는 대체할 수 있으므로, 컴파일 시 링크 경로를 변경하여) `malloc`말고 `jemalloc`, `tcmalloc`같은 대안도 있다. 특정 메모리 할당 패턴이나, 특정 환경(멀티 스레딩)에서 더 잘 동작하는 것들이다. 당연히, 프로그래머가 직접 만들어서 `malloc`을 대체할 수도 있다. (당연히 각 메모리는 할당해준 라이브러리로만 작동시켜야 한다.)
- `jemalloc`: FreeBSD의 기본 allocator. Firefox/Meta 등 멀티스레딩 환경에서 락 경합을 줄이는 데 초점.
- `tcmalloc`: Google 개발. Thread-Caching이라는 의미로 스레드 내 작은 할당이 빈번할 경우 유리.
- `mimalloc`: Microsoft Research에서 개발.

C++의 new도 메모리 할당하는데 그러면 malloc 교체 시 어떻게 되는 건가. 놀랍게도, global new의 동작을 [변경할](https://en.cppreference.com/w/cpp/memory/new/operator_new) 수 있다! 그리고, 컴파일러 제작자가 만든 new의 기본 동작은 malloc을 호출할 수도 아닐 수도 있다. (... _Whether the attempt involves a call to std::malloc or std::aligned_alloc is unspecified._)

```cpp
void* operator new(std::size_t sz){
	if(sz == 0) ++sz;
	
	if(auto ptr = std::malloc(sz))
		return ptr;
		
	throw std::bad_alloc{};
}
```


## 내부 버퍼링이라는 아이디어
---
그런데, malloc에서의 메모리 풀이라는 게 무엇인가. 버퍼이다! 그러니까, 최대한 user-space에서 처리하고 그게 안 될 경우에 syscall을 하기 위해서 buffer을 둔 것이다. c에서 프로그래밍을 해봤다면 `flush`라는 걸 들어봤을 것이다. 이건 stdout에 대한 user-space 버퍼를 비우라는 명령이다. 미리 터미널로 한 번에 입력해놓으면 `scanf`가 중간에 멈추지 않고 파싱을 계속하는 것도 경험해봤을 것이다. 그게 가능한 이유는 stdin에 대한 버퍼가 있기 때문이다!


