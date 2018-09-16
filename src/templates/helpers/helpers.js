module.exports.register = function (Handlebars, options)  {
	Handlebars.registerHelper('list', function(context, options) {
        var ret = "<ul class='nav_main'>";
        for(var i=0, j=context.length; i<j; i++) {
            ret = ret + "<li>" + options.fn(context[i]).replace(/\n/g, "<br />") + "</li>";
        }
        return ret + "</ul>";
    });
};
