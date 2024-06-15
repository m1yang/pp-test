/** @typedef {import('./testImpl.js').TestImpl} TestImpl */
/** @typedef {import('./types.js').HookType} HookType */
/** @typedef {import('./types.js').TestStatus} TestStatus */
/** @typedef {import('./types.js').Config} Config */

export class Spec {
  /**
   * @param {string} title
   * @param {Function} fn
   */
  constructor(title, fn) {
    /** @type {string} */
    this.title = title;

    /** @type {Function} */
    this.fn = fn;
  }
}

export class Suite {
  /**
   * @param {string} title
   */
  constructor(title) {
    /** @type {string} */
    this.title = title;

    /** @type {Suite| undefined} */
    this.parent = undefined;

    /** @type {Spec[]} */
    this._specs = [];

    /** @type {Array<HookType>} */
    this._hooks = [];

    /** @type {number=} */
    this._timeout = undefined;

    /** @type {number=} */
    this._retries = undefined;

    /** @type {Config} */
    this._config = {
      timeout: undefined,
      retries: undefined,
    };
  }

  /** @param {Suite} suite */
  _addSuite(suite) {
    suite.parent = this;
  }

  titlePath() {
    /** @type {string[]} */
    const titlePath = this.parent ? this.parent.titlePath() : [];
    if (this.title) titlePath.push(this.title);
    // titlePath().join('\x1e')
    // titlePath().slice(2).join(' ');
    // titlePath().slice(1).join(' › ');
    return titlePath;
  }

  get hooks() {
    /** @type {Array<HookType>} */
    const result = [];

    /** @param {Suite| undefined} suite */
    const visit = (suite) => {
      if (!suite) {
        return;
      }
      const hooks = suite._hooks;
      if (hooks.length > 0) {
        result.unshift(...hooks);
      }
      if (suite.parent) {
        visit(suite.parent);
      }
    };
    visit(this);
    return result;
  }

  /**
   * @returns {Config}, the full hierarchy of titles from root to this
   */
  get config() {
    // 如果当前Suite的_config对象中的_retries或_timeout未定义，
    // 则尝试从父Suite中获取，如果没有父Suite，则保持未定义。
    let retries =
      this._config.retries ||
      (this.parent ? this.parent.config.retries : undefined);
    let timeout =
      this._config.timeout ||
      (this.parent ? this.parent.config.timeout : undefined);

    // 创建一个新的对象来返回，以避免直接修改this._config
    const newConfig = {
      retries: retries,
      timeout: timeout,
    };

    return newConfig;
  }
}

/** @type {Map<string, Suite>} */
export const suitesPool = new Map();
