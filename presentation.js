define(function(require, exports, module) {
    main.consumes = [
        "ace.status", "c9.ide.cs50.theme", "layout", "menus", "panels",
        "Plugin", "preferences", "settings", "tree", "ui"
    ];
    main.provides = ["c9.ide.cs50.presentation"];
    return main;

    function main(options, imports, register) {
        var layout = imports.layout;
        var menus = imports.menus;
        var panels = imports.panels;
        var Plugin = imports.Plugin;
        var prefs = imports.preferences;
        var settings = imports.settings;
        var status = imports["ace.status"];
        var theme = imports["c9.ide.cs50.theme"];
        var ui = imports.ui;

        var plugin = new Plugin("CS50", main.consumes);

        var presenting = false;
        var menuItem = null;

        /**
         * swaps values of settings at path1 and path2. setting values are
         * assumed to be numeric.
         *
         * @param {string} path1 path of first setting
         * @param {string} path2 path of second setting
         */
        function swapSettings(path1, path2) {
            var val = settings.getNumber(path2);
            settings.set(path2, settings.getNumber(path1));
            settings.set(path1, val);
        }

        /**
         * Shows/hides components (e.g., tree, status bar, etc).
         *
         * @param {boolean} show show/hide flag.
         */
        function showComponents(show) {
            if (typeof show !== "boolean")
                return;

            if (show) {
                panels.activate("tree");
                status.show();
                // show avatar
                ui.setStyleRule(".btnName", "display", "initial");
            }
            else {
                panels.deactivate("tree");
                status.hide();
                // hide avatar
                ui.setStyleRule(".btnName", "display", "none !important");
            }

           theme.showButton(show);
        }

        /**
         * toggles presentation mode on or off.
         *
         * @param {boolean} [override] ideally used when loading/unloading to
         * force toggle presentation mode on/off without saving settings.
         */
        function togglePresentationMode(override) {
            if (typeof override === "boolean") {
                // handle unloading when presentation is on
                if (!override && presenting) {
                    // toggle off presentation mode for ace and terminal
                    updateEditors();

                    showComponents(true);
                }
                if (override == presenting) {
                    return;
                }
                presenting = override;
            }
            else {
                presenting = !presenting;
                settings.set("user/cs50/presentation/@presenting", presenting);
                updateEditors();
            }

            // hide components (e.g., tree) in presentation only
            showComponents(!presenting);

            // ensure menu item is in sync with the current mode
            menuItem.checked = presenting;
        }

        function updateEditors() {
            swapSettings(
                "user/cs50/presentation/@editorFontSize",
                "user/ace/@fontSize"
            );
            swapSettings(
                "user/cs50/presentation/@terminalFontSize",
                "user/terminal/@fontsize"
            );
        }

        plugin.on("load", function() {
            // add menu item to View menu
            menuItem = new ui.item({
                type: "check",
                caption: "Presentation Mode",
                onclick: togglePresentationMode
            });

            menus.addItemByPath(
                "View/PresentationDiv", new ui.divider(), 1, plugin
            );
            menus.addItemByPath("View/Presentation Mode", menuItem, 2, plugin);

            // default settings
            settings.on("read", function() {
                settings.setDefaults("user/cs50/presentation", [
                    ["presenting", false],
                    ["editorFontSize", 18],
                    ["terminalFontSize", 18]
                ]);
            });

            settings.on("write", function() {
                if (settings.getBool("user/cs50/presentation/@presenting") !== presenting) {
                    menus.click("View/Presentation Mode");
                }
            });

            // add toggle button to preferences
            prefs.add({
               "CS50" : {
                    position: 25,
                    "Presentation Mode" : {
                        position: 10,
                        "Presentation Mode" : {
                            type: "checkbox",
                            setting: "user/cs50/presentation/@presenting",
                            position: 200
                        }
                    }
                }
            }, plugin);

            togglePresentationMode(
                settings.getBool("user/cs50/presentation/@presenting")
            );
        });

        plugin.on("unload", function() {
            togglePresentationMode(false);
            menuItem = null;
            presenting = false;
        });

        register(null, {
            "c9.ide.cs50.presentation": plugin
        });
    }
});
