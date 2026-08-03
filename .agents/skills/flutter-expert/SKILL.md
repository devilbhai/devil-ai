---
name: flutter-expert
description: Flutter/Dart mobile development. Covers widgets, state management (Riverpod, Bloc), navigation, animations, platform channels, Firebase integration, responsive design, testing.
---

# Flutter Expert

## When to Apply
Use this skill when working with Flutter/Dart mobile or cross-platform projects. Apply when:
- Building or maintaining Flutter applications
- Writing custom widgets or layout systems
- Implementing state management (Riverpod, Bloc, Provider, GetX)
- Handling navigation and routing (GoRouter, auto_route)
- Integrating with native platform code via platform channels
- Using Firebase services (Auth, Firestore, Storage, Messaging, Analytics)
- Implementing animations (implicit, explicit, custom)
- Writing widget tests, integration tests, or golden tests
- Handling responsive/adaptive layouts for phones, tablets, and desktop
- Optimizing performance or debugging rendering issues

## Core Patterns

### Widget Architecture
- Prefer `StatelessWidget` unless mutable state is required
- Extract reusable widgets into separate files — keep widgets small
- Use `const` constructors everywhere possible for performance
- Prefer `ConsumerWidget` / `ConsumerStatefulWidget` with Riverpod over raw State
- Use `Keys` (ValueKey, ObjectKey, GlobalKey) when widgets can reorder or rebuild
- Never put business logic in widgets — delegate to providers or notifiers
- Use `LayoutBuilder` + `ResponsiveBuilder` or `Breakpoints` for responsive layouts

### State Management
- **Riverpod**: Use `ref.watch()` for reactive, `ref.read()` for one-time reads
- Use `AsyncValue` pattern: `when(data:, loading:, error:)` for async state
- Prefer `Notifier` or `AsyncNotifier` over `StateNotifier` for new code
- Use `family` providers for parameterized state
- Avoid `Provider.of(context)` — prefer `ref.watch()` for explicit dependencies
- **Bloc**: Keep events and states as sealed classes (Dart 3)
- Use `BlocProvider` scope carefully — avoid deep nesting
- Always handle loading/error states in the UI

### Navigation
- Use GoRouter for declarative, URL-based routing
- Implement shell routes for nested navigation with bottom navigation
- Use `context.go()` for replacement, `context.push()` for stack
- Handle deep linking via GoRouter's `extra` or path parameters
- Use route guards for authentication checks
- Keep route definitions centralized in a single file

### Platform Channels
- Use `MethodChannel` for simple method calls to native code
- Use `EventChannel` for streaming data from native to Dart
- Always handle `MissingPluginException` gracefully
- Define platform channel constants in a shared file
- Keep platform-specific logic in `android/` and `ios/` directories
- Use platform channel for features not available in Flutter (biometrics, sensors)

### Firebase Integration
- Use `firebase_core` initialization in `main()` before `runApp()`
- Prefer `cloud_firestore` with typed data classes over raw maps
- Use Firebase Auth `authStateChanges()` stream for auth state
- Implement offline persistence for Firestore when needed
- Use `firebase_messaging` for push notifications with proper token management
- Structure Firestore collections with scalability in mind (subcollections, references)

### Performance
- Use `const` widgets to prevent unnecessary rebuilds
- Implement `ListView.builder` for long lists (virtualized rendering)
- Use `RepaintBoundary` for complex animations
- Minimize `setState()` scope — use targeted rebuilds
- Profile with Flutter DevTools for jank detection
- Cache expensive computations with `computed` or derived providers
- Use `Image.asset()` with `fit` and proper sizing for memory efficiency

## Code Examples

### Riverpod State Management
```dart
// Async notifier for data fetching
@riverpod
class UserPosts extends _$UserPosts {
  @override
  Future<List<Post>> build(String userId) async {
    final dio = ref.watch(dioProvider);
    final response = await dio.get('/users/$userId/posts');
    return (response.data as List).map((e) => Post.fromJson(e)).toList();
  }

  Future<void> addPost(CreatePostRequest request) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final dio = ref.read(dioProvider);
      await dio.post('/posts', data: request.toJson());
      return build(request.userId).future;
    });
  }
}

// UI consumption
class UserPostsWidget extends ConsumerWidget {
  const UserPostsWidget({required this.userId, super.key});

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postsAsync = ref.watch(userPostsProvider(userId));

    return postsAsync.when(
      data: (posts) => ListView.builder(
        itemCount: posts.length,
        itemBuilder: (ctx, i) => PostTile(post: posts[i]),
      ),
      loading: () => const CircularProgressIndicator(),
      error: (err, stack) => ErrorWidget(err),
    );
  }
}
```

### GoRouter Configuration
```dart
final router = GoRouter(
  initialLocation: '/home',
  redirect: (context, state) {
    final isLoggedIn = ref.read(authProvider).isAuthenticated;
    final isLoginRoute = state.matchedLocation == '/login';

    if (!isLoggedIn && !isLoginRoute) return '/login';
    if (isLoggedIn && isLoginRoute) return '/home';
    return null;
  },
  routes: [
    ShellRoute(
      builder: (context, state, child) => ScaffoldWithNav(child: child),
      routes: [
        GoRoute(path: '/home', builder: (ctx, st) => const HomeScreen()),
        GoRoute(path: '/profile', builder: (ctx, st) => const ProfileScreen()),
      ],
    ),
    GoRoute(path: '/login', builder: (ctx, st) => const LoginScreen()),
  ],
);
```

### Custom Animated Widget
```dart
class FadeInSlide extends StatefulWidget {
  const FadeInSlide({required this.child, super.key});

  final Widget child;

  @override
  State<FadeInSlide> createState() => _FadeInSlideState();
}

class _FadeInSlideState extends State<FadeInSlide>
    with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 600),
  );

  late final _fade = CurvedAnimation(
    parent: _controller,
    curve: Curves.easeOut,
  );

  late final _slide = Tween<Offset>(
    begin: const Offset(0, 0.1),
    end: Offset.zero,
  ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

  @override
  void initState() {
    super.initState();
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}
```

## Best Practices
- Always use `const` constructors to reduce rebuilds
- Handle all `AsyncValue` states: data, loading, error
- Use `ListView.builder` for any list with dynamic or large data
- Separate UI, state, and business logic into distinct directories
- Write widget tests for every custom widget
- Use `flutter_lints` and `dart analyze` for static analysis
- Prefer composition over inheritance for widget reuse
- Handle platform differences explicitly with `Platform.isAndroid/iOS`
- Use `Theme.of(context)` for consistent styling — avoid hardcoded colors
- Keep `main()` clean — extract initialization into services
- Use `json_serializable` or `freezed` for model serialization
- Profile memory usage when working with images or animations
