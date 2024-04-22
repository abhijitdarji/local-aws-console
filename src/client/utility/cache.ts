import localForage from "localforage";


export type SaveCacheDataType<T> = {
    data: T;
    time: number;
};

export abstract class CacheHelper {

    static setCachedItem<T>(key: string, value: SaveCacheDataType<T>) {
        localForage.setItem(key, value);
    }

    static getCachedItem<T>(key: string): Promise<SaveCacheDataType<T> | null> {
        return localForage.getItem<SaveCacheDataType<T>>(key);
    }

    static removeCachedItem(key: string) {
        localForage.removeItem(key);
    }

}
