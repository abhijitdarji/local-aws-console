import Editor, { Monaco } from '@monaco-editor/react';
import { useRef } from "react";
import { editor } from "monaco-editor";

type LogsInsightsEditorProps = {
    onTextChange: (text: string) => void;
    defaultValue: string;
}

export const LogsInsightsEditor = ({ onTextChange, defaultValue }: LogsInsightsEditorProps) => {

    const monacoRef = useRef<Monaco>(null);
    const LANGUAGE_ID = 'insights';

    const handleEditorWillMount = (monaco: Monaco) => {
        // here is the monaco instance
        // do something before editor is mounted
        //monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

        const commands = [
            'fields',
            'display',
            'filter',
            'parse',
            'sort',
            'limit',
            'stats',
            'dedup',
            'pattern'
        ];

        const keywords = [
            'and',
            'as',
            'asc',
            'by',
            'desc',
            'group',
            'in',
            'like',
            'not',
            'or'
        ];

        const functions = [
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
            'unmask'
        ];

        const systemFields = [
            '@timestamp',
            '@message',
            '@log',
            '@logStream'
        ];

        const operators = [
            '=',
            '!=',
            '<=',
            '>=',
            '|'
        ];

        monaco.languages.register({ id: LANGUAGE_ID });
        monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, {
            defaultToken: 'invalid',
            start: 'root',
            ignoreCase: true,
            keywords: keywords,
            commands: commands,
            functions: functions,
            systemFields: systemFields,
            operators: operators,
            tokenizer: {
                root: [
                    {
                        include: '@comments'
                    },
                    {
                        include: '@whitespace'
                    },
                    {
                        include: '@regexp'
                    },
                    {
                        include: '@systemFields'
                    },
                    {
                        include: '@numbers'
                    },
                    {
                        include: '@strings'
                    },
                    [
                        /[,]/,
                        'delimiter'
                    ],
                    [
                        /[()]/,
                        '@brackets'
                    ],
                    [
                        /[\w@#$]+/g,
                        {
                            cases: {
                                '@commands': 'keyword',
                                '@keywords': 'keyword',
                                '@functions': 'key',
                                '@operators': 'operator',
                                '@default': 'identifier',
                            }
                        }
                    ],
                    [
                        /[<>=!%&+\-*/|~^]/,
                        'operator'
                    ]
                ],
                comments: [
                    [
                        /#.*$/,
                        'comment'
                    ]
                ],
                whitespace: [
                    [
                        /\s+/,
                        'white'
                    ]
                ],
                regexp: [
                    [
                        /\/(?=([^\\/]|\\.)+\/([gi]*)(\s*)(\.|;|\/|,|\)|\]|\}|$)*)/,
                        'regexp'
                    ]
                ],
                systemFields: [
                    [
                        /[@][\w]+/,
                        {
                            cases: {
                                '@systemFields': 'emphasis',
                                '@default': 'identifier'
                            }
                        }
                    ]
                ],
                numbers: [
                    [
                        /-?\d+(\.\d+)?/,
                        'number'
                    ]
                ],
                strings: [
                    [
                        /'([^']*)'|"([^"]*)"/,
                        'string'
                    ]
                ]
            }
        });

        // monaco.editor.defineTheme(LANGUAGE_ID, {
        //     base: 'vs',
        //     inherit: true,
        //     rules: [
        //         { token: 'keyword', foreground: '#569cd6', fontStyle: 'bold' },
        //         { token: 'key', foreground: '#9cdcfe' },
        //         { token: 'comment', foreground: '#608b4e' },
        //         { token: 'string', foreground: '#ce9178' },
        //         { token: 'variable', foreground: '#006699' },
        //         { token: 'regexp', foreground: '#b46695' },
        //     ],
        //     colors: {
        //         "editor.foreground": "#000000",
        //     }
        // });
        // monaco.editor.setTheme(LANGUAGE_ID);

        monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
            provideCompletionItems: (model: any, position: any) => {
                const suggestions: any = [
                    ...commands.map(command => ({
                        detail: `command ${command}`,
                        label: command,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: command
                    })),
                    ...keywords.map(keyword => ({
                        detail: `keyword ${keyword}`,
                        label: keyword,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: keyword
                    })),
                    ...functions.map(func => ({
                        detail: `function ${func}`,
                        label: func,
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: func
                    })),
                    ...systemFields.map(field => ({
                        detail: `system field ${field}`,
                        label: field,
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: field
                    })),
                    {
                        detail: 'command snippet parse',
                        label: 'parse',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'parse ${1:@message} "${2:pattern}" as ${3:alias1}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    }
                ];

                return { suggestions: suggestions };
            },
            triggerCharacters: [',', ' '] // trigger on space and comma
        });

        monaco.languages.registerDocumentFormattingEditProvider(LANGUAGE_ID, {
            provideDocumentFormattingEdits(model: any, options: any, token: any) {
                const updatedValue = model.getValue().split('|')
                    .map((line: string) => line.trim().replace(/\\n/g, '').replace(/\\"/g, '"'))
                    .join('\n| ');
                return [{
                    text: updatedValue,
                    range: model.getFullModelRange()
                }];
            }
        });

    }

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        // here is another way to get monaco instance
        // you can also store it in `useRef` for further usage
        // @ts-ignore
        monacoRef.current = monaco;
        editor.onDidChangeModelContent(() => {
            onTextChange(editor.getValue());
        });
    }

    const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
        // contextmenu: false,
        minimap: { enabled: false },
        wordWrap: 'on',
        wrappingIndent: 'indent',
        wrappingStrategy: 'advanced'
    };

    return <>

        <Editor
            className='insights-editor'
            defaultLanguage={LANGUAGE_ID}
            defaultValue={defaultValue}
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            options={defaultOptions}
        />

    </>
}