import { Mode, applyMode } from "@cloudscape-design/global-styles";
import { SaveCacheDataType, CacheHelper } from "./cache";
import { Constants } from "./constants";

const THEME_STORAGE_NAME = `${Constants.APP_NAME}-theme`;

export abstract class ThemeHelper {

    static async getTheme(prefers: Mode) {

        const cachedData = await CacheHelper.getCachedItem<SaveCacheDataType<Mode> | null>(THEME_STORAGE_NAME);
        let theme = prefers;
        if (cachedData?.data && Date.now() - cachedData.time < Constants.PREFERENCES_CACHE_DURATION) {
            theme = cachedData.data as unknown as Mode;
        }

        return theme;
    }

    static async applyTheme(theme: Mode) {

        await CacheHelper.setCachedItem(THEME_STORAGE_NAME, { data: theme, time: Date.now() });

        applyMode(theme);

        document.documentElement.style.setProperty(
            "--app-color-scheme",
            theme === Mode.Dark ? "dark" : "light"
        );

        return theme;
    }
}