// Content script
// Collects current path and attempts to enumerate mounted React component names

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === "collectContext") {
    try {
      const context = collectContext();
      sendResponse({ ok: true, context });
    } catch (error) {
      console.error("collectContext failed", error);
      sendResponse({ ok: false, error: error?.message || String(error) });
    }
    return true;
  }
});

function collectContext() {
  const path =
    window.location.pathname + window.location.search + window.location.hash;
  const url = window.location.href;
  return { path, url };
}

function* getReactComponentNamesLimited(limit = 200) {
  const names = new Set();

  // Try React DevTools hook first (more reliable when available)
  try {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook && typeof hook.getFiberRoots === "function") {
      const rendererIds = getRendererIdsFromHook(hook);
      for (const id of rendererIds) {
        const roots = hook.getFiberRoots(id);
        if (roots && typeof roots.forEach === "function") {
          roots.forEach((root) => {
            for (const name of traverseFiberForNames(
              root.current || root,
              limit
            )) {
              if (!names.has(name)) {
                names.add(name);
                if (names.size >= limit) throw new Error("limit reached");
              }
            }
          });
        }
      }
      return names;
    }
  } catch (_) {
    // ignore
  }

  // Fallback: discover a fiber from DOM nodes (heuristic)
  const anyFiber = findAnyFiberFromDom();
  if (anyFiber) {
    for (const name of traverseFiberForNames(getRootFiber(anyFiber), limit)) {
      if (!names.has(name)) {
        names.add(name);
        if (names.size >= limit) break;
      }
    }
  }

  return names;
}

function getRendererIdsFromHook(hook) {
  const ids = [];
  const renderers = hook.renderers || hook._renderers; // Map-like
  if (renderers) {
    if (typeof renderers.forEach === "function") {
      renderers.forEach((_, id) => ids.push(id));
    } else if (Array.isArray(renderers)) {
      for (const [id] of renderers) ids.push(id);
    } else if (typeof renderers === "object") {
      for (const key of Object.keys(renderers)) ids.push(Number(key));
    }
  }
  return ids;
}

function findAnyFiberFromDom(maxScanNodes = 2000) {
  const walker = document.createTreeWalker(
    document.body || document.documentElement,
    NodeFilter.SHOW_ELEMENT
  );
  let count = 0;
  let node = walker.currentNode;
  while (node && count < maxScanNodes) {
    const fiber = getFiberFromDomNode(node);
    if (fiber) return fiber;
    node = walker.nextNode();
    count++;
  }
  return null;
}

function getFiberFromDomNode(domNode) {
  for (const key in domNode) {
    if (key && key.startsWith("__reactFiber$")) {
      try {
        return domNode[key];
      } catch (_) {
        // ignore
      }
    }
  }
  return null;
}

function getRootFiber(fiber) {
  let current = fiber;
  const seen = new Set();
  while (current && current.return && !seen.has(current)) {
    seen.add(current);
    current = current.return;
  }
  return current || fiber;
}

function* traverseFiberForNames(rootFiber, limit = 200) {
  const stack = [rootFiber];
  const seen = new Set();
  while (stack.length > 0 && seen.size < limit) {
    const fiber = stack.pop();
    if (!fiber || seen.has(fiber)) continue;
    seen.add(fiber);

    const displayName = getFiberDisplayName(fiber);
    if (displayName) yield displayName;

    if (fiber.child) stack.push(fiber.child);
    if (fiber.sibling) stack.push(fiber.sibling);
  }
}

function getFiberDisplayName(fiber) {
  try {
    const type = fiber.elementType || fiber.type;
    if (!type) return null;
    if (typeof type === "string") return null; // host components like 'div'

    return (
      type.displayName ||
      type.name ||
      (type.render && (type.render.displayName || type.render.name)) ||
      null
    );
  } catch (_) {
    return null;
  }
}
