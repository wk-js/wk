import when from 'when'
import guard from 'when/guard'
import when_parallel from 'when/parallel'

export function parallel(tasks:any[], guard_count:number) {
  const guardTask    = guard.bind(null, guard.n(guard_count))
  const guardedTasks = tasks.map(guardTask)

  return when_parallel(guardedTasks)
}

export function map<T>(array:any[], guard_count:number, mapFn:(value: T, index?: Number | undefined) => T) {
  const guardedMapFn = guard(guard.n(guard_count), mapFn)
  return when.map<T>(array, guardedMapFn)
}