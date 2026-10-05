(() => {
  const V = globalThis.vendetta;
  const timers = [];

  function toast(s) {
    try { V?.ui?.showToast?.(s); } catch {}
    try { V?.ui?.toasts?.showToast?.(s); } catch {}
  }

  function inspect() {
    try {
      const mods = globalThis.modules;
      if (!mods || typeof mods !== "object") return;

      const results = [];
      for (const [id, m] of Object.entries(mods)) {
        try {
          const e = m?.publicModule?.exports;
          if (!e || (typeof e !== "object" && typeof e !== "function")) continue;
          const keys = Object.keys(e);
          const hits = keys.filter(k =>
            /screen|share|stream|video|quality|resolution|fps|rtc|media|premium|nitro|subscription|upsell/i.test(k)
          );
          if (hits.length) results.push({ id, keys: hits.slice(0, 80) });
        } catch {}
      }

      const interesting = results.filter(x =>
        x.keys.some(k => /quality|resolution|fps|screen|share|video|stream/i.test(k))
      );

      try {
        V?.logger?.log?.("[HD Diagnostics] " + JSON.stringify(results));
      } catch {}

      if (interesting.length) {
        toast("HD Diagnostics: " + interesting.length + " candidates found — check Revenge logs");
      }
    } catch (e) {
      try { V?.logger?.error?.("[HD Diagnostics] " + String(e)); } catch {}
    }
  }

  return {
    onLoad() {
      toast("HD Diagnostics loaded");
      inspect();
      const t = setInterval(inspect, 1500);
      timers.push(t);
    },
    onUnload() {
      timers.forEach(t => { try { clearInterval(t); } catch {} });
      toast("HD Diagnostics disabled");
    }
  };
})()
