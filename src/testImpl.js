import pMap from "p-map";
import os from "node:os";

import { Spec, Suite } from "./test.js";
import { suitesPool } from "./test.js";
import { runTest } from "./worker.js";

/** @typedef {import('./types.js').TestType<any>} TestType */
/** @typedef {import('./types.js').HookType} HookType */

/**
 * @class 收集用例，将用例分类到测试套件或者测试用例中
 */
export class TestImpl {
  #currentSuite = new Suite("");
  get #currentlyLoadingSuite() {
    return this.#currentSuite;
  }
  /** @param {Suite} suite - currently loading suite. */
  set #currentlyLoadingSuite(suite) {
    this.#currentSuite = suite;
  }

  constructor() {
    /** @type {any} */
    const test = this._createTest.bind(this);
    test.suite = this._describe.bind(this);
    test.beforeEach = this._hook.bind(this, "beforeEach");
    test.afterEach = this._hook.bind(this, "afterEach");
    test.beforeAll = this._hook.bind(this, "beforeAll");
    test.afterAll = this._hook.bind(this, "afterAll");
    test.run = this._run.bind(this);
    test.suite.configure = this._configure.bind(this);
    /**
     * @readonly
     * @type {TestType}
     */
    this.test = test;
  }

  /**
   * Returns the current suite based on the provided title.
   * @private
   * @param {string} title - The title of the suite.
   * @returns {Suite} - The current suite or undefined if not found.
   * @throws {Error} - If the suite is called in an unexpected context.
   */
  _currentSuite(title) {
    const suite = this.#currentlyLoadingSuite;
    if (!suite) {
      throw new Error(
        [
          `Test did not expect ${title} to be called here.`,
          `Most common reasons include:`,
          `- You have two different versions of Test. This usually happens`,
          `  when one of the dependencies in your package.json depends on Test.`,
        ].join("\n")
      );
    }
    return suite;
  }

  /**
   * Create a test case.
   * @private
   * @param {string} title - The title of the test case.
   * @param {Function} fn - The function of the test case.
   */
  _createTest(title, fn) {
    const suite = this._currentSuite("test()");
    if (!suite) return;

    const spec = new Spec(title, fn);
    suite._specs.push(spec);

    const suiteId = suite.titlePath().join("");
    if (!suitesPool.has(suiteId)) {
      suitesPool.set(suiteId, suite);
    }
  }

  /**
   * 通过文本描述来分类，函数自嵌套来分组
   * 因为没有指令来创建文件级测试组，所以需要执行该函数时判断是否已存在上级测试组，
   * 如果没有则自行创建
   * @private
   * @param {Function|string} titleOrFn
   * @param {Function} [fn]
   */
  _describe(titleOrFn, fn) {
    const parentSuite = this._currentSuite(`test.describe()`);
    if (!parentSuite) return;

    if (typeof titleOrFn === "function") {
      fn = titleOrFn;
      titleOrFn = "";
    }

    const suite = new Suite(titleOrFn);
    parentSuite._addSuite(suite);

    this.#currentlyLoadingSuite = suite;
    fn && fn();
    this.#currentlyLoadingSuite = parentSuite;
  }

  /**
   * Private method to handle test hooks.
   * @private
   * @param {('beforeEach' | 'afterEach' | 'beforeAll' | 'afterAll')} name - The name of the hook.
   * @param {string | Function} title - The title of the hook or a function.
   * @param {Function} fn - The function to be executed as the hook.
   * @returns {void}
   */
  _hook(name, title, fn) {
    const suite = this._currentSuite(`test.${name}()`);
    if (!suite) return;
    if (typeof title === "function") {
      fn = title;
      title = `${name} hook`;
    }

    const hook = { type: name, title, fn };
    suite._hooks.push(hook);
  }

  /**
   * Private method to handle test hooks.
   * @private
   * @param {object} options
   * @param {number} [options.timeout]
   * @param {number} [options.retries]
   */
  _configure(options) {
    const suite = this._currentSuite(`test.describe.configure()`);
    if (!suite) return;

    if (options.timeout !== undefined) suite._config.timeout = options.timeout;

    if (options.retries !== undefined) suite._config.retries = options.retries;
  }

  async _run() {
    const numCpus = os.availableParallelism?.() ?? os.cpus().length;

    // worker_threads多线程下传文件地址
    await pMap(suitesPool.keys(), runTest, { concurrency: numCpus });
  }
}

export const rootTestType = new TestImpl();
