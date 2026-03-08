import { useRef, useCallback } from "react";
import {
  Bold, Italic, Strikethrough, List, ListOrdered, AlignLeft,
  AlignCenter, AlignRight, Link as LinkIcon, Undo, Redo, Heading1, Heading2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  variables?: { key: string; label: string }[];
}

const RichTextEditor = ({ content, onChange, variables = [] }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertVariable = (variable: string) => {
    const selection = window.getSelection();
    if (selection && editorRef.current) {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.style.backgroundColor = "hsl(168, 72%, 32%, 0.1)";
      span.style.padding = "1px 4px";
      span.style.borderRadius = "4px";
      span.style.fontFamily = "monospace";
      span.style.fontSize = "0.85em";
      span.textContent = `{{${variable}}}`;
      range.deleteContents();
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      onChange(editorRef.current.innerHTML);
    }
  };

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  const formatBlock = (tag: string) => {
    exec("formatBlock", tag);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-muted/50 border-b">
        <Toggle size="sm" onPressedChange={() => exec("bold")}>
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onPressedChange={() => exec("italic")}>
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onPressedChange={() => exec("strikeThrough")}>
          <Strikethrough className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Toggle size="sm" onPressedChange={() => formatBlock("h1")}>
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onPressedChange={() => formatBlock("h2")}>
          <Heading2 className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Toggle size="sm" onPressedChange={() => exec("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onPressedChange={() => exec("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Toggle size="sm" onPressedChange={() => exec("justifyLeft")}>
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onPressedChange={() => exec("justifyCenter")}>
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onPressedChange={() => exec("justifyRight")}>
          <AlignRight className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Toggle size="sm" onPressedChange={setLink}>
          <LinkIcon className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button type="button" variant="ghost" size="sm" onClick={() => exec("undo")}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => exec("redo")}>
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Variables bar */}
      {variables.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-muted/30 border-b">
          <span className="text-xs font-medium text-muted-foreground mr-1">Insert Variable:</span>
          {variables.map((v) => (
            <Button
              key={v.key}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => insertVariable(v.key)}
            >
              {`{{${v.key}}}`}
            </Button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="p-4 min-h-[300px] focus:outline-none prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
      />
    </div>
  );
};

export default RichTextEditor;
