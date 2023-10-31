export function shouldDiscard(child: any): child is null | undefined | boolean {
  switch (child) {
    case null:
    case undefined:
    case true:
    case false:
      return true;
    default: {
      if (Array.isArray(child) && child.length === 0) {
        return true;
      }
    }
  }
  return false;
}

export function forEachNode<T>(
  children: T,
  callback: (child: Exclude<T, Iterable<T>>) => void,
): void {
  if (shouldDiscard(children)) {
    return;
  }

  if (
    typeof children !== "string" &&
    typeof (children as any)?.[Symbol.iterator] === "function"
  ) {
    for (const child of children as any) {
      forEachNode(child, callback);
    }
  } else {
    callback(children as any);
  }
}

export function forEachNodeReplace<T>(
  children: T,
  callback: (child: Exclude<T, Iterable<T>>) => T,
): T {
  if (shouldDiscard(children)) {
    return children;
  }

  let newChildren;

  if (
    typeof children !== "string" &&
    typeof (children as any)?.[Symbol.iterator] === "function"
  ) {
    newChildren = [];
    for (const child of children as any) {
      newChildren.push(forEachNodeReplace(child, callback));
    }
  } else {
    newChildren = callback(children as any);
  }

  return newChildren as any;
}
