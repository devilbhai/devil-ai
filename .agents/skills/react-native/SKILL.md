---
name: react-native
description: Cross-platform mobile development with React Native - components, navigation, state, native modules.
---

# React Native

## When to Apply
Use this skill for building cross-platform mobile apps, debugging native issues, or optimizing performance.

## Core Concepts
- Components and JSX
- Navigation (React Navigation)
- State management (Redux, Zustand)
- Native modules
- Platform-specific code
- Performance optimization

## Best Practices
- Use functional components with hooks
- Optimize FlatList rendering
- Handle platform differences
- Use Hermes engine
- Implement proper error boundaries
- Test on real devices
- Use Flipper for debugging

## Component Pattern
```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UserCard = ({ user }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
});

export default UserCard;
```

## Navigation
```jsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Performance Tips
- Use FlatList for long lists
- Avoid inline functions in render
- Use React.memo for pure components
- Implement lazy loading
- Optimize images with FastImage
- Use native driver for animations
