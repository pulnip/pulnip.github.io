---
title: Rust-lang (1)
feed: show
date: 2025-12-07
tags:
  - 공부
---
[sync_chaos](https://github.com/pulnip/sync_chaos)라는 프로젝트를 진행하면서 느낀 Rust라는 언어의 특징들.

---
## Associated function
클래스를 통해 접근할 수 있는 함수는 C++에서 Static Member function이라고 부른다. Rust의 Associated function에 대응된다. C++에서는 이를 `static` keyword로 작성하지만, rust에서는 멤버 함수의 첫 번째 인자를 `self`로 받지 않는 것으로 작성한다. 둘 모두 `<class>::<function>`로 호출할 수 있다.

|           C++            |        Rust         |
| :----------------------: | :-----------------: |
| `static` member function | Associated function |

---
## new() convention
`Vec3::new(...)`와 같은 함수를 많이 볼 수 있다. rust에는 직접적으로 constructor가 없고, 그 대신 `new`라는 이름의 associate function으로 이를 대신한다. 다만, 언어 차원에서 강제하는 것은 아니고 convention(혹은 factory패턴)에 불과하다.

### 그러면 소멸자는?

rust에서는 소멸자라는 개념 또한 없다. 그 대신, `Drop` trait을 구현(`drop`함수)하는 것으로 대신한다.

---
## Inner/Outer Attribute
`#[<outer attribute name>]`이나 `#![<inner attribute name>]`을 attribute라고 부른다. C++과 마찬가지로, 코드 자체에 동작과는 관련되지 않은 것들을 지정하는 데에 쓰인다.

- `#[inline]`, `#[inline(always)]`, `#[inline[never]`
- `#[derive(...)]`
- `#[cfg(test)]`, `#[cfg(target_os = "macos")]`
- `#[allow(dead_code)]`
- `#[repc(C)]`
- `#![allow(unused_variables)]`
- `#![warn(missing_docs)]`

---
## constness & mutable
rust는 기본이 상수이고, `mut` keyword로 상수성을 제거할 수 있다.

---
## ownership
C++과 달리 소유권의 개념이 더 강하다. C++은 기본 동작이 copy이고 특수하게 movable하지만, rust는 기본이 movable하고 copy가 되게 하려면 `Copy` trait을 구현해야한다. 그래서 `&`가 의미하는 게 "원본 객체에 대한 reference"가 아니라 "원본 객체를 borrowing"하는 것이다.
