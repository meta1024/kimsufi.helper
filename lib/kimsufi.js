;
(function($, root) {
    var models = [{"id":"160sk1","title":"KS-1"},{"id":"160sk2","title":"KS-2A"},{"id":"160sk21","title":"KS-2B"},{"id":"160sk22","title":"KS-2C"},{"id":"160sk23","title":"KS-2D"},{"id":"161sk2","title":"KS-2E"},{"id":"162sk2","title":"KS-2E 特价"},{"id":"160sk3","title":"KS-3A"},{"id":"160sk31","title":"KS-3B"},{"id":"160sk32","title":"KS-3C"},{"id":"162sk32","title":"KS-3C 特价"},{"id":"160sk4","title":"KS-4A"},{"id":"160sk41","title":"KS-4B"},{"id":"160sk42","title":"KS-4C"},{"id":"162sk42","title":"KS-4C 特价"},{"id":"160sk5","title":"KS-5"},{"id":"160sk6","title":"KS-6"}];

    var filters = {
        'default': function(id , callback) {
            var url = 'https://www.kimsufi.com/en/order/kimsufi.cgi?hard=' + id;
            $.ajax({
                url: url,
                success: function(resp) {
                    callback && callback(resp.indexOf('icon-availability') >= 0)

                },
                error: function() {
                    callback && callback(false);
                }
            })
        }
    }
    var utils = {
        s2t: function(v) {
            v = Math.floor(v / 1000);
            var h = utils.zero(Math.floor(v / 3600)),
                m = utils.zero(Math.floor((v - h * 3600) / 60)),
                s = utils.zero(v % 60);
            return [h, m, s].join(":");
        },
        zero: function(v) {
            return (v < 10 ? "0" : "") + v
        },
        copy: function(v) {
            var obj = {}
            for (var i in v) {
                obj[i] = v[i];
            }
            return obj;
        }

    }

    function kimsufi() {
        this.handlers = {};
        this.models = [];
        this.tick = 5000;
        this.process();
        this.filter = filters['default'];
        this.models_hash = {};
        for (var i = 0, l = models.length; i < l; i++) {
            this.models_hash[models[i].id] = models[i];
        }
    }

    kimsufi.prototype.add = function(m) {
        if (typeof(m) == 'string') m = [m];

        for (var i = 0, l = m.length; i < l; i++) {
            if (this.find(m[i])) {
                alert('已存在');
            } else {
                var hit = this.models_hash[m[i]];
                if (hit) {
                    var model = {
                        "id": hit.id,
                        "title": hit.title,
                        "status": 'loading',
                        "status_str": 'loading',
                        "start_time": new Date().getTime(),
                        "last_time": new Date().getTime(),
                        "timer": null
                    }

                    this.models.push(model);
                    this.check(model.id);
                    this.fire('add', model);
                }
            }

        }

        return this;
    }

    kimsufi.prototype.remove = function(id) {
        var index = this.find(id, true);
        if (index != -1) {
            var model = this.models[index];
            if (model.timer) window.clearTimeout(model.timer);
            this.models.splice(index, 1);
            this.fire('remove', utils.copy(model));
        }

    }

    kimsufi.prototype.find = function(id, index) {
        for (var i = 0, l = this.models.length; i < l; i++) {
            if (this.models[i].id == id) {
                return index ? i : this.models[i];
            }
        }
        return index ? -1 : null;
    }

    kimsufi.prototype.process = function() {
        var local = this;
        if (this.models) {
            this.fire('update', this.getStatus());
        }

        window.setTimeout(function() {
            local.process();
        }, 1000);
    }

    kimsufi.prototype.check = function(id) {
        var local = this;

        if(this.filter){
            this.filter(id , function(status){
                local.setStatus(id , status);
            })
        }
        
    }

    kimsufi.prototype.getStatus = function(id) {
        var models = id ? [this.find(id)] : this.models;
        for (var i = 0, l = models.length; i < l; i++) {
            models[i].uptime = Math.round((new Date().getTime() - models[i].last_time) / 1000);
            models[i].status_str = models[i].status == 'loading' ? 'loading' : (models[i].status ? '有货' : '缺货');

        }

        return this.models;
    }

    kimsufi.prototype.setStatus = function(id, status) {
        var model = this.find(id),
            local = this;
        if (model) {
            var last_status = model.status;
            model.status = status;
            model.last_time = new Date().getTime();
            model.timer = setTimeout(function() {
                local.check(id);
            }, this.tick);
            this.fire('update', this.getStatus());

            if( model.status/* && last_status !== true*/){
                this.fire('hit', model);
            }
        }
    }

    kimsufi.prototype.setFilter = function(f){
        if(typeof(f) == 'string' && filters[f]){
            this.filter = filters[f];
        }
        else if(typeof(f) == 'function'){
            this.filter = f;
        }
    }

    kimsufi.prototype.setTick = function(v) {
        this.tick = parseInt(v);
    }

    kimsufi.prototype.getModels = function() {
        var ret = [];
        for (var i = 0; i < this.models.length; i++) {
            ret.push(this.models[i].id);
        }
        return ret;
    }

    kimsufi.prototype.on = function(evt, callback) {
        if (!this.handlers[evt]) this.handlers[evt] = [];
        this.handlers[evt].push(callback);
        return this;
    }

    kimsufi.prototype.fire = function(evt, data) {
        if (this.handlers[evt]) {
            var handlers = this.handlers[evt];

            for (var i = 0; i < handlers.length; i++) {
                handlers[i].call(this, data);
            }

        }
    }

    root.kimsufi = function() {
        return new kimsufi();
    }

    root.kimsufi.models = models;

    root.kimsufi.getOrderUrl = function(id) {
        return 'https://www.kimsufi.com/en/order/kimsufi.cgi?hard=' + id;
    }

    //用于注册第三方检测方式
    root.kimsufi.register = function(name , filter){
        if(name && name != 'default' ){
            filters[name] = filter;
        }
    }
}(jQuery, this));
