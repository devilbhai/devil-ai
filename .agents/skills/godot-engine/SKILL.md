---
name: godot-engine
description: Godot game development - GDScript, scenes, nodes, signals, 2D/3D development.
---

# Godot Engine

## When to Apply
Use this skill for Godot game development, GDScript, scene management, or 2D/3D game creation.

## Core Concepts
- GDScript syntax
- Scene and Node system
- Signals and communication
- Physics and Collision
- 2D and 3D rendering
- Animation system
- UI system

## Best Practices
- Use scenes for reusable components
- Use signals for decoupling
- Implement state machines
- Use groups for entity management
- Optimize with object pooling
- Use TileMap for 2D levels
- Profile with built-in profiler

## Node Structure
```gdscript
extends CharacterBody2D

@export var speed = 300
@export var jump_force = -400

var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta):
    velocity.y += gravity * delta
    
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_force
    
    var direction = Input.get_axis("move_left", "move_right")
    velocity.x = direction * speed
    
    move_and_slide()
    
    if direction != 0:
        $AnimatedSprite2D.flip_h = direction < 0
        $AnimatedSprite2D.play("run")
    else:
        $AnimatedSprite2D.play("idle")
```

## Signals
```gdscript
# player.gd
signal health_changed(new_health)
signal died

func take_damage(amount):
    health -= amount
    health_changed.emit(health)
    if health <= 0:
        died.emit()
```

## Scene Instantiation
```gdscript
var bullet_scene = preload("res://bullet.tscn")

func shoot():
    var bullet = bullet_scene.instantiate()
    bullet.global_position = $Muzzle.global_position
    bullet.rotation = rotation
    get_tree().root.add_child(bullet)
```

## State Machine
```gdscript
extends Node

@onready var current_state: State = $Idle
var states: Dictionary = {}

func _ready():
    for child in get_children():
        if child is State:
            states[child.name.to_lower()] = child
            child.transition.connect(_on_state_transition)

func _on_state_transition(new_state_name):
    var new_state = states.get(new_state_name.to_lower())
    if new_state:
        current_state.exit()
        current_state = new_state
        current_state.enter()
```
