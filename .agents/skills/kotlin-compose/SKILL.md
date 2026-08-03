---
name: kotlin-compose
description: Android development with Kotlin and Jetpack Compose - UI, state, navigation, animations.
---

# Kotlin & Jetpack Compose

## When to Apply
Use this skill for Android development, building Compose UIs, or implementing Android-specific features.

## Core Concepts
- Composable functions
- State management (remember, mutableStateOf)
- Navigation (Compose Navigation)
- Animations and transitions
- Material Design 3
- Coroutines and Flow

## Best Practices
- Use Compose's declarative approach
- Implement proper state hoisting
- Use ViewModel for business logic
- Handle configuration changes
- Test with Compose testing
- Use Material 3 components

## Composable Structure
```kotlin
@Composable
fun UserCard(user: User, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = user.name,
                style = MaterialTheme.typography.headlineMedium
            )
            Text(
                text = user.email,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
```

## State Management
```kotlin
@Composable
fun UserList() {
    val viewModel: UserViewModel = viewModel()
    val users by viewModel.users.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    
    if (isLoading) {
        CircularProgressIndicator()
    } else {
        LazyColumn {
            items(users) { user ->
                UserCard(user = user, onClick = { viewModel.selectUser(user) })
            }
        }
    }
}
```

## Navigation
```kotlin
NavHost(navController = navController, startDestination = "users") {
    composable("users") {
        UserList(onUserClick = { userId ->
            navController.navigate("user/$userId")
        })
    }
    composable("user/{userId}") { backStackEntry ->
        val userId = backStackEntry.arguments?.getString("userId")
        UserDetail(userId = userId)
    }
}
```

## Animations
```kotlin
var expanded by remember { mutableStateOf(false) }
val size by animateDpAsState(
    targetValue = if (expanded) 200.dp else 100.dp,
    animationSpec = spring()
)

Box(modifier = Modifier.size(size))
```
