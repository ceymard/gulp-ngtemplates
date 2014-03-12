var Stream = require('stream');
var path = require('path');
var gutil = require('gulp-util');
var _ = require('lodash');
var cheerio = require('cheerio');
var PluginError = gutil.PluginError;
var File = gutil.File;


function compile_html (file, opts) {

  var contents = file.contents.toString('utf-8');

  var $ = cheerio.load(file.contents.toString('utf-8'), {
    normalizeWhitespace: opts.normalize_white_space
  });

  // A template document always contains a node
  // <meta ng-module="my_module" [requires="ng, ..."]>
  var module_node = $('module').first();
  var module_name = module_node.text().trim();
  var deps = [];
  var templates = [];

  if (!module_name) {
    // We consider it to be a regular html template and just create it for an 'app'
    module_name = opts.default_module_name;
    templates = [{name: file.path.replace(file.base, ''), contents: JSON.stringify(contents)}];
  } else {

    _.each($('require'), function (req) {
      var _deps = $(req).text().trim().split(',');

      _.each(_deps, function (dep) {
        if (dep)
          deps.push(dep);
      });
    });

    _.each($('template'), function (node) {
      node = $(node);
      var name = node.attr('id');

      if (!name) {
        gutil.log(gutil.colors.yellow('warning'), 'file', gutil.colors.magenta(file.path), 'has an unnamed template');
        return;
      }

      templates.push({name: name, contents: JSON.stringify(node.html())});
    });
  }

  // add ng to the dependencies by default, since we're going to need
  // at least the $templateCache service.
  if (deps.indexOf('ng') === -1)
    deps.splice(0, 0, 'ng');
  deps = "'" + deps.join('\', \'') + "'";

  var compiled_templates = [];
  _.each(templates, function (tpl) {
    compiled_templates.push(_.template('\t\t\t$tc.put("<%= name %>",\n\t\t\t\t<%= contents %>\n\t\t\t);\n\n', {
      name: tpl.name,
      contents: tpl.contents
    }));
  });

  var result = '(function (angular) {\n' +
  _.template('\tvar mod = angular.module("<%= name %>", [<%= deps %>]);\n\n', {name: module_name, deps: deps}) +
  '\tmod.run(["$templateCache", function ($tc) {\n\n' +
    compiled_templates.join('') +
  '\t}]);\n\n' +
  '})(angular);';

  return result;
};



module.exports = function(opts){
  opts = _.merge({
    default_module_name: 'app',
    normalize_white_space: false
  }, opts);

  var stream = new Stream.Transform({objectMode: true});

  stream._transform = function(file, encoding, done) {
    if (file.isNull()) { return done(); } // ignore

    // we want buffers !
    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-ngtemplates',  'Streaming not supported'));
      return done();
    }

    var compiled = compile_html(file, opts);

    newfile = new File({
      cwd: file.cwd,
      path: file.path + '.js',
      base: file.base,
      contents: new Buffer(compiled)
    });

    // console.log(newfile.cwd, newfile.path, newfile.base);
    stream.push(newfile);
    done();
  }

  return stream;
};
