import * as query from './query';
import {rootPath} from './extension';
import * as path from 'path';
import * as vscode from 'vscode';

function isSubPath(parentPath: any, childPath:any) {
    const relativePath = path.relative(parentPath, childPath);
    return relativePath === '' || !relativePath.startsWith('..');
}

function isSamePath(path1:any, path2:any){
  const resolvedPath1 = path.resolve(path1);
  const resolvedPath2 = path.resolve(path2);
 
  return resolvedPath1 === resolvedPath2;
}

function isPathInRootDir(targetPath: any){
    return isSubPath(rootPath, targetPath);
}

function getUnitInfoFromDir(dir: string){
    return new Promise((resolve, reject2) => {
        query.getInfoFromUnitDir(dir).then((info: any)=>{
            resolve(info);
        });
    });
}

function getUnitInfosFromRoot(root: string){
    return new Promise((resolve, reject) => {
        query.getUnitDirs(root).then((dirs: any)=>{
            let promises = dirs.map((dir:string)=>getUnitInfoFromDir(dir));
            Promise.all(promises).then((rs:any)=>{
                resolve(rs);
            });
        });
    });
}

function addEmptyUnit(srcPath: string, srcName:string, saveDir: string){
    query.addEmptyUnit(srcPath, srcName, saveDir).then(r=>{
        console.log(r);
    }).catch(err=>{
        // if(errorFunc instanceof Function)
        // {
        //     errorFunc(err);
        // }   
        vscode.window.showErrorMessage(err);
        // else{
        //     throw err;
        // }    
        // throw err;
    });
}

function addEmptyParamGroup(unitDir:string, groupName: string){
    return query.addEmptyParamGroup(unitDir, groupName);
}

export {
    getUnitInfoFromDir,
    getUnitInfosFromRoot,
    addEmptyUnit,
    addEmptyParamGroup,
    isSubPath,
    isSamePath,
    isPathInRootDir
};