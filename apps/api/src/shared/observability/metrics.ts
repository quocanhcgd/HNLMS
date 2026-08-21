export type MetricLabels = Record<string, string | number | boolean>;

export interface MetricDefinition {
  name: string;
  help: string;
  labelNames?: readonly string[];
}

interface MetricSample {
  labels: Record<string, string>;
  value: number;
}

abstract class Metric {
  readonly name: string;
  readonly help: string;
  private readonly labelNames: readonly string[];
  protected readonly samples = new Map<string, MetricSample>();

  protected constructor(
    definition: MetricDefinition,
    readonly type: "counter" | "gauge",
  ) {
    assertMetricDefinition(definition);
    this.name = definition.name;
    this.help = definition.help;
    this.labelNames = definition.labelNames ?? [];
  }

  protected sample(labels: MetricLabels = {}): MetricSample {
    const normalized = normalizeLabels(labels, this.labelNames);
    const key = this.labelNames.map((name) => `${name}=${normalized[name]}`).join("|");
    const existing = this.samples.get(key);
    if (existing) return existing;
    const created = { labels: normalized, value: 0 };
    this.samples.set(key, created);
    return created;
  }

  render(): string[] {
    const lines = [`# HELP ${this.name} ${escapeHelp(this.help)}`, `# TYPE ${this.name} ${this.type}`];
    for (const sample of this.samples.values()) {
      lines.push(`${this.name}${renderLabels(sample.labels)} ${sample.value}`);
    }
    return lines;
  }
}

export class Counter extends Metric {
  constructor(definition: MetricDefinition) {
    super(definition, "counter");
  }

  inc(labels: MetricLabels = {}, value = 1): void {
    if (!Number.isFinite(value) || value < 0) throw new Error("metric_counter_increment_invalid");
    this.sample(labels).value += value;
  }
}

export class Gauge extends Metric {
  constructor(definition: MetricDefinition) {
    super(definition, "gauge");
  }

  set(labels: MetricLabels = {}, value: number): void {
    if (!Number.isFinite(value)) throw new Error("metric_gauge_value_invalid");
    this.sample(labels).value = value;
  }
}

export class MetricsRegistry {
  private readonly metrics = new Map<string, Metric>();

  counter(definition: MetricDefinition): Counter {
    return this.register(new Counter(definition));
  }

  gauge(definition: MetricDefinition): Gauge {
    return this.register(new Gauge(definition));
  }

  renderPrometheus(): string {
    return [...this.metrics.values()].flatMap((metric) => metric.render()).join("\n") + "\n";
  }

  private register<T extends Metric>(metric: T): T {
    if (this.metrics.has(metric.name)) throw new Error(`metric_already_registered:${metric.name}`);
    this.metrics.set(metric.name, metric);
    return metric;
  }
}

function assertMetricDefinition(definition: MetricDefinition): void {
  if (!/^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(definition.name)) throw new Error("metric_name_invalid");
  if (!definition.help.trim()) throw new Error("metric_help_required");
  const labels = definition.labelNames ?? [];
  if (new Set(labels).size !== labels.length || labels.some((label) => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(label))) {
    throw new Error("metric_label_names_invalid");
  }
}

function normalizeLabels(labels: MetricLabels, expectedNames: readonly string[]): Record<string, string> {
  const keys = Object.keys(labels).sort();
  if (keys.length !== expectedNames.length || keys.some((key) => !expectedNames.includes(key))) {
    throw new Error("metric_labels_mismatch");
  }
  return Object.fromEntries(expectedNames.map((name) => [name, String(labels[name])])) as Record<string, string>;
}

function renderLabels(labels: Record<string, string>): string {
  const entries = Object.entries(labels);
  return entries.length ? `{${entries.map(([key, value]) => `${key}="${escapeLabel(value)}"`).join(",")}}` : "";
}

function escapeHelp(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}
