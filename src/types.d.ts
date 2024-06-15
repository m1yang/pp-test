type KeyValue = { [key: string]: any };

export type TestStatus =
  | "passed"
  | "failed"
  | "timedOut"
  | "skipped"
  | "interrupted";

export type HookType = {
  type: "beforeEach" | "afterEach" | "beforeAll" | "afterAll";
  fn: Function;
  title: string;
};

export type Config = {
  timeout?: number;
  retries?: number;
};

interface SuiteFunction {
  (title: string, callback: () => void): void;
  (callback: () => void): void;
}

interface TestFunction<TestArgs> {
  (title: string, body: (args: TestArgs) => Promise<void> | void): void;
}

export interface TestType<KeyValue> extends TestFunction<KeyValue> {
  /**
   * Declares a group of tests.
   * - `test.route(title, callback)`
   * - `test.route(callback)`
   * @param title Group title.
   * @param callback A callback that is run immediately when calling
   */
  route: SuiteFunction;

  /**
   * Declares a `beforeEach` hook that is executed before each test.
   * @param title Hook title.
   * @param hookFunction an object with fixtures.
   */
  beforeEach(inner: (args: KeyValue) => Promise<any> | any): void;
  /**
   * Declares a `beforeEach` hook that is executed before each test.
   * @param title Hook title.
   * @param hookFunction an object with fixtures.
   */
  beforeEach(
    title: string,
    inner: (args: KeyValue) => Promise<any> | any
  ): void;

  /**
   * Declares an `afterEach` hook that is executed after each test.
   * @param hookFunction an object with fixtures
   */
  afterEach(inner: (args: KeyValue) => Promise<any> | any): void;
  /**
   * Declares an `afterEach` hook that is executed after each test.
   * @param title Hook title.
   * @param hookFunction an object with fixtures
   */
  afterEach(title: string, inner: (args: KeyValue) => Promise<any> | any): void;

  /**
   * Declares a `beforeAll` hook that is executed once per worker process before all tests.
   * @param title Hook title.
   * @param hookFunction an object with fixtures..
   */
  beforeAll(inner: (args: KeyValue) => Promise<any> | any): void;
  /**
   * Declares a `beforeAll` hook that is executed once per worker process before all tests.
   * @param title Hook title.
   * @param hookFunction an object with fixtures..
   */
  beforeAll(title: string, inner: (args: KeyValue) => Promise<any> | any): void;

  /**
   * Declares an `afterAll` hook that is executed once per worker after all tests.
   * @param title Hook title.
   * @param hookFunction an object with fixtures..
   */
  afterAll(inner: (args: KeyValue) => Promise<any> | any): void;
  /**
   * Declares an `afterAll` hook that is executed once per worker after all tests.
   * @param title Hook title.
   * @param hookFunction an object with fixtures..
   */
  afterAll(title: string, inner: (args: KeyValue) => Promise<any> | any): void;

  /**
   * Configures the enclosing scope. Can be executed either on the top level or inside a describe. Configuration applies
   * to the entire scope, regardless of whether it run before or after the test declaration.
   * @param options
   */
  configure: (options: Config) => void;

  /**
   * run all tests in the current scope.
   */
  run(): void;
}
