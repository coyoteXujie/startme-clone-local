export type WriteTask<T> = () => Promise<T>;

interface WriteQueueState {
  readonly pending: number;
}

/**
 * 一个轻量级写入串行队列。所有 storage 的 write 操作通过该队列串行化，
 * 避免 get->set 之间被并发写覆盖导致数据回退。
 */
export const createWriteQueue = () => {
  let tail: Promise<unknown> = Promise.resolve();
  let pending = 0;

  const enqueue = <T>(task: WriteTask<T>): Promise<T> => {
    const run = async () => {
      pending += 1;
      try {
        return await task();
      } finally {
        pending = Math.max(0, pending - 1);
      }
    };
    const next = tail.then(run, run);
    tail = next.catch(() => undefined);
    return next;
  };

  const getState = (): WriteQueueState => ({ pending });
  const waitForIdle = (): Promise<void> => tail.then(() => undefined);

  return {
    enqueue,
    getState,
    waitForIdle,
  };
};
