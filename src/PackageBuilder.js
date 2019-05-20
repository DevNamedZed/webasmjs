export default class PackageBuilder {
    modules = [];

    defineModule(name){
    }

    importModule(){        
    }

    compile(){
        return this.modules.reduce(x => {
            x[name] = x.compile();
            return x;
        },
        { });      
    }

    instantiate(imports) {
        // validate module dependencies, create imports based on module dependencies.
        throw new Error('Not implemented.')
    }
}

