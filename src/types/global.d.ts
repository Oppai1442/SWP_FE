declare function require(context: string): {
    keys: () => string[];
    <T>(id: string): T;
};

// Khai báo cho require.context
declare namespace NodeJS {
    interface Require {
        context(directory: string, useSubdirectories?: boolean, regExp?: RegExp): {
            keys: () => string[];
            <T>(id: string): T;
        };
    }
}