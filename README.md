gulp-ngtemplates
================

This plugins allows you to bundle templates directly in your application using the `$templateCache` service.

Install it with `npm install --save-dev gulp-ngtemplates`

Unlike some of the other plugins, your template files are to be assembled into their own modules
that your other modules have to require instead of registering them to your main application.

Since the approach is a little more declarative, you can also declare several templates in a single file.

Note that it will append '.js' to the generated file instead of replacing the extension to avoid conflicts
with similarly named files.

Example :

```javascript
var ngtemplates = require('gulp-ngtemplates');

gulp.task('compile-templates', function () {
    return gulp.src('../src/**/*.html')
        .pipe(ngtemplates())
        .pipe(gulp.dest('./build/'));
});
```

Format of a template
====================

Declaring a module name is done with a `<module></module>` name. You may require any other module with `<require></require>`. Commas are supported in require nodes.

Declaring a template is done with the `<template id="template-name"></template>` node.

```html
<module>mywidget.templates</module>
<require>mywidget.templates.somethingelse</require>

<template id='mywidget-templates-something'>
    <h1>Your imagination is the limit !</h1>
</template>

<template id='mywidget-templates-anotherone'>
    ...
</template>
```

You can then use this module like so :

```javascript
var module = angular.module('mywidget', [
    'mywidget.templates'
]);

module.run(['$templateCache', function ($tc) {
    // load the template
    var tpl = $tc.get('mywidget-templates-something');
}]);
```

Consider using this module alongside `gulp-ngcompile` since they were made together.
