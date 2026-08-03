---
name: unity-developer
description: Unity game development - C# scripting, physics, animations, UI, optimization.
---

# Unity Developer

## When to Apply
Use this skill for Unity game development, C# scripting, physics, animations, or game optimization.

## Core Concepts
- C# scripting
- GameObjects and Components
- Physics and Colliders
- Animations and Animator
- UI System
- Asset management
- Build optimization

## Best Practices
- Use object pooling for frequently instantiated objects
- Optimize draw calls
- Use Addressables for asset management
- Implement proper game loops
- Profile regularly
- Use coroutines for async operations
- Handle input properly

## MonoBehaviour Pattern
```csharp
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float speed = 5f;
    public float jumpForce = 10f;
    
    private Rigidbody2D rb;
    private bool isGrounded;
    
    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
    }
    
    void Update()
    {
        float moveInput = Input.GetAxisRaw("Horizontal");
        rb.linearVelocity = new Vector2(moveInput * speed, rb.linearVelocity.y);
        
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);
        }
    }
    
    void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.gameObject.tag == "Ground")
        {
            isGrounded = true;
        }
    }
    
    void OnCollisionExit2D(Collision2D collision)
    {
        if (collision.gameObject.tag == "Ground")
        {
            isGrounded = false;
        }
    }
}
```

## Object Pooling
```csharp
public class ObjectPool : MonoBehaviour
{
    public GameObject prefab;
    public int poolSize = 10;
    
    private Queue<GameObject> pool = new Queue<GameObject>();
    
    void Start()
    {
        for (int i = 0; i < poolSize; i++)
        {
            GameObject obj = Instantiate(prefab);
            obj.SetActive(false);
            pool.Enqueue(obj);
        }
    }
    
    public GameObject GetObject()
    {
        GameObject obj = pool.Dequeue();
        obj.SetActive(true);
        return obj;
    }
    
    public void ReturnObject(GameObject obj)
    {
        obj.SetActive(false);
        pool.Enqueue(obj);
    }
}
```

## Animation
```csharp
Animator animator;

void Update()
{
    animator.SetFloat("Speed", Mathf.Abs(Input.GetAxisRaw("Horizontal")));
    
    if (Input.GetButtonDown("Jump"))
    {
        animator.SetTrigger("Jump");
    }
}
```
