---
name: rust-expert
description: Rust development. Ownership, borrowing, async, unsafe code, performance patterns.
---

# Rust Expert

## When to Apply
Use this skill when building or maintaining Rust applications, including CLI tools, web servers, embedded systems, WebAssembly, and performance-critical systems.

## Core Concepts
- **Ownership & Borrowing**: Move semantics, lifetimes, borrow checker, interior mutability, reference counting
- **Error Handling**: Result<T, E>, Option<T>, custom error types, the ? operator, anyhow/thiserror crates
- **Async/Await**: Tokio runtime, async traits, pinning, streams, select!, cancellation safety
- **Traits & Generics**: Trait bounds, associated types, blanket implementations, dyn vs static dispatch
- **Macros**: Declarative macros (macro_rules!), procedural macros, derive macros, attribute macros
- **Unsafe Code**: Raw pointers, FFI, transmute safety, unsafe trait impls, MIRI testing
- **Performance**: Zero-cost abstractions, SIMD, memory layout optimization, criterion benchmarks

## Implementation
```rust
// Web server with Axum
use axum::{extract::Path, routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
    email: String,
}

struct AppState {
    users: RwLock<Vec<User>>,
}

async fn get_user(
    Path(id): Path<u64>,
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
) -> Result<Json<User>, StatusCode> {
    let users = state.users.read().await;
    users.iter()
        .find(|u| u.id == id)
        .map(|u| Json(u.clone()))
        .ok_or(StatusCode::NOT_FOUND)
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState { users: RwLock::new(Vec::new()) });

    let app = Router::new()
        .route("/users/{id}", get(get_user))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// Async streaming with error handling
async fn process_events(stream: impl Stream<Item = Event>) -> Result<Vec<ProcessedEvent>, Error> {
    stream
        .filter_map(|event| async {
            match event {
                Ok(e) => Some(process(e)),
                Err(e) => {
                    eprintln!("Skipping event: {e}");
                    None
                }
            }
        })
        .collect()
        .await
}

// Custom error type with thiserror
#[derive(thiserror::Error, Debug)]
enum AppError {
    #[error("user not found: {0}")]
    NotFound(u64),

    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

// Benchmark with criterion
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci_benchmark(c: &mut Criterion) {
    c.bench_function("fibonacci 20", |b| {
        b.iter(|| fibonacci(black_box(20)))
    });
}

criterion_group!(benches, fibonacci_benchmark);
criterion_main!(benches);
```

## Best Practices
- Let the borrow checker guide your design — fight it less, design better
- Use `thiserror` for library errors, `anyhow` for application errors
- Prefer `Arc<T>` + `RwLock<T>` over `Mutex<T>` for read-heavy workloads
- Use `#[cfg(test)]` for test-only code, never conditionally compiled logic in production
- Run MIRI to catch undefined behavior in unsafe code
- Use `clippy` and `rustfmt` as mandatory CI checks
- Prefer `?` operator over `.unwrap()` or `.expect()` in fallible contexts
- Use `cargo-deny` to audit dependencies for vulnerabilities and licenses
