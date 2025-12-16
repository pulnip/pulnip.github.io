---
title: Rust-lang (2)
feed: hide
date: 2025-12-09
tags:
  - 공부
---
[sync_chaos](https://github.com/pulnip/sync_chaos)라는 프로젝트를 진행하면서 느낀 Rust라는 언어의 특징들.

---
## Ownership of Captured Variable
Rust에서의 Closure은 C\+\+의 lambda function처럼 변수를 capture할 수 있다. C\+\+에서는 하나하나 어떻게 캡처(복사/참조)할지 명시적으로 지정해야하는 반면, rust에서는 암시적으로 캡처된다. 특히, 소유권에 예민한 rust답게 기본적으로는 캡처된 변수가 borrowing되고, `move` keyword를 클로저 앞에 붙이면 캡처된 변수의 소유권이 클로저의 scope로 이전된다.

---
## Optional Type
C\+\+의 `std::optional<T>`는 `has_value()`로 검사 후 `value()`로 값을 가져올 수 있다. 그에 반해, Rust의 `Option<T>`는 패턴 매칭 혹은 if문에서 `Some(value)`형태로 값을 얻는다. 그리고 더 놀라운 사실은... `Option<T>`는 사실 `enum Option<T>`이다!
```Rust
enum Option<T> {
	Some(T),
	None,
}
```

---
## Template Enum
Rust의 enum은 `enum Foo<T>`처럼 템플릿일 수 있다. 다시 말하면, rust의 enum은 그냥 숫자의 치환이 아니라 값을 가질 수 있다.

---
## array
- variable-length array: `Vec<T>`
- fixed-length array: `[T; 3]`
- reference to array\(C\+\+의 `std::span`\): `[T]`

---
## 이전 포스트
- [[Rust-lang (1)]]
