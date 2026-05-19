// ========================================
// Grammar Highlight — TipTap Extension
// ProseMirror plugin for inline grammar error decorations
// ========================================
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const grammarPluginKey = new PluginKey('grammarHighlight');

const ERROR_CLASSES = {
  grammar: 'grammar-error grammar-error--grammar',
  spelling: 'grammar-error grammar-error--spelling',
  punctuation: 'grammar-error grammar-error--punctuation',
  style: 'grammar-error grammar-error--style',
};

export const GrammarHighlight = Extension.create({
  name: 'grammarHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: grammarPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldSet) {
            const meta = tr.getMeta(grammarPluginKey);
            if (meta !== undefined) {
              return meta;
            }
            return oldSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

export function setGrammarDecorations(editor, errors) {
  if (!editor?.view) return;

  const { state } = editor.view;
  const decorations = [];

  for (const error of errors) {
    if (error.from >= 0 && error.to > error.from && error.to <= state.doc.content.size) {
      const cssClass = ERROR_CLASSES[error.type] || ERROR_CLASSES.grammar;
      decorations.push(
        Decoration.inline(error.from, error.to, {
          class: cssClass,
          'data-error-id': error.id,
          'data-error-type': error.type,
          'data-error-reason': error.reason,
          'data-error-replacement': error.replacement,
        })
      );
    }
  }

  const decorationSet = DecorationSet.create(state.doc, decorations);
  const tr = state.tr.setMeta(grammarPluginKey, decorationSet);
  editor.view.dispatch(tr);
}

export function clearGrammarDecorations(editor) {
  if (!editor?.view) return;
  const { state } = editor.view;
  const tr = state.tr.setMeta(grammarPluginKey, DecorationSet.empty);
  editor.view.dispatch(tr);
}
