import SectionType from "./SectionType";

export default class CustomSectionBuilder {
    
    constructor(name){
        this.type = SectionType.createCustom(name);
    }

    

    writeBytes(){

    }
}