let before: Record<string, number> = {};
let lastName: Record<string, string> = {};
let enabled = false;
export function createPe(scope: string) {
  return function pe(name: string) {
    if (!enabled) {
      return;
    }
    const current = performance.now();
    console.log(lastName[scope], current - before[scope]);
    before[scope] = current;
    lastName[scope] = name;
  };
}

export function togglePerformance() {
  enabled = !enabled;
  console.log("Performance", enabled ? "enabled" : "disabled");
}
