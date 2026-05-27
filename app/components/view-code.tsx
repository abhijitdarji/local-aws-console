'use client';

import type { EditorProps } from '@monaco-editor/react';
import dynamic from 'next/dynamic';

// Monaco is large — load it only on the client, never during SSR
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const DEFAULT_OPTIONS: EditorProps['options'] = {
  contextmenu: false,
  minimap: { enabled: false },
  wordWrap: 'on',
  wrappingIndent: 'indent',
  wrappingStrategy: 'advanced',
  readOnly: true,
};

type Props = {
  code: string;
  language?: string;
  height?: string;
  options?: EditorProps['options'];
};

export function ViewCode({ code, language = 'json', height = '400px', options }: Props) {
  return (
    <Editor
      height={height}
      defaultLanguage={language}
      value={code}
      options={{ ...DEFAULT_OPTIONS, ...options }}
    />
  );
}
