"""
VMS Federation & Middleware Integration Module
Model 3 - Interoperability & Cross-System Integration Layer
"""

from .base_adapter import BaseVMSAdapter, VMSHealthStatus, VMSSystemMetadata, VMSEvent
from .city_police_adapter import CityPoliceVMSAdapter
from .highway_toll_adapter import HighwayTollVMSAdapter
from .event_bus import FederationEventBus, event_bus
from .correlation_engine import CrossSystemCorrelationEngine, correlation_engine
from .federation_manager import FederationManager, federation_manager

__all__ = [
    "BaseVMSAdapter",
    "VMSHealthStatus",
    "VMSSystemMetadata",
    "VMSEvent",
    "CityPoliceVMSAdapter",
    "HighwayTollVMSAdapter",
    "FederationEventBus",
    "event_bus",
    "CrossSystemCorrelationEngine",
    "correlation_engine",
    "FederationManager",
    "federation_manager",
]
