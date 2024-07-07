export default class Utils {
    static isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }
      
    static mergeDeep(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key] || !this.isObject(target[key])) Object.assign(target, { [key]: {} });
                    this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        
        return this.mergeDeep(target, ...sources);
    }
}