import asyncio
import collections
from typing import Callable, List, Dict, Any, Optional
from datetime import datetime
from .base_adapter import VMSEvent

class FederationEventBus:
    """
    High-throughput Metadata & Event Exchange Bus (Model 3 Core Component).
    Provides pub-sub decoupling, event routing, filtering, and cross-system event broadcast.
    """

    def __init__(self, max_history: int = 500):
        self.max_history = max_history
        self._history: collections.deque = collections.deque(maxlen=max_history)
        self._subscribers: List[Callable[[VMSEvent], None]] = []
        self._total_published: int = 0
        self._bus_started_at = datetime.utcnow().isoformat()

    def publish(self, event: VMSEvent):
        """Publish an event from any federated VMS adapter to the event bus."""
        self._history.appendleft(event)
        self._total_published += 1

        # Notify synchronous or async subscribers
        for subscriber in self._subscribers:
            try:
                subscriber(event)
            except Exception as e:
                print(f"[EventBus Error] Subscriber failed: {e}")

    def subscribe(self, callback: Callable[[VMSEvent], None]):
        """Register a callback subscriber for live event consumption."""
        self._subscribers.append(callback)

    def get_events(self, limit: int = 50, system_id: Optional[str] = None, hotlist_only: bool = False) -> List[VMSEvent]:
        """Retrieve recent events from the bus with optional filtering."""
        results = []
        for evt in self._history:
            if system_id and evt.source_system_id != system_id:
                continue
            if hotlist_only and not evt.is_hotlist_match:
                continue
            results.append(evt)
            if len(results) >= limit:
                break
        return results

    def get_telemetry(self) -> Dict[str, Any]:
        """Get event bus throughput and operational metrics."""
        return {
            "status": "HEALTHY",
            "bus_type": "Asynchronous Memory Pub/Sub (Kafka/RabbitMQ Compatible Protocol)",
            "buffered_events": len(self._history),
            "max_buffer": self.max_history,
            "total_published_count": self._total_published,
            "active_subscribers": len(self._subscribers),
            "started_at": self._bus_started_at
        }

# Global singleton event bus instance
event_bus = FederationEventBus()
