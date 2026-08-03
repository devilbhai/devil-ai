---
name: php-expert
description: PHP development. Modern PHP 8+, Composer, PSR standards, testing, performance.
---

# PHP Expert

## When to Apply
Use this skill when building or maintaining PHP applications, including modern PHP 8+ code, Composer packages, Laravel/Symfony projects, and performance-optimized backends.

## Core Concepts
- **PHP 8+ Features**: Named arguments, attributes, enums, fibers, readonly properties, intersection types, match expressions
- **Composer**: Dependency management, autoloading (PSR-4), scripts, repositories, version constraints
- **PSR Standards**: PSR-12 coding style, PSR-4 autoloading, PSR-7 HTTP messages, PSR-15 middleware
- **Object-Oop**: Traits, interfaces, abstract classes, dependency injection, SOLID principles
- **Testing**: PHPUnit, Pest PHP, mocking, data providers, code coverage
- **Performance**: OPcache, profiling with Xdebug, memory optimization, async patterns with Swoole
- **Security**: SQL injection prevention, XSS protection, CSRF tokens, input validation

## Implementation
```php
<?php

// Modern PHP 8+ with enums and readonly
enum UserStatus: string {
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';
}

readonly class UserDTO {
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public UserStatus $status,
    ) {}
}

// Attribute-based routing (Laravel)
#[Route('/api/users')]
class UserController extends Controller {
    public function __construct(
        private readonly UserService $userService
    ) {}

    #[Get('/{id}')]
    public function show(string $id): JsonResponse {
        $user = $this->userService->findById($id);
        return response()->json(['data' => UserDTO::from($user)]);
    }

    #[Post('/'), Middleware('auth:sanctum')]
    public function store(StoreUserRequest $request): JsonResponse {
        $user = $this->userService->create($request->validated());
        return response()->json(['data' => $user], 201);
    }
}

// Service with repository pattern
class UserService {
    public function __construct(
        private readonly UserRepository $repository,
        private readonly EventDispatcher $events,
    ) {}

    public function findById(string $id): UserDTO {
        return $this->repository->findById($id)
            ?? throw new NotFoundException("User {$id} not found");
    }

    public function create(array $data): UserDTO {
        $user = User::create($data);
        $this->events->dispatch(new UserCreated($user));
        return UserDTO::from($user);
    }
}

// PHPUnit test with Pest syntax
it('creates a user successfully', function () {
    $response = $this->postJson('/api/users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'John Doe']);
});
```

## Best Practices
- Use PHP 8.2+ features: readonly classes, enums, fibers for async
- Follow PSR-12 coding standards and PSR-4 autoloading
- Use named arguments for clarity in complex function calls
- Prefer `match` over `switch` for simpler syntax and exhaustiveness checking
- Use PHPUnit with data providers for parameterized testing
- Enable OPcache in production for significant performance gains
- Use prepared statements or ORM query builders to prevent SQL injection
- Validate all input with Form Request classes or dedicated validators
