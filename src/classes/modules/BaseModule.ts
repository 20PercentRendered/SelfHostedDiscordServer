/**
 * The base module, you should implement this on every module.
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
	/**
	 * The stop function. Optional but recommended to save data.
	 * @param next Next should be called similarly to init, but this time after saving data, or disconnecting users etc.
	 */
	abstract stop(next: () => void);
}
export class ModuleArray extends Array<BaseModule> {
	/**
	 *
	 * @param name name of the module
	 * @description Gets a module by name and type
	 * @example Example usage:
	 * ServerData.Instance.modules.getModule<CoreModule>("core")
	 */
	getModule<T1 extends BaseModule>(name: string) {
		return this.find((obj) => obj.intName == name) as T1;
	}
}
