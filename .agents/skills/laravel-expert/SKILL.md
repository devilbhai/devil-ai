---
name: laravel-expert
description: Laravel PHP framework expert. Covers Eloquent ORM, Blade templates, routing, middleware, queues, events, testing, Laravel 11+ features, API resources, sanctum/passport auth.
---

# Laravel Expert

## When to Apply
Use this skill when working with Laravel PHP framework projects. Apply when:
- Building or maintaining Laravel applications (5.x through 11+)
- Writing Eloquent models, relationships, scopes, or accessors
- Creating Blade views or Livewire components
- Implementing authentication (Sanctum, Passport, Breeze, Jetstream)
- Designing RESTful APIs with API Resources
- Working with queues, events, broadcasting, or notifications
- Writing tests with PHPUnit or Pest
- Configuring middleware, service providers, or routing
- Debugging Laravel-specific errors or performance issues

## Core Patterns

### Eloquent ORM
- Use `Model::class` type hints, not string-based relationships
- Define `$fillable` and `$guarded` properties on every model
- Prefer `loquent::where()` chains over raw queries when possible
- Use local scopes for reusable query constraints
- Leverage eager loading (`with()`) to prevent N+1 queries
- Use `$casts` for attribute type casting (dates, enums, collections)
- Prefer `firstOrFail()` and `findOrFail()` for expected records
- Use `routeModelBinding` for automatic model resolution in routes

### Routing & Controllers
- Use route model binding for clean controller signatures
- Group routes with `Route::middleware()` and `Route::prefix()`
- Use form requests for validation instead of inline validation in controllers
- Keep controllers thin — delegate business logic to services or actions
- Use `apiResource()` for RESTful API routes
- Leverage implicit route model binding with custom keys via `getRouteKeyName()`

### Authentication
- Sanctum for SPA authentication and API token auth
- Use `auth:sanctum` middleware for protected routes
- Prefer `HasApiTokens` trait only on models that need API tokens
- Implement multi-factor authentication with Laravel Fortify
- Use Policy classes for authorization logic

### API Resources
- Use `JsonResource` and `ResourceCollection` for consistent API responses
- Wrap responses in `data` key using `wrap()` or custom nesting
- Use `when()` and `whenLoaded()` for conditional fields
- Implement `withResponse()` for status code control
- Leverage `AnonymousResourceCollection` for paginated responses

### Queues & Jobs
- Use `dispatch()` and `ShouldQueue` interface for async jobs
- Implement `failed()` method on jobs for error handling
- Use `Bus::batch()` or `Bus::chain()` for job orchestration
- Apply `$tries`, `$timeout`, `$backoff` properties for retry control
- Use dedicated queue connections for different job types
- Always use `Bus::dispatch()` rather than `dispatch_now()` in queue contexts

### Testing
- Use `RefreshDatabase` trait for database tests
- Leverage `actingAs()` for authenticated test states
- Use `Json::assertJson()` for API response assertions
- Factory-based test data with `User::factory()->create()`
- Use `Route::fake()` and `Notification::fake()` for isolation
- Apply `WithoutMiddleware` sparingly and only for specific tests

## Code Examples

### Eloquent Model with Relationships
```php
class User extends Authenticatable
{
    use HasFactory, HasApiTokens, Notifiable;

    protected $fillable = ['name', 'email', 'password'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function activePosts(): HasMany
    {
        return $this->hasMany(Post::class)->where('status', 'published');
    }
}
```

### Form Request Validation
```php
class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'tags' => ['array', 'max:5'],
            'tags.*' => ['string', 'exists:tags,name'],
        ];
    }
}
```

### API Resource
```php
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'author' => new UserResource($this->whenLoaded('user')),
            'published_at' => $this->when($this->status === 'published', fn() => $this->published_at),
            'created_at' => $this->created_at,
        ];
    }
}
```

### Scoped Job with Retry
```php
class ProcessWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $timeout = 60;
    public array $backoff = [30, 60, 120];

    public function __construct(
        private readonly WebhookPayload $payload,
    ) {}

    public function handle(Processor $processor): void
    {
        $processor->handle($this->payload);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Webhook processing failed', [
            'webhook_id' => $this->payload->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
```

### Test Example
```php
class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_post(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/posts', [
                'title' => 'Test Post',
                'body' => 'Body content',
                'category_id' => $category->id,
            ]);

        $response->assertCreated()
            ->assertJsonFragment(['title' => 'Test Post']);

        $this->assertDatabaseHas('posts', ['title' => 'Test Post']);
    }
}
```

## Best Practices
- Always use form request classes for validation — never validate in controllers
- Use `$fillable` over `$guarded` for explicit mass assignment protection
- Prefer Eloquent relationships over raw SQL joins
- Implement soft deletes on models where data recovery matters
- Use policy classes for authorization — avoid inline permission checks
- Cache expensive queries with `Cache::remember()` or model caching
- Use `artisan make:` generators to follow Laravel conventions consistently
- Keep controllers under 10 lines — extract logic to services, actions, or jobs
- Use `dispatch()` for long-running operations to keep HTTP responses fast
- Write feature tests for user flows and unit tests for isolated logic
- Use `Route::middleware('throttle:api')` for API rate limiting
- Leverage Laravel's built-in encryption for sensitive data in the database
