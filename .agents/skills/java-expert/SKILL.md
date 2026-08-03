---
name: java-expert
description: Java development. OOP, Spring Boot, Maven/Gradle, testing, concurrency.
---

# Java Expert

## When to Apply
Use this skill when building or maintaining Java applications, including Spring Boot microservices, Android apps, enterprise systems, and high-performance backends.

## Core Concepts
- **OOP**: Inheritance, polymorphism, interfaces, abstract classes, SOLID principles, design patterns
- **Spring Boot**: Auto-configuration, dependency injection, AOP, profiles, Actuator, data JPA
- **Build Tools**: Maven (pom.xml, lifecycle, profiles), Gradle (build.gradle, tasks, dependencies)
- **Concurrency**: Threads, ExecutorService, CompletableFuture, virtual threads (Java 21+), concurrent collections
- **Collections Framework**: List, Set, Map implementations, Stream API, Optional, functional interfaces
- **Testing**: JUnit 5, Mockito, AssertJ, Spring Boot Test, Testcontainers
- **Memory Management**: GC tuning, heap analysis, JMH benchmarks, memory leaks

## Implementation
```java
// Spring Boot REST controller with validation
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable @Valid Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody @Valid CreateUserRequest request) {
        UserDTO created = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}

// Service with transactional management
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public UserDTO findById(Long id) {
        return userRepository.findById(id)
            .map(UserDTO::fromEntity)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public UserDTO create(CreateUserRequest request) {
        User user = User.builder()
            .name(request.name())
            .email(request.email())
            .build();
        User saved = userRepository.save(user);
        eventPublisher.publishEvent(new UserCreatedEvent(saved.getId()));
        return UserDTO.fromEntity(saved);
    }
}

// CompletableFuture for async composition
@Service
public class AggregationService {

    public CompletableFuture<DashboardData> getDashboardData(String userId) {
        CompletableFuture<UserProfile> profile = CompletableFuture
            .supplyAsync(() -> userService.getProfile(userId));
        CompletableFuture<List<Order>> orders = CompletableFuture
            .supplyAsync(() -> orderService.getRecentOrders(userId));
        CompletableFuture<Analytics> analytics = CompletableFuture
            .supplyAsync(() -> analyticsService.getSummary(userId));

        return profile.thenCombine(orders, (p, o) -> p.withOrders(o))
            .thenCombine(analytics, (po, a) -> po.withAnalytics(a).toDTO());
    }
}

// JUnit 5 test with Mockito
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void shouldReturnUserWhenFound() {
        User user = User.builder().id(1L).name("Test").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserDTO result = userService.findById(1L);

        assertThat(result.name()).isEqualTo("Test");
        verify(userRepository).findById(1L);
    }
}
```

## Best Practices
- Use constructor injection (via @RequiredArgsConstructor) over field injection
- Prefer record types for DTOs and immutable data carriers
- Use virtual threads (Java 21+) for I/O-bound concurrent workloads
- Apply @Transactional only on service layer methods
- Use AssertJ for fluent, readable test assertions
- Configure Spring profiles for environment-specific behavior
- Use Testcontainers for integration tests against real databases
- Profile with JMH for accurate microbenchmarks
