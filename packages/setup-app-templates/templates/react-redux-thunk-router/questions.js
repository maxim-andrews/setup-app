const c = require('chalk');

exports = module.exports = [{
  type: 'checkbox',
  name: 'reactOptions',
  message: 'Please, select modules you would like to use(optional)\n',
  choices: [{
    name: 'Redux',
    value: 'REDUX'
  }, {
    name: 'Router',
    value: 'ROUTER'
  }],
  when: true
}, {
  type: 'confirm',
  name: 'THUNK',
  message: `Would you like to use ${ c.cyan('thunk') } with ${ c.cyan('redux') }?`,
  default: false,
  when: answers => answers.reactOptions.includes('REDUX')
}, {
  type: 'checkbox',
  name: 'prestyles',
  message: 'Please, select CSS preprocessors you would like to use (optional)\n',
  choices: [{
    name: 'PostCSS Preset Env',
    value: 'POSTCSS'
  }, {
    name: 'SASS',
    value: 'SASS'
  }, {
    name: 'LESS',
    value: 'LESS'
  }]
}, {
  type: 'checkbox',
  name: 'renderings',
  message: 'Please, select the rendering type(s) you would like to have (at least one)\n',
  choices: [{
    name: 'Client Side Rendering',
    value: 'CSR',
    checked: true
  }, {
    name: 'Server Side Rendering',
    value: 'SSR'
  }],
  validate: input =>
    input.length !== 0
    || 'You must select at least one rendering type. Please, make your choice.'
}, {
  type: 'confirm',
  name: 'BACKEND',
  message: `Would you like to have Koa.js backend?`,
  default: true
}];
