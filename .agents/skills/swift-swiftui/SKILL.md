---
name: swift-swiftui
description: iOS development with Swift and SwiftUI - views, state management, navigation, animations.
---

# Swift & SwiftUI

## When to Apply
Use this skill for iOS development, building SwiftUI views, or implementing iOS-specific features.

## Core Concepts
- SwiftUI views and modifiers
- State management (@State, @Binding, @ObservedObject)
- Navigation (NavigationStack)
- Animations and transitions
- Core Data and SwiftData
- Networking with async/await

## Best Practices
- Use SwiftUI's declarative syntax
- Implement proper state management
- Use @Observable for new projects
- Handle errors gracefully
- Support Dynamic Type
- Test with previews

## View Structure
```swift
import SwiftUI

struct UserCard: View {
    let user: User
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(user.name)
                .font(.headline)
            Text(user.email)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
        .shadow(radius: 2)
    }
}
```

## State Management
```swift
@Observable
class UserStore {
    var users: [User] = []
    var isLoading = false
    
    func fetchUsers() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            users = try await api.fetchUsers()
        } catch {
            print("Error: \(error)")
        }
    }
}

struct UserList: View {
    @State private var store = UserStore()
    
    var body: some View {
        List(store.users) { user in
            UserCard(user: user)
        }
        .task {
            await store.fetchUsers()
        }
    }
}
```

## Navigation
```swift
NavigationStack {
    List(users) { user in
        NavigationLink(value: user) {
            UserCard(user: user)
        }
    }
    .navigationDestination(for: User.self) { user in
        UserDetail(user: user)
    }
}
```

## Animations
```swift
withAnimation(.spring()) {
    isExpanded.toggle()
}

// Transition
VStack { ... }
    .transition(.slide)
    .animation(.easeInOut, value: isShowing)
```
