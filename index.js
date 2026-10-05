(function () {
    const PATCH_NAME = "HD Stream Unlocker";
    const patches = [];

    function toast(message) {
        try {
            globalThis.vendetta?.ui?.showToast?.(message);
        } catch {}

        try {
            globalThis.vendetta?.ui?.toasts?.showToast?.(message);
        } catch {}
    }

    function patchFunction(obj, name, replacement) {
        if (!obj || typeof obj[name] !== "function") {
            return false;
        }

        const original = obj[name];
        obj[name] = replacement(original);

        patches.push(() => {
            try {
                if (obj[name] !== original) {
                    obj[name] = original;
                }
            } catch {}
        });

        return true;
    }

    function install() {
        try {
            const discordPremium = globalThis.__r?.(4446)?.default;

            if (!discordPremium) {
                toast("HD Unlocker: module 4446 not found");
                return false;
            }

            let count = 0;

            if (
                patchFunction(
                    discordPremium,
                    "canStreamQuality",
                    () => function () {
                        return true;
                    }
                )
            ) {
                count++;
            }

            if (
                patchFunction(
                    discordPremium,
                    "canUseHighVideoUploadQuality",
                    () => function () {
                        return true;
                    }
                )
            ) {
                count++;
            }

            toast(
                count === 2
                    ? "HD Stream Unlocker: ON"
                    : "HD Unlocker: hooks " + count + "/2"
            );

            return count > 0;
        } catch (e) {
            try {
                globalThis.vendetta?.logger?.error?.(e);
            } catch {}

            toast("HD Unlocker: error");
            return false;
        }
    }

    return {
        onLoad() {
            install();
        },

        onUnload() {
            for (const unpatch of patches.splice(0)) {
                try {
                    unpatch();
                } catch {}
            }

            toast("HD Stream Unlocker: OFF");
        }
    };
})()
