'use strict';

import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { Preferences } from './lib/preferences.js';

export default class extends Extension {
    enable() {
        this._keyMagnifierEnabled = `screen-magnifier-enabled`;
        this._keyZoomFactor = `mag-factor`;

        this._preferences = new Preferences(this);

        this._a11ySettings = new Gio.Settings({
            schema_id: `org.gnome.desktop.a11y.applications`,
        });
        this._magnifierSettings = new Gio.Settings({
            schema_id: `org.gnome.desktop.a11y.magnifier`,
        });

        this._addKeybindings();
    }

    disable() {
        this._removeKeybindings();

        delete this._magnifierSettings;
        delete this._a11ySettings;

        this._preferences.destroy();
        delete this._preferences;
    }

    _addKeybindings() {
        Main.wm.addKeybinding(
            this._preferences._keyZoomInShortcut,
            this._preferences._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            () => {
                this._zoomIn();
            }
        );
        Main.wm.addKeybinding(
            this._preferences._keyZoomOutShortcut,
            this._preferences._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            () => {
                this._zoomOut();
            }
        );
    }

    _removeKeybindings() {
        Main.wm.removeKeybinding(this._preferences._keyZoomInShortcut);
        Main.wm.removeKeybinding(this._preferences._keyZoomOutShortcut);
    }

    _zoomIn() {
        let zoom = 1;
        if (this._a11ySettings.get_boolean(this._keyMagnifierEnabled)) {
            zoom = Math.max(zoom, this._magnifierSettings.get_double(this._keyZoomFactor));
        }
        zoom *= this._preferences.zoomFactor;
        this._magnifierSettings.set_double(this._keyZoomFactor, zoom);

        this._a11ySettings.set_boolean(this._keyMagnifierEnabled, true);
    }

    _zoomOut() {
        if (!this._a11ySettings.get_boolean(this._keyMagnifierEnabled)) {
            return;
        }

        let zoom = this._magnifierSettings.get_double(this._keyZoomFactor);
        zoom /= this._preferences.zoomFactor;
        if (zoom <= 1) {
            this._a11ySettings.set_boolean(this._keyMagnifierEnabled, false);
        } else {
            this._magnifierSettings.set_double(this._keyZoomFactor, zoom);
        }
    }
}
