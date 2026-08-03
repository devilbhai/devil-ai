---
name: go-developer
description: Go programming expert. Covers goroutines, channels, interfaces, error handling, testing, HTTP servers, gRPC, context, packages, go modules.
---

# Go Developer

## When to Apply
Use this skill when working with Go (Golang) projects. Apply when:
- Building or maintaining Go applications
- Writing concurrent code with goroutines and channels
- Implementing interfaces and struct designs
- Handling errors idiomatically
- Building HTTP servers or REST APIs
- Working with gRPC services and protocol buffers
- Using context for cancellation and request scoping
- Testing with the standard library or testify
- Managing dependencies with Go modules
- Optimizing performance, profiling, or debugging

## Core Patterns

### Concurrency
- Use `sync.WaitGroup` to coordinate multiple goroutines
- Use `select` for multiplexing channel operations
- Use `context.Context` for cancellation propagation — pass it as first parameter
- Prefer channels for communication, `sync.Mutex` for protecting shared state
- Use `errgroup` (`golang.org/x/sync/errgroup`) for concurrent tasks with error handling
- Never start goroutines without a plan to stop them (use context cancellation)
- Use buffered channels when the sender and receiver operate at different rates
- Avoid goroutine leaks — always ensure goroutines can exit

### Error Handling
- Always check errors — never use `_` to discard them
- Use `errors.Is()` and `errors.As()` for error comparison (not string matching)
- Wrap errors with `fmt.Errorf("context: %w", err)` for traceability
- Use sentinel errors sparingly — prefer typed errors or error variables
- Handle errors at the appropriate level — don't swallow or ignore them
- Use `errors.Join()` for combining multiple errors (Go 1.20+)
- Define error types with methods when behavior varies by error kind

### Interfaces
- Define interfaces where they are consumed, not where they are implemented
- Keep interfaces small — 1-3 methods is ideal
- Use empty interface (`any`) only when type safety is genuinely impossible
- Prefer acceptance of interfaces over concrete types in function signatures
- Use type assertions and type switches to handle dynamic types
- Accept interfaces, return structs

### HTTP Servers
- Use `http.NewServeMux()` (Go 1.22+) for method-aware routing
- Apply middleware by wrapping `http.Handler` — keep middleware composable
- Use `json.NewDecoder(r.Body).Decode(&v)` for request body parsing
- Return proper HTTP status codes and structured JSON errors
- Set timeouts: `http.Server{ReadTimeout, WriteTimeout, IdleTimeout}`
- Use `context.WithTimeout` in handlers for request-scoped deadlines
- Always close response bodies: `defer resp.Body.Close()`

### Context
- Pass `context.Context` as the first parameter of every function that needs it
- Use `context.Background()` for top-level/server startup contexts
- Use `context.TODO()` when you're unsure of the right context source
- Create child contexts with `context.WithCancel`, `WithTimeout`, `WithValue`
- Don't store context values in structs — pass them through function calls
- Check `ctx.Err()` to detect cancellation or deadline exceeded

### Testing
- Use table-driven tests with `t.Run()` for subtests
- Use `testing.TB` interface when test helpers need to work with benchmarks too
- Use `testify/assert` or `testify/require` for assertions when team prefers
- Use `httptest.NewServer` for HTTP handler tests
- Use `t.Helper()` in test helper functions for correct line reporting
- Use `t.Parallel()` for tests that can run concurrently
- Use `testing/fstest.MapFS` for filesystem mocking in tests
- Benchmark with `func BenchmarkXxx(b *testing.B)` and `b.N` loop

### Go Modules
- Use `go mod tidy` to clean up dependencies
- Pin specific versions — don't use `@latest` in production
- Use `replace` directives only for local development or forks
- Use `go work` for multi-module development (Go 1.18+)
- Keep `go.mod` clean — remove unused dependencies regularly
- Use `go mod vendor` for reproducible builds if required

## Code Examples

### HTTP Server with Middleware
```go
package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type contextKey string

const requestIDKey contextKey = "requestID"

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func withContextValue(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), requestIDKey, "req-123")
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)

	handler := loggingMiddleware(withContextValue(mux))

	server := &http.Server{
		Addr:         ":8080",
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Fatal(server.ListenAndServe())
}
```

### Concurrent Worker Pool
```go
package main

import (
	"context"
	"fmt"
	"sync"
)

type Result struct {
	WorkerID int
	Value    string
}

func workerPool(ctx context.Context, jobs []string, workerCount int) []Result {
	results := make(chan Result, len(jobs))
	jobCh := make(chan string, len(jobs))

	var wg sync.WaitGroup
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for job := range jobCh {
				select {
				case <-ctx.Done():
					return
				default:
					results <- Result{WorkerID: id, Value: job}
				}
			}
		}(i)
	}

	for _, job := range jobs {
		jobCh <- job
	}
	close(jobCh)

	go func() {
		wg.Wait()
		close(results)
	}()

	var out []Result
	for r := range results {
		out = append(out, r)
	}
	return out
}
```

### Error Handling Pattern
```go
package main

import (
	"errors"
	"fmt"
)

var (
	ErrNotFound     = errors.New("not found")
	ErrUnauthorized = errors.New("unauthorized")
)

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation: %s - %s", e.Field, e.Message)
}

func findUser(id int) (string, error) {
	if id == 0 {
		return "", fmt.Errorf("findUser: %w", ErrNotFound)
	}
	if id < 0 {
		return "", &ValidationError{Field: "id", Message: "must be positive"}
	}
	return "user-data", nil
}

func main() {
	_, err := findUser(0)
	if errors.Is(err, ErrNotFound) {
		fmt.Println("User not found")
	}

	var valErr *ValidationError
	if errors.As(err, &valErr) {
		fmt.Printf("Validation failed on field %s\n", valErr.Field)
	}
}
```

### Table-Driven Tests
```go
package main

import "testing"

func TestAdd(t *testing.T) {
	tests := []struct {
		name     string
		a, b     int
		expected int
	}{
		{"positive numbers", 2, 3, 5},
		{"negative numbers", -1, -1, -2},
		{"zero", 0, 5, 5},
		{"identity", 0, 0, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.a + tt.b
			if got != tt.expected {
				t.Errorf("Add(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.expected)
			}
		})
	}
}
```

## Best Practices
- Use `context.Context` as the first parameter in all functions that need cancellation or request scoping
- Keep interfaces small — define them where they're consumed
- Always handle errors — never silently discard them
- Wrap errors with context using `fmt.Errorf("...: %w", err)`
- Use table-driven tests for comprehensive test coverage
- Use `errgroup` for concurrent operations that need error propagation
- Set HTTP server timeouts to prevent resource exhaustion
- Use `go vet` and `staticcheck` for code quality
- Avoid package-level state — prefer dependency injection
- Use `sync.Pool` for frequently allocated temporary objects
- Profile with `pprof` before optimizing — measure, don't guess
- Use `//go:generate` for code generation (stringer, mockgen, etc.)
