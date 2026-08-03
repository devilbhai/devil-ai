---
name: cpp-expert
description: C++ development. Templates, STL, memory management, concurrency, optimization.
---

# C++ Expert

## When to Apply
Use this skill when building or maintaining C++ applications, including game engines, high-performance computing, embedded systems, compilers, and systems programming.

## Core Concepts
- **Modern C++ (C++17/20/23)**: Concepts, ranges, coroutines, modules, constexpr, structured bindings
- **Templates**: SFINAE, CRTP, variadic templates, template specialization, fold expressions
- **STL Containers & Algorithms**: Vector, map, set, algorithm library, iterators, ranges
- **Memory Management**: Smart pointers (unique_ptr, shared_ptr), RAII, memory pools, custom allocators
- **Concurrency**: std::thread, std::jthread, mutexes, condition variables, atomics, lock-free data structures
- **Move Semantics**: rvalue references, move constructors, perfect forwarding, std::move semantics
- **Build Systems**: CMake, vcpkg, conan, package management

## Implementation
```cpp
// Modern C++ with concepts and ranges
#include <ranges>
#include <vector>
#include <algorithm>
#include <memory>

template<typename T>
concept Sortable = requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
};

auto filter_and_sort(std::vector<int>& data) {
    return data
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * 2; })
        | std::ranges::to<std::vector>();
}

// RAII resource management
class FileHandle {
    std::FILE* file_;
public:
    explicit FileHandle(const char* path) : file_(std::fopen(path, "r")) {
        if (!file_) throw std::runtime_error("Failed to open file");
    }

    ~FileHandle() { if (file_) std::fclose(file_); }

    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;

    FileHandle(FileHandle&& other) noexcept : file_(std::exchange(other.file_, nullptr)) {}
    FileHandle& operator=(FileHandle&& other) noexcept {
        if (this != &other) {
            if (file_) std::fclose(file_);
            file_ = std::exchange(other.file_, nullptr);
        }
        return *this;
    }

    std::FILE* get() const { return file_; }
};

// Lock-free concurrent queue
template<typename T>
class ConcurrentQueue {
    struct Node {
        std::shared_ptr<T> data;
        std::unique_ptr<Node> next;
    };

    std::unique_ptr<Node> head_;
    std::atomic<Node*> tail_;
    std::mutex head_mutex_;

public:
    void push(T value) {
        auto new_node = std::make_unique<Node>();
        new_node->data = std::make_shared<T>(std::move(value));
        Node* const new_tail = new_node.get();
        std::lock_guard lock(head_mutex_);
        tail_.store(new_node.release(), std::memory_order_release);
    }

    std::shared_ptr<T> try_pop() {
        Node* old_head = head_.get();
        Node* const old_tail = tail_.load(std::memory_order_acquire);
        if (old_head == old_tail) return nullptr;
        head_ = std::move(old_head->next);
        return head_->data;
    }
};

// CMake build configuration
cmake_minimum_required(VERSION 3.25)
project(MyApp VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(fmt REQUIRED)
find_package(GTest REQUIRED)

add_executable(app main.cpp)
target_link_libraries(app PRIVATE fmt::fmt)

enable_testing()
add_executable(tests tests.cpp)
target_link_libraries(tests PRIVATE GTest::gtest_main)
add_test(NAME unit_tests COMMAND tests)
```

## Best Practices
- Prefer smart pointers over raw owning pointers; use `std::unique_ptr` by default
- Use RAII for all resource management — never manually manage memory
- Enable compiler warnings: `-Wall -Wextra -Wpedantic -Werror`
- Use `constexpr` and `consteval` for compile-time computation
- Prefer `std::array` over C arrays, `std::string_view` over `const char*`
- Use coroutines (C++20) for generator patterns and async I/O
- Benchmark with Google Benchmark before optimizing
- Use `std::format` (C++20) or fmtlib for string formatting
