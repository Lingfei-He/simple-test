import {query} from './py';
import {rootPath} from './extension';
import * as path from 'path';

type Query = {
    queryName: string;
    queryArgs: Array<any>;
    success: Function|null; // Default
    error: Function|null // Default
};

function createHandler(q: Query){
    return new Promise((resolve, reject)=>{
        query(q.queryName, q.queryArgs).then((r:any)=>{
            if(q.success){
                q.success(resolve, r);
            }
            else{
                resolve(r[0]);
            }
        }).catch(err=>{
            if(q.error){
                q.error(reject, err);
            }
            else{
                reject(err);
            }
        });
    });
}


function getUnitDirs(root: string){
    return createHandler({
        queryName: 'find_unit_dirs',
        queryArgs: [root],
        success: null,
        error: null
    });
}

function getInfoFromUnitDir(unitDir: string){
    return createHandler({
        queryName: 'get_unit_info',
        queryArgs: [unitDir],
        success: null,
        error: null
    });
}

function isUnitMetaValid(meta: any){
    return createHandler({
        queryName: 'is_meta_valid',
        queryArgs: [meta.src_path, meta.src_name],
        success: null,
        error: null
    });
}

function addEmptyUnit(srcPath: string, srcName: string, saveDir: string){
    if(rootPath){
        return createHandler({
            queryName: 'add_empty_unit',
            queryArgs: [srcPath, srcName, saveDir],
            success: null,
            error: null
        });
    }
    else{
        throw Error(`Unknown rootPath: ${rootPath}`);
    }
}

function addEmptyParamGroup(unitDir: string, groupName: string){
    if(rootPath){
        return createHandler({
            queryName: 'add_empty_param_group',
            queryArgs: [path.join(rootPath, unitDir), groupName],
            success: null,
            error: null
        });
    }
    else{
        throw Error(`Unknown rootPath: ${rootPath}`);
    }
}


export {
    getUnitDirs,
    getInfoFromUnitDir,
    isUnitMetaValid,
    addEmptyUnit,
    addEmptyParamGroup
};