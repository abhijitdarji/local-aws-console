'use client';

import type { EditorProps, Monaco } from '@monaco-editor/react';
import dynamic from 'next/dynamic';
import { useCallback, useRef } from 'react';

type EditorRef = Parameters<NonNullable<EditorProps['onMount']>>[0];

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGE_ID = 'cwl-insights';

const COMMANDS = [
  'fields',
  'display',
  'filter',
  'parse',
  'sort',
  'limit',
  'stats',
  'dedup',
  'pattern',
];
const KEYWORDS = ['and', 'as', 'asc', 'by', 'desc', 'group', 'in', 'like', 'not', 'or'];
const FUNCTIONS = [
  'abs',
  'avg',
  'bin',
  'ceil',
  'coalesce',
  'concat',
  'count',
  'count_distinct',
  'datefloor',
  'dateceil',
  'earliest',
  'floor',
  'fromMillis',
  'greatest',
  'isEmpty',
  'isPresent',
  'isBlank',
  'isValidIp',
  'isValidIpV4',
  'isValidIpV6',
  'isIpInSubnet',
  'isIpv4InSubnet',
  'isIpv6InSubnet',
  'latest',
  'least',
  'log',
  'ltrim',
  'max',
  'median',
  'min',
  'mod',
  'pct',
  'pow',
  'replace',
  'rtrim',
  'sortsFirst',
  'sortsLast',
  'strcontains',
  'strlen',
  'sqrt',
  'stddev',
  'substr',
  'sum',
  'toMillis',
  'toLower',
  'toUpper',
  'trim',
  'unmask',
];
const SYSTEM_FIELDS = ['@timestamp', '@message', '@log', '@logStream'];
const OPERATORS = ['=', '!=', '<=', '>=', '|'];

function registerInsightsLanguage(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((l: { id: string }) => l.id === LANGUAGE_ID)) return;

  monaco.languages.register({ id: LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, {
    defaultToken: 'invalid',
    ignoreCase: true,
    keywords: KEYWORDS,
    commands: COMMANDS,
    functions: FUNCTIONS,
    systemFields: SYSTEM_FIELDS,
    operators: OPERATORS,
    tokenizer: {
      root: [
        { include: '@comments' },
        { include: '@whitespace' },
        { include: '@regexp' },
        { include: '@systemFields' },
        { include: '@numbers' },
        { include: '@strings' },
        [/[,]/, 'delimiter'],
        [/[()]/, '@brackets'],
        [
          /[\w@#$]+/g,
          {
            cases: {
              '@commands': 'keyword',
              '@keywords': 'keyword',
              '@functions': 'key',
              '@operators': 'operator',
              '@default': 'identifier',
            },
          },
        ],
        [/[<>=!%&+\-*/|~^]/, 'operator'],
      ],
      comments: [[/#.*$/, 'comment']],
      whitespace: [[/\s+/, 'white']],
      regexp: [[/\/(?=([^\\/]|\\.)+\/([gi]*)(\s*)(\.|;|\/|,|\)|\]|\}|$)*)/, 'regexp']],
      systemFields: [
        [/[@][\w]+/, { cases: { '@systemFields': 'emphasis', '@default': 'identifier' } }],
      ],
      numbers: [[/-?\d+(\.\d+)?/, 'number']],
      strings: [[/'([^']*)'|"([^"]*)"/, 'string']],
    },
  } as Parameters<typeof monaco.languages.setMonarchTokensProvider>[1]);

  monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
    triggerCharacters: [',', ' '],
    provideCompletionItems: (
      _model: unknown,
      _position: unknown,
      _context: unknown,
      _token: unknown,
    ) => {
      const wordRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      };
      const suggestions = [
        ...COMMANDS.map((c) => ({
          label: c,
          detail: `command`,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: c,
          range: wordRange,
        })),
        ...KEYWORDS.map((k) => ({
          label: k,
          detail: `keyword`,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: k,
          range: wordRange,
        })),
        ...FUNCTIONS.map((f) => ({
          label: f,
          detail: `function`,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: f,
          range: wordRange,
        })),
        ...SYSTEM_FIELDS.map((s) => ({
          label: s,
          detail: `system field`,
          kind: monaco.languages.CompletionItemKind.Field,
          insertText: s,
          range: wordRange,
        })),
        {
          label: 'parse (snippet)',
          detail: 'command snippet',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'parse ${1:@message} "${2:pattern}" as ${3:alias}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range: wordRange,
        },
      ];
      return { suggestions };
    },
  });

  monaco.languages.registerDocumentFormattingEditProvider(LANGUAGE_ID, {
    provideDocumentFormattingEdits(model: {
      getValue: () => string;
      getFullModelRange: () => unknown;
    }) {
      const updated = model
        .getValue()
        .split('|')
        .map((line: string) => line.trim().replace(/\\n/g, '').replace(/\\"/g, '"'))
        .join('\n| ');
      return [{ text: updated, range: model.getFullModelRange() }];
    },
  });
}

type Props = {
  value: string;
  onChange: (text: string) => void;
  height?: number;
};

export function LogsInsightsEditor({ value, onChange, height = 120 }: Props) {
  const editorRef = useRef<EditorRef | null>(null);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    registerInsightsLanguage(monaco);
  }, []);

  const handleMount = useCallback(
    (ed: EditorRef) => {
      editorRef.current = ed;
      ed.onDidChangeModelContent(() => {
        onChange(ed.getValue());
      });
    },
    [onChange],
  );

  const options: EditorProps['options'] = {
    minimap: { enabled: false },
    wordWrap: 'on',
    wrappingIndent: 'indent',
    wrappingStrategy: 'advanced',
    lineNumbers: 'off',
    scrollBeyondLastLine: false,
    overviewRulerLanes: 0,
  };

  return (
    <MonacoEditor
      height={height}
      defaultLanguage={LANGUAGE_ID}
      value={value}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      options={options}
    />
  );
}
