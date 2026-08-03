---
name: angular-expert
description: Angular development. Components, services, RxJS, Angular Material, testing, performance.
---

# Angular Expert

## When to Apply
Use this skill when building or maintaining Angular applications, including components, services, routing, forms, HTTP communication, and Angular Material integration.

## Core Concepts
- **Components**: Functional and class-based components, lifecycle hooks, template syntax, content projection
- **Services**: Dependency injection, providers, singleton services, factory providers
- **RxJS**: Observables, operators, Subjects, BehaviorSubject, async pipe, error handling patterns
- **Angular Material**: Theming, custom components, CDK utilities, responsive layouts
- **Modules**: Feature modules, lazy loading, standalone components, route-based code splitting
- **Forms**: Reactive forms, template-driven forms, custom validators, dynamic forms
- **Testing**: Unit testing with Jasmine/Karma, integration tests, TestBed patterns

## Implementation
```typescript
// Standalone component with signals (Angular 17+)
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ user().name }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>{{ user().email }}</p>
      </mat-card-content>
    </mat-card>
  `
})
export class UserCardComponent {
  user = input.required<User>();
}

// Service with dependency injection
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = '/api/users';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }
}

// Reactive form with custom validators
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule]
})
export class UserFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]]
  });
}
```

## Best Practices
- Use standalone components for simpler, tree-shakable applications
- Prefer signals over RxJS for synchronous state management
- Lazy load feature modules to reduce initial bundle size
- Use the `async` pipe to manage subscriptions automatically
- Implement route guards using functional guards
- Keep components focused on a single responsibility
- Use OnPush change detection for performance-critical components
- Write meaningful tests with real HTTP interceptors instead of mocking
