import * as vscode from 'vscode';
/**
 * CodelensProvider
 */
class CodelensProvider implements vscode.CodeLensProvider {

    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    protected nameRegx: RegExp;
    // 定义一个事件触发器
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    // 接口中定义的事件属性
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        this.regex = /(def\s+.+\(.*\)\s*:.*)/gm;
        this.nameRegx = /def\s+(.+)\(.*\):/;
        // 当配置发生修改的时候,触发codelens事件, 也就触发了本对象的两个提供者方法
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    // 那些位置提供codelens
    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

        // 如果codelens被启用
        if (vscode.workspace.getConfiguration("codelens").get("enableCodeLens", true)) {
            this.codeLenses = [];
            // 设置目标的正则
            const regex = new RegExp(this.regex);
            // 文档的文本
            const text = document.getText();
            let matches;
            // 循环查找正则
            // console.log(JSON.stringify(text));
            // console.log(123123)
            while ((matches = regex.exec(text)) !== null) {
                // 获取正则匹配处的行内容
                const line = document.lineAt(document.positionAt(matches.index).line);
                // 正则内容开始的字符位置
                const indexOf = line.text.indexOf(matches[0]);
                // 创建位置对象
                const position = new vscode.Position(line.lineNumber, indexOf);
                const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                if (range) {
                    // 注册进入codelen
                    this.codeLenses.push(new vscode.CodeLens(range));
                }
            }
            return this.codeLenses;
        }
        return [];
    }

    // 解决codelens的内容
    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        if (vscode.workspace.getConfiguration("codelens").get("enableCodeLens", true)) {
            // 一个codelens的命令
            let editor = vscode.window.activeTextEditor;
            let unitPath, unitName;
            if(editor){
                unitPath = editor.document.uri.fsPath;    
                let text = editor.document.getText(codeLens.range);
                // console.log(text);
                let matches = this.nameRegx.exec(text);
                // console.log(matches)
                // let groups = text.match());
                if(matches){
                    unitName = matches[1];
                    // console.log(unitName, unitPath);
                }
            }
            codeLens.command = {
                // 显示的内容
                title: "Add as a Unit",
                // 鼠标悬停的提示内容
                tooltip: "Add as a Unit",
                // 鼠标点击触发的事件
                command: "simpleTest.add",
                // 事件的参数
                arguments: [unitPath, unitName]
            };
            // console.log(codeLens);
            return codeLens;
        }
        return null;
    }
}

class CodelensProvider2 extends CodelensProvider{
     // 解决codelens的内容
     public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        if (vscode.workspace.getConfiguration("codelens").get("enableCodeLens", true)) {
            // 一个codelens的命令
            let editor = vscode.window.activeTextEditor;
            let unitPath, unitName;
            if(editor){
                unitPath = editor.document.uri.fsPath;    
                let text = editor.document.getText(codeLens.range);
                // console.log(text);
                let matches = this.nameRegx.exec(text);
                // console.log(matches)
                // let groups = text.match());
                if(matches){
                    unitName = matches[1];
                    // console.log(unitName, unitPath);
                }
            }
            codeLens.command = {
                // 显示的内容
                title: "Add as a Unit",
                // 鼠标悬停的提示内容
                tooltip: "Add as a Unit",
                // 鼠标点击触发的事件
                command: "simpleTest.add",
                // 事件的参数
                arguments: [unitPath, unitName]
            };
            return codeLens;
        }
        return null;
    }
}

export {
    CodelensProvider,
    CodelensProvider2
};