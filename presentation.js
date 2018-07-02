define(function(require, exports, module) {
    main.consumes = [
        "ace.status", "layout", "menus", "Plugin", "settings", "tree", "ui"
    ];
    main.provides = ["harvard.cs50.presentation"];
    return main;

    function main(options, imports, register) {
        var layout = imports.layout;
        var menus = imports.menus;
        var Plugin = imports.Plugin;
        var settings = imports.settings;
        var status = imports["ace.status"];
        var ui = imports.ui;

        var plugin = new Plugin("CS50", main.consumes);

        var presenting;
        var menuItem = null;
        var barExtras = null;

        const listeners = [];

        /**
         * Registers listener to be called when presentation mode is toggled.
         * Listener is passed true or false when presentation is toggled on or
         * off respectively. If presenting is initialized, listener is called
         * immediately. Otherwise, listener is called once presenting is
         * initialized.
         */
        function addListener(listener) {

            // ensure listener is a fuction and listener is registered at most once
            if (typeof(listener) !== "function" || listeners.indexOf(listener) > -1)
                return;

            // register listener
            listeners.push(listener);

            // call listener if presenting was initialized
            if (presenting !== undefined)
                listener(presenting);
        }


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
         * Toggles visibility of elements that are shown or hidden as
         * presentation is toggled.
         *
         * @param {boolean} show whether to show or hide elements
         */
        function toggleElements(show) {
            if (typeof show !== "boolean")
                return;

            if (show) {
                // show status bar
                status.show();

                // show elements hidden from menu bar
                barExtras.$ext.classList.remove("cs50-presentation");
            }
            else {
                // hide status bar
                status.hide();

                // hide particular elements from menu bar
                barExtras.$ext.classList.add("cs50-presentation");
            }
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

                    // show components that were hidden on presenting
                    toggleElements(true);
                }

                if (override === presenting)
                    return;

                presenting = override;
            }
            else {
                presenting = !presenting;
                settings.set("user/cs50/presentation/@presenting", presenting);
                updateEditors();
            }

            // hide components that should be hidden on presenting
            toggleElements(!presenting);

            // sync menu item
            menuItem.setAttribute("checked", presenting);

            // notify registered listeners
            listeners.forEach(listener => listener(presenting));
        }

        /**
         * Toggles presentation on or off for ace and terminal.
         */
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

            // divider after "View/Less Comfortable"
            menus.addItemByPath("View/~", new ui.divider(), 1, plugin);
            menus.addItemByPath("View/Presentation Mode", menuItem, 2, plugin);

            // find stats button
            barExtras = layout.findParent({ name: "preferences" });

            // default settings
            settings.on("read", function() {
                settings.setDefaults("user/cs50/presentation", [
                    ["presenting", false],
                    ["editorFontSize", 18],
                    ["terminalFontSize", 18]
                ]);
            });

            settings.on("write", function() {
                if (settings.getBool("user/cs50/presentation/@presenting") !== presenting)
                    menus.click("View/Presentation Mode");
            });

            ui.insertCss(require("text!./style.css"), options.staticPrefix, plugin);

            togglePresentationMode(
                settings.getBool("user/cs50/presentation/@presenting")
            );
        });

        plugin.on("unload", function() {
            togglePresentationMode(false);
            menuItem = null;
            barExtras = null;
            presenting = undefined;
        });

        plugin.freezePublicAPI({

            /**
             * @property presenting whether presentation is on
             * @readonly
             */
            get presenting() { return presenting; },
            addListener: addListener
        });

        register(null, {
            "harvard.cs50.presentation": plugin
        });
    }
});
