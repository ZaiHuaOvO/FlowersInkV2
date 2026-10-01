import type {
  IdeaAnchor,
  IdeaAnchorPayload,
  IdeaAxis,
  IdeaRenderResult,
  IdeaRun,
  IdeaSegment,
} from './idea.model';

/**
 * 正文锚点引擎（纯函数，不依赖 Angular）。
 *
 * 正文由 ngx-markdown 渲染，数据一变就整块重建 DOM，所以锚点不能用 DOM 路径表达。
 * 做法是把所有可批注块的纯文本按文档序拼成一条「全局字符轴」，锚点存轴上的区间；
 * 重叠判断也就退化成数字区间相交。
 *
 * 注意：`buildAxis` 的取文本方式（哪些块、以什么顺序、块间分隔符）一旦上线就不能再改，
 * 否则历史锚点会整体错位。真要改必须同时提升后端的 anchorVersion。
 */

/** 参与批注的块级元素 */
const BLOCK_SELECTOR =
  'p,li,h1,h2,h3,h4,h5,h6,td,th,blockquote,figcaption,dt,dd';

/** 不参与批注的内容：代码块、代码块工具条、标题锚点 */
const SKIP_SELECTOR = 'pre,.markdown-clipboard-toolbar,.heading-anchor';

/** 块与块之间在轴上的分隔符，占 1 个字符 */
const RUN_SEPARATOR = '\n';

/** 存进 prefix/suffix 的上下文字数 */
const CONTEXT_LENGTH = 32;

export const IDEA_MARK_CLASS = 'fi-idea-mark';
export const IDEA_MARK_PENDING_CLASS = 'fi-idea-mark--pending';
export const IDEA_MARK_ACTIVE_CLASS = 'fi-idea-mark--active';
export const IDEA_KEY_ATTRIBUTE = 'data-idea-keys';
export const IDEA_COUNT_CLASS = 'fi-idea-count';

export const IDEA_SELECTION_MAX_LENGTH = 200;

/** 从文本节点向上找最近的、可批注的祖先块；落在代码块/锚点里则返回 null */
export function nearestBlock(
  node: Node | null,
  root: Element,
): Element | null {
  let el = node instanceof Element ? node : node?.parentElement ?? null;
  while (el && el !== root) {
    if (el.matches(SKIP_SELECTOR)) {
      return null;
    }
    if (el.matches(BLOCK_SELECTOR)) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

/** 构建全局文本轴 */
export function buildAxis(root: Element): IdeaAxis {
  const runs: IdeaRun[] = [];
  const nodeRuns = new Map<Text, IdeaRun>();
  const ownerDocument = root.ownerDocument;

  const walker = ownerDocument.createTreeWalker(
    root,
    // 已包出来的 <mark> 是普通内联元素，其文本节点照常参与，无需特判
    NodeFilter.SHOW_TEXT,
  );

  let current: IdeaRun | null = null;

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    const value = text.nodeValue ?? '';
    if (value.length === 0) {
      continue;
    }

    // 数量角标里的数字是渲染辅助元素，不属于正文，别让它进文本轴，
    // 否则选区换算出来的偏移会被这些数字带偏
    if (text.parentElement?.closest(`.${IDEA_COUNT_CLASS}`)) {
      continue;
    }

    const owner = nearestBlock(text, root);
    if (!owner) {
      // 落到代码块、图片说明之外等不可批注处：断开当前 run
      current = null;
      continue;
    }

    if (!current || current.el !== owner) {
      const previous = runs[runs.length - 1];
      const start = previous ? previous.end + RUN_SEPARATOR.length : 0;
      current = { el: owner, nodes: [], prefixes: [], start, end: start };
      runs.push(current);
    }

    current.prefixes.push(current.end - current.start);
    current.nodes.push(text);
    current.end += value.length;
    nodeRuns.set(text, current);
  }

  return {
    root,
    runs,
    text: runs.map((run) => runText(run)).join(RUN_SEPARATOR),
    nodeRuns,
  };
}

function runText(run: IdeaRun): string {
  let text = '';
  for (const node of run.nodes) {
    text += node.nodeValue ?? '';
  }
  return text;
}

/** 把 (节点, 偏移) 规约成文本节点，元素节点则按子节点顺序下钻 */
function resolveTextPoint(
  node: Node | null,
  offset: number,
): { node: Text; offset: number } | null {
  let current: Node | null = node;
  let currentOffset = offset;
  while (current && current.nodeType !== Node.TEXT_NODE) {
    if (current.childNodes.length === 0) {
      return null;
    }
    const index = Math.min(currentOffset, current.childNodes.length - 1);
    current = current.childNodes[index];
    currentOffset = 0;
  }
  return current ? { node: current as Text, offset: currentOffset } : null;
}

/** (节点, 偏移) → 全局轴偏移；不在可批注范围内返回 null */
export function pointToGlobalOffset(
  axis: IdeaAxis,
  node: Node | null,
  offset: number,
): number | null {
  const point = resolveTextPoint(node, offset);
  if (!point) {
    return null;
  }
  const run = axis.nodeRuns.get(point.node);
  if (!run) {
    return null;
  }
  const index = run.nodes.indexOf(point.node);
  if (index < 0) {
    return null;
  }
  const nodeLength = point.node.nodeValue?.length ?? 0;
  return (
    run.start + run.prefixes[index] + Math.min(Math.max(point.offset, 0), nodeLength)
  );
}

/** 去掉区间两端的空白；空区间返回 null */
function trimRange(
  axis: IdeaAxis,
  start: number,
  end: number,
): { start: number; end: number } | null {
  let from = start;
  let to = end;
  while (from < to && /\s/.test(axis.text[from])) {
    from++;
  }
  while (to > from && /\s/.test(axis.text[to - 1])) {
    to--;
  }
  return to > from ? { start: from, end: to } : null;
}

/** 区间 → 送后端的锚点数据 */
export function buildAnchorPayload(
  axis: IdeaAxis,
  start: number,
  end: number,
): IdeaAnchorPayload | null {
  const range = trimRange(axis, start, end);
  if (!range) {
    return null;
  }
  return {
    startOffset: range.start,
    endOffset: range.end,
    anchorText: axis.text.slice(range.start, range.end),
    prefix: axis.text.slice(
      Math.max(0, range.start - CONTEXT_LENGTH),
      range.start,
    ),
    suffix: axis.text.slice(range.end, range.end + CONTEXT_LENGTH),
  };
}

/** 浏览器选区 → 锚点数据；跨块选区同样支持（两端各自换算） */
export function selectionToAnchorPayload(
  axis: IdeaAxis,
  range: Range,
): IdeaAnchorPayload | null {
  const start = pointToGlobalOffset(
    axis,
    range.startContainer,
    range.startOffset,
  );
  const end = pointToGlobalOffset(axis, range.endContainer, range.endOffset);
  if (start === null || end === null || end <= start) {
    return null;
  }
  return buildAnchorPayload(axis, start, end);
}

/** 整块 → 锚点数据（移动端点段落写想法走这条） */
export function blockToAnchorPayload(
  axis: IdeaAxis,
  el: Element,
): IdeaAnchorPayload | null {
  const runs = axis.runs.filter((run) => run.el === el);
  if (runs.length === 0) {
    return null;
  }
  return buildAnchorPayload(
    axis,
    runs[0].start,
    runs[runs.length - 1].end,
  );
}

/** 前缀/后缀在原文里至少要活下来这么多字，才认为"还是同一段文字" */
const MIN_SURVIVING_AFFIX = 6;
/** 前+后缀合计至少要覆盖原文的这个比例 */
const MIN_AFFIX_COVERAGE = 0.5;
/** 在原始偏移附近多大的范围里找前缀/后缀 */
const AFFIX_TOLERANCE = 60;

/**
 * 文章可能被编辑过，锚点偏移会整体漂移。按可信度依次尝试：
 *  1. 原偏移仍精确命中 —— 什么都没改
 *  2. 全文里还能找到一模一样的原文 —— 只是整段位移了，用前后文打分挑最像的一处
 *  3. 原文本身被改过（比如删掉了中间一行）—— 用「最长公共前缀 + 最长公共后缀」
 *     把想法重新套到被改动后的那段文字上
 * 三条都失败才判定失效（返回 null，不画虚线，但想法内容仍保留在库里）
 */
export function locateAnchor(
  axis: IdeaAxis,
  anchor: IdeaAnchor,
): IdeaAnchor | null {
  const length = anchor.anchorText?.length ?? 0;
  if (length === 0) {
    return null;
  }

  if (
    axis.text.slice(anchor.startOffset, anchor.endOffset) === anchor.anchorText
  ) {
    return anchor;
  }

  const candidates: number[] = [];
  let index = axis.text.indexOf(anchor.anchorText);
  while (index !== -1) {
    candidates.push(index);
    index = axis.text.indexOf(anchor.anchorText, index + 1);
  }

  if (candidates.length > 0) {
    let best = candidates[0];
    let bestScore = -1;
    for (const candidate of candidates) {
      const score = contextScore(axis.text, candidate, anchor);
      const better =
        score > bestScore ||
        (score === bestScore &&
          Math.abs(candidate - anchor.startOffset) <
            Math.abs(best - anchor.startOffset));
      if (better) {
        bestScore = score;
        best = candidate;
      }
    }

    return {
      ...anchor,
      startOffset: best,
      endOffset: best + length,
      drifted: true,
    };
  }

  return repairByAffixes(axis, anchor);
}

/**
 * 原文被改动后的补救：在原起点附近找最长能对上的开头、在原终点附近找最长能对上的结尾，
 * 把区间重新定义为「存活的头 → 存活的尾」。删掉中间一行这种编辑正好落在这里。
 */
function repairByAffixes(axis: IdeaAxis, anchor: IdeaAnchor): IdeaAnchor | null {
  const text = axis.text;
  const target = anchor.anchorText;

  let bestPrefixStart = -1;
  let bestPrefixLength = 0;
  const prefixFrom = Math.max(0, anchor.startOffset - AFFIX_TOLERANCE);
  const prefixTo = Math.min(text.length, anchor.startOffset + AFFIX_TOLERANCE);
  for (let start = prefixFrom; start <= prefixTo; start++) {
    let matched = 0;
    while (matched < target.length && text[start + matched] === target[matched]) {
      matched++;
    }
    const closer =
      bestPrefixStart >= 0 &&
      Math.abs(start - anchor.startOffset) <
        Math.abs(bestPrefixStart - anchor.startOffset);
    if (matched > bestPrefixLength || (matched === bestPrefixLength && closer)) {
      bestPrefixLength = matched;
      bestPrefixStart = start;
    }
  }

  let bestSuffixEnd = -1;
  let bestSuffixLength = 0;
  const suffixFrom = Math.max(0, anchor.endOffset - AFFIX_TOLERANCE);
  const suffixTo = Math.min(text.length, anchor.endOffset + AFFIX_TOLERANCE);
  for (let end = suffixFrom; end <= suffixTo; end++) {
    let matched = 0;
    while (
      matched < target.length &&
      text[end - 1 - matched] === target[target.length - 1 - matched]
    ) {
      matched++;
    }
    const closer =
      bestSuffixEnd >= 0 &&
      Math.abs(end - anchor.endOffset) <
        Math.abs(bestSuffixEnd - anchor.endOffset);
    if (matched > bestSuffixLength || (matched === bestSuffixLength && closer)) {
      bestSuffixLength = matched;
      bestSuffixEnd = end;
    }
  }

  if (
    bestPrefixLength < MIN_SURVIVING_AFFIX &&
    bestSuffixLength < MIN_SURVIVING_AFFIX
  ) {
    return null;
  }

  const surviving = bestPrefixLength + bestSuffixLength;
  if (surviving < Math.max(MIN_SURVIVING_AFFIX, Math.ceil(target.length * MIN_AFFIX_COVERAGE))) {
    return null;
  }

  const start = bestPrefixStart >= 0 ? bestPrefixStart : anchor.startOffset;
  const end = Math.max(bestSuffixEnd, start + 1);
  if (end <= start || end > text.length) {
    return null;
  }

  return {
    ...anchor,
    startOffset: start,
    endOffset: end,
    anchorText: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - CONTEXT_LENGTH), start),
    suffix: text.slice(end, end + CONTEXT_LENGTH),
    drifted: true,
  };
}

function contextScore(text: string, start: number, anchor: IdeaAnchor): number {
  const prefix = anchor.prefix ?? '';
  const suffix = anchor.suffix ?? '';
  const anchorLength = anchor.anchorText.length;

  let score = 0;
  for (let i = 0; i < prefix.length; i++) {
    if (start - 1 - i < 0) {
      break;
    }
    if (text[start - 1 - i] !== prefix[prefix.length - 1 - i]) {
      break;
    }
    score++;
  }
  for (let i = 0; i < suffix.length; i++) {
    if (text[start + anchorLength + i] !== suffix[i]) {
      break;
    }
    score++;
  }
  return score;
}

/**
 * 把锚点切成每个 run 内的片段，并按重叠合并。
 * 后端已保证区间互不重叠，这里合并主要是为了防御脏数据、避免画出嵌套的 <mark>
 */
export function computeSegments(
  axis: IdeaAxis,
  anchors: IdeaAnchor[],
): Map<number, IdeaSegment[]> {
  const byRun = new Map<number, IdeaSegment[]>();

  anchors.forEach((anchor) => {
    axis.runs.forEach((run, index) => {
      const start = Math.max(anchor.startOffset, run.start) - run.start;
      const end = Math.min(anchor.endOffset, run.end) - run.start;
      if (end <= start) {
        return;
      }
      const list = byRun.get(index) ?? [];
      list.push({
        start,
        end,
        keys: [anchor.id],
        // 这段一条已通过的想法都没有（可能是别人待审核的，也可能是自己刚提交的），
        // 用更淡的虚线表示"还不能正式读"
        pendingOnly: !anchor.ideas.some((idea) => idea.isApproved),
        // 数字角标要含待审核的总数；老接口没带 ideaCount 时回退按可见想法数
        count: anchor.ideaCount ?? anchor.ideas.length,
        active: anchor.active === true,
      });
      byRun.set(index, list);
    });
  });

  byRun.forEach((list, index) => {
    byRun.set(index, mergeSegments(list));
  });

  return byRun;
}

function mergeSegments(segments: IdeaSegment[]): IdeaSegment[] {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const merged: IdeaSegment[] = [];

  for (const segment of sorted) {
    const last = merged[merged.length - 1];
    if (last && segment.start < last.end) {
      last.end = Math.max(last.end, segment.end);
      last.pendingOnly = last.pendingOnly && segment.pendingOnly;
      last.active = last.active || segment.active;
      last.count = (last.count ?? 0) + (segment.count ?? 0);
      segment.keys.forEach((key) => {
        if (!last.keys.includes(key)) {
          last.keys.push(key);
        }
      });
      continue;
    }
    merged.push({ ...segment, keys: [...segment.keys] });
  }

  return merged;
}

/** 移除所有已画的虚线，并把被拆碎的文本节点合并回去 */
export function clearIdeaMarks(root: Element): void {
  // 数字角标是 <mark> 的子元素，先摘掉，否则拆 mark 时会被当成正文文本留在轴上
  Array.from(root.querySelectorAll(`.${IDEA_COUNT_CLASS}`)).forEach((el) =>
    el.remove(),
  );

  const marks = Array.from(
    root.querySelectorAll(`mark.${IDEA_MARK_CLASS}`),
  );
  if (marks.length === 0) {
    return;
  }

  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) {
      return;
    }
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  });

  root.normalize();
}

/**
 * 画出虚线。按 run 手写 splitText + insertBefore，
 * 不用 surroundContents —— 选区跨到 strong/em/a 等元素边界时它会直接抛异常
 */
export function renderIdeaMarks(
  axis: IdeaAxis,
  segments: Map<number, IdeaSegment[]>,
): void {
  const ownerDocument = axis.root.ownerDocument;

  segments.forEach((list, runIndex) => {
    const run = axis.runs[runIndex];
    if (!run) {
      return;
    }

    // 从右往左处理：splitText 不会影响已处理过的右侧偏移
    [...list]
      .sort((a, b) => b.start - a.start)
      .forEach((segment) => {
        // active 优先：浮窗正对着的这段用高亮样式，而不是"待审核"的淡虚线
        const classNames = [IDEA_MARK_CLASS];
        if (segment.active) {
          classNames.push(IDEA_MARK_ACTIVE_CLASS);
        } else if (segment.pendingOnly) {
          classNames.push(IDEA_MARK_PENDING_CLASS);
        }
        const className = classNames.join(' ');

        let cursor = 0;
        run.nodes.forEach((node) => {
          const nodeStart = cursor;
          const nodeLength = node.nodeValue?.length ?? 0;
          const nodeEnd = cursor + nodeLength;
          cursor = nodeEnd;

          if (node.parentElement?.closest(`.${IDEA_MARK_CLASS}`)) {
            return;
          }

          const from = Math.max(segment.start, nodeStart);
          const to = Math.min(segment.end, nodeEnd);
          if (to <= from) {
            return;
          }

          let target = node;
          // 注意 splitText 的返回值是切分后**右半部分**的新节点。
          // 先切掉右侧丢弃它（node 自己变成 [0, to)），再从左侧切一刀，
          // 这次返回值才正好是要包起来的 [from, to)。
          if (to - nodeStart < nodeLength) {
            node.splitText(to - nodeStart);
          }
          if (from - nodeStart > 0) {
            target = target.splitText(from - nodeStart);
          }

          const parent = target.parentNode;
          if (!parent) {
            return;
          }

          const mark = ownerDocument.createElement('mark');
          mark.className = className;
          mark.setAttribute(IDEA_KEY_ATTRIBUTE, segment.keys.join(','));
          mark.setAttribute('role', 'button');
          mark.setAttribute('tabindex', '0');
          parent.insertBefore(mark, target);
          mark.appendChild(target);

          // 数字角标挂在整段虚线的末尾（segment.end 落在这个节点上），
          // 说明这是这段的最后一个 <mark>，只在这里挂一个角标
          if (to === segment.end && (segment.count ?? 0) > 0) {
            const count = ownerDocument.createElement('span');
            count.className = IDEA_COUNT_CLASS;
            count.textContent = String(segment.count);
            mark.appendChild(count);
          }
        });
      });
  });
}

/**
 * 一次性完成「清干净 → 建轴 → 校正 → 画虚线」。
 *
 * 返回新构建的文本轴：画虚线时 splitText 拆分了文本节点，
 * 后续再把用户选区换算成偏移必须用新轴，否则选区落在拆分出的节点上会查不到位置。
 * 另外把「位置漂移过、已被自动救回」的锚点一并交出去，调用方可以回写后端让数据收敛。
 */
export function applyIdeaMarks(
  root: Element,
  anchors: IdeaAnchor[],
): IdeaRenderResult {
  clearIdeaMarks(root);

  const axis = buildAxis(root);
  const located = anchors
    .map((anchor) => locateAnchor(axis, anchor))
    .filter((anchor): anchor is IdeaAnchor => anchor !== null);

  if (located.length > 0) {
    renderIdeaMarks(axis, computeSegments(axis, located));
  }

  return {
    axis: buildAxis(root),
    // 只回报真实存在的锚点（前端临时造的那条 id 是负数）
    drifted: located.filter((anchor) => anchor.drifted === true && anchor.id > 0),
  };
}

