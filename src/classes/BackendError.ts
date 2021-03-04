export class BackendError {
    public actual: any = {
        code: 50035, // needs to be 50035 for errors to show in official client
        errors:  {}}
    constructor (field: string, error: string, errorCode: string = "UNKNOWN_ERROR", code: number = 50035) {
        this.actual.errors[field] = {
            _errors: [
                {code: errorCode, message: error}
            ]
        };
        this.actual.code = code;
        this.actual.message = error;
    }
    get() {
        return this.actual;
    }
}