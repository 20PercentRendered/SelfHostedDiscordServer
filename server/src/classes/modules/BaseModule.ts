/**
 * The base module, you should implement this on every module that is a module.
 */
export abstract class BaseModule {
    /**
     * The human-readable name of the module. Optional.
     */
    readonly name?: string;
    /**
     * The internal name of the module. Used for dependency resolvation and loading.
     */
    readonly intName: string;
    /**
     * The author of the module. Optional.
     */
    readonly author?: string;
    /**
     * The version of the module. Optional but strongly recommended.
     */
    readonly version?: number;
    /**
     * The dependencies of this module. Required.
     */
    readonly dependencies: Array<string>;
    /**
     * The init function. Required.
     * @param next Next should be called after all initialization is finished. Call next after all async functions have finished successfully.
     */
    abstract init(next: () => void);
}
