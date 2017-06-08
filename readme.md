## beds 开发者工具

特性：
- 支持接口代理
- 支持预编译ejs模板
- 支持less语法
- 支持js module
- 钩子函数
规定：
- 遵循commonjs规范或es6 module 规范开发模块js
- 引用的入口js必须为html内最后一个script标签。 因为模块加载器会插在最后一个Script标签之前