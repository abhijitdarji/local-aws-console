import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';

type ViewCodeProps = {
    height?: string;
    language?: string;
    code: string;
    options?: editor.IStandaloneEditorConstructionOptions;
}

// https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html
const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    contextmenu: false,
    minimap: { enabled: false },
    wordWrap: 'on',
    wrappingIndent: 'indent',
    wrappingStrategy: 'advanced'
};

export const ViewCode = ({ height, language, code, options }: ViewCodeProps) => {

    if (!height) height = "600px";
    if (!language) language = "txt";

    options = !options ? defaultOptions : { ...defaultOptions, ...options };

    return (
        <>
            <Editor
                height={height}
                defaultLanguage={language}
                options={options}
                defaultValue={code}
            />
        </>
    );
}