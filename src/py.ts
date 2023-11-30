
import {PythonShell} from 'python-shell';
import * as path from 'path';
const fs = require('fs');
const { exec } = require("child_process");

function getScriptsDir(){
    return path.join(__dirname, '..', 'resources', 'scripts');
}

function getPythonDir(){
   return path.join(getScriptsDir(), 'python');
}

function runPython(pyPath: string, options: Object|undefined){
    return PythonShell.run(pyPath, options);
}

function runBuiltInPython(localPath: string, query: string, paramMap:any = undefined){
    paramMap = paramMap !== undefined ? JSON.stringify(paramMap) : null;
    let args = [query, paramMap];
    // console.log(args)
    return runPython(path.join(getPythonDir(), localPath), {args});
}

function query(queryStr: string, paramMap: any = undefined){
    return new Promise((resolve, reject)=>{
        runBuiltInPython('query.py', queryStr, paramMap).then(r=>{
            console.log(queryStr, r);
            for(let i in r){
                try {
                    r[i] = JSON.parse(r[i]);
                } catch (error) {
                    continue;
                }
            }
            resolve(r);
        }).catch(err=>{
            reject(err);
        });
    }); 
}


export {
    query
};
