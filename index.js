(function () {
    const vendetta = globalThis.vendetta;
    const patches = [];
    let userStore = null;
    let originalPremiumType;

    const qualityMethods = [
        "getMaxVideoQuality",
        "getMaxVideoHeight",
        "getMaxVideoResolution",
        "getMaxStreamQuality",
        "getMaxScreenShareQuality",
        "getMaxScreenShareResolution",
        "getMaxVideoFPS",
        "getMaxStreamFPS",
        "getMaxScreenShareFPS"
    ];

    function toast(message) {
        try {
            vendetta?.ui?.showToast?.(message);
            vendetta?.ui?.toasts?.showToast?.(message);
        } catch {}
    }

    function patchUser() {
        try {
            userStore = vendetta.webpack.findByProps("getCurrentUser", "getUser");
            if (!userStore?.getCurrentUser) return false;

            const user = userStore.getCurrentUser();
            if (user) {
                originalPremiumType = user.premiumType;
                user.premiumType = 2;
            }

            const unpatch = vendetta.patcher.after(
                "HD Stream Unlocker",
                userStore,
                "getCurrentUser",
                (_this, _args, result) => {
                    if (result && typeof result === "object") {
                        result.premiumType = 2;
                    }
                    return result;
                }
            );

            if (typeof unpatch === "function") patches.push(unpatch);
            return true;
        } catch (e) {
            try { vendetta.logger?.error?.(e); } catch {}
            return false;
        }
    }

    function patchQuality() {
        let count = 0;

        for (const name of qualityMethods) {
            try {
                const mod = vendetta.webpack.findByProps(name);
                if (!mod || typeof mod[name] !== "function") continue;

                const unpatch = vendetta.patcher.after(
                    "HD Stream Unlocker",
                    mod,
                    name,
                    (_this, _args, result) => {
                        if (typeof result === "number") {
                            return name.includes("FPS")
                                ? Math.max(result, 60)
                                : Math.max(result, 2160);
                        }

                        if (result && typeof result === "object") {
                            const out = { ...result };
                            if ("width" in out)
                                out.width = Math.max(Number(out.width) || 0, 3840);
                            if ("height" in out)
                                out.height = Math.max(Number(out.height) || 0, 2160);
                            if ("fps" in out)
                                out.fps = Math.max(Number(out.fps) || 0, 60);
                            if ("frameRate" in out)
                                out.frameRate = Math.max(Number(out.frameRate) || 0, 60);
                            return out;
                        }

                        return result;
                    }
                );

                if (typeof unpatch === "function") patches.push(unpatch);
                count++;
            } catch {}
        }

        return count;
    }

    return {
        onLoad() {
            const nitro = patchUser();
            const hooks = patchQuality();
            toast("HD Unlocker: Nitro " + (nitro ? "✓" : "✗") +
                  " | quality hooks: " + hooks);
        },

        onUnload() {
            for (const unpatch of patches.splice(0)) {
                try { unpatch(); } catch {}
            }

            try {
                const user = userStore?.getCurrentUser?.();
                if (user && originalPremiumType !== undefined)
                    user.premiumType = originalPremiumType;
            } catch {}

            userStore = null;
            originalPremiumType = undefined;
            toast("HD Stream Unlocker disabled");
        }
    };
})()
