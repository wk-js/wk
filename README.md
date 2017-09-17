# Workflow CLI

Workflow-CLI is task runner inspired by [Jake.js](https://github.com/jakejs/jake).
By default, the `wk` command will load the `Wkfile` at your root path.

Example:

```js
desc('Display a message')
task('message', function() {
  console.log('Hello World')
})
```

```sh
wk -T

> wk message    # Display a message
```

```sh
wk message

> Hello World
```

More information in [API](docs/api.md#api)

# Parameters

```
wk --help

>         --verbose -v    Display every logs
>          --silent -s    Hide every logs
>           --no-color    Remove colors
>       --log <string>    Precise log levels (eg.: --log=log,warn,error)
>           --tasks -T    List available tasks
>   --file -F <string>    Precise a default file
>        --parallel -p    Execute tasks in parallel
```

# Documentations

- [Command line](docs/cli.md#cli)
- [API](docs/api.md#api)