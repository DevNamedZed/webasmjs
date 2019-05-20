import SectionType from "./SectionType";
import BinaryWriter from "./BinaryWriter";
import ModuleBuilder from './ModuleBuilder'
import ExternalKind from "./ExternalKind";

const MagicHeader = 0x6d736100;
const Version = 1;

/**
 * Writes a WASM module to a byte array.
 */
export default class BinaryModuleWriter {

    /**
     * The module to write.
     * @type {ModuleBuilder} 
     */
    moduleBuilder;

    /**
     * Create and initializes a new BinaryModuleBuilder.
     * @param {ModuleBuilder} moduleBuilder The module to write.
     */
    constructor(moduleBuilder) {
        this.moduleBuilder = moduleBuilder;
    }

    /**
     * Writes a section header to a BinaryWriter.
     * @param {BinaryWriter} writer The BinaryWriter.
     * @param {SectionType} section A number between 1-11 for predefined sections or 0 for a custom section.
     * @param {*} length The length of the section.
     * @param {*} name The name of the section, required for custom sections.
     */
    static writeSectionHeader(writer, section, length, name) {
        writer.writeVarUInt7(section.value);
        writer.writeVarUInt32(length);
        if (section.value === 0) {
            if (name) {
                writer.write(name.length);
                writer.writeString(name);
            }
            else {
                writer.writeVarUInt32(0);
            }
        }
    }
    
    /**
     * Writes a section
     * @param {BinaryWriter} writer 
     * @param {SectionType} sectionType 
     * @param {Object[]} sectionItems 
     */
    static writeSection(writer, sectionType, sectionItems){
        if (sectionItems.length === 0){
            return;
        }

        const sectionWriter = new BinaryWriter();
        sectionWriter.writeVarUInt32(sectionItems.length);
        sectionItems.forEach(x => {
            x.write(sectionWriter);
        });

        BinaryModuleWriter.writeSectionHeader(writer, sectionType, sectionWriter.length);
        writer.writeBytes(sectionWriter);
    }

    static writeCustomSection(writer, section) {
    }

    /**
     * Writes the type section. This section contains signature for all functions defined in the module.
     * https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#type-section
     */
    writeTypeSection(writer) {
        BinaryModuleWriter.writeSection(writer, SectionType.Type, this.moduleBuilder._types);
    }

    writeImportSection(writer) {
        BinaryModuleWriter.writeSection(writer, SectionType.Import, this.moduleBuilder._imports);
    }

    /**
     * Writes the function section which declares which types in the type section are functions.
     */
    writeFunctionSection(writer) {
        const sectionWriter = new BinaryWriter();
        sectionWriter.writeVarUInt32(this.moduleBuilder._functions.length);
        for (let index = 0; index < this.moduleBuilder._functions.length; index++) {
            sectionWriter.writeVarUInt32(this.moduleBuilder._functions[index].funcTypeBuilder.index);
        }

        BinaryModuleWriter.writeSectionHeader(writer, SectionType.Function, sectionWriter.length);
        writer.writeBytes(sectionWriter);
    }

    writeTableSection(writer) {
        BinaryModuleWriter.writeSection(writer, SectionType.Table, this.moduleBuilder._tables);
    }

    writeMemorySection(writer) {
        BinaryModuleWriter.writeSection(writer, SectionType.Memory, this.moduleBuilder._memories);
    }

    writeGlobalSection(writer) {
        BinaryModuleWriter.writeSection(writer, SectionType.Global, this.moduleBuilder._globals);
    }

    writeExportSection(writer) {
        BinaryModuleWriter.writeSection(writer, SectionType.Export, this.moduleBuilder._exports);
    }


    /**
     * Writes the start section which contains the index of the entry point function. The index 
     * maps to a function entry in the function section.
     * https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#start-section
     */
    writeStartSection(writer) {
        if (!this.moduleBuilder.entryFunction){
            return;
        }

        const sectionWriter = new BinaryWriter();
        sectionWriter.writeVarUInt32(this.moduleBuilder.entryFunction.index);

        BinaryModuleWriter.writeSectionHeader(writer, SectionType.Function, sectionWriter.length);
        writer.writeBytes(sectionWriter);
    }

    /**
     * Writes the module element section.
     */
    writeElementSection(writer) {
        BinaryModuleWriter.writeSection(writer, SectionType.Element, this.moduleBuilder._elements);
    }

    /**
     * Writes the module code section.
     */
    writeCodeSection(writer) {
        BinaryModuleWriter.writeSection(writer, SectionType.Code, this.moduleBuilder._functions);        
    }

    /**
     * 
     * @param {BinaryWriter} writer 
     */
    writeDataSection(writer) {
        BinaryModuleWriter.writeSection(writer, SectionType.Data, this.moduleBuilder._data);

    }

    writeCustomSections(writer) {
        const nameSectionIndex = this.moduleBuilder._customSections.findIndex(x => x.name === "name");
        if (nameSectionIndex !== -1){
            BinaryModuleWriter.writeCustomSection(writer, this.moduleBuilder.customSections[nameSectionIndex]);
        }
        else if (this.moduleBuilder._options.generateNameSection){

        }

        this.moduleBuilder._customSections.forEach((x, i) => {
            if (i !== nameSectionIndex){
                BinaryModuleWriter.writeCustomSection(writer, x);
            }
        })
    }


    write() {
        const writer = new BinaryWriter();
        writer.writeUInt32(MagicHeader);
        writer.writeUInt32(Version);

        this.writeTypeSection(writer);
        this.writeImportSection(writer);
        this.writeFunctionSection(writer);
        this.writeTableSection(writer);
        this.writeMemorySection(writer); 
        this.writeGlobalSection(writer);
        this.writeExportSection(writer);        
        this.writeStartSection(writer);
        this.writeElementSection(writer);
        this.writeCodeSection(writer);
        this.writeDataSection(writer);
        this.writeCustomSections(writer);

        return writer.toArray();
    }
}