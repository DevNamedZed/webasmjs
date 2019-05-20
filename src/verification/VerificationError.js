export default class VerificationError extends Error{
    constructor(message){
        super(message);

        this.name = "verification";
    }
}