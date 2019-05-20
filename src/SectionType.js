export default {
    Type: { name: 'Type', value: 1 },
    Import: { name: 'Import', value: 2 },
    Function: { name: 'Function', value: 3 },
    Table: { name: 'Table', value: 4 },
    Memory: { name: 'Memory', value: 5 },
    Global: { name: 'Global', value: 6 },
    Export: { name: 'Export', value: 7 },
    Start: { name: 'Start', value: 8 },
    Element: { name: 'Element', value: 9 },
    Code: { name: 'Code', value: 10 },
    Data: { name: 'Data', value: 11 },
    createCustom: function(name){
        return { name: name, value: 0}
    }
}