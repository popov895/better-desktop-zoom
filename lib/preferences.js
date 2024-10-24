'use strict';

import GObject from 'gi://GObject';

export const Preferences = GObject.registerClass(
class Preferences extends GObject.Object {
    static [GObject.GTypeName] = `BetterDesktopZoom_Preferences`;

    static [GObject.properties] = {
        'zoomFactor': GObject.ParamSpec.double(
            `zoomFactor`, ``, ``,
            GObject.ParamFlags.READWRITE,
            1.1, 2, 1.2
        ),
        'scrollToZoom': GObject.ParamSpec.boolean(
            `scrollToZoom`, ``, ``,
            GObject.ParamFlags.READWRITE,
            false
        ),
        'scrollToZoomModifierKeys': GObject.ParamSpec.int(
            `scrollToZoomModifierKeys`, ``, ``,
            GObject.ParamFlags.READWRITE,
            0, 2, 0
        ),
        'zoomInShortcut': GObject.ParamSpec.string(
            `zoomInShortcut`, ``, ``,
            GObject.ParamFlags.READWRITE,
            `<Super>equal`
        ),
        'zoomOutShortcut': GObject.ParamSpec.string(
            `zoomOutShortcut`, ``, ``,
            GObject.ParamFlags.READWRITE,
            `<Super>minus`
        ),
    };

    constructor(extension) {
        super();

        this._keyZoomFactor = `zoom-factor`;
        this._keyScrollToZoom = `scroll-to-zoom`;
        this._keyScrollToZoomModifierKeys = `scroll-to-zoom-modifier-keys`;
        this._keyZoomInShortcut = `zoom-in-shortcut`;
        this._keyZoomOutShortcut = `zoom-out-shortcut`;

        this._settings = extension.getSettings();
        this._settingsChangedHandlerId = this._settings.connect(`changed`, (...[, key]) => {
            switch (key) {
                case this._keyZoomFactor: {
                    this.notify(`zoomFactor`);
                    break;
                }
                case this._keyScrollToZoom: {
                    this.notify(`scrollToZoom`);
                    break;
                }
                case this._keyScrollToZoomModifierKeys: {
                    this.notify(`scrollToZoomModifierKeys`);
                    break;
                }
                case this._keyZoomInShortcut: {
                    this.notify(`zoomInShortcut`);
                    break;
                }
                case this._keyZoomOutShortcut: {
                    this.notify(`zoomOutShortcut`);
                    break;
                }
                default:
                    break;
            }
        });
    }

    destroy() {
        this._settings.disconnect(this._settingsChangedHandlerId);
    }

    get zoomFactor() {
        return this._settings.get_double(this._keyZoomFactor);
    }

    set zoomFactor(zoomFactor) {
        this._settings.set_double(this._keyZoomFactor, zoomFactor);
    }

    get scrollToZoom() {
        return this._settings.get_boolean(this._keyScrollToZoom);
    }

    set scrollToZoom(scrollToZoom) {
        this._settings.set_boolean(this._keyScrollToZoom, scrollToZoom);
    }

    get scrollToZoomModifierKeys() {
        return this._settings.get_enum(this._keyScrollToZoomModifierKeys);
    }

    set scrollToZoomModifierKeys(scrollToZoomModifierKeys) {
        this._settings.set_enum(this._keyScrollToZoomModifierKeys, scrollToZoomModifierKeys);
    }

    get zoomInShortcut() {
        return this._getShortcut(this._keyZoomInShortcut);
    }

    set zoomInShortcut(zoomInShortcut) {
        this._setShortcut(this._keyZoomInShortcut, zoomInShortcut);
    }

    get zoomOutShortcut() {
        return this._getShortcut(this._keyZoomOutShortcut);
    }

    set zoomOutShortcut(zoomOutShortcut) {
        this._setShortcut(this._keyZoomOutShortcut, zoomOutShortcut);
    }

    _getShortcut(key) {
        return this._settings.get_strv(key)[0] ?? ``;
    }

    _setShortcut(key, shortcut) {
        this._settings.set_strv(key, [shortcut]);
    }
});
