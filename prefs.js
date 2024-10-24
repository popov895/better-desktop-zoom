'use strict';

const { Adw, Gdk, GLib, GObject, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const { Preferences } = Extension.imports.lib.preferences;

const _ = (text, context) => {
    return context ? ExtensionUtils.pgettext(context, text) : ExtensionUtils.gettext(text);
};

const ShortcutWindow = GObject.registerClass(
class ShortcutWindow extends Adw.Window {
    static [GObject.signals] = {
        'shortcut': {
            param_types: [GObject.TYPE_STRING],
        },
    };

    constructor(parent) {
        super({
            content: new Adw.StatusPage({
                description: _(`Press Backspace to clear shortcut or Esc to cancel`),
                title: _(`Enter a new shortcut`),
            }),
            modal: true,
            resizable: false,
            transient_for: parent,
            width_request: 450,
        });

        const keyController = new Gtk.EventControllerKey();
        keyController.connect(`key-pressed`, (...[, keyval, keycode, state]) => {
            switch (keyval) {
                case Gdk.KEY_Escape: {
                    this.close();
                    return Gdk.EVENT_STOP;
                }
                case Gdk.KEY_BackSpace: {
                    this.emit(`shortcut`, ``);
                    return Gdk.EVENT_STOP;
                }
                default: {
                    const mask = state & Gtk.accelerator_get_default_mod_mask();
                    if (mask && Gtk.accelerator_valid(keyval, mask)) {
                        const shortcut = Gtk.accelerator_name_with_keycode(null, keyval, keycode, mask);
                        if (shortcut.length > 0) {
                            this.emit(`shortcut`, shortcut);
                            return Gdk.EVENT_STOP;
                        }
                    }
                    break;
                }
            }
            return Gdk.EVENT_PROPAGATE;
        });
        this.add_controller(keyController);
    }
});

const ShortcutRow = GObject.registerClass(
class ShortcutRow extends Adw.ActionRow {
    constructor(title, preferences, property) {
        super({
            title: title,
        });

        this._preferences = preferences;
        this._property = property;

        this.activatable_widget = new Gtk.ShortcutLabel({
            disabled_text: _(`Disabled`, `Keyboard shortcut is disabled`),
            valign: Gtk.Align.CENTER,
        });
        this._preferences.bind_property(
            this._property,
            this.activatable_widget,
            `accelerator`,
            GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE
        );
        this.add_suffix(this.activatable_widget);
    }

    vfunc_activate() {
        const window = new ShortcutWindow(this.get_root());
        window.connect(`shortcut`, (...[, shortcut]) => {
            this._preferences.set_property(this._property, shortcut);
            window.close();
        });
        window.connect(`close-request`, () => {
            window.destroy();
        });
        window.present();
    }
});

var init = () => {
    ExtensionUtils.initTranslations(Extension.uuid);
};

var fillPreferencesWindow = (window) => {
    window._preferences = new Preferences();
    window.connect(`close-request`, () => {
        window._preferences.destroy();
    });

    const zoomFactorSpinBox = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 1.1,
            upper: 2,
            step_increment: 0.1,
        }),
        digits: 2,
        valign: Gtk.Align.CENTER,
    });
    window._preferences.bind_property(
        `zoomFactor`,
        zoomFactorSpinBox,
        `value`,
        GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE
    );

    const zoomFactorRow = new Adw.ActionRow({
        activatable_widget: zoomFactorSpinBox,
        title: _(`Zoom factor`),
    });
    zoomFactorRow.add_suffix(zoomFactorSpinBox);

    const generalGroup = new Adw.PreferencesGroup({
        title: _(`General`, `General options`),
    });
    generalGroup.add(zoomFactorRow);

    const scrollToZoomSwitch = new Gtk.Switch({
        valign: Gtk.Align.CENTER,
    });
    window._preferences.bind_property(
        `scrollToZoom`,
        scrollToZoomSwitch,
        `active`,
        GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE
    );

    const scrollToZoomRow = new Adw.ActionRow({
        activatable_widget: scrollToZoomSwitch,
        title: _(`Use scroll gesture to zoom desktop`),
    });
    scrollToZoomRow.add_suffix(scrollToZoomSwitch);

    const scrollToZoomModifierKeysDropDown = new Gtk.DropDown({
        model: Gtk.StringList.new([
            `Super + Ctrl`,
            `Super + Alt`,
            `Super + Shift`,
        ]),
        valign: Gtk.Align.CENTER,
    });
    window._preferences.bind_property(
        `scrollToZoomModifierKeys`,
        scrollToZoomModifierKeysDropDown,
        `selected`,
        GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE
    );

    const scrollToZoomModifierKeysRow = new Adw.ActionRow({
        activatable_widget: scrollToZoomModifierKeysDropDown,
        title: _(`Modifier keys for scroll gesture`),
    });
    scrollToZoomModifierKeysRow.add_suffix(scrollToZoomModifierKeysDropDown);

    const scrollToZoomGroup = new Adw.PreferencesGroup({
        title: _(`Scroll To Zoom`),
        visible: GLib.getenv(`XDG_SESSION_TYPE`) === `wayland`,
    });
    scrollToZoomGroup.add(scrollToZoomRow);
    scrollToZoomGroup.add(scrollToZoomModifierKeysRow);

    const keybindingGroup = new Adw.PreferencesGroup({
        title: _(`Keyboard Shortcuts`),
    });
    keybindingGroup.add(new ShortcutRow(
        _(`Zoom in`),
        window._preferences,
        `zoomInShortcut`
    ));
    keybindingGroup.add(new ShortcutRow(
        _(`Zoom out`),
        window._preferences,
        `zoomOutShortcut`
    ));

    const page = new Adw.PreferencesPage();
    page.add(generalGroup);
    page.add(scrollToZoomGroup);
    page.add(keybindingGroup);

    window.add(page);
};
