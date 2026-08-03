---
name: nestjs-expert
description: NestJS framework. Modules, decorators, dependency injection, microservices, GraphQL.
---

# NestJS Expert

## When to Apply
Use this skill when building or maintaining NestJS applications, including modules, controllers, services, microservices, GraphQL APIs, and enterprise-grade backends.

## Core Concepts
- **Modules**: Feature modules, dynamic modules, global modules, module organization patterns
- **Decorators**: Custom decorators, param decorators, method decorators, execution context
- **Dependency Injection**: Providers, scoped providers, circular dependencies, custom providers
- **Guards**: Authentication guards, role-based access, execution context analysis
- **Interceptors**: Response transformation, logging, caching, timeout handling
- **Pipes**: Validation pipes, transformation pipes, custom pipes with Zod or class-validator
- **Microservices**: Transport layers (TCP, Redis, NATS, Kafka), message patterns, event patterns
- **GraphQL**: Code-first vs schema-first, resolvers, subscriptions, federation

## Implementation
```typescript
// Feature module with proper organization
@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService]
})
export class UsersModule {}

// Service with dependency injection
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly cacheManager: Cache
  ) {}

  async findById(id: string): Promise<User | null> {
    const cached = await this.cacheManager.get<User>(`user:${id}`)
    if (cached) return cached

    const user = await this.userRepo.findOneBy({ id })
    if (user) {
      await this.cacheManager.set(`user:${id}`, user, 300)
    }
    return user
  }
}

// Custom decorator for extracting user from request
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user
    return data ? user?.[data] : user
  }
)

// Guard with role-based access control
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass()
    ])
    if (!requiredRoles) return true

    const { user } = context.switchToHttp().getRequest()
    return requiredRoles.some((role) => user.roles?.includes(role))
  }
}

// Microservice message pattern handler
@MessagePattern({ cmd: 'get_user' })
async getUser(@Payload() data: { id: string }) {
  return this.usersService.findById(data.id)
}

// GraphQL resolver (code-first)
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  async user(@Args('id') id: string) {
    return this.usersService.findById(id)
  }

  @ResolveField(() => [Post])
  async posts(@Parent() user: User) {
    return this.postsService.findByUserId(user.id)
  }
}
```

## Best Practices
- Organize features into self-contained modules with clear public APIs
- Use class-validator and class-transformer for DTO validation
- Prefer scoped providers (REQUEST scope) only when necessary
- Use interceptors for cross-cutting concerns, not business logic
- Implement health checks with @nestjs/terminus for production readiness
- Use configuration module for environment-based settings
- Write unit tests for services and e2e tests for controllers
- Leverage CLI generators for consistent file scaffolding
