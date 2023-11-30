// global.d.ts
export const thisIsAModule = true; // <-- definitely in a module

declare global {
    var units: Array<any>;
}

