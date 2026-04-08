// ========================================
// Export Service — WriteAI
// Supports: Markdown, Plain Text, HTML, PDF
// ========================================

/**
 * Trigger a file download in the browser
 */
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sanitize filename (remove special chars)
 */
function sanitize(name) {
  return (name || 'Untitled').replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s\-_]/g, '').trim() || 'Untitled';
}

/**
 * Convert HTML to plain text
 */
export function htmlToPlainText(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Convert TipTap HTML to Markdown
 */
export function htmlToMarkdown(html) {
  const div = document.createElement('div');
  div.innerHTML = html;

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(processNode).join('');

    switch (tag) {
      case 'h1': return `# ${children}\n\n`;
      case 'h2': return `## ${children}\n\n`;
      case 'h3': return `### ${children}\n\n`;
      case 'p': return `${children}\n\n`;
      case 'strong': case 'b': return `**${children}**`;
      case 'em': case 'i': return `*${children}*`;
      case 'u': return `<u>${children}</u>`;
      case 's': return `~~${children}~~`;
      case 'code':
        if (node.parentElement?.tagName?.toLowerCase() === 'pre') return children;
        return `\`${children}\``;
      case 'pre': return `\`\`\`\n${children}\n\`\`\`\n\n`;
      case 'blockquote': return `> ${children.replace(/\n\n$/, '')}\n\n`;
      case 'a': {
        const href = node.getAttribute('href') || '';
        return `[${children}](${href})`;
      }
      case 'img': {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || 'image';
        return `![${alt}](${src})\n\n`;
      }
      case 'br': return '\n';
      case 'hr': return '---\n\n';

      // Lists
      case 'ul': {
        const isTaskList = node.getAttribute('data-type') === 'taskList';
        if (isTaskList) {
          return Array.from(node.children).map(li => {
            const checked = li.getAttribute('data-checked') === 'true';
            const text = Array.from(li.childNodes)
              .filter(n => n.tagName?.toLowerCase() === 'div' || n.nodeType === Node.TEXT_NODE)
              .map(processNode).join('').trim();
            return `- [${checked ? 'x' : ' '}] ${text}\n`;
          }).join('') + '\n';
        }
        return Array.from(node.children).map(li => {
          return `- ${processNode(li).trim()}\n`;
        }).join('') + '\n';
      }
      case 'ol': {
        return Array.from(node.children).map((li, i) => {
          return `${i + 1}. ${processNode(li).trim()}\n`;
        }).join('') + '\n';
      }
      case 'li': return children;

      // Tables
      case 'table': {
        const rows = Array.from(node.querySelectorAll('tr'));
        if (rows.length === 0) return '';

        const result = [];
        rows.forEach((row, rowIndex) => {
          const cells = Array.from(row.querySelectorAll('th, td'));
          const line = '| ' + cells.map(cell => processNode(cell).trim()).join(' | ') + ' |';
          result.push(line);

          // Add separator after header row
          if (rowIndex === 0) {
            const sep = '| ' + cells.map(() => '---').join(' | ') + ' |';
            result.push(sep);
          }
        });
        return result.join('\n') + '\n\n';
      }
      case 'tr': case 'td': case 'th': return children;

      // Marks
      case 'mark': return `==${children}==`;
      case 'label': return children;
      case 'div': return children;
      case 'span': return children;

      default: return children;
    }
  }

  const result = Array.from(div.childNodes).map(processNode).join('');
  // Clean up extra newlines
  return result.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/**
 * Wrap HTML content in a beautiful standalone HTML document
 */
export function wrapInHtmlTemplate(html, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'WriteAI Document'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.8;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 24px;
      background: #fff;
    }
    h1 { font-size: 2em; font-weight: 700; margin: 0.8em 0 0.4em; }
    h2 { font-size: 1.5em; font-weight: 600; margin: 0.7em 0 0.3em; }
    h3 { font-size: 1.2em; font-weight: 600; margin: 0.6em 0 0.25em; }
    p { margin: 0.5em 0; }
    a { color: #3b82f6; text-decoration: underline; }
    strong { font-weight: 600; }
    blockquote {
      border-left: 3px solid #3b82f6;
      padding: 0.5em 1em;
      margin: 0.8em 0;
      color: #64748b;
      font-style: italic;
      background: rgba(59,130,246,0.05);
      border-radius: 0 6px 6px 0;
    }
    pre {
      background: #f1f5f9;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      overflow-x: auto;
      margin: 1em 0;
      font-family: 'Consolas', monospace;
      font-size: 0.9em;
    }
    code { font-family: 'Consolas', monospace; font-size: 0.9em; }
    p code {
      background: #f1f5f9;
      padding: 0.2em 0.4em;
      border-radius: 4px;
      color: #3b82f6;
    }
    ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
    li { margin: 0.2em 0; }
    img { max-width: 100%; border-radius: 8px; margin: 1em 0; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    th { background: #f8fafc; font-weight: 600; }
    mark { background: rgba(59,130,246,0.2); border-radius: 2px; padding: 0 2px; }
    ul[data-type="taskList"] { list-style: none; padding: 0; }
    ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 8px; }
    ul[data-type="taskList"] input { margin-top: 4px; }
  </style>
</head>
<body>
  <h1>${title || 'Untitled'}</h1>
  ${html}
</body>
</html>`;
}

/**
 * Export as Markdown (.md)
 */
export function exportAsMarkdown(doc) {
  const md = htmlToMarkdown(doc.content || '');
  const filename = sanitize(doc.title) + '.md';
  downloadFile(filename, md, 'text/markdown;charset=utf-8');
}

/**
 * Export as Plain Text (.txt)
 */
export function exportAsPlainText(doc) {
  const text = htmlToPlainText(doc.content || '');
  const filename = sanitize(doc.title) + '.txt';
  downloadFile(filename, text, 'text/plain;charset=utf-8');
}

/**
 * Export as HTML (.html)
 */
export function exportAsHTML(doc) {
  const htmlDoc = wrapInHtmlTemplate(doc.content || '', doc.title);
  const filename = sanitize(doc.title) + '.html';
  downloadFile(filename, htmlDoc, 'text/html;charset=utf-8');
}

/**
 * Export as PDF (.pdf)
 */
export async function exportAsPDF(doc) {
  const html2pdf = (await import('html2pdf.js')).default;

  // Create a temporary container with styled content
  const container = document.createElement('div');
  container.innerHTML = wrapInHtmlTemplate(doc.content || '', doc.title);

  // Extract body only (html2pdf renders from element)
  const body = container.querySelector('body');
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.8;
    color: #1e293b;
    padding: 20px;
  `;
  wrapper.innerHTML = body ? body.innerHTML : container.innerHTML;

  // Temporarily add to DOM (needed by html2pdf)
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '700px';
  document.body.appendChild(wrapper);

  const filename = sanitize(doc.title) + '.pdf';

  try {
    await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(wrapper)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}
