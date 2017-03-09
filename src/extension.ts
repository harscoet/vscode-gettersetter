import * as vscode from 'vscode';
import { parse } from 'path';

interface IProperty {
  name: string;
  type: string;
}

function createGetter({ name, type }: IProperty) {
  let code = '';

  code += `  public get ${name}(): ${type} {\n`;
  code += `    return this.get<${type}>('${name}');\n`;
  code += `  }`;

  return code;
}

function createSetter({ name, type }: IProperty) {
  let code = '';

  code += `  public set ${name}(value: ${type}) {\n`;
  code += `    this.set('${name}', value);\n`;
  code += `  }`;

  return code;
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.genGettersSetters', () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return; // No open text editor
    }

    const properties: { name: string; type: string; }[] = [];

    // Extract properties
    const className = parse(editor.document.fileName).name;
    const regexpInterfaceData = new RegExp(`interface I${className}Data(<[\\w\\s]+>)?\\s`);
    const lineCount = vscode.window.activeTextEditor.document.lineCount;

    let start = false;
    for (let i = 0; i < lineCount; i++) {
      const line = vscode.window.activeTextEditor.document.lineAt(i);
      const text = line.text;

      if (!start && regexpInterfaceData.test(text)) {
        start = true;
      } else if (start) {
        if (text === '}' || text === '};') {
          break;
        } else {
          const name = text.substr(0, text.indexOf(':')).trim().replace(/\?/, '');
          const type = text.substr(text.indexOf(':') + 1).trim().replace(/,|;/g, '');

          properties.push({ name, type });
        }
      }
    }

    // Insert
    const currentPos = new vscode.Position(vscode.window.activeTextEditor.selection.active.line, 0);

    vscode.window.activeTextEditor.edit((builder) => {
      for (let i = 0; i < properties.length; i++) {
        builder.insert(currentPos, createGetter(properties[i]));
        builder.insert(currentPos, '\n\n');
        builder.insert(currentPos, createSetter(properties[i]));

        if (i < properties.length - 1) {
          builder.insert(currentPos, '\n\n');
        }
      }
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
}
