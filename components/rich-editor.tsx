"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, Heading2, Undo, Redo } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tiptap rich-text editor (spec §17 — document editor). Controlled by HTML. */
export function RichEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-doc min-h-[400px] max-w-none p-6 outline-none [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-brand-navy [&_h2]:mb-1 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-brand-navy [&_li]:ml-4 [&_li]:list-disc [&_p]:my-2 [&_ul]:my-2",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external content changes (e.g. after first load).
  useEffect(() => {
    if (editor && initialHtml && editor.isEmpty) {
      editor.commands.setContent(initialHtml);
    }
  }, [editor, initialHtml]);

  if (!editor) return null;

  const Btn = ({
    active,
    onClick,
    children,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded p-1.5 hover:bg-gray-100",
        active && "bg-secondary text-brand-navy",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-1 border-b p-1.5">
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Btn>
        <Btn
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Btn>
        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Btn>
        <div className="ml-auto flex gap-1">
          <Btn onClick={() => editor.chain().focus().undo().run()}>
            <Undo className="h-4 w-4" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()}>
            <Redo className="h-4 w-4" />
          </Btn>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
