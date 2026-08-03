---
name: csharp-expert
description: C# development. .NET Core, LINQ, async/await, Entity Framework, testing.
---

# C# Expert

## When to Apply
Use this skill when building or maintaining C# applications, including .NET Core/8+ web APIs, desktop apps, game development with Unity, and enterprise systems.

## Core Concepts
- **.NET Core/8+**: Minimal APIs, dependency injection, configuration, middleware pipeline, health checks
- **LINQ**: Query syntax, method syntax, deferred execution, IQueryable vs IEnumerable, custom operators
- **Async/Await**: Task-based patterns, ConfigureAwait, cancellation tokens, ValueTask, async streams
- **Entity Framework Core**: DbContext, migrations, relationships, query optimization, raw SQL, auditing
- **Generics**: Constraints, variance, generic math (C# 11+), source generators
- **Testing**: xUnit, NUnit, Moq, FluentAssertions, integration testing with WebApplicationFactory
- **Performance**: Span<T>, Memory<T>, ArrayPool, pooled StringBuilder, zero-allocation patterns

## Implementation
```csharp
// Minimal API with validation
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

app.MapGet("/api/users/{id:int}", async (int id, IUserService service) =>
{
    var user = await service.GetByIdAsync(id);
    return user is not null ? Results.Ok(user) : Results.NotFound();
})
.WithName("GetUser")
.Produces<UserDto>(200)
.Produces(404);

app.MapPost("/api/users", async (CreateUserRequest request, IUserService service) =>
{
    var user = await service.CreateAsync(request);
    return Results.Created($"/api/users/{user.Id}", user);
})
.WithValidation<CreateUserRequest>();

app.Run();

// Service with EF Core and async patterns
public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public async Task<UserDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.Users
            .Where(u => u.Id == id)
            .Select(u => new UserDto(u.Id, u.Name, u.Email))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(ct);
        return new UserDto(user.Id, user.Name, user.Email);
    }
}

// Unit test with xUnit and FluentAssertions
public class UserServiceTests
{
    private readonly Mock<AppDbContext> _mockContext;
    private readonly UserService _sut;

    public UserServiceTests()
    {
        _mockContext = new Mock<AppDbContext>();
        _sut = new UserService(_mockContext.Object);
    }

    [Fact]
    public async Task GetByIdAsync_WhenUserExists_ReturnsUserDto()
    {
        var user = new User { Id = 1, Name = "Test", Email = "test@example.com" };
        var mockSet = MockDbSet(new List<User> { user });
        _mockContext.Setup(c => c.Users).Returns(mockSet.Object);

        var result = await _sut.GetByIdAsync(1);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Test");
    }
}
```

## Best Practices
- Use records and init-only properties for immutable DTOs
- Prefer ValueTask over Task for hot paths with frequent synchronous completion
- Always pass CancellationToken through async methods
- Use AsNoTracking() for read-only queries to reduce EF Core change tracking overhead
- Apply the repository pattern only when it adds real abstraction value
- Use FluentAssertions for expressive test assertions
- Leverage source generators to reduce boilerplate code
- Use ObjectPool or ArrayPool for frequently allocated objects
