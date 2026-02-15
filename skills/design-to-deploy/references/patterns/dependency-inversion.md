# Dependency Inversion Principle (DIP) — Pattern Reference

## The Principle

With the introduction of an abstract layer, both high- and lower-level layers reduce the traditional dependencies from top to bottom. The "inversion" concept does not mean that lower-level layers directly depend on higher-level layers. Rather, both layers should depend on abstractions (interfaces) that expose the behavior needed by higher-level layers.

The abstractions are owned by the higher/policy layers. This groups the higher/policy components and the abstractions that define lower services together in the same package. The lower-level layers are created by inheritance/implementation of these abstract classes or interfaces.

The inversion of dependencies and ownership encourages reuse of the higher and policy layers. Upper layers could use other implementations of the lower services. When the lower-level layer components are closed or when the application requires the reuse of existing services, it is common that an **Adapter** mediates between the services and the abstractions.

## When to Apply

Apply DIP at **module boundaries** — where business logic meets infrastructure (databases, external APIs, file systems, notification services, clocks, configuration). The interface should be shaped by what the policy layer needs, not by what the external service offers. The external service is an adapter to the abstraction, not the other way around.

**Do NOT apply DIP** to pure internal logic, simple data transformations, or utility functions. Over-abstracting harms readability.

## Rules

1. **Abstractions live with the policy layer.** The interface is defined where it's consumed (domain/business logic), not where it's implemented (infrastructure).
2. **Infrastructure implements, never defines.** Low-level modules implement the interface and import from the domain — never the reverse.
3. **Inject at the composition root.** Wire concrete implementations to abstractions at a single entry point. Business logic never instantiates its own dependencies.
4. **Test doubles implement the same interface.** No mocking library required — just implement the abstraction. Reserve mocking frameworks for verifying interaction patterns.

## Violations to Flag

1. **Business logic importing infrastructure** — a service module reaching into a database or API client package directly.
2. **Constructing dependencies internally** — `self.repo = PostgresRepository()` inside business logic instead of accepting it as a parameter.
3. **Abstractions defined in the infrastructure layer** — the interface belongs with the code that *uses* it, not the code that *implements* it.
4. **Wiring scattered across files** — composition logic should live at the entry point, not spread throughout the codebase.
5. **Leaky abstractions** — interface methods that expose implementation details (e.g., `run_sql_query` on a repository interface). The interface reflects what the policy layer needs, not how the adapter works.
