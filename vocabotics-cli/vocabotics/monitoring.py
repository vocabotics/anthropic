"""
Monitoring and Observability
Metrics collection, error tracking, and health checks
"""

import time
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
from collections import defaultdict


class MetricsCollector:
    """Collect and export metrics for monitoring"""

    def __init__(self, storage_path: Optional[str] = None):
        """Initialize metrics collector"""
        if storage_path:
            self.metrics_file = Path(storage_path) / "metrics.jsonl"
        else:
            self.metrics_file = Path.home() / ".vocabotics" / "metrics.jsonl"

        self.metrics_file.parent.mkdir(parents=True, exist_ok=True)

        # In-memory counters
        self.counters = defaultdict(int)
        self.gauges = defaultdict(float)
        self.histograms = defaultdict(list)

    def increment(self, metric_name: str, value: int = 1, labels: Optional[Dict[str, str]] = None) -> None:
        """Increment a counter metric"""
        key = self._make_key(metric_name, labels)
        self.counters[key] += value

        self._record_metric({
            "type": "counter",
            "name": metric_name,
            "value": value,
            "labels": labels or {},
            "timestamp": datetime.now().isoformat()
        })

    def set_gauge(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        """Set a gauge metric"""
        key = self._make_key(metric_name, labels)
        self.gauges[key] = value

        self._record_metric({
            "type": "gauge",
            "name": metric_name,
            "value": value,
            "labels": labels or {},
            "timestamp": datetime.now().isoformat()
        })

    def observe(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        """Observe a histogram value"""
        key = self._make_key(metric_name, labels)
        self.histograms[key].append(value)

        self._record_metric({
            "type": "histogram",
            "name": metric_name,
            "value": value,
            "labels": labels or {},
            "timestamp": datetime.now().isoformat()
        })

    def timing(self, metric_name: str, duration_ms: float, labels: Optional[Dict[str, str]] = None) -> None:
        """Record a timing/duration"""
        self.observe(f"{metric_name}_duration_ms", duration_ms, labels)

    def _make_key(self, metric_name: str, labels: Optional[Dict[str, str]]) -> str:
        """Create a unique key for a metric with labels"""
        if not labels:
            return metric_name

        label_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{metric_name}{{{label_str}}}"

    def _record_metric(self, metric: Dict[str, Any]) -> None:
        """Write metric to file"""
        with open(self.metrics_file, 'a') as f:
            f.write(json.dumps(metric) + "\n")

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of all metrics"""
        summary = {
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
            "histograms": {}
        }

        # Calculate histogram statistics
        for key, values in self.histograms.items():
            if values:
                sorted_values = sorted(values)
                summary["histograms"][key] = {
                    "count": len(values),
                    "sum": sum(values),
                    "min": min(values),
                    "max": max(values),
                    "avg": sum(values) / len(values),
                    "p50": sorted_values[len(values) // 2],
                    "p95": sorted_values[int(len(values) * 0.95)] if len(values) > 1 else sorted_values[0],
                    "p99": sorted_values[int(len(values) * 0.99)] if len(values) > 1 else sorted_values[0]
                }

        return summary

    def export_prometheus(self) -> str:
        """Export metrics in Prometheus format"""
        lines = []

        # Export counters
        for key, value in self.counters.items():
            lines.append(f"# TYPE {key} counter")
            lines.append(f"{key} {value}")

        # Export gauges
        for key, value in self.gauges.items():
            lines.append(f"# TYPE {key} gauge")
            lines.append(f"{key} {value}")

        # Export histograms
        for key, values in self.histograms.items():
            if values:
                lines.append(f"# TYPE {key} histogram")
                summary = self.get_summary()["histograms"][key]
                lines.append(f"{key}_count {summary['count']}")
                lines.append(f"{key}_sum {summary['sum']}")

        return "\n".join(lines)


class HealthCheck:
    """Health check system"""

    def __init__(self):
        self.checks = {}

    def register_check(self, name: str, check_fn) -> None:
        """Register a health check"""
        self.checks[name] = check_fn

    def run_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        results = {
            "status": "healthy",
            "checks": {},
            "timestamp": datetime.now().isoformat()
        }

        all_healthy = True

        for name, check_fn in self.checks.items():
            try:
                start = time.time()
                check_result = check_fn()
                duration = (time.time() - start) * 1000

                results["checks"][name] = {
                    "status": "healthy" if check_result else "unhealthy",
                    "duration_ms": duration
                }

                if not check_result:
                    all_healthy = False

            except Exception as e:
                results["checks"][name] = {
                    "status": "error",
                    "error": str(e)
                }
                all_healthy = False

        results["status"] = "healthy" if all_healthy else "unhealthy"
        return results


class MaintenanceMode:
    """Maintenance mode management"""

    def __init__(self, config_path: Optional[str] = None):
        if config_path:
            self.config_file = Path(config_path) / "maintenance.json"
        else:
            self.config_file = Path.home() / ".vocabotics" / "maintenance.json"

        self.config_file.parent.mkdir(parents=True, exist_ok=True)

    def is_maintenance_mode(self) -> bool:
        """Check if maintenance mode is active"""
        if not self.config_file.exists():
            return False

        with open(self.config_file, 'r') as f:
            config = json.load(f)

        return config.get("enabled", False)

    def enable_maintenance(self, message: str = "System is under maintenance") -> None:
        """Enable maintenance mode"""
        config = {
            "enabled": True,
            "message": message,
            "enabled_at": datetime.now().isoformat()
        }

        with open(self.config_file, 'w') as f:
            json.dump(config, f, indent=2)

    def disable_maintenance(self) -> None:
        """Disable maintenance mode"""
        if self.config_file.exists():
            self.config_file.unlink()

    def get_maintenance_message(self) -> Optional[str]:
        """Get maintenance message"""
        if not self.is_maintenance_mode():
            return None

        with open(self.config_file, 'r') as f:
            config = json.load(f)

        return config.get("message")


# Global instances
_metrics = None
_health_check = None
_maintenance_mode = None


def get_metrics() -> MetricsCollector:
    """Get global metrics collector"""
    global _metrics
    if _metrics is None:
        _metrics = MetricsCollector()
    return _metrics


def get_health_check() -> HealthCheck:
    """Get global health check"""
    global _health_check
    if _health_check is None:
        _health_check = HealthCheck()
    return _health_check


def get_maintenance_mode() -> MaintenanceMode:
    """Get global maintenance mode"""
    global _maintenance_mode
    if _maintenance_mode is None:
        _maintenance_mode = MaintenanceMode()
    return _maintenance_mode


# Convenience functions
def track_ai_call(project_id: str, model: str, tokens: int, cost: float, duration_ms: float):
    """Track an AI API call"""
    metrics = get_metrics()
    metrics.increment("ai_calls_total", labels={"project": project_id, "model": model})
    metrics.increment("ai_tokens_total", value=tokens, labels={"model": model})
    metrics.observe("ai_cost_usd", cost, labels={"model": model})
    metrics.timing("ai_call", duration_ms, labels={"model": model})


def track_project_generation(project_id: str, phase: str, success: bool):
    """Track project generation"""
    metrics = get_metrics()
    status = "success" if success else "failure"
    metrics.increment("project_generations_total", labels={"phase": phase, "status": status})
