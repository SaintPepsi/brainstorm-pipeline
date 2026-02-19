# Dependency Inversion Principle (DIP) — Pattern Reference

## The Principle

Both high- and lower-level layers depend on abstractions (interfaces) that expose the behavior needed by higher-level layers. The abstractions are owned by the higher/policy layers — grouped with the policy components in the same package. Lower-level layers implement these abstract classes or interfaces.

This inversion of ownership encourages reuse of the higher and policy layers. Upper layers can swap in different implementations of the lower services. When lower-level components are closed or the application reuses existing services, an **Adapter** mediates between the service and the abstraction.

## When to Apply

Apply DIP at **module boundaries** — where business logic meets infrastructure (databases, external APIs, file systems, notification services, clocks, configuration). The interface is shaped by what the policy layer needs. The external service is an adapter to that abstraction. Reserve DIP for these boundaries only — pure internal logic, data transformations, and utility functions stay concrete.

## Rules

1. **Abstractions live with the policy layer.** Define interfaces where they're consumed (domain/business logic), in the same package as the policy code.
2. **Infrastructure implements the abstraction.** Low-level modules import from the domain and fulfil its interfaces.
3. **Inject at the composition root.** Wire concrete implementations to abstractions at a single entry point. Business logic accepts dependencies through constructors or parameters.
4. **Test doubles implement the same interface.** Simple fakes that fulfil the abstraction. Reserve mocking frameworks for verifying interaction patterns.

## Violations to Flag

1. **Business logic importing infrastructure** — a service module reaching into a database or API client package directly.
2. **Constructing dependencies internally** — `self.repo = PostgresRepository()` inside business logic instead of accepting it as a parameter.
3. **Abstractions defined in the infrastructure layer** — the interface belongs with the code that *consumes* it.
4. **Wiring scattered across files** — composition logic lives at a single entry point.
5. **Leaky abstractions** — interface methods that expose implementation details (e.g., `run_sql_query` on a repository interface). The interface reflects what the policy layer needs.

## Implementation Sequence

When planning or implementing, follow this order:

1. **Interfaces/abstractions first** — define ports, protocols, or abstract classes that business logic depends on. These live in the domain layer.
2. **Business logic next** — core modules that import only the abstractions above. Accept dependencies through constructors or parameters.
3. **Infrastructure/adapters** — concrete implementations (repos, clients, adapters) that fulfil the interfaces. These import from the domain layer.
4. **Composition root last** — wire concrete implementations to abstractions at the application entry point. This is the only place that knows about both interfaces and implementations.

If the design doc has an "Interfaces & Contracts" section, use it to drive this sequence directly.
