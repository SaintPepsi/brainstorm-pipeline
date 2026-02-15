# Dependency Inversion Principle (DIP) — Pattern Reference

## The Principle

High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions.

In practice: business logic defines the interfaces it needs, and infrastructure code implements those interfaces. Control flows inward — the core never imports from the edges.

## Why This Matters for Generated Code

Code produced by this pipeline will be maintained long after the session ends. DIP makes that code:

- **Testable** — swap real implementations for test doubles by depending on interfaces, not concrete classes.
- **Changeable** — replace a database, API client, or file system without rewriting business logic.
- **Readable** — the dependency graph points inward, so readers understand what the system *does* before learning *how*.

## When to Apply DIP

Apply DIP at **module boundaries** — where business logic meets infrastructure:

| Boundary | Abstraction | Concrete Implementation |
| --- | --- | --- |
| Data persistence | `Repository` interface | `PostgresRepository`, `InMemoryRepository` |
| External APIs | `Client` interface / protocol | `HttpClient`, `MockClient` |
| File system | `Storage` interface | `DiskStorage`, `S3Storage` |
| Notifications | `Notifier` interface | `EmailNotifier`, `SlackNotifier` |
| Time / clocks | `Clock` interface | `SystemClock`, `FakeClock` |
| Configuration | `Config` protocol | `EnvConfig`, `FileConfig` |

**Do NOT apply DIP** to pure internal logic, simple data transformations, or utility functions. Over-abstracting harms readability. The target is boundaries where implementations are likely to change or where testability demands substitution.

## The Pattern in Three Steps

### Step 1 — Define the Abstraction

The high-level module declares what it needs as an interface, protocol, or abstract class. The abstraction lives with the high-level code, not with the implementation.

```
# Python example
# domain/ports.py  ← lives in the domain layer
from abc import ABC, abstractmethod

class OrderRepository(ABC):
    @abstractmethod
    def save(self, order: Order) -> None: ...

    @abstractmethod
    def find_by_id(self, order_id: str) -> Order | None: ...
```

```
// TypeScript example
// domain/ports.ts  ← lives in the domain layer
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(orderId: string): Promise<Order | null>;
}
```

### Step 2 — Implement Against the Abstraction

Low-level modules implement the interface. They import from the domain — never the reverse.

```
# infrastructure/postgres_order_repo.py
from domain.ports import OrderRepository

class PostgresOrderRepository(OrderRepository):
    def __init__(self, connection_pool):
        self._pool = connection_pool

    def save(self, order: Order) -> None:
        # SQL insert using self._pool
        ...
```

```
// infrastructure/postgres-order-repo.ts
import { OrderRepository } from '../domain/ports';

export class PostgresOrderRepository implements OrderRepository {
  constructor(private pool: Pool) {}

  async save(order: Order): Promise<void> {
    // SQL insert using this.pool
  }
}
```

### Step 3 — Inject at the Composition Root

Wire concrete implementations to abstractions at the application entry point — the "composition root." Business logic never instantiates its own dependencies.

```
# main.py  ← composition root
from domain.order_service import OrderService
from infrastructure.postgres_order_repo import PostgresOrderRepository

repo = PostgresOrderRepository(pool)
service = OrderService(repo)  # inject the abstraction
```

```
// main.ts  ← composition root
import { OrderService } from './domain/order-service';
import { PostgresOrderRepository } from './infrastructure/postgres-order-repo';

const repo = new PostgresOrderRepository(pool);
const service = new OrderService(repo); // inject the abstraction
```

## DIP and Testing

DIP makes testing straightforward because test doubles implement the same interface:

```
# tests/test_order_service.py
class FakeOrderRepository(OrderRepository):
    def __init__(self):
        self.orders = {}

    def save(self, order):
        self.orders[order.id] = order

    def find_by_id(self, order_id):
        return self.orders.get(order_id)

def test_place_order():
    repo = FakeOrderRepository()
    service = OrderService(repo)
    service.place_order(...)
    assert repo.orders["order-1"].status == "placed"
```

No mocking library required for unit tests — just implement the interface. Reserve mocking frameworks for verifying interaction patterns when needed.

## Common Violations to Flag

1. **Business logic importing infrastructure** — `from infrastructure.db import get_connection` inside a service module.
2. **Constructing dependencies internally** — `self.repo = PostgresRepository()` inside `OrderService.__init__` instead of accepting it as a parameter.
3. **Abstractions defined in the infrastructure layer** — the interface should live with the code that *uses* it, not the code that *implements* it.
4. **God composition root** — wiring logic scattered across many files instead of a single entry point.
5. **Leaky abstractions** — interface methods that expose implementation details (e.g., `run_sql_query` on a repository interface).

## Language-Specific Guidance

### Python
- Use `abc.ABC` + `@abstractmethod` for interfaces, or `typing.Protocol` for structural (duck-typed) contracts.
- Constructor injection is the default pattern. Use `__init__` parameters.
- For lightweight cases, function parameters accepting a callable or protocol are sufficient — not everything needs a class.

### TypeScript / JavaScript
- Use `interface` for contracts. Prefer interfaces over abstract classes unless shared implementation is needed.
- Constructor injection via class constructors, or factory functions that accept dependencies.
- For frameworks with DI containers (NestJS, Angular), register abstractions as injection tokens.

### Go
- Interfaces are implicit (structural typing). Define the interface where it's consumed, not where it's implemented.
- Accept interfaces, return structs.
- Constructor functions (`NewOrderService(repo OrderRepository)`) for injection.

### Rust
- Use traits for abstractions. Generic parameters (`impl Trait`) or trait objects (`dyn Trait`) depending on dispatch needs.
- Constructor functions accept trait bounds.

## How This Pattern Integrates with the Pipeline

Each pipeline stage should apply DIP as follows:

- **Brainstormer**: During design, identify module boundaries and note which dependencies should be abstracted. Include an "Interfaces & Contracts" section in the design doc.
- **Feature Planner**: Plan abstraction definitions as early implementation steps. Sequence: interfaces first, then implementations, then wiring.
- **Test Planner**: Plan tests against interfaces. Test doubles should implement the same abstractions as production code.
- **Feature Implementer**: Create interface files before implementation files. Wire dependencies at the composition root, not inside business logic.
- **Plan Reviewer**: Flag DIP violations — business logic importing infrastructure, missing interfaces at boundaries, dependencies constructed internally.
- **Test Implementer**: Write test doubles that implement the defined interfaces. Verify business logic through the abstraction, not through concrete implementations.
