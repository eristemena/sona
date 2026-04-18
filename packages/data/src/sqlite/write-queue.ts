export class SqliteWriteQueue {
  private current = Promise.resolve<void>(undefined)

  enqueue<T>(operation: () => T | Promise<T>): Promise<T> {
    const result = this.current.then(() => operation())
    this.current = result.then(() => undefined)
    return result
  }
}
export class SqliteWriteQueue {
  private current = Promise.resolve<void>(undefined)

  enqueue<T>(operation: () => T | Promise<T>): Promise<T> {
    const result = this.current.then(() => operation())
    this.current = result.then(() => undefined)
    return result
  }
}
