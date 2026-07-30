export interface VcrScore {
  value: number
  confidence: number
  risk: number
}

export interface AtcMeta {
  testId: string
  label?: string
  story?: string
  feature?: string
  vcr?: VcrScore
}

const atcRegistry = new Map<string, AtcMeta>();

export function atc(testId: string, meta?: Omit<AtcMeta, 'testId'>) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    if (atcRegistry.has(testId)) { return descriptor; }
    atcRegistry.set(testId, {
      testId,
      label: meta?.label,
      story: meta?.story,
      feature: meta?.feature,
      vcr: meta?.vcr,
    });
    return descriptor;
  };
}

export function getAllAtcs(): AtcMeta[] {
  return Array.from(atcRegistry.values());
}

export function getAtc(testId: string): AtcMeta | undefined {
  return atcRegistry.get(testId);
}

export function resetAtcs(): void {
  atcRegistry.clear();
}
