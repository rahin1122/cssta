/* eslint-disable no-param-reassign */
const t = require('babel-types');
const _ = require('lodash/fp');
const transformWebCssta = require('./converters/web');
const transformNativeCssta = require('./converters/native');

const transformCsstaTypes = {
  web: transformWebCssta,
  native: transformNativeCssta,
};

const canInterpolate = {
  web: false,
  native: true,
};

const csstaConstructorExpressionTypes = {
  CallExpression: element => [element.callee, element.arguments[0]],
  MemberExpression: element => [
    element.object,
    element.computed ? element.property : t.stringLiteral(element.property.name),
  ],
};

const transformCsstaCall = (element, state, node, stringArg) => {
  if (!(node.type in csstaConstructorExpressionTypes)) return;

  const [callee, component] = csstaConstructorExpressionTypes[node.type](node);

  if (!t.isIdentifier(callee)) return;

  const filename = state.file.opts.filename;
  const reference = callee.name;
  const csstaType = _.get([filename, reference], state.csstaReferenceTypesPerFile);

  if (!csstaType) return;

  const interpolateValuesOnly = _.includes(
    'interpolateValuesOnly',
    _.get(['opts', 'optimisations'], state)
  );

  const hasInterpolation = t.isTemplateLiteral(stringArg) && !_.isEmpty(stringArg.expressions);

  if (hasInterpolation && !canInterpolate[csstaType]) {
    const ex = '`color: ${primary}`'; // eslint-disable-line
    throw new Error(`You cannot interpolation in template strings for ${csstaType} (i.e. ${ex})`);
  }

  let cssText = null;
  let substitutionMap = {};

  if (t.isTemplateLiteral(stringArg) && (!hasInterpolation || interpolateValuesOnly)) {
    const { quasis, expressions } = stringArg;
    const substitutionNames = expressions.map((value, index) => `__substitution-${index}__`);
    cssText =
      quasis[0].value.cooked +
      substitutionNames.map((name, index) => name + quasis[index + 1].value.cooked).join('');
    substitutionMap = _.fromPairs(_.zip(substitutionNames, expressions));
  } else if (t.isStringLiteral(stringArg)) {
    cssText = stringArg.value;
  }

  if (cssText !== null) {
    transformCsstaTypes[csstaType](element, state, cssText, substitutionMap, component);
  } else {
    state.requiredCsstaRefernceImportsPerFile = _.update(
      [filename],
      _.union([reference]),
      state.requiredCsstaRefernceImportsPerFile || {}
    );
  }
};

const externalReferencesToRecord = {
  'react-native': ['StyleSheet'],
  'css-to-react-native': ['default'],
  'cssta/lib/web/createComponent': ['default'],
  'cssta/lib/native/createComponent': ['default'],
};

const csstaModules = {
  cssta: 'web',
  'cssta/web': 'web',
  'cssta/native': 'native',
};

module.exports = () => ({
  visitor: {
    ImportDeclaration(element, state) {
      const moduleName = element.node.source.value;
      const specifiers = element.node.specifiers;

      const filename = state.file.opts.filename;

      if (moduleName in externalReferencesToRecord) {
        const referencesToRecord = externalReferencesToRecord[moduleName];

        _.forEach((specifier) => {
          let importedName;
          if (t.isImportSpecifier(specifier)) {
            importedName = specifier.imported.name;
          } else if (t.isImportDefaultSpecifier(specifier)) {
            importedName = 'default';
          }

          if (importedName && _.includes(importedName, referencesToRecord)) {
            state.externalReferencesPerFile = _.set(
              [filename, moduleName, importedName],
              specifier.local,
              state.externalReferencesPerFile
            );
          }
        }, specifiers);

        return;
      }

      const csstaType = csstaModules[moduleName];
      if (!csstaType) return;

      const defaultSpecifiers = [].concat(
        _.filter({ type: 'ImportDefaultSpecifier' }, specifiers),
        _.filter({ type: 'ImportSpecifier', imported: { name: 'default' } }, specifiers)
      );
      if (_.isEmpty(defaultSpecifiers)) return;

      const specifierReferenceTypes = _.flow(
        _.map('local.name'),
        _.map(reference => [reference, csstaType]),
        _.fromPairs
      )(defaultSpecifiers);

      state.csstaReferenceTypesPerFile = _.update(
        [filename],
        _.assign(specifierReferenceTypes),
        state.csstaReferenceTypesPerFile || {}
      );

      const specifierReferenceImports = _.mapValues(_.constant(element), specifierReferenceTypes);

      state.csstaReferenceImportsPerFile = _.update(
        [filename],
        _.assign(specifierReferenceImports),
        state.csstaReferenceImportsPerFile || {}
      );
    },
    Program: {
      exit(element, state) {
        const filename = state.file.opts.filename;
        const imports = _.getOr({}, [filename], state.csstaReferenceImportsPerFile);

        const allImports = _.uniq(_.values(imports));
        const requiredImports = _.flow(
          _.getOr([], ['requiredCsstaRefernceImportsPerFile', filename]),
          _.map(_.propertyOf(imports))
        )(state);

        const importsToRemove = _.without(requiredImports, allImports);

        _.forEach((importElement) => {
          importElement.remove();
        }, importsToRemove);
      },
    },
    CallExpression(element, state) {
      const { node } = element;
      const { callee } = node;
      const [stringArg] = node.arguments;
      if (!t.isTemplateLiteral(stringArg) && !t.isStringLiteral(stringArg)) return;
      transformCsstaCall(element, state, callee, stringArg);
    },
    TaggedTemplateExpression(element, state) {
      const { quasi, tag } = element.node;
      transformCsstaCall(element, state, tag, quasi);
    },
  },
});

module.exports.resetGenerators = transformWebCssta.resetGenerators;