---

title: Commands
feed: show
date: 2025-05-12
permalink: /cmd
format: post

---

## 터미널 단축키 리스트

| 기능                 |    커맨드     | 설명                    |
| :----------------- | :--------: | :-------------------- |
|                    |            | 삭제 관련                 |
| 전부 삭제              |  Ctrl + U  | U = Uncut (Undo-line) |
| 커서 오른쪽 전부 삭제       |  Ctrl + K  | K = Kill              |
| 앞 단어 삭제            |  Ctrl + W  | W = Word              |
| 마지막으로 Kill한 것 붙여넣기 |  Ctrl + Y  | Y = Yank              |
| 화면 클리어             |  Ctrl + L  | cLear (cLean)         |
|                    |            | 이동 관련                 |
| 커서 맨 앞으로           |  Ctrl + A  | A = Beginning of line |
| 커서 맨 뒤로            |  Ctrl + E  | E = End               |
| 단어 단위 앞으로          | Option + ← |                       |
| 단어 단위 뒤로           | Option + → |                       |

## 커맨드 리스트

### Git 관련

브랜치 관련 커맨트

```shell
git branch (옵션) ...
```

| 기능              |  단축형  | 풀네임                          |
| --------------- | :---: | ---------------------------- |
| 이름 변경(강제)       | -m(M) | --move                       |
| upstream 브랜치 설정 |  -u   | --set-upstream-to=\<branch\> |
