module.exports = {
  Platform: {
    OS: 'web',
    select: (obj) => obj.default || obj.web
  },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style
  },
  Dimensions: {
    get: () => ({ width: 0, height: 0 })
  },
  Alert: {
    alert: () => {}
  },
  Animated: {},
  View: {},
  Text: {},
  Image: {},
  ScrollView: {},
  TouchableOpacity: {},
  TextInput: {}
};
