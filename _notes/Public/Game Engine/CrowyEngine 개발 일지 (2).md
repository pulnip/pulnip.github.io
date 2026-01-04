---
title: CrowyEngine 개발 일지 (2)
feed: hide
date: 2025-12-30
---
## 소유권 설계 철학

수명(Lifefime): 인프라(Infrastructure) vs 콘텐츠(Content)
- 인프라: "엔진이 있으면 나도 존재한다."
- 콘텐츠: "필요할 때 생성되고, 필요없을 때 소멸한다."

행위(Behaviour): 서비스(Service) vs 시뮬레이션(Simulation)
- 서비스: "요청을 받으면 처리한다."
- 시뮬레이션: "스스로 (시간에 따라) 무언가를 처리하거나 변화시킨다."

|     |    서비스     |    시뮬레이션     |
| :-: | :--------: | :----------: |
| 인프라 |    싱글톤     |  Engine 멤버   |
| 콘텐츠 | 팩토리/풀에서 할당 | 월드 소속 Entity |

### 싱글톤
```cpp
ResourceManager::Get()->Load("Texture.png");
```

### 엔진 멤버
```cpp
engine.GetPhysicsWorld.Step(dt);
```


### 팩토리/풀 할당
```cpp
auto source = audioServer.CreateSource(...);

source->Play(sound);
audioServer.ReleaseSource(source);
```

### 월드 소속
```cpp
scene.AddChild(player);
...
player.AddChild(weapon);
```

인프라 + 서비스 = "엔진 제공해야하는 서비스들"
- ResourceManager, AudioServer
인프라 + 시뮬레이션 = "엔진이 수행하는 처리"
- SceneTree, World
콘텐츠 + 서비스 = "필요할 때 생성되는 요청 객체"
- RenderTexture, AudioSource
콘텐츠 + 시뮬레이션 = "시간에 따라 바뀌는 것들"
- Node, Entity, GameObject