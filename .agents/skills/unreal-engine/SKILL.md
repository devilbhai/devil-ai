---
name: unreal-engine
description: Unreal Engine game development - C++/Blueprints, physics, materials, optimization.
---

# Unreal Engine

## When to Apply
Use this skill for Unreal Engine game development, C++/Blueprints, or AAA-quality game development.

## Core Concepts
- C++ and Blueprints
- Actor and Component system
- Physics and Collision
- Materials and Rendering
- Animation Blueprint
- AI and Behavior Trees
- Networking

## Best Practices
- Use C++ for performance-critical code
- Use Blueprints for rapid prototyping
- Implement proper garbage collection
- Use object pooling
- Optimize draw calls
- Use LOD systems
- Profile with Unreal Insights

## C++ Actor
```cpp
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MyActor.generated.h"

UCLASS()
class MYGAME_API AMyActor : public AActor
{
    GENERATED_BODY()
    
public:
    AMyActor();
    
    UPROPERTY(VisibleAnywhere)
    UStaticMeshComponent* MeshComponent;
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Speed = 100.f;
    
    virtual void Tick(float DeltaTime) override;
};

// MyActor.cpp
AMyActor::AMyActor()
{
    PrimaryActorTick.bCanEverTick = true;
    MeshComponent = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
    RootComponent = MeshComponent;
}

void AMyActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    AddActorLocalOffset(FVector(Speed * DeltaTime, 0, 0));
}
```

## Blueprint Interface
```cpp
UINTERFACE(MinimalAPI)
class UMyInterface : public UInterface
{
    GENERATED_BODY()
};

class IMyInterface
{
    GENERATED_BODY()
public:
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable)
    void Interact();
};
```

## Physics
```cpp
void AMyActor::LaunchProjectile()
{
    FVector LaunchVelocity;
    UGameplayStatics::SuggestProjectileVelocity_CustomArc(
        this,
        LaunchVelocity,
        GetActorLocation(),
        TargetLocation,
        0.f,
        0.5f
    );
    
    Projectile->Component->SetPhysicsLinearVelocity(LaunchVelocity);
}
```

## Performance Tips
- Use C++ for hot paths
- Implement LODs
- Use occlusion culling
- Batch draw calls
- Use instanced static meshes
- Profile with Unreal Insights
