# CLI

## Parameters

```
wk --help

    --verbose                               Display verbose log
    --silent                                Hide logs
    --log <string>                          Precise log levels (eg.: --log=log,warn,error)
    --help -h                               Help?
    --tasks -T                              List available tasks
    --file -F <string>                      Precise a default file
    --parallel -p                           Execute tasks in parallel
```

## Execute task

```sh
wk mytask
```

From a namespace `message`

```sh
wk message:hello
```

To execute multiple tasks

```sh
wk "mytask0" "mytask1"
```

## Passing arguments

Every arguments before `wk` will be added to `process.env`.
Every arguments between `wk` and the task belongs to `wk`.
Every arguments after the task belongs to the task.

```sh
ENV=staging wk --verbose mytask --message="Hello World"
```

To execute multiple tasks with arguments.

```sh
wk 'mytask0 --message="Hello World"' 'mytask1 --message="Surprise"'
```

## Fetch arguments

```sh
wk hello John --uppercase
```

```js
task('hello', { async: false }, function() {
  console.log('Hello ' + this.argv.name + '!')
  // Print "Hello John!"
})
```

Pass variable

```sh
wk hello --who Jack
```

```js
task('hello', { async: false }, function() {
  console.log('Hello ' + this.argv.who + '!')
  // Print "Hello Jack!"
})
```