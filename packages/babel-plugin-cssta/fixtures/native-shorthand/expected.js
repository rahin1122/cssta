import _staticComponent from 'cssta/dist/native/staticComponent';
import { StyleSheet as _StyleSheet } from 'react-native';

import { View } from 'react-native';

var _csstaStyle = _StyleSheet.create({
  0: {
    'fontStyle': 'italic',
    'fontWeight': 'bold',
    'fontVariant': [],
    'fontSize': 12,
    'fontFamily': 'Helvetica',
    'lineHeight': 18
  }
});

_staticComponent(View, [], [{
  'validate': function (p) {
    return true;
  },
  'transitions': {},
  'exportedVariables': {},
  'style': _csstaStyle[0]
}]);