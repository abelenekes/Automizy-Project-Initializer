window.AutomizyGlobalPlugins = window.AutomizyGlobalPlugins || {i:0};
window.AutomizyGlobalZIndex = window.AutomizyGlobalZIndex || 2000;
window.AutomizyProject = function(obj){
	
    
    var $API = this;

    $API.version = '0.1.1';
    $API.elements = {};
    $API.dialogs = {};
    $API.inputs = {};
    $API.buttons = {};
    $API.forms = {};
    $API.functions = {};
    $API.modules = {};
    $API.xhr = {};
    $API.config = {
        dir:'.',
        url:'https://app.automizy.com'
    };
    $API.m = {};
    $API.d = {};
    $API.initializer = {};

    if(typeof obj.variables !== 'undefined'){
        for(var i in obj.variables){
            $API[i] = obj.variables[i];
        }
    }
    $API.initializer.plugins = obj.plugins || [];


    $API.pluginLoader = new function () {
        var t = this;
        t.d = {
            plugins: [],
            loadedPluginsCount: 0,
            allPluginsCount:0,
            globalPluginsCount:0,
            loadedGlobalPluginsCount:0,
            completeFunctionReady:true,
            completeFunctions: []
        };

        t.addPlugin = function (plugin) {
            return this.addPlugins([plugin]);
        };

        t.plugins = t.addPlugins = function (plugins) {
            var t = this;
            if (typeof plugins !== 'undefined') {

                for (var i = 0; i < plugins.length; i++) {
                    var plugin = plugins[i];
                    plugin.skipCondition = plugin.skipCondition || false;
                    plugin.complete = plugin.complete || function () {};
                    plugin.css = plugin.css || [];
                    plugin.js = plugin.js || [];
                    plugin.name = plugin.name || ('automizy-plugin-' + ++AutomizyGlobalPlugins.i);

                    if (typeof plugin.css === 'string') {
                        plugin.css = [plugin.css];
                    }
                    if (typeof plugin.js === 'string') {
                        plugin.js = [plugin.js];
                    }
                    t.d.plugins.push(plugin);
                }

                return t;
            }
            return t.d.plugins;
        };

        t.pluginThen = function(plugin) {
            var t = this;

            t.d.loadedPluginsCount++;
            for(var i = 0; i < plugin.completeFunctions.length; i++){
                plugin.completeFunctions[i].apply(plugin, [true]);
                plugin.completed = true;
            }
            console.log(plugin.name + ' loaded in AutomizyProjectInitializer (' + t.d.loadedPluginsCount + '/' + t.d.allPluginsCount + ')');
            if (t.d.loadedPluginsCount === t.d.allPluginsCount && t.d.globalPluginsCount === t.d.loadedGlobalPluginsCount && t.d.completeFunctionReady) {
                t.d.completeFunctionReady = false;
                t.complete();
            }

            return t;
        };

        t.run = function () {
            var t = this;

            var hasActivePlugin = false;
            var noJsPlugins = [];

            t.d.allPluginsCount = 0;
            t.d.loadedPluginsCount = 0;

            for (var i = 0; i < t.d.plugins.length; i++) {
                var pluginLocal = t.d.plugins[i];
                if (pluginLocal.inited) {
                    continue;
                }
                pluginLocal.inited = true;

                if(typeof AutomizyGlobalPlugins[pluginLocal.name] === 'undefined'){
                    AutomizyGlobalPlugins[pluginLocal.name] = {
                        name:pluginLocal.name,
                        skipCondition:pluginLocal.skipCondition,
                        css:pluginLocal.css,
                        js:pluginLocal.js,
                        xhr:false,
                        completed:false,
                        completeFunctions:[pluginLocal.complete]
                    }
                }else{
                    AutomizyGlobalPlugins[pluginLocal.name].completeFunctions.push(pluginLocal.complete);
                    if(AutomizyGlobalPlugins[pluginLocal.name].completed){
                        pluginLocal.complete.apply(pluginLocal, [false]);
                    }else {
                        hasActivePlugin = true;
                        t.d.globalPluginsCount++;
                        AutomizyGlobalPlugins[pluginLocal.name].xhr.always(function(){
                            t.d.loadedGlobalPluginsCount++;
                            if (t.d.loadedPluginsCount === t.d.allPluginsCount && t.d.globalPluginsCount === t.d.loadedGlobalPluginsCount && t.d.completeFunctionReady) {
                                t.d.completeFunctionReady = false;
                                t.complete();
                            }
                        })
                    }
                    continue;
                }

                var plugin = AutomizyGlobalPlugins[pluginLocal.name];

                if (plugin.skipCondition) {
                    plugin.completed = true;
                    plugin.completeFunctions[0].apply(plugin, [false]);
                    continue;
                }

                for (var j = 0; j < plugin.css.length; j++) {
                    var head = document.getElementsByTagName('head')[0];
                    var link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.type = 'text/css';
                    link.href = plugin.css[j];
                    head.appendChild(link);
                }

                hasActivePlugin = true;
                (function (plugin) {
                    var deferreds = [];

                    t.d.allPluginsCount++;
                    if (plugin.js.length <= 0) {
                        noJsPlugins.push(plugin);
                    } else {
                        for (var j = 0; j < plugin.js.length; j++) {
                            deferreds.push($.getScript(plugin.js[j]));
                        }
                        plugin.xhr = $.when.apply(null, deferreds).always(function(){
                            t.pluginThen(plugin);
                        });
                    }
                })(plugin);

            }

            for(var i = 0; i < noJsPlugins.length; i++){
                t.pluginThen(noJsPlugins[i]);
            }

            if (!hasActivePlugin) {
                t.complete();
            }

            return t;
        };

        t.complete = function (complete) {
            var t = this;

            if (typeof complete === 'function') {
                t.d.completeFunctionReady = true;
                t.d.completeFunctions.push({
                    inited: false,
                    func: complete
                });
                return t;
            }

            var arrLength = t.d.completeFunctions.length;
            for (var i = 0; i < arrLength; i++) {
                if (t.d.completeFunctions[i].inited) {
                    continue;
                }
                t.d.completeFunctions[i].inited = true;
                t.d.completeFunctions[i].func.apply(t, []);
            }

            return t;
        };

    };




    $API.runTheFunctions = function(functions, thisParameter, parameters){
        var functions = functions || [];
        var thisParameter = thisParameter || this;
        var parameters = parameters || [];
        for(var i = 0; i < functions.length; i++) {
            functions[i].apply(thisParameter, parameters);
        }
    };



    $API.functions.pluginsLoadedFunctions = [];
    $API.pluginsLoaded = function(f){
        var t = this;
        if(typeof f === 'function'){
            t.functions.pluginsLoadedFunctions.push(f);
            if(t.automizyPluginsLoaded){
                f.apply(t, []);
            }
            return t;
        }
        t.runTheFunctions(t.functions.pluginsLoadedFunctions, t, []);
        t.automizyPluginsLoaded = true;
        return t;
    };


    $API.loadPlugins = function () {
        var t = this;

        if (typeof window.jQuery === 'undefined') {
            var script = document.createElement("SCRIPT");
            script.src = t.config.dir + "/vendor/jquery/jquery.min.js";
            script.type = 'text/javascript';
            document.getElementsByTagName("head")[0].appendChild(script);
        }
        var checkReady = function (callback) {
            if (typeof window.jQuery === 'function') {
                callback(jQuery);
            } else {
                window.setTimeout(function () {
                    checkReady(callback);
                }, 100);
            }
        };

        checkReady(function ($) {
            if (t.initializer.plugins.length > 0) {
                t.pluginLoader.plugins(t.initializer.plugins).complete(function () {
                    t.pluginsLoaded();
                }).run();
            } else {
                t.pluginsLoaded();
            }
        });

    };

    $API.init = function () {
        var t = this;

        if(typeof t.automizyInited === 'undefined'){
            t.automizyInited = false;
        }

        if(!t.automizyInited){
            t.automizyInited = true;
            t.loadPlugins();
        }

        return t;
    };

    $API.baseDir = function(value){
        var t = this;
        if (typeof value !== 'undefined') {
            t.config.dir = value;
            return t;
        }
        return t.config.dir;
    };


    $API.functions.readyFunctions = [];
    $API.ready = function(f){
        var t = this;
        if(typeof f === 'function') {
            t.functions.readyFunctions.push(f);
            if(t.automizyReady){
                f.apply(t, []);
            }
            return t;
        }
        t.runTheFunctions(t.functions.readyFunctions);
        t.automizyReady = true;
        return t;
    };


    $API.functions.layoutReadyFunctions = [];
    $API.layoutReady = function(f){
        var t = this;
        if(typeof f === 'function') {
            t.functions.layoutReadyFunctions.push(f);
            if(t.automizyLayoutReady){
                f.apply(t, []);
            }
            return t;
        }
        t.runTheFunctions(t.functions.layoutReadyFunctions);
        t.automizyLayoutReady = true;
        return t;
    };


    $API.id = function(id){
        if (typeof id !== 'undefined') {
            this.d.id = id;
            return this;
        }
        return this.d.id;
    };

    console.log('%c AutomizyProjectInitializer loaded! ', 'background: #000000; color: #bada55; font-size:14px');

}