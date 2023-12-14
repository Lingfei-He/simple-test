import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
const { exec } = require("child_process");
import * as utils from './utils';
import { match } from 'assert';
import {treeView, rootPath, provider, outputChannel} from './extension';
import {getPythonDir} from './py';

// treeView?.onDidChangeSelection((e)=>{
//   console.log(e)
//   // if(element instanceof ParameterGroup){
//   //   console.log(element);
//   //   vscode.window.showTextDocument(vscode.Uri.file(element.path));
//   //   treeView.
//   // }
// });


class SimpleTestProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  units: Array<Unit>;
  refreshHandler: Function|null;
  constructor(private testRoot: any) {
    this.units = [];
    this.refreshHandler = null;
  }

  getTreeItem(element: Unit): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Unit): Thenable<vscode.TreeItem[]|Unit[]|ParameterGroup[]> {
    if (!this.testRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }

    if (element) {
      return new Promise((resolve, reject) => {
        // console.log(12313);
        // console.log(element);
        // console.log(12313);
        let groupNames = Object.keys(element.info.param_group_map);
        let groupElements = groupNames.map((name: string)=>{
          let obj = element.info.param_group_map[name];
          return new ParameterGroup(name, obj.data, obj.load_path, element);
        });
        resolve(groupElements);
      }) ;
    } else {
      return new Promise((resolve, reject) => {
        utils.getUnitInfosFromRoot(this.testRoot).then((results:any)=>{
          /// <reference path="./global.d.ts" />
          // this.units = results;
          // console.log('SimpleTest.getChildren', units);
          let unitElements = results.map((result:any)=>new Unit(result.meta.src_name, result.meta.src_path, result.meta_valid && result.src_valid,
            Object.keys(result.param_group_map).length === 0 ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed, result, 
            result.dir_name, result.src_obj_info?.line));
          this.units = unitElements;
          if(this.refreshHandler && typeof this.refreshHandler === 'function'){
            this.refreshHandler(unitElements);
          }
          resolve(unitElements);
        });
      });
    }
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Unit| ParameterGroup | undefined | null | void> = new vscode.EventEmitter<Unit| ParameterGroup | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Unit|ParameterGroup | undefined | null | void> = this._onDidChangeTreeData.event;

  getParent(element: ParameterGroup): vscode.ProviderResult<vscode.TreeItem> {
    return element.unitElement;
  }

  resolveTreeItem?(item: Unit| ParameterGroup, element: Unit| ParameterGroup, token: vscode.CancellationToken):  vscode.ProviderResult<Unit| ParameterGroup> {
    return null;
  }

  refresh(handler:Function|null=null): void {
    if(handler){
      this.refreshHandler = handler;
    }
    this._onDidChangeTreeData.fire();

  }

  addUnit(unitPath: string, unitName: string):void {
    let unit = this.units.find(unit=>unit.dirName === unitName);
    let dirName = unitName;
    let that = this;

    function _addUnit(){
      if(rootPath){
        let saveDir = path.join(rootPath, dirName);
        console.log(`Add Unit: ${unitName}, ${unitPath}`);
        utils.addEmptyUnit(unitPath, unitName, saveDir);
        that.refresh();
      }
    }

    if(unit){
      vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: 'Another Name',
        prompt: 'Please enter the name of the parameter group.',
        title: `Another alias for Unit '${unit.unitName}'`,
        value: ''
      }).then(r=>{
        if(r && r.length > 0){
          dirName = r;
          if(rootPath){
            let saveDir = path.join(rootPath, dirName);
            if(fs.existsSync(saveDir)){
              vscode.window.showErrorMessage(`Unit alias '${r}' also exists.`);
              this.addUnit(unitPath, unitName);
            }
            else{
              _addUnit();
            }
          }
        }
      });
    }
    else{
      _addUnit();
    }
    
  }

  addParamGroup(unit: Unit):void{
    // console.log(unit);
    vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'param_group',
      prompt: 'Please enter the name of the parameter group.',
      title: `Add Parameter Group for Unit '${unit.unitName}'`,
      value: ''
    }).then(r=>{
      console.log(r);
      if(r !== undefined){
        if(r.length === 0){
          vscode.window.showErrorMessage(`Parameter group name cannot be empty string.`);
        }
        else{
            utils.addEmptyParamGroup(unit.dirName, r).then(r2=>{
              this.refresh((unitElements: Array<any>)=>{
                let newUnit = unitElements.find(u=>u.unitName === unit.unitName);
                // console.log(newUnit);
                this.getChildren(newUnit).then((groups: Array<any>)=>{
                  let newGroup = groups.find((g)=>g.name===r);
                  // console.log(newGroup);
                  treeView?.reveal(newGroup, {select:true, focus: true});
                });

              });
            }).catch(err=>{
              vscode.window.showErrorMessage(`Parameter group name exists: '${r}'`);
              this.addParamGroup(unit);
            });
        }
      }
    });
  }

  getUnitDirNameByPath(path2: any){
    if(utils.isPathInRootDir(path2)){
      let unitDirName:any = null;
      if(path.extname(path2) === '.json'){
        unitDirName = path.basename(path.dirname(path2));
      }
      else{
        unitDirName = path.basename(path2);
      }
      return unitDirName;
    }
    else{
      return null;
    }
  }

  getUnitElementByPath(path2: any){
    let unitDirName = this.getUnitDirNameByPath(path2);
    if(unitDirName){
      return this.units.find(unit=>unit.dirName === unitDirName);
    }
    else{
      return null;
    }
  }

  async getParamGroupElementByPath(gPath: any){
    let unit = this.getUnitElementByPath(gPath);
    // console.log(unit, gPath);
    if(unit){
      let groups = await this.getChildren(unit);
      // console.log(groups);
      let group2 = groups.find(group=>{
        if(group instanceof ParameterGroup){
          // console.log(group.path, gPath);
          // console.log(utils.isSamePath(group.path, gPath));
          return utils.isSamePath(group.path, gPath);
        }
      });
      // console.log(group2);
      return group2; 
    }
    else{
      return null;
    }
  }

  async delete(element: Unit|ParameterGroup){
    let deletePaths = [];
    if(element instanceof Unit){
      let result = await vscode.window.showQuickPick(['Delete','Cancel'], 
      {
        canPickMany: false,
        ignoreFocusOut: true,
        title: `Really confirm to delete the Unit '${element.unitName}'?`
      });
      if(result === 'Delete'){
        let deletePath = element.savePath;
        if(deletePath){
          fsExtra.removeSync(deletePath);
          deletePaths.push(deletePath);
        }
      }
    }
    else{
      fs.rmSync(element.path);
      deletePaths.push(element.path);
    }
    afterDelete(deletePaths);
  }

  navigateSource(unitElement: Unit){
    let line = Number(unitElement.unitLine)-1;
    vscode.window.showTextDocument(vscode.Uri.file(unitElement.unitPath), {
      selection: new vscode.Range(line, 0, line, 0)
    });
  }

  showErrorMessage(unitElement: Unit){
    let errMsg = unitElement.info.src_obj_info;
    // outputChannel.replace(errMsg);
    // outputChannel.show();
    if(rootPath){
      let tmpPath = path.join(rootPath, unitElement.dirName, 'error_trace.obj');
      // fs.writeFileSync(tmpPath, errMsg);
      let runTerminal = this.getTerminal();
      this.focusTerminal();
      runTerminal.sendText(`python ${path.join(getPythonDir(), 'raise_err.py')} "${tmpPath}"`);
    }
   
  }

  getTerminal(){
    let runTerminal = vscode.window.terminals.find(terminal=>terminal.name === 'Simple Test');
    if(!runTerminal){
      runTerminal = vscode.window.createTerminal('Simple Test');
    }
    return runTerminal;
  }

  focusTerminal(){
    let terminal = this.getTerminal();
    vscode.window.createTerminal('Simple Test-tmp');
  }

  run(element: Unit|ParameterGroup){
    console.log(element);
    // console.log(vscode.window.terminals);
    let runTerminal = this.getTerminal();
    this.focusTerminal();
    let cmd = 'unit-run -q run ';
    let unit = element instanceof Unit ? element : element.unitElement;
    cmd += `${unit.savePath} `;
    if(element instanceof Unit){
      cmd += `-j {}`;
    }
    else if(element instanceof ParameterGroup){
      cmd += `-g ${element.name}`;
    }
    runTerminal.sendText(cmd);
  }
}



function afterDelete(deletePaths: string[]){
  if(treeView?.selection && treeView.selection.length > 0){
    const selectedItem = treeView.selection[0];
    const view = treeView;
    if(selectedItem instanceof ParameterGroup){
      setTimeout(() => {
        view.reveal(selectedItem.unitElement, {select: true, focus: false, expand: true});  
      }, 200);
    }
  }
  provider?.refresh();
  // console.log(vscode.workspace.textDocuments[0].);
  // vscode.workspace.textDocuments[0].cl
  vscode.window.visibleTextEditors.forEach(editor => {
    let openedTextPath = editor.document.uri.fsPath;
    if(deletePaths.find(p1=>utils.isSamePath(p1, openedTextPath))){
      vscode.commands.executeCommand('workbench.action.vis',);
      editor.hide();
    }
  });
  // console.log(vscode.window.visibleTextEditors);
}



function treeViewSetting(){
  treeView?.onDidChangeSelection(e=>{
    // console.log(e.selection);
		let element = e.selection[0];
    if(element instanceof ParameterGroup){
      vscode.window.showTextDocument(vscode.Uri.file(element.path));
    }
	});

  vscode.workspace.onDidOpenTextDocument(async e=>{
    let currentTextEditor = vscode.window.activeTextEditor;
    let openedTextPath = e.uri.fsPath;
    // console.log(currentTextEditor, e.uri.fsPath);
    if(currentTextEditor === undefined && utils.isPathInRootDir(openedTextPath)){
      console.log(openedTextPath);
        let unitDirName = path.basename(path.dirname(openedTextPath));
        // let groupName = path.basename(openedTextPath).split('.')[0];
        // console.log(unitDirName);
        let group = await provider?.getParamGroupElementByPath(openedTextPath);
        // console.log(group);
        if(group){
          treeView?.reveal(group, {select: true, focus: true});
        }
    }

  });

  vscode.workspace.onDidDeleteFiles(e=>{
    let filePaths = e.files.filter(file=>utils.isPathInRootDir(file.fsPath)).map(file=>file.fsPath);
    if(filePaths){
      afterDelete(filePaths);
    }
  });

  vscode.window.onDidOpenTerminal(terminal=>{
    if(terminal.name === 'Simple Test-tmp'){
      let runTerminal = provider?.getTerminal();
      runTerminal?.show(false);
      terminal.dispose();
    }
  });
}
  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  // private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
  //   if (this.pathExists(packageJsonPath)) {
  //     const toDep = (moduleName: string, version: string): Dependency => {
  //       if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
  //         return new Dependency(
  //           moduleName,
  //           version,
  //           vscode.TreeItemCollapsibleState.Collapsed
  //         );
  //       } else {
  //         return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None);
  //       }
  //     };

  //     const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  //     const deps = packageJson.dependencies
  //       ? Object.keys(packageJson.dependencies).map(dep =>
  //           toDep(dep, packageJson.dependencies[dep])
  //         )
  //       : [];
  //     const devDeps = packageJson.devDependencies
  //       ? Object.keys(packageJson.devDependencies).map(dep =>
  //           toDep(dep, packageJson.devDependencies[dep])
  //         )
  //       : [];
  //     return deps.concat(devDeps);
  //   } else {
  //     return [];
  //   }
  // }

class Unit extends vscode.TreeItem {
  constructor(
    public readonly unitName: string,
    public readonly unitPath: string,
    private readonly valid: boolean,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly info: any,
    public readonly dirName: any,
    public readonly unitLine: any
  ) {
    super(unitName, collapsibleState);
    this.tooltip = this.valid ? `unit '${this.label}' from ${this.unitPath}, at line ${unitLine}.` : `The unit '${this.label}' from ${this.unitPath} doesn't exist.`;
    // this.description = this.unitPath;
    this.description = `(${dirName})`;
    this.iconPath = this.valid ? new vscode.ThemeIcon('symbol-function') : new vscode.ThemeIcon('notebook-state-error', new vscode.ThemeColor('errorForeground'));
    this.contextValue = this.valid ? 'unit' : undefined;
    if(this.valid && info.src_obj_info && info.src_obj_info.parameters.length === 0){
        this.contextValue += '-runItem';
    }
  }

  get savePath(){
    if(rootPath){
      return path.join(rootPath, this.dirName);
    }
    return undefined;
  }
}


class ParameterGroup extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly value: string,
    public readonly path: string,
    public readonly unitElement: Unit
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `Unit parameter group '${name}' read from ${path}`;
    // this.description = path;
    this.iconPath = new vscode.ThemeIcon('symbol-variable');
    this.contextValue = 'parameterGroup';
    this.contextValue += '-runItem';
  }
}

export {
  SimpleTestProvider,
  treeViewSetting
};