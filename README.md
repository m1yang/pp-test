# Explore testing frameworks

测试框架功能丰富，尝试简易实现并拓展其可用范围。在业务上测试流程基本上是：组织用例、执行用例、验证结果、生成报告，但是在代码实现方面会考虑到并行功能，需要对每个测试文件执行以上流程，所以在此之前需要有额外的任务调度功能。

注意：nodejs 在创建子进程的时候，传输的数据需要满足 `结构化克隆算法`，简单来说就是只能传输`js plain object`。测试用例带有函数，传输代价大，所以测试文件的读取需要放在子进程中。

以命令行为入口来分析整个代码流程：
  1. 加载配置，根据配置来判断以何种方式执行测试，即实现config和runner
  2. 读取用例文件列表，判断需要执行哪些任务，并以此创建调度中心，即实现dispatcher
  3. 调度中心创建子进程分派任务，子进程执行测试用例，收集结果，并返回给调度中心，即实现worker
  4. 子进程会加载测试文件，测试文件中需要实现对应函数以组织测试用例，即实现testSuite
  5. 调度中心收集子进程返回的结果，并生成报告（考虑TAP），即实现reporter

## 并行如何实现：

文件本身是一组测试，内部再根据函数分组。
各组之间可以并行，组内串行。
先收集测试数据，再执行测试步骤。
同一标题下的用例为一组，加入用例时计算标题 hash 值，值相同则用例归为同一组
更精准的做法应该是BeforeAll、AfterAll 函数一致则为同一组，但是这样在程序上难做判定
钩子函数不一定会在用例之前就设置好，且同一个钩子可能出现在不同的用例组内。所以在组织钩子函数时还不知道其下会影响哪些测试用例。

```js
test.suite("测试用例1，并行", () => {
  console.log('开始执行测试步骤，串行');
  test("测试步骤1", () => {
    console.log("1");
  })
  test("测试步骤2", () => {
    console.log("2");
  })
  test("测试步骤3", () => {
    console.log("3");
  })
});

test.suite("测试用例2，并行", () => {
  console.log('开始执行测试步骤，串行');
  test("测试步骤1", () => {
    console.log("1");
  })

  test.suite("用例内分组，并行", () => {
    test("测试步骤1", () => {
      console.log("1");
    })
  });
});
```

## 重试如何实现：

重试考虑2种情况：
  1. 执行时立即重试失败的步骤
  2. 执行完再重试失败的用例

测试用例单独配置，嵌套情况由内向外覆盖配置。

retries vitest直接循环遍历重试的次数，根据测试结果判断是否继续重试，通过则break。

```js
console.log('有默认的根测试组所以可以顶格设置配置');
test.config({
  retry: number,
  timeout: number,
  threads: number,
})

test.suite("测试用例单独配置", () => {
  test.config({
    retry: number
  })
});
```

## 报告如何实现：

```tap
1..4  # 测试计划，表示预计要运行4个测试用例

ok 1 - Test addition function with positive numbers # 测试通过，编号1，描述“测试正数的加法功能”

not ok 2 - Test subtraction function with negative result # 测试失败，编号2，描述“测试产生负数的减法功能”
# 诊断信息，可以包含失败的具体原因，如实际输出与预期不符等
# Failed test 'Test subtraction function with negative result'
# at line XYZ in file 'test_math_functions.py'
# Got: -5
# Expected: 5

ok 3 - Test multiplication function with zero # 测试通过，编号3，描述“测试用0进行乘法运算的功能”

skip 4 - Test division function with zero as divisor # 测试跳过，编号4，描述“测试除数为0的除法功能”（因为这个测试会导致错误或异常）
# 跳过原因：Division by zero is not allowed

# 测试结果统计可以手动添加，或者由解析TAP输出的工具自动生成
# 以下是一个可能的测试结果统计示例（通常不由测试框架直接输出，而是由外部工具处理生成）
# Passed: 2
# Failed: 1
# Skipped: 1
# Total: 4
```

## 开发计划
API实现重点在于测试标题和测试步骤
测试标题用于分组，并行执行，嵌套分类，子类下带步骤则为一条用例，用例才有配置等信息
测试步骤，串行执行，不能嵌套，功能单一，只有标题及函数

fixture 太重了，不考虑实现

通过hooks和测试运行时的信息可以构建测试插件

配置reporter、多线程、插件等功能待实现