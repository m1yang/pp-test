/** @typedef {import('./test.js').Spec} Spec */
/** @typedef {import('./types.js').HookType} HookType */
/** @typedef {import('./types.js').Config} Config */

import { suitesPool } from "./test.js";

const running = true;

/**
 * @param {string} id - The id of the tests
 */
export async function runTest(id) {
  // 如果使用worker_threads这一步则是require对应测试文件
  const suites = suitesPool.get(id);
  if (!suites) return;

  // 从第一个用例处获取所有的钩子函数
  const hooks = suites.hooks;
  const config = suites.config;
  const specs = suites._specs;

  await _runHooks(hooks, "beforeAll", config);
  for (const spec of specs) {
    await _runHooks(hooks, "beforeEach", config);
    await _runStage(_withTimeout(spec.fn, config.timeout), config.retries);
    await _runHooks(hooks, "afterEach", config);
  }
  await _runHooks(hooks, "afterAll", config);
}

/**
 * @private
 * @param {Array<HookType>} hooks - The suite object
 * @param {"beforeEach" | "afterEach" | "beforeAll" | "afterAll"} type - The type of hook
 * @param {Config} config - The config object
 */
async function _runHooks(hooks, type, config) {
  const funcs = hooks.filter((e) => e.type === type).map((e) => e.fn);
  if (!funcs.length) return;
  // if (type === "beforeEach") funcs.reverse();
  let error;
  for (const fn of funcs) {
    try {
      await _runStage(_withTimeout(fn, config.timeout), config.retries);
    } catch (e) {
      // Always run all the hooks, and capture the first error.
      error = error || e;
    }
  }
  if (error) throw error;
}

/**
 * 带有重试的函数包装器
 * @private
 * @param {Function} fn - 需要包装的函数
 * @param {number} [retries=1] - 重试次数
 */
async function _runStage(fn, retries = 1) {
  if (!running) {
    return;
  }
  try {
    await fn();
  } catch (err) {
    if (retries > 1) {
      await _runStage(fn, retries - 1); // 使用await确保递归调用等待完成
    } else {
      throw err;
    }
  }
}

/**
 * 带有超时的函数包装器
 * @private
 * @param {Function} fn 要执行的函数
 * @param {number} [timeout=30000] 超时时间（毫秒）
 * @returns {Function} 包装后的函数
 */
function _withTimeout(fn, timeout = 30000) {
  if (typeof fn !== "function") {
    throw new TypeError("The first argument must be a function.");
  }
  if (timeout <= 0 || timeout === Number.POSITIVE_INFINITY) {
    return fn;
  }

  /** @param {any[]} args  */
  return function (...args) {
    return Promise.race([
      fn(...args),
      new Promise((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timeout of ${timeout}ms exceeded.`));
        }, timeout);
        timer.unref?.();
      }),
    ]);
  };
}
