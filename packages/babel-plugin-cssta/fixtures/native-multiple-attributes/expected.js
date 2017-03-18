import _createComponent from 'cssta/lib/native/createComponent';
import { StyleSheet as _StyleSheet } from 'react-native';

import { View } from 'react-native';

var _csstaStyle = _StyleSheet.create({
  0: {
    'color': 'red'
  },
  1: {
    'color': 'green'
  },
  2: {
    'color': 'blue'
  },
  3: {
    'color': 'yellow'
  }
});

_createComponent(View, ['booleanAttribute', 'stringAttribute'], {
  'importedVariables': [],
  'transitionedProperties': [],
  'keyframes': {},
  'rules': [{
    'validate': function (p) {
      return true;
    },
    'exportedVariables': {},
    'style': _csstaStyle[0]
  }, {
    'validate': function (p) {
      return !!p['booleanAttribute'];
    },
    'exportedVariables': {},
    'style': _csstaStyle[1]
  }, {
    'validate': function (p) {
      return p['stringAttribute'] === "1";
    },
    'exportedVariables': {},
    'style': _csstaStyle[2]
  }, {
    'validate': function (p) {
      return p['stringAttribute'] === "2";
    },
    'exportedVariables': {},
    'style': _csstaStyle[3]
  }]
});