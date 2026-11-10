const DEFAULT_WINDOW_MS = 60000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function nowMs() {
  return Date.now();
}

function errorText(error) {
  return String(error?.message || error?.details || error || '');
}

export function isRateLimitError(error) {
  const text = errorText(error).toLowerCase();
  return error?.status === 429 || text.includes('rate limit') || text.includes('too many requests') || text.includes('retry after');
}

export function retryAfterMs(error) {
  const text = errorText(error);
  const match = text.match(/retry after\s+(\d+)\s*s/i) || text.match(/retry-after[:=]\s*(\d+)/i);
  if (!match) return 0;
  return Number(match[1] || 0) * 1000;
}

export function createEntityRateLimiter(options = {}) {
  const listLimit = Math.max(1, Number(options.listPerMinute || 105));
  const writeLimit = Math.max(1, Number(options.writePerMinute || 38));
  const maxAttempts = Math.max(1, Number(options.maxAttempts || 4));
  const timestamps = { list: [], write: [] };
  const metrics = {
    list_requests: 0,
    write_requests: 0,
    rate_limit_retries: 0,
    retry_wait_ms: 0,
    max_queue_depth: 0,
    started_at: new Date().toISOString(),
  };

  async function waitForSlot(kind, limit) {
    const queue = timestamps[kind];
    while (true) {
      const cutoff = nowMs() - DEFAULT_WINDOW_MS;
      while (queue.length && queue[0] <= cutoff) queue.shift();
      metrics.max_queue_depth = Math.max(metrics.max_queue_depth, queue.length);
      if (queue.length < limit) {
        queue.push(nowMs());
        return;
      }
      await sleep(queue[0] + DEFAULT_WINDOW_MS - nowMs() + 75);
    }
  }

  async function run(kind, limit, fn, label = 'entity call') {
    let attempt = 0;
    while (true) {
      await waitForSlot(kind, limit);
      metrics[kind === 'list' ? 'list_requests' : 'write_requests'] += 1;
      try {
        return await fn();
      } catch (error) {
        if (!isRateLimitError(error) || attempt >= maxAttempts - 1) {
          error.rateLimitRetryExhausted = isRateLimitError(error);
          error.rateLimitLabel = label;
          error.rateLimitMetrics = snapshot();
          throw error;
        }
        attempt += 1;
        metrics.rate_limit_retries += 1;
        const retryMs = retryAfterMs(error);
        const backoffMs = Math.min(30000, 1000 * (2 ** attempt));
        const jitterMs = Math.floor(Math.random() * 750);
        const waitMs = Math.max(retryMs, backoffMs) + jitterMs;
        metrics.retry_wait_ms += waitMs;
        await sleep(waitMs);
      }
    }
  }

  function snapshot() {
    const elapsedMinutes = Math.max(1 / 60, (nowMs() - Date.parse(metrics.started_at)) / 60000);
    return {
      ...metrics,
      list_limit_per_minute: listLimit,
      write_limit_per_minute: writeLimit,
      list_requests_per_minute: Math.round((metrics.list_requests / elapsedMinutes) * 100) / 100,
      write_requests_per_minute: Math.round((metrics.write_requests / elapsedMinutes) * 100) / 100,
    };
  }

  return {
    list: (fn, label) => run('list', listLimit, fn, label),
    write: (fn, label) => run('write', writeLimit, fn, label),
    metrics: snapshot,
  };
}