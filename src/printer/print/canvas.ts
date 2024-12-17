import { Doc, doc } from 'prettier'

import { isBranchedTag, NamedTags, NodeTypes } from '@/parser'
import {
  AstPath,
  CanvasAstPath,
  CanvasBranch,
  CanvasBranchNamed,
  CanvasParserOptions,
  CanvasPrinter,
  CanvasPrinterArgs,
  CanvasTag,
  CanvasTagNamed,
  CanvasVariableOutput,
} from '@/types'

import {
  FORCE_FLAT_GROUP_ID,
  getWhitespaceTrim,
  hasMeaningfulLackOfDanglingWhitespace,
  hasMeaningfulLackOfLeadingWhitespace,
  hasMeaningfulLackOfTrailingWhitespace,
  isAttributeNode,
  isDeeplyNested,
  isEmpty,
  last,
  markupLines,
  originallyHadLineBreaks,
  shouldPreserveContent,
  trim,
} from '../utils'
import { assertNever } from '@/utils'
import { printChildren } from './children'

const CANVAS_TAGS_THAT_ALWAYS_BREAK = ['for']

const { builders, utils } = doc
const { group, hardline, ifBreak, indent, join, line, softline, literalline } = builders
const { replaceEndOfLine } = doc.utils as any

export function printCanvasVariableOutput(
  path: CanvasAstPath,
  _options: CanvasParserOptions,
  print: CanvasPrinter,
  { leadingSpaceGroupId, trailingSpaceGroupId }: CanvasPrinterArgs
) {
  const node: CanvasVariableOutput = path.node as CanvasVariableOutput

  const whitespaceStart = getWhitespaceTrim(
    node.whitespaceStart,
    hasMeaningfulLackOfLeadingWhitespace(node),
    leadingSpaceGroupId
  )
  const whitespaceEnd = getWhitespaceTrim(
    node.whitespaceEnd,
    hasMeaningfulLackOfTrailingWhitespace(node),
    trailingSpaceGroupId
  )

  if (typeof node.markup !== 'string') {
    const whitespace = node.markup.filters.length > 0 ? line : ' '
    return group([
      '{{',
      whitespaceStart,
      indent([whitespace, path.call((p: any) => print(p), 'markup')]),
      whitespace,
      whitespaceEnd,
      '}}',
    ])
  }

  const lines = markupLines(node.markup)
  if (lines.length > 1) {
    return group([
      '{{',
      whitespaceStart,
      indent([hardline, join(hardline, lines.map(trim))]),
      hardline,
      whitespaceEnd,
      '}}',
    ])
  }

  return group(['{{', whitespaceStart, ' ', node.markup, ' ', whitespaceEnd, '}}'])
}

function printNamedCanvasBlockStart(
  path: AstPath<CanvasTagNamed | CanvasBranchNamed>,
  _options: CanvasParserOptions,
  print: CanvasPrinter,
  args: CanvasPrinterArgs,
  whitespaceStart: Doc,
  whitespaceEnd: Doc
): Doc {
  const node = path.node
  const { isCanvasStatement } = args

  const { wrapper, prefix, suffix } = (() => {
    if (isCanvasStatement) {
      return {
        wrapper: utils.removeLines,
        prefix: '',
        suffix: () => '',
      }
    } else {
      return {
        wrapper: group,
        prefix: ['{%', whitespaceStart, ' '],
        suffix: (trailingWhitespace: Doc) => [trailingWhitespace, whitespaceEnd, '%}'],
      }
    }
  })()

  const tag = (trailingWhitespace: Doc) =>
    wrapper([
      ...prefix,
      node.name,
      ' ',
      indent(path.call((p: any) => print(p, args), 'markup')),
      ...suffix(trailingWhitespace),
    ])

  switch (node.name) {
    case NamedTags.do: {
      const trailingWhitespace = node.markup.filters.length > 0 ? line : ' '

      return tag(trailingWhitespace)
    }

    case NamedTags.include: {
      console.log('namedtags: include')

      return ''
    }

    case NamedTags.set: {
      const trailingWhitespace = node.markup.value.filters.length > 0 ? line : ' '
      return tag(trailingWhitespace)
    }

    case NamedTags.if:
    case NamedTags.elseif: {
      const trailingWhitespace = [NodeTypes.Comparison, NodeTypes.LogicalExpression].includes(
        node.markup.type
      )
        ? line
        : ' '

      return tag(trailingWhitespace)
    }

    default: {
      return assertNever(node)
    }
  }
}

export function printCanvasBlockStart(
  path: AstPath<CanvasTag | CanvasBranch>,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  args: CanvasPrinterArgs
): Doc {
  const node = path.node
  const { leadingSpaceGroupId, trailingSpaceGroupId } = args

  if (!node.name) return ''

  const whitespaceStart = getWhitespaceTrim(
    node.whitespaceStart,
    needsBlockStartLeadingWhitespaceStrippingOnBreak(node),
    leadingSpaceGroupId
  )
  const whitespaceEnd = getWhitespaceTrim(
    node.whitespaceEnd,
    needsBlockStartTrailingWhitespaceStrippingOnBreak(node),
    trailingSpaceGroupId
  )

  if (typeof node.markup !== 'string') {
    return printNamedCanvasBlockStart(
      path as AstPath<CanvasTagNamed | CanvasBranchNamed>,
      options,
      print,
      args,
      whitespaceStart,
      whitespaceEnd
    )
  }

  if (args.isCanvasStatement) {
    console.log('isCanvasStatement')
  }

  const lines = markupLines(node.markup)

  if (lines.length > 1) {
    console.log('lines:', lines)
  }

  const markup = node.markup
  return group([
    '{%',
    whitespaceStart,
    ' ',
    node.name,
    markup ? ` ${markup}` : '',
    ' ',
    whitespaceEnd,
    '%}',
  ])
}

export function printCanvasBlockEnd(
  path: AstPath<CanvasTag>,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  args: CanvasPrinterArgs
) {
  const node = path.node
  const { isCanvasStatement, leadingSpaceGroupId, trailingSpaceGroupId } = args

  if (!node.children || !node.blockEndPosition) return ''
  if (isCanvasStatement) {
    return ['end', node.name]
  }

  const whitespaceStart = getWhitespaceTrim(
    node.delimiterWhitespaceStart ?? '',
    needsBlockEndLeadingWhitespaceStrippingOnBreak(node),
    leadingSpaceGroupId
  )
  const whitespaceEnd = getWhitespaceTrim(
    node.delimiterWhitespaceEnd ?? '',
    hasMeaningfulLackOfTrailingWhitespace(node),
    trailingSpaceGroupId
  )

  return group(['{%', whitespaceStart, ` end${node.name} `, whitespaceEnd, '%}'])
}

function getNodeContent(node: CanvasTag) {
  if (!node.children || !node.blockEndPosition) return ''
  return node.source.slice(node.blockStartPosition.end, node.blockEndPosition.start)
}

export function printCanvasTag(
  path: AstPath<CanvasTag>,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  args: CanvasPrinterArgs
): Doc {
  const { leadingSpaceGroupId, trailingSpaceGroupId } = args
  const node = path.node
  if (!node.children || !node.blockEndPosition) {
    return printCanvasBlockStart(path, options, print, args)
  }

  if (!args.isCanvasStatement && shouldPreserveContent(node)) {
    return [
      printCanvasBlockStart(path, options, print, {
        ...args,
        leadingSpaceGroupId,
        trailingSpaceGroupId: FORCE_FLAT_GROUP_ID,
      }),
      ...replaceEndOfLine(getNodeContent(node)),
      printCanvasBlockEnd(path, options, print, {
        ...args,
        leadingSpaceGroupId: FORCE_FLAT_GROUP_ID,
        trailingSpaceGroupId,
      }),
    ]
  }

  const tagGroupId = Symbol('tag-group')
  const blockStart = printCanvasBlockStart(path, options, print, {
    ...args,
    leadingSpaceGroupId,
    trailingSpaceGroupId: tagGroupId,
  }) // {% if ... %}
  const blockEnd = printCanvasBlockEnd(path, options, print, {
    ...args,
    leadingSpaceGroupId: tagGroupId,
    trailingSpaceGroupId,
  }) // {% endif %}

  let body: Doc = []

  if (isBranchedTag(node)) {
    body = cleanDoc(
      path.map(
        (p) =>
          print(p, {
            ...args,
            leadingSpaceGroupId: tagGroupId,
            trailingSpaceGroupId: tagGroupId,
          }),
        'children'
      )
    )
  } else if (node.children.length > 0) {
    body = indent([
      innerLeadingWhitespace(node),
      printChildren(path, options, print, {
        ...args,
        leadingSpaceGroupId: tagGroupId,
        trailingSpaceGroupId: tagGroupId,
      }),
    ])
  }

  return group([blockStart, body, innerTrailingWhitespace(node, args), blockEnd], {
    id: tagGroupId,
    shouldBreak:
      CANVAS_TAGS_THAT_ALWAYS_BREAK.includes(node.name) ||
      originallyHadLineBreaks(path, options) ||
      isAttributeNode(node) ||
      isDeeplyNested(node),
  })
}

function innerLeadingWhitespace(node: CanvasTag | CanvasBranch) {
  if (!node.firstChild) {
    if (node.isDanglingWhitespaceSensitive && node.hasDanglingWhitespace) {
      return line
    } else {
      return ''
    }
  }

  if (node.firstChild.hasLeadingWhitespace && node.firstChild.isLeadingWhitespaceSensitive) {
    return line
  }

  return softline
}

function innerTrailingWhitespace(node: CanvasTag | CanvasBranch, args: CanvasPrinterArgs) {
  if (
    (!args.isCanvasStatement && shouldPreserveContent(node)) ||
    node.type === NodeTypes.CanvasBranch ||
    !node.blockEndPosition ||
    !node.lastChild
  ) {
    return ''
  }

  if (node.lastChild.hasTrailingWhitespace && node.lastChild.isTrailingWhitespaceSensitive) {
    return line
  }

  return softline
}

export function printCanvasDefaultBranch(
  path: AstPath<CanvasBranch>,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  args: CanvasPrinterArgs
): Doc {
  const branch = path.node
  const parentNode: CanvasTag = path.getParentNode() as any

  // When the node is empty and the parent is empty. The space will come
  // from the trailingWhitespace of the parent. When this happens, we don't
  // want the branch to print another one so we collapse it.
  // e.g. {% if A %} {% endif %}
  const shouldCollapseSpace = isEmpty(branch.children) && parentNode.children!.length === 1
  if (shouldCollapseSpace) return ''

  // When the branch is empty and doesn't have whitespace, we don't want
  // anything so print nothing.
  // e.g. {% if A %}{% endif %}
  // e.g. {% if A %}{% else %}...{% endif %}
  const isBranchEmptyWithoutSpace = isEmpty(branch.children) && !branch.hasDanglingWhitespace
  if (isBranchEmptyWithoutSpace) return ''

  // If the branch does not break, is empty and had whitespace, we might
  // want a space in there. We don't collapse those because the trailing
  // whitespace does not come from the parent.
  // {% if A %} {% else %}...{% endif %}
  if (branch.hasDanglingWhitespace) {
    return ifBreak('', ' ')
  }

  const shouldAddTrailingNewline =
    branch.next &&
    branch.children.length > 0 &&
    branch.source
      .slice(last(branch.children).position.end, branch.next.position.start)
      .replace(/ |\t/g, '').length >= 2

  return indent([
    innerLeadingWhitespace(parentNode),
    printChildren(path, options, print, args),
    shouldAddTrailingNewline ? literalline : '',
  ])
}

export function printCanvasBranch(
  path: AstPath<CanvasBranch>,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  args: CanvasPrinterArgs
): Doc {
  const branch = path.node
  const isDefaultBranch = !branch.name

  if (isDefaultBranch) {
    return printCanvasDefaultBranch(path, options, print, args)
  }

  const leftSibling = branch.prev as CanvasBranch | undefined

  // When the left sibling is empty, its trailing whitespace is its leading
  // whitespace. So we should collapse it here and ignore it.
  const shouldCollapseSpace = leftSibling && isEmpty(leftSibling.children)
  const outerLeadingWhitespace =
    branch.hasLeadingWhitespace && !shouldCollapseSpace ? line : softline
  const shouldAddTrailingNewline =
    branch.next &&
    branch.children.length > 0 &&
    branch.source
      .slice(last(branch.children).position.end, branch.next.position.start)
      .replace(/ |\t/g, '').length >= 2

  return [
    outerLeadingWhitespace,
    printCanvasBlockStart(path as AstPath<CanvasBranch>, options, print, args),
    indent([
      innerLeadingWhitespace(branch),
      printChildren(path, options, print, args),
      shouldAddTrailingNewline ? literalline : '',
    ]),
  ]
}

function needsBlockStartLeadingWhitespaceStrippingOnBreak(node: CanvasTag | CanvasBranch): boolean {
  switch (node.type) {
    case NodeTypes.CanvasTag: {
      return !isAttributeNode(node) && hasMeaningfulLackOfLeadingWhitespace(node)
    }

    case NodeTypes.CanvasBranch: {
      return (
        !isAttributeNode(node.parentNode! as CanvasTag) &&
        hasMeaningfulLackOfLeadingWhitespace(node)
      )
    }

    default: {
      return assertNever(node)
    }
  }
}

function needsBlockStartTrailingWhitespaceStrippingOnBreak(
  node: CanvasTag | CanvasBranch
): boolean {
  switch (node.type) {
    case NodeTypes.CanvasTag: {
      if (isBranchedTag(node)) {
        return needsBlockStartLeadingWhitespaceStrippingOnBreak(node.firstChild! as CanvasBranch)
      }

      if (!node.children) {
        return hasMeaningfulLackOfTrailingWhitespace(node)
      }

      return isEmpty(node.children)
        ? hasMeaningfulLackOfDanglingWhitespace(node)
        : hasMeaningfulLackOfLeadingWhitespace(node.firstChild!)
    }

    case NodeTypes.CanvasBranch: {
      if (isAttributeNode(node.parentNode! as CanvasTag)) {
        return false
      }

      return node.firstChild
        ? hasMeaningfulLackOfLeadingWhitespace(node.firstChild)
        : hasMeaningfulLackOfDanglingWhitespace(node)
    }

    default: {
      return assertNever(node)
    }
  }
}

function needsBlockEndLeadingWhitespaceStrippingOnBreak(node: CanvasTag): boolean {
  if (!node.children) {
    throw new Error(
      'Should only call needsBlockEndLeadingWhitespaceStrippingOnBreak for tags that have closing tags'
    )
  } else if (isAttributeNode(node)) {
    return false
  } else if (isBranchedTag(node)) {
    return hasMeaningfulLackOfTrailingWhitespace(node.lastChild!)
  } else if (isEmpty(node.children)) {
    return hasMeaningfulLackOfDanglingWhitespace(node)
  } else {
    return hasMeaningfulLackOfTrailingWhitespace(node.lastChild!)
  }
}

function cleanDoc(doc: Doc[]): Doc[] {
  return doc.filter((x) => x !== '')
}
