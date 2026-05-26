export type ChallengeCategory = "handwrite" | "algorithm";

export type CodingChallenge = {
	id: string;
	title: string;
	category: ChallengeCategory;
	difficulty: 1 | 2 | 3;
	frequency: 1 | 2 | 3;
	timeLimit: number;
	description: string;
	skeleton: string;
	testCode: string;
};

export const codingChallenges: CodingChallenge[] = [
	{
		id: "debounce",
		title: "手写防抖 debounce",
		category: "handwrite",
		difficulty: 1,
		frequency: 3,
		timeLimit: 8,
		description:
			"事件触发后 delay 毫秒才执行，期间再次触发则重新计时。正确绑定 this 和参数。",
		skeleton: `function debounce(fn, delay = 300) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(debounce) {
  const results = [];
  let callCount = 0;
  let lastArgs = null;
  let lastThis = null;

  const obj = {
    name: 'test',
    fn: debounce(function (...args) {
      callCount++;
      lastArgs = args;
      lastThis = this;
    }, 50),
  };

  obj.fn(1);
  obj.fn(2);
  obj.fn(3);
  await __sleep__(100);
  __assert__(callCount === 1, '快速调用3次，只执行1次');
  __assert__(lastArgs[0] === 3, '参数应该是最后一次的参数 3');
  __assert__(lastThis === obj, 'this 应该指向 obj');

  callCount = 0;
  obj.fn('a');
  await __sleep__(100);
  obj.fn('b');
  await __sleep__(100);
  __assert__(callCount === 2, '间隔足够长时每次都执行');

  callCount = 0;
  obj.fn('x');
  await __sleep__(30);
  obj.fn('y');
  await __sleep__(30);
  obj.fn('z');
  await __sleep__(100);
  __assert__(callCount === 1, '重新计时后只执行最后一次');
  __assert__(lastArgs[0] === 'z', '参数应该是 z');
}`,
	},
	{
		id: "throttle",
		title: "手写节流 throttle",
		category: "handwrite",
		difficulty: 1,
		frequency: 2,
		timeLimit: 8,
		description:
			"规定时间内只执行一次（时间戳版：第一次立即执行）。正确绑定 this 和参数。",
		skeleton: `function throttle(fn, delay = 300) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(throttle) {
  let callCount = 0;
  let lastArgs = null;

  const throttled = throttle(function (...args) {
    callCount++;
    lastArgs = args;
  }, 50);

  throttled('first');
  __assert__(callCount === 1, '第一次应立即执行');
  __assert__(lastArgs[0] === 'first', '参数正确');

  throttled('ignored-1');
  throttled('ignored-2');
  __assert__(callCount === 1, 'delay 内重复调用应被忽略');

  await __sleep__(80);
  throttled('second');
  __assert__(callCount === 2, 'delay 后应可以再次执行');
  __assert__(lastArgs[0] === 'second', '参数是最新的');
}`,
	},
	{
		id: "deep-clone",
		title: "手写深拷贝 deepClone",
		category: "handwrite",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"支持对象、数组嵌套。处理循环引用（不能无限递归）。拷贝后修改不影响原对象。",
		skeleton: `function deepClone(obj, map = new WeakMap()) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(deepClone) {
  __assert__(deepClone(1) === 1, '数字');
  __assert__(deepClone('str') === 'str', '字符串');
  __assert__(deepClone(null) === null, 'null');
  __assert__(deepClone(undefined) === undefined, 'undefined');

  const obj = { a: 1, b: { c: 2 } };
  const cloned = deepClone(obj);
  __assert__(cloned !== obj, '应该是不同的引用');
  __assert__(cloned.b !== obj.b, '嵌套对象应该是不同的引用');
  __assert__(cloned.a === 1 && cloned.b.c === 2, '值应该相等');
  cloned.b.c = 999;
  __assert__(obj.b.c === 2, '修改克隆体不应影响原对象');

  const arr = [1, [2, 3], { x: 4 }];
  const clonedArr = deepClone(arr);
  __assert__(Array.isArray(clonedArr), '应该是数组');
  __assert__(clonedArr[1] !== arr[1], '嵌套数组应该是不同引用');

  const circular = { name: 'root' };
  circular.self = circular;
  const clonedCircular = deepClone(circular);
  __assert__(clonedCircular !== circular, '循环引用：应该是不同引用');
  __assert__(clonedCircular.self === clonedCircular, '循环引用应指向克隆体自身');
}`,
	},
	{
		id: "call-apply-bind",
		title: "手写 call / apply / bind",
		category: "handwrite",
		difficulty: 2,
		frequency: 3,
		timeLimit: 15,
		description:
			"myCall：立即执行，参数逐个传。myApply：立即执行，参数以数组传。myBind：返回新函数，支持 new 调用。",
		skeleton: `Function.prototype.myCall = function (ctx, ...args) {
  // 在这里写你的实现
};

Function.prototype.myApply = function (ctx, args = []) {
  // 在这里写你的实现
};

Function.prototype.myBind = function (ctx, ...outerArgs) {
  // 在这里写你的实现
};`,
		testCode: `async function __test__() {
  function greet(greeting, punctuation) {
    return greeting + ', ' + this.name + punctuation;
  }
  const alice = { name: 'Alice' };

  __assert__(greet.myCall(alice, 'Hello', '!') === 'Hello, Alice!', 'call 基本功能');
  __assert__(greet.myApply(alice, ['Hey', '~']) === 'Hey, Alice~', 'apply 基本功能');

  const bound = greet.myBind(alice, 'Yo');
  __assert__(typeof bound === 'function', 'bind 返回函数');
  __assert__(bound('?') === 'Yo, Alice?', 'bind 基本功能');

  const bound2 = greet.myBind(alice, 'Sup', '!!');
  __assert__(bound2() === 'Sup, Alice!!', 'bind 预填所有参数');

  function Person(name) { this.name = name; }
  const BoundPerson = Person.myBind({ name: 'ignored' });
  const p = new BoundPerson('Bob');
  __assert__(p.name === 'Bob', 'bind 后 new 调用应忽略绑定的 ctx');
}`,
	},
	{
		id: "promise",
		title: "手写 Promise（简版）",
		category: "handwrite",
		difficulty: 3,
		frequency: 2,
		timeLimit: 20,
		description:
			"三种状态 pending/fulfilled/rejected，状态不可逆。then 返回新 Promise（链式调用）。回调异步执行（微任务）。支持值穿透。",
		skeleton: `class MyPromise {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(MyPromise) {
  const v1 = await new MyPromise(resolve => resolve(42));
  __assert__(v1 === 42, '基本 resolve');

  try {
    await new MyPromise((_, reject) => reject('err'));
    __assert__(false, '应该 reject');
  } catch (e) {
    __assert__(e === 'err', '基本 reject');
  }

  const v3 = await new MyPromise(r => r(1))
    .then(v => v + 1)
    .then(v => v * 3);
  __assert__(v3 === 6, '链式调用 (1+1)*3 = 6');

  const v4 = await new MyPromise(r => setTimeout(() => r(10), 50));
  __assert__(v4 === 10, '异步 resolve');

  const v5 = await new MyPromise(r => r(1))
    .then(v => new MyPromise(r => r(v + 10)));
  __assert__(v5 === 11, 'then 返回 Promise 应自动展开');

  const v6 = await new MyPromise(r => r(99))
    .then(null)
    .then(v => v);
  __assert__(v6 === 99, '值穿透');

  try {
    await new MyPromise(() => { throw new Error('boom'); });
    __assert__(false, '应该 reject');
  } catch (e) {
    __assert__(e.message === 'boom', 'executor 异常应被 catch');
  }
}`,
	},
	{
		id: "promise-all",
		title: "手写 Promise.all",
		category: "handwrite",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"所有 Promise 都成功则 resolve 结果数组（顺序和输入一致）。任一失败则 reject 第一个错误。支持非 Promise 值。空数组直接 resolve []。",
		skeleton: `function promiseAll(promises) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(promiseAll) {
  const r1 = await promiseAll([
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3),
  ]);
  __assert__(JSON.stringify(r1) === '[1,2,3]', '全部成功');

  const r2 = await promiseAll([
    new Promise(r => setTimeout(() => r('slow'), 50)),
    new Promise(r => setTimeout(() => r('fast'), 10)),
  ]);
  __assert__(r2[0] === 'slow' && r2[1] === 'fast', '顺序应和输入一致');

  try {
    await promiseAll([
      Promise.resolve(1),
      Promise.reject('err'),
      Promise.resolve(3),
    ]);
    __assert__(false, '应该 reject');
  } catch (e) {
    __assert__(e === 'err', '应该返回第一个错误');
  }

  const r4 = await promiseAll([]);
  __assert__(JSON.stringify(r4) === '[]', '空数组应返回 []');

  const r5 = await promiseAll([1, 'str', true, Promise.resolve(42)]);
  __assert__(JSON.stringify(r5) === '[1,"str",true,42]', '支持非 Promise 值');
}`,
	},
	{
		id: "lru-cache",
		title: "手写 LRU Cache",
		category: "handwrite",
		difficulty: 3,
		frequency: 2,
		timeLimit: 12,
		description:
			"get(key)：命中返回值并刷新为最近使用，未命中返回 -1。put(key, value)：插入/更新，超容量时淘汰最久未使用的。get 和 put 都是 O(1)。",
		skeleton: `class LRUCache {
  constructor(capacity) {
    // 在这里写你的实现
  }

  get(key) {
    // 在这里写你的实现
  }

  put(key, value) {
    // 在这里写你的实现
  }
}`,
		testCode: `async function __test__(LRUCache) {
  const cache = new LRUCache(2);
  cache.put(1, 1);
  cache.put(2, 2);
  __assert__(cache.get(1) === 1, 'get(1) = 1');
  cache.put(3, 3);
  __assert__(cache.get(2) === -1, 'key=2 已被淘汰');
  cache.put(4, 4);
  __assert__(cache.get(1) === -1, 'key=1 已被淘汰');
  __assert__(cache.get(3) === 3, 'get(3) = 3');
  __assert__(cache.get(4) === 4, 'get(4) = 4');

  const cache2 = new LRUCache(1);
  cache2.put(1, 10);
  __assert__(cache2.get(1) === 10, '容量为1: get');
  cache2.put(2, 20);
  __assert__(cache2.get(1) === -1, '容量为1: 旧值被淘汰');

  const cache3 = new LRUCache(2);
  cache3.put(1, 1);
  cache3.put(2, 2);
  cache3.put(1, 10);
  __assert__(cache3.get(1) === 10, '更新后值应该变');
  cache3.put(3, 3);
  __assert__(cache3.get(2) === -1, '更新会刷新顺序，淘汰的是 key=2');
}`,
	},
	{
		id: "my-new",
		title: "手写 new 操作符",
		category: "handwrite",
		difficulty: 1,
		frequency: 1,
		timeLimit: 5,
		description:
			"创建新对象，原型指向构造函数的 prototype。执行构造函数，this 指向新对象。构造函数返回对象则用那个对象，否则用新对象。",
		skeleton: `function myNew(ctor, ...args) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(myNew) {
  function Person(name, age) {
    this.name = name;
    this.age = age;
  }
  Person.prototype.greet = function () { return 'Hi, ' + this.name; };

  const p = myNew(Person, 'Alice', 25);
  __assert__(p.name === 'Alice', '属性 name');
  __assert__(p.age === 25, '属性 age');
  __assert__(p.greet() === 'Hi, Alice', '原型方法可用');
  __assert__(p instanceof Person, 'instanceof 检查');

  function Wrapper() { return { custom: true }; }
  const w = myNew(Wrapper);
  __assert__(w.custom === true, '构造函数返回对象时应使用该对象');

  function Num() { this.val = 42; return 100; }
  const n = myNew(Num);
  __assert__(n.val === 42, '返回非对象时应忽略返回值');
}`,
	},
	{
		id: "event-emitter",
		title: "手写 EventEmitter",
		category: "handwrite",
		difficulty: 2,
		frequency: 1,
		timeLimit: 10,
		description:
			"on(event, fn)：订阅。emit(event, ...args)：发布。off(event, fn)：取消订阅。once(event, fn)：只订阅一次。",
		skeleton: `class EventEmitter {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(EventEmitter) {
  const ee = new EventEmitter();

  let result = [];
  ee.on('data', (v) => result.push(v));
  ee.emit('data', 1);
  ee.emit('data', 2);
  __assert__(JSON.stringify(result) === '[1,2]', 'on + emit 基本功能');

  let a = 0, b = 0;
  const fnA = () => a++;
  const fnB = () => b++;
  ee.on('tick', fnA);
  ee.on('tick', fnB);
  ee.emit('tick');
  __assert__(a === 1 && b === 1, '多个监听器都执行');

  ee.off('tick', fnA);
  ee.emit('tick');
  __assert__(a === 1 && b === 2, 'off 后不再执行');

  let onceCount = 0;
  ee.once('once-event', () => onceCount++);
  ee.emit('once-event');
  ee.emit('once-event');
  __assert__(onceCount === 1, 'once 只执行一次');

  ee.emit('nonexistent', 1, 2, 3);
  __assert__(true, 'emit 不存在的事件不崩溃');
}`,
	},
	{
		id: "promise-pool",
		title: "手写 Promise 并发控制",
		category: "handwrite",
		difficulty: 3,
		frequency: 2,
		timeLimit: 12,
		description:
			"tasks 是函数数组（每个返回 Promise）。最多同时执行 limit 个。全部完成后 resolve 结果数组（顺序和 tasks 一致）。",
		skeleton: `function promisePool(tasks, limit) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(promisePool) {
  const tasks1 = [
    () => __sleep__(30).then(() => 'a'),
    () => __sleep__(10).then(() => 'b'),
    () => __sleep__(20).then(() => 'c'),
  ];
  const r1 = await promisePool(tasks1, 2);
  __assert__(JSON.stringify(r1) === '["a","b","c"]', '结果顺序和 tasks 一致');

  let running = 0, maxRunning = 0;
  const tasks2 = Array.from({ length: 6 }, (_, i) => () => {
    running++;
    maxRunning = Math.max(maxRunning, running);
    return __sleep__(20).then(() => { running--; return i; });
  });
  await promisePool(tasks2, 3);
  __assert__(maxRunning <= 3, '最大并发应 <= 3，实际 ' + maxRunning);

  const r3 = await promisePool([], 5);
  __assert__(JSON.stringify(r3) === '[]', '空数组应返回 []');
}`,
	},
	{
		id: "curry",
		title: "手写柯里化 curry",
		category: "handwrite",
		difficulty: 2,
		frequency: 2,
		timeLimit: 8,
		description:
			"curry(fn) 返回柯里化后的函数。参数够了就执行原函数，不够就返回新函数继续收集。支持一次传多个参数。",
		skeleton: `function curry(fn) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(curry) {
  const add = (a, b, c) => a + b + c;
  const curriedAdd = curry(add);

  __assert__(curriedAdd(1)(2)(3) === 6, '逐个传参');
  __assert__(curriedAdd(1, 2)(3) === 6, '先传2个再传1个');
  __assert__(curriedAdd(1)(2, 3) === 6, '先传1个再传2个');
  __assert__(curriedAdd(1, 2, 3) === 6, '一次传完');

  const add10 = curriedAdd(10);
  __assert__(add10(20)(30) === 60, '偏函数复用 1');
  __assert__(add10(1)(2) === 13, '偏函数复用 2');

  const multiply = (a, b) => a * b;
  const curriedMul = curry(multiply);
  __assert__(curriedMul(3)(4) === 12, '不同函数');
}`,
	},
	{
		id: "flatten",
		title: "手写数组扁平化 flatten",
		category: "handwrite",
		difficulty: 1,
		frequency: 1,
		timeLimit: 8,
		description:
			"flatten(arr)：完全展平（无限深度）。flattenDepth(arr, depth)：展平指定深度。",
		skeleton: `function flatten(arr) {
  // 在这里写你的实现
}

function flattenDepth(arr, depth = 1) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(flatten, flattenDepth) {
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  __assert__(eq(flatten([1, 2, 3]), [1, 2, 3]), '已经是平的');
  __assert__(eq(flatten([1, [2, 3]]), [1, 2, 3]), '一层嵌套');
  __assert__(eq(flatten([1, [2, [3, [4]]]]), [1, 2, 3, 4]), '多层嵌套');
  __assert__(eq(flatten([]), []), '空数组');

  __assert__(eq(flattenDepth([1, [2, [3, [4]]]], 0), [1, [2, [3, [4]]]]), 'depth=0 不展平');
  __assert__(eq(flattenDepth([1, [2, [3, [4]]]], 1), [1, 2, [3, [4]]]), 'depth=1');
  __assert__(eq(flattenDepth([1, [2, [3, [4]]]], 2), [1, 2, 3, [4]]), 'depth=2');
}`,
	},
	{
		id: "instanceof",
		title: "手写 instanceof",
		category: "handwrite",
		difficulty: 1,
		frequency: 1,
		timeLimit: 5,
		description:
			"沿着 __proto__ 原型链向上查找。找到 ctor.prototype 返回 true，到 null 返回 false。",
		skeleton: `function myInstanceof(obj, ctor) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(myInstanceof) {
  __assert__(myInstanceof([], Array) === true, '[] instanceof Array');
  __assert__(myInstanceof([], Object) === true, '[] instanceof Object');
  __assert__(myInstanceof({}, Array) === false, '{} instanceof Array');
  __assert__(myInstanceof('str', String) === false, '基本类型不是实例');
  __assert__(myInstanceof(new String('str'), String) === true, '包装对象是实例');

  function Animal() {}
  function Dog() {}
  Dog.prototype = Object.create(Animal.prototype);
  const d = new Dog();
  __assert__(myInstanceof(d, Dog) === true, 'Dog 实例');
  __assert__(myInstanceof(d, Animal) === true, '继承链上也是 true');
  __assert__(myInstanceof(d, Array) === false, '不相关的构造函数');

	__assert__(myInstanceof(null, Object) === false, 'null 不是 Object 的实例');
}`,
	},
	{
		id: "promise-race",
		title: "手写 Promise.race",
		category: "handwrite",
		difficulty: 1,
		frequency: 2,
		timeLimit: 5,
		description:
			"返回一个 Promise，第一个 settled（无论 resolve 还是 reject）的结果作为最终结果。",
		skeleton: `function promiseRace(promises) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(promiseRace) {
  const r1 = await promiseRace([
    new Promise(r => setTimeout(() => r('slow'), 100)),
    new Promise(r => setTimeout(() => r('fast'), 10)),
  ]);
  __assert__(r1 === 'fast', '应返回最先 resolve 的值');

  try {
    await promiseRace([
      new Promise((_, rej) => setTimeout(() => rej('err'), 10)),
      new Promise(r => setTimeout(() => r('ok'), 100)),
    ]);
    __assert__(false, '应 reject');
  } catch (e) {
    __assert__(e === 'err', '应返回最先 reject 的值');
  }

  const r3 = await promiseRace([Promise.resolve(42)]);
  __assert__(r3 === 42, '单个元素');
}`,
	},
	{
		id: "promise-allsettled",
		title: "手写 Promise.allSettled",
		category: "handwrite",
		difficulty: 2,
		frequency: 1,
		timeLimit: 8,
		description:
			"等所有 Promise 都 settled，返回 [{status, value/reason}] 数组，永远 resolve。",
		skeleton: `function promiseAllSettled(promises) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(promiseAllSettled) {
  const r = await promiseAllSettled([
    Promise.resolve(1),
    Promise.reject('err'),
    Promise.resolve(3),
  ]);
  __assert__(r.length === 3, '长度为 3');
  __assert__(r[0].status === 'fulfilled' && r[0].value === 1, '第一个 fulfilled');
  __assert__(r[1].status === 'rejected' && r[1].reason === 'err', '第二个 rejected');
  __assert__(r[2].status === 'fulfilled' && r[2].value === 3, '第三个 fulfilled');

  const empty = await promiseAllSettled([]);
  __assert__(empty.length === 0, '空数组');
}`,
	},
	{
		id: "array-unique",
		title: "数组去重 unique",
		category: "handwrite",
		difficulty: 1,
		frequency: 2,
		timeLimit: 5,
		description:
			"实现数组去重函数。要求保持首次出现顺序，支持基本类型和 NaN。",
		skeleton: `function unique(arr) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(unique) {
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  __assert__(eq(unique([1, 2, 2, 3, 3, 3]), [1, 2, 3]), '基本去重');
  __assert__(eq(unique([1, '1', true, 'true']), [1, '1', true, 'true']), '类型不同不去重');
  __assert__(eq(unique([]), []), '空数组');

  const r = unique([NaN, NaN, 1]);
  __assert__(r.length === 2, 'NaN 去重');
  __assert__(Number.isNaN(r[0]), 'NaN 保留');
}`,
	},
	{
		id: "object-create",
		title: "手写 Object.create",
		category: "handwrite",
		difficulty: 1,
		frequency: 1,
		timeLimit: 5,
		description:
			"创建一个新对象，使用现有的对象来作为新创建对象的 __proto__。",
		skeleton: `function myObjectCreate(proto) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(myObjectCreate) {
  const parent = { greet() { return 'hello'; } };
  const child = myObjectCreate(parent);
  __assert__(child.greet() === 'hello', '继承方法');
  __assert__(child !== parent, '不同引用');
  __assert__(Object.getPrototypeOf(child) === parent, '原型正确');

  const nullProto = myObjectCreate(null);
  __assert__(Object.getPrototypeOf(nullProto) === null, 'null 原型');
}`,
	},
	{
		id: "template-render",
		title: "模板字符串解析 render",
		category: "handwrite",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"实现 render(template, data)，将 '{{name}}' 形式的占位符替换为 data 中对应的值，支持嵌套路径如 '{{a.b}}'。",
		skeleton: `function render(template, data) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(render) {
  __assert__(render('Hello, {{name}}!', { name: 'Alice' }) === 'Hello, Alice!', '基本替换');
  __assert__(render('{{a.b.c}}', { a: { b: { c: 42 } } }) === '42', '嵌套路径');
  __assert__(render('{{x}} and {{y}}', { x: 1, y: 2 }) === '1 and 2', '多个占位符');
  __assert__(render('no placeholders', {}) === 'no placeholders', '无占位符');
  __assert__(render('{{missing}}', {}) === '', '缺失 key 返回空');
}`,
	},
	{
		id: "add-big-number",
		title: "大数相加 addBigNumber",
		category: "handwrite",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"两个用字符串表示的非负整数相加，返回字符串结果。不能用 BigInt。",
		skeleton: `function addBigNumber(a, b) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(addBigNumber) {
  __assert__(addBigNumber('0', '0') === '0', '0+0');
  __assert__(addBigNumber('123', '456') === '579', '无进位');
  __assert__(addBigNumber('999', '1') === '1000', '连续进位');
  __assert__(addBigNumber('1', '999') === '1000', '短+长');
  __assert__(addBigNumber('99999999999999999999', '1') === '100000000000000000000', '超大数');
}`,
	},
	{
		id: "json-stringify",
		title: "手写 JSON.stringify（简版）",
		category: "handwrite",
		difficulty: 2,
		frequency: 1,
		timeLimit: 12,
		description:
			"实现简版 JSON.stringify，支持 string/number/boolean/null/array/object。忽略 undefined/function/symbol。",
		skeleton: `function myStringify(value) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(myStringify) {
  __assert__(myStringify(42) === '42', '数字');
  __assert__(myStringify('hello') === '"hello"', '字符串');
  __assert__(myStringify(true) === 'true', '布尔');
  __assert__(myStringify(null) === 'null', 'null');
  __assert__(myStringify([1, 2, 3]) === '[1,2,3]', '数组');
  __assert__(myStringify({ a: 1, b: "x" }) === '{"a":1,"b":"x"}', '对象');
  __assert__(myStringify({ a: undefined, b: 1 }) === '{"b":1}', '忽略 undefined');
  __assert__(myStringify([1, undefined, 3]) === '[1,null,3]', '数组中 undefined 变 null');
}`,
	},
	{
		id: "my-reduce",
		title: "手写 Array.prototype.reduce",
		category: "handwrite",
		difficulty: 2,
		frequency: 1,
		timeLimit: 8,
		description:
			"在 Array.prototype 上实现 myReduce，行为与原生 reduce 一致。无初始值时用数组第一个元素。空数组无初始值应抛错。",
		skeleton: `Array.prototype.myReduce = function (fn, initialValue) {
  // 在这里写你的实现
};`,
		testCode: `async function __test__() {
  __assert__([1, 2, 3].myReduce((acc, v) => acc + v, 0) === 6, '有初始值求和');
  __assert__([1, 2, 3].myReduce((acc, v) => acc + v) === 6, '无初始值求和');
  __assert__([5].myReduce((acc, v) => acc + v) === 5, '单元素无初始值');

  let error = false;
  try { [].myReduce((a, b) => a + b); } catch { error = true; }
  __assert__(error, '空数组无初始值应抛错');

  const indices = [];
  [10, 20, 30].myReduce((acc, v, i) => { indices.push(i); return acc; }, 0);
  __assert__(JSON.stringify(indices) === '[0,1,2]', '索引参数正确');
}`,
	},
	{
		id: "promise-retry",
		title: "手写 Promise.retry 失败重试",
		category: "handwrite",
		difficulty: 2,
		frequency: 2,
		timeLimit: 8,
		description:
			"实现 retry(fn, times)，fn 返回 Promise。失败后最多重试 times 次，全部失败则 reject 最后一个错误。",
		skeleton: `function retry(fn, times) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(retry) {
  let count = 0;
  const failTwice = () => new Promise((res, rej) => {
    count++;
    count <= 2 ? rej('fail-' + count) : res('ok');
  });

  count = 0;
  const r = await retry(failTwice, 3);
  __assert__(r === 'ok', '重试后成功');
  __assert__(count === 3, '调用了 3 次');

  count = 0;
  try {
    await retry(failTwice, 1);
    __assert__(false, '应失败');
  } catch (e) {
    __assert__(e === 'fail-1', '重试次数用完后 reject');
  }

  const r2 = await retry(() => Promise.resolve(42), 5);
  __assert__(r2 === 42, '首次成功不重试');
}`,
	},
	{
		id: "async-serial",
		title: "手写异步串行 asyncSerial",
		category: "handwrite",
		difficulty: 2,
		frequency: 1,
		timeLimit: 8,
		description:
			"依次执行 Promise 工厂函数数组，前一个完成后再执行下一个，最终返回所有结果的数组。",
		skeleton: `function asyncSerial(tasks) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(asyncSerial) {
  const order = [];
  const tasks = [
    () => __sleep__(30).then(() => { order.push(1); return 'a'; }),
    () => __sleep__(10).then(() => { order.push(2); return 'b'; }),
    () => __sleep__(20).then(() => { order.push(3); return 'c'; }),
  ];
  const r = await asyncSerial(tasks);
  __assert__(JSON.stringify(r) === '["a","b","c"]', '结果正确');
  __assert__(JSON.stringify(order) === '[1,2,3]', '严格串行执行');

  const empty = await asyncSerial([]);
  __assert__(JSON.stringify(empty) === '[]', '空数组');
}`,
	},
	{
		id: "object-assign",
		title: "手写 Object.assign",
		category: "handwrite",
		difficulty: 1,
		frequency: 1,
		timeLimit: 5,
		description:
			"实现 myAssign(target, ...sources)，将所有源对象的可枚举自有属性复制到目标对象并返回。",
		skeleton: `function myAssign(target, ...sources) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(myAssign) {
  const t1 = { a: 1 };
  const r1 = myAssign(t1, { b: 2 }, { c: 3 });
  __assert__(r1 === t1, '返回 target');
  __assert__(t1.a === 1 && t1.b === 2 && t1.c === 3, '属性合并');

  const t2 = { x: 1 };
  myAssign(t2, { x: 2 });
  __assert__(t2.x === 2, '后面覆盖前面');

  const t3 = {};
  myAssign(t3, { a: 1 }, null, undefined, { b: 2 });
  __assert__(t3.a === 1 && t3.b === 2, '跳过 null/undefined');
}`,
	},
	{
		id: "my-map",
		title: "手写 Array.prototype.map",
		category: "handwrite",
		difficulty: 1,
		frequency: 1,
		timeLimit: 5,
		description:
			"在 Array.prototype 上实现 myMap，回调接收 (item, index, array) 三个参数。",
		skeleton: `Array.prototype.myMap = function (fn) {
  // 在这里写你的实现
};`,
		testCode: `async function __test__() {
  __assert__(JSON.stringify([1, 2, 3].myMap(x => x * 2)) === '[2,4,6]', '基本映射');
  __assert__(JSON.stringify([].myMap(x => x)) === '[]', '空数组');

  const indices = [];
  ['a', 'b'].myMap((_, i) => indices.push(i));
  __assert__(JSON.stringify(indices) === '[0,1]', '索引参数');

  const arr = [1, 2];
  const result = arr.myMap(function(v) { return this; }, 'ctx');
  __assert__(arr.myMap(x => x + 1).length === 2, '不修改原数组');
}`,
	},
	{
		id: "two-sum",
		title: "两数之和 (LeetCode 1)",
		category: "algorithm",
		difficulty: 1,
		frequency: 3,
		timeLimit: 8,
		description:
			"给定整数数组 nums 和目标值 target，找出和为 target 的两个数的下标。假设每个输入恰好有一个解，同一元素不能重复使用。",
		skeleton: `function twoSum(nums, target) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(twoSum) {
  const r1 = twoSum([2, 7, 11, 15], 9);
  __assert__(r1.includes(0) && r1.includes(1), '[2,7,11,15] target=9 => [0,1]');
  const r2 = twoSum([3, 2, 4], 6);
  __assert__(r2.includes(1) && r2.includes(2), '[3,2,4] target=6 => [1,2]');
  const r3 = twoSum([3, 3], 6);
  __assert__(r3.includes(0) && r3.includes(1), '[3,3] target=6 => [0,1]');
}`,
	},
	{
		id: "valid-parentheses",
		title: "有效括号 (LeetCode 20)",
		category: "algorithm",
		difficulty: 1,
		frequency: 3,
		timeLimit: 8,
		description:
			"给定只包含 '(', ')', '{', '}', '[', ']' 的字符串，判断是否有效。有效条件：左括号必须用相同类型的右括号闭合，且按正确顺序闭合。",
		skeleton: `function isValid(s) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(isValid) {
  __assert__(isValid('()') === true, '()');
  __assert__(isValid('()[]{}') === true, '()[]{}');
  __assert__(isValid('(]') === false, '(]');
  __assert__(isValid('([)]') === false, '([)]');
  __assert__(isValid('{[]}') === true, '{[]}');
  __assert__(isValid('') === true, '空字符串');
  __assert__(isValid('(') === false, '单个左括号');
}`,
	},
	{
		id: "max-subarray",
		title: "最大子数组和 (LeetCode 53)",
		category: "algorithm",
		difficulty: 2,
		frequency: 3,
		timeLimit: 10,
		description:
			"给定整数数组 nums，找到具有最大和的连续子数组（至少包含一个元素），返回其最大和。",
		skeleton: `function maxSubArray(nums) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(maxSubArray) {
  __assert__(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]) === 6, '标准用例 => 6');
  __assert__(maxSubArray([1]) === 1, '单元素');
  __assert__(maxSubArray([5,4,-1,7,8]) === 23, '全正 => 23');
  __assert__(maxSubArray([-1]) === -1, '单个负数');
  __assert__(maxSubArray([-2, -1]) === -1, '全负取最大');
}`,
	},
	{
		id: "climb-stairs",
		title: "爬楼梯 (LeetCode 70)",
		category: "algorithm",
		difficulty: 1,
		frequency: 3,
		timeLimit: 5,
		description:
			"每次可以爬 1 或 2 个台阶，到达第 n 阶有多少种不同的方法？",
		skeleton: `function climbStairs(n) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(climbStairs) {
  __assert__(climbStairs(1) === 1, 'n=1');
  __assert__(climbStairs(2) === 2, 'n=2');
  __assert__(climbStairs(3) === 3, 'n=3');
  __assert__(climbStairs(5) === 8, 'n=5');
  __assert__(climbStairs(10) === 89, 'n=10');
}`,
	},
	{
		id: "reverse-linked-list",
		title: "反转链表 (LeetCode 206)",
		category: "algorithm",
		difficulty: 1,
		frequency: 3,
		timeLimit: 8,
		description:
			"反转单链表。链表节点用 {val, next} 表示。",
		skeleton: `function reverseList(head) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(reverseList) {
  function toArr(h) { const r = []; while (h) { r.push(h.val); h = h.next; } return r; }
  function fromArr(a) { let h = null; for (let i = a.length - 1; i >= 0; i--) h = { val: a[i], next: h }; return h; }

  __assert__(JSON.stringify(toArr(reverseList(fromArr([1,2,3,4,5])))) === '[5,4,3,2,1]', '反转 [1,2,3,4,5]');
  __assert__(JSON.stringify(toArr(reverseList(fromArr([1,2])))) === '[2,1]', '反转 [1,2]');
  __assert__(reverseList(null) === null, '空链表');
  __assert__(toArr(reverseList(fromArr([1])))[0] === 1, '单节点');
}`,
	},
	{
		id: "max-depth-binary-tree",
		title: "二叉树最大深度 (LeetCode 104)",
		category: "algorithm",
		difficulty: 1,
		frequency: 2,
		timeLimit: 5,
		description:
			"给定二叉树 {val, left, right}，返回其最大深度。",
		skeleton: `function maxDepth(root) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(maxDepth) {
  __assert__(maxDepth(null) === 0, '空树');
  __assert__(maxDepth({ val: 1, left: null, right: null }) === 1, '单节点');
  __assert__(maxDepth({
    val: 3,
    left: { val: 9, left: null, right: null },
    right: { val: 20, left: { val: 15, left: null, right: null }, right: { val: 7, left: null, right: null } }
  }) === 3, '标准用例 => 3');
}`,
	},
	{
		id: "invert-binary-tree",
		title: "翻转二叉树 (LeetCode 226)",
		category: "algorithm",
		difficulty: 1,
		frequency: 2,
		timeLimit: 5,
		description:
			"翻转二叉树（左右子树互换，递归处理）。",
		skeleton: `function invertTree(root) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(invertTree) {
  __assert__(invertTree(null) === null, '空树');

  const tree = {
    val: 4,
    left: { val: 2, left: { val: 1, left: null, right: null }, right: { val: 3, left: null, right: null } },
    right: { val: 7, left: { val: 6, left: null, right: null }, right: { val: 9, left: null, right: null } },
  };
  const inv = invertTree(tree);
  __assert__(inv.left.val === 7, '左子变为原右子');
  __assert__(inv.right.val === 2, '右子变为原左子');
  __assert__(inv.left.left.val === 9, '递归翻转');
}`,
	},
	{
		id: "binary-tree-level-order",
		title: "二叉树层序遍历 (LeetCode 102)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"给定二叉树，返回按层遍历的节点值（逐层从左到右），结果为二维数组。",
		skeleton: `function levelOrder(root) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(levelOrder) {
  __assert__(JSON.stringify(levelOrder(null)) === '[]', '空树');

  const tree = {
    val: 3,
    left: { val: 9, left: null, right: null },
    right: { val: 20, left: { val: 15, left: null, right: null }, right: { val: 7, left: null, right: null } },
  };
  __assert__(JSON.stringify(levelOrder(tree)) === '[[3],[9,20],[15,7]]', '标准用例');
  __assert__(JSON.stringify(levelOrder({ val: 1, left: null, right: null })) === '[[1]]', '单节点');
}`,
	},
	{
		id: "longest-substring-no-repeat",
		title: "无重复字符的最长子串 (LeetCode 3)",
		category: "algorithm",
		difficulty: 2,
		frequency: 3,
		timeLimit: 10,
		description:
			"给定字符串 s，找出其中不含有重复字符的最长子串的长度。",
		skeleton: `function lengthOfLongestSubstring(s) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(lengthOfLongestSubstring) {
  __assert__(lengthOfLongestSubstring('abcabcbb') === 3, 'abcabcbb => 3');
  __assert__(lengthOfLongestSubstring('bbbbb') === 1, 'bbbbb => 1');
  __assert__(lengthOfLongestSubstring('pwwkew') === 3, 'pwwkew => 3');
  __assert__(lengthOfLongestSubstring('') === 0, '空字符串');
  __assert__(lengthOfLongestSubstring('abcdef') === 6, '无重复');
}`,
	},
	{
		id: "move-zeroes",
		title: "移动零 (LeetCode 283)",
		category: "algorithm",
		difficulty: 1,
		frequency: 2,
		timeLimit: 5,
		description:
			"将数组中所有 0 移动到末尾，保持非零元素的相对顺序。必须原地操作。返回修改后的数组。",
		skeleton: `function moveZeroes(nums) {
  // 在这里写你的实现
  return nums;
}`,
		testCode: `async function __test__(moveZeroes) {
  __assert__(JSON.stringify(moveZeroes([0,1,0,3,12])) === '[1,3,12,0,0]', '标准用例');
  __assert__(JSON.stringify(moveZeroes([0])) === '[0]', '单个零');
  __assert__(JSON.stringify(moveZeroes([1, 2, 3])) === '[1,2,3]', '无零');
  __assert__(JSON.stringify(moveZeroes([0, 0, 0])) === '[0,0,0]', '全零');
}`,
	},
	{
		id: "merge-sorted-arrays",
		title: "合并两个有序数组 (LeetCode 88)",
		category: "algorithm",
		difficulty: 1,
		frequency: 2,
		timeLimit: 8,
		description:
			"给定两个有序整数数组 nums1 和 nums2，将 nums2 合并到 nums1 中，使 nums1 成为一个有序数组。简化版：返回合并后的新数组。",
		skeleton: `function mergeSorted(nums1, nums2) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(mergeSorted) {
  __assert__(JSON.stringify(mergeSorted([1,3,5], [2,4,6])) === '[1,2,3,4,5,6]', '交替合并');
  __assert__(JSON.stringify(mergeSorted([], [1,2])) === '[1,2]', '空+非空');
  __assert__(JSON.stringify(mergeSorted([1,2], [])) === '[1,2]', '非空+空');
  __assert__(JSON.stringify(mergeSorted([], [])) === '[]', '双空');
  __assert__(JSON.stringify(mergeSorted([1,1,1], [1,1])) === '[1,1,1,1,1]', '重复元素');
}`,
	},
	{
		id: "binary-search",
		title: "二分查找 (LeetCode 704)",
		category: "algorithm",
		difficulty: 1,
		frequency: 2,
		timeLimit: 5,
		description:
			"给定有序数组 nums 和目标值 target，返回 target 在数组中的下标，不存在返回 -1。",
		skeleton: `function binarySearch(nums, target) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(binarySearch) {
  __assert__(binarySearch([-1,0,3,5,9,12], 9) === 4, '找到 9');
  __assert__(binarySearch([-1,0,3,5,9,12], 2) === -1, '找不到 2');
  __assert__(binarySearch([1], 1) === 0, '单元素找到');
  __assert__(binarySearch([1], 0) === -1, '单元素找不到');
  __assert__(binarySearch([], 1) === -1, '空数组');
}`,
	},
	{
		id: "merge-linked-lists",
		title: "合并两个有序链表 (LeetCode 21)",
		category: "algorithm",
		difficulty: 1,
		frequency: 2,
		timeLimit: 8,
		description:
			"将两个升序链表合并为一个新的升序链表并返回。链表节点用 {val, next} 表示。",
		skeleton: `function mergeTwoLists(l1, l2) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(mergeTwoLists) {
  function toArr(h) { const r = []; while (h) { r.push(h.val); h = h.next; } return r; }
  function fromArr(a) { let h = null; for (let i = a.length - 1; i >= 0; i--) h = { val: a[i], next: h }; return h; }

  __assert__(JSON.stringify(toArr(mergeTwoLists(fromArr([1,2,4]), fromArr([1,3,4])))) === '[1,1,2,3,4,4]', '标准用例');
  __assert__(mergeTwoLists(null, null) === null, '双空');
  __assert__(JSON.stringify(toArr(mergeTwoLists(null, fromArr([1])))) === '[1]', '一空一非空');
}`,
	},
	{
		id: "coin-change",
		title: "零钱兑换 (LeetCode 322)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"给定不同面额的硬币 coins 和总金额 amount，计算凑成总金额所需的最少硬币个数。无法凑出返回 -1。",
		skeleton: `function coinChange(coins, amount) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(coinChange) {
  __assert__(coinChange([1, 2, 5], 11) === 3, '[1,2,5] amount=11 => 3');
  __assert__(coinChange([2], 3) === -1, '[2] amount=3 => -1');
  __assert__(coinChange([1], 0) === 0, 'amount=0 => 0');
  __assert__(coinChange([1], 1) === 1, '[1] amount=1 => 1');
  __assert__(coinChange([1, 2, 5], 100) === 20, '[1,2,5] amount=100 => 20');
}`,
	},
	{
		id: "best-time-stock",
		title: "买卖股票最佳时机 (LeetCode 121)",
		category: "algorithm",
		difficulty: 1,
		frequency: 2,
		timeLimit: 8,
		description:
			"给定数组 prices 表示每天股价，只能买入一次卖出一次，求最大利润。不能在买入前卖出。",
		skeleton: `function maxProfit(prices) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(maxProfit) {
  __assert__(maxProfit([7,1,5,3,6,4]) === 5, '标准用例 => 5');
  __assert__(maxProfit([7,6,4,3,1]) === 0, '递减 => 0');
  __assert__(maxProfit([1]) === 0, '单天');
  __assert__(maxProfit([2, 4, 1]) === 2, '[2,4,1] => 2');
}`,
	},
	{
		id: "quick-sort",
		title: "快速排序",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"实现快速排序算法，返回升序排列的新数组。",
		skeleton: `function quickSort(arr) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(quickSort) {
  __assert__(JSON.stringify(quickSort([3,1,4,1,5,9,2,6])) === '[1,1,2,3,4,5,6,9]', '标准排序');
  __assert__(JSON.stringify(quickSort([])) === '[]', '空数组');
  __assert__(JSON.stringify(quickSort([1])) === '[1]', '单元素');
  __assert__(JSON.stringify(quickSort([5,4,3,2,1])) === '[1,2,3,4,5]', '逆序');
  __assert__(JSON.stringify(quickSort([1,1,1])) === '[1,1,1]', '全相同');
}`,
	},
	{
		id: "three-sum",
		title: "三数之和 (LeetCode 15)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 15,
		description:
			"给定整数数组 nums，找出所有和为 0 的三元组，不可包含重复三元组。返回二维数组。",
		skeleton: `function threeSum(nums) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(threeSum) {
  const r1 = threeSum([-1,0,1,2,-1,-4]);
  const s1 = JSON.stringify(r1.map(t => [...t].sort((a,b) => a-b)).sort());
  __assert__(s1 === JSON.stringify([[-1,-1,2],[-1,0,1]]), '标准用例');

  __assert__(threeSum([0,1,1]).length === 0, '无解');
  __assert__(JSON.stringify(threeSum([0,0,0])) === '[[0,0,0]]', '[0,0,0]');
}`,
	},
	{
		id: "min-stack",
		title: "最小栈 (LeetCode 155)",
		category: "algorithm",
		difficulty: 2,
		frequency: 1,
		timeLimit: 10,
		description:
			"设计一个栈，支持 push、pop、top 和 getMin，getMin 返回栈中最小元素，所有操作 O(1)。",
		skeleton: `class MinStack {
  constructor() {
    // 在这里写你的实现
  }
  push(val) {}
  pop() {}
  top() {}
  getMin() {}
}`,
		testCode: `async function __test__(MinStack) {
  const s = new MinStack();
  s.push(-2);
  s.push(0);
  s.push(-3);
  __assert__(s.getMin() === -3, 'getMin = -3');
  s.pop();
  __assert__(s.top() === 0, 'top = 0');
  __assert__(s.getMin() === -2, 'pop 后 getMin = -2');
}`,
	},
	{
		id: "longest-increasing-subseq",
		title: "最长递增子序列 (LeetCode 300)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"给定整数数组 nums，找到其中最长严格递增子序列的长度。",
		skeleton: `function lengthOfLIS(nums) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(lengthOfLIS) {
  __assert__(lengthOfLIS([10,9,2,5,3,7,101,18]) === 4, '标准用例 => 4');
  __assert__(lengthOfLIS([0,1,0,3,2,3]) === 4, '=> 4');
  __assert__(lengthOfLIS([7,7,7,7]) === 1, '全相同 => 1');
  __assert__(lengthOfLIS([1]) === 1, '单元素');
  __assert__(lengthOfLIS([1,2,3,4,5]) === 5, '递增 => 5');
}`,
	},
	{
		id: "compose",
		title: "手写 compose / pipe",
		category: "handwrite",
		difficulty: 2,
		frequency: 2,
		timeLimit: 8,
		description:
			"compose(...fns) 从右到左组合函数。pipe(...fns) 从左到右组合。compose(f, g, h)(x) === f(g(h(x)))。",
		skeleton: `function compose(...fns) {
  // 在这里写你的实现
}

function pipe(...fns) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(compose, pipe) {
  const add1 = x => x + 1;
  const mul2 = x => x * 2;
  const sub3 = x => x - 3;

  __assert__(compose(add1, mul2)(5) === 11, 'compose: (5*2)+1=11');
  __assert__(compose(sub3, add1, mul2)(5) === 8, 'compose: ((5*2)+1)-3=8');
  __assert__(pipe(mul2, add1)(5) === 11, 'pipe: (5*2)+1=11');
  __assert__(pipe(mul2, add1, sub3)(5) === 8, 'pipe: ((5*2)+1)-3=8');
  __assert__(compose()(10) === 10, 'compose 空参数返回原值');
}`,
	},
	{
		id: "lazyman",
		title: "手写 LazyMan",
		category: "handwrite",
		difficulty: 3,
		frequency: 2,
		timeLimit: 15,
		description:
			"实现 LazyMan('Jack').eat('lunch').sleep(2).eat('dinner')，sleep 会延迟后续执行，sleepFirst 会插队到最前。输出通过 console.log。",
		skeleton: `function LazyMan(name) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(LazyMan) {
  const logs = [];
  const origLog = console.log;
  console.log = (...args) => logs.push(args.join(' '));

  LazyMan('Jack').eat('lunch').sleep(1).eat('dinner');
  await __sleep__(2500);

  console.log = origLog;
  __assert__(logs[0] === 'Hi! This is Jack!', '第一句打招呼');
  __assert__(logs[1] === 'Eat lunch', '吃午饭');
  __assert__(logs.some(l => l.includes('dinner')), '最终吃晚饭');
}`,
	},
	{
		id: "sleep",
		title: "手写 sleep 函数",
		category: "handwrite",
		difficulty: 1,
		frequency: 1,
		timeLimit: 3,
		description:
			"实现 sleep(ms)，返回 Promise，等待 ms 毫秒后 resolve。",
		skeleton: `function sleep(ms) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(sleep) {
  const start = Date.now();
  await sleep(100);
  const elapsed = Date.now() - start;
  __assert__(elapsed >= 90, '至少等待约 100ms');
  __assert__(elapsed < 300, '不应等太久');

  const r = await sleep(0);
  __assert__(r === undefined || r === null || r === void 0, '返回 undefined');
}`,
	},
	{
		id: "cancelable-promise",
		title: "手写可取消的 Promise",
		category: "handwrite",
		difficulty: 2,
		frequency: 1,
		timeLimit: 10,
		description:
			"实现 createCancelablePromise(promise)，返回 { promise, cancel }。调用 cancel() 后 promise 应 reject。",
		skeleton: `function createCancelablePromise(originalPromise) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(createCancelablePromise) {
  const { promise: p1, cancel: c1 } = createCancelablePromise(
    new Promise(r => setTimeout(() => r('done'), 100))
  );
  c1();
  try {
    await p1;
    __assert__(false, '应 reject');
  } catch (e) {
    __assert__(true, '取消后 reject');
  }

  const { promise: p2 } = createCancelablePromise(Promise.resolve(42));
  const r2 = await p2;
  __assert__(r2 === 42, '不取消时正常 resolve');
}`,
	},
	{
		id: "array-to-tree",
		title: "数组转树结构",
		category: "handwrite",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"将扁平数组 [{id, parentId, name}] 转为嵌套树结构 [{id, name, children: [...]}]。根节点 parentId 为 null。",
		skeleton: `function arrayToTree(items) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(arrayToTree) {
  const items = [
    { id: 1, parentId: null, name: 'root' },
    { id: 2, parentId: 1, name: 'a' },
    { id: 3, parentId: 1, name: 'b' },
    { id: 4, parentId: 2, name: 'a-1' },
    { id: 5, parentId: 3, name: 'b-1' },
  ];
  const tree = arrayToTree(items);
  __assert__(tree.length === 1, '一个根节点');
  __assert__(tree[0].name === 'root', '根节点名称');
  __assert__(tree[0].children.length === 2, '根有2个子节点');
  __assert__(tree[0].children[0].children[0].name === 'a-1', '孙节点');

  __assert__(arrayToTree([]).length === 0, '空数组');
}`,
	},
	{
		id: "tree-to-array",
		title: "树结构转扁平数组",
		category: "handwrite",
		difficulty: 2,
		frequency: 1,
		timeLimit: 8,
		description:
			"将嵌套树 [{id, name, children}] 展平为一维数组，保持层序。",
		skeleton: `function treeToArray(tree) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(treeToArray) {
  const tree = [{
    id: 1, name: 'root', children: [
      { id: 2, name: 'a', children: [{ id: 4, name: 'a-1', children: [] }] },
      { id: 3, name: 'b', children: [] },
    ]
  }];
  const arr = treeToArray(tree);
  __assert__(arr.length === 4, '共4个节点');
  __assert__(arr[0].id === 1, '第一个是根');
  __assert__(arr.every(n => !n.children || n.children === undefined || Array.isArray(n.children)), '结构正确');

  __assert__(treeToArray([]).length === 0, '空树');
}`,
	},
	{
		id: "lodash-get",
		title: "手写 lodash.get",
		category: "handwrite",
		difficulty: 1,
		frequency: 2,
		timeLimit: 5,
		description:
			"实现 get(obj, path, defaultVal)，path 支持 'a.b.c' 或 'a[0].b' 格式。",
		skeleton: `function get(obj, path, defaultVal) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(get) {
  const obj = { a: { b: { c: 42 } }, d: [1, { e: 3 }] };
  __assert__(get(obj, 'a.b.c') === 42, 'a.b.c');
  __assert__(get(obj, 'd[1].e') === 3, 'd[1].e');
  __assert__(get(obj, 'a.b.x', 'default') === 'default', '不存在返回默认值');
  __assert__(get(obj, 'a.b.x') === undefined, '不存在无默认值返回 undefined');
  __assert__(get(null, 'a', 0) === 0, 'obj 为 null');
}`,
	},
	{
		id: "promise-any",
		title: "手写 Promise.any",
		category: "handwrite",
		difficulty: 2,
		frequency: 1,
		timeLimit: 8,
		description:
			"任一 Promise resolve 即 resolve 其值。全部 reject 则 reject AggregateError。",
		skeleton: `function promiseAny(promises) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(promiseAny) {
  const r1 = await promiseAny([
    Promise.reject('e1'),
    Promise.resolve(42),
    Promise.resolve(99),
  ]);
  __assert__(r1 === 42, '第一个成功的值');

  try {
    await promiseAny([
      Promise.reject('e1'),
      Promise.reject('e2'),
    ]);
    __assert__(false, '应 reject');
  } catch (e) {
    __assert__(e.errors && e.errors.length === 2, '全部失败时抛 AggregateError');
  }

  const r3 = await promiseAny([Promise.resolve('only')]);
  __assert__(r3 === 'only', '单个成功');
}`,
	},
	{
		id: "memoize",
		title: "手写函数记忆化 memoize",
		category: "handwrite",
		difficulty: 2,
		frequency: 2,
		timeLimit: 8,
		description:
			"实现 memoize(fn)，缓存函数结果，相同参数不重复计算。默认用第一个参数做 cache key。",
		skeleton: `function memoize(fn) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(memoize) {
  let callCount = 0;
  const expensive = (n) => { callCount++; return n * n; };
  const memo = memoize(expensive);

  __assert__(memo(4) === 16, '首次计算');
  __assert__(memo(4) === 16, '缓存命中');
  __assert__(callCount === 1, '只调用了1次');

  __assert__(memo(5) === 25, '新参数');
  __assert__(callCount === 2, '新参数调用');
}`,
	},
	{
		id: "set-interval-with-timeout",
		title: "用 setTimeout 实现 setInterval",
		category: "handwrite",
		difficulty: 1,
		frequency: 1,
		timeLimit: 5,
		description:
			"用 setTimeout 模拟 setInterval 的效果，返回一个 cancel 函数用于停止。",
		skeleton: `function mySetInterval(fn, delay) {
  // 在这里写你的实现，返回 cancel 函数
}`,
		testCode: `async function __test__(mySetInterval) {
  let count = 0;
  const cancel = mySetInterval(() => count++, 50);
  await __sleep__(280);
  cancel();
  const frozen = count;
  await __sleep__(150);
  __assert__(frozen >= 3 && frozen <= 7, '执行了约5次，实际 ' + frozen);
  __assert__(count === frozen, '取消后不再执行');
}`,
	},
	{
		id: "json-to-dom",
		title: "JSON 转 DOM (虚拟 DOM 渲染)",
		category: "handwrite",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"实现 render(vnode)，将 {tag, attrs, children} 虚拟 DOM 结构转为真实 DOM 节点。children 可以是字符串或子节点数组。",
		skeleton: `function render(vnode) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(render) {
  const vnode = {
    tag: 'div',
    attrs: { id: 'app', class: 'container' },
    children: [
      { tag: 'span', attrs: {}, children: ['hello'] },
      { tag: 'p', attrs: { class: 'text' }, children: ['world'] },
    ],
  };
  const el = render(vnode);
  __assert__(el.tagName === 'DIV', '根标签 div');
  __assert__(el.id === 'app', 'id 属性');
  __assert__(el.childNodes.length === 2, '两个子节点');
  __assert__(el.childNodes[0].tagName === 'SPAN', '第一个子节点 span');
  __assert__(el.childNodes[0].textContent === 'hello', 'span 文本');

  const simple = render({ tag: 'br', attrs: {}, children: [] });
  __assert__(simple.tagName === 'BR', '简单标签');
}`,
	},
	{
		id: "valid-anagram",
		title: "有效字母异位词 (LeetCode 242)",
		category: "algorithm",
		difficulty: 1,
		frequency: 2,
		timeLimit: 5,
		description:
			"给定两个字符串 s 和 t，判断 t 是否是 s 的字母异位词（字母相同，排列不同）。",
		skeleton: `function isAnagram(s, t) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(isAnagram) {
  __assert__(isAnagram('anagram', 'nagaram') === true, 'anagram');
  __assert__(isAnagram('rat', 'car') === false, 'rat vs car');
  __assert__(isAnagram('', '') === true, '空字符串');
  __assert__(isAnagram('a', 'ab') === false, '长度不同');
}`,
	},
	{
		id: "permutations",
		title: "全排列 (LeetCode 46)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"给定不含重复数字的数组 nums，返回其所有可能的全排列。",
		skeleton: `function permute(nums) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(permute) {
  const r1 = permute([1, 2, 3]);
  __assert__(r1.length === 6, '[1,2,3] 有 6 种排列');
  const sorted = r1.map(p => p.join(',')).sort();
  __assert__(sorted[0] === '1,2,3', '包含 [1,2,3]');
  __assert__(sorted[5] === '3,2,1', '包含 [3,2,1]');

  __assert__(permute([1]).length === 1, '单元素');
  __assert__(permute([0, 1]).length === 2, '两元素');
}`,
	},
	{
		id: "island-count",
		title: "岛屿数量 (LeetCode 200)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"给定 m x n 二维网格（'1' 代表陆地，'0' 代表水），计算岛屿数量。岛屿被水包围，由水平/垂直相邻的陆地连接。",
		skeleton: `function numIslands(grid) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(numIslands) {
  __assert__(numIslands([
    ['1','1','1','1','0'],
    ['1','1','0','1','0'],
    ['1','1','0','0','0'],
    ['0','0','0','0','0'],
  ]) === 1, '一个岛');

  __assert__(numIslands([
    ['1','1','0','0','0'],
    ['1','1','0','0','0'],
    ['0','0','1','0','0'],
    ['0','0','0','1','1'],
  ]) === 3, '三个岛');

  __assert__(numIslands([['0']]) === 0, '无岛');
}`,
	},
	{
		id: "trap-rain-water",
		title: "接雨水 (LeetCode 42)",
		category: "algorithm",
		difficulty: 3,
		frequency: 2,
		timeLimit: 15,
		description:
			"给定 n 个非负整数表示柱子高度，计算能接多少雨水。",
		skeleton: `function trap(height) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(trap) {
  __assert__(trap([0,1,0,2,1,0,1,3,2,1,2,1]) === 6, '标准用例 => 6');
  __assert__(trap([4,2,0,3,2,5]) === 9, '=> 9');
  __assert__(trap([]) === 0, '空数组');
  __assert__(trap([3]) === 0, '单柱');
  __assert__(trap([3, 3]) === 0, '两个等高');
}`,
	},
	{
		id: "merge-intervals",
		title: "合并区间 (LeetCode 56)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"给定若干区间 [[start, end], ...]，合并所有重叠区间，返回不重叠的区间数组。",
		skeleton: `function merge(intervals) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(merge) {
  __assert__(JSON.stringify(merge([[1,3],[2,6],[8,10],[15,18]])) === '[[1,6],[8,10],[15,18]]', '标准用例');
  __assert__(JSON.stringify(merge([[1,4],[4,5]])) === '[[1,5]]', '边界相连');
  __assert__(JSON.stringify(merge([[1,4]])) === '[[1,4]]', '单个区间');
  __assert__(JSON.stringify(merge([])) === '[]', '空数组');
}`,
	},
	{
		id: "search-rotated-array",
		title: "搜索旋转排序数组 (LeetCode 33)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"在旋转过的有序数组中搜索 target，找到返回下标，否则返回 -1。要求 O(log n)。",
		skeleton: `function search(nums, target) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(search) {
  __assert__(search([4,5,6,7,0,1,2], 0) === 4, '找到 0');
  __assert__(search([4,5,6,7,0,1,2], 3) === -1, '找不到');
  __assert__(search([1], 0) === -1, '单元素找不到');
  __assert__(search([1], 1) === 0, '单元素找到');
  __assert__(search([3, 1], 1) === 1, '两元素旋转');
}`,
	},
	{
		id: "longest-palindrome",
		title: "最长回文子串 (LeetCode 5)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"给定字符串 s，找到 s 中最长的回文子串。",
		skeleton: `function longestPalindrome(s) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(longestPalindrome) {
  const r1 = longestPalindrome('babad');
  __assert__(r1 === 'bab' || r1 === 'aba', 'babad => bab 或 aba');
  __assert__(longestPalindrome('cbbd') === 'bb', 'cbbd => bb');
  __assert__(longestPalindrome('a') === 'a', '单字符');
  __assert__(longestPalindrome('ac').length === 1, '无回文取单字符');
}`,
	},
	{
		id: "queue-with-stacks",
		title: "用栈实现队列 (LeetCode 232)",
		category: "algorithm",
		difficulty: 1,
		frequency: 1,
		timeLimit: 8,
		description:
			"用两个栈实现 FIFO 队列，支持 push、pop、peek、empty。",
		skeleton: `class MyQueue {
  constructor() {
    // 在这里写你的实现
  }
  push(x) {}
  pop() {}
  peek() {}
  empty() {}
}`,
		testCode: `async function __test__(MyQueue) {
  const q = new MyQueue();
  q.push(1);
  q.push(2);
  __assert__(q.peek() === 1, 'peek = 1');
  __assert__(q.pop() === 1, 'pop = 1');
  __assert__(q.empty() === false, '不为空');
  __assert__(q.pop() === 2, 'pop = 2');
  __assert__(q.empty() === true, '为空');
}`,
	},
	{
		id: "validate-bst",
		title: "验证二叉搜索树 (LeetCode 98)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"给定二叉树 {val, left, right}，判断它是否是有效的二叉搜索树。",
		skeleton: `function isValidBST(root) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(isValidBST) {
  __assert__(isValidBST({
    val: 2,
    left: { val: 1, left: null, right: null },
    right: { val: 3, left: null, right: null },
  }) === true, '有效 BST');

  __assert__(isValidBST({
    val: 5,
    left: { val: 1, left: null, right: null },
    right: { val: 4, left: { val: 3, left: null, right: null }, right: { val: 6, left: null, right: null } },
  }) === false, '无效 BST: 右子树有小于根的节点');

  __assert__(isValidBST(null) === true, '空树是有效 BST');
  __assert__(isValidBST({ val: 1, left: null, right: null }) === true, '单节点');
}`,
	},
	{
		id: "symmetric-tree",
		title: "对称二叉树 (LeetCode 101)",
		category: "algorithm",
		difficulty: 1,
		frequency: 1,
		timeLimit: 5,
		description:
			"给定二叉树，检查它是否是镜像对称的。",
		skeleton: `function isSymmetric(root) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(isSymmetric) {
  __assert__(isSymmetric({
    val: 1,
    left: { val: 2, left: { val: 3, left: null, right: null }, right: { val: 4, left: null, right: null } },
    right: { val: 2, left: { val: 4, left: null, right: null }, right: { val: 3, left: null, right: null } },
  }) === true, '对称');

  __assert__(isSymmetric({
    val: 1,
    left: { val: 2, left: null, right: { val: 3, left: null, right: null } },
    right: { val: 2, left: null, right: { val: 3, left: null, right: null } },
  }) === false, '不对称');

  __assert__(isSymmetric(null) === true, '空树');
}`,
	},
	{
		id: "spiral-matrix",
		title: "螺旋矩阵 (LeetCode 54)",
		category: "algorithm",
		difficulty: 2,
		frequency: 1,
		timeLimit: 12,
		description:
			"给定 m x n 矩阵，按照顺时针螺旋顺序返回所有元素。",
		skeleton: `function spiralOrder(matrix) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(spiralOrder) {
  __assert__(JSON.stringify(spiralOrder([[1,2,3],[4,5,6],[7,8,9]])) === '[1,2,3,6,9,8,7,4,5]', '3x3');
  __assert__(JSON.stringify(spiralOrder([[1,2,3,4],[5,6,7,8],[9,10,11,12]])) === '[1,2,3,4,8,12,11,10,9,5,6,7]', '3x4');
  __assert__(JSON.stringify(spiralOrder([[1]])) === '[1]', '1x1');
  __assert__(JSON.stringify(spiralOrder([[1,2],[3,4]])) === '[1,2,4,3]', '2x2');
}`,
	},
	{
		id: "merge-sort",
		title: "归并排序",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"实现归并排序算法，返回升序排列的新数组。",
		skeleton: `function mergeSort(arr) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(mergeSort) {
  __assert__(JSON.stringify(mergeSort([3,1,4,1,5,9,2,6])) === '[1,1,2,3,4,5,6,9]', '标准排序');
  __assert__(JSON.stringify(mergeSort([])) === '[]', '空数组');
  __assert__(JSON.stringify(mergeSort([1])) === '[1]', '单元素');
  __assert__(JSON.stringify(mergeSort([5,4,3,2,1])) === '[1,2,3,4,5]', '逆序');
}`,
	},
	{
		id: "container-with-most-water",
		title: "盛最多水的容器 (LeetCode 11)",
		category: "algorithm",
		difficulty: 2,
		frequency: 3,
		timeLimit: 10,
		description:
			"给定高度数组，找出两条线围成的容器能盛的最大水量。双指针：移动较矮的一侧。",
		skeleton: `function maxArea(height) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(maxArea) {
  __assert__(maxArea([1,8,6,2,5,4,8,3,7]) === 49, '标准用例 => 49');
  __assert__(maxArea([1,1]) === 1, '最小');
  __assert__(maxArea([4,3,2,1,4]) === 16, '两端等高');
}`,
	},
	{
		id: "longest-consecutive",
		title: "最长连续序列 (LeetCode 128)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"未排序数组中找到最长连续序列的长度，要求 O(n)。用 Set 找序列起点。",
		skeleton: `function longestConsecutive(nums) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(longestConsecutive) {
  __assert__(longestConsecutive([100,4,200,1,3,2]) === 4, '1234 => 4');
  __assert__(longestConsecutive([0,3,7,2,5,8,4,6,0,1]) === 9, '0-8 => 9');
  __assert__(longestConsecutive([]) === 0, '空数组');
  __assert__(longestConsecutive([1]) === 1, '单元素');
}`,
	},
	{
		id: "product-except-self",
		title: "除自身以外数组乘积 (LeetCode 238)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"输出数组每个位置的值 = 除该位置外其他元素的乘积，不能用除法。前缀积 × 后缀积。",
		skeleton: `function productExceptSelf(nums) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(productExceptSelf) {
  __assert__(JSON.stringify(productExceptSelf([1,2,3,4])) === '[24,12,8,6]', '标准用例');
  __assert__(JSON.stringify(productExceptSelf([-1,1,0,-3,3])) === '[0,0,9,0,0]', '含零');
  __assert__(JSON.stringify(productExceptSelf([2,3])) === '[3,2]', '两元素');
}`,
	},
	{
		id: "find-anagrams",
		title: "找到所有字母异位词 (LeetCode 438)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"找到 s 中所有 p 的字母异位词的起始索引。固定窗口 + 计数比较。",
		skeleton: `function findAnagrams(s, p) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(findAnagrams) {
  __assert__(JSON.stringify(findAnagrams('cbaebabacd', 'abc')) === '[0,6]', '标准用例');
  __assert__(JSON.stringify(findAnagrams('abab', 'ab')) === '[0,1,2]', 'abab');
  __assert__(JSON.stringify(findAnagrams('a', 'ab')) === '[]', 's < p');
}`,
	},
	{
		id: "detect-cycle",
		title: "环形链表 II (LeetCode 142)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"找到链表环的入口节点。快慢指针相遇后，一个从 head 出发一个从相遇点出发，再次相遇即环入口。用数组模拟。",
		skeleton: `function detectCycle(nodes, pos) {
  // nodes: 节点值数组, pos: 尾节点连接位置(-1表示无环)
  // 返回环入口的索引，无环返回 -1
  // 在这里写你的实现
}`,
		testCode: `async function __test__(detectCycle) {
  __assert__(detectCycle([3,2,0,-4], 1) === 1, '环入口在索引1');
  __assert__(detectCycle([1,2], 0) === 0, '环入口在索引0');
  __assert__(detectCycle([1], -1) === -1, '无环');
  __assert__(detectCycle([1,2,3,4], -1) === -1, '无环链表');
}`,
	},
	{
		id: "remove-nth-from-end",
		title: "删除链表倒数第N个节点 (LeetCode 19)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 8,
		description:
			"删除链表中倒数第 n 个节点并返回头节点。快慢指针：fast 先走 n 步。链表用 {val, next} 表示。",
		skeleton: `function removeNthFromEnd(head, n) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(removeNthFromEnd) {
  function toArr(h) { const r = []; while (h) { r.push(h.val); h = h.next; } return r; }
  function fromArr(a) { let h = null; for (let i = a.length - 1; i >= 0; i--) h = { val: a[i], next: h }; return h; }

  __assert__(JSON.stringify(toArr(removeNthFromEnd(fromArr([1,2,3,4,5]), 2))) === '[1,2,3,5]', '删倒数第2');
  __assert__(JSON.stringify(toArr(removeNthFromEnd(fromArr([1]), 1))) === '[]', '删唯一节点');
  __assert__(JSON.stringify(toArr(removeNthFromEnd(fromArr([1,2]), 1))) === '[1]', '删尾节点');
}`,
	},
	{
		id: "group-anagrams",
		title: "字母异位词分组 (LeetCode 49)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"将字母异位词分组。排序后字符串相同的分为一组。",
		skeleton: `function groupAnagrams(strs) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(groupAnagrams) {
  const r = groupAnagrams(['eat','tea','tan','ate','nat','bat']);
  __assert__(r.length === 3, '3组');
  const sorted = r.map(g => g.sort().join(',')).sort();
  __assert__(sorted.some(g => g.includes('eat')), '包含 eat 组');
  __assert__(sorted.some(g => g.includes('bat')), '包含 bat 组');

  __assert__(groupAnagrams(['']).length === 1, '空字符串');
  __assert__(groupAnagrams(['a']).length === 1, '单字符');
}`,
	},
	{
		id: "build-tree",
		title: "从前序与中序构造二叉树 (LeetCode 105)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 15,
		description:
			"根据前序和中序遍历结果重建二叉树。前序第一个是根，中序中根的左边是左子树。返回 {val, left, right}。",
		skeleton: `function buildTree(preorder, inorder) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(buildTree) {
  const tree = buildTree([3,9,20,15,7], [9,3,15,20,7]);
  __assert__(tree.val === 3, '根节点 3');
  __assert__(tree.left.val === 9, '左子 9');
  __assert__(tree.right.val === 20, '右子 20');
  __assert__(tree.right.left.val === 15, '右左 15');

  const single = buildTree([1], [1]);
  __assert__(single.val === 1, '单节点');
  __assert__(single.left === null && single.right === null, '无子');
}`,
	},
	{
		id: "max-path-sum",
		title: "二叉树最大路径和 (LeetCode 124)",
		category: "algorithm",
		difficulty: 3,
		frequency: 2,
		timeLimit: 15,
		description:
			"找出一条路径使得路径上节点值的和最大。路径可以从任意节点开始和结束。后序遍历+贡献值。",
		skeleton: `function maxPathSum(root) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(maxPathSum) {
  __assert__(maxPathSum({ val: 1, left: { val: 2, left: null, right: null }, right: { val: 3, left: null, right: null } }) === 6, '1+2+3=6');
  __assert__(maxPathSum({
    val: -10,
    left: { val: 9, left: null, right: null },
    right: { val: 20, left: { val: 15, left: null, right: null }, right: { val: 7, left: null, right: null } },
  }) === 42, '15+20+7=42');
  __assert__(maxPathSum({ val: -3, left: null, right: null }) === -3, '单负节点');
}`,
	},
	{
		id: "lowest-common-ancestor",
		title: "二叉树最近公共祖先 (LeetCode 236)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"找到两个节点 p 和 q 的最近公共祖先。简化版：给定两个目标值 pVal 和 qVal，返回 LCA 节点的值。",
		skeleton: `function lowestCommonAncestor(root, pVal, qVal) {
  // 在这里写你的实现
  // 返回 LCA 节点的 val，或 null
}`,
		testCode: `async function __test__(lowestCommonAncestor) {
  const tree = {
    val: 3,
    left: { val: 5, left: { val: 6, left: null, right: null }, right: { val: 2, left: { val: 7, left: null, right: null }, right: { val: 4, left: null, right: null } } },
    right: { val: 1, left: { val: 0, left: null, right: null }, right: { val: 8, left: null, right: null } },
  };
  __assert__(lowestCommonAncestor(tree, 5, 1) === 3, 'LCA(5,1)=3');
  __assert__(lowestCommonAncestor(tree, 5, 4) === 5, 'LCA(5,4)=5');
  __assert__(lowestCommonAncestor(tree, 6, 4) === 5, 'LCA(6,4)=5');
}`,
	},
	{
		id: "subsets",
		title: "子集 (LeetCode 78)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"给定不含重复元素的整数数组 nums，返回其所有可能的子集（幂集）。",
		skeleton: `function subsets(nums) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(subsets) {
  const r = subsets([1,2,3]);
  __assert__(r.length === 8, '2^3=8 个子集');
  __assert__(r.some(s => s.length === 0), '包含空集');
  __assert__(r.some(s => JSON.stringify(s.sort()) === '[1,2,3]'), '包含全集');

  __assert__(subsets([0]).length === 2, '单元素2个子集');
}`,
	},
	{
		id: "combination-sum",
		title: "组合总和 (LeetCode 39)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"找出所有和为 target 的组合，同一数字可以无限次使用。返回二维数组。",
		skeleton: `function combinationSum(candidates, target) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(combinationSum) {
  const r1 = combinationSum([2,3,6,7], 7);
  __assert__(r1.length === 2, '[2,3,6,7] target=7 有2种');
  const sorted = r1.map(c => c.sort((a,b)=>a-b).join(',')).sort();
  __assert__(sorted.includes('2,2,3'), '包含 [2,2,3]');
  __assert__(sorted.includes('7'), '包含 [7]');

  __assert__(combinationSum([2], 1).length === 0, '无解');
}`,
	},
	{
		id: "generate-parentheses",
		title: "括号生成 (LeetCode 22)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"生成 n 对括号的所有有效组合。回溯：左括号 < n 可加左，右括号 < 左括号可加右。",
		skeleton: `function generateParenthesis(n) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(generateParenthesis) {
  const r3 = generateParenthesis(3);
  __assert__(r3.length === 5, 'n=3 有5种');
  __assert__(r3.includes('((()))'), '包含 ((()))');
  __assert__(r3.includes('(()())'), '包含 (()())');

  __assert__(generateParenthesis(1).length === 1, 'n=1');
  __assert__(generateParenthesis(1)[0] === '()', 'n=1 => ()');
}`,
	},
	{
		id: "house-robber",
		title: "打家劫舍 (LeetCode 198)",
		category: "algorithm",
		difficulty: 2,
		frequency: 3,
		timeLimit: 8,
		description:
			"不能偷相邻的房屋，求最大偷窃金额。dp[i] = max(dp[i-1], dp[i-2]+nums[i])。",
		skeleton: `function rob(nums) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(rob) {
  __assert__(rob([1,2,3,1]) === 4, '[1,2,3,1] => 4');
  __assert__(rob([2,7,9,3,1]) === 12, '[2,7,9,3,1] => 12');
  __assert__(rob([0]) === 0, '单个0');
  __assert__(rob([2,1]) === 2, '两个取大');
}`,
	},
	{
		id: "edit-distance",
		title: "编辑距离 (LeetCode 72)",
		category: "algorithm",
		difficulty: 3,
		frequency: 2,
		timeLimit: 15,
		description:
			"将 word1 转换成 word2 所需的最少操作数（插入、删除、替换）。经典二维 DP。",
		skeleton: `function minDistance(word1, word2) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(minDistance) {
  __assert__(minDistance('horse', 'ros') === 3, 'horse->ros = 3');
  __assert__(minDistance('intention', 'execution') === 5, 'intention->execution = 5');
  __assert__(minDistance('', '') === 0, '空->空 = 0');
  __assert__(minDistance('abc', '') === 3, 'abc->空 = 3');
  __assert__(minDistance('', 'abc') === 3, '空->abc = 3');
}`,
	},
	{
		id: "daily-temperatures",
		title: "每日温度 (LeetCode 739)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"找到下一个更高温度的间隔天数。单调递减栈，栈中存索引。",
		skeleton: `function dailyTemperatures(temperatures) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(dailyTemperatures) {
  __assert__(JSON.stringify(dailyTemperatures([73,74,75,71,69,72,76,73])) === '[1,1,4,2,1,1,0,0]', '标准用例');
  __assert__(JSON.stringify(dailyTemperatures([30,40,50,60])) === '[1,1,1,0]', '递增');
  __assert__(JSON.stringify(dailyTemperatures([30,20,10])) === '[0,0,0]', '递减');
}`,
	},
	{
		id: "kth-largest",
		title: "数组中第K个最大元素 (LeetCode 215)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"找出数组中第 K 大的元素。快排 partition 或堆。",
		skeleton: `function findKthLargest(nums, k) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(findKthLargest) {
  __assert__(findKthLargest([3,2,1,5,6,4], 2) === 5, '第2大 = 5');
  __assert__(findKthLargest([3,2,3,1,2,4,5,5,6], 4) === 4, '第4大 = 4');
  __assert__(findKthLargest([1], 1) === 1, '单元素');
  __assert__(findKthLargest([7,6,5,4,3,2,1], 5) === 3, '逆序第5大');
}`,
	},
	{
		id: "decode-string",
		title: "字符串解码 (LeetCode 394)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"解码 '3[a2[c]]' → 'accaccacc'。用数字栈和字符串栈。",
		skeleton: `function decodeString(s) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(decodeString) {
  __assert__(decodeString('3[a]2[bc]') === 'aaabcbc', '3[a]2[bc]');
  __assert__(decodeString('3[a2[c]]') === 'accaccacc', '嵌套');
  __assert__(decodeString('2[abc]3[cd]ef') === 'abcabccdcdcdef', '混合');
  __assert__(decodeString('abc') === 'abc', '无编码');
}`,
	},
	{
		id: "word-break",
		title: "单词拆分 (LeetCode 139)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"判断字符串是否能用字典中的单词拼接而成。DP：dp[i] 表示 s[0..i-1] 是否可拆分。",
		skeleton: `function wordBreak(s, wordDict) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(wordBreak) {
  __assert__(wordBreak('leetcode', ['leet', 'code']) === true, 'leetcode');
  __assert__(wordBreak('applepenapple', ['apple', 'pen']) === true, 'applepenapple');
  __assert__(wordBreak('catsandog', ['cats', 'dog', 'sand', 'and', 'cat']) === false, 'catsandog');
}`,
	},
	{
		id: "unique-paths",
		title: "不同路径 (LeetCode 62)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 8,
		description:
			"m×n 网格，从左上角到右下角有多少条路径（只能向右或向下）。",
		skeleton: `function uniquePaths(m, n) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(uniquePaths) {
  __assert__(uniquePaths(3, 7) === 28, '3x7 = 28');
  __assert__(uniquePaths(3, 2) === 3, '3x2 = 3');
  __assert__(uniquePaths(1, 1) === 1, '1x1 = 1');
  __assert__(uniquePaths(7, 3) === 28, '7x3 = 28');
}`,
	},
	{
		id: "max-product-subarray",
		title: "乘积最大子数组 (LeetCode 152)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"找出连续子数组的最大乘积。同时维护最大值和最小值（负数翻转）。",
		skeleton: `function maxProduct(nums) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(maxProduct) {
  __assert__(maxProduct([2,3,-2,4]) === 6, '2*3=6');
  __assert__(maxProduct([-2,0,-1]) === 0, '含零');
  __assert__(maxProduct([-2,3,-4]) === 24, '负负得正');
  __assert__(maxProduct([-2]) === -2, '单负数');
}`,
	},
	{
		id: "promise-timeout",
		title: "手写 Promise 超时控制",
		category: "handwrite",
		difficulty: 1,
		frequency: 2,
		timeLimit: 5,
		description:
			"实现 withTimeout(promise, ms)，超时后 reject。用 Promise.race 实现。",
		skeleton: `function withTimeout(promise, ms) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(withTimeout) {
  const fast = withTimeout(Promise.resolve(42), 1000);
  __assert__(await fast === 42, '快速完成不超时');

  try {
    await withTimeout(new Promise(() => {}), 50);
    __assert__(false, '应超时');
  } catch (e) {
    __assert__(true, '超时 reject');
  }

  try {
    await withTimeout(__sleep__(200).then(() => 'late'), 50);
    __assert__(false, '应超时');
  } catch {
    __assert__(true, '慢 promise 超时');
  }
}`,
	},
	{
		id: "longest-common-subsequence",
		title: "最长公共子序列 (LeetCode 1143)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 12,
		description:
			"找出两个字符串的最长公共子序列长度。二维 DP。",
		skeleton: `function longestCommonSubsequence(text1, text2) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(longestCommonSubsequence) {
  __assert__(longestCommonSubsequence('abcde', 'ace') === 3, 'ace');
  __assert__(longestCommonSubsequence('abc', 'abc') === 3, '完全相同');
  __assert__(longestCommonSubsequence('abc', 'def') === 0, '无公共');
  __assert__(longestCommonSubsequence('', 'abc') === 0, '空串');
}`,
	},
	{
		id: "top-k-frequent",
		title: "前K个高频元素 (LeetCode 347)",
		category: "algorithm",
		difficulty: 2,
		frequency: 2,
		timeLimit: 10,
		description:
			"返回出现频率最高的 K 个元素。桶排序或堆。",
		skeleton: `function topKFrequent(nums, k) {
  // 在这里写你的实现
}`,
		testCode: `async function __test__(topKFrequent) {
  const r1 = topKFrequent([1,1,1,2,2,3], 2).sort();
  __assert__(JSON.stringify(r1) === '[1,2]', 'Top 2');
  __assert__(topKFrequent([1], 1)[0] === 1, '单元素');
  const r3 = topKFrequent([4,4,4,3,3,2], 1);
  __assert__(r3[0] === 4, 'Top 1');
}`,
	},
];
