# API

If you use the CLI or `const wk = require('wk')`, a default context is created. In CLI execution, a functions set is injected to the global object, other methods are accessible in `wk`.

- [desc](#descstring)
- [task](#taskname-prerequisites-options-action)
  - [Options](#options)
  - [Passing values through tasks](#passing-values-through-tasks)
  - [Execution and hooks](#execution-and-hooks)
- [taskProcess](#commandname-prerequisites-options-command)
- [namespace](#namespacename-fn)
- [serie](#serietasks)
- [parallel](#paralleltasks)
- [fail](#fail)
- [wk object](#wk-object)

## `desc(string)`

Prepare a description for the next task created.

## `task(name[, prerequisites, options, action])`

Create a new task with a `name` and return the `Task` object.

```js
// By default, a task is asynchronous. You have to call resolve() or reject()
task('foo', function(resolve, reject) {
  resolve('foo')
})

// Or add { async: false }, to disable async functions
task('bar', { async: false }, function() {
  return 'bar'
})
```

`prerequisites` is an array of tasks executed before a task.

```js
// By default prerequisites are executed in serie,
// but you can specified to be executed in parallel
task('baz', [ 'foo', 'bar' ], { preReqSequence: 'parallel' })
```

### Options

**options.async** (Default: true) — The task is asynchronous. You **MUST** call `resolve()` or `reject()` to complete the task.

**options.preReqSequence** (Default: serie) - Execute prerequisites in `parallel` or `serie`

**options.visible** (Default: true) - Enable a task to be called by the user. A task hidden can be called by the others.

**options.description** (Default: '') - Add a task description.

**options.prerequisites** (Default: null) - Tasks executed before execution of a task.

**options.action** (Default: null) - Function called by the task.

**options.command** (Default: null) - Function called to configure argv configuration.

**options.concurrency** (Default: -1) - Maximum concurrent task execution.

## `taskProcess(name, command[, prerequisites, options, callback])`

Create a new task that execute a command line

```js
taskProcess('hello', 'echo "Hello World"')

taskProcess('ls-remote', 'git ls-remote', function(err, stdout, stderr) {
  this.complete()
}, { async: true })
```

### TaskProcess options

**options.process.use_color** (Default: true) Display child process color

**options.process.rejectOnError** (Default: false) - If an error occured or `code != 0`, the promise is rejected.

**options.process.interactive** (Default: false)

**options.process.printStdout** (Default: true)  Print `stdout`

**options.process.printStderr** (Default: true) Print `stderr`

## `namespace(name, fn)`

`namespace` create a group and return a `Namespace` object.

```js
namespace('foo', function() {
  task('bar')
})
```

```sh
wk -T

> wk foo:bar
```

You can set a default task associated to a namespace

```js
namespace('foo', function() {
  task('default', [ 'bar' ])
  task('bar')
})
```

```sh
wk -T

> wk foo
> wk foo:bar
```

## `serie(...tasks)`

Execute tasks in `serie`

## `parallel(...tasks)`

Execute tasks in `parallel`

## `nano`

`nano` is a very small task manager.

`nano.serie` to execute tasks in serie.

`nano.parallel` to execute tasks in parallel.

```js
const tasks = {

  "task1": function(resolve) {
    resolve({ name: 'John' })
  },

  "task2": function(resolve) {
    this.result.message = 'Salut'
    resolve(this.result)
  },

  "task3": function(resolve) {
    this.result.day = 'monday'
    resolve(this.result)
  },

  "task4": function(resolve) {
    console.log(this.result)
    resolve(this)
  }

}

wk.nano.serie(tasks)
```

You can create a task with `nano.task()`.

```js

const tasks = {

  "task1": wk.nano.task(function(resolve, reject) {
    resolve(this.name)
    this.name = 'Max'
  }, { name: 'John' }),

  "task2": function(resolve) {
    console.log(this.result)
    resolve()
  },

  "task3": function(resolve) {
    console.log('Who is there ?')
    resolve()
  }

}

// The second arguments is array to reorder task execute or repeat task
wk.nano.serie(tasks, [
  'task3', 'task1', 'task2',
  'task3', 'task1', 'task2'
])
// => Who is there ?
// => John
// => Who is there ?
// => Max
```


## `wk.require(path[, createNamespace])`

`wk.require` can be used to load a file, a directory.


```js
// Inside tasks/hello.js
task('hello', function(resolve) {
  console.log('Hello World')
  resolve()
})

// Inside Wkfile
wk.require('tasks/hello')
```

```
wk -T

> wk hello
```

The `createNamespace` argument is optional. If `true`, a new namespace is created based on the basename of the path.


```js
// Inside "message.js"
desc('Log "Hello World"')
task('hello', function() {
  console.log('Hello World')
})

// Inside "tasks/assets/index.js"
desc('Compile assets')
task('compile', function() {
  console.log('compile assets')
})
```

```js
// Inside `Wkfile`
wk.require('./message.js', true)   // File name is the namespace
wk.require('./tasks/assets', true) // Directory name is the namespace
```

```
wk -T

> wk message:hello      # Hello World
> wk assets:compile     # Compile assets
```

## `wk.require.paths`

Like `module.paths` in Node.js, you can add search paths.

```js
wk.require.paths.push( process.cwd() + '/tasks' )

wk.require('bump', true)
wk.require('package', true)

console.log(Object.keys(wk.Tasks))
```

## `wk.run`

See [Execution](api.md#execution)

## `wk.exec`

Execute a command or a list of command. Use same options as [taskProcess()](api.md#commandname-prerequisites-options-command).

`wk.exec` returns a promise.

```js
wk.exec('echo Hello World', { printStdout: true })

wk.exec([
  'echo foo',
  'echo bar',
  'echo baz'
])

wk.exec([
  {
    command: 'git status',
    options: { printStdout: true, breakOnError: true }
  },
  {
    command: 'git add',
    options: { printStderr: true }
  },
  {
    command: 'git commit',
    options: { interactive: true, breakOnError: true }
  }
])
```

## `wk.createExec`

Create a `ProcessExec` object. You can attach event callback, options and execute it.

Example:

```js
const psExec = wk.createExec('echo Hello World')

psExec.events.on('exit', function() {
  console.log('Command ended')
})

psExec.execute()
```

## Advanced

### Execution

You got three ways to execute a task :

* Use `execute(options)` method to execute the task only.

* Use `invoke(options)` or `wk.run(nameOrTask, options, context)` method to execute the task with prerequisites.

```js
task('task0', function() {
  console.log('task0')
})

// always_run will reenable the task automatically
task('task1', [ 'task0' ], function() {
  console.log('task1')
})


wk.Tasks['task1'].execute()
// => "task1"

wk.Tasks['task1'].invoke()
// => "task0"
// => "task1"

wk.run('task1')
// => "task0"
// => "task1"
```

### Passing values through tasks

```js
// async: true, pass through resolve()
task('greet', function(resolve) {
  resolve('Hello')
})

// async: false, pass through return
task('name', { async: false }, function() {
  return 'John'
})

// If the task is a used as a prerequisite, you got access to the invocator object and its argv.
task('punctuation', function(resolve) {
  if (this.invocator) this.invocator.argv.punctuation = '!'
  resolve()
})

task('message', [ 'greet', 'name', 'punctuation' ], { async: false, argv: { punctuation: '?' } }, function() {
  console.log( this.preReqResults[0], this.preReqResults[1], this.argv.punctuation)
  // => Hello John !
})
```

### Use `command` option

Under the wood, task argv are parsed with [wk-argv-parser](https://github.com/wk-js/argv-parser) and use a `Command` to configure the argv configuration. See [wk-argv-parser](https://github.com/wk-js/argv-parser) documentation.

```js
task('message', {
  command: function() {
    this
    .string('name', 'John')
    .string('greet', 'Hello')
  }
}, function() {
  console.log(this.argv.greet, this.argv.name, '!')
})

wk.run('message --name Max --greet Bonjour')
// => Bonjour Max !
```

### Manipulate contexts

```js
// Add task to active context
task('task1', function(resolve) {
  console.log('task1: context', wk.name)
  resolve(`task1`)
})

task('task2', function(resolve) {
  console.log('task2: context', wk.name)
  resolve(`task2`)
})

// Open a new context and add some tasks
wk.context('context1', function() {
  task('task3', function(resolve) {
    console.log('task3: context', wk.name)
    resolve(`task3`)
  })

  task('task4', function(resolve) {
    console.log('task4: context', wk.name)
    resolve(`task4`)
  })
})
```

Now let's see task list

```js
console.log(Object.keys(wk.Tasks))
// => [ 'task1', 'task2' ]
```

Task list in `context1`

```js
wk.context('context1', function() {
  console.log(Object.keys(this.Tasks))
  // => [ 'task3', 'task4' ]
})

// Alternative way to open and close a context
const context1 = wk.context('context1')
context1.open()
console.log(Object.keys(this.Tasks))
context1.close()
```

Use task from contexts

```js
task('start', function(resolve, reject) {
  wk.run('task1')
  .then(() => wk.run('task3', null, 'context1'))
  .then(() => wk.run('task4', null, 'context1'))
  .then(() => wk.run('task2'))
  .catch(reject)
  .then(resolve)
})

wk.Tasks['start'].invoke()
// => task1: context wk
// => task3: context wk:context1
// => task4: context wk:context1
// => task2: context wk
```

You can import task to a specific context

```js
wk.context('extra', function() {
  wk.require('tasks/bump', true)
  wk.require('tasks/package', true)
})

// Or
wk.require('tasks/bump', true, 'extra')
wk.require('tasks/package', true, 'extra')

// Or
const extra = wk.context('extra')
extra.open()
wk.require('tasks/bump', true)
wk.require('tasks/package', true)
extra.close()
```